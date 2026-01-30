/**
 * OpenMagnetics Virtual Builder - Main Entry Point
 * 
 * Browser-based 3D magnetic component geometry generator using OpenCASCADE.js/Replicad.
 */

// Re-export all types
export {
  WireType,
  ColumnShape,
  ShapeFamily,
  WireDescription,
  TurnDescription,
  BobbinProcessedDescription,
  resolveDimensionalValue,
  flattenDimensions,
  convertAxis
} from './types.js';

// Re-export builder and utilities
export {
  ReplicadBuilder,
  getAngularTolerance,
  setTessellationQuality,
  exportToSTEP,
  exportToSTL,
  exportToMesh
} from './replicadBuilder.js';

// Default export for convenience
export { ReplicadBuilder as default } from './replicadBuilder.js';
