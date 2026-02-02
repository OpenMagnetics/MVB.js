#!/usr/bin/env python3
import json
import sys
import math

filename = sys.argv[1] if len(sys.argv) > 1 else 'tests/testData/toroidal_two_layers_not_compact.json'
with open(filename) as f:
    data = json.load(f)

magnetic = data.get('magnetic', data)
turns = magnetic.get('coil', {}).get('turnsDescription', [])
print(f'Number of turns: {len(turns)}')

# Group by layer
layers = {}
for i, t in enumerate(turns):
    layer = t.get('layer', '?')
    if layer not in layers:
        layers[layer] = []
    layers[layer].append((i, t))

for layer_name, layer_turns in layers.items():
    print(f'\n=== {layer_name} ({len(layer_turns)} turns) ===')
    for idx, (i, t) in enumerate(layer_turns[:3]):
        coords = t.get('coordinates', [])
        addCoords = t.get('additionalCoordinates', [[]])
        rotation = t.get('rotation', 0)
        
        inner_r = math.sqrt(coords[0]**2 + coords[1]**2) * 1000
        inner_angle = math.degrees(math.atan2(coords[1], coords[0]))
        
        outer_r = 0
        outer_angle = 0
        if addCoords and len(addCoords[0]) >= 2:
            outer_r = math.sqrt(addCoords[0][0]**2 + addCoords[0][1]**2) * 1000
            outer_angle = math.degrees(math.atan2(addCoords[0][1], addCoords[0][0]))
        
        angle_diff = outer_angle - inner_angle
        
        print(f'Turn {i}: rotation={rotation:.1f}°')
        print(f'  inner: r={inner_r:.2f}mm @ {inner_angle:.1f}°')
        print(f'  outer: r={outer_r:.2f}mm @ {outer_angle:.1f}°')
        print(f'  angle_diff: {angle_diff:.1f}°')
