/**
 * Utility functions for OpenMagnetics Virtual Builder
 */

/**
 * Flatten MAS dimensions object to simple numeric values.
 * @param {Object} data - Object with dimensions property
 * @returns {Object} Flattened dimensions
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
  }

  return dimensions;
}

/**
 * Convert MAS coordinates to Replicad/CadQuery coordinate system.
 * @param {number[]} coordinates - MAS coordinates (2D or 3D)
 * @returns {number[]} Replicad coordinates [x, y, z]
 */
export function convertAxis(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0, 0];
  }
  if (coordinates.length === 2) {
    return [coordinates[0], 0, coordinates[1]];
  } else if (coordinates.length === 3) {
    return [coordinates[0], coordinates[2], coordinates[1]];
  } else {
    throw new Error('Invalid MAS coordinates length: expected 2 or 3, got ' + coordinates.length);
  }
}

/**
 * Get nominal value from a DimensionWithTolerance or plain number
 * @param {Object|number} value - DimensionWithTolerance or number
 * @returns {number|null} The nominal value
 */
function getNominal(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  return value.nominal ?? value;
}

/**
 * Convert MAS Wire data to Wire object
 * @param {Object} data - MAS wire data
 * @returns {Wire} Wire object
 */
export function wireFromDict(data) {
  if (!data || typeof data !== 'object') {
    return { type: 'round', numberConductors: 1 };
  }

  return {
    type: data.type || data.wireType || 'round',
    conductingDiameter: data.conductingDiameter,
    outerDiameter: data.outerDiameter,
    conductingWidth: data.conductingWidth,
    conductingHeight: data.conductingHeight,
    outerWidth: data.outerWidth,
    outerHeight: data.outerHeight,
    conductingArea: data.conductingArea,
    numberConductors: data.numberConductors ?? 1,
    material: data.material,
    coating: data.coating,
    manufacturerInfo: data.manufacturerInfo,
    name: data.name,
    standard: data.standard,
    standardName: data.standardName
  };
}

/**
 * Convert MAS Turn data to Turn object
 * @param {Object} data - MAS turn data
 * @returns {Turn} Turn object
 */
export function turnFromDict(data) {
  if (!data || typeof data !== 'object') {
    return { coordinates: [0, 0], length: 0, name: '', parallel: 0 };
  }

  return {
    length: getNominal(data.length),
    crossSectionalArea: getNominal(data.crossSectionalArea),
    coordinates: data.coordinates || [0, 0],
    crossSectionalShape: data.crossSectionalShape,
    additionalCoordinates: data.additionalCoordinates,
    angle: data.angle,
    coordinateSystem: data.coordinateSystem,
    dimensions: data.dimensions,
    layer: data.layer,
    name: data.name || '',
    orientation: data.orientation,
    parallel: data.parallel ?? 0,
    rotation: data.rotation,
    section: data.section
  };
}

/**
 * Convert MAS Group data to Group object
 * @param {Object} data - MAS group data
 * @returns {Group} Group object
 */
export function groupFromDict(data) {
  if (!data || typeof data !== 'object') {
    return {
      coordinates: [0, 0],
      dimensions: [0, 0],
      name: '',
      partialWindings: [],
      sectionsOrientation: 'overlapping',
      type: 'Wound'
    };
  }

  return {
    coordinates: data.coordinates || [0, 0],
    coordinateSystem: data.coordinateSystem,
    dimensions: data.dimensions || [0, 0],
    name: data.name || '',
    partialWindings: data.partialWindings || [],
    sectionsOrientation: data.sectionsOrientation || 'overlapping',
    type: data.type || 'Wound'
  };
}

/**
 * Convert MAS Bobbin processed data to CoreBobbinProcessedDescription object
 * @param {Object} data - MAS bobbin processed data
 * @returns {CoreBobbinProcessedDescription} Bobbin processed description object
 */
export function bobbinFromDict(data) {
  if (!data || typeof data !== 'object') {
    return {
      columnDepth: 0,
      columnShape: 'round',
      columnThickness: 0,
      wallThickness: 0,
      windingWindows: []
    };
  }

  return {
    columnDepth: getNominal(data.columnDepth) || 0,
    columnShape: data.columnShape || 'round',
    columnThickness: getNominal(data.columnThickness) || 0,
    columnWidth: getNominal(data.columnWidth),
    coordinates: data.coordinates,
    pins: data.pins,
    wallThickness: getNominal(data.wallThickness) || 0,
    windingWindows: data.windingWindows || []
  };
}
