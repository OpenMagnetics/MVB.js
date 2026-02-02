/**
 * Core Shape Classes for OpenMagnetics Virtual Builder
 * 
 * These classes implement the shape pieces for different core families
 * (T, E, C, P, PQ, RM, ETD, ER, EFD, EC, EQ, EP, EPX, U, UR, LP, PM, EL)
 * matching the Python cadquery_builder.py implementation.
 */

import { flattenDimensions, convertAxis } from './types.js';

// ==========================================================================
// Base Shape Class
// ==========================================================================

/**
 * Base class for core shape pieces.
 * Each shape implements getShapeBase() to create the 2D profile,
 * and optionally getShapeExtras() for post-processing.
 */
export class ShapePiece {
  constructor(replicad) {
    this.r = replicad;
  }

  /**
   * Get dimensions and valid subtypes for this shape.
   * @returns {Object}
   */
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F'] };
  }

  /**
   * Create the base 2D sketch for extrusion.
   * @param {Object} data - Shape data with dimensions
   * @returns {Object} - Replicad sketch
   */
  getShapeBase(data) {
    throw new Error('getShapeBase must be implemented by subclass');
  }

  /**
   * Apply post-processing transformations to the piece.
   * @param {Object} data - Shape data
   * @param {Object} piece - 3D piece
   * @returns {Object} - Modified piece
   */
  getShapeExtras(data, piece) {
    return piece;
  }

  /**
   * Get the negative space for the winding window.
   * @param {Object} dimensions - Shape dimensions
   * @returns {Object|null} - Replicad shape or null
   */
  getNegativeWindingWindow(dimensions) {
    return null;
  }

  /**
   * Create the full piece from shape data.
   * @param {Object} data - Shape data (must have 'dimensions' already flattened)
   * @returns {Object} - Replicad shape
   */
  getPiece(data) {
    const dimensions = data.dimensions;
    
    // Create base sketch and extrude
    const sketch = this.getShapeBase(data);
    const height = data.family !== 't' ? dimensions.B : dimensions.C;
    
    let base = sketch.extrude(height);
    
    // Subtract winding window if applicable
    const negativeWindingWindow = this.getNegativeWindingWindow(dimensions);
    if (negativeWindingWindow) {
      base = base.cut(negativeWindingWindow);
    }
    
    // Apply extras (translations, rotations)
    const piece = this.getShapeExtras(data, base);
    
    return piece;
  }

  /**
   * Apply machining (gap cutting) to the piece.
   * @param {Object} piece - The piece to machine
   * @param {Object} machining - Machining parameters
   * @param {Object} dimensions - Shape dimensions
   * @returns {Object} - Machined piece
   * 
   * Note: machining.coordinates[1] is the CENTER of the gap (like Python/CadQuery convention).
   * replicad's makeBaseBox creates from Z=0 to Z=height, so we offset by -height/2 to center it.
   */
  applyMachining(piece, machining, dimensions) {
    const { makeBaseBox } = this.r;
    const width = dimensions.A / 2;
    const height = machining.length;
    
    const xCoord = machining.coordinates[0] < 0 
      ? -dimensions.A / 2 
      : dimensions.A / 2;
    
    // Center the tool at zCoord
    const tool = makeBaseBox(width, dimensions.C, height)
      .translate([xCoord, 0, machining.coordinates[1] - height / 2]);
    
    return piece.cut(tool);
  }
}

// ==========================================================================
// Toroidal (T) Shape
// ==========================================================================

/**
 * Toroidal (T) shape - simple ring core.
 * Dimensions: A (outer diameter), B (inner diameter), C (height)
 */
export class TShape extends ShapePiece {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C'] };
  }

  /**
   * For toroidal cores, we create a cylinder and cut out the inner hole.
   * Override getPiece since we don't use sketch-based extrusion.
   */
  getPiece(data) {
    const { makeCylinder } = this.r;
    const dimensions = data.dimensions;
    
    // T shape: A = outer diameter, B = inner diameter, C = height
    const outerRadius = dimensions.A / 2;
    const innerRadius = dimensions.B / 2;
    const height = dimensions.C;
    
    // Create outer cylinder
    let core = makeCylinder(outerRadius, height);
    
    // Cut out inner cylinder (the hole)
    const innerCyl = makeCylinder(innerRadius, height);
    core = core.cut(innerCyl);
    
    // Apply extras (centering and orientation)
    return this.getShapeExtras(data, core);
  }

  getShapeBase(data) {
    // Not used for T shape - getPiece is overridden
    return null;
  }

  getShapeExtras(data, piece) {
    const dimensions = data.dimensions;
    const halfHeight = dimensions.C / 2;
    
    // Center the piece vertically (cylinder starts at Z=0)
    piece = piece.translate([0, 0, -halfHeight]);
    
    // Rotate to match Python orientation (rotate around X axis by 90 degrees)
    piece = piece.rotate(90, [0, 0, 0], [0, 1, 0]);
    
    return piece;
  }
}

// ==========================================================================
// E Shape (Base for ETD, ER, EFD, EC, EQ, EP, EPX, EL)
// ==========================================================================

/**
 * E shape - rectangular core with E cross-section.
 * Dimensions: A (width), B (height), C (depth), D (window height), E (window width), F (central column width)
 */
