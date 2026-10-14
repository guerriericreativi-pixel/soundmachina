"""Render a black ABS LCD surround: 756x300, 60px nine-slice, clear center."""
from pathlib import Path
import sys
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import virus_panels as vp

OUTPUT = ROOT / 'output/accessory-preview'
OUTPUT.mkdir(parents=True, exist_ok=True)


def main():
    scene = vp.reset(756, 300, samples=96)
    bpy.data.objects.remove(bpy.data.objects['sun'], do_unlink=True)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .035
    scene.view_settings.exposure = -.3
    vp.camera(6.3, 2.5)
    for name, location, energy, size in (
        ('LCD softbox key', (-3, 4, 5), 350, 6),
        ('LCD softbox fill', (4, -3, 3), 60, 5),
    ):
        lamp = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA'))
        lamp.location = location
        lamp.data.energy, lamp.data.size = energy, size
        lamp.rotation_euler = (-lamp.location).to_track_quat('-Z', 'Y').to_euler()
        vp.link(lamp)
    material = bpy.data.materials.new('Matte molded black ABS LCD gasket')
    material.use_nodes = True
    bs = material.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*vp.srgb('#181d1f'), 1)
    bs.inputs['Metallic'].default_value = 0
    bs.inputs['Roughness'].default_value = .37
    bs.inputs['Specular IOR Level'].default_value = .32
    profile = [(-.15, .0, 0), (-.14, .035, 0), (-.11, .070, 0),
               (-.03, .085, 0), (0, .045, 0), (0, .0, 0)]
    vp.sweep('Black beveled LCD window', 3, 1.1, .08, profile, [material])
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = str(OUTPUT / 'lcd-gasket.png')
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(scene.render.filepath)
    scene.view_settings.exposure = 0
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 95
    image.save_render(str(OUTPUT / 'lcd-gasket.webp'), scene=scene)


if __name__ == '__main__':
    main()
