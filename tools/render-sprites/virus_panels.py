"""
Render fotorealistico (Blender Cycles) della scocca del Virus TI Snow / TI2 Dark Star:
texture ripetibili della superficie e cornici 9-slice per CSS border-image.

Uso:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/render-sprites/virus_panels.py -- [nome_job] [--preview]

Output in assets/sprites/ (scala 2x: 120 px per unita' modello = 60 px CSS):
  surface-<skin>.webp   tile senza giunture 512x512 (256 px CSS)
  chassis-<skin>.webp   cornice scocca: slice 108 px, margine esterno 72 px (ombra)
  recess-<skin>.webp    incavo pannello: slice 72 px, margine esterno 30 px
  bezel-<skin>.webp     placca LCD in alluminio con 4 viti: slice 60 px, margine 18 px
  screw-<skin>.webp     vite a brugola 64x64
Le parti piane (centro scocca, fondo incavo) sono trasparenti: sotto c'e' la texture
di superficie applicata dal CSS, cosi' l'elemento puo' avere qualsiasi dimensione.
"""
import math
import os
import sys

import bpy
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'sprites')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in argv
ONLY = [a for a in argv if not a.startswith('--')]
PPU = 120  # pixel per unita'


def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


SKIN = {
    'snow': dict(body=srgb('#e3e3e1'), recess=srgb('#d3d2ce'), plate=srgb('#cfd0d2'),
                 brushed=False, rough=0.55),
    'dark': dict(body=srgb('#4a4d52'), recess=srgb('#2c2d30'), plate=srgb('#3a3c40'),
                 brushed=True, rough=0.38),
}


# ---------------------------------------------------------------- scena
def reset(res_x, res_y, samples=96):
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
    sc.cycles.samples = 16 if PREVIEW else samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'
    sc.render.resolution_x, sc.render.resolution_y = res_x, res_y
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.6, 0.6, 0.62, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.5
    # sole morbido dall'alto a sinistra: illuminazione uniforme, ombre sfumate verso il basso a destra
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 3.2
    sun.data.angle = math.radians(24)
    sun.rotation_euler = (math.radians(-36), math.radians(-24), 0)
    sc.collection.objects.link(sun)
    return sc


def camera(width_u, height_u):
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(width_u, height_u)
    cam.location = (0, 0, 20)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam


def link(o):
    bpy.context.scene.collection.objects.link(o)
    return o