export class EShape extends ShapePiece {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F'] };
  }

  getShapeBase(data) {
    const { sketchRectangle } = this.r;
    const dimensions = data.dimensions;
    
    // Simple rectangular cross-section
    return sketchRectangle(dimensions.A, dimensions.C);
  }

  getNegativeWindingWindow(dimensions) {
    const { makeBaseBox } = this.r;
    
    // Create winding window cutout
    // Note: replicad's makeBaseBox creates a box from Z=0 to Z=height (not centered like CadQuery)
    // So we translate by (B-D) to put the window from Z=(B-D) to Z=B
    const windingWindowCube = makeBaseBox(dimensions.E, dimensions.C, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    // Create central column (to keep)
    const centralColumnCube = makeBaseBox(dimensions.F, dimensions.C, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    // Winding window is the cutout minus the central column
    return windingWindowCube.cut(centralColumnCube);
  }

  getShapeExtras(data, piece) {
    const dimensions = data.dimensions;
    
    // Translate so bottom is at Z=0
    return piece.translate([0, 0, -dimensions.B]);
  }

  /**
   * Apply machining (gap) to the core piece.
   * 
   * Note: machining.coordinates[1] is the CENTER of the gap (like Python/CadQuery convention).
   * replicad's makeBaseBox creates from Z=0 to Z=height, so we offset by -height/2 to center it.
   */
  applyMachining(piece, machining, dimensions) {
    const { makeBaseBox } = this.r;
    
    let width, length, xCoord, yCoord;
    
    if (machining.coordinates[0] === 0) {
      // Central column machining
      width = dimensions.F;
      length = dimensions.C;
      xCoord = 0;
      yCoord = 0;
      
      if (dimensions.K) {
        length = dimensions.C - dimensions.K;
        xCoord += dimensions.K;
      }
    } else {
      // Side column machining
      width = dimensions.A / 2;
      length = dimensions.C;
      xCoord = machining.coordinates[0] < 0 
        ? -dimensions.A / 2 
        : dimensions.A / 2;
      yCoord = 0;
    }
    
    const height = machining.length;
    const zCoord = machining.coordinates[1];
    
    // makeBaseBox creates from Z=0 to Z=height, translate to center at zCoord
    let tool = makeBaseBox(width, length, height)
      .translate([xCoord, yCoord, zCoord - height / 2]);
    
    // For side columns, subtract central column area
    if (machining.coordinates[0] !== 0) {
      const centralWidth = dimensions.F * 1.001;
      let centralLength = dimensions.C * 1.001;
      
      if (dimensions.K) {
        centralLength = (dimensions.C - dimensions.K * 2) * 1.001;
      }
      
      // Center the central tool at zCoord as well
      const centralTool = makeBaseBox(centralWidth, centralLength, height)
        .translate([0, 0, zCoord - height / 2]);
      
      tool = tool.cut(centralTool);
    }
    
    return piece.cut(tool);
  }
}

// ==========================================================================
// ER Shape (E with Round center column)
// ==========================================================================

export class ERShape extends EShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  }

  getNegativeWindingWindow(dimensions) {
    const { makeCylinder, makeBaseBox } = this.r;
    
    // Create cylindrical winding window
    // Note: replicad's makeCylinder creates from Z=0 to Z=height (not centered)
    const windingWindowCylinder = makeCylinder(dimensions.E / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    // Create central column cylinder (to keep)
    const centralColumnCylinder = makeCylinder(dimensions.F / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    let windingWindow = windingWindowCylinder.cut(centralColumnCylinder);
    
    // Add rectangular cutouts if G dimension exists
    if (dimensions.G && dimensions.G > dimensions.F) {
      if (dimensions.C > dimensions.F) {
        const length = dimensions.G;
        const width = dimensions.C;
        const height = dimensions.D;
        const cube = makeBaseBox(length, width, height)
          .translate([0, 0, dimensions.B - dimensions.D]);
        
        const cubeCut = cube.cut(centralColumnCylinder);
        windingWindow = windingWindow.fuse(cubeCut);
      }
    }
    
    return windingWindow;
  }

  /**
   * Apply machining (gap) to the core piece.
   * For round-center cores (ER, ETD), use a cylinder for central column machining.
   * 
   * Note: machining.coordinates[1] is the CENTER of the gap (like Python/CadQuery convention).
   * replicad's makeCylinder creates from Z=0 to Z=height, so we offset by -height/2 to center it.
   */
  applyMachining(piece, machining, dimensions) {
    const { makeBaseBox, makeCylinder } = this.r;
    
    const height = machining.length;
    const zCoord = machining.coordinates[1];
    
    if (machining.coordinates[0] === 0) {
      // Central column machining - use cylinder for round column
      // Cylinder is created from Z=0 to Z=height, translate to center at zCoord
      const radius = dimensions.F / 2;
      const tool = makeCylinder(radius, height)
        .translate([0, 0, zCoord - height / 2]);
      
      return piece.cut(tool);
    } else {
      // Side column machining - use rectangular tool
      // makeBaseBox creates from Z=0 to Z=height, translate to center at zCoord
      const width = dimensions.A / 2;
      const length = dimensions.C;
      const xCoord = machining.coordinates[0] < 0 
        ? -dimensions.A / 2 
        : dimensions.A / 2;
      
      let tool = makeBaseBox(width, length, height)
        .translate([xCoord, 0, zCoord - height / 2]);
      
      // Subtract central column area (use cylinder since center is round)
      const centralRadius = (dimensions.F / 2) * 1.001;
      const centralTool = makeCylinder(centralRadius, height)
        .translate([0, 0, zCoord - height / 2]);
      
      tool = tool.cut(centralTool);
      
      return piece.cut(tool);
    }
  }
}

// ==========================================================================
// ETD Shape (E with round center, extends ER)
// ==========================================================================

export class ETDShape extends ERShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F'] };
  }
}

// ==========================================================================
// EL Shape (Planar E / Planar EL, extends E)
// Planar EL cores may have F2 dimension for oblong/stadium central column.
// When F2 is present and different from F, the column is stadium-shaped.
// ==========================================================================

export class ELShape extends EShape {
  getDimensionsAndSubtypes() {
    // EL cores may have F2 (oblong column depth) and R (corner radius)
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'F2', 'R'] };
  }

  getNegativeWindingWindow(dimensions) {
    const { makeBaseBox, makeCylinder } = this.r;
    
    // Check if column is oblong (F2 defined and different from F)
    const hasOblongColumn = dimensions.F2 && Math.abs(dimensions.F2 - dimensions.F) > 0.0001;
    
    if (hasOblongColumn) {
      // Stadium-shaped winding window
      // F = column width (X direction, shorter)
      // F2 = column depth (Y direction, longer)
      
      // Create rectangular winding window cutout
      const windingWindowCube = makeBaseBox(dimensions.E, dimensions.C, dimensions.D)
        .translate([0, 0, dimensions.B - dimensions.D]);
      
      // Create stadium-shaped central column
      // Stadium: rectangle with semicircular ends along Y axis
      const halfWidth = dimensions.F / 2;  // X direction
      const halfDepth = dimensions.F2 / 2;  // Y direction
      const semicircleRadius = halfWidth;
      const rectHalfLength = halfDepth - semicircleRadius;
      
      let centralColumn;
      if (rectHalfLength <= 0) {
        // If F2 <= F, it's actually round
        centralColumn = makeCylinder(halfWidth, dimensions.D)
          .translate([0, 0, dimensions.B - dimensions.D]);
      } else {
        // Build stadium: center rectangle + two semicircles
        const centerRect = makeBaseBox(dimensions.F, rectHalfLength * 2, dimensions.D)
          .translate([0, 0, dimensions.B - dimensions.D]);
        
        const topSemicircle = makeCylinder(semicircleRadius, dimensions.D)
          .translate([0, rectHalfLength, dimensions.B - dimensions.D]);
        
        const bottomSemicircle = makeCylinder(semicircleRadius, dimensions.D)
          .translate([0, -rectHalfLength, dimensions.B - dimensions.D]);
        
        centralColumn = centerRect.fuse(topSemicircle).fuse(bottomSemicircle);
      }
      
      return windingWindowCube.cut(centralColumn);
    } else {
      // Rectangular column - use parent's implementation
      return super.getNegativeWindingWindow(dimensions);
    }
  }
}

// ==========================================================================
// EQ Shape (extends ER)
// ==========================================================================

export class EQShape extends ERShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  }
}

