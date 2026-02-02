import json

with open("/home/alfonso/OpenMagnetics/MVB.js/tests/testData/bug_web_0.json") as f:
    data = json.load(f)

# Get core shape dimensions
parts = data["magnetic"]["core"]["geometricalDescription"]
for i, part in enumerate(parts):
    if part.get("shape"):
        dims = part["shape"]["dimensions"]
        print(f"Part {i} dimensions:")
        for k, v in dims.items():
            if isinstance(v, dict) and "minimum" in v:
                val = (v["minimum"] + v.get("maximum", v["minimum"])) / 2
                print(f"  {k}: {val*1000:.3f} mm")
        print(f"  rotation: {part.get('rotation', [])}")
        print()
        
# Get bobbin dimensions
bobbin = data["magnetic"]["coil"]["bobbin"]["processedDescription"]
print("Bobbin:")
print(f"  columnDepth: {bobbin['columnDepth']*1000:.3f} mm")
print(f"  columnWidth: {bobbin['columnWidth']*1000:.3f} mm")
print(f"  columnShape: {bobbin['columnShape']}")

# Winding window
ww = bobbin["windingWindows"][0]
print(f"\nWinding Window:")
print(f"  height: {ww['height']*1000:.3f} mm")
print(f"  width: {ww['width']*1000:.3f} mm")
