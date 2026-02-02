/**
 * OpenMagnetics Virtual Builder - Type Definitions
 * 
 * Types aligned with MAS (Magnetic Agnostic Structure) JSON Schema.
 * See: https://github.com/OpenMagnetics/MAS
 * 
 * Enum values match MAS schema definitions exactly. Factory functions
 * provide defaults and normalization for MAS data structures.
 */

// ==========================================================================
// Enums (matching MAS schema values - see schemas/magnetic/wire.json, etc.)
// ==========================================================================

/**
 * Wire types as defined in MAS magnetic/wire.json#/$defs/wireType
 * @readonly
 * @enum {string}
 */
export const WireType = Object.freeze({
  ROUND: 'round',
  LITZ: 'litz',
  RECTANGULAR: 'rectangular',
  FOIL: 'foil',
  PLANAR: 'planar'
});

/**
 * Bobbin column shapes as defined in MAS magnetic/bobbin.json#/$defs/columnShape
 * @readonly
 * @enum {string}
 */
export const ColumnShape = Object.freeze({
  ROUND: 'round',
  RECTANGULAR: 'rectangular',
  OBLONG: 'oblong',
  IRREGULAR: 'irregular'
});

/**
 * Core shape families as defined in MAS magnetic/core/shape.json#/$defs/coreShapeFamily
 * @readonly
 * @enum {string}
 */
export const ShapeFamily = Object.freeze({
  C: 'c',
  DRUM: 'drum',
  E: 'e',
  EC: 'ec',
  EFD: 'efd',
  EI: 'ei',
  EL: 'el',
  ELP: 'elp',
  EP: 'ep',
  EPX: 'epx',
  EQ: 'eq',
  ER: 'er',
  ETD: 'etd',
  H: 'h',
  LP: 'lp',
  P: 'p',
  PLANAR_E: 'planar e',
  PLANAR_EL: 'planar el',
  PLANAR_ER: 'planar er',
  PM: 'pm',
  PQ: 'pq',
  PQI: 'pqi',
  RM: 'rm',
  ROD: 'rod',
  T: 't',
  U: 'u',
  UI: 'ui',
  UR: 'ur',
  UT: 'ut'
});

/**
 * Turn cross-sectional shapes as defined in MAS magnetic/coil.json#/$defs/turnCrossSectionalShape
 * @readonly
 * @enum {string}
 */
export const TurnCrossSectionalShape = Object.freeze({
  ROUND: 'round',
  RECTANGULAR: 'rectangular',
  OVAL: 'oval'
});

/**
 * Gap types as defined in MAS magnetic/core/gap.json#/$defs/gapType
 * @readonly
 * @enum {string}
 */
export const GapType = Object.freeze({
  ADDITIVE: 'additive',
  SUBTRACTIVE: 'subtractive',
  RESIDUAL: 'residual'
});

// ==========================================================================
// Utility Functions for MAS Data Handling
// ==========================================================================

/**
 * Extract numeric value from MAS DimensionWithTolerance object.
 * Handles both simple numbers and {nominal, minimum, maximum} objects.
 * See: MAS schemas/utils.json#/$defs/dimensionWithTolerance
 * 
 * @param {number|Object} value - Value to resolve
 * @returns {number} - Resolved numeric value
 */
export function resolveDimensionalValue(value) {
  if (value === null || value === undefined) {
    return 0.0;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    // MAS DimensionWithTolerance: prefer nominal, fallback to min/max
    if (value.nominal !== undefined && value.nominal !== null) {
      return value.nominal;
    }
    if (value.minimum !== undefined && value.maximum !== undefined) {
      return (value.minimum + value.maximum) / 2;
    }
    return value.minimum ?? value.maximum ?? 0.0;
  }
  return Number(value);
}

/**
 * Flatten MAS dimensions object to simple numeric values.
 * Converts {A: {nominal: 0.05}, B: {min: 0.02, max: 0.03}} to {A: 0.05, B: 0.025}
 * 
 * @param {Object} data - Object containing dimensions property (MAS shape data)
 * @returns {Object} - Flattened dimensions with numeric values
 */