// ==========================================================================
// EC Shape (E with curved center cutout)
// ==========================================================================

export class ECShape extends ERShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'T', 's'] };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;

    const c = dimensions.C / 2;
    const a = dimensions.A / 2;
    const t = dimensions.T / 2;
    const s = dimensions.s / 2;

    // Create E-shaped cross-section with curved dents
    // Simplified version without arcs - use rectangles with rounded corners
    return draw()
      .movePointerTo([-a, c])
      .lineTo([a, c])
      .lineTo([a, s])
      .lineTo([t + s, s])
      .lineTo([t + s, -s])
      .lineTo([a, -s])
      .lineTo([a, -c])
      .lineTo([-a, -c])
      .lineTo([-a, -s])
      .lineTo([-(t + s), -s])
      .lineTo([-(t + s), s])
      .lineTo([-a, s])
      .close()
      .sketchOnPlane('XY');
  }
}

// ==========================================================================
// EP Shape (E with offset central column)
// ==========================================================================

export class EPShape extends EShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'K'] };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;

    const a = dimensions.A / 2;
    const topC = dimensions.C - dimensions.K;
    const bottomC = dimensions.K;

    return draw()
      .movePointerTo([-a, topC])
      .lineTo([a, topC])
      .lineTo([a, -bottomC])
      .lineTo([-a, -bottomC])
      .close()
      .sketchOnPlane('XY');
  }

  getNegativeWindingWindow(dimensions) {
    const { makeCylinder, makeBaseBox } = this.r;
    
    // Create cylindrical winding window
    // Note: replicad primitives start at Z=0 (not centered)
    const windingWindowCylinder = makeCylinder(dimensions.E / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    // Create central column cylinder (to keep)
    const centralColumnCylinder = makeCylinder(dimensions.F / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    let negativeWindingWindow = windingWindowCylinder.cut(centralColumnCylinder);

    // Top cube cutout if G dimension exists
    if (dimensions.G && dimensions.G > 0) {
      const length = dimensions.G;
      const width = dimensions.C;
      const height = dimensions.D;
      const topCube = makeBaseBox(length, width, height)
        .translate([0, width / 2 + dimensions.F / 2, dimensions.B - dimensions.D]);
      negativeWindingWindow = negativeWindingWindow.fuse(topCube);
    }

    // Bottom cube cutout
    const length = dimensions.E;
    const width = dimensions.C;
    const height = dimensions.D;
    let bottomCube = makeBaseBox(length, width, height)
      .translate([0, -width / 2, dimensions.B - dimensions.D]);
    bottomCube = bottomCube.cut(centralColumnCylinder);
    negativeWindingWindow = negativeWindingWindow.fuse(bottomCube);

    return negativeWindingWindow;
  }
}

// ==========================================================================
// EPX Shape (EP variant with elongated central column)
// ==========================================================================

export class EPXShape extends EPShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'K'] };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;

    const a = dimensions.A / 2;
    const columnLength = dimensions.K + dimensions.F / 2;
    const topC = dimensions.C - columnLength / 2;
    const bottomC = columnLength / 2;

    return draw()
      .movePointerTo([-a, topC])
      .lineTo([a, topC])
      .lineTo([a, -bottomC])
      .lineTo([-a, -bottomC])
      .close()
      .sketchOnPlane('XY');
  }

  getNegativeWindingWindow(dimensions) {
    const { makeCylinder, makeBaseBox } = this.r;
    
    const rectangularPartWidth = dimensions.K - dimensions.F / 2;
    const columnWidth = dimensions.K + dimensions.F / 2;

    // Create cylindrical winding window (offset)
    // Note: replicad primitives start at Z=0 (not centered)
    const windingWindowCylinder = makeCylinder(dimensions.E / 2, dimensions.D)
      .translate([0, rectangularPartWidth / 2, dimensions.B - dimensions.D]);
    
    // Create central column (rectangular center + cylinders at ends)
    const height = dimensions.D;
    const centralColumnCenter = makeBaseBox(dimensions.F, rectangularPartWidth, height)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    const centralColumnTopCylinder = makeCylinder(dimensions.F / 2, dimensions.D)
      .translate([0, rectangularPartWidth / 2, dimensions.B - dimensions.D]);
    
    const centralColumnBottomCylinder = makeCylinder(dimensions.F / 2, dimensions.D)
      .translate([0, -rectangularPartWidth / 2, dimensions.B - dimensions.D]);
    
    let centralColumn = centralColumnCenter.fuse(centralColumnTopCylinder).fuse(centralColumnBottomCylinder);
    
    let negativeWindingWindow = windingWindowCylinder.cut(centralColumn);

    // Top cube cutout if G dimension exists
    if (dimensions.G && dimensions.G > 0) {
      const length = dimensions.G;
      const width = dimensions.C;
      const topCube = makeBaseBox(length, width, height)
        .translate([0, width / 2 + columnWidth / 2, dimensions.B - dimensions.D]);
      negativeWindingWindow = negativeWindingWindow.fuse(topCube);
    }

    // Bottom cube cutout
    const length = dimensions.E;
    const width = dimensions.C;
    let bottomCube = makeBaseBox(length, width, height)
      .translate([0, -width / 2 + rectangularPartWidth / 2, dimensions.B - dimensions.D]);
    bottomCube = bottomCube.cut(centralColumn);
    negativeWindingWindow = negativeWindingWindow.fuse(bottomCube);

    return negativeWindingWindow;
  }
}

// ==========================================================================
// EFD Shape (E with flat design for low profile)
// ==========================================================================

export class EFDShape extends EShape {
  getDimensionsAndSubtypes() {
    return { 
      1: ['A', 'B', 'C', 'D', 'E', 'F', 'F2', 'K', 'q'],
      2: ['A', 'B', 'C', 'D', 'E', 'F', 'F2', 'K', 'q']
    };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;

    const a = dimensions.A / 2;
    const topC = dimensions.C - dimensions.K - dimensions.F2 / 2;
    const bottomC = dimensions.K + dimensions.F2 / 2;
    const dentHeight = dimensions.C * 2 / 5;
    const dentTopWidth = dimensions.F / 2;
    const dentBottomWidth = dimensions.F / 2 - dimensions.q;

    if (dimensions.K > 0) {
      const minidentSemiwidth = dimensions.F / 2 - dimensions.q;
      const minidentDepth = dimensions.K;
      
      return draw()
        .movePointerTo([-a, topC])
        .lineTo([-dentTopWidth, topC])
        .lineTo([-dentBottomWidth, topC - dentHeight])
        .lineTo([dentBottomWidth, topC - dentHeight])
        .lineTo([dentTopWidth, topC])
        .lineTo([a, topC])
        .lineTo([a, -bottomC])
        .lineTo([minidentSemiwidth, -bottomC])
        .lineTo([minidentSemiwidth, -bottomC + minidentDepth])
        .lineTo([-minidentSemiwidth, -bottomC + minidentDepth])
        .lineTo([-minidentSemiwidth, -bottomC])
        .lineTo([-a, -bottomC])
        .close()
        .sketchOnPlane('XY');
    } else {
      return draw()
        .movePointerTo([-a, topC])
        .lineTo([-dentTopWidth, topC])
        .lineTo([-dentBottomWidth, topC - dentHeight])
        .lineTo([dentBottomWidth, topC - dentHeight])
        .lineTo([dentTopWidth, topC])
        .lineTo([a, topC])
        .lineTo([a, -bottomC])
        .lineTo([-a, -bottomC])
        .close()
        .sketchOnPlane('XY');
    }
  }

