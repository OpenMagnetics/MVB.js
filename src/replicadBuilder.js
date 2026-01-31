/**
 * OpenMagnetics Virtual Builder - Replicad Implementation
 * 
 * Browser-compatible 3D geometry builder using Replicad/OpenCASCADE.js.
 * This is a JavaScript port of cadquery_builder.py.
 */

import {
  WireType,
  ColumnShape,
  WireDescription,
  TurnDescription,
  BobbinProcessedDescription,
  flattenDimensions,
  convertAxis
} from './types.js';

import { getCore, getSupportedFamilies } from './coreShapes.js';

// ==========================================================================
// Global Configuration
// ==========================================================================

let TESSELLATION_SEGMENTS_PER_CIRCLE = 8;
let TESSELLATION_LINEAR_TOLERANCE = 1.0;

/**
 * Get angular tolerance in radians based on segments per circle.
 * @returns {number}
 */
export function getAngularTolerance() {
  return (2 * Math.PI) / TESSELLATION_SEGMENTS_PER_CIRCLE;
}

/**
 * Configure tessellation quality for mesh export.
 * @param {number} segmentsPerCircle - Segments per full circle (default: 20)
 * @param {number} linearTolerance - Maximum chord deviation in mm (default: 0.1)
 */
export function setTessellationQuality(segmentsPerCircle = 20, linearTolerance = 0.1) {
  TESSELLATION_SEGMENTS_PER_CIRCLE = segmentsPerCircle;
  TESSELLATION_LINEAR_TOLERANCE = linearTolerance;
}

// ==========================================================================
// ReplicadBuilder Class
// ==========================================================================

/**
 * Builder for 3D magnetic component geometry using Replicad.
 * 
 * Coordinate System (MAS to Replicad mapping):
 * - For concentric cores (E, PQ, RM, etc.):
 *   - X axis: Core depth direction (perpendicular to winding window)
 *   - Y axis: Core width direction (radial, distance from central column)
 *   - Z axis: Core height direction (along core axis, vertical)
 * 
 * - For toroidal cores:
 *   - Y axis: Core axis (toroid revolves around Y)
 *   - X axis: Radial direction (negative X = inside the donut hole)
 *   - Z axis: Tangential direction (along circumference at Y=0)
 * 
 * Units:
 * - All MAS input values are in meters
 * - Internal geometry is built in millimeters for precision
 * - Output is scaled back to meters before export
 */
export class ReplicadBuilder {
  /**
   * Scale factor: build geometry in mm, scale back to meters for output.
   */
  static SCALE = 1000.0;

  /**
   * @param {Object} replicad - The replicad module (passed after initialization)
   */
  constructor(replicad) {
    this.r = replicad;
    this.SCALE = ReplicadBuilder.SCALE;
  }

  /**
   * Create a single turn geometry.
   * @param {TurnDescription} turnDescription - Turn parameters
   * @param {WireDescription} wireDescription - Wire parameters
   * @param {BobbinProcessedDescription} bobbinDescription - Bobbin parameters
   * @param {boolean} isToroidal - If true, create toroidal turn
   * @returns {Object} - Replicad shape
   */
  getTurn(turnDescription, wireDescription, bobbinDescription, isToroidal = false) {
    if (isToroidal || bobbinDescription.windingWindowAngle !== null) {
      return this._createToroidalTurn(turnDescription, wireDescription, bobbinDescription);
    } else {
      return this._createConcentricTurn(turnDescription, wireDescription, bobbinDescription);
    }
  }

