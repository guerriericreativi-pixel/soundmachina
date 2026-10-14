"""
Render fotorealistico (Blender Cycles) dei controlli hardware del Virus TI Snow
in sprite sheet WebP per l'editor web. Geometrie ricavate da virus_ti_snow_hires.jpg.

Uso:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/render-sprites/virus_sprites.py -- [nome_job] [--preview]

Output: assets/sprites/<job>.webp
  manopole: griglia 16 x 8 = 128 fotogrammi, fotogramma i in (i % 16, i // 16),
            angolo = -135 + i / 127 * 270 gradi (orario, 0 = indice in alto)
  tasti:    2 fotogrammi affiancati (su, giu'), il tasto occupa 1/1.8 della cella
"""
import math
import os
import sys
import tempfile

import bpy
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'sprites')

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in argv
ONLY = [a for a in argv if not a.startswith('--')]

FRAMES = 128
COLS = 16
TILT = math.radians(18)          # camera inclinata verso l'utente: si vede un filo del fianco

def srgb(hexstr):
    """colore sRGB '#rrggbb' -> lineare (Cycles lavora in lineare)"""
    c = [int(hexstr[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# colori misurati sulla foto del Virus TI Snow (luce ambiente) e sul tema Dark Star
PAL = {
    'snow': dict(skirt=srgb('#6a6a68'), cap=srgb('#c4c4c1'), pointer=srgb('#f4f4f1'),
                 collar=srgb('#e6e6e3'), key=srgb('#9a9a98'), glow=0.0),
    'dark': dict(skirt=srgb('#1d1d1f'), cap=srgb('#2a2a2d'), pointer=srgb('#ff1e2e'),
                 collar=srgb('#2c2d30'), key=srgb('#313236'), glow=3.0),
}

JOBS = {
    'knob-snow':        dict(part='knob', skin='snow', collar=False, cell=144),
    'knob-snow-collar': dict(part='knob', skin='snow', collar=True,  cell=144),
    'knob-dark':        dict(part='knob', skin='dark', collar=False, cell=144),
    'knob-dark-collar': dict(part='knob', skin='dark', collar=True,  cell=144),
    'key-snow':         dict(part='key',  skin='snow', cell=128),
    'key-dark':         dict(part='key',  skin='dark', cell=128),
}


# ---------------------------------------------------------------- scena
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception:
        sc.cycles.device = 'CPU'
    sc.cycles.samples = 24 if PREVIEW else 64
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'

    world = bpy.data.worlds.new('world')
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.55, 0.56, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = 0.45
    return sc


def look_at(obj, target=(0, 0, 0)):
    from mathutils import Vector
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def add_camera(view):
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = view * 2
    cam.location = (0, -10 * math.sin(TILT), 10 * math.cos(TILT))
    look_at(cam)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam


def add_lights(overhead=False):
    # luce principale ampia dall'alto a sinistra: ombre morbide verso il basso a destra
    key = bpy.data.objects.new('key', bpy.data.lights.new('key', 'AREA'))
    key.data.energy = 520
    key.data.size = 5
    key.location = (-1.4, 1.8, 8.5) if overhead else (-3.2, 3.4, 7.5)
    look_at(key)
    bpy.context.scene.collection.objects.link(key)
    # riempimento morbido dal basso/destra per non chiudere le ombre
    fill = bpy.data.objects.new('fill', bpy.data.lights.new('fill', 'AREA'))
    fill.data.energy = 140
    fill.data.size = 8
    fill.location = (4, -4, 6)
    look_at(fill)
    bpy.context.scene.collection.objects.link(fill)


def add_shadow_catcher():
    bpy.ops.mesh.primitive_plane_add(size=20)
    p = bpy.context.active_object
    p.is_shadow_catcher = True
    return p


# ---------------------------------------------------------------- materiali
def plastic(name, color, rough, coat=0.1, emission=0.0, bump=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.5
    b.inputs['Specular IOR Level'].default_value = 0.45
    if emission:
        b.inputs['Emission Color'].default_value = (*color, 1)
        b.inputs['Emission Strength'].default_value = emission
    if bump:
        # micro-grana della plastica stampata
        noise = nt.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 900
        noise.inputs['Detail'].default_value = 6
        bmp = nt.nodes.new('ShaderNodeBump')
        bmp.inputs['Strength'].default_value = bump
        bmp.inputs['Distance'].default_value = 0.002
        nt.links.new(noise.outputs['Fac'], bmp.inputs['Height'])
        nt.links.new(bmp.outputs['Normal'], b.inputs['Normal'])
    return m


# ---------------------------------------------------------------- geometrie
def mesh_obj(name, verts, faces, mat, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if smooth:
        me.shade_smooth()
    o = bpy.data.objects.new(name, me)
    o.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(o)
    return o


def revolve(name, profile, mat, segs=128):
    """profile: [(r, z)] dal centro verso l'esterno/basso; r=0 chiude con un ventaglio."""
    verts, faces = [], []
    n = len(profile)
    for j in range(segs):
        a = 2 * math.pi * j / segs
        for r, z in profile:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for j in range(segs):
        k = (j + 1) % segs
        for i in range(n - 1):
            faces.append((j * n + i, j * n + i + 1, k * n + i + 1, k * n + i))
    return mesh_obj(name, verts, faces, mat)


def fluted_skirt(mat, r_bottom=1.0, r_top=0.9, height=0.78, flutes=28, depth=0.06):
    segs, rings = flutes * 12, 28
    verts, faces = [], []
    for i in range(rings + 1):
        t = i / rings
        r = r_bottom + (r_top - r_bottom) * t
        if t > 0.9:
            r -= (t - 0.9) * 0.6
        z = height * t
        for j in range(segs):
            a = 2 * math.pi * j / segs
            groove = abs(math.sin(flutes * a / 2)) ** 0.35
            rr = r * (1 - depth * (1 - groove))
            verts.append((rr * math.cos(a), rr * math.sin(a), z))
    for i in range(rings):
        for j in range(segs):
            k = (j + 1) % segs
            faces.append((i * segs + j, i * segs + k, (i + 1) * segs + k, (i + 1) * segs + j))
    return mesh_obj('skirt', verts, faces, mat)


def beveled_box(name, size, bevel, mat, location=(0, 0, 0), segments=6):
    bpy.ops.mesh.primitive_cube_add(location=location)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    mod = o.modifiers.new('bevel', 'BEVEL')
    mod.width = bevel
    mod.segments = segments
    mod.limit_method = 'NONE'
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o


def build_knob(skin, collar):
    p = PAL[skin]
    pivot = bpy.data.objects.new('rotor', None)
    bpy.context.scene.collection.objects.link(pivot)
    skirt = fluted_skirt(plastic('skirt', p['skirt'], 0.55, bump=0.15))
    cap = revolve('cap', [(0, 0.93), (0.35, 0.925), (0.62, 0.91), (0.76, 0.89),
                          (0.82, 0.865), (0.85, 0.83), (0.86, 0.77)],
                  plastic('cap', p['cap'], 0.42, coat=0.2, bump=0.1))
    pointer = beveled_box('pointer', (0.1, 0.92, 0.05), 0.018,
                          plastic('pointer', p['pointer'], 0.3, emission=p['glow']),
                          location=(0, 0.42, 0.94))
    for o in (skirt, cap, pointer):
        o.parent = pivot
    if collar:
        revolve('collar', [(1.0, 0.16), (1.2, 0.14), (1.24, 0.05), (1.22, 0.0)],
                plastic('collar', p['collar'], 0.45, coat=0.15))
    return pivot


def build_key(skin):
    # come sull'hardware: spigoli quasi vivi, piano superiore piatto, gomma opaca,
    # sottile feritoia scura nel pannello attorno al tasto
    slot = plastic('slot', (0.012, 0.012, 0.014), 0.9)
    bpy.ops.mesh.primitive_plane_add(size=1.07, location=(0, 0, 0.001))
    bpy.context.active_object.data.materials.append(slot)
    return beveled_box('key', (1, 1, 0.28), 0.018, plastic('key', PAL[skin]['key'], 0.82, coat=0.0, bump=0.12),
                       location=(0, 0, 0.14), segments=2)


# ---------------------------------------------------------------- render + composizione
def render_to_array(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path)
    w, h = img.size
    arr = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    bpy.data.images.remove(img)
    return arr.reshape(h, w, 4)            # righe dal basso verso l'alto (convenzione Blender)


def save_sheet(frames, cols, cell, name, quality=82, clean_shadow_edges=False):
    rows = math.ceil(len(frames) / cols)
    W, H = cols * cell, rows * cell
    sheet = np.zeros((H, W, 4), dtype=np.float32)
    for i, f in enumerate(frames):
        c, r = i % cols, i // cols
        y0 = H - (r + 1) * cell
        if clean_shadow_edges:
            f = f.copy()
            alpha = f[..., 3]
            # Catcher indirect light leaves a faint nonuniform matte. Its
            # boundary opacity estimates the unwanted floor for this frame.
            border = np.concatenate((alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]))
            floor = float(border.max()) + 1 / 255
            alpha[:] = np.clip((alpha - floor) / (1 - floor), 0, 1)
            distance = np.minimum(np.arange(cell), np.arange(cell)[::-1])
            fade = np.clip(distance / 6, 0, 1)
            fade = fade * fade * (3 - 2 * fade)
            alpha *= fade[:, None] * fade[None, :]
        sheet[y0:y0 + cell, c * cell:(c + 1) * cell] = f
    # il catcher lascia un velo d'ombra quasi invisibile su tutta la cella: lo azzera
    a = sheet[..., 3]
    if not clean_shadow_edges:
        sheet[..., 3] = np.clip((a - 0.025) / 0.975, 0, 1)
    img = bpy.data.images.new(name, W, H, alpha=True)
    img.pixels.foreach_set(sheet.ravel())
    img.filepath_raw = os.path.join(OUT, name + '.webp')
    img.file_format = 'WEBP'
    bpy.context.scene.render.image_settings.quality = quality
    img.save()
    print(f'{name}: {W}x{H}  {os.path.getsize(img.filepath_raw) // 1024} KB')


def run(name, job):
    sc = reset_scene()
    cell = job['cell']
    sc.render.resolution_x = sc.render.resolution_y = cell
    add_lights(overhead=job['part'] == 'key')
    add_shadow_catcher()
    tmp = tempfile.mkdtemp()
    if job['part'] == 'knob':
        add_camera(1.6)
        rotor = build_knob(job['skin'], job['collar'])
        idx = [FRAMES // 2] if PREVIEW else range(FRAMES)
        frames = []
        for i in idx:
            deg = -135 + i / (FRAMES - 1) * 270
            rotor.rotation_euler = (0, 0, -math.radians(deg))
            frames.append(render_to_array(os.path.join(tmp, f'{i:03d}.png')))
        save_sheet(frames, 1 if PREVIEW else COLS, cell, name + ('-preview' if PREVIEW else ''))
    else:
        add_camera(0.9)
        key = build_key(job['skin'])
        frames = []
        for pressed in (False, True):
            key.location.z = 0.07 if pressed else 0.14
            frames.append(render_to_array(os.path.join(tmp, f'{int(pressed)}.png')))
        save_sheet(frames, 2, cell, name + ('-preview' if PREVIEW else ''))


if __name__ == '__main__':   # importabile da virus_faceplate.py
    os.makedirs(OUT, exist_ok=True)
    for name, job in JOBS.items():
        if ONLY and name not in ONLY:
            continue
        run(name, job)