  getNegativeWindingWindow(dimensions) {
    const { makeBaseBox } = this.r;
    
    // Note: replicad's makeBaseBox starts at Z=0 (not centered)
    return makeBaseBox(dimensions.E, dimensions.C * 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
  }

  getShapeExtras(data, piece) {
    const { draw } = this.r;
    const dimensions = data.dimensions;

    // Add central column with chamfered corners
    // The chamfer amount is dimensions.q
    const f = dimensions.F / 2;
    const f2 = dimensions.F2 / 2;
    const q = dimensions.q;
    
    // Create rectangle with chamfered corners
    const columnSketch = draw()
      .movePointerTo([f - q, f2])
      .lineTo([-f + q, f2])
      .lineTo([-f, f2 - q])
      .lineTo([-f, -f2 + q])
      .lineTo([-f + q, -f2])
      .lineTo([f - q, -f2])
      .lineTo([f, -f2 + q])
      .lineTo([f, f2 - q])
      .close()
      .sketchOnPlane('XY');
    
    const column = columnSketch.extrude(dimensions.B);
    
    piece = piece.fuse(column);
    piece = piece.translate([0, 0, -dimensions.B]);
    return piece;
  }
}

// ==========================================================================
// LP Shape (Low Profile, extends ER)
// ==========================================================================

export class LPShape extends ERShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  }

  getNegativeWindingWindow(dimensions) {
    const { makeCylinder, makeBaseBox } = this.r;
    
    // Create cylindrical winding window
    // Note: replicad primitives start at Z=0 (not centered)
    const windingWindowCylinder = makeCylinder(dimensions.E / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    // Create central column cylinder (to keep)
    const centralColumnCylinder = makeCylinder(dimensions.F / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    let negativeWindingWindow = windingWindowCylinder.cut(centralColumnCylinder);

    // Lateral top cube
    const length = dimensions.G;
    const width = dimensions.C;
    const height = dimensions.D;
    const lateralTopCube = makeBaseBox(length, width, height)
      .translate([0, width / 2 + dimensions.F / 2, dimensions.B - dimensions.D]);
    negativeWindingWindow = negativeWindingWindow.fuse(lateralTopCube);

    // Lateral bottom cube
    let lateralBottomCube = makeBaseBox(dimensions.E, dimensions.C, dimensions.D)
      .translate([0, -width / 2, dimensions.B - dimensions.D]);
    lateralBottomCube = lateralBottomCube.cut(centralColumnCylinder);
    negativeWindingWindow = negativeWindingWindow.fuse(lateralBottomCube);

    return negativeWindingWindow;
  }
}

// ==========================================================================
// C Shape
// ==========================================================================

/**
 * C shape - C-core (like E but open on one side).
 * Dimensions: A (total width), B (height), C (depth), D (window height), E (window width)
 */
export class CShape extends ShapePiece {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E'] };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;
    
    const halfC = dimensions.C / 2;
    const windingColumnWidth = (dimensions.A - dimensions.E) / 2;
    const leftA = dimensions.A - windingColumnWidth / 2;
    const rightA = windingColumnWidth / 2;
    
    // Create C-shaped cross-section
    return draw()
      .movePointerTo([rightA, halfC])
      .lineTo([-leftA, halfC])
      .lineTo([-leftA, -halfC])
      .lineTo([rightA, -halfC])
      .close()
      .sketchOnPlane('XY');
  }

  getNegativeWindingWindow(dimensions) {
    const { makeBaseBox } = this.r;
    
    const windingColumnWidth = (dimensions.A - dimensions.E) / 2;
    
    // Note: replicad's makeBaseBox starts at Z=0 (not centered)
    return makeBaseBox(dimensions.E, dimensions.C * 2, dimensions.D)
      .translate([
        -(windingColumnWidth / 2 + dimensions.E / 2),
        0,
        dimensions.B - dimensions.D
      ]);
  }

  getShapeExtras(data, piece) {
    const dimensions = data.dimensions;
    return piece.translate([0, 0, -dimensions.B]);
  }
}

// ==========================================================================
// U Shape
// ==========================================================================

export class UShape extends ShapePiece {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E'] };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;
    
    const c = dimensions.C / 2;
    const windingColumnWidth = (dimensions.A - dimensions.E) / 2;
    const leftA = dimensions.A - windingColumnWidth / 2;
    const rightA = windingColumnWidth / 2;
    
    return draw()
      .movePointerTo([rightA, c])
      .lineTo([-leftA, c])
      .lineTo([-leftA, -c])
      .lineTo([rightA, -c])
      .close()
      .sketchOnPlane('XY');
  }

  getNegativeWindingWindow(dimensions) {
    const { makeBaseBox } = this.r;
    
    const windingColumnWidth = (dimensions.A - dimensions.E) / 2;
    
    // Note: replicad's makeBaseBox starts at Z=0 (not centered)
    return makeBaseBox(dimensions.E, dimensions.C * 2, dimensions.D)
      .translate([
        -(windingColumnWidth / 2 + dimensions.E / 2),
        0,
        dimensions.B - dimensions.D
      ]);
  }

  getShapeExtras(data, piece) {
    const dimensions = data.dimensions;
    return piece.translate([0, 0, -dimensions.B]);
  }

  /**
   * Apply machining for U shape.
   * Note: machining.coordinates[1] is the CENTER of the gap.
   * replicad's makeBaseBox creates from Z=0 to Z=height, so we offset by -height/2 to center it.
   */
  applyMachining(piece, machining, dimensions) {
    const { makeBaseBox } = this.r;
    const windingColumnWidth = (dimensions.A - dimensions.E) / 2;
    const height = machining.length;
    
    // Convert coordinates and apply centering offset
    const coords = convertAxis(machining.coordinates);
    const gap = makeBaseBox(windingColumnWidth, dimensions.C, height)
      .translate([coords[0], coords[1], coords[2] - height / 2]);
    
    return piece.cut(gap);
  }
}

// ==========================================================================
// UR Shape (U with Round column)
// ==========================================================================

