"""Export Snow knob from the refined Blender scene for the interactive PANEL.

Run with Blender -b -P tools/render-sprites/virus_snow_knob_atlas.py.
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
rotor=bpy.data.objects['frontKnobValue1']
keep={rotor,*rotor.children_recursive}
source=Vector((*fp.M(612,683),fp.T+.015))
for o in list(s.objects):
    if o in keep: o.hide_render=False
    elif o.type=='LIGHT':o.location-=source;o.hide_render=False
    else:bpy.data.objects.remove(o,do_unlink=True)
rotor.location=(0,0,0)
vs.add_shadow_catcher()
cam=bpy.data.objects.new('Snow sprite camera',bpy.data.cameras.new('Snow sprite camera'))
s.collection.objects.link(cam)
tilt=math.radians(18)
view=Vector((0,math.sin(tilt),-math.cos(tilt)))
cam.location=-view*40;cam.rotation_euler=(tilt,0,0);cam.data.type='ORTHO';cam.data.ortho_scale=3.072
s.camera=cam;s.render.resolution_x=192;s.render.resolution_y=192;s.render.resolution_percentage=100
s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.cycles.samples=32;s.cycles.use_denoising=True
os.makedirs('/tmp/snow-knob-frames',exist_ok=True)
frames=[]
for i in range(64):
    angle=-135+270*i/63
    rotor.rotation_euler=(0,0,-math.radians(angle))
    frames.append(vs.render_to_array('/tmp/snow-knob-frames/%03d.png'%i))
    print('FRAME',i,flush=True)
vs.OUT=ROOT+'/assets/panel'
vs.save_sheet(frames,8,192,'snow-knob',quality=95,clean_shadow_edges=True)
with open(vs.OUT+'/snow-knob.json','w')as f:json.dump({'frames':64,'columns':8,'rows':8,'cell':192,'physicalCellWidth':3.072,'radius':.96,'angles':[-135,135],'rotationSign':-1,'sourcePoint':list(source),'origin':[0,0,0],'cameraTiltDegrees':18,'originInCell':[.5,.5],'samples':32,'webpQuality':95,'shadowMatte':'adaptive border floor with smooth transparent margin','geometry':'uniform ABS tall truncated cone, flat cap and raised pointer','normalizedHeight':1.09,'fluteDepth':.055,'pointerWidth':.125,'pointerHeight':.07,'flutes':14,'bodyColor':'#a6a9a5'},f,indent=2)