# ---------------------------------------------------------------- materiali
def surface_material(skin, color=None, periodic=False):
    """verniciatura a polvere (snow) o alluminio spazzolato (dark); periodic=True -> tile senza giunture"""
    s = SKIN[skin]
    m = bpy.data.materials.new('surf')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*(color or s['body']), 1)
    b.inputs['Roughness'].default_value = s['rough']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.noise_dimensions = '4D'
    noise.inputs['Detail'].default_value = 8
    if periodic:
        # coordinate mappate su un toro 4D: il rumore si ripete esattamente ai bordi del tile (-1..1)
        sep = nt.nodes.new('ShaderNodeSeparateXYZ')
        nt.links.new(tc.outputs['Object'], sep.inputs[0])
        r1, r2 = (1.0, 40.0) if s['brushed'] else (6.0, 6.0)

        def trig(axis, fn, r):
            mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
            mul.inputs[1].default_value = math.pi
            nt.links.new(sep.outputs[axis], mul.inputs[0])
            t = nt.nodes.new('ShaderNodeMath'); t.operation = fn
            nt.links.new(mul.outputs[0], t.inputs[0])
            k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'
            k.inputs[1].default_value = r
            nt.links.new(t.outputs[0], k.inputs[0])
            return k.outputs[0]
        comb = nt.nodes.new('ShaderNodeCombineXYZ')
        nt.links.new(trig('X', 'COSINE', r1), comb.inputs[0])
        nt.links.new(trig('X', 'SINE', r1), comb.inputs[1])
        nt.links.new(trig('Y', 'COSINE', r2), comb.inputs[2])
        nt.links.new(comb.outputs[0], noise.inputs['Vector'])
        nt.links.new(trig('Y', 'SINE', r2), noise.inputs['W'])
        noise.inputs['Scale'].default_value = 9 if not s['brushed'] else 2.2
    else:
        mapping = nt.nodes.new('ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (0.05, 4, 1) if s['brushed'] else (1, 1, 1)
        nt.links.new(tc.outputs['Object'], mapping.inputs[0])
        nt.links.new(mapping.outputs[0], noise.inputs['Vector'])
        noise.inputs['Scale'].default_value = 30
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.3 if s['brushed'] else 0.6
    bump.inputs['Distance'].default_value = 0.002
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    # variazione tonale minima (righe dello spazzolato / buccia d'arancia della vernice)
    ramp = nt.nodes.new('ShaderNodeMapRange')
    ramp.inputs['To Min'].default_value = s['rough'] - 0.08
    ramp.inputs['To Max'].default_value = s['rough'] + 0.08
    nt.links.new(noise.outputs['Fac'], ramp.inputs['Value'])
    nt.links.new(ramp.outputs['Result'], b.inputs['Roughness'])
    if s['brushed']:
        b.inputs['Metallic'].default_value = 0.85
    return m


def holdout():
    m = bpy.data.materials.new('hold')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    h = nt.nodes.new('ShaderNodeHoldout')
    nt.links.new(h.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


def catcher_plane(z=0.0, size=40):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    p = bpy.context.active_object
    p.is_shadow_catcher = True
    return p


# ---------------------------------------------------------------- geometria: sweep su rettangolo arrotondato
def rrect(a, b, r, segs=10):
    """contorno di un rettangolo arrotondato (semi-lati a, b, raggio r), antiorario"""
    pts = []
    for cx, cy, a0 in ((a - r, b - r, 0), (-a + r, b - r, 90), (-a + r, -b + r, 180), (a - r, -b + r, 270)):
        for i in range(segs + 1):
            t = math.radians(a0 + 90 * i / segs)
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts


def sweep(name, a, b, r, profile, mats, center_mat=None, smooth=True):
    """profile: [(offset, z, mat_idx)] dall'interno all'esterno; offset allarga il contorno.
    center_mat: indice materiale del riempimento centrale (None = aperto)."""
    rings = []
    verts = []
    for off, z, _ in profile:
        ring = rrect(a + off, b + off, max(r + off, 0.001))
        rings.append(len(verts))
        verts += [(x, y, z) for x, y in ring]
    n = len(rrect(a, b, r))
    faces, fmat = [], []
    for k in range(len(profile) - 1):
        s0, s1 = rings[k], rings[k + 1]
        for j in range(n):
            jn = (j + 1) % n
            faces.append((s0 + j, s1 + j, s1 + jn, s0 + jn))
            fmat.append(profile[k + 1][2])
    if center_mat is not None:
        c = len(verts)
        verts.append((0, 0, profile[0][1]))
        for j in range(n):
            faces.append((c, rings[0] + j, rings[0] + (j + 1) % n))
            fmat.append(center_mat)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    for m in mats:
        me.materials.append(m)
    n_ring_faces = (len(profile) - 1) * n
    for i, (poly, mi) in enumerate(zip(me.polygons, fmat)):
        poly.material_index = mi
        poly.use_smooth = smooth and i < n_ring_faces   # centro piatto, niente riflessi a X
    me.update()
    return link(bpy.data.objects.new(name, me))


def quarter(off0, z0, radius, steps=8, outward=True):
    """arco di raccordo da (off0, z0) che scende e si allarga verso l'esterno"""
    return [(off0 + radius * math.sin(math.pi / 2 * i / steps),
             z0 - radius * (1 - math.cos(math.pi / 2 * i / steps))) for i in range(steps + 1)]


# ---------------------------------------------------------------- render + salvataggio
def render_save(name, alpha_floor=0.02):
    path = os.path.join(bpy.app.tempdir, name + '.png')
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path)
    w, h = img.size
    arr = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    arr = arr.reshape(h, w, 4)
    arr[..., 3] = np.clip((arr[..., 3] - alpha_floor) / (1 - alpha_floor), 0, 1)
    out = bpy.data.images.new(name, w, h, alpha=True)
    out.pixels.foreach_set(arr.ravel())
    out.filepath_raw = os.path.join(OUT, name + ('-preview' if PREVIEW else '') + '.webp')
    out.file_format = 'WEBP'
    out.save()
    print(f'{name}: {w}x{h}  {os.path.getsize(out.filepath_raw) // 1024} KB')


# ---------------------------------------------------------------- job
def job_surface(skin):
    reset(512, 512, samples=64)
    camera(2, 2)
    bpy.ops.mesh.primitive_plane_add(size=2.2)   # oltre l'inquadratura: niente bordi nel tile
    p = bpy.context.active_object
    p.data.materials.append(surface_material(skin, periodic=True))
    bpy.context.scene.render.film_transparent = False
    render_save(f'surface-{skin}', alpha_floor=0)


TILT = math.radians(18)   # stessa inclinazione degli sprite di manopole e tasti


def tilted_frame(a, b, z_top, z_bottom, margin):
    """camera ortografica inclinata verso l'utente: la faccia frontale (lato -Y) resta visibile.
    Restituisce i margini in px tra bordo immagine e contorno dell'elemento CSS (lato superiore
    del pannello a z_top), per calcolare slice e outset di border-image."""
    up = (0, math.cos(TILT), math.sin(TILT))
    v = lambda y, z: y * up[1] + z * up[2]
    top = v(b, z_top) + margin
    bottom = v(-b, z_bottom) - margin
    width, height = 2 * (a + margin), top - bottom
    sc = bpy.context.scene
    sc.render.resolution_x = round(width * PPU)
    sc.render.resolution_y = round(height * PPU)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(width, height)
    vc = (top + bottom) / 2
    view = (0, math.sin(TILT), -math.cos(TILT))
    cam.location = tuple(up[i] * vc - view[i] * 30 for i in range(3))
    cam.rotation_euler = (TILT, 0, 0)
    sc.collection.objects.link(cam)
    sc.camera = cam
    px = lambda u: round(u * PPU)
    return dict(left=px(margin), right=px(margin), top=px(top - v(b, z_top)),
                bottom=px(v(-b, z_top) - bottom))


def job_chassis(skin):
    # scocca 8x5, spessa 1.0 con raccordo 0.3: come la lamiera piegata del Snow,
    # inquadrata inclinata cosi' sotto al pannello si vede la faccia frontale
    W, H, T, R, M = 8.0, 5.0, 1.0, 0.3, 0.6
    reset(10, 10)
    a, b, r = W / 2, H / 2, 0.25
    m = tilted_frame(a, b, T - R, 0, M)
    prof = [(-R, T, 1)] + [(o, z, 1) for o, z in quarter(-R, T, R, 10)[1:]] + [(0, 0.0, 1)]
    sweep('chassis', a, b, r, prof, [holdout(), surface_material(skin)], center_mat=0)
    catcher_plane()
    render_save(f'chassis-{skin}')
    pad = round(0.15 * PPU)
    print(f'chassis-{skin} margins {m}  slice: {m["top"] + round(R * PPU) + pad} '
          f'{m["right"] + round(R * PPU) + pad} {m["bottom"] + pad} {m["left"] + round(R * PPU) + pad}')


def job_button(skin):
    # tasto in gomma rettangolare 3x1 per i pulsanti con testo, 2 stati (su / premuto).
    # Come i tasti del Virus: spigoli quasi vivi, piano piatto, gomma opaca, feritoia scura attorno.
    W, H, R, M = 3.0, 1.0, 0.02, 0.22
    col = srgb('#9a9a98') if skin == 'snow' else srgb('#36373b')   # stesso grigio dei tasti quadrati (foto)
    for state, T in (('up', 0.2), ('down', 0.11)):
        reset(10, 10)
        a, b, r = W / 2, H / 2, 0.04
        m = tilted_frame(a, b, T - R, 0, M)
        mat = surface_material(skin, col)
        bsdf = mat.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.82
        bsdf.inputs['Specular IOR Level'].default_value = 0.35
        prof = [(-R, T, 0)] + [(o, z, 0) for o, z in quarter(-R, T, R, 3)[1:]] + [(0, 0.0, 0)]
        sweep('btn', a, b, r, prof, [mat], center_mat=0)
        slot = bpy.data.materials.new('slot')
        slot.use_nodes = True
        slot.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.012, 0.012, 0.014, 1)
        slot.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
        sweep('slot', a, b, r, [(0, 0.001, 0), (0.035, 0.001, 0)], [slot], center_mat=None)
        catcher_plane()
        render_save(f'btn-{skin}-{state}')
        pad = round(0.08 * PPU)
        print(f'btn-{skin}-{state} margins {m}  slice: {m["top"] + round(R * PPU) + pad} '
              f'{m["right"] + round(R * PPU) + pad} {m["bottom"] + pad} {m["left"] + round(R * PPU) + pad}')