export class URShape extends ShapePiece {
  getDimensionsAndSubtypes() {
    return { 
      1: ['A', 'B', 'C', 'D', 'H'],
      2: ['A', 'B', 'C', 'D', 'H'],
      3: ['A', 'B', 'C', 'D', 'F', 'H'],
      4: ['A', 'B', 'C', 'D', 'F', 'G', 'H']
    };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;
    const familySubtype = data.familySubtype || '1';
    
    const c = dimensions.C / 2;
    
    if (familySubtype === '1' || familySubtype === '3') {
      const windingColumnWidth = familySubtype === '3' ? dimensions.F : dimensions.C;
      const leftA = dimensions.A - windingColumnWidth / 2;
      
      // Simplified: use rectangle instead of arc
      return draw()
        .movePointerTo([0, c])
        .lineTo([-leftA, c])
        .lineTo([-leftA, -c])
        .lineTo([0, -c])
        .lineTo([windingColumnWidth / 2, -c])
        .lineTo([windingColumnWidth / 2, c])
        .close()
        .sketchOnPlane('XY');
    } else {
      const windingColumnWidth = familySubtype === '4' ? dimensions.F : dimensions.C;
      const leftA = dimensions.A - windingColumnWidth;
      
      return draw()
        .movePointerTo([0, c])
        .lineTo([-leftA, c])
        .lineTo([-leftA, -c])
        .lineTo([0, -c])
        .close()
        .sketchOnPlane('XY');
    }
  }

  getNegativeWindingWindow(dimensions) {
    const { makeBaseBox } = this.r;
    
    // Note: replicad's makeBaseBox starts at Z=0 (not centered)
    return makeBaseBox(dimensions.A * 2, dimensions.C * 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
  }

  getShapeExtras(data, piece) {
    const { makeCylinder, makeBaseBox } = this.r;
    const dimensions = data.dimensions;
    const familySubtype = data.familySubtype || '1';
    
    if (familySubtype === '1') {
      const windingColumnWidth = dimensions.C;
      // Add winding column (cylinder)
      // Note: replicad primitives start at Z=0 (not centered)
      const windingColumn = makeCylinder(dimensions.C / 2, dimensions.D)
        .translate([0, 0, dimensions.B - dimensions.D]);
      
      // Add lateral column (box)
      const lateralColumn = makeBaseBox(dimensions.H, dimensions.C, dimensions.D)
        .translate([-(dimensions.A - windingColumnWidth / 2 - dimensions.H / 2), 0, dimensions.B - dimensions.D]);
      
      piece = piece.fuse(windingColumn).fuse(lateralColumn);
    } else if (familySubtype === '2') {
      const windingColumnWidth = dimensions.C;
      // Add winding column (cylinder)
      const windingColumn = makeCylinder(dimensions.C / 2, dimensions.B);
      
      // Add lateral column (cylinder)
      const lateralColumn = makeCylinder(dimensions.C / 2, dimensions.B)
        .translate([-(dimensions.A - windingColumnWidth), 0, 0]);
      
      piece = piece.fuse(windingColumn).fuse(lateralColumn);
    } else if (familySubtype === '3') {
      const windingColumnWidth = dimensions.F;
      // Add winding column (cylinder)
      const windingColumn = makeCylinder(dimensions.F / 2, dimensions.D)
        .translate([0, 0, dimensions.B - dimensions.D]);
      
      // Add lateral column (box)
      const lateralColumn = makeBaseBox(dimensions.H, dimensions.C, dimensions.D)
        .translate([-(dimensions.A - windingColumnWidth / 2 - dimensions.H / 2), 0, dimensions.B - dimensions.D]);
      
      piece = piece.fuse(windingColumn).fuse(lateralColumn);
    } else if (familySubtype === '4') {
      // Add winding column (cylinder)
      const windingColumn = makeCylinder(dimensions.F / 2, dimensions.B);
      
      // Add lateral column (cylinder)
      const lateralColumn = makeCylinder(dimensions.F / 2, dimensions.B)
        .translate([-(dimensions.A - dimensions.F / 2 - dimensions.F / 2), 0, 0]);
      
      piece = piece.fuse(windingColumn).fuse(lateralColumn);
    }
    
    piece = piece.translate([0, 0, -dimensions.B]);
    return piece;
  }
}

// ==========================================================================
// P Shape (Pot core - round)
// ==========================================================================

export class PShape extends ShapePiece {
  getDimensionsAndSubtypes() {
    return { 
      1: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      2: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      3: ['A', 'B', 'D', 'E', 'F', 'G', 'H'],
      4: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    };
  }

  getShapeBase(data) {
    const { sketchCircle } = this.r;
    const dimensions = data.dimensions;
    
    // Create circular cross-section
    return sketchCircle(dimensions.A / 2);
  }