  /**
   * Create a concentric turn (for E-cores, PQ, RM, etc.).
   * @private
   */
  _createConcentricTurn(turnDescription, wireDescription, bobbinDescription) {
    const { makeCylinder, makeCompound } = this.r;
    const SCALE = this.SCALE;

    // Get wire dimensions
    const isRectangularWire = wireDescription.wireType === WireType.RECTANGULAR;
    let wireWidth, wireHeight, wireRadius;
    
    if (isRectangularWire) {
      if (turnDescription.dimensions && turnDescription.dimensions.length >= 2) {
        wireWidth = turnDescription.dimensions[0] * SCALE;
        wireHeight = turnDescription.dimensions[1] * SCALE;
      } else {
        wireWidth = (wireDescription.outerWidth || wireDescription.conductingWidth || 0.001) * SCALE;
        wireHeight = (wireDescription.outerHeight || wireDescription.conductingHeight || 0.001) * SCALE;
      }
      wireRadius = Math.min(wireWidth, wireHeight) / 2.0;
    } else {
      const wireDiameter = (wireDescription.outerDiameter || wireDescription.conductingDiameter || 0.001) * SCALE;
      wireRadius = wireDiameter / 2.0;
      wireWidth = wireDiameter;
      wireHeight = wireDiameter;
    }

    // Get bobbin/column dimensions
    const halfColDepth = bobbinDescription.columnDepth * SCALE;
    const halfColWidth = bobbinDescription.columnWidth * SCALE;

    // Get turn position from coordinates
    const coords = turnDescription.coordinates;
    const radialPos = coords.length > 0 ? coords[0] * SCALE : (halfColWidth + wireRadius);
    const heightPos = coords.length > 1 ? coords[1] * SCALE : 0;

    // Corner radius
    let turnTurnRadius = radialPos - halfColWidth;
    if (turnTurnRadius < wireRadius) {
      turnTurnRadius = wireRadius;
    }

    let turn;

    if (bobbinDescription.columnShape === ColumnShape.ROUND) {
      // Round column: circular turn path
      const turnRadius = radialPos;

      if (isRectangularWire) {
        // For rectangular wire on round column, we use a simplified approach:
        // Create a torus-like shape using revolution of a rectangle
        // For now, approximate with torus (will be refined in future)
        console.warn('Rectangular wire on round column: using approximate geometry');
        const effectiveRadius = Math.min(wireWidth, wireHeight) / 2;
        turn = this._makeTorus(turnRadius, effectiveRadius, [0, 0, heightPos], [0, 0, 1]);
      } else {
        // Torus for round wire
        turn = this._makeTorus(turnRadius, wireRadius, [0, 0, heightPos], [0, 0, 1]);
      }
    } else {
      // Rectangular column: build using tubes and corners
      const pieces = [];

      const wireYPos = radialPos;
      const wireXPos = halfColDepth + turnTurnRadius;
      const tubeXLength = 2 * halfColDepth;
      const tubeYLength = 2 * halfColWidth;

      // Create tubes (cylinders for round wire, boxes for rectangular)
      // +Y/-Y sides: tubes run along X axis
      // +X/-X sides: tubes run along Y axis
      //
      // makeCylinder creates a cylinder from Z=0 to Z=length
      // After rotating 90° around Y: extends from X=0 to X=length
      // After rotating -90° around X: extends from Y=0 to Y=length
      const createTubeAlongX = (length, yCenter) => {
        if (isRectangularWire) {
          return this._makeBox(length, wireWidth, wireHeight)
            .translate([0, yCenter, heightPos]);
        } else {
          // Cylinder pointing along +X, from X=0 to X=length after rotation
          // Then translate to start at X=-halfColDepth
          const cyl = makeCylinder(wireRadius, length)
            .rotate(90, [0, 0, 0], [0, 1, 0]); // Point along +X
          return cyl.translate([-halfColDepth, yCenter, heightPos]);
        }
      };

      const createTubeAlongY = (length, xCenter) => {
        if (isRectangularWire) {
          return this._makeBox(wireWidth, length, wireHeight)
            .translate([xCenter, 0, heightPos]);
        } else {
          // Cylinder pointing along +Y, from Y=0 to Y=length after rotation
          // Then translate to start at Y=-halfColWidth
          const cyl = makeCylinder(wireRadius, length)
            .rotate(-90, [0, 0, 0], [1, 0, 0]); // Point along +Y
          return cyl.translate([xCenter, -halfColWidth, heightPos]);
        }
      };

      // +Y side tube (along X, at Y = wireYPos)
      pieces.push(createTubeAlongX(tubeXLength, wireYPos));
      // -Y side tube (along X, at Y = -wireYPos)
      pieces.push(createTubeAlongX(tubeXLength, -wireYPos));
      // +X side tube (along Y, at X = wireXPos)
      pieces.push(createTubeAlongY(tubeYLength, wireXPos));
      // -X side tube (along Y, at X = -wireXPos)
      pieces.push(createTubeAlongY(tubeYLength, -wireXPos));

      // Four corners (quarter tori)
      const createCorner = (cornerX, cornerY, startAngleDeg) => {
        return this._makeQuarterTorus(
          turnTurnRadius,
          wireRadius,
          [cornerX, cornerY, heightPos],
          startAngleDeg
        );
      };

      pieces.push(createCorner(+halfColDepth, +halfColWidth, 0));
      pieces.push(createCorner(-halfColDepth, +halfColWidth, 90));
      pieces.push(createCorner(-halfColDepth, -halfColWidth, 180));
      pieces.push(createCorner(+halfColDepth, -halfColWidth, 270));

      turn = makeCompound(pieces);
    }

    // Return geometry in mm (SCALE units) for efficient STL export
    return turn;
  }

