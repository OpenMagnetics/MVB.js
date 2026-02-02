#!/usr/bin/env python3
import cadquery as cq

# Test box centering
box = cq.Workplane().box(10, 20, 5)
bb = box.val().BoundingBox()
print(f"CadQuery box(10, 20, 5):")
print(f"  X: {bb.xmin} to {bb.xmax} (center: {(bb.xmin + bb.xmax)/2})")
print(f"  Y: {bb.ymin} to {bb.ymax} (center: {(bb.ymin + bb.ymax)/2})")
print(f"  Z: {bb.zmin} to {bb.zmax} (center: {(bb.zmin + bb.zmax)/2})")

# After translation
translated_box = box.translate((5, 10, 2.5))
bb2 = translated_box.val().BoundingBox()
print(f"\nAfter translate((5, 10, 2.5)):")
print(f"  X: {bb2.xmin} to {bb2.xmax} (center: {(bb2.xmin + bb2.xmax)/2})")
print(f"  Y: {bb2.ymin} to {bb2.ymax} (center: {(bb2.ymin + bb2.ymax)/2})")
print(f"  Z: {bb2.zmin} to {bb2.zmax} (center: {(bb2.zmin + bb2.zmax)/2})")
