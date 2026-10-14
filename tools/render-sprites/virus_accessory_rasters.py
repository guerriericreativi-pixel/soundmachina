"""Render responsive accessory chassis with the PANEL material language.

Run Blender -b -P tools/render-sprites/virus_accessory_rasters.py, then run
pack_accessory_rasters.py with a Python interpreter providing Pillow.
Original nine-slice dimensions remain unchanged; outputs stay in output/.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import virus_panels as vp
import bpy
vp.OUT=os.path.join(vp.ROOT,'output','accessory-preview')
os.makedirs(vp.OUT,exist_ok=True)
vp.PREVIEW=False
old_reset=vp.reset

def reset(x,y,samples=64):
    sc=old_reset(x,y,min(samples,48))
    sc.world.node_tree.nodes['Background'].inputs[1].default_value=.08
    sun=bpy.data.objects.get('sun'); sun.data.energy=2.0; sun.data.angle=math.radians(32)
    sc.view_settings.exposure=-.3
    return sc
vp.reset=reset
old_surface=vp.surface_material

def surface(skin,color=None,periodic=False):
    vp.SKIN[skin]['body']=vp.srgb('#dee0dc' if skin=='snow' else '#383d40')
    vp.SKIN[skin]['rough']=.56
    vp.SKIN[skin]['brushed']=False
    mat=old_surface(skin,color,periodic)
    bs=mat.node_tree.nodes['Principled BSDF'];bs.inputs['Metallic'].default_value=0
    bs.inputs['Specular IOR Level'].default_value=.3
    for n in mat.node_tree.nodes:
        if n.type=='BUMP':n.inputs['Strength'].default_value=.25;n.inputs['Distance'].default_value=.003
    return mat
vp.surface_material=surface

def save(name,alpha_floor=.02):
    sc=bpy.context.scene;sc.render.filepath=os.path.join(vp.OUT,name+'.png')
    bpy.ops.render.render(write_still=True)
vp.render_save=save

def bezel(skin):
    vp.reset(756,300)
    vp.camera(6.3,2.5)
    mat=bpy.data.materials.new('Clear beveled PMMA');mat.use_nodes=True
    nt=mat.node_tree;nt.nodes.clear()
    out=nt.nodes.new('ShaderNodeOutputMaterial');trans=nt.nodes.new('ShaderNodeBsdfTransparent')
    gloss=nt.nodes.new('ShaderNodeBsdfGlossy');gloss.inputs['Roughness'].default_value=.14
    fr=nt.nodes.new('ShaderNodeFresnel');fr.inputs['IOR'].default_value=1.49
    mix=nt.nodes.new('ShaderNodeMixShader');nt.links.new(fr.outputs[0],mix.inputs[0]);nt.links.new(trans.outputs[0],mix.inputs[1]);nt.links.new(gloss.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs['Surface'])
    # A flat clear center permits live LCD text; the wide beveled shoulder supplies edge reflections.
    prof=[(-.04,.06,0),(-.025,.059,0),(0,.025,0),(0,0,0)]
    vp.sweep('Clear screen protector',3,1.1,.05,prof,[mat],center_mat=0)
    for sx in (-1,1):
        for sy in (-1,1):vp.screw(skin,(sx*2.82,sy*.92,.06),.075)
    save('bezel-'+skin,0)

def cherry_material():
    """Desaturated satin cherry, with longitudinal grain visible on the front."""
    mat = bpy.data.materials.new('Accessory cherry front')
    mat.use_nodes = True
    nt = mat.node_tree
    bs = nt.nodes['Principled BSDF']
    bs.inputs['Metallic'].default_value = 0
    bs.inputs['Roughness'].default_value = .68
    bs.inputs['Specular IOR Level'].default_value = .22
    coords = nt.nodes.new('ShaderNodeTexCoord')
    stretch = nt.nodes.new('ShaderNodeVectorMath')
    stretch.operation = 'MULTIPLY'
    stretch.inputs[1].default_value = (1.5, 3, 30)
    nt.links.new(coords.outputs['Generated'], stretch.inputs[0])
    grain = nt.nodes.new('ShaderNodeTexNoise')
    grain.inputs['Scale'].default_value = 3
    grain.inputs['Detail'].default_value = 4
    nt.links.new(stretch.outputs[0], grain.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = .25
    ramp.color_ramp.elements[0].color = (*vp.srgb('#69584b'), 1)
    ramp.color_ramp.elements[1].position = .75
    ramp.color_ramp.elements[1].color = (*vp.srgb('#ab9480'), 1)
    nt.links.new(grain.outputs['Fac'], ramp.inputs[0])
    nt.links.new(ramp.outputs['Color'], bs.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .15
    bump.inputs['Distance'].default_value = .008
    nt.links.new(grain.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs[0], bs.inputs['Normal'])
    return mat


def chassis(skin):
    vp.reset(10, 10)
    vp.tilted_frame(4, 2.5, .7, 0, .6)
    coating = surface(skin)
    from mathutils import Vector
    fill = bpy.data.objects.new('Soft front bounce', bpy.data.lights.new('Soft front bounce', 'AREA'))
    fill.data.energy, fill.data.size = 45, 5
    fill.location = (0, -7, 4)
    fill.rotation_euler = (Vector((0, -2.5, .4)) - fill.location).to_track_quat('-Z', 'Y').to_euler()
    vp.link(fill)
    # One U-shaped sheet: only the left and right edges bend down.
    # The top rear edge is free and flat, without a raised perimeter roll.
    profile = [(3.62, 1), (3.70, 1)]
    for step in range(1, 17):
        angle = math.pi / 2 * step / 16
        profile.append((3.70 + .30 * math.sin(angle),
                        .70 + .30 * math.cos(angle)))
    profile += [(4, .065), (3.992, .025)]
    for side in (-1, 1):
        vertices = [(side * x, y, z) for y in (-2.5, 2.5) for x, z in profile]
        count = len(profile)
        faces = [(i, i + 1, count + i + 1, count + i)
                 for i in range(count - 1)]
        mesh = bpy.data.meshes.new('Lateral sheet bend')
        mesh.from_pydata(vertices, [], faces)
        mesh.materials.append(coating)
        for i, polygon in enumerate(mesh.polygons):
            polygon.use_smooth = 1 <= i <= 16
        obj = vp.link(bpy.data.objects.new('Lateral sheet bend', mesh))
        thickness = obj.modifiers.new('Sheet thickness', 'SOLIDIFY')
        thickness.thickness = .025
        thickness.offset = -1
    # Minimal free rear edge fills the upper slice without rolling it over.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 2.47, .985))
    rear = bpy.context.object
    rear.name = 'Flat free rear edge'
    rear.dimensions = (7.25, .06, .025)
    rear.data.materials.append(coating)
    # Front insert extends almost to the lateral metal returns.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -2.488, .485))
    front = bpy.context.object
    front.name = 'Inset cherry front' if skin == 'snow' else 'Inset anthracite front'
    front.dimensions = (7.91, .004, .91)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    front.data.materials.append(cherry_material() if skin == 'snow' else coating)
    rounding = front.modifiers.new('Small eased front corners', 'BEVEL')
    rounding.width, rounding.segments = .002, 4
    for polygon in front.data.polygons:
        polygon.use_smooth = True
    front.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    # The existing live surface fills this central aperture in the browser.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 1.005))
    aperture = bpy.context.object
    aperture.dimensions = (7.245, 4.94, 0)
    aperture.data.materials.append(vp.holdout())
    vp.catcher_plane()
    save('chassis-' + skin)


def button(skin, provided_material=None):
 for state,T in [('up',.2),('down',.11)]:
  vp.reset(10,10);vp.tilted_frame(1.5,.5,T-.02,0,.22)
  mat = provided_material or surface(skin,vp.srgb('#9b9e9a' if skin=='snow' else '#414548'))
  if provided_material is None:
   bs=mat.node_tree.nodes['Principled BSDF'];bs.inputs['Roughness'].default_value=.44
   for n in mat.node_tree.nodes:
    if n.type=='BUMP':n.inputs['Strength'].default_value=.04
  prof=[(-.20,T+.025,0),(-.10,T+.018,0),(-.04,T+.005,0),(-.02,T,0)]
  prof += [(o,z,0) for o,z in vp.quarter(-.02,T,.02,5)[1:]]+[(0,0,0)]
  vp.sweep('Low crowned rigid ABS key',1.5,.5,.04,prof,[mat],center_mat=0)
  slot=bpy.data.materials.new('Key slot');slot.use_nodes=True
  slot.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.008,.009,.01,1)
  slot.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.9
  vp.sweep('Slot',1.5,.5,.04,[(0,.001,0),(.035,.001,0)],[slot])
  vp.catcher_plane();save('btn-'+skin+'-'+state)

if __name__ == '__main__':
    jobs = [arg for arg in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else []
    for sk in ('snow','dark'):
        if '--chassis-only' in jobs:
            chassis(sk)
            continue
        vp.job_surface(sk)
        chassis(sk)
        vp.job_recess(sk)
        bezel(sk)
        vp.job_screw(sk)
        button(sk)
