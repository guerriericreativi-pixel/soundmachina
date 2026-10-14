"""Export Snow plate from the refined Blender scene for the interactive PANEL.

Run with Blender -b -P tools/render-sprites/virus_snow_plate.py.
"""
import os,sys,json
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0,ROOT+'/tools/render-sprites')
import virus_panels as vp
import virus_faceplate as fp
vp.reset(10,10)
bpy.ops.wm.open_mainfile(filepath=ROOT+'/output/blender/virus-ti-snow-studio-refined.blend')
s=bpy.context.scene
hidden=[]
for o in s.objects:
    ancestor=o
    moving=False
    while ancestor:
        if ancestor.name in fp.KNOBS: moving=True
        ancestor=ancestor.parent
    key=o.type=='MESH' and o.name.startswith('key') and o.parent and o.parent.name.startswith('frontBtn')
    lcd=o.type=='FONT' and o.data.body in ['MULTI     PART 1/4','STUDIO SETUP','BASS  /  CH 01']
    if moving or key or lcd or o.name.startswith('Indicatore attivo'):
        o.hide_render=True
        hidden.append(o.name)
mat=bpy.data.materials['screen'].node_tree.nodes['Principled BSDF']
mat.inputs['Base Color'].default_value=(.008,.022,.026,1)
mat.inputs['Emission Strength'].default_value=0
s.render.resolution_x=1920;s.render.resolution_y=1080;s.render.resolution_percentage=100
s.cycles.samples=96;s.cycles.use_denoising=True
s.render.image_settings.file_format='PNG'
s.render.filepath=ROOT+'/output/blender/snow-plate.png'
s.view_layers[0].update()
def proj(x,y,z=fp.T):
    mx,my=fp.M(x,y);c=world_to_camera_view(s,s.camera,Vector((mx,my,z)))
    return c.x*100,(1-c.y)*100
width=s.camera.data.ortho_scale
lay={'aspect':1920/1080,'width':1920,'height':1080,'knobs':{},'keys':{},'leds':{},'camera':{'type':s.camera.data.type,'orthoScale':width,'position':list(s.camera.location),'rotation':list(s.camera.rotation_euler)}}
for k,(x,y,_) in fp.KNOBS.items():
    px,py=proj(x,y);lay['knobs'][k]={'x':round(px,4),'y':round(py,4),'d':round(fp.KNOB_R*2/width*100,4)}
for k,(x,y) in fp.KEYS.items():
    px,py=proj(x,y);lay['keys'][k]={'x':round(px,4),'y':round(py,4),'s':round(fp.KEY_SIZE/width*100,4)}
for k,(x,y) in fp.LEDS.items():
    px,py=proj(x,y);lay['leds'][k]={'x':round(px,4),'y':round(py,4)}
a,b=proj(*fp.LCD_SCREEN[:2],2.1),proj(*fp.LCD_SCREEN[2:],2.1)
lay['lcd']={'x':a[0],'y':a[1],'w':b[0]-a[0],'h':b[1]-a[1]}
os.makedirs(ROOT+'/assets/panel',exist_ok=True)
with open(ROOT+'/assets/panel/snow-layout.json','w') as f:json.dump(lay,f,indent=2)
print('HIDDEN',len(hidden),hidden,flush=True)
print('LAYOUT',json.dumps(lay),flush=True)
bpy.ops.render.render(write_still=True)
