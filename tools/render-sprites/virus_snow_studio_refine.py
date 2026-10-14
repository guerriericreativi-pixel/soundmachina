"""Snow: scocca svasata, tasti bombati e luce di studio più direzionale.

Blender -b -P tools/render-sprites/virus_snow_studio_refine.py -- [--preview]
La svasatura è stimata dalle foto, non da quote CAD del produttore.
"""
import os
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
    """Piano superiore leggermente più stretto davanti, con bordo ripiegato morbido."""
    old = bpy.data.objects['body']
    mat = old.data.materials[0]
    bpy.data.objects.remove(old, do_unlink=True)
    edge = 0.20
    profile = [(-edge, fp.T, 0)]
    profile += [(off, z, 0) for off, z in vp.quarter(-edge, fp.T, edge, 12)[1:]]
    profile += [(0, 0.15, 0), (-0.12, 0.0, 0)]
    body = vp.sweep('body', fp.A, fp.B, 0.45, profile, [mat], center_mat=0)
    for vertex in body.data.vertices:
        # Rastrematura del 6% al fronte; la superficie che ospita i controlli rimane a z=T.
        along = min(1.0, max(0.0, (vertex.co.y + fp.B) / (2 * fp.B)))
        vertex.co.x *= 0.94 + 0.06 * along
    body.data.update()
    body['front_width_ratio'] = 0.94
    return body


def crowned_key_mesh():
    """Angoli raccordati e bombatura di 0.04 unità: evita una faccia superiore piatta."""
    profiles = [(0.500, 0.085, 0.012), (0.500, 0.085, 0.185),
                (0.493, 0.085, 0.250), (0.474, 0.079, 0.278),
                (0.435, 0.072, 0.288), (0.360, 0.060, 0.300),
                (0.240, 0.040, 0.311), (0.120, 0.020, 0.318)]
    vertices, faces = [], []
    count = len(vp.rrect(0.5, 0.5, 0.085, segs=8))
    for half, radius, z in profiles:
        vertices.extend((x, y, z) for x, y in vp.rrect(half, half, radius, segs=8))
    for ring in range(len(profiles) - 1):
        base, upper = ring * count, (ring + 1) * count
        for j in range(count):
            k = (j + 1) % count
            faces.append((base + j, base + k, upper + k, upper + j))
    center = len(vertices)
    vertices.append((0, 0, 0.320))
    last = (len(profiles) - 1) * count
    for j in range(count):
        faces.append((center, last + j, last + (j + 1) % count))
    faces.append(tuple(reversed(range(count))))
    mesh = bpy.data.meshes.new('Tasto Snow raccordato e bombato')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = polygon.index != len(mesh.polygons) - 1
    mat = vs.plastic('Superficie tasto Snow satinata', vs.srgb('#989b98'),
                     0.62, coat=0.02, bump=0.08)
    mesh.materials.append(mat)
    return mesh


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
    tapered_chassis()
    mesh = crowned_key_mesh()
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
    print(f'Scocca svasata, {len(keys)} tasti bombati, luce di studio controllata.', flush=True)
    studio.render(scene, NAME)


if __name__ == '__main__':
    main()