def job_recess(skin):
    # incavo 6x3.5 profondo 0.06 con smusso 0.05; anello esterno trasparente di 0.25
    W, H, D, C, M = 6.0, 3.5, 0.06, 0.05, 0.25
    reset(int((W + 2 * M) * PPU), int((H + 2 * M) * PPU))
    camera(W + 2 * M, H + 2 * M)
    a, b, r = W / 2, H / 2, 0.16
    sweep('rim', a, b, r, [(-C, -D, 1), (0, 0, 1), (M, 0, 0)],
          [holdout(), surface_material(skin, SKIN[skin]['body'])], center_mat=None)
    floor = sweep('floor', a, b, r, [(-C, -D, 0)] * 1 + [(-C - 0.001, -D, 0)],
                  [holdout()], center_mat=0)
    floor.is_shadow_catcher = True
    render_save(f'recess-{skin}')


def job_bezel(skin):
    # placca 6x2.2 spessa 0.06 con 4 viti a brugola negli angoli
    W, H, T, M = 6.0, 2.2, 0.06, 0.15
    reset(int((W + 2 * M) * PPU), int((H + 2 * M) * PPU))
    camera(W + 2 * M, H + 2 * M)
    a, b, r = W / 2, H / 2, 0.05
    plate_mat = surface_material('dark' if skin == 'dark' else 'snow', SKIN[skin]['plate'])
    pb = plate_mat.node_tree.nodes['Principled BSDF']
    pb.inputs['Metallic'].default_value = 0.9
    prof = [(-0.025, T, 0)] + [(o, z, 0) for o, z in quarter(-0.025, T, 0.025, 4)[1:]] + [(0, 0, 0)]
    sweep('plate', a, b, r, prof, [plate_mat], center_mat=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            screw(skin, (sx * (a - 0.18), sy * (b - 0.18), T), 0.075)
    catcher_plane()
    render_save(f'bezel-{skin}')


def screw(skin, loc, rad):
    steel = bpy.data.materials.new('steel')
    steel.use_nodes = True
    sb = steel.node_tree.nodes['Principled BSDF']
    sb.inputs['Base Color'].default_value = (*srgb('#b9bcc1' if skin == 'snow' else '#5a5d63'), 1)
    sb.inputs['Metallic'].default_value = 1.0
    sb.inputs['Roughness'].default_value = 0.32
    # testa bombata
    prof = [(0, 0.035), (rad * 0.5, 0.032), (rad * 0.85, 0.022), (rad, 0.008), (rad, 0.0)]
    verts, faces = [], []
    segs = 48
    for j in range(segs):
        t = 2 * math.pi * j / segs
        verts += [(loc[0] + x * math.cos(t), loc[1] + x * math.sin(t), loc[2] + z) for x, z in prof]
    n = len(prof)
    for j in range(segs):
        k = (j + 1) % segs
        for i in range(n - 1):
            faces.append((j * n + i, k * n + i, k * n + i + 1, j * n + i + 1))
    me = bpy.data.meshes.new('screw')
    me.from_pydata(verts, [], faces)
    me.materials.append(steel)
    for p in me.polygons:
        p.use_smooth = True
    link(bpy.data.objects.new('screw', me))
    # incavo esagonale scuro
    hexm = bpy.data.materials.new('hex')
    hexm.use_nodes = True
    hexm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.01, 0.01, 0.012, 1)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=rad * 0.42, depth=0.02,
                                        location=(loc[0], loc[1], loc[2] + 0.03))
    bpy.context.active_object.data.materials.append(hexm)


def job_screw(skin):
    reset(64, 64, samples=64)
    camera(0.36, 0.36)
    screw(skin, (0, 0, 0), 0.12)
    catcher_plane()
    render_save(f'screw-{skin}')


JOBS = {}
for sk in ('snow', 'dark'):
    JOBS[f'surface-{sk}'] = (job_surface, sk)
    JOBS[f'chassis-{sk}'] = (job_chassis, sk)
    JOBS[f'recess-{sk}'] = (job_recess, sk)
    JOBS[f'bezel-{sk}'] = (job_bezel, sk)
    JOBS[f'screw-{sk}'] = (job_screw, sk)
    JOBS[f'btn-{sk}'] = (job_button, sk)

os.makedirs(OUT, exist_ok=True)
for name, (fn, sk) in JOBS.items():
    if ONLY and name not in ONLY:
        continue
    fn(sk)
