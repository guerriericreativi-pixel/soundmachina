"""Export Snow key from the refined Blender scene for the interactive PANEL.

Run with Blender -b -P tools/render-sprites/virus_snow_key_atlas.py.
"""
import os,sys,json,math
import bpy
from mathutils import Vector, Matrix
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0,ROOT+'/tools/render-sprites')
import virus_panels as vp
import virus_faceplate as fp
import virus_sprites as vs
vp.reset(10,10)
bpy.ops.wm.open_mainfile(filepath=ROOT+'/output/blender/virus-ti-snow-studio-refined.blend')
s=bpy.context.scene
# Work in the canonical faceplate coordinate system after physical chassis tilt.
if 'hardware_surface_matrix' in s:
    values=s['hardware_surface_matrix']
    inverse=Matrix([values[i:i+4] for i in range(0,16,4)]).inverted()
    for obj in s.objects:
        if not obj.parent:
            obj.matrix_world=inverse @ obj.matrix_world
pivot=bpy.data.objects['frontBtnOsc1']
key=next(o for o in pivot.children if o.type=='MESH' and o.name.startswith('key'))
source=pivot.location.copy()
for o in list(s.objects):
    if o in {pivot,key}:o.hide_render=False
    elif o.type=='LIGHT':o.location-=source;o.hide_render=False
    else:bpy.data.objects.remove(o,do_unlink=True)
pivot.location=(0,0,0)
vs.add_shadow_catcher()
cam=bpy.data.objects.new('Snow key sprite camera',bpy.data.cameras.new('Snow key sprite camera'))
s.collection.objects.link(cam)
tilt=math.radians(18);view=Vector((0,math.sin(tilt),-math.cos(tilt)))
cam.location=-view*40;cam.rotation_euler=(tilt,0,0);cam.data.type='ORTHO';cam.data.ortho_scale=2.7
s.camera=cam;s.render.resolution_x=192;s.render.resolution_y=192;s.render.resolution_percentage=100
s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.cycles.samples=48;s.cycles.use_denoising=True
frames=[]
for pressed in [False,True]:
    key.location.z=-.045/fp.KEY_SIZE if pressed else 0
    frames.append(vs.render_to_array('/tmp/snow-key-%s.png'%('pressed' if pressed else 'idle')))
vs.OUT=ROOT+'/assets/panel'
vs.save_sheet(frames,2,192,'snow-key',quality=95)
with open(vs.OUT+'/snow-key.json','w')as f:json.dump({'frames':2,'columns':2,'rows':1,'cell':192,'physicalCellWidth':2.7,'keySize':1.5,'sourcePoint':list(source),'origin':[0,0,0],'cameraTiltDegrees':18,'originInCell':[.5,.5],'pressedDisplacement':-.045,'samples':48,'webpQuality':95,'geometry':'rigid low key with shallow convex surface','normalizedHeight':.165,'crownHeight':.04,'cornerRadius':.032},f,indent=2)
