/**
 * OpenMagnetics Virtual Builder - Type Definitions
 * 
 * JavaScript equivalent of Python dataclasses for magnetic component geometry.
 */

// ==========================================================================
// Enums
// ==========================================================================

/**
 * Wire types supported.
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
 * Bobbin column shapes.
 * @readonly
 * @enum {string}
 */
export const ColumnShape = Object.freeze({
  ROUND: 'round',
  RECTANGULAR: 'rectangular'
});

/**
 * Core shape families.
 * @readonly
 * @enum {string}
 */
export const ShapeFamily = Object.freeze({
  ETD: 'etd',
  ER: 'er',
  EP: 'ep',
  EPX: 'epx',
  PQ: 'pq',
  E: 'e',
  PM: 'pm',
  P: 'p',
  RM: 'rm',
  EQ: 'eq',
  LP: 'lp',
  PLANAR_ER: 'planar_er',
  PLANAR_E: 'planar_e',
  PLANAR_EL: 'planar_el',
  EC: 'ec',
  EFD: 'efd',
  U: 'u',
  UR: 'ur',
  T: 't',
  C: 'c'
});

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Extract numeric value from dimensional data (handles dict with 'nominal' or plain value).
 * @param {*} value - Value to resolve
 * @returns {number} - Resolved numeric value
 */
export function resolveDimensionalValue(value) {
  if (value === null || value === undefined) {
    return 0.0;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.nominal ?? value.minimum ?? value.maximum ?? 0.0;
  }
  return Number(value);
}

/**
 * Flatten dimensions object, extracting nominal values.
 * @param {Object} data - Object containing dimensions
 * @returns {Object} - Flattened dimensions with nominal values
 */
export function flattenDimensions(data) {
  const dimensions = { ...data.dimensions };
  
  for (const [k, v] of Object.entries(dimensions)) {
    if (typeof v === 'object' && v !== null) {
      if (v.nominal === null || v.nominal === undefined) {
        if (v.maximum === null || v.maximum === undefined) {
          v.nominal = v.minimum;
        } else if (v.minimum === null || v.minimum === undefined) {
          v.nominal = v.maximum;
        } else {
          v.nominal = Math.round(((v.maximum + v.minimum) / 2) * 1e6) / 1e6;
        }
      }
      dimensions[k] = { nominal: v.nominal };
    } else {
      dimensions[k] = { nominal: v };
    }
  }
  
  const result = {};
  for (const [k, v] of Object.entries(dimensions)) {
    if (k !== 'alpha') {
      result[k] = v.nominal;
    }
  }
  return result;
}

/**
 * Convert MAS coordinates to CadQuery/Replicad coordinate system.
 * @param {number[]} coordinates - Input coordinates
 * @returns {number[]} - Converted coordinates [x, y, z]
 */
export function convertAxis(coordinates) {
  if (coordinates.length === 2) {
    return [0, coordinates[0], coordinates[1]];
  } else if (coordinates.length === 3) {
    return [coordinates[0], coordinates[2], coordinates[1]];
  } else {
    throw new Error('Invalid coordinates length');
  }
}

// ==========================================================================
// Data Classes
// ==========================================================================

/**
 * Description of a wire.
 */
export class WireDescription {
  /**
   * @param {Object} options
   * @param {string} options.wireType - Wire type (from WireType enum)
   * @param {number} [options.conductingDiameter] - Conducting diameter in meters
   * @param {number} [options.outerDiameter] - Outer diameter in meters
   * @param {number} [options.conductingWidth] - Conducting width in meters
   * @param {number} [options.conductingHeight] - Conducting height in meters
   * @param {number} [options.outerWidth] - Outer width in meters
   * @param {number} [options.outerHeight] - Outer height in meters
   * @param {number} [options.numberConductors] - Number of conductors
   */
  constructor({
    wireType = WireType.ROUND,
    conductingDiameter = null,
    outerDiameter = null,
    conductingWidth = null,
    conductingHeight = null,
    outerWidth = null,
    outerHeight = null,
    numberConductors = 1
  } = {}) {
    this.wireType = wireType;
    this.conductingDiameter = conductingDiameter;
    this.outerDiameter = outerDiameter;
    this.conductingWidth = conductingWidth;
    this.conductingHeight = conductingHeight;
    this.outerWidth = outerWidth;
    this.outerHeight = outerHeight;
    this.numberConductors = numberConductors;
  }

