/**
 * OpenMagnetics Virtual Builder - Main Entry Point
 * 
 * Browser-based 3D magnetic component geometry generator using OpenCASCADE.js/Replicad.
 * Types are aligned with MAS (Magnetic Agnostic Structure) JSON Schema.
 */

// Re-export all types (MAS-compatible enums and helpers)
export {
  // Enums matching MAS schema values
  WireType,
  ColumnShape,
  ShapeFamily,
  TurnCrossSectionalShape,
  GapType,
  // Data classes for MAS data normalization
  WireDescription,
  TurnDescription,
  BobbinProcessedDescription,
  // Utility functions for MAS data handling
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

// Re-export core shape utilities
export {
  ShapePiece,
  TShape,
  EShape,
  CShape,
  getShapeBuilder,
  getCore,
  getSpacers,
  getSupportedFamilies
} from './coreShapes.js';

// Default export for convenience
export { ReplicadBuilder as default } from './replicadBuilder.js';