  /**
   * Create a toroidal turn using tubes and torus arcs.
   * @private
   */
  _createToroidalTurn(turnDescription, wireDescription, bobbinDescription) {
    const { makeCompound } = this.r;
    const SCALE = this.SCALE;

    // Determine wire type and dimensions
    const isRectangularWire = wireDescription.wireType === WireType.RECTANGULAR;
    let wireWidth, wireHeight, wireRadius;

    if (isRectangularWire) {
      if (turnDescription.dimensions && turnDescription.dimensions.length >= 2) {
        wireWidth = turnDescription.dimensions[0] * SCALE;
        wireHeight = turnDescription.dimensions[1] * SCALE;
      } else {
        wireWidth = (wireDescription.outerWidth || wireDescription.conductingWidth || 0.001) * SCALE;
        wireHeight = (wireDescription.outerHeight || wireDescription.conductingHeight || 0.001) * SCALE;
      }
      wireRadius = Math.min(wireWidth, wireHeight) / 2.0;
    } else {
      const wireDiameter = (wireDescription.outerDiameter || wireDescription.conductingDiameter || 0.001) * SCALE;
      wireRadius = wireDiameter / 2.0;
      wireWidth = wireDiameter;
      wireHeight = wireDiameter;
    }

    // Get bobbin dimensions
    const halfDepth = bobbinDescription.columnDepth * SCALE;

    // Bend radius
    const bendRadius = isRectangularWire 
      ? Math.max(wireWidth, wireHeight) / 2.0 
      : wireRadius;

    // Get turn's angular position
    const turnAngleDeg = turnDescription.rotation;

    // Get inner wire position from coordinates
    const coords = turnDescription.coordinates;
    let innerRadial, innerAngleDeg;
    if (coords.length >= 2) {
      innerRadial = Math.sqrt(coords[0] ** 2 + coords[1] ** 2) * SCALE;
      innerAngleDeg = (180.0 / Math.PI) * Math.atan2(coords[1], coords[0]);
    } else {
      innerRadial = 5.0;
      innerAngleDeg = turnAngleDeg;
    }

    // Get outer wire position from additionalCoordinates
    const addCoords = turnDescription.additionalCoordinates;
    let outerRadial, outerAngleDeg;
    if (addCoords && addCoords.length > 0) {
      const ac = addCoords[0];
      if (ac.length >= 2) {
        outerRadial = Math.sqrt(ac[0] ** 2 + ac[1] ** 2) * SCALE;
        outerAngleDeg = (180.0 / Math.PI) * Math.atan2(ac[1], ac[0]);
      } else {
        outerRadial = innerRadial + (bobbinDescription.windingWindowRadialHeight || 0.003) * SCALE;
        outerAngleDeg = innerAngleDeg;
      }
    } else {
      outerRadial = innerRadial + (bobbinDescription.windingWindowRadialHeight || 0.003) * SCALE;
      outerAngleDeg = innerAngleDeg;
    }

    // Calculate angle difference
    const angleDiffDeg = outerAngleDeg - innerAngleDeg;

    // Inner wire at -inner_radial on X axis
    const innerX = -innerRadial;

    // Calculate rotation from default position
    const turnRotationDeg = turnAngleDeg - 180.0;

    // Radial distance between inner and outer
    const radialDistance = outerRadial - innerRadial;

    // Clearances
    const baseClearance = wireRadius;
    const coreInternalRadius = bobbinDescription.windingWindowRadialHeight * SCALE;
    const layerClearance = coreInternalRadius - innerRadial;

    // Radial segment position
    const radialHeight = halfDepth + baseClearance + layerClearance;

    // Tube lengths
    const tubeLength = radialHeight - bendRadius;

    // Radial segment length
    const radialLength = radialDistance - 2 * bendRadius;

    // Build geometry
    const pieces = [];

    // Helper to create tube
    const createTube = (length, swapDims = false) => {
      if (isRectangularWire) {
        const w = swapDims ? wireHeight : wireWidth;
        const h = swapDims ? wireWidth : wireHeight;
        return this._makeBox(w, h, length);
      } else {
        return this.r.makeCylinder(wireRadius, length);
      }
    };

    // For multilayer turns, the angle difference between inner and outer wires
    // requires rotating the connecting pieces to align properly.
    // The radial segment spans from inner to outer, and the inner corner/tube 
    // on the "top" side need to be tilted to connect with the tilted radial segment.
    
    // 1. Inner tube (along Y) - stays at inner position, no angle rotation needed
    let innerTube = createTube(tubeLength)
      .rotate(-90, [0, 0, 0], [1, 0, 0])
      .translate([innerX, 0, 0]);
    pieces.push(innerTube);

    // 2. Inner corner - needs to connect inner tube to the tilted radial segment
    //    The corner itself needs to be tilted by angleDiffDeg/2 to smoothly connect
    let innerCorner = this._makeQuarterTorus(
      bendRadius,
      wireRadius,
      [innerX - bendRadius, tubeLength, 0],
      0,
      [0, 0, 1]
    );
    // Rotate inner corner by half the angle difference to blend the transition
    if (Math.abs(angleDiffDeg) > 0.001) {
      innerCorner = innerCorner.rotate(angleDiffDeg / 2, [innerX, 0, 0], [0, 1, 0]);
    }
    pieces.push(innerCorner);

    // 3. Radial segment - tilted by angleDiffDeg to go from inner to outer angle
    let radialTube = createTube(radialLength, true)
      .rotate(-90, [0, 0, 0], [0, 1, 0]);
    // First rotate by half angle (to match inner corner end), then position
    if (Math.abs(angleDiffDeg) > 0.001) {
      radialTube = radialTube.rotate(angleDiffDeg / 2, [0, 0, 0], [0, 1, 0]);
    }
    radialTube = radialTube.translate([innerX - bendRadius, radialHeight, 0]);
    // Now rotate around the inner position to reach outer angle
    if (Math.abs(angleDiffDeg) > 0.001) {
      radialTube = radialTube.rotate(angleDiffDeg / 2, [innerX, 0, 0], [0, 1, 0]);
    }
    pieces.push(radialTube);

    // 4. Outer corner - at the outer position, rotated by full angleDiffDeg
    let outerCorner = this._makeQuarterTorus(
      bendRadius,
      wireRadius,
      [innerX - radialDistance + bendRadius, tubeLength, 0],
      90,
      [0, 0, 1]
    );
    if (Math.abs(angleDiffDeg) > 0.001) {
      outerCorner = outerCorner.rotate(angleDiffDeg, [innerX, 0, 0], [0, 1, 0]);
    }
    pieces.push(outerCorner);

    // 5. Outer tube - at the outer position, rotated by full angleDiffDeg
    let outerTube = createTube(tubeLength)
      .rotate(-90, [0, 0, 0], [1, 0, 0])
      .translate([innerX - radialDistance, 0, 0]);
    if (Math.abs(angleDiffDeg) > 0.001) {
      outerTube = outerTube.rotate(angleDiffDeg, [innerX, 0, 0], [0, 1, 0]);
    }
    pieces.push(outerTube);

    // Combine top half first
    const topHalf = makeCompound(pieces);
    
    // Mirror the compound (not individual pieces) for bottom half
    const bottomHalf = topHalf.clone().mirror('XZ');
    
    // Combine top and bottom
    let fullTurn = makeCompound([topHalf, bottomHalf]);

    // Apply rotation
    if (Math.abs(turnRotationDeg) > 0.001) {
      fullTurn = fullTurn.rotate(turnRotationDeg, [0, 0, 0], [0, 1, 0]);
    }

    // Return geometry in mm (SCALE units) for efficient STL export
    return fullTurn;
  }