  /**
   * Create WireDescription from MAS format dictionary.
   * @param {Object} data - MAS format wire data
   * @returns {WireDescription}
   */
  static fromDict(data) {
    const wireTypeStr = data.type || 'round';
    const wireType = WireType[wireTypeStr.toUpperCase()] || WireType.ROUND;
    
    return new WireDescription({
      wireType,
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
 * Description of a single turn.
 */
export class TurnDescription {
  /**
   * @param {Object} options
   * @param {number[]} options.coordinates - Turn coordinates [radial, height] or [x, y, z]
   * @param {string} [options.winding] - Winding identifier
   * @param {string} [options.section] - Section identifier
   * @param {string} [options.layer] - Layer identifier
   * @param {number} [options.parallel] - Parallel index
   * @param {number} [options.turnIndex] - Turn index
   * @param {number[]} [options.dimensions] - Wire dimensions [width, height]
   * @param {number} [options.rotation] - Rotation angle in degrees
   * @param {number[][]} [options.additionalCoordinates] - Additional coordinates for outer wire
   * @param {string} [options.crossSectionalShape] - Cross-sectional shape ('round' or 'rectangular')
   */
  constructor({
    coordinates = [0, 0],
    winding = '',
    section = '',
    layer = '',
    parallel = 0,
    turnIndex = 0,
    dimensions = null,
    rotation = 0.0,
    additionalCoordinates = null,
    crossSectionalShape = 'round'
  } = {}) {
    this.coordinates = coordinates;
    this.winding = winding;
    this.section = section;
    this.layer = layer;
    this.parallel = parallel;
    this.turnIndex = turnIndex;
    this.dimensions = dimensions;
    this.rotation = rotation;
    this.additionalCoordinates = additionalCoordinates;
    this.crossSectionalShape = crossSectionalShape;
  }

  /**
   * Create TurnDescription from MAS format dictionary.
   * @param {Object} data - MAS format turn data
   * @returns {TurnDescription}
   */
  static fromDict(data) {
    return new TurnDescription({
      coordinates: data.coordinates || [0, 0],
      winding: data.winding || '',
      section: data.section || '',
      layer: data.layer || '',
      parallel: data.parallel || 0,
      turnIndex: data.turnIndex || 0,
      dimensions: data.dimensions || null,
      rotation: data.rotation || 0.0,
      additionalCoordinates: data.additionalCoordinates || null,
      crossSectionalShape: data.crossSectionalShape || 'round'
    });
  }
}

/**
 * Processed bobbin description.
 */
export class BobbinProcessedDescription {
  /**
   * @param {Object} options
   * @param {number} [options.columnDepth] - Half column depth in meters
   * @param {number} [options.columnWidth] - Half column width in meters
   * @param {number} [options.columnThickness] - Column wall thickness in meters
   * @param {number} [options.wallThickness] - Top/bottom wall thickness in meters
   * @param {string} [options.columnShape] - Column shape ('round' or 'rectangular')
   * @param {number} [options.windingWindowHeight] - Winding window height in meters
   * @param {number} [options.windingWindowWidth] - Winding window width in meters
   * @param {number} [options.windingWindowRadialHeight] - Radial height for toroidal in meters
   * @param {number} [options.windingWindowAngle] - Angle for toroidal in radians
   */
  constructor({
    columnDepth = 0.0,
    columnWidth = 0.0,
    columnThickness = 0.0,
    wallThickness = 0.0,
    columnShape = ColumnShape.RECTANGULAR,
    windingWindowHeight = 0.0,
    windingWindowWidth = 0.0,
    windingWindowRadialHeight = 0.0,
    windingWindowAngle = null
  } = {}) {
    this.columnDepth = columnDepth;
    this.columnWidth = columnWidth;
    this.columnThickness = columnThickness;
    this.wallThickness = wallThickness;
    this.columnShape = columnShape;
    this.windingWindowHeight = windingWindowHeight;
    this.windingWindowWidth = windingWindowWidth;
    this.windingWindowRadialHeight = windingWindowRadialHeight;
    this.windingWindowAngle = windingWindowAngle;
  }

  /**
   * Create BobbinProcessedDescription from MAS format dictionary.
   * @param {Object} data - MAS format bobbin data
   * @returns {BobbinProcessedDescription}
   */
  static fromDict(data) {
    const shapeStr = data.columnShape || 'rectangular';
    const columnShape = ColumnShape[shapeStr.toUpperCase()] || ColumnShape.RECTANGULAR;
    
    // Get winding window info
    let wwHeight = 0.0;
    let wwWidth = 0.0;
    let wwRadialHeight = 0.0;
    let wwAngle = null;
    
    const windingWindows = data.windingWindows || [];
    if (windingWindows.length > 0) {
      const ww = windingWindows[0];
      wwHeight = ww.height || 0.0;
      wwWidth = ww.width || 0.0;
      wwRadialHeight = ww.radialHeight || 0.0;
      wwAngle = ww.angle ?? null;
    }
    
    return new BobbinProcessedDescription({
      columnDepth: data.columnDepth || 0.0,
      columnWidth: data.columnWidth || 0.0,
      columnThickness: data.columnThickness || 0.0,
      wallThickness: data.wallThickness || 0.0,
      columnShape,
      windingWindowHeight: wwHeight,
      windingWindowWidth: wwWidth,
      windingWindowRadialHeight: wwRadialHeight,
      windingWindowAngle: wwAngle
    });
  }
}
