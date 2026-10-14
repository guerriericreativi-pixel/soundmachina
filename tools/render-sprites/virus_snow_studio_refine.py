"""Snow: scocca metallica verniciata a polvere e controlli in plastica rigida.

Blender -b -P tools/render-sprites/virus_snow_studio_refine.py -- [--preview]
La svasatura è stimata dalle foto, non da quote CAD del produttore.
"""
import os
import math
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
import virus_studio_preview as studio
import virus_panels as vp
import virus_faceplate as fp
import virus_sprites as vs

NAME = 'virus-ti-snow-studio-refined'
SOURCE = os.path.join(studio.OUT, 'virus-ti-snow-panel-focus.blend')


def tapered_chassis():
    """Fascia in lamiera con due pieghe laterali a 90°, non un guscio chiuso."""
    old = bpy.data.objects['body']
    mat = old.data.materials[0]
    bpy.data.objects.remove(old, do_unlink=True)
    radius = 0.22
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
    body['front_width_ratio'] = 0.94
    body['construction'] = 'powder coated sheet with left and right 90 degree bends'
    body['bend_radius'] = radius
    body['sheet_thickness'] = 0.055
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
    plastic = vs.plastic('ABS uniforme manopola Snow', vs.srgb('#b2b5b1'),
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
        obj.location = location
        obj.data.energy = energy
        obj.data.size = size
        obj.data.color = color
        obj.data.shape = shape
        if shape == 'RECTANGLE':
            obj.data.size_y = 2.5
        vs.look_at(obj, (0, 0, fp.T))


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
    mesh = rigid_key_mesh()
    keys = [obj for obj in scene.objects if obj.type == 'MESH'
            and obj.name.startswith('key') and obj.parent and obj.parent.name.startswith('frontBtn')]
    if len(keys) != len(fp.KEYS):
        raise RuntimeError(f'Attesi {len(fp.KEYS)} tasti Snow, trovati {len(keys)}.')
    for obj in keys:
        obj.modifiers.clear()
        obj.data = mesh
        obj.location.z = 0
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