  /**
   * Create bobbin geometry for concentric magnetics.
   * @param {BobbinProcessedDescription} bobbinDescription - Bobbin parameters
   * @returns {Object|null} - Replicad shape or null if bobbin has zero thickness
   */
  getBobbin(bobbinDescription) {
    // Check if bobbin has actual thickness
    if (Math.round(bobbinDescription.wallThickness * 1e12) === 0 ||
        Math.round(bobbinDescription.columnThickness * 1e12) === 0) {
      return null;
    }

    const { makeCylinder } = this.r;
    const SCALE = this.SCALE;

    // Scale to mm
    const colDepth = bobbinDescription.columnDepth * SCALE;
    const colWidth = bobbinDescription.columnWidth * SCALE;
    const colThickness = bobbinDescription.columnThickness * SCALE;
    const wallThickness = bobbinDescription.wallThickness * SCALE;
    const wwHeight = bobbinDescription.windingWindowHeight * SCALE;
    const wwWidth = bobbinDescription.windingWindowWidth * SCALE;

    // Total dimensions
    const totalHeight = wwHeight + wallThickness * 2;
    const totalWidth = wwWidth + colWidth;
    const totalDepth = wwWidth + colDepth;

    let bobbin;

    if (bobbinDescription.columnShape === ColumnShape.ROUND) {
      // Cylindrical bobbin
      // makeCylinder creates from Z=0 to Z=height, need to center at Z=0
      bobbin = makeCylinder(totalWidth, totalHeight)
        .translate([0, 0, -totalHeight / 2]);

      const negWw = makeCylinder(totalWidth, wwHeight)
        .translate([0, 0, -wwHeight / 2]);
      const centralCol = makeCylinder(colWidth, wwHeight)
        .translate([0, 0, -wwHeight / 2]);
      const centralHole = makeCylinder(colWidth - colThickness, totalHeight)
        .translate([0, 0, -totalHeight / 2]);

      const negWwCut = negWw.cut(centralCol);
      bobbin = bobbin.cut(negWwCut);
      bobbin = bobbin.cut(centralHole);
    } else {
      // Box-shaped bobbin
      // makeBaseBox creates boxes that start at Z=0 and extrude to Z=height
      // Need to center them vertically like CadQuery's .box() does
      bobbin = this._makeBox(totalDepth * 2, totalWidth * 2, totalHeight)
        .translate([0, 0, -totalHeight / 2]);

      const negWw = this._makeBox(totalDepth * 2, totalWidth * 2, wwHeight)
        .translate([0, 0, -wwHeight / 2]);
      const centralCol = this._makeBox(colDepth * 2, colWidth * 2, wwHeight)
        .translate([0, 0, -wwHeight / 2]);

      const innerDepth = colDepth - colThickness;
      const innerWidth = colWidth - colThickness;
      const centralHole = this._makeBox(innerDepth * 2, innerWidth * 2, totalHeight)
        .translate([0, 0, -totalHeight / 2]);

      const negWwCut = negWw.cut(centralCol);
      bobbin = bobbin.cut(negWwCut);
      bobbin = bobbin.cut(centralHole);
    }

    // Return geometry in mm (SCALE units) for efficient STL export
    return bobbin;
  }