  getNegativeWindingWindow(dimensions) {
    const { makeCylinder } = this.r;
    
    // Create cylindrical winding window
    // Note: replicad's makeCylinder starts at Z=0 (not centered)
    const windingWindowCylinder = makeCylinder(dimensions.E / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    // Create central column cylinder (to keep)
    const centralColumnCylinder = makeCylinder(dimensions.F / 2, dimensions.D)
      .translate([0, 0, dimensions.B - dimensions.D]);
    
    return windingWindowCylinder.cut(centralColumnCylinder);
  }

  getShapeExtras(data, piece) {
    const { makeBaseBox, makeCylinder } = this.r;
    const dimensions = data.dimensions;
    const familySubtype = data.familySubtype || '1';
    
    if (familySubtype === '1' || familySubtype === '2') {
      // Lateral cuts
      // Note: replicad's makeBaseBox starts at Z=0 (not centered)
      const length = (dimensions.A - dimensions.F) / 2;
      const width = dimensions.G;
      const height = dimensions.D;
      
      const lateralRightCutBox = makeBaseBox(length, width, height)
        .translate([length / 2 + dimensions.F / 2, 0, dimensions.B - dimensions.D]);
      
      const lateralLeftCutBox = makeBaseBox(length, width, height)
        .translate([-(length / 2 + dimensions.F / 2), 0, dimensions.B - dimensions.D]);
      
      piece = piece.cut(lateralRightCutBox);
      piece = piece.cut(lateralLeftCutBox);
      
      if (familySubtype === '2') {
        // Additional dent cuts
        let c = dimensions.C / 2;
        if (!dimensions.C || dimensions.C <= 0) {
          c = Math.floor(dimensions.E * Math.cos(Math.asin(dimensions.G / dimensions.E)) / 2 * 0.95 * 1000000) / 1000000;
        }
        
        const dentLength = dimensions.A / 2 - c;
        const dentWidth = dimensions.G;
        const dentHeight = dimensions.B;
        
        const rightDentBox = makeBaseBox(dentLength, dentWidth, dentHeight)
          .translate([dentLength / 2 + c, 0, 0]);
        piece = piece.cut(rightDentBox);
        
        const leftDentBox = makeBaseBox(dentLength, dentWidth, dentHeight)
          .translate([-(dentLength / 2 + c), 0, 0]);
        piece = piece.cut(leftDentBox);
      }
    } else if (familySubtype === '3') {
      // Hole cuts
      const holeWidth = dimensions.G / 2;
      const holeLength = (dimensions.E - dimensions.F) / 2 - holeWidth;
      const holeHeight = dimensions.B;
      
      let hole = makeBaseBox(holeLength, holeWidth, holeHeight)
        .translate([holeWidth / 2 + holeLength / 2 + dimensions.F / 2, 0, 0]);
      
      const holeRound1 = makeCylinder(holeWidth / 2, holeHeight)
        .translate([holeWidth / 2 + dimensions.F / 2, 0, holeHeight / 2]);
      
      const holeRound2 = makeCylinder(holeWidth / 2, holeHeight)
        .translate([holeWidth / 2 + holeLength + dimensions.F / 2, 0, holeHeight / 2]);
      
      hole = hole.fuse(holeRound1).fuse(holeRound2);
      piece = piece.cut(hole);
      
      // Mirror hole
      hole = hole.translate([-(holeWidth + holeLength + dimensions.F), 0, 0]);
      piece = piece.cut(hole);
    }
    
    // Central hole if H dimension exists
    if (dimensions.H && dimensions.H > 0) {
      // Note: replicad's makeCylinder starts at Z=0 (not centered)
      const centralHole = makeCylinder(dimensions.H / 2, dimensions.B);
      piece = piece.cut(centralHole);
    }
    
    piece = piece.translate([0, 0, -dimensions.B]);
    return piece;
  }

  /**
   * Apply machining (gap cutting) for P shapes.
   * P shapes have round central columns, so we need proper central column handling.
   * 
   * Note: machining.coordinates[1] is the CENTER of the gap (like Python/CadQuery convention).
   * replicad's makeBaseBox creates from Z=0 to Z=height, so we offset by -height/2 to center it.
   */
  applyMachining(piece, machining, dimensions) {
    const { makeBaseBox } = this.r;
    
    if (machining.coordinates[0] === 0) {
      // Central column machining - use a box matching Python's implementation
      // Python uses a box with width=F, length=F for central column
      const width = dimensions.F;
      const length = dimensions.F;
      const height = machining.length;
      
      // Center the tool at zCoord
      const tool = makeBaseBox(width, length, height)
        .translate([0, 0, machining.coordinates[1] - height / 2]);
      
      return piece.cut(tool);
    } else {
      // Side machining - use base implementation
      const width = dimensions.A / 2;
      const height = machining.length;
      
      const xCoord = machining.coordinates[0] < 0 
        ? -dimensions.A / 2 
        : dimensions.A / 2;
      
      // Center the tool at zCoord
      const tool = makeBaseBox(width, dimensions.A, height)
        .translate([xCoord, 0, machining.coordinates[1] - height / 2]);
      
      return piece.cut(tool);
    }
  }
}

// ==========================================================================
// PQ Shape (P with Q-shaped base)
// ==========================================================================

export class PQShape extends PShape {
  getDimensionsAndSubtypes() {
    return { 1: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  }

  getShapeBase(data) {
    const { draw, sketchCircle } = this.r;
    const dimensions = data.dimensions;
    
    // Calculate derived dimensions
    if (!dimensions.L || dimensions.L === 0) {
      dimensions.L = dimensions.F + (dimensions.C - dimensions.F) / 3;
    }
    if (!dimensions.J || dimensions.J === 0) {
      dimensions.J = dimensions.F / 2;
    }
    
    let gAngle;
    if (dimensions.G) {
      gAngle = Math.asin(dimensions.G / dimensions.E);
    } else {
      gAngle = Math.asin((dimensions.E - ((dimensions.E - dimensions.F) / 2)) / dimensions.E);
    }
    
    const c = dimensions.C / 2;
    const a = dimensions.A / 2;
    const e = dimensions.E / 2;
    const f = dimensions.F / 2;
    
    const eSinG = e * Math.sin(gAngle);
    const eCosG = e * Math.cos(gAngle);
    
    // Python creates: central circle + two separate halves (right and left)
    // We need to do the same - the halves do NOT connect through the center
    
    // Central circle (matches Python's .circle(f, mode="a", tag="central_circle"))
    const centralCircle = sketchCircle(f);
    
    // Right half (positive X side) - closed polygon from outer edge to J/4 line
    const rightHalf = draw()
      .movePointerTo([a, -c])
      .lineTo([a, c])
      .lineTo([eSinG, c])
      .lineTo([eSinG, eCosG])
      .lineTo([dimensions.J / 2, dimensions.L / 2])
      .lineTo([dimensions.J / 4, dimensions.L / 4])
      .lineTo([dimensions.J / 4, -dimensions.L / 4])
      .lineTo([dimensions.J / 2, -dimensions.L / 2])
      .lineTo([eSinG, -eCosG])
      .lineTo([eSinG, -c])
      .close()
      .sketchOnPlane('XY');
    
    // Left half (negative X side) - closed polygon from outer edge to -J/4 line
    const leftHalf = draw()
      .movePointerTo([-a, -c])
      .lineTo([-a, c])
      .lineTo([-eSinG, c])
      .lineTo([-eSinG, eCosG])
      .lineTo([-dimensions.J / 2, dimensions.L / 2])
      .lineTo([-dimensions.J / 4, dimensions.L / 4])
      .lineTo([-dimensions.J / 4, -dimensions.L / 4])
      .lineTo([-dimensions.J / 2, -dimensions.L / 2])
      .lineTo([-eSinG, -eCosG])
      .lineTo([-eSinG, -c])
      .close()
      .sketchOnPlane('XY');
    
    // Return all three sketches to be combined
    // Store them for later combination in getPiece
    this._pqSketches = { centralCircle, rightHalf, leftHalf };
    
    // Return the combined area for now - we'll handle this in getPiece
    return centralCircle;
  }
  
  getPiece(data) {
    const dimensions = data.dimensions;
    
    // Create derived dimensions if not present
    if (!dimensions.L || dimensions.L === 0) {
      dimensions.L = dimensions.F + (dimensions.C - dimensions.F) / 3;
    }
    if (!dimensions.J || dimensions.J === 0) {
      dimensions.J = dimensions.F / 2;
    }
    
    // Get the three sketches
    this.getShapeBase(data);
    const { centralCircle, rightHalf, leftHalf } = this._pqSketches;
    
    // Extrude each to full height B
    const centralColumn = centralCircle.extrude(dimensions.B);
    const rightPiece = rightHalf.extrude(dimensions.B);
    const leftPiece = leftHalf.extrude(dimensions.B);
    
    // Fuse all three pieces
    let piece = centralColumn.fuse(rightPiece).fuse(leftPiece);
    
    // Apply winding window cut (inherited from P)
    const negativeWindingWindow = this.getNegativeWindingWindow(dimensions);
    piece = piece.cut(negativeWindingWindow);
    
    // Apply extras (translate by -B)
    piece = this.getShapeExtras(data, piece);
    
    return piece;
  }

  getShapeExtras(data, piece) {
    const dimensions = data.dimensions;
    piece = piece.translate([0, 0, -dimensions.B]);
    return piece;
  }
}

// ==========================================================================
// RM Shape (Rectangular Module)
// ==========================================================================

export class RMShape extends PShape {
  getDimensionsAndSubtypes() {
    return { 
      1: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],
      2: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],
      3: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],
      4: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J']
    };
  }

