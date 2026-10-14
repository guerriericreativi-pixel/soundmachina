"""Render Snow accessory LCD diffusion and its slightly thicker clear cover.

Blender -b -P tools/render-sprites/virus_accessory_snow_lcd.py
The transparent layer leaves the live HTML text sharp and unobstructed.
"""
import math
import os
import sys
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import virus_panels as vp
import virus_sprites as vs

ROOT = vs.ROOT
OUT = os.path.join(ROOT, 'output', 'blender')
vp.reset(1024, 257, samples=48)
scene = bpy.context.scene
scene.cycles.device = 'CPU'
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene.render.resolution_x = 1024
scene.render.resolution_y = 257
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.exposure = 0
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
cam = bpy.data.objects.new('Camera LCD Snow', bpy.data.cameras.new('Camera LCD Snow'))
scene.collection.objects.link(cam)
tilt = math.radians(18)
cam.location = (0, -40 * math.sin(tilt), 40 * math.cos(tilt))
cam.rotation_euler = (tilt, 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 9.7
scene.camera = cam

# Backlit diffuser with a restrained physical LCD cell structure.
mat = bpy.data.materials.new('Diffusore LCD azzurro Snow')
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial')
emission = nt.nodes.new('ShaderNodeEmission')
coord = nt.nodes.new('ShaderNodeTexCoord')
checker = nt.nodes.new('ShaderNodeTexChecker')
checker.inputs['Scale'].default_value = 150
checker.inputs['Color1'].default_value = (*vs.srgb('#c2e3e9'), 1)
checker.inputs['Color2'].default_value = (*vs.srgb('#bedfe5'), 1)
nt.links.new(coord.outputs['Object'], checker.inputs['Vector'])
nt.links.new(checker.outputs['Color'], emission.inputs['Color'])
nt.links.new(emission.outputs[0], out.inputs['Surface'])
substrate = vs.beveled_box('Superficie LCD', (9.7, 2.56, .015), .003, mat)
scene.render.film_transparent = False
scene.render.filepath = os.path.join(OUT, 'accessory-snow-lcd-surface.png')
bpy.ops.render.render(write_still=True)
bpy.data.objects.remove(substrate, do_unlink=True)

# Fresnel reflection over a transparent layer approximates a thin acrylic
# window without refracting or blurring the independently rendered live text.
mat = bpy.data.materials.new('Copertura acrilica LCD Snow')
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial')
mix = nt.nodes.new('ShaderNodeMixShader')
transparent = nt.nodes.new('ShaderNodeBsdfTransparent')
reflection = nt.nodes.new('ShaderNodeBsdfGlossy')
reflection.inputs['Roughness'].default_value = .09
fresnel = nt.nodes.new('ShaderNodeFresnel')
fresnel.inputs['IOR'].default_value = 1.49
strength = nt.nodes.new('ShaderNodeMath')
strength.operation = 'MULTIPLY'
strength.inputs[1].default_value = 1.35
nt.links.new(fresnel.outputs[0], strength.inputs[0])
nt.links.new(strength.outputs[0], mix.inputs[0])
nt.links.new(transparent.outputs[0], mix.inputs[1])
nt.links.new(reflection.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], out.inputs['Surface'])
vs.beveled_box('Lastra sottile LCD Snow', (9.7, 2.56, .10), .018, mat, segments=4)
# A narrow studio strip reflects near the upper edge, outside the patch-name row.
light = bpy.data.objects.new('Strip riflesso bordo LCD', bpy.data.lights.new('Strip riflesso bordo LCD', 'AREA'))
scene.collection.objects.link(light)
light.location = (0, 4.1, 9)
light.data.shape = 'RECTANGLE'
light.data.size = 11
light.data.size_y = .65
light.data.energy = 65
vs.look_at(light)
scene.render.film_transparent = True
scene.render.filepath = os.path.join(OUT, 'accessory-snow-lcd-glass.png')
bpy.ops.render.render(write_still=True)

# Pack only these accessory layers; preserve the approved PANEL assets.
for layer in ('surface', 'glass'):
    image = bpy.data.images.load(os.path.join(OUT, 'accessory-snow-lcd-' + layer + '.png'))
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.exposure = 0
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 95
    image.save_render(os.path.join(ROOT, 'assets/panel/accessory-snow-lcd-' + layer + '.webp'), scene=scene)