export function flattenDimensions(data) {
  const dimensions = { ...data.dimensions };
  
  for (const [k, v] of Object.entries(dimensions)) {
    if (typeof v === 'object' && v !== null) {
      let nominal = v.nominal;
      if (nominal === null || nominal === undefined) {
        if (v.maximum === null || v.maximum === undefined) {
          nominal = v.minimum;
        } else if (v.minimum === null || v.minimum === undefined) {
          nominal = v.maximum;
        } else {
          nominal = Math.round(((v.maximum + v.minimum) / 2) * 1e6) / 1e6;
        }
      }
      dimensions[k] = nominal;
    }
    // If already a number, keep as-is
  }
  
  // Remove alpha dimension (angle, not used in geometry)
  const result = {};
  for (const [k, v] of Object.entries(dimensions)) {
    if (k !== 'alpha') {
      result[k] = v;
    }
  }
  return result;
}

/**
 * Convert MAS coordinates to Replicad/CadQuery coordinate system.
 * 
 * MAS uses [radial, height, depth] convention:
 * - radial: distance from center axis (X in CAD)
 * - height: vertical position (Z in CAD)
 * - depth: front-to-back position (Y in CAD)
 * 
 * Replicad/CadQuery uses [X, Y, Z] where Z is vertical.
 * 
 * @param {number[]} coordinates - MAS coordinates [radial, height] or [radial, height, depth]
 * @returns {number[]} - CAD coordinates [X, Y, Z]
 */
export function convertAxis(coordinates) {
  if (coordinates.length === 2) {
    // [radial, height] -> [X=radial, Y=0, Z=height]
    return [coordinates[0], 0, coordinates[1]];
  } else if (coordinates.length === 3) {
    // [radial, height, depth] -> [X=radial, Y=depth, Z=height]
    return [coordinates[0], coordinates[2], coordinates[1]];
  } else {
    throw new Error('Invalid MAS coordinates length: expected 2 or 3, got ' + coordinates.length);
  }
}

// ==========================================================================
// Data Classes (MAS-compatible wrappers with defaults)
// These provide defaults and normalization for MAS data structures.
// See MAS schemas: magnetic/wire.json, magnetic/coil.json, magnetic/bobbin.json
// ==========================================================================

/**
 * Wire description wrapper for MAS wire data.
 * Normalizes wire properties and provides defaults.
 * See: MAS schemas/magnetic/wire/*.json
 */
export class WireDescription {
  /**
   * @param {Object} options - Wire properties matching MAS wire schema
   */
  constructor({
    type = null,                 // MAS: wire.type
    conductingDiameter = null,   // MAS: wire/round.conductingDiameter
    outerDiameter = null,        // MAS: wire/round.outerDiameter
    conductingWidth = null,      // MAS: wire/rectangular.conductingWidth
    conductingHeight = null,     // MAS: wire/rectangular.conductingHeight
    outerWidth = null,           // MAS: wire/rectangular.outerWidth
    outerHeight = null,          // MAS: wire/rectangular.outerHeight
    numberConductors = 1,        // MAS: wire/litz.numberConductors
    // Legacy property name mapping
    wireType = null
  } = {}) {
    // Support both 'type' (MAS) and 'wireType' (legacy), with proper fallback
    this.type = type ?? wireType ?? WireType.ROUND;
    this.wireType = this.type;  // Legacy alias
    this.conductingDiameter = conductingDiameter;
    this.outerDiameter = outerDiameter;
    this.conductingWidth = conductingWidth;
    this.conductingHeight = conductingHeight;
    this.outerWidth = outerWidth;
    this.outerHeight = outerHeight;
    this.numberConductors = numberConductors;
  }

  /**
   * Create from MAS wire data, resolving DimensionWithTolerance values.
   * @param {Object} data - MAS format wire data
   * @returns {WireDescription}
   */
  static fromDict(data) {
    if (!data || typeof data !== 'object') {
      return new WireDescription();
    }
    
    return new WireDescription({
      type: data.type || WireType.ROUND,
      conductingDiameter: resolveDimensionalValue(data.conductingDiameter),
      outerDiameter: resolveDimensionalValue(data.outerDiameter),
      conductingWidth: resolveDimensionalValue(data.conductingWidth),
      conductingHeight: resolveDimensionalValue(data.conductingHeight),
      outerWidth: resolveDimensionalValue(data.outerWidth),
      outerHeight: resolveDimensionalValue(data.outerHeight),
      numberConductors: data.numberConductors || 1
    });
  }
}

/**
 * Turn description wrapper for MAS coil turn data.
 * See: MAS schemas/magnetic/coil.json#/$defs/turn
 */