  getShapeBase(data) {
    const { draw } = this.r;
    const dimensions = data.dimensions;
    const familySubtype = data.familySubtype || '1';
    
    const p = Math.sqrt(2) * dimensions.J - dimensions.A;
    const alpha = Math.asin(dimensions.G / dimensions.E);
    const z = dimensions.E / 2 * Math.cos(alpha);
    const c = dimensions.C / 2;
    const g = dimensions.G / 2;
    const a = dimensions.A / 2;
    const e = dimensions.E / 2;
    const f = dimensions.F / 2;
    
    let t, n, r, s;
    
    if (familySubtype === '1') {
      t = 0;
      n = (z - c) / g;
      r = (a + p / 2 - c + n * t) / (n + 1);
      s = n * r + c;
    } else if (familySubtype === '2') {
      t = f * Math.sin(Math.acos(c / f));
      n = (z - c) / g;
      r = (a + p / 2 - c + n * t) / (n + 1);
      s = n * r + c;
    } else if (familySubtype === '3') {
      t = c - e * Math.cos(Math.asin(g / e)) + g;
      n = (z - c) / g;
      r = (a + p / 2 - c + n * t) / (n + 1);
      s = n * r + c;
    } else {
      t = 0;
      n = 1;
      r = (a + p / 2 - c + n * t) / (n + 1);
      s = n * r + c;
    }
    
    // Build the RM shape
    if (familySubtype === '3') {
      return draw()
        .movePointerTo([a, -p / 2])
        .lineTo([a, p / 2])
        .lineTo([r, s])
        .lineTo([t, c])
        .lineTo([-t, c])
        .lineTo([-r, s])
        .lineTo([-a, p / 2])
        .lineTo([-a, -p / 2])
        .lineTo([-r, -s])
        .lineTo([-t, -c])
        .lineTo([t, -c])
        .lineTo([r, -s])
        .close()
        .sketchOnPlane('XY');
    } else if (familySubtype === '4') {
      return draw()
        .movePointerTo([a, -p / 2])
        .lineTo([a, p / 2])
        .lineTo([r, s])
        .lineTo([-r, s])
        .lineTo([-a, p / 2])
        .lineTo([-a, -p / 2])
        .lineTo([-r, -s])
        .lineTo([r, -s])
        .close()
        .sketchOnPlane('XY');
    } else {
      return draw()
        .movePointerTo([a, -p / 2])
        .lineTo([a, p / 2])
        .lineTo([r, s])
        .lineTo([t, c])
        .lineTo([-t, c])
        .lineTo([-r, s])
        .lineTo([-a, p / 2])
        .lineTo([-a, -p / 2])
        .lineTo([-r, -s])
        .lineTo([-t, -c])
        .lineTo([t, -c])
        .lineTo([r, -s])
        .close()
        .sketchOnPlane('XY');
    }
  }

  getShapeExtras(data, piece) {
    const { makeCylinder } = this.r;
    const dimensions = data.dimensions;
    
    // Central hole if H dimension exists
    if (dimensions.H && dimensions.H > 0) {
      // Note: replicad's makeCylinder starts at Z=0 (not centered)
      const hole = makeCylinder(dimensions.H / 2, dimensions.B);
      piece = piece.cut(hole);
    }
    
    piece = piece.translate([0, 0, -dimensions.B]);
    return piece;
  }
}

// ==========================================================================
// PM Shape (Pot Module - variant with arcs)
// ==========================================================================

export class PMShape extends PShape {
  getDimensionsAndSubtypes() {
    return { 
      1: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'b', 't', 'alpha'],
      2: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'b', 't', 'alpha']
    };
  }

  getShapeBase(data) {
    const { sketchCircle } = this.r;
    const dimensions = data.dimensions;
    
    // Use circular base like P shape
    return sketchCircle(dimensions.A / 2);
  }

  getShapeExtras(data, piece) {
    const { makeCylinder, draw } = this.r;
    const dimensions = data.dimensions;
    const familySubtype = data.familySubtype || '1';
    
    const c = dimensions.C / 2;
    const a = dimensions.A / 2;
    const f = dimensions.F / 2;

    // Default alpha based on subtype (angle at which openings meet at center)
    let alpha = dimensions.alpha;
    if (!alpha || alpha === 0) {
      alpha = familySubtype === '1' ? 120 : 90;
    }
    const halfAlphaRad = (alpha / 2 / 180) * Math.PI;

    // Calculate wedge geometry
    // The wedge apex is at (0, ±C) and opens outward at angle alpha
    // The wedge needs to extend past the outer radius A/2 to fully cut through
    const wedgeLength = a * 1.5;  // Extend past outer radius
    
    // Calculate wedge half-width at the outer edge
    const wedgeHalfWidth = wedgeLength * Math.tan(halfAlphaRad);

    // Create wedge-shaped cuts
    const wedgeHeight = dimensions.B;
    let wedge;
    
    if (familySubtype === '1') {
      // Subtype 1: Pointed wedge - apex comes to a point at (0, ±c)
      const wedgeSketch = draw()
        .movePointerTo([0, 0])  // apex (point)
        .lineTo([wedgeHalfWidth, wedgeLength])  // right corner
        .lineTo([-wedgeHalfWidth, wedgeLength])  // left corner
        .close()
        .sketchOnPlane('XY');
      
      wedge = wedgeSketch.extrude(wedgeHeight);
    } else {
      // Subtype 2: Truncated wedge - flat edge of width F at the apex
      // The flat edge is at Y=0 (which will be translated to Y=±c)
      // and spans from X=-f to X=+f
      const wedgeSketch = draw()
        .movePointerTo([-f, 0])  // left side of flat edge
        .lineTo([f, 0])  // right side of flat edge (width = F)
        .lineTo([wedgeHalfWidth, wedgeLength])  // right corner
        .lineTo([-wedgeHalfWidth, wedgeLength])  // left corner
        .close()
        .sketchOnPlane('XY');
      
      wedge = wedgeSketch.extrude(wedgeHeight);
    }
    
    // Position and cut the +Y opening (apex/flat at Y = +c)
    const topWedge = wedge.clone().translate([0, c, 0]);
    piece = piece.cut(topWedge);
    
    // Position and cut the -Y opening (apex/flat at Y = -c, rotated 180°)
    const bottomWedge = wedge.rotate(180, [0, 0, 0], [0, 0, 1]).translate([0, -c, 0]);
    piece = piece.cut(bottomWedge);
    
    // Add central column (full height)
    const column = makeCylinder(dimensions.F / 2, dimensions.B);
    piece = piece.fuse(column);
    
    // Central hole if H dimension exists
    if (dimensions.H && dimensions.H > 0) {
      const hole = makeCylinder(dimensions.H / 2, dimensions.B);
      piece = piece.cut(hole);
    }
    
    // Translate so bottom is at Z=0
    piece = piece.translate([0, 0, -dimensions.B]);
    return piece;
  }
}

