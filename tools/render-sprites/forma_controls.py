"""Original FORMA/P keybed and fader cap. No vendor artwork."""
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

if '--shell-only' in sys.argv:
 s=setup(1600,650,16.25)
 # Lower, diffuse illumination for the satin FORMA enclosure.
 for obj in s.objects:
  if obj.type=='LIGHT':obj.data.energy*=.55
 s.world.node_tree.nodes['Background'].inputs[1].default_value=.22
 paint=material('Satin medium grey paint',(.13,.14,.15),.10,.68)
 principled=paint.node_tree.nodes.get('Principled BSDF');principled.inputs['Specular IOR Level'].default_value=.24
 # Fine satin grain: retain manufacturing texture without heavy hammered-metal relief.
 for node in paint.node_tree.nodes:
  if node.type=='BUMP':node.inputs['Strength'].default_value=.035;node.inputs['Distance'].default_value=.008
 edge=material('Graphite folded returns',(.022,.026,.030),.12,.65)
 block('Satin folded enclosure',(0,0,0),(16,6.1,.38),paint,.075)
 block('Left folded return',(-7.88,0,.1),(.2,6.1,.38),edge,.06)
 block('Right folded return',(7.88,0,.1),(.2,6.1,.38),edge,.06)
 # Broad frontal fill makes the grey read evenly, without a glossy light streak.
 bpy.ops.object.light_add(type='AREA',location=(0,1,10));light=bpy.context.object;light.data.energy=380;light.data.size=12
 s.render.filepath=OUT+'/forma-shell.png';bpy.ops.render.render(write_still=True)
 sys.exit(0)

s=setup(1600,310,16.25)
white=material('Warm ivory',(.79,.79,.74),0,.22);black=material('Graphite keybed',(.009,.011,.014),.15,.3)
block('One piece keybed',(0,0,-.16),(16,3.02,.24),black,.045)
for i in range(36):
 x=-5.85+i*.386;block('White key',(x,-.10,0),(.374,2.65,.18),white,.019)
 if i%7 in [0,1,3,4,5] and i<35:block('Black key',(x+.193,.39,.18),(.22,1.65,.27),black,.019)
block('Bender recess',(-6.96,-.33,-.005),(1.21,.6,.12),black,.04)
lever=material('Bender rubber',(.024,.028,.03),0,.6)
block('Horizontal bender',(-6.96,-.32,.06),(1.01,.19,.19),lever,.045)
block('Bender center mark',(-6.96,-.32,.16),(.02,.15,.02),white,.003)
s.render.filepath=OUT+'/keyboard-poly.png';bpy.ops.render.render(write_still=True)
s=setup(128,128,1.8)
white=material('Fader white',(.82,.84,.80),0,.25)
cap=material('Ivory fader',(.57,.59,.57),0,.27);edge=material('Fader base',(.018,.024,.026),.3,.28)
block('Fader bottom',(0,0,.06),(1.12,.58,.10),edge,.035)
block('Fader cap',(0,0,.13),(1.10,.53,.16),cap,.04)
block('Indicator line',(0,0,.219),(.90,.035,.012),white,.004)
s.render.filepath=OUT+'/fader-poly.png';bpy.ops.render.render(write_still=True)