  /**
   * Build complete magnetic assembly (core + coil).
   * @param {Object} magneticData - MAS format magnetic data
   * @param {string} projectName - Name for the output
   * @returns {Object} - Replicad compound shape
   */
  getMagnetic(magneticData, projectName = 'Magnetic') {
    const { makeCompound } = this.r;
    const allPieces = [];

    // Detect if toroidal
    let isToroidal = false;

    // Build core (simplified - full implementation would need shape builders)
    const coreData = magneticData.core || {};
    const geometricalDescription = coreData.geometricalDescription || [];
    
    for (const geometricalPart of geometricalDescription) {
      if (geometricalPart.type === 'toroidal') {
        isToroidal = true;
      }
      if (geometricalPart.shape?.family?.toLowerCase() === 't') {
        isToroidal = true;
      }
    }

    // Build core geometry using getCore from coreShapes.js
    if (geometricalDescription.length > 0) {
      try {
        const coreShape = getCore(this.r, geometricalDescription);
        if (coreShape) {
          allPieces.push(coreShape);
        }
      } catch (err) {
        console.warn('Could not build core:', err.message);
      }
    }

    // Build coil turns
    const coilData = magneticData.coil || {};
    const bobbinData = coilData.bobbin || {};
    
    let bobbinProcessed;
    if (typeof bobbinData === 'string') {
      bobbinProcessed = new BobbinProcessedDescription();
    } else {
      const bobbinProcessedData = bobbinData.processedDescription || {};
      bobbinProcessed = BobbinProcessedDescription.fromDict(bobbinProcessedData);
    }

    // Build bobbin if not toroidal
    if (!isToroidal) {
      const bobbinGeom = this.getBobbin(bobbinProcessed);
      if (bobbinGeom !== null) {
        allPieces.push(bobbinGeom);
      }
    }

    // Get wire info
    let wireDesc = new WireDescription({ wireType: WireType.ROUND });
    const functionalDesc = coilData.functionalDescription || [];
    if (functionalDesc.length > 0) {
      const wireData = functionalDesc[0].wire || {};
      if (Object.keys(wireData).length > 0) {
        wireDesc = WireDescription.fromDict(wireData);
      }
    }

    // Build turns
    const turnsData = coilData.turnsDescription || [];
    for (const turnData of turnsData) {
      const turnDesc = TurnDescription.fromDict(turnData);

      // Get wire dimensions from turn data if available
      if (turnData.dimensions) {
        const dims = turnData.dimensions;
        if (dims.length >= 2) {
          wireDesc = new WireDescription({
            wireType: turnData.crossSectionalShape === 'round' ? WireType.ROUND : WireType.RECTANGULAR,
            outerDiameter: dims[0],
            conductingDiameter: dims[0],
            outerWidth: dims[0],
            outerHeight: dims[1]
          });
        }
      }

      const turnGeom = this.getTurn(turnDesc, wireDesc, bobbinProcessed, isToroidal);
      allPieces.push(turnGeom);
    }

    if (allPieces.length > 0) {
      return makeCompound(allPieces);
    }
    return null;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Create a box centered at origin.
   * In Replicad, makeBox(width, height, length) creates a box at origin.
   * We want: X=width, Y=depth, Z=height
   * @private
   */
  _makeBox(width, depth, height) {
    const { makeBaseBox } = this.r;
    // makeBaseBox creates a centered box with dimensions [width, depth, height]
    return makeBaseBox(width, depth, height);
  }

  /**
   * Create a torus by revolving a circle around an axis.
   * Uses direct OpenCASCADE API for proper cross-section orientation.
   * @private
   */
  _makeTorus(majorRadius, minorRadius, center = [0, 0, 0], axis = [0, 0, 1]) {
    const { Solid, getOC } = this.r;
    const oc = getOC();
    
    try {
      // Use BRepPrimAPI_MakeTorus_6 with full 360° angle (2π)
      // This is the same API we use for quarter torus, but with full angle
      const centerPnt = new oc.gp_Pnt_3(center[0], center[1], center[2]);
      const zDir = new oc.gp_Dir_4(axis[0], axis[1], axis[2]);
      const xDir = new oc.gp_Dir_4(1, 0, 0);
      const ax2 = new oc.gp_Ax2_2(centerPnt, zDir, xDir);
      
      // BRepPrimAPI_MakeTorus_6(ax2, R1, R2, angle) - use 2π for full torus
      const torusMaker = new oc.BRepPrimAPI_MakeTorus_6(ax2, majorRadius, minorRadius, 2 * Math.PI);
      const torusShape = torusMaker.Shape();
      return new Solid(torusShape);
    } catch (e) {
      console.warn('Direct torus creation failed:', e.message);
      // Fallback to revolve method
      const { drawCircle } = this.r;
      const circleSketch = drawCircle(minorRadius)
        .sketchOnPlane("XZ", majorRadius);
      const torus = circleSketch.revolve([0, 0, 1], { origin: [0, 0, 0] });
      return torus.translate(center);
    }
  }

  /**
   * Create a quarter torus for corners using direct OpenCASCADE API.
   * The quarter torus connects two perpendicular tubes at a corner.
   * 
   * In the toroidal turn geometry:
   * - Inner corner: center at (-bendRadius, tubeLength, 0), needs arc from +X to +Y
   *   (connects inner tube going +Y to radial segment going -X)
   * - Outer corner: center at (-radialDistance+bendRadius, tubeLength, 0), needs arc from +Y to -X
   *   (connects radial segment going -X to outer tube going +Y)
   * 
   * @param {number} majorRadius - Bend radius (distance from corner center to wire center)
   * @param {number} minorRadius - Wire radius
   * @param {Array} center - [x, y, z] position of corner center
   * @param {number} startAngleDeg - Starting angle in degrees (0=+X, 90=+Y, etc.)
   *                                 The arc sweeps 90° CCW from this angle
   * @param {Array} axis - Revolution axis, default [0, 0, 1] (Z axis)
   * @private
   */
  _makeQuarterTorus(majorRadius, minorRadius, center, startAngleDeg, axis = [0, 0, 1]) {
    const { Solid, getOC } = this.r;
    const oc = getOC();
    
    console.log(`_makeQuarterTorus called: major=${majorRadius}, minor=${minorRadius}, start=${startAngleDeg}`);
    
    try {
      // Use BRepPrimAPI_MakeTorus_6 which takes (gp_Ax2, R1, R2, angle)
      // to create a partial torus
      
      // Create the axis at origin with Z direction
      // The XDirection determines where the torus starts (angle=0)
      const originPnt = new oc.gp_Pnt_3(0, 0, 0);
      const zDir = new oc.gp_Dir_4(axis[0], axis[1], axis[2]);
      
      // Start direction based on startAngleDeg
      // Convert to radians and compute unit vector in XY plane
      const startAngleRad = (startAngleDeg * Math.PI) / 180;
      const xRefX = Math.cos(startAngleRad);
      const xRefY = Math.sin(startAngleRad);
      const xDir = new oc.gp_Dir_4(xRefX, xRefY, 0);
      
      const ax2 = new oc.gp_Ax2_2(originPnt, zDir, xDir);
      
      // Create partial torus: majorRadius, minorRadius, angle (90° = π/2)
      const torusMaker = new oc.BRepPrimAPI_MakeTorus_6(ax2, majorRadius, minorRadius, Math.PI / 2);
      const torusShape = torusMaker.Shape();
      
      // Wrap in replicad Solid and translate to corner center
      const quarterTorus = new Solid(torusShape);
      
      // Translate to the corner center
      return quarterTorus.translate(center);
    } catch (e) {
      // Fallback: use a full torus (should not happen normally)
      console.warn('Quarter torus creation failed:', e.message);
      return this._makeTorus(majorRadius, minorRadius, center, axis);
    }
  }
}

// ==========================================================================
// Export Functions
// ==========================================================================

/**
 * Export shape to STEP format.
 * @param {Object} shape - Replicad shape
 * @returns {string} - STEP file content
 */
export function exportToSTEP(shape) {
  return shape.exportSTEP();
}

/**
 * Export shape to STL format.
 * @param {Object} shape - Replicad shape
 * @param {Object} options - Tessellation options
 * @returns {ArrayBuffer} - STL file content
 */
export function exportToSTL(shape, options = {}) {
  const tolerance = options.tolerance ?? TESSELLATION_LINEAR_TOLERANCE;
  const angularTolerance = options.angularTolerance ?? getAngularTolerance();
  
  return shape.exportSTL({
    tolerance,
    angularTolerance
  });
}

/**
 * Export shape to mesh for Three.js rendering.
 * @param {Object} shape - Replicad shape
 * @returns {Object} - Mesh data { vertices, faces, normals }
 */
export function exportToMesh(shape) {
  return shape.mesh({
    tolerance: TESSELLATION_LINEAR_TOLERANCE,
    angularTolerance: getAngularTolerance()
  });
}
