#!/usr/bin/env python3
import struct
import sys

filename = sys.argv[1] if len(sys.argv) > 1 else "output/toroidal_one_turn_rectangular_wire.stl"

with open(filename, "rb") as f:
    header = f.read(80)
    num_triangles = struct.unpack("<I", f.read(4))[0]
    print(f"Number of triangles: {num_triangles}")
    
    min_x, min_y, min_z = float("inf"), float("inf"), float("inf")
    max_x, max_y, max_z = float("-inf"), float("-inf"), float("-inf")
    
    for _ in range(num_triangles):
        f.read(12)  # normal
        for _ in range(3):  # 3 vertices
            x, y, z = struct.unpack("<fff", f.read(12))
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)
            min_z, max_z = min(min_z, z), max(max_z, z)
        f.read(2)  # attribute
    
    print(f"Bounding box:")
    print(f"  X: {min_x:.3f} to {max_x:.3f} (size: {max_x-min_x:.3f} mm)")
    print(f"  Y: {min_y:.3f} to {max_y:.3f} (size: {max_y-min_y:.3f} mm)")
    print(f"  Z: {min_z:.3f} to {max_z:.3f} (size: {max_z-min_z:.3f} mm)")