// ==========================================================================
// Shape Factory
// ==========================================================================

const SHAPE_FAMILIES = {
  't': TShape,
  'e': EShape,
  'c': CShape,
  'u': UShape,
  'ur': URShape,
  'er': ERShape,
  'etd': ETDShape,
  'el': ELShape,
  'planar_el': ELShape,
  'planar_e': ELShape,
  'planar_er': ERShape,
  'eq': EQShape,
  'ec': ECShape,
  'ep': EPShape,
  'epx': EPXShape,
  'efd': EFDShape,
  'lp': LPShape,
  'p': PShape,
  'pq': PQShape,
  'rm': RMShape,
  'pm': PMShape,
};

/**
 * Get shape builder for a given family.
 * @param {Object} replicad - Replicad module
 * @param {string} family - Shape family name
 * @returns {ShapePiece}
 */
export function getShapeBuilder(replicad, family) {
  const familyLower = family.toLowerCase().replace(' ', '_');
  const ShapeClass = SHAPE_FAMILIES[familyLower];
  
  if (!ShapeClass) {
    const supported = Object.keys(SHAPE_FAMILIES).join(', ');
    throw new Error('Unknown shape family: ' + family + '. Supported: ' + supported);
  }
  
  return new ShapeClass(replicad);
}

/**
 * Create a complete core from geometrical description.
 * @param {Object} replicad - Replicad module
 * @param {Array} geometricalDescription - Array of core parts
 * @returns {Object} - Combined core shape
 */
export function getCore(replicad, geometricalDescription) {
  const { makeBaseBox } = replicad;
  let pieces = [];
  
  for (let index = 0; index < geometricalDescription.length; index++) {
    const part = geometricalDescription[index];
    
    // Skip spacers - they are built separately via getSpacers()
    if (part.type === 'spacer') {
      continue;
    } else if (part.type === 'half set' || part.type === 'toroidal') {
      // Create shape piece
      const shapeData = { ...part.shape };
      shapeData.dimensions = flattenDimensions(shapeData);
      
      const shapeBuilder = getShapeBuilder(replicad, shapeData.family);
      let piece = shapeBuilder.getPiece(shapeData);
      
      // Apply rotations (MAS uses radians)
      // Python's rotation order is:
      //   rotation[0] -> X axis
      //   rotation[1] -> Z axis (note: not Y!)
      //   rotation[2] -> Y axis (note: not Z!)
      // Python rotates around negative axis (from +1 to -1), so we negate the angle
      // to get the same rotation direction with positive axis
      const rotX = -(part.rotation[0] / Math.PI) * 180;
      const rotZ = -(part.rotation[1] / Math.PI) * 180;  // rotation[1] is Z, not Y
      const rotY = -(part.rotation[2] / Math.PI) * 180;  // rotation[2] is Y, not Z
      
      if (rotX !== 0) piece = piece.rotate(rotX, [0, 0, 0], [1, 0, 0]);
      if (rotZ !== 0) piece = piece.rotate(rotZ, [0, 0, 0], [0, 0, 1]);
      if (rotY !== 0) piece = piece.rotate(rotY, [0, 0, 0], [0, 1, 0]);
      
      // Apply machining (gaps) from MKF data
      if (part.machining) {
        for (const machining of part.machining) {
          piece = shapeBuilder.applyMachining(piece, machining, shapeData.dimensions);
        }
      }
      
      // Translate to position
      // MKF coordinates are [radial, height, depth] which need conversion
      // to CadQuery coordinates [X, Y, Z] = [radial, depth, height]
      piece = piece.translate(convertAxis(part.coordinates));
      
      // Add residual gap for half sets
      if (part.type === 'half set') {
        const residualGap = 5e-6;
        if (part.rotation[0] > 0) {
          piece = piece.translate([0, 0, residualGap / 2]);
        } else {
          piece = piece.translate([0, 0, -residualGap / 2]);
        }
      }
      
      pieces.push(piece);
    }
  }
  
  // Combine all pieces
  if (pieces.length === 0) {
    return null;
  }
  
  let result = pieces[0];
  for (let i = 1; i < pieces.length; i++) {
    result = result.fuse(pieces[i]);
  }
  
  // Scale from meters to mm (SCALE = 1000)
  // MAS dimensions are in meters, but the rest of the codebase works in mm
  const SCALE = 1000;
  result = result.scale(SCALE);
  
  return result;
}

/**
 * Get list of supported shape families.
 * @returns {string[]}
 */
export function getSupportedFamilies() {
  return Object.keys(SHAPE_FAMILIES);
}

/**
 * Build spacer geometries from the core geometrical description.
 * Spacers are built separately so they can be rendered with a different color.
 * @param {Object} replicad - Replicad module
 * @param {Array} geometricalDescription - Array of core parts
 * @returns {Object|null} - Combined spacer shape or null if no spacers
 */
export function getSpacers(replicad, geometricalDescription) {
  const { makeBaseBox } = replicad;
  let spacers = [];
  
  for (let index = 0; index < geometricalDescription.length; index++) {
    const part = geometricalDescription[index];
    
    if (part.type === 'spacer') {
      // Create spacer box
      // MAS dimensions: [width, height, depth]
      // Replicad makeBaseBox: (xLength, yLength, zLength)
      // After coordinate conversion: X=radial, Y=depth, Z=height
      // Note: makeBaseBox creates box from Z=0 to Z=height, not centered
      // So we need to offset by -height/2 in Z to center it at the gap coordinates
      const spacerHeight = part.dimensions[1];
      const coords = convertAxis(part.coordinates);
      const spacer = makeBaseBox(
        part.dimensions[0],  // width → xLength
        part.dimensions[2],  // depth → yLength  
        spacerHeight         // height (thickness) → zLength
      ).translate([coords[0], coords[1], coords[2] - spacerHeight / 2]);
      
      spacers.push(spacer);
    }
  }
  
  // Combine all spacers
  if (spacers.length === 0) {
    return null;
  }
  
  let result = spacers[0];
  for (let i = 1; i < spacers.length; i++) {
    result = result.fuse(spacers[i]);
  }
  
  // Scale from meters to mm (SCALE = 1000)
  const SCALE = 1000;
  result = result.scale(SCALE);
  
  return result;
}
