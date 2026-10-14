"""Render an uncluttered grey studio desk from directly above."""
import os
import sys
import bpy
sys.path.insert(0, os.path.dirname(__file__))
import virus_panels as vp
import virus_studio_preview as studio
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
vp.reset(10, 10)
bpy.ops.wm.open_mainfile(filepath=os.path.join(studio.OUT, 'virus-ti-snow-studio-refined.blend'))
scene = bpy.context.scene
for obj in scene.objects:
    obj.hide_render = obj.name != 'Scrivania studio' and obj.type != 'LIGHT'
cam = bpy.data.objects.new('Piano studio dall’alto', bpy.data.cameras.new('Piano studio dall’alto'))
scene.collection.objects.link(cam)
cam.location = (0, 0, 40)
cam.rotation_euler = (0, 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 50
scene.camera = cam
scene.render.resolution_x = 2048
scene.render.resolution_y = 1536
scene.render.resolution_percentage = 100
scene.cycles.samples = 32
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(studio.OUT, 'studio-grey-wood.png')
bpy.ops.render.render(write_still=True)
