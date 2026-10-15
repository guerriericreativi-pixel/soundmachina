"""Original console controls. Run with Blender -b -P this file.

Exports 32-angle transparent knob atlases and two fader caps; no vendor geometry.
"""
import math
import os
import sys
import tempfile
import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, os.path.dirname(__file__))
import virus_sprites as sprites

OUT = ROOT + '/assets/sound-paths/controls'
os.makedirs(OUT, exist_ok=True)
sprites.OUT = OUT

def material(name, color, metallic=0, roughness=.35):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

def cylinder(name, radius, depth, z, mat, vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new('Soft manufactured edge', 'BEVEL')
    bevel.width = .035
    bevel.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj

def block(name, location, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new('Rounded edge', 'BEVEL')
    bevel.width = .025
    bevel.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj

for variant in ['analog', 'digital']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 128
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.world = bpy.data.worlds.new('Studio environment')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.3, .35, .4, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .45
    scene.view_settings.view_transform = 'AgX'
    rubber = material('Graphite polymer', (.022, .027, .031), .12, .34)
    silver = material('Satin aluminium', (.36, .42, .45), .8, .29)
    pointer = material('Ivory inlay', (.86, .87, .78), .05, .3)
    for loc, power, size in [((-3, 4, 6), 450, 4), ((3, -2, 4), 200, 3)]:
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.object
        light.data.energy = power
        light.data.shape = 'DISK'
        light.data.size = size
        light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add(location=(0, -1.3, 8))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, 0, .1)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 2.65
    scene.camera = camera
    rotor = bpy.data.objects.new('Knob rotation', None)
    scene.collection.objects.link(rotor)
    pieces = [cylinder('Base skirt', .92, .15, .1, rubber),
              cylinder('Knob body', .74, .34, .33, rubber),
              cylinder('Top cap', .69, .075, .53, silver if variant == 'digital' else rubber)]
    if variant == 'analog':
        for i in range(28):
            a = i * math.tau / 28
            ridge = block('Grip flute', (.74 * math.sin(a), .74 * math.cos(a), .34), (.055, .075, .24), rubber)
            ridge.rotation_euler.z = -a
            pieces.append(ridge)
    pieces.append(block('Indicator inlay', (0, .4, .58), (.06, .36, .018), pointer))
    for obj in pieces:
        obj.parent = rotor
    frames = []
    with tempfile.TemporaryDirectory(prefix='virus-path-controls-') as tmp:
        for i in range(32):
            rotor.rotation_euler.z = math.radians(135 - 270 * i / 31)
            frames.append(sprites.render_to_array(tmp + '/frame.png'))
    sprites.save_sheet(frames, 8, 128, 'knob-' + variant, quality=92)
    for obj in [rotor, *rotor.children_recursive]:
        obj.hide_render = True
    block('Fader cap', (0, 0, .17), (.65, .31, .25), silver if variant == 'digital' else rubber)
    block('Fader inlay', (0, 0, .31), (.47, .025, .02), pointer)
    camera.data.ortho_scale = 1.35
    scene.render.filepath = OUT + '/fader-' + variant + '.png'
    bpy.ops.render.render(write_still=True)
    os.makedirs(ROOT + '/output/blender', exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=ROOT + '/output/blender/sound-path-controls-' + variant + '.blend')
