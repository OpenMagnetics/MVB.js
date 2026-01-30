import struct
import sys
import os

def get_info(fname):
    with open(fname, 'rb') as f:
        f.read(80)
        n = struct.unpack('<I', f.read(4))[0]
        mins = [float('inf')] * 3
        maxs = [float('-inf')] * 3
        for _ in range(n):
            f.read(12)
            for _ in range(3):
                v = struct.unpack('<3f', f.read(12))
                for i in range(3):
                    mins[i] = min(mins[i], v[i])
                    maxs[i] = max(maxs[i], v[i])
            f.read(2)
        dx = maxs[0] - mins[0]
        dy = maxs[1] - mins[1]
        dz = maxs[2] - mins[2]
        print(f'{os.path.basename(fname)}:')
        print(f'  Triangles: {n}, Size: {dx:.2f} x {dy:.2f} x {dz:.2f} mm')

if len(sys.argv) > 1:
    get_info(sys.argv[1])
else:
    # Check all STL files in output directory
    output_dir = 'output'
    for f in sorted(os.listdir(output_dir)):
        if f.endswith('.stl'):
            get_info(os.path.join(output_dir, f))
