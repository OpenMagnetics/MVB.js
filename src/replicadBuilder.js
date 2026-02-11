/**
 * OpenMagnetics Virtual Builder - Replicad Implementation
 * 
 * Browser-compatible 3D geometry builder using Replicad/OpenCASCADE.js.
 * This is a JavaScript port of cadquery_builder.py.
 */

import {
  WireType,
  ColumnShape,
  WiringTechnology
} from './MAS.ts';

import {
  flattenDimensions,
  convertAxis,
  wireFromDict,
  turnFromDict,
  groupFromDict,
  bobbinFromDict
} from './utils.js';
import { getCore, getSpacers, getSupportedFamilies } from './coreShapes.js';

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
 * - For concentric cores (E, EL, PQ, RM, etc.):
 *   - X axis: Core width direction (radial, distance from central column, winding window direction)
 *   - Y axis: Core depth direction (perpendicular to winding window)
 *   - Z axis: Core height direction (along core axis, vertical)
 *   
 *   MAS turn coordinates: [radial, height] -> Replicad [X, Z]
 *   - coordinates[0] = radial position = X
 *   - coordinates[1] = height position = Z
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
    // Check for toroidal: either explicit flag or bobbin has windingWindowAngle defined
    // Handle both processed (windingWindowAngle at top level) and raw JSON (windingWindows[0].angle)
    let windingWindowAngle = bobbinDescription.windingWindowAngle;
    if (windingWindowAngle === undefined || windingWindowAngle === null) {
      // Try to get from windingWindows array
      const ww = bobbinDescription.windingWindows?.[0];
      if (ww && ww.angle !== undefined && ww.angle !== null) {
        windingWindowAngle = ww.angle;
      }
    }
    const hasWindingWindowAngle = windingWindowAngle !== undefined && windingWindowAngle !== null;
    
    if (isToroidal || hasWindingWindowAngle) {
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
    // Rectangular cross-section can come from:
    // 1. wireDescription.wireType === 'rectangular'
    // 2. wireDescription.type === 'rectangular' or 'planar' (planar wire has rectangular cross-section)
    // 3. turnDescription.crossSectionalShape === 'rectangular'
    const turnCrossSection = turnDescription.crossSectionalShape?.toLowerCase();
    const isRectangularWire = wireDescription.wireType === WireType.Rectangular || 
                               wireDescription.type === WireType.Rectangular ||
                               wireDescription.type === 'rectangular' ||
                               wireDescription.wireType === 'rectangular' ||
                               wireDescription.type === 'planar' ||
                               wireDescription.wireType === 'planar' ||
                               turnCrossSection === 'rectangular';
    
    let wireWidth, wireHeight, wireRadius;
    
    // Helper to extract value from MAS-style objects (e.g., { nominal: 0.001 }) or plain numbers
    const getNumericValue = (val) => {
      if (typeof val === 'number') return val;
      if (val && typeof val.nominal === 'number') return val.nominal;
      return null;
    };
    
    if (isRectangularWire) {
      if (turnDescription.dimensions && turnDescription.dimensions.length >= 2) {
        wireWidth = turnDescription.dimensions[0] * SCALE;
        wireHeight = turnDescription.dimensions[1] * SCALE;
      } else {
        const ow = getNumericValue(wireDescription.outerWidth) || getNumericValue(wireDescription.conductingWidth) || 0.001;
        const oh = getNumericValue(wireDescription.outerHeight) || getNumericValue(wireDescription.conductingHeight) || 0.001;
        wireWidth = ow * SCALE;
        wireHeight = oh * SCALE;
      }
      wireRadius = Math.min(wireWidth, wireHeight) / 2.0;
    } else {
      const od = getNumericValue(wireDescription.outerDiameter) || getNumericValue(wireDescription.conductingDiameter) || 0.001;
      const wireDiameter = od * SCALE;
      wireRadius = wireDiameter / 2.0;
      wireWidth = wireDiameter;
      wireHeight = wireDiameter;
    }

    // Get bobbin/column dimensions
    // MAS convention: columnWidth is radial direction (X), columnDepth is depth direction (Y)
    // For turns, radial position (coordinates[0]) is distance from center in X direction
    const halfColWidth = bobbinDescription.columnWidth * SCALE;  // Half column width in X
    const halfColDepth = bobbinDescription.columnDepth * SCALE;  // Half column depth in Y

    // Get turn position from coordinates
    const coords = turnDescription.coordinates;
    // coordinates[0] is radial position (distance from center column edge in X direction)
    const radialPos = coords.length > 0 ? coords[0] * SCALE : (halfColWidth + wireRadius);
    const heightPos = coords.length > 1 ? coords[1] * SCALE : 0;

    // Corner radius: distance from column edge to wire center
    let turnTurnRadius = radialPos - halfColWidth;
    if (turnTurnRadius < wireRadius) {
      turnTurnRadius = wireRadius;
    }

    let turn;
    
    // Determine column shape
    const columnShape = bobbinDescription.columnShape?.toLowerCase() || 'rectangular';
    const isRound = columnShape === ColumnShape.Round || columnShape === 'round';
    const isOblong = columnShape === 'oblong';

    if (isRound) {
      // Round column: circular turn path
      const turnRadius = radialPos;

      if (isRectangularWire) {
        // For rectangular wire on round column, use full swept rectangle (360° revolution)
        turn = this._makeFullSweptRectangle(turnRadius, wireWidth, wireHeight, [0, 0, heightPos]);
      } else {
        // Torus for round wire
        turn = this._makeTorus(turnRadius, wireRadius, [0, 0, heightPos], [0, 0, 1]);
      }
    } else if (isOblong) {
      // Oblong column: stadium-shaped turn path
      // The column is a rectangle (in X) with semicircular ends (in Y)
      // Turn wraps around with:
      // - Straight sections along ±X sides (tubes along Y)
      // - Semicircular arcs at ±Y ends
      //
      // Stadium dimensions: halfColWidth (X, the round part radius), halfColDepth (Y total half-length)
      // The semicircle starts at Y = ±(halfColDepth - halfColWidth) and ends at Y = ±halfColDepth
      
      const pieces = [];
      
      // Calculate the Y position where the rectangular part ends and semicircle starts
      const straightSectionHalfLength = halfColDepth - halfColWidth;
      
      // If straightSectionHalfLength <= 0, the column is actually round
      if (straightSectionHalfLength <= 0) {
        turn = this._makeTorus(radialPos, wireRadius, [0, 0, heightPos], [0, 0, 1]);
      } else {
        // Wire positions
        const wireXPos = radialPos;  // Radial distance from center (in X direction)
        const tubeYLength = 2 * straightSectionHalfLength;  // Straight sections along Y

        // Create tubes for the straight sections (along Y, at X = ±wireXPos)
        const createTubeAlongY = (length, xCenter, yOffset = 0) => {
          if (isRectangularWire) {
            return this._makeBox(wireWidth, length, wireHeight)
              .translate([xCenter, yOffset, heightPos]);
          } else {
            // Cylinder pointing along +Y
            const cyl = makeCylinder(wireRadius, length)
              .rotate(-90, [0, 0, 0], [1, 0, 0]); // Point along +Y
            return cyl.translate([xCenter, yOffset - length/2, heightPos]);
          }
        };

        // +X side tube (along Y, at X = +wireXPos)
        pieces.push(createTubeAlongY(tubeYLength, wireXPos));
        // -X side tube (along Y, at X = -wireXPos)
        pieces.push(createTubeAlongY(tubeYLength, -wireXPos));

        // Semicircular arcs at ±Y ends
        // At +Y end (center at Y = +straightSectionHalfLength): semicircle from +X to -X (180°)
        // At -Y end (center at Y = -straightSectionHalfLength): semicircle from -X to +X (180°)
        
        // For oblong columns, the half-torus major radius is the distance from column center
        // to the wire center (radialPos), NOT the corner radius (turnTurnRadius).
        // This ensures multilayer turns are correctly positioned at different radial distances.
        const halfTorusMajorRadius = radialPos;
        
        // Create half torus/swept rectangle (180°) for the semicircular ends
        const createHalfArc = (centerY, startAngleDeg) => {
          if (isRectangularWire) {
            return this._makeHalfSweptRectangle(
              halfTorusMajorRadius,
              wireWidth,
              wireHeight,
              [0, centerY, heightPos],
              startAngleDeg
            );
          } else {
            return this._makeHalfTorus(
              halfTorusMajorRadius,
              wireRadius,
              [0, centerY, heightPos],
              startAngleDeg
            );
          }
        };

        // +Y semicircle: center at Y = +straightSectionHalfLength
        // Wire comes from +X side, goes around to -X side
        // Start angle 0 (pointing +X), sweep 180° to end at 180° (pointing -X)
        pieces.push(createHalfArc(+straightSectionHalfLength, 0));
        
        // -Y semicircle: center at Y = -straightSectionHalfLength  
        // Wire comes from -X side, goes around to +X side
        // Start angle 180 (pointing -X), sweep 180° to end at 0° (pointing +X)
        pieces.push(createHalfArc(-straightSectionHalfLength, 180));

        turn = makeCompound(pieces);
      }
    } else {
      // Rectangular column: build using tubes and corners
      // 
      // Coordinate system:
      // - X axis: Core width direction (radial, distance from central column) - winding window opens in ±X
      // - Y axis: Core depth direction (perpendicular to winding window)
      // - Z axis: Core height direction (along core axis, vertical)
      //
      // For rectangular/oblong columns, the turn is a racetrack shape:
      // - 4 straight tubes (one per side of the column)
      // - 4 corner quarter-tori connecting the tubes
      //
      // Tube positions:
      // - +X/-X sides: tubes run along Y (depth), at X = ±radialPos
      // - +Y/-Y sides: tubes run along X (width), at Y = ±(halfColDepth + turnTurnRadius)
      
      const pieces = [];

      // Wire positions based on column dimensions and radial position
      const wireXPos = radialPos;  // Radial distance from center (in X direction)
      const wireYPos = halfColDepth + turnTurnRadius;  // Depth + corner radius
      const tubeYLength = 2 * halfColDepth;  // Tubes along Y span full column depth
      const tubeXLength = 2 * halfColWidth;  // Tubes along X span full column width

      // Create tubes (cylinders for round wire, boxes for rectangular)
      const createTubeAlongY = (length, xCenter) => {
        if (isRectangularWire) {
          return this._makeBox(wireWidth, length, wireHeight)
            .translate([xCenter, 0, heightPos]);
        } else {
          // Cylinder pointing along +Y
          const cyl = makeCylinder(wireRadius, length)
            .rotate(-90, [0, 0, 0], [1, 0, 0]); // Point along +Y
          return cyl.translate([xCenter, -halfColDepth, heightPos]);
        }
      };

      const createTubeAlongX = (length, yCenter) => {
        if (isRectangularWire) {
          return this._makeBox(length, wireWidth, wireHeight)
            .translate([0, yCenter, heightPos]);
        } else {
          // Cylinder pointing along +X
          const cyl = makeCylinder(wireRadius, length)
            .rotate(90, [0, 0, 0], [0, 1, 0]); // Point along +X
          return cyl.translate([-halfColWidth, yCenter, heightPos]);
        }
      };

      // +X side tube (along Y, at X = +wireXPos)
      pieces.push(createTubeAlongY(tubeYLength, wireXPos));
      // -X side tube (along Y, at X = -wireXPos)
      pieces.push(createTubeAlongY(tubeYLength, -wireXPos));
      // +Y side tube (along X, at Y = +wireYPos)
      pieces.push(createTubeAlongX(tubeXLength, wireYPos));
      // -Y side tube (along X, at Y = -wireYPos)
      pieces.push(createTubeAlongX(tubeXLength, -wireYPos));

      // Four corners (quarter tori or swept rectangles)
      // Corners are at the intersection of column edges
      const createCorner = (cornerX, cornerY, startAngleDeg) => {
        if (isRectangularWire) {
          return this._makeQuarterSweptRectangle(
            turnTurnRadius,
            wireWidth,
            wireHeight,
            [cornerX, cornerY, heightPos],
            startAngleDeg
          );
        } else {
          return this._makeQuarterTorus(
            turnTurnRadius,
            wireRadius,
            [cornerX, cornerY, heightPos],
            startAngleDeg
          );
        }
      };

      // Corners at (±halfColWidth, ±halfColDepth)
      pieces.push(createCorner(+halfColWidth, +halfColDepth, 0));
      pieces.push(createCorner(-halfColWidth, +halfColDepth, 90));
      pieces.push(createCorner(-halfColWidth, -halfColDepth, 180));
      pieces.push(createCorner(+halfColWidth, -halfColDepth, 270));

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
    // Rectangular cross-section can come from:
    // 1. wireDescription.wireType === 'rectangular'
    // 2. wireDescription.type === 'rectangular' or 'planar' (planar wire has rectangular cross-section)
    // 3. turnDescription.crossSectionalShape === 'rectangular'
    const turnCrossSection = turnDescription.crossSectionalShape?.toLowerCase();
    const isRectangularWire = wireDescription.wireType === WireType.Rectangular || 
                               wireDescription.type === WireType.Rectangular ||
                               wireDescription.type === 'rectangular' ||
                               wireDescription.wireType === 'rectangular' ||
                               wireDescription.type === 'planar' ||
                               wireDescription.wireType === 'planar' ||
                               turnCrossSection === 'rectangular';
    
    let wireWidth, wireHeight, wireRadius;
    
    // Helper to extract value from MAS-style objects (e.g., { nominal: 0.001 }) or plain numbers
    const getNumericValue = (val) => {
      if (typeof val === 'number') return val;
      if (val && typeof val.nominal === 'number') return val.nominal;
      return null;
    };

    if (isRectangularWire) {
      if (turnDescription.dimensions && turnDescription.dimensions.length >= 2) {
        wireWidth = turnDescription.dimensions[0] * SCALE;
        wireHeight = turnDescription.dimensions[1] * SCALE;
      } else {
        const ow = getNumericValue(wireDescription.outerWidth) || getNumericValue(wireDescription.conductingWidth) || 0.001;
        const oh = getNumericValue(wireDescription.outerHeight) || getNumericValue(wireDescription.conductingHeight) || 0.001;
        wireWidth = ow * SCALE;
        wireHeight = oh * SCALE;
      }
      wireRadius = Math.min(wireWidth, wireHeight) / 2.0;
    } else {
      const od = getNumericValue(wireDescription.outerDiameter) || getNumericValue(wireDescription.conductingDiameter) || 0.001;
      const wireDiameter = od * SCALE;
      wireRadius = wireDiameter / 2.0;
      wireWidth = wireDiameter;
      wireHeight = wireDiameter;
    }

    // Get bobbin dimensions - handle both processed and raw JSON format
    const halfDepth = bobbinDescription.columnDepth * SCALE;
    
    // Get windingWindowRadialHeight from either top level or first winding window
    let windingWindowRadialHeight = bobbinDescription.windingWindowRadialHeight;
    if (windingWindowRadialHeight === undefined || windingWindowRadialHeight === null) {
      const ww = bobbinDescription.windingWindows?.[0];
      if (ww && ww.radialHeight !== undefined) {
        windingWindowRadialHeight = ww.radialHeight;
      }
    }
    windingWindowRadialHeight = windingWindowRadialHeight || 0.003;

    // Bend radius
    const bendRadius = isRectangularWire 
      ? Math.max(wireWidth, wireHeight) / 2.0 
      : wireRadius;

    // Get turn's angular position (rotation around the torus)
    const turnAngleDeg = turnDescription.rotation;

    // For toroidal cores, coordinates are Cartesian [x, y] representing the wire position
    // The radial distance from center is sqrt(x² + y²)
    const coords = turnDescription.coordinates;
    let innerRadial, innerAngleDeg;
    if (coords && coords.length >= 2) {
      innerRadial = Math.sqrt(coords[0] ** 2 + coords[1] ** 2) * SCALE;
      innerAngleDeg = (180.0 / Math.PI) * Math.atan2(coords[1], coords[0]);
    } else if (coords && coords.length >= 1) {
      innerRadial = Math.abs(coords[0]) * SCALE;
      innerAngleDeg = turnAngleDeg;
    } else {
      innerRadial = 5.0;
      innerAngleDeg = turnAngleDeg;
    }

    // Get outer wire position from additionalCoordinates - also Cartesian [x, y]
    const addCoords = turnDescription.additionalCoordinates;
    let outerRadial, outerAngleDeg;
    if (addCoords && addCoords.length > 0) {
      const ac = addCoords[0];
      if (ac && ac.length >= 2) {
        outerRadial = Math.sqrt(ac[0] ** 2 + ac[1] ** 2) * SCALE;
        outerAngleDeg = (180.0 / Math.PI) * Math.atan2(ac[1], ac[0]);
      } else if (ac && ac.length >= 1) {
        outerRadial = Math.abs(ac[0]) * SCALE;
        outerAngleDeg = innerAngleDeg;
      } else {
        outerRadial = innerRadial + windingWindowRadialHeight * SCALE;
        outerAngleDeg = innerAngleDeg;
      }
    } else {
      outerRadial = innerRadial + windingWindowRadialHeight * SCALE;
      outerAngleDeg = innerAngleDeg;
    }

    // Calculate angle difference between inner and outer wire positions
    const angleDiffDeg = outerAngleDeg - innerAngleDeg;

    // Inner wire at -inner_radial on X axis (will be rotated later)
    const innerX = -innerRadial;

    // Calculate rotation from default position (geometry starts at -X, so offset by 180°)
    const turnRotationDeg = turnAngleDeg - 180.0;

    // Radial distance between inner and outer
    const radialDistance = outerRadial - innerRadial;

    // Clearances
    const baseClearance = wireRadius;
    const coreInternalRadius = windingWindowRadialHeight * SCALE;
    const layerClearance = coreInternalRadius - innerRadial;

    // Radial segment position
    const radialHeight = halfDepth + baseClearance + layerClearance;

    // Tube lengths (ensure positive)
    const tubeLength = Math.max(0.1, radialHeight - bendRadius);

    // Radial segment length
    // Ensure it's not negative (which would create invalid geometry)
    const radialLength = Math.max(0.1, radialDistance - 2 * bendRadius);

    // For rectangular wires in toroidal configuration:
    // The turn wraps AROUND the toroidal core's circular cross-section.
    // 
    // Coordinate system:
    // - Y axis goes through the toroid hole (the toroid's axis of revolution)
    // - X is radial distance from center (negative X = toward outer edge)
    // - Z is vertical (perpendicular to core surface)
    //
    // The wire lies flat on the core surface, so the wire cross-section is:
    // - wireWidth: the wider dimension, tangent to the core surface
    // - wireHeight: the thinner dimension, perpendicular to core surface (in Z)
    //
    // Turn components:
    // - Inner/outer tubes: run along Y (through the hole), cross-section wireWidth(X) × wireHeight(Z)
    // - Radial segments: run along X (top/bottom), cross-section wireWidth(Y) × wireHeight(Z)
    // - 4 corners: quarter swept rectangles connecting tubes to radials
    //
    // This is similar to concentric rectangular turns, just laid out radially around the core.
    if (isRectangularWire) {
      const pieces = [];
      
      // Calculate positions
      // Inner tube at X = innerX, Outer tube at X = innerX - radialDistance
      const outerX = innerX - radialDistance;
      
      // Build both halves (+Y and -Y)
      const buildRectHalf = (ySign) => {
        const halfPieces = [];
        
        // 1. Inner tube (along Y) - from Y=0 toward ±Y
        // Box dimensions: wireWidth (X) × tubeLength (Y) × wireHeight (Z)
        const innerTube = this._makeBox(wireWidth, tubeLength, wireHeight)
          .translate([innerX, (tubeLength / 2) * ySign, 0]);
        halfPieces.push(innerTube);
        
        // 2. Inner corner - quarter swept rectangle
        // Corner center at (innerX - bendRadius, tubeLength * ySign, 0)
        // From corner center perspective:
        //   - Tube connection is at +X direction (angle 0°)
        //   - Radial connection is at +Y for +Y half (angle 90°), -Y for -Y half (angle 270°)
        // Always start at 0° (tube end), sweep toward radial
        const innerCornerCenter = [innerX - bendRadius, tubeLength * ySign, 0];
        const innerCornerStartAngle = 0;  // Always start at tube connection (+X)
        const innerCorner = this._makeToroidalQuarterSweptRectangle(
          bendRadius, wireWidth, wireHeight,
          innerCornerCenter, innerCornerStartAngle, ySign
        );
        halfPieces.push(innerCorner);
        
        // 3. Radial segment - runs along X from inner corner to outer corner
        // At Y = radialHeight (top/bottom of core)
        // Box dimensions: radialLength (X) × wireWidth (Y) × wireHeight (Z)
        const radialTube = this._makeBox(radialLength, wireWidth, wireHeight)
          .translate([innerX - bendRadius - radialLength / 2, radialHeight * ySign, 0]);
        halfPieces.push(radialTube);
        
        // 4. Outer corner - quarter swept rectangle
        // Corner center at (outerX + bendRadius, tubeLength * ySign, 0)
        // From corner center perspective:
        //   - Radial connection is at +Y for +Y half (angle 90°), -Y for -Y half (angle 270°)
        //   - Tube connection is at -X direction (angle 180°)
        // Start at radial connection, sweep toward tube
        const outerCornerCenter = [outerX + bendRadius, tubeLength * ySign, 0];
        const outerCornerStartAngle = ySign > 0 ? 90 : 270;  // Radial connection angle
        const outerCorner = this._makeToroidalQuarterSweptRectangle(
          bendRadius, wireWidth, wireHeight,
          outerCornerCenter, outerCornerStartAngle, ySign
        );
        halfPieces.push(outerCorner);
        
        // 5. Outer tube (along Y) - from Y=0 toward ±Y
        const outerTube = this._makeBox(wireWidth, tubeLength, wireHeight)
          .translate([outerX, (tubeLength / 2) * ySign, 0]);
        halfPieces.push(outerTube);
        
        return halfPieces;
      };
      
      // Build top half (+Y) and bottom half (-Y)
      pieces.push(...buildRectHalf(+1));
      pieces.push(...buildRectHalf(-1));
      
      // Combine all pieces
      let fullTurn = makeCompound(pieces);
      
      // Apply the turn rotation around Y axis (around the toroid center)
      if (Math.abs(turnRotationDeg) > 0.001) {
        fullTurn = fullTurn.rotate(turnRotationDeg, [0, 0, 0], [0, 1, 0]);
      }
      
      return fullTurn;
    }

    // For round wires, use the original complex algorithm with torus corners
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

    // Helper to create corner (quarter turn)
    // For rectangular wire: creates a box-based corner
    // For round wire: creates a quarter torus
    const createCorner = (center, startAngleDeg, axis) => {
      if (isRectangularWire) {
        // For rectangular wire, create a box that fills the corner
        // The box dimensions match the wire cross-section and bend radius
        // Position depends on start angle (0, 90, 180, 270)
        let corner = this._makeBox(wireWidth, wireHeight, bendRadius);
        
        // Rotate based on start angle to orient correctly
        // startAngleDeg determines which quadrant the corner is in
        if (startAngleDeg === 90 || startAngleDeg === 270) {
          // Swap X and Z for corners along different axes
          corner = corner.rotate(90, [0, 0, 0], [0, 1, 0]);
        }
        if (startAngleDeg === 180 || startAngleDeg === 270) {
          corner = corner.rotate(180, [0, 0, 0], [0, 0, 1]);
        }
        
        return corner.translate(center);
      } else {
        return this._makeQuarterTorus(bendRadius, wireRadius, center, startAngleDeg, axis);
      }
    };

    // Helper to create corner (quarter arc)
    // For toroidal turns, corners bend in the XY plane, not around Z like in concentric turns
    const createToroidalCorner = (position, isInnerCorner, ySign) => {
      // For toroidal geometry, corners connect vertical tubes to radial segments
      // The bending happens in the XY plane
      if (isRectangularWire) {
        // For rectangular wire, use a box approximation at corners
        // This avoids the complexity of swept rectangles in non-standard orientations
        const cornerBox = this._makeBox(wireWidth, wireHeight, bendRadius);
        // Position the corner box
        return cornerBox.translate([position[0], position[1], position[2]]);
      } else {
        return this._makeQuarterTorus(
          bendRadius,
          wireRadius,
          position,
          isInnerCorner ? (ySign > 0 ? 0 : 270) : (ySign > 0 ? 90 : 180),
          [0, 0, 1]
        );
      }
    };

    // Build both halves explicitly to avoid mirror/scale issues with OpenCASCADE
    // This prevents "object has been deleted" errors
    const buildHalf = (ySign) => {
      const halfPieces = [];
      const yMult = ySign; // +1 for top half, -1 for bottom half

      // 1. Inner tube (along Y) - from center toward ±Y
      let innerTube = createTube(tubeLength)
        .rotate(-90 * yMult, [0, 0, 0], [1, 0, 0])
        .translate([innerX, 0, 0]);
      halfPieces.push(innerTube);

      // 2. Inner corner - connects inner tube to radial segment
      let innerCorner = createToroidalCorner(
        [innerX - bendRadius, tubeLength * yMult, 0],
        true,
        ySign
      );
      // Rotate inner corner by half the angle difference to blend the transition
      if (Math.abs(angleDiffDeg) > 0.001) {
        innerCorner = innerCorner.rotate(angleDiffDeg / 2, [innerX, 0, 0], [0, 1, 0]);
      }
      halfPieces.push(innerCorner);

      // 3. Radial segment - tilted by angleDiffDeg to go from inner to outer angle
      let radialTube = createTube(radialLength, true)
        .rotate(-90, [0, 0, 0], [0, 1, 0]);
      // First rotate by half angle (to match inner corner end), then position
      if (Math.abs(angleDiffDeg) > 0.001) {
        radialTube = radialTube.rotate(angleDiffDeg / 2, [0, 0, 0], [0, 1, 0]);
      }
      radialTube = radialTube.translate([innerX - bendRadius, radialHeight * yMult, 0]);
      // Now rotate around the inner position to reach outer angle
      if (Math.abs(angleDiffDeg) > 0.001) {
        radialTube = radialTube.rotate(angleDiffDeg / 2, [innerX, 0, 0], [0, 1, 0]);
      }
      halfPieces.push(radialTube);

      // 4. Outer corner - connects radial segment to outer tube
      let outerCorner = createToroidalCorner(
        [innerX - radialDistance + bendRadius, tubeLength * yMult, 0],
        false,
        ySign
      );
      if (Math.abs(angleDiffDeg) > 0.001) {
        outerCorner = outerCorner.rotate(angleDiffDeg, [innerX, 0, 0], [0, 1, 0]);
      }
      halfPieces.push(outerCorner);

      // 5. Outer tube - at the outer position, rotated by full angleDiffDeg
      let outerTube = createTube(tubeLength)
        .rotate(-90 * yMult, [0, 0, 0], [1, 0, 0])
        .translate([innerX - radialDistance, 0, 0]);
      if (Math.abs(angleDiffDeg) > 0.001) {
        outerTube = outerTube.rotate(angleDiffDeg, [innerX, 0, 0], [0, 1, 0]);
      }
      halfPieces.push(outerTube);

      return halfPieces;
    };

    // Build top half (+Y) and bottom half (-Y)
    const topPieces = buildHalf(+1);
    const bottomPieces = buildHalf(-1);

    // Combine all pieces
    const allPieces = [...topPieces, ...bottomPieces];
    let fullTurn = makeCompound(allPieces);

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
    
    // Extract winding window dimensions - handle both flat properties and windingWindows array
    let wwHeight, wwWidth;
    if (bobbinDescription.windingWindowHeight !== undefined && bobbinDescription.windingWindowWidth !== undefined) {
      wwHeight = bobbinDescription.windingWindowHeight * SCALE;
      wwWidth = bobbinDescription.windingWindowWidth * SCALE;
    } else if (bobbinDescription.windingWindows && bobbinDescription.windingWindows.length > 0) {
      const ww = bobbinDescription.windingWindows[0];
      wwHeight = ww.height * SCALE;
      wwWidth = ww.width * SCALE;
    } else {
      console.warn('getBobbin: No winding window dimensions found');
      return null;
    }

    // Total dimensions
    // Coordinate system: X = width (radial direction), Y = depth
    const totalHeight = wwHeight + wallThickness * 2;
    const totalWidth = wwWidth + colWidth;  // X extent
    const totalDepth = wwWidth + colDepth;  // Y extent

    let bobbin;
    
    // Determine column shape
    const columnShape = bobbinDescription.columnShape?.toLowerCase() || 'rectangular';
    const isRound = columnShape === ColumnShape.Round || columnShape === 'round';
    const isOblong = columnShape === 'oblong';
    const isEpx = columnShape === 'epx';  // EPX has a semicircular back side

    if (isRound) {
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
    } else if (isOblong) {
      // Oblong bobbin: stadium shape (rectangle with semicircular ends)
      // The column has width (shorter, X direction) and depth (longer, Y direction)
      // Stadium is oriented with the longer axis along Y
      
      // Outer bobbin shell - still rectangular for simplicity
      bobbin = this._makeBox(totalWidth * 2, totalDepth * 2, totalHeight);

      // Create negative winding window
      const negWw = this._makeBox(totalWidth * 2, totalDepth * 2, wwHeight);
      
      // Central column: stadium shape (rectangle + two semicircles)
      // Stadium dimensions: width = colWidth*2 (X), length = colDepth*2 (Y)
      // The semicircle radius = colWidth (half the short dimension)
      const centralCol = this._makeStadium(colWidth, colDepth, wwHeight);

      // Central hole (for the core): also stadium shape but smaller
      const innerWidth = colWidth - colThickness;
      const innerDepth = colDepth - colThickness;
      const centralHole = this._makeStadium(innerWidth, innerDepth, totalHeight);

      const negWwCut = negWw.cut(centralCol);
      bobbin = bobbin.cut(negWwCut);
      bobbin = bobbin.cut(centralHole);
    } else if (isEpx) {
      // EPX bobbin: rectangular front side, semicircular back side
      // The EPX column is like a stadium but with offset center:
      // - Front (winding window side, -Y direction): flat/rectangular
      // - Back (+Y direction): semicircular
      // 
      // EPX column structure: rectangle in center + semicircle on back (+Y side)
      // The semicircle radius = colWidth (half the column width)
      const semicircleRadius = colWidth;
      const rectangularPartDepth = colDepth - semicircleRadius;  // Distance from center to where semicircle starts
      
      // Outer bobbin shell - rectangular
      bobbin = this._makeBox(totalWidth * 2, totalDepth * 2, totalHeight);

      // Create negative winding window (rectangular)
      const negWw = this._makeBox(totalWidth * 2, totalDepth * 2, wwHeight);
      
      // Central column: rectangle + semicircle on +Y side (back)
      // Use _makeHalfStadium helper for EPX-style column
      const centralCol = this._makeHalfStadium(colWidth, colDepth, wwHeight);

      // Central hole: same shape but smaller
      const innerWidth = colWidth - colThickness;
      const innerDepth = colDepth - colThickness;
      const centralHole = this._makeHalfStadium(innerWidth, innerDepth, totalHeight);

      const negWwCut = negWw.cut(centralCol);
      bobbin = bobbin.cut(negWwCut);
      bobbin = bobbin.cut(centralHole);
    } else {
      // Rectangular bobbin
      // _makeBox(width, depth, height) where X=width, Y=depth, Z=height
      // totalWidth is X extent (radial direction)
      // totalDepth is Y extent (depth direction)
      bobbin = this._makeBox(totalWidth * 2, totalDepth * 2, totalHeight);

      const negWw = this._makeBox(totalWidth * 2, totalDepth * 2, wwHeight);
      // Central column: X = colWidth * 2, Y = colDepth * 2
      const centralCol = this._makeBox(colWidth * 2, colDepth * 2, wwHeight);

      const innerWidth = colWidth - colThickness;
      const innerDepth = colDepth - colThickness;
      const centralHole = this._makeBox(innerWidth * 2, innerDepth * 2, totalHeight);

      const negWwCut = negWw.cut(centralCol);
      bobbin = bobbin.cut(negWwCut);
      bobbin = bobbin.cut(centralHole);
    }

    // Return geometry in mm (SCALE units) for efficient STL export
    return bobbin;
  }

  /**
   * Create an FR4 board geometry for planar transformers (PCBs).
   * The FR4 board represents the PCB substrate in a planar transformer.
   * 
   * The board is rendered as a translucent green slab with a central hole
   * for the magnetic core column.
   * 
   * @param {Object} coil
   * @returns {Object|null} - Replicad shape or null if not applicable
   */
  getFR4Board(coil) {
    if (!coil || !coil.groupsDescription || coil.groupsDescription.length === 0) {
      console.warn('getFR4Board: Invalid coil data - missing groupsDescription');
      return null;
    }
    
    const groupDescription = coil.groupsDescription[0];
    const bobbinDescription = coil.bobbin?.processedDescription || coil.bobbin || {};
    const SCALE = this.SCALE;
    const { makeCylinder } = this.r;

    // Only create FR4 for PCB groups (Printed wiring technology)
    if (!groupDescription.isPCB || (typeof groupDescription.isPCB === 'function' && !groupDescription.isPCB())) {
      const groupType = groupDescription.type || '';
      if (groupType !== WiringTechnology.Printed && 
          groupType !== 'Printed' && 
          groupType?.toLowerCase() !== 'printed') {
        return null;
      }
    }

    // Following BasicPainter logic exactly:
    // paint_rectangle(group.coordinates[0], group.coordinates[1], group.dimensions[0], group.dimensions[1])
    // In 2D cross-section (XZ plane):
    //   - coordinates[0] = X position (radial distance from center to group center)
    //   - coordinates[1] = Z position (height position)
    //   - dimensions[0] = width in X (radial extent of group)
    //   - dimensions[1] = height in Z (FR4 thickness as seen in cross-section)
    
    const groupCoords = groupDescription.coordinates || [0, 0];
    const groupDims = groupDescription.dimensions || [0.005, 0.001];
    
    // Group position and size (in meters, convert to mm)
    const groupX = (groupCoords[0] || 0) * SCALE;        // Radial position from center to group center
    const groupZ = (groupCoords[1] || 0) * SCALE;        // Height position (Z)
    const groupWidth = (groupDims[0]) * SCALE;
    let groupDepth = (bobbinDescription.columnDepth || 0) * SCALE;
    
    let maximumLayerWidth = 0;
    for (const layer of coil.groupsDescription) {
        const currentLayerExternalPoint = layer.dimensions[0] * SCALE;
        maximumLayerWidth = Math.max(maximumLayerWidth, currentLayerExternalPoint);
    }

    groupDepth += maximumLayerWidth;

    const groupHeight = (groupDims[1] || 0.001) * SCALE;   // FR4 thickness (height in Z direction)


    // Use group dimensions[1] as thickness (matching 2D painter), or override if provided
    // Apply minimum thickness of 0.5mm to avoid z-fighting with wires
    const MIN_FR4_THICKNESS = 0.5;  // mm
    const fr4Thickness = Math.max(groupHeight, MIN_FR4_THICKNESS);

    // Get column dimensions
    const colWidth = (bobbinDescription.columnWidth || 0.002) * SCALE;
    const colDepth = (bobbinDescription.columnDepth || 0.002) * SCALE;
    const columnShape = bobbinDescription.columnShape?.toLowerCase() || 'rectangular';

    // Calculate inner and outer radii/edges from group position
    // groupX is the CENTER of the group in the radial direction
    // Inner edge = groupX - groupWidth/2 (where group starts, near column)
    // Outer edge = groupX + groupWidth/2 (where group ends, away from column)
    const innerRadius = groupX - groupWidth / 2;
    const outerRadius = groupX + groupWidth / 2;
    
    // Add small clearance for the hole
    const holeMargin = 0.2;  // mm clearance
    const holeInnerRadius = innerRadius - holeMargin;

    let fr4Board;

    if (columnShape === 'round') {
      // For round columns, create an annulus (disk with hole)
      // Outer disk
      const outerDisk = makeCylinder(outerRadius, fr4Thickness)
        .translate([0, 0, groupZ - fr4Thickness / 2]);
      
      // Inner hole (slightly smaller than inner radius for clearance)
      const innerHole = makeCylinder(holeInnerRadius, fr4Thickness + 2)
        .translate([0, 0, groupZ - fr4Thickness / 2 - 1]);
      
      fr4Board = outerDisk.cut(innerHole);
    } else {
      // For rectangular/oblong columns, create a rectangular board with rectangular hole
      // The board extends symmetrically around the column
      const boardFullWidth = outerRadius * 2;   // X dimension (symmetric)
      const boardFullDepth = groupDepth * 2;   // Y dimension (assume square for rectangular column)
      
      fr4Board = this._makeBox(boardFullWidth, boardFullDepth, fr4Thickness)
        .translate([0, 0, groupZ]);

      // Rectangular hole sized to match the inner edge of the winding area
      const holeWidth = holeInnerRadius * 2;
      const holeDepth = (colDepth + holeMargin) * 2;  // Use column depth for Y
      const centralHole = this._makeBox(holeWidth, holeDepth, fr4Thickness + 2)
        .translate([0, 0, groupZ]);

      fr4Board = fr4Board.cut(centralHole);
    }

    return fr4Board;
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
    const coilData = magneticData.coil || magneticData || {};
    const bobbinData = coilData.bobbin || {};

    let bobbinProcessed;
    if (typeof bobbinData === 'string') {
      bobbinProcessed = bobbinFromDict({});
    } else {
      const bobbinProcessedData = bobbinData.processedDescription || {};
      bobbinProcessed = bobbinFromDict(bobbinProcessedData);
    }

    // Build bobbin if not toroidal and not a planar transformer
    // Check if this is a planar transformer by looking at groups
    const groupsData = coilData.groupsDescription || [];
    let isPlanar = false;
    
    for (const groupData of groupsData) {
      const groupType = groupData.type || '';
      if (groupType === WiringTechnology.Printed || 
          groupType === 'Printed' || 
          groupType?.toLowerCase() === 'printed') {
        isPlanar = true;
        break;
      }
    }

    // Build bobbin only if not toroidal and not planar (planar uses FR4 boards instead)
    if (!isToroidal && !isPlanar) {
      const bobbinGeom = this.getBobbin(bobbinProcessed);
      if (bobbinGeom !== null) {
        allPieces.push(bobbinGeom);
      }
    }

    // Build FR4 boards for planar transformers
    if (isPlanar) {
      console.log('Building FR4, isPlanar:', isPlanar, 'groupsData:', groupsData.length);
      for (const groupData of groupsData) {
        const groupDesc = groupFromDict(groupData);
        
        try {
          const fr4Board = this.getFR4Board(coilData);
          if (fr4Board !== null) {
            allPieces.push(fr4Board);
          }
        } catch (err) {
          console.warn('[MVB] Could not build FR4 board:', err.message);
        }
      }
    }

    // Get wire info
    let wireDesc = { type: WireType.Round, numberConductors: 1 };
    const functionalDesc = coilData.functionalDescription || [];
    if (functionalDesc.length > 0) {
      const wireData = functionalDesc[0].wire || {};
      if (Object.keys(wireData).length > 0) {
        wireDesc = wireFromDict(wireData);
      }
    }

    // Build turns
    const turnsData = coilData.turnsDescription || [];
    for (const turnData of turnsData) {
      const turnDesc = turnFromDict(turnData);

      // Get wire dimensions from turn data if available
      if (turnData.dimensions) {
        const dims = turnData.dimensions;
        if (dims.length >= 2) {
          // Determine wire type from crossSectionalShape
          const crossShape = (turnData.crossSectionalShape || '').toLowerCase();
          const isRectangular = crossShape === 'rectangular' || crossShape === 'foil' || crossShape === 'planar';
          
          wireDesc = {
            type: isRectangular ? WireType.Rectangular : WireType.Round,
            outerDiameter: dims[0],
            conductingDiameter: dims[0],
            outerWidth: dims[0],
            outerHeight: dims[1],
            numberConductors: 1
          };
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
   * makeBaseBox creates a box from Z=0 to Z=height, so we need to offset.
   * We want: X centered, Y centered, Z centered
   * @private
   */
  _makeBox(width, depth, height) {
    const { makeBaseBox } = this.r;
    // makeBaseBox creates box centered in XY but from Z=0 to Z=height
    // Offset by -height/2 to truly center it
    return makeBaseBox(width, depth, height).translate([0, 0, -height / 2]);
  }

  /**
   * Create a stadium (oblong) shape - a rectangle with semicircular ends.
   * The stadium is centered at origin with the longer axis along Y.
   * 
   * @param {number} halfWidth - Half of the width (X direction, the shorter dimension)
   * @param {number} halfDepth - Half of the total length (Y direction, includes semicircles)
   * @param {number} height - Height of the extrusion (Z direction)
   * @returns {Object} - Replicad solid
   * @private
   */
  _makeStadium(halfWidth, halfDepth, height) {
    const { makeCompound, makeCylinder } = this.r;
    
    // Stadium shape: two semicircles at Y = ±(halfDepth - halfWidth), connected by rectangle
    // The semicircle radius = halfWidth
    const semicircleRadius = halfWidth;
    const rectangleHalfLength = halfDepth - halfWidth;  // Distance from center to where semicircles start
    
    // If the column is actually round (halfDepth <= halfWidth), just make a cylinder
    if (rectangleHalfLength <= 0) {
      return makeCylinder(halfWidth, height, [0, 0, -height/2]);
    }
    
    const pieces = [];
    
    // Central rectangular section
    // Goes from Y = -rectangleHalfLength to Y = +rectangleHalfLength
    // Width = 2 * halfWidth (X direction)
    const centralRect = this._makeBox(halfWidth * 2, rectangleHalfLength * 2, height);
    pieces.push(centralRect);
    
    // +Y semicircle (at Y = +rectangleHalfLength)
    // Cylinder centered in Z: from -height/2 to +height/2
    const semicircleY1 = makeCylinder(semicircleRadius, height, [0, rectangleHalfLength, -height/2]);
    pieces.push(semicircleY1);
    
    // -Y semicircle (at Y = -rectangleHalfLength)
    const semicircleY2 = makeCylinder(semicircleRadius, height, [0, -rectangleHalfLength, -height/2]);
    pieces.push(semicircleY2);
    
    // Fuse all pieces together
    let result = pieces[0];
    for (let i = 1; i < pieces.length; i++) {
      result = result.fuse(pieces[i]);
    }
    
    return result;
  }

  /**
   * Create a half-stadium (EPX) shape - a rectangle with ONE semicircular end (on +Y side).
   * This is the column shape for EPX cores: flat on winding window side, round on back.
   * 
   * @param {number} halfWidth - Half of the width (X direction)
   * @param {number} halfDepth - Half of the total depth (Y direction, includes semicircle on +Y)
   * @param {number} height - Height of the extrusion (Z direction)
   * @returns {Object} - Replicad solid
   * @private
   */
  _makeHalfStadium(halfWidth, halfDepth, height) {
    const { makeCylinder } = this.r;
    
    // Half-stadium shape: semicircle at Y = +(halfDepth - halfWidth), flat at Y = -halfDepth
    // The semicircle radius = halfWidth
    const semicircleRadius = halfWidth;
    const rectangleHalfLength = halfDepth - halfWidth;  // Distance from center to where semicircle starts
    
    // If the shape is actually round (halfDepth <= halfWidth), just make a cylinder
    if (rectangleHalfLength <= 0) {
      return makeCylinder(halfWidth, height, [0, 0, -height/2]);
    }
    
    // Central rectangular section
    // The rectangle spans from Y = -halfDepth to Y = +rectangleHalfLength
    // Width = 2 * halfWidth (X direction)
    const rectDepth = halfDepth + rectangleHalfLength;  // From -halfDepth to +rectangleHalfLength
    const rectCenterY = (-halfDepth + rectangleHalfLength) / 2;  // Center of the rectangle in Y
    const centralRect = this._makeBox(halfWidth * 2, rectDepth, height)
      .translate([0, rectCenterY, 0]);
    
    // +Y semicircle (at Y = +rectangleHalfLength, which is halfDepth - halfWidth from center)
    // Cylinder centered in Z
    const semicircle = makeCylinder(semicircleRadius, height, [0, rectangleHalfLength, -height/2]);
    
    // Fuse rectangle and semicircle
    return centralRect.fuse(semicircle);
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

  /**
   * Create a quarter swept rectangle for rectangular wire corners.
   * Sweeps a rectangle profile along a 90° arc.
   * 
   * @param {number} majorRadius - Bend radius (distance from corner center to wire center)
   * @param {number} width - Rectangle width (perpendicular to arc, radial direction)
   * @param {number} height - Rectangle height (Z direction)
   * @param {Array} center - [x, y, z] position of arc center
   * @param {number} startAngleDeg - Starting angle in degrees (0=+X, 90=+Y, etc.)
   * @private
   */
  _makeQuarterSweptRectangle(majorRadius, width, height, center, startAngleDeg) {
    const { draw, getOC, Solid } = this.r;
    
    try {
      const oc = getOC();
      const startAngleRad = (startAngleDeg * Math.PI) / 180;
      
      // Use OpenCASCADE directly to create a swept rectangle
      const hw = width / 2;
      const hh = height / 2;
      
      // Create a rectangle face at the starting position
      // The rectangle is in the XZ plane, centered at (majorRadius, 0, 0)
      const p1 = new oc.gp_Pnt_3(majorRadius - hw, 0, -hh);
      const p2 = new oc.gp_Pnt_3(majorRadius + hw, 0, -hh);
      const p3 = new oc.gp_Pnt_3(majorRadius + hw, 0, hh);
      const p4 = new oc.gp_Pnt_3(majorRadius - hw, 0, hh);
      
      // Create edges
      const edge1 = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
      const edge2 = new oc.BRepBuilderAPI_MakeEdge_3(p2, p3).Edge();
      const edge3 = new oc.BRepBuilderAPI_MakeEdge_3(p3, p4).Edge();
      const edge4 = new oc.BRepBuilderAPI_MakeEdge_3(p4, p1).Edge();
      
      // Create wire from edges
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      wireMaker.Add_1(edge1);
      wireMaker.Add_1(edge2);
      wireMaker.Add_1(edge3);
      wireMaker.Add_1(edge4);
      const rectWire = wireMaker.Wire();
      
      // Create face from wire
      const faceMaker = new oc.BRepBuilderAPI_MakeFace_15(rectWire, true);
      const rectFace = faceMaker.Face();
      
      // Rotate the face to the start angle
      let faceToRevolve = rectFace;
      if (startAngleDeg !== 0) {
        const axis = new oc.gp_Ax1_2(
          new oc.gp_Pnt_3(0, 0, 0),
          new oc.gp_Dir_4(0, 0, 1)
        );
        const transform = new oc.gp_Trsf_1();
        transform.SetRotation_1(axis, startAngleRad);
        const transformer = new oc.BRepBuilderAPI_Transform_2(rectFace, transform, true);
        faceToRevolve = oc.TopoDS.Face_1(transformer.Shape());
      }
      
      // Create revolution axis through origin along Z
      const revolveAxis = new oc.gp_Ax1_2(
        new oc.gp_Pnt_3(0, 0, 0),
        new oc.gp_Dir_4(0, 0, 1)
      );
      
      // Revolve 90 degrees
      const revolver = new oc.BRepPrimAPI_MakeRevol_1(faceToRevolve, revolveAxis, Math.PI / 2, true);
      const sweptShape = revolver.Shape();
      
      const result = new Solid(sweptShape);
      return result.translate([center[0], center[1], center[2]]);
    } catch (e) {
      console.warn('Quarter swept rectangle failed:', e.message, '- using box approximation');
      // Fallback: use a box approximation at the corner
      return this._makeBox(width, width, height)
        .translate([center[0], center[1], center[2]]);
    }
  }

  /**
   * Create a half swept rectangle for rectangular wire on semicircular ends.
   * Sweeps a rectangle profile along a 180° arc.
   * 
   * @param {number} majorRadius - Bend radius (distance from arc center to wire center)
   * @param {number} width - Rectangle width (perpendicular to arc, radial direction)
   * @param {number} height - Rectangle height (Z direction)
   * @param {Array} center - [x, y, z] position of arc center
   * @param {number} startAngleDeg - Starting angle in degrees (0=+X, 90=+Y, etc.)
   * @private
   */
  _makeHalfSweptRectangle(majorRadius, width, height, center, startAngleDeg) {
    const { draw, getOC, Solid } = this.r;
    
    try {
      const oc = getOC();
      const startAngleRad = (startAngleDeg * Math.PI) / 180;
      
      // Use OpenCASCADE directly to create a swept rectangle
      // Create rectangle wire
      const hw = width / 2;
      const hh = height / 2;
      
      // Create a rectangle face at the starting position
      // The rectangle is in the XZ plane, centered at (majorRadius, 0, 0)
      const p1 = new oc.gp_Pnt_3(majorRadius - hw, 0, -hh);
      const p2 = new oc.gp_Pnt_3(majorRadius + hw, 0, -hh);
      const p3 = new oc.gp_Pnt_3(majorRadius + hw, 0, hh);
      const p4 = new oc.gp_Pnt_3(majorRadius - hw, 0, hh);
      
      // Create edges
      const edge1 = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
      const edge2 = new oc.BRepBuilderAPI_MakeEdge_3(p2, p3).Edge();
      const edge3 = new oc.BRepBuilderAPI_MakeEdge_3(p3, p4).Edge();
      const edge4 = new oc.BRepBuilderAPI_MakeEdge_3(p4, p1).Edge();
      
      // Create wire from edges
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      wireMaker.Add_1(edge1);
      wireMaker.Add_1(edge2);
      wireMaker.Add_1(edge3);
      wireMaker.Add_1(edge4);
      const rectWire = wireMaker.Wire();
      
      // Create face from wire
      const faceMaker = new oc.BRepBuilderAPI_MakeFace_15(rectWire, true);
      const rectFace = faceMaker.Face();
      
      // Rotate the face to the start angle
      if (startAngleDeg !== 0) {
        const axis = new oc.gp_Ax1_2(
          new oc.gp_Pnt_3(0, 0, 0),
          new oc.gp_Dir_4(0, 0, 1)
        );
        const transform = new oc.gp_Trsf_1();
        transform.SetRotation_1(axis, startAngleRad);
        const transformer = new oc.BRepBuilderAPI_Transform_2(rectFace, transform, true);
        const rotatedFace = oc.TopoDS.Face_1(transformer.Shape());
        
        // Create revolution axis through origin along Z
        const revolveAxis = new oc.gp_Ax1_2(
          new oc.gp_Pnt_3(0, 0, 0),
          new oc.gp_Dir_4(0, 0, 1)
        );
        
        // Revolve 180 degrees
        const revolver = new oc.BRepPrimAPI_MakeRevol_1(rotatedFace, revolveAxis, Math.PI, true);
        const sweptShape = revolver.Shape();
        
        const result = new Solid(sweptShape);
        return result.translate([center[0], center[1], center[2]]);
      } else {
        // Create revolution axis through origin along Z
        const revolveAxis = new oc.gp_Ax1_2(
          new oc.gp_Pnt_3(0, 0, 0),
          new oc.gp_Dir_4(0, 0, 1)
        );
        
        // Revolve 180 degrees
        const revolver = new oc.BRepPrimAPI_MakeRevol_1(rectFace, revolveAxis, Math.PI, true);
        const sweptShape = revolver.Shape();
        
        const result = new Solid(sweptShape);
        return result.translate([center[0], center[1], center[2]]);
      }
    } catch (e) {
      console.warn('Half swept rectangle failed:', e.message, '- using torus approximation');
      // Fallback: use torus with approximate radius
      const effectiveRadius = Math.min(width, height) / 2;
      return this._makeHalfTorus(majorRadius, effectiveRadius, center, startAngleDeg);
    }
  }

  /**
   * Create a full swept rectangle (360°) for rectangular wire on round columns.
   * Sweeps a rectangle profile along a full circle - like a torus but with rectangular cross-section.
   * 
   * @param {number} majorRadius - Bend radius (distance from center to wire center)
   * @param {number} width - Rectangle width (radial direction)
   * @param {number} height - Rectangle height (Z direction)
   * @param {Array} center - [x, y, z] position of center
   * @private
   */
  _makeFullSweptRectangle(majorRadius, width, height, center) {
    const { getOC, Solid } = this.r;
    
    try {
      const oc = getOC();
      
      const hw = width / 2;
      const hh = height / 2;
      
      // Create a rectangle face in the XZ plane, centered at (majorRadius, 0, 0)
      const p1 = new oc.gp_Pnt_3(majorRadius - hw, 0, -hh);
      const p2 = new oc.gp_Pnt_3(majorRadius + hw, 0, -hh);
      const p3 = new oc.gp_Pnt_3(majorRadius + hw, 0, hh);
      const p4 = new oc.gp_Pnt_3(majorRadius - hw, 0, hh);
      
      // Create edges
      const edge1 = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
      const edge2 = new oc.BRepBuilderAPI_MakeEdge_3(p2, p3).Edge();
      const edge3 = new oc.BRepBuilderAPI_MakeEdge_3(p3, p4).Edge();
      const edge4 = new oc.BRepBuilderAPI_MakeEdge_3(p4, p1).Edge();
      
      // Create wire from edges
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      wireMaker.Add_1(edge1);
      wireMaker.Add_1(edge2);
      wireMaker.Add_1(edge3);
      wireMaker.Add_1(edge4);
      const rectWire = wireMaker.Wire();
      
      // Create face from wire
      const faceMaker = new oc.BRepBuilderAPI_MakeFace_15(rectWire, true);
      const rectFace = faceMaker.Face();
      
      // Create revolution axis through origin along Z
      const revolveAxis = new oc.gp_Ax1_2(
        new oc.gp_Pnt_3(0, 0, 0),
        new oc.gp_Dir_4(0, 0, 1)
      );
      
      // Revolve 360 degrees (2π)
      const revolver = new oc.BRepPrimAPI_MakeRevol_1(rectFace, revolveAxis, 2 * Math.PI, true);
      const sweptShape = revolver.Shape();
      
      const result = new Solid(sweptShape);
      return result.translate([center[0], center[1], center[2]]);
    } catch (e) {
      console.warn('Full swept rectangle failed:', e.message, '- using torus approximation');
      // Fallback: use torus with approximate radius
      const effectiveRadius = Math.min(width, height) / 2;
      return this._makeTorus(majorRadius, effectiveRadius, center);
    }
  }

  /**
   * Create a half torus (180° arc) for semicircular turns around oblong columns.
   * 
   * @param {number} majorRadius - Bend radius (distance from arc center to wire center)
   * @param {number} minorRadius - Wire radius
   * @param {Array} center - [x, y, z] position of arc center
   * @param {number} startAngleDeg - Starting angle in degrees (0=+X, 90=+Y, etc.)
   *                                 The arc sweeps 180° CCW from this angle
   * @param {Array} axis - Revolution axis, default [0, 0, 1] (Z axis)
   * @private
   */
  _makeHalfTorus(majorRadius, minorRadius, center, startAngleDeg, axis = [0, 0, 1]) {
    const { Solid, getOC } = this.r;
    const oc = getOC();
    
    try {
      // Use BRepPrimAPI_MakeTorus_6 which takes (gp_Ax2, R1, R2, angle)
      // to create a partial torus with 180° sweep
      
      const originPnt = new oc.gp_Pnt_3(0, 0, 0);
      const zDir = new oc.gp_Dir_4(axis[0], axis[1], axis[2]);
      
      // Start direction based on startAngleDeg
      const startAngleRad = (startAngleDeg * Math.PI) / 180;
      const xRefX = Math.cos(startAngleRad);
      const xRefY = Math.sin(startAngleRad);
      const xDir = new oc.gp_Dir_4(xRefX, xRefY, 0);
      
      const ax2 = new oc.gp_Ax2_2(originPnt, zDir, xDir);
      
      // Create partial torus: majorRadius, minorRadius, angle (180° = π)
      const torusMaker = new oc.BRepPrimAPI_MakeTorus_6(ax2, majorRadius, minorRadius, Math.PI);
      const torusShape = torusMaker.Shape();
      
      // Wrap in replicad Solid and translate to center
      const halfTorus = new Solid(torusShape);
      
      // Translate to the arc center
      return halfTorus.translate(center);
    } catch (e) {
      // Fallback: use a full torus
      console.warn('Half torus creation failed:', e.message);
      return this._makeTorus(majorRadius, minorRadius, center, axis);
    }
  }

  /**
   * Create a quarter swept rectangle for toroidal rectangular wire corners.
   * The corner transitions between a tube (along Y) and a radial segment (along X).
   * 
   * For toroidal turns, the sweep is around an axis parallel to Z, positioned at the corner center.
   * This is similar to concentric turn corners but positioned for toroidal geometry.
   * 
   * @param {number} bendRadius - Bend radius (distance from corner center to wire center)
   * @param {number} wireWidth - Wire width (the wider dimension, tangent to core surface)
   * @param {number} wireHeight - Wire height (the thinner dimension, in Z)
   * @param {Array} center - [x, y, z] position of corner center
   * @param {number} startAngleDeg - Starting angle in degrees (0=+X, 90=+Y, 180=-X, 270=-Y)
   * @param {number} ySign - +1 for top half, -1 for bottom half (determines sweep direction)
   * @private
   */
  _makeToroidalQuarterSweptRectangle(bendRadius, wireWidth, wireHeight, center, startAngleDeg, ySign) {
    const { getOC, Solid } = this.r;
    
    try {
      const oc = getOC();
      
      // The rectangle cross-section is wireWidth × wireHeight
      // For the corner, the rectangle is in the plane perpendicular to the sweep direction
      // The sweep is around Z axis at the corner center
      const hw = wireWidth / 2;
      const hh = wireHeight / 2;
      
      // Create rectangle at radius=bendRadius from origin, in XZ plane (Y=0)
      // The rectangle's width is in the radial direction (X), height is Z
      const p1 = new oc.gp_Pnt_3(bendRadius - hw, 0, -hh);
      const p2 = new oc.gp_Pnt_3(bendRadius + hw, 0, -hh);
      const p3 = new oc.gp_Pnt_3(bendRadius + hw, 0, hh);
      const p4 = new oc.gp_Pnt_3(bendRadius - hw, 0, hh);
      
      // Create edges
      const edge1 = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
      const edge2 = new oc.BRepBuilderAPI_MakeEdge_3(p2, p3).Edge();
      const edge3 = new oc.BRepBuilderAPI_MakeEdge_3(p3, p4).Edge();
      const edge4 = new oc.BRepBuilderAPI_MakeEdge_3(p4, p1).Edge();
      
      // Create wire from edges
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      wireMaker.Add_1(edge1);
      wireMaker.Add_1(edge2);
      wireMaker.Add_1(edge3);
      wireMaker.Add_1(edge4);
      const rectWire = wireMaker.Wire();
      
      // Create face from wire
      const faceMaker = new oc.BRepBuilderAPI_MakeFace_15(rectWire, true);
      const rectFace = faceMaker.Face();
      
      // Rotate the face to the start angle
      const startAngleRad = (startAngleDeg * Math.PI) / 180;
      let faceToRevolve = rectFace;
      if (Math.abs(startAngleDeg) > 0.001) {
        const rotAxis = new oc.gp_Ax1_2(
          new oc.gp_Pnt_3(0, 0, 0),
          new oc.gp_Dir_4(0, 0, 1)
        );
        const transform = new oc.gp_Trsf_1();
        transform.SetRotation_1(rotAxis, startAngleRad);
        const transformer = new oc.BRepBuilderAPI_Transform_2(rectFace, transform, true);
        faceToRevolve = oc.TopoDS.Face_1(transformer.Shape());
      }
      
      // Create revolution axis through origin along Z
      const revolveAxis = new oc.gp_Ax1_2(
        new oc.gp_Pnt_3(0, 0, 0),
        new oc.gp_Dir_4(0, 0, 1)
      );
      
      // Revolve 90 degrees (π/2) - direction depends on ySign
      // For +Y half: sweep counterclockwise (positive angle)
      // For -Y half: sweep clockwise (negative angle)
      const sweepAngle = (Math.PI / 2) * ySign;
      const revolver = new oc.BRepPrimAPI_MakeRevol_1(faceToRevolve, revolveAxis, sweepAngle, true);
      const sweptShape = revolver.Shape();
      
      const result = new Solid(sweptShape);
      return result.translate([center[0], center[1], center[2]]);
    } catch (e) {
      console.warn('Toroidal quarter swept rectangle failed:', e.message, '- using box approximation');
      // Fallback: use a box approximation at the corner
      return this._makeBox(wireWidth, wireWidth, wireHeight)
        .translate([center[0], center[1], center[2]]);
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
