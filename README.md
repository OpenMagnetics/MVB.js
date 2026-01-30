# OpenMagnetics Virtual Builder - JavaScript/Browser Version

Browser-compatible 3D magnetic component geometry generator using OpenCASCADE.js and Replicad.

## Overview

This is a JavaScript port of the Python CadQuery-based geometry builder, enabling magnetic component visualization directly in web browsers.

## Features

- **Concentric turns** for E-cores, PQ, RM, etc.
- **Toroidal turns** for toroidal cores
- **Round and rectangular wire** cross-sections
- **Bobbin geometry** generation
- **STL and STEP export** for 3D printing and CAD
- **Three.js integration** for real-time 3D visualization

## Installation

```bash
npm install
```

## Usage

### Browser (with bundler)

```javascript
import opencascade from 'replicad-opencascadejs';
import { setOC } from 'replicad';
import * as replicad from 'replicad';
import { 
  ReplicadBuilder, 
  WireDescription, 
  TurnDescription, 
  BobbinProcessedDescription,
  WireType, 
  ColumnShape 
} from 'open-magnetics-virtual-builder';

// Initialize OpenCASCADE (required once)
const oc = await opencascade();
setOC(oc);

// Create builder
const builder = new ReplicadBuilder(replicad);

// Create a turn
const turn = new TurnDescription({
  coordinates: [0.005, 0]  // [radial, height] in meters
});

const wire = new WireDescription({
  wireType: WireType.ROUND,
  outerDiameter: 0.0005  // 0.5mm
});

const bobbin = new BobbinProcessedDescription({
  columnDepth: 0.003,
  columnWidth: 0.003,
  columnShape: ColumnShape.RECTANGULAR
});

// Generate geometry
const shape = builder.getTurn(turn, wire, bobbin, false);

// Export to STL
const stlData = shape.exportSTL();

// Or get mesh for Three.js
const mesh = shape.mesh({ tolerance: 0.0001 });
```

### Demo

Open `index.html` in a browser (requires a local server for ES modules):

```bash
npm run dev
```

## API Reference

### ReplicadBuilder

Main class for generating magnetic component geometry.

```javascript
const builder = new ReplicadBuilder(replicad);
```

#### Methods

- `getTurn(turnDescription, wireDescription, bobbinDescription, isToroidal)` - Create a single turn
- `getBobbin(bobbinDescription)` - Create bobbin geometry
- `getMagnetic(magneticData, projectName)` - Build complete assembly

### Types

#### WireType (Enum)
- `ROUND` - Round wire
- `RECTANGULAR` - Rectangular/flat wire
- `LITZ` - Litz wire (treated as round)
- `FOIL` - Foil winding
- `PLANAR` - PCB planar winding

#### ColumnShape (Enum)
- `ROUND` - Cylindrical column
- `RECTANGULAR` - Rectangular column

#### WireDescription

```javascript
new WireDescription({
  wireType: WireType.ROUND,
  outerDiameter: 0.001,      // meters
  conductingDiameter: 0.0009, // meters (optional)
  outerWidth: 0.002,          // for rectangular
  outerHeight: 0.0005         // for rectangular
});
```

#### TurnDescription

```javascript
new TurnDescription({
  coordinates: [0.005, 0.001],  // [radial, height] in meters
  rotation: 0,                   // degrees (for toroidal)
  dimensions: [0.001, 0.0005],   // [width, height] for rectangular wire
  additionalCoordinates: [[...]] // outer wire position for toroidal
});
```

#### BobbinProcessedDescription

```javascript
new BobbinProcessedDescription({
  columnDepth: 0.003,           // half depth in meters
  columnWidth: 0.003,           // half width in meters
  columnThickness: 0.0005,      // wall thickness
  wallThickness: 0.001,         // top/bottom wall
  columnShape: ColumnShape.RECTANGULAR,
  windingWindowHeight: 0.01,
  windingWindowWidth: 0.005,
  windingWindowRadialHeight: 0.003,  // for toroidal
  windingWindowAngle: null           // for toroidal
});
```

## Running Tests

### Browser Tests (Recommended)

Start the development server and open the test pages:

```bash
npm run dev
```

Then open in browser:
- **Simple API Tests**: http://localhost:5175/simple_test.html
  - Tests basic Replicad functions (box, cylinder, torus, etc.)
  - Generates downloadable STL files
  
- **Full Builder Tests**: http://localhost:5175/test.html
  - Tests the ReplicadBuilder class
  - Tests concentric and toroidal turns
  - Tests bobbin generation

The tests will:
1. Load OpenCASCADE.js WASM (~10-20 seconds)
2. Run geometry generation tests
3. Show pass/fail results
4. Provide download links for generated STL files

### Unit tests (Vitest)

```bash
npm test
```

### Integration tests (Node.js - requires browser environment)

Note: The Node.js tests require browser-like environment for OpenCASCADE.js.
Use the browser tests for full STL generation verification.

## Coordinate System

### Concentric Cores (E, PQ, RM, etc.)
- **X axis**: Core depth (perpendicular to winding window)
- **Y axis**: Core width (radial, distance from column)
- **Z axis**: Core height (vertical)

### Toroidal Cores
- **Y axis**: Core axis (toroid revolves around Y)
- **X axis**: Radial direction (negative X = inside hole)
- **Z axis**: Tangential direction

## File Structure

```
js/
├── src/
│   ├── index.js           # Main entry point
│   ├── types.js           # Type definitions
│   └── replicadBuilder.js # Geometry builder
├── tests/
│   ├── replicadBuilder.test.js  # Vitest unit tests
│   └── runTests.mjs       # Node.js integration tests
├── index.html             # Browser demo
├── package.json
├── vite.config.js
└── README.md
```

## Browser Compatibility

Requires modern browsers with:
- ES2020+ support
- WebAssembly support
- Web Workers (for OpenCASCADE initialization)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- OpenCASCADE.js WASM loading takes 2-5 seconds on first load
- Consider using Web Workers for heavy geometry operations
- Use lower tessellation quality for real-time preview

## License

MIT
