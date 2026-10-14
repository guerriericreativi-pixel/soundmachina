"""Snow: scocca metallica verniciata a polvere e controlli in plastica rigida.

Blender -b -P tools/render-sprites/virus_snow_studio_refine.py -- [--preview]
La svasatura è stimata dalle foto, non da quote CAD del produttore.
"""
import os
import math
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
import virus_studio_preview as studio
import virus_panels as vp
import virus_faceplate as fp
import virus_sprites as vs

NAME = 'virus-ti-snow-studio-refined'
SOURCE = os.path.join(studio.OUT, 'virus-ti-snow-panel-focus.blend')
FRONT_HEIGHT, REAR_HEIGHT = 4.0, 4.5
SURFACE_ANGLE = math.asin((REAR_HEIGHT - FRONT_HEIGHT) / (2 * fp.B))
SURFACE = Matrix.Translation((0, 0, (FRONT_HEIGHT + REAR_HEIGHT) / 2
                             - fp.T * math.cos(SURFACE_ANGLE))) @ Matrix.Rotation(SURFACE_ANGLE, 4, 'X')



def tapered_chassis():
    """Fascia in lamiera con due pieghe laterali a 90°, non un guscio chiuso."""
    old = bpy.data.objects['body']
    mat = old.data.materials[0]
    bpy.data.objects.remove(old, do_unlink=True)
    radius = 0.55
    profile = [(-fp.A, 0.12), (-fp.A, fp.T - radius)]
    for step in range(1, 17):
        angle = math.pi - step * math.pi / 32
        profile.append((-fp.A + radius + radius * math.cos(angle),
                        fp.T - radius + radius * math.sin(angle)))
    profile.append((fp.A - radius, fp.T))
    for step in range(1, 17):
        angle = math.pi / 2 - step * math.pi / 32
        profile.append((fp.A - radius + radius * math.cos(angle),
                        fp.T - radius + radius * math.sin(angle)))
    profile.append((fp.A, 0.12))
    count = len(profile)
    vertices = [(x * taper, y, z) for y, taper in ((-fp.B, 0.94), (fp.B, 1.0))
                for x, z in profile]
    vertices = [tuple(SURFACE @ Vector(vertex)) if vertex[2] > 0.12
                else (vertex[0], (SURFACE @ Vector(vertex)).y, 0.12)
                for vertex in vertices]
    faces = [(j, j + 1, count + j + 1, count + j) for j in range(count - 1)]
    mesh = bpy.data.meshes.new('Lamiera Snow con due pieghe laterali')
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(mat)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = polygon.index not in (0, 17, count - 2)
    body = bpy.data.objects.new('body', mesh)
    bpy.context.scene.collection.objects.link(body)
    thickness = body.modifiers.new('Spessore della lamiera', 'SOLIDIFY')
    thickness.thickness = 0.055
    thickness.offset = -1
    thickness.use_even_offset = True
    edge = body.modifiers.new('Raccordo sottile del bordo libero della lamiera', 'BEVEL')
    edge.width = 0.022
    edge.segments = 4
    edge.limit_method = 'ANGLE'
    edge.angle_limit = 0.5
    edge.harden_normals = True
    body['front_width_ratio'] = 0.94
    body['construction'] = 'powder coated sheet with left and right 90 degree bends'
    body['bend_radius'] = radius
    body['sheet_thickness'] = 0.055
    body['front_height_cm'] = FRONT_HEIGHT
    body['rear_height_cm'] = REAR_HEIGHT
    return body


def rigid_key_mesh():
    """Tasto ABS basso, con raccordi minimi e corona appena convessa.

    La curvatura della faccia genera la sfumatura sotto il softbox senza
    aumentare lo spessore delle pareti o arrotondare troppo gli angoli.
    """
    profiles = [(0.500, 0.032, 0.012), (0.500, 0.032, 0.105),
                (0.494, 0.029, 0.119), (0.485, 0.025, 0.125)]
    # Dense concentric contours resolve the shallow crown without faceting.
    crown_start = len(profiles)
    profiles += [(half, min(0.025, half * 0.1), 0.125)
                 for half in (0.45, 0.40, 0.35, 0.30, 0.25, 0.20, 0.15, 0.10, 0.05)]
    vertices, faces = [], []
    count = len(vp.rrect(0.5, 0.5, 0.032, segs=8))
    for index, (half, radius, z) in enumerate(profiles):
        for x, y in vp.rrect(half, half, radius, segs=8):
            if index >= crown_start:
                z = 0.125 + 0.04 * (1 - (x / 0.485) ** 2) * (1 - (y / 0.485) ** 2)
            vertices.append((x, y, z))
    for ring in range(len(profiles) - 1):
        base, upper = ring * count, (ring + 1) * count
        for j in range(count):
            k = (j + 1) % count
            faces.append((base + j, base + k, upper + k, upper + j))
    last = (len(profiles) - 1) * count
    faces.append(tuple(last + j for j in range(count)))
    faces.append(tuple(reversed(range(count))))
    mesh = bpy.data.meshes.new('Tasto Snow basso con superficie lievemente convessa')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    # Keep straight ABS walls; smooth only the bevel and shallow crown.
    for polygon in mesh.polygons:
        polygon.use_smooth = 2 * count <= polygon.index < (len(profiles) - 1) * count
    mesh.materials.append(vs.plastic('ABS rigido tasto Snow', vs.srgb('#a7aba9'),
                                   0.34, coat=0.065, bump=0.025))
    return mesh