export class TurnDescription {
  /**
   * @param {Object} options - Turn properties matching MAS turn schema
   */
  constructor({
    coordinates = [0, 0],              // MAS: turn.coordinates
    winding = '',                      // MAS: turn.winding
    section = '',                      // MAS: turn.section
    layer = '',                        // MAS: turn.layer
    parallel = 0,                      // MAS: turn.parallel
    name = '',                         // MAS: turn.name
    dimensions = null,                 // MAS: turn.dimensions
    rotation = 0.0,                    // MAS: turn.rotation
    additionalCoordinates = null,      // MAS: turn.additionalCoordinates
    crossSectionalShape = TurnCrossSectionalShape.ROUND,  // MAS: turn.crossSectionalShape
    // Legacy properties
    turnIndex = 0
  } = {}) {
    this.coordinates = coordinates;
    this.winding = winding;
    this.section = section;
    this.layer = layer;
    this.parallel = parallel;
    this.name = name || `turn_${turnIndex}`;
    this.dimensions = dimensions;
    this.rotation = rotation;
    this.additionalCoordinates = additionalCoordinates;
    this.crossSectionalShape = crossSectionalShape;
    this.turnIndex = turnIndex;  // Legacy
  }

  /**
   * Create from MAS turn data.
   * @param {Object} data - MAS format turn data
   * @returns {TurnDescription}
   */
  static fromDict(data) {
    if (!data || typeof data !== 'object') {
      return new TurnDescription();
    }
    
    return new TurnDescription({
      coordinates: data.coordinates || [0, 0],
      winding: data.winding || '',
      section: data.section || '',
      layer: data.layer || '',
      parallel: data.parallel || 0,
      name: data.name || '',
      dimensions: data.dimensions || null,
      rotation: data.rotation || 0.0,
      additionalCoordinates: data.additionalCoordinates || null,
      crossSectionalShape: data.crossSectionalShape || TurnCrossSectionalShape.ROUND
    });
  }
}

/**
 * Bobbin processed description wrapper for MAS bobbin data.
 * See: MAS schemas/magnetic/bobbin.json#/$defs/processedDescription
 */
export class BobbinProcessedDescription {
  /**
   * @param {Object} options - Bobbin properties matching MAS processedDescription
   */
  constructor({
    columnDepth = 0.0,           // MAS: bobbin.processedDescription.columnDepth
    columnWidth = 0.0,           // MAS: bobbin.processedDescription.columnWidth
    columnThickness = 0.0,       // MAS: bobbin.processedDescription.columnThickness
    wallThickness = 0.0,         // MAS: bobbin.processedDescription.wallThickness
    columnShape = ColumnShape.RECTANGULAR,  // MAS: bobbin.processedDescription.columnShape
    windingWindows = [],         // MAS: bobbin.processedDescription.windingWindows
    // Legacy properties (extracted from first winding window)
    windingWindowHeight = null,
    windingWindowWidth = null,
    windingWindowRadialHeight = null,
    windingWindowAngle = null
  } = {}) {
    this.columnDepth = columnDepth;
    this.columnWidth = columnWidth;
    this.columnThickness = columnThickness;
    this.wallThickness = wallThickness;
    this.columnShape = columnShape;
    this.windingWindows = windingWindows;
    
    // Extract legacy properties from first winding window if not explicitly set
    const ww = windingWindows[0] || {};
    this.windingWindowHeight = windingWindowHeight ?? ww.height ?? 0.0;
    this.windingWindowWidth = windingWindowWidth ?? ww.width ?? 0.0;
    this.windingWindowRadialHeight = windingWindowRadialHeight ?? ww.radialHeight ?? 0.0;
    this.windingWindowAngle = windingWindowAngle ?? ww.angle ?? null;
  }

  /**
   * Create from MAS bobbin processedDescription data.
   * @param {Object} data - MAS format bobbin processedDescription
   * @returns {BobbinProcessedDescription}
   */
  static fromDict(data) {
    if (!data || typeof data !== 'object') {
      return new BobbinProcessedDescription();
    }
    
    const windingWindows = data.windingWindows || [];
    const ww = windingWindows[0] || {};
    
    return new BobbinProcessedDescription({
      columnDepth: data.columnDepth || 0.0,
      columnWidth: data.columnWidth || 0.0,
      columnThickness: data.columnThickness || 0.0,
      wallThickness: data.wallThickness || 0.0,
      columnShape: data.columnShape || ColumnShape.RECTANGULAR,
      windingWindows: windingWindows,
      windingWindowHeight: ww.height || 0.0,
      windingWindowWidth: ww.width || 0.0,
      windingWindowRadialHeight: ww.radialHeight || 0.0,
      windingWindowAngle: ww.angle ?? null
    });
  }
}
