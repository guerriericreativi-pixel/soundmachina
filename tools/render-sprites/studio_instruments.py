"""Original folded enclosures and keyboard, rendered with Blender Cycles."""
import bpy, math, os, sys
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=ROOT+'/assets/studio-instruments'
os.makedirs(OUT,exist_ok=True)
def material(name,color,metal=0,rough=.35):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=190
 bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.11;bump.inputs['Distance'].default_value=.025
 m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m

def block(name,loc,size,mat,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 b=o.modifiers.new('Manufactured radius','BEVEL');b.width=bevel;b.segments=4;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o

def setup(w,h,scale):
 bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True
 s.render.resolution_x=w;s.render.resolution_y=h;s.render.resolution_percentage=100;s.render.film_transparent=True;s.render.image_settings.file_format='PNG'
 s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[1].default_value=.35
 for loc,power,size in [((-5,3,8),1100,8),((6,-4,6),650,6)]:
  bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(0,-.6,18));c=bpy.context.object;c.rotation_euler=(Vector((0,0,0))-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=scale;s.camera=c;s.view_settings.view_transform='AgX';return s
if '--digital-keybed-only' not in sys.argv:
 for variant,color in [('poly',(.025,.031,.036)),('phase',(.062,.051,.043))]:
  s=setup(1600,650,16.25);paint=material('Fine powder coat',color,.45,.36);edge=material('Folded return',(.013,.015,.018),.6,.28)
  block('Single folded shell',(0,0,0),(16,6.1,.38),paint,.10)
  block('Left return',(-7.88,0,.1),(.2,6.1,.38),edge,.08);block('Right return',(7.88,0,.1),(.2,6.1,.38),edge,.08)
  s.render.filepath=OUT+'/'+variant+'-shell.png';bpy.ops.render.render(write_still=True)
 s=setup(1600,240,16.25);white=material('Ivory keys',(.79,.79,.74),0,.24);black=material('Black keys',(.009,.011,.014),0,.22);base=material('Keybed',(.016,.018,.02),.3,.28)
 block('Keybed',(0,0,-.15),(16,2.4,.2),base)
 for i in range(28):
  x=-7.7+i*.57;block('White key',(x,-.1,0),(.555,2,.18),white,.025)
  if i%7 in [0,1,3,4,5] and i<27:block('Black key',(x+.285,.31,.18),(.32,1.2,.27),black,.025)
 s.render.filepath=OUT+'/keyboard.png';bpy.ops.render.render(write_still=True)
# Digital-era keybed: five octaves with a recessed pair of performance wheels.
s=setup(1600,310,16.25)
white=material('Digital ivory keys',(.79,.79,.74),0,.24);black=material('Digital black keys',(.009,.011,.014),0,.22);base=material('Brown keybed',(.006,.004,.003),0,.7)
block('Digital keybed',(0,0,-.15),(16,3.02,.2),base)
for i in range(36):
 x=-5.85+i*.386;block('White key',(x,-.10,0),(.374,2.65,.18),white,.019)
 if i%7 in [0,1,3,4,5] and i<35:block('Black key',(x+.193,.39,.18),(.22,1.65,.27),black,.019)
for x in [-7.25,-6.58]:
 block('Wheel recess',(x,.1,-.005),(.5,1.6,.15),black,.035)
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.62,depth=.19,location=(x,.1,-.17),rotation=(0,math.pi/2,0))
 wheel=bpy.context.object;wheel.name='Rubber performance wheel';wheel.data.materials.append(black)
 bevel=wheel.modifiers.new('Wheel edge radius','BEVEL');bevel.width=.025;bevel.segments=3;wheel.modifiers.new('Wheel normals','WEIGHTED_NORMAL')
 block('Wheel center inlay',(x,.08,.455),(.16,.025,.013),white,.005)
s.render.filepath=OUT+'/keyboard-phase.png';bpy.ops.render.render(write_still=True)