def rigid_knobs(scene):
    """ABS uniforme, corpo alto a cono tronco e indice chiaro in rilievo."""
    plastic = vs.plastic('ABS uniforme manopola Snow', vs.srgb('#a6a9a5'),
                         0.45, coat=0.04, bump=0.02)
    pointer_mat = vs.plastic('Indice chiaro in rilievo Snow', vs.srgb('#f4f4ed'),
                             0.40, coat=0.02)
    for name in fp.KNOBS:
        rotor = bpy.data.objects[name]
        for child in list(rotor.children_recursive):
            bpy.data.objects.remove(child, do_unlink=True)
        grip = vs.fluted_skirt(plastic, r_bottom=1.0, r_top=0.91,
                               height=0.98, flutes=14, depth=0.055)
        cap = vs.revolve('Tappo piano senza scanalatura Snow',
                         [(0, 1.09), (0.810, 1.09), (0.843, 1.085),
                          (0.856, 1.074), (0.86, 1.040), (0.85, 0.97)], plastic)
        for polygon in cap.data.polygons:
            if polygon.index % 5 == 0:
                polygon.use_smooth = False
        pointer = vs.beveled_box('Indice sopraelevato Snow', (0.125, 0.84, 0.07),
                                  0.008, pointer_mat, (0, 0.38, 1.125), segments=3)
        for obj in (grip, cap, pointer):
            obj.parent = rotor


def section_backgrounds():
    """Serigrafia grigia più scura dei controlli, come nel riferimento Snow."""
    mat = studio.grain_material('Fondo grafico sezioni Snow', '#818682',
                                0.62, 0, 115, 0.004, contrast=0.012)
    for name in ('rec-matrix', 'rec-bottom'):
        bpy.data.objects[name].data.materials[0] = mat


def grey_wood_desk():
    mat = studio.wood()
    mat.name = 'Legno grigio medio Snow'
    shader = mat.node_tree.nodes['Principled BSDF']
    shader.inputs['Roughness'].default_value = 0.68
    for node in mat.node_tree.nodes:
        if node.type == 'VALTORGB':
            node.color_ramp.elements[0].color = (*vs.srgb('#5e5f5c'), 1)
            node.color_ramp.elements[1].color = (*vs.srgb('#8d8c86'), 1)
    bpy.data.objects['Scrivania studio'].data.materials[0] = mat


def cherry_front_panel():
    """Pannello di ciliegio incassato nel vano frontale della fascia metallica."""
    mat = studio.material('Ciliegio naturale opaco: frontale Snow', '#967b65', 0.68)
    shader = mat.node_tree.nodes['Principled BSDF']
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Coat Weight'].default_value = 0
    shader.inputs['Specular IOR Level'].default_value = 0.22
    nt = mat.node_tree
    coords = nt.nodes.new('ShaderNodeTexCoord')
    mapping = nt.nodes.new('ShaderNodeVectorMath')
    mapping.operation = 'MULTIPLY'
    mapping.inputs[1].default_value = (4.0, 0.3, 4.0)
    nt.links.new(coords.outputs['Generated'], mapping.inputs[0])
    grain = nt.nodes.new('ShaderNodeTexNoise')
    grain.inputs['Scale'].default_value = 2.0
    grain.inputs['Detail'].default_value = 4
    grain.inputs['Roughness'].default_value = 0.7
    nt.links.new(mapping.outputs['Vector'], grain.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.32
    ramp.color_ramp.elements[0].color = (*vs.srgb('#665247'), 1)
    ramp.color_ramp.elements[1].position = 0.68
    ramp.color_ramp.elements[1].color = (*vs.srgb('#ae927b'), 1)
    nt.links.new(grain.outputs['Fac'], ramp.inputs[0])
    nt.links.new(ramp.outputs['Color'], shader.inputs['Base Color'])
    pores = nt.nodes.new('ShaderNodeTexNoise')
    pores.inputs['Scale'].default_value = 70
    pores.inputs['Detail'].default_value = 3
    nt.links.new(mapping.outputs['Vector'], pores.inputs['Vector'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.13
    bump.inputs['Distance'].default_value = 0.008
    nt.links.new(pores.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    # The upper corners follow the sheet bends; the broad front face stays flat.
    half_width, bottom, top = 15.65, 0.05, FRONT_HEIGHT - 0.06
    half_height, centre = (top - bottom) / 2, (top + bottom) / 2
    outline = []
    for cx, cz, radius, start in ((half_width - 0.5, half_height - 0.5, 0.5, 0),
                                  (-half_width + 0.5, half_height - 0.5, 0.5, 90),
                                  (-half_width + 0.10, -half_height + 0.10, 0.10, 180),
                                  (half_width - 0.10, -half_height + 0.10, 0.10, 270)):
        for step in range(17):
            angle = math.radians(start + 90 * step / 16)
            outline.append((cx + radius * math.cos(angle), centre + cz + radius * math.sin(angle)))
    front_y = (SURFACE @ Vector((0, -fp.B, fp.T))).y + 0.05
    count = len(outline)
    vertices = [(x, y, z) for y in (front_y, front_y + 0.60) for x, z in outline]
    faces = [tuple(range(count)), tuple(reversed(range(count, 2 * count)))]
    faces += [(j, count + j, count + (j + 1) % count, (j + 1) % count) for j in range(count)]
    mesh = bpy.data.meshes.new('Frontale ciliegio con angoli adattati alla lamiera')
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(mat)
    mesh.update()
    panel = bpy.data.objects.new('Pannello frontale ciliegio', mesh)
    bpy.context.scene.collection.objects.link(panel)
    bevel = panel.modifiers.new('Raccordo bordo del ciliegio', 'BEVEL')
    bevel.width, bevel.segments = 0.035, 4
    panel['material_species'] = 'cherry wood'
    panel['front_recess'] = 0.05

    return panel


def clear_plexiglass_frame():
    """Lastra trasparente di PMMA con bordi smussati, sopra la scocca."""
    old = bpy.data.objects['bezel']
    x, y = old.location.x, old.location.y
    width, height = old.dimensions.x, old.dimensions.y
    bpy.data.objects.remove(old, do_unlink=True)
    mat = studio.material('Plexiglass trasparente cornice Snow', '#f5f7f5', 0.065)
    shader = mat.node_tree.nodes['Principled BSDF']
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Transmission Weight'].default_value = 1
    shader.inputs['IOR'].default_value = 1.49
    shader.inputs['Specular IOR Level'].default_value = 0.12
    shader.inputs['Coat Weight'].default_value = 0
    # Preserve glass at the bevels but suppress flat-face softbox glare,
    # equivalent to a controlled studio reflection for readable panel lettering.
    nt = mat.node_tree
    transparent = nt.nodes.new('ShaderNodeBsdfTransparent')
    fresnel = nt.nodes.new('ShaderNodeFresnel')
    fresnel.inputs['IOR'].default_value = 1.49
    reflect = nt.nodes.new('ShaderNodeMath')
    reflect.operation, reflect.use_clamp = 'MULTIPLY', True
    reflect.inputs[1].default_value = 3
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(fresnel.outputs[0], reflect.inputs[0])
    nt.links.new(reflect.outputs[0], mix.inputs[0])
    nt.links.new(transparent.outputs[0], mix.inputs[1])
    nt.links.new(shader.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    vs.beveled_box('bezel', (width, height, 0.14), 0.05, mat,
                   (x, y, fp.T + 0.07), segments=2)


def powder_coated_steel(body):
    """Opaque powder coating over steel: dielectric paint, not bare metal.

    The micro-bump represents fine paint porosity, rather than moulded plastic
    or exposed polished steel. Object coordinates keep grain size consistent.
    """
    mat = studio.grain_material('Acciaio Snow verniciato a polvere',
                                '#dee0dc', 0.57, 0.0, 115, 0.012, contrast=0.018)
    shader = mat.node_tree.nodes['Principled BSDF']
    shader.inputs['Specular IOR Level'].default_value = 0.34
    shader.inputs['Coat Weight'].default_value = 0.0
    body.data.materials[0] = mat
    body['substrate'] = 'steel'
    body['surface_finish'] = 'fine porous powder coat'


def studio_lighting(scene):
    world = scene.world.node_tree.nodes['Background']
    world.inputs['Strength'].default_value = 0.015
    scene.view_settings.exposure = -0.5
    settings = [
        ('Softbox principale', (-16, 7, 20), 5600, 8, (1.0, 0.94, 0.85), 'DISK'),
        ('Riempimento freddo', (19, -10, 17), 400, 15, (0.80, 0.88, 1.0), 'DISK'),
        ('Luce posteriore studio', (9, 15, 15), 2500, 10, (0.75, 0.85, 1.0), 'RECTANGLE'),
    ]
    for name, location, energy, size, color, shape in settings:
        obj = bpy.data.objects[name]
        obj.location = SURFACE @ Vector(location)
        obj.data.energy = energy
        obj.data.size = size
        obj.data.color = color
        obj.data.shape = shape
        if shape == 'RECTANGLE':
            obj.data.size_y = 2.5
        vs.look_at(obj, SURFACE @ Vector((0, 0, fp.T)))

    # A low, broad studio bounce lights the desk below the open sheet.
    # It removes the solid black strip without changing the approved side bend.
    bounce = bpy.data.objects.new('Rimbalzo basso studio', bpy.data.lights.new('Rimbalzo basso studio', 'AREA'))
    scene.collection.objects.link(bounce)
    bounce.location = (0, -19, 1.1)
    bounce.data.energy = 2400
    bounce.data.shape = 'RECTANGLE'
    bounce.data.size = 16
    bounce.data.size_y = 0.8
    bounce.data.color = (0.92, 0.94, 1.0)
    vs.look_at(bounce, (0, -7, 0))
    receivers = bpy.data.collections.new('Piano e lamiera: rimbalzo inferiore')
    receivers.objects.link(bpy.data.objects['body'])
    receivers.objects.link(bpy.data.objects['Pannello frontale ciliegio'])
    bounce.light_linking.receiver_collection = receivers
    floor_fill = bpy.data.objects.new('Rimbalzo morbido piano studio', bpy.data.lights.new('Rimbalzo morbido piano studio', 'AREA'))
    scene.collection.objects.link(floor_fill)
    floor_fill.location = (0, -20, 3)
    floor_fill.data.energy = 650
    floor_fill.data.shape = 'RECTANGLE'
    floor_fill.data.size, floor_fill.data.size_y = 18, 8
    floor_fill.data.color = (0.96, 0.96, 1.0)
    vs.look_at(floor_fill, (0, -10, -0.08))
    floor_receivers = bpy.data.collections.new('Solo piano: luce morbida di contatto')
    floor_receivers.objects.link(bpy.data.objects['Scrivania studio'])
    floor_fill.light_linking.receiver_collection = floor_receivers


def main():
    # Inizializza Cycles e nomi dei nodi indipendentemente dalla lingua delle preferenze locali.
    vp.reset(10, 10)
    bpy.ops.wm.open_mainfile(filepath=SOURCE)
    scene = bpy.context.scene
    body = tapered_chassis()
    powder_coated_steel(body)
    rigid_knobs(scene)
    section_backgrounds()
    grey_wood_desk()
    cherry_front_panel()
    clear_plexiglass_frame()
    mesh = rigid_key_mesh()
    keys = [obj for obj in scene.objects if obj.type == 'MESH'
            and obj.name.startswith('key') and obj.parent and obj.parent.name.startswith('frontBtn')]
    if len(keys) != len(fp.KEYS):
        raise RuntimeError(f'Attesi {len(fp.KEYS)} tasti Snow, trovati {len(keys)}.')
    for obj in keys:
        obj.modifiers.clear()
        obj.data = mesh
        obj.location.z = 0
    # Rigidly transform hardware and camera together: the interactive anchors
    # remain identical while the chassis obtains the requested 4/4.5 cm slope.
    for obj in scene.objects:
        if obj.parent or obj.hide_render or obj.type in ('LIGHT', 'CAMERA'):
            continue
        if obj.name in ('body', 'Scrivania studio', 'Pannello frontale ciliegio'):
            continue
        obj.matrix_world = SURFACE @ obj.matrix_world
        if obj.type == 'CURVE' and obj.data.name.startswith('groove'):
            obj.data.bevel_depth = 0.028
    scene.camera.matrix_world = SURFACE @ scene.camera.matrix_world
    # Keep all hardware at its existing pixel coordinates and add floor below
    # the taller chassis, so its physical contact shadow is not cropped away.
    up = scene.camera.matrix_world.to_3x3() @ Vector((0, 1, 0))
    scene.camera.location -= up * (scene.camera.data.ortho_scale * 120 / 1920 / 2)
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1200
    scene['hardware_surface_matrix'] = [value for row in SURFACE for value in row]
    studio_lighting(scene)
    preview = '--preview' in sys.argv
    scene.render.resolution_percentage = 65 if preview else 100
    scene.cycles.samples = 24 if preview else 128
    scene.render.filepath = os.path.join(studio.OUT, NAME + '.png')
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(studio.OUT, NAME + '.blend'))
    print(f'Scocca in acciaio verniciato a polvere, {len(keys)} tasti bassi e lievemente convessi, manopole rigide.', flush=True)
    studio.render(scene, NAME)


if __name__ == '__main__':
    main()
