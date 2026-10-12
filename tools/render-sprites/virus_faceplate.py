"""
Frontale del Virus TI Snow renderizzato in un'unica scena Blender Cycles (come i pannelli
dei VST: sfondo statico + controlli mobili sovrapposti, stessa camera e stessa luce).

Uso:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/render-sprites/virus_faceplate.py -- [snow|dark] [--preview]

Output (assets/faceplate/):
  faceplate-<skin>.webp     pannello senza manopole e tasti (2x)
  fp-knob-<skin>.webp       manopola 64 fotogrammi, griglia 8x8 (-135..+135 gradi)
  fp-key-<skin>.webp        tasto quadrato su / premuto
  layout.json               posizioni dei controlli in % dell'immagine del pannello

Impaginazione misurata su virus_ti_snow.jpg (vista frontale ufficiale) ingrandita 3x:
1 unita' modello = 50 px di quell'immagine (circa 1 cm reale).
"""
import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
import virus_panels as vp      # noqa: E402  (materiali, sweep, viti, render_save)
import virus_sprites as vs     # noqa: E402  (manopola, tasto, luci degli sprite)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in argv
SKINS = [a for a in argv if a in ('snow', 'dark')] or ['snow']
OUT = os.path.join(vp.ROOT, 'assets', 'faceplate')
PPU = 64                         # px per unita' nell'immagine del pannello (circa 2x CSS)
TILT = vp.TILT
FRAMES, COLS = 64, 8

# ---------------------------------------------------------------- misure (px immagine di riferimento 3x)
CX, CY = 905, 497.5              # centro della superficie superiore
A, B = 16.8, 9.05                # semi-lati della scocca
T, R_EDGE = 2.0, 0.18            # spessore e raggio del bordo piegato (lamiera: spigolo netto)

def M(px, py):
    return ((px - CX) / 50.0, (CY - py) / 50.0)

KNOBS = {   # id: (cx, cy, collare)
    'frontKnobVolume':    (238, 683, False),
    'frontKnobValue1':    (437, 683, False),
    'frontKnobValue2':    (612, 683, False),
    'frontKnobValue3':    (787, 683, False),
    'frontKnobCutoff':    (1388, 683, True),
    'frontKnobResonance': (1563, 683, True),
}
KNOB_R = 0.96
ROW_X = [983, 1070, 1158, 1246, 1333, 1421, 1508, 1596]
KEYS = {
    'frontBtnTapPanic': (238, 315), 'frontBtnExitMode': (238, 497),
    **{k: (x, 315) for k, x in zip(['frontBtnOsc1', 'frontBtnOsc2', 'frontBtnFilters', 'frontBtnMod',
                                    'frontBtnEnv', 'frontBtnEffects', 'frontBtnArp', 'frontBtnCommon'], ROW_X)},
    **{k: (x, 500) for k, x in zip(['frontBtnValMinus', 'frontBtnValPlus', 'frontBtnParamPrev', 'frontBtnParamNext',
                                    'frontBtnAudition', 'frontBtnMulti', 'frontBtnConfig', 'frontBtnStore'], ROW_X)},
    'frontBtnEditShift': (985, 684), 'frontBtnPartCycle': (1072, 684), 'frontBtnBankSearch': (1160, 684),
}
KEY_SIZE = 1.5
LEDS = {**{f'frontRomLed{i}': (x + 6, 255) for i, x in enumerate(ROW_X)},
        **{f'frontRamLed{i}': (x + 6, 440) for i, x in enumerate(ROW_X)},
        'frontEditShiftLed': (985, 624), 'snowLcdBpmLed': (405, 292)}
LCD_SCREEN = (365, 360, 850, 488)

FONT_DIR = '/System/Library/Fonts/Supplemental/'


def fonts():
    load = lambda f: bpy.data.fonts.load(FONT_DIR + f)
    return dict(din=load('DIN Alternate Bold.ttf'), round=load('Arial Rounded Bold.ttf'),
                black=load('Arial Black.ttf'), regular=load('Arial.ttf'))


def mat(name, color, rough=0.5, metal=0.0, emission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emission:
        b.inputs['Emission Color'].default_value = (*color, 1)
        b.inputs['Emission Strength'].default_value = emission
    return m


PALETTE = {
    'snow': dict(ink=vp.srgb('#46484d'), plate=vp.srgb('#7b726c'), plate_ink=vp.srgb('#f1eee8'),
                 recess=vp.srgb('#c9c8c3'), groove=vp.srgb('#9d9c97'), box=vp.srgb('#b3b4b7'),
                 box_ink=vp.srgb('#f4f4f2'), logo=vp.srgb('#2c3a5c'), slot=vp.srgb('#1c1d20'),
                 led=vp.srgb('#bdb57a'), collar=vp.srgb('#e8e8e5'), screen=vp.srgb('#15191d')),
    'dark': dict(ink=vp.srgb('#c9cbd0'), plate=vp.srgb('#222326'), plate_ink=vp.srgb('#d9dadc'),
                 recess=vp.srgb('#2b2c30'), groove=vp.srgb('#18191b'), box=vp.srgb('#5a5d63'),
                 box_ink=vp.srgb('#f1f2f4'), logo=vp.srgb('#ff2a3b'), slot=vp.srgb('#0b0b0c'),
                 led=vp.srgb('#5a2424'), collar=vp.srgb('#2e2f32'), screen=vp.srgb('#0d0e10')),
}


# ---------------------------------------------------------------- primitive
def flat_rrect(name, px0, py0, px1, py1, r, material, z, chamfer=0.0, height=0.004):
    (x0, y0), (x1, y1) = M(px0, py0), M(px1, py1)
    a, b = abs(x1 - x0) / 2, abs(y1 - y0) / 2
    prof = [(-chamfer, z + height, 0), (0, z - (0.03 if chamfer else 0.0), 0)]
    o = vp.sweep(name, a, b, min(r, a, b), prof, [material], center_mat=0, smooth=False)
    o.location.x, o.location.y = (x0 + x1) / 2, (y0 + y1) / 2
    return o


def disc(name, px, py, radius, material, z, height=0.004, segs=48):
    x, y = M(px, py)
    bpy.ops.mesh.primitive_cylinder_add(vertices=segs, radius=radius, depth=height, location=(x, y, z + height / 2))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    return o


def ring(name, px, py, r0, r1, material, z, height=0.06):
    x, y = M(px, py)
    prof = [(r0, z + height * 0.7), (r0 + 0.04, z + height), (r1 - 0.06, z + height), (r1, z + height * 0.4), (r1, z)]
    o = vp.revolve(name, prof, material, segs=96) if hasattr(vp, 'revolve') else None
    if o is None:
        verts, faces, segs = [], [], 96
        for j in range(segs):
            t = 2 * math.pi * j / segs
            verts += [(x + rr * math.cos(t), y + rr * math.sin(t), zz) for rr, zz in prof]
        n = len(prof)
        for j in range(segs):
            k = (j + 1) % segs
            for i in range(n - 1):
                faces.append((j * n + i, j * n + i + 1, k * n + i + 1, k * n + i))
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts, [], faces)
        me.materials.append(material)
        for p in me.polygons:
            p.use_smooth = True
        o = vp.link(bpy.data.objects.new(name, me))
    else:
        o.location.x, o.location.y = x, y
    return o


Z_INK = T + 0.012     # sopra le piastre degli incavi (T+0.004) e le placche (T+0.006)


def text(body, px, py, cap_px, font, material, align='CENTER', shear=0.0, z=None, spacing=1.0):
    cu = bpy.data.curves.new('txt', 'FONT')
    cu.body = body
    cu.font = font
    cu.size = cap_px / 50.0 / 0.72
    cu.align_x = align
    cu.align_y = 'CENTER'
    cu.shear = shear
    cu.space_character = spacing
    cu.extrude = 0.0006
    o = bpy.data.objects.new('txt', cu)
    x, y = M(px, py)
    o.location = (x, y, (Z_INK if z is None else z) + 0.0015)
    o.data.materials.append(material)
    return vp.link(o)


def groove_path(points_px, material, z=T, depth=0.02):
    cu = bpy.data.curves.new('groove', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = depth
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    sp.points.add(len(points_px) - 1)
    for p, (px, py) in zip(sp.points, points_px):
        x, y = M(px, py)
        p.co = (x, y, z, 1)
    o = bpy.data.objects.new('groove', cu)
    o.data.materials.append(material)
    return vp.link(o)


def star(px, py, radius, material, z=T):
    x, y = M(px, py)
    verts = [(x, y, z + 0.004)]
    for i in range(8):
        r = radius if i % 2 == 0 else radius * 0.32
        t = math.radians(90 + i * 45)
        verts.append((x + r * math.cos(t), y + r * math.sin(t), z + 0.004))
    faces = [(0, i, i % 8 + 1) for i in range(1, 9)]
    me = bpy.data.meshes.new('star')
    me.from_pydata(verts, [], faces)
    me.materials.append(material)
    return vp.link(bpy.data.objects.new('star', me))


# ---------------------------------------------------------------- camera e proiezione
def frame(margin=0.9):
    up_c, up_s = math.cos(TILT), math.sin(TILT)
    v = lambda y, z: y * up_c + z * up_s
    xmin, xmax = -A - margin, A + margin
    vtop = v(B, T) + margin
    vbot = v(-B, 0) - margin * 1.6          # spazio per l'ombra davanti
    width, height = xmax - xmin, vtop - vbot
    sc = bpy.context.scene
    sc.render.resolution_x = round(width * PPU)
    sc.render.resolution_y = round(height * PPU)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(width, height)
    vc = (vtop + vbot) / 2
    view = (0, math.sin(TILT), -math.cos(TILT))
    up = (0, up_c, up_s)
    cam.location = tuple(up[i] * vc - view[i] * 40 for i in range(3))
    cam.rotation_euler = (TILT, 0, 0)
    sc.collection.objects.link(cam)
    sc.camera = cam

    def project(px, py, z=T):
        x, y = M(px, py)
        return ((x - xmin) / width * 100, (vtop - v(y, z)) / height * 100)
    return project, width, height


# ---------------------------------------------------------------- scena del pannello
def build_faceplate(skin):
    P = PALETTE[skin]
    F = fonts()
    ink = mat('ink', P['ink'], 0.55)
    plate_ink = mat('plate_ink', P['plate_ink'], 0.5)
    box_ink = mat('box_ink', P['box_ink'], 0.5)

    # scocca: lamiera con bordo frontale piegato
    surf = vp.surface_material(skin)
    prof = [(-R_EDGE, T, 0)] + [(o, z, 0) for o, z in vp.quarter(-R_EDGE, T, R_EDGE, 12)[1:]] + [(0, 0.0, 0)]
    vp.sweep('body', A, B, 0.22, prof, [surf], center_mat=0)
    vp.catcher_plane()

    # etichette dei connettori sul bordo posteriore
    boxm = mat('box', P['box'], 0.6)
    for (x0, x1), label, subs in (((200, 278), 'POWER', [('IN', 238)]), ((312, 390), 'USB', []),
                                  ((466, 672), 'INPUT', [('LEFT', 495), ('RIGHT/MONO', 610)]),
                                  ((709, 913), 'OUTPUT', [('LEFT', 740), ('RIGHT/MONO', 852)]),
                                  ((1013, 1218), 'MIDI', [('IN', 1037), ('OUT', 1186)])):
        flat_rrect('box', x0, 60, x1, 82, 0.08, boxm, T, height=0.002)
        text(label, (x0 + x1) / 2, 71, 11, F['din'], box_ink)
        for s, sx in subs:
            text(s, sx, 100, 10, F['din'], ink)

    # logo access
    logo = mat('logo', P['logo'], 0.45)
    text('access', 1452, 128, 46, F['round'], logo, align='LEFT', spacing=1.02)
    star(1412, 126, 0.42, logo, z=Z_INK)

    # contorno inciso dell'area di sinistra con il gradino obliquo
    groove = mat('groove', P['groove'], 0.7)
    groove_path([(922, 800), (185, 800), (150, 790), (132, 765), (130, 255), (140, 236), (160, 230),
                 (832, 230), (884, 196), (922, 196)], groove)

    # pannelli ribassati a destra
    rec = mat('recess', P['recess'], 0.6)
    flat_rrect('rec-matrix', 922, 195, 1680, 580, 0.4, rec, T, chamfer=0.05)
    flat_rrect('rec-bottom', 922, 597, 1655, 800, 0.4, rec, T, chamfer=0.05)
    for x0, x1, y in ((950, 1240, 228), (1340, 1630, 228), (950, 1195, 411), (1390, 1630, 411)):
        flat_rrect('rule', x0, y - 1, x1, y + 1, 0.01, ink, Z_INK)
    text('ROM 1-8', 1290, 228, 11, F['din'], ink)
    text('RAM 1-8 / PART 1-4', 1292, 411, 11, F['din'], ink)

    # placche delle etichette
    platem = mat('plate', P['plate'], 0.55)
    flat_rrect('plate-l', 315, 805, 900, 840, 0.18, platem, T, height=0.003)
    flat_rrect('plate-r', 1295, 805, 1640, 840, 0.18, platem, T, height=0.003)
    for s, x in (('PART VOLUME', 437), ('TRANSPOSE', 612), ('PANORAMA', 787),
                 ('FILTER ENVELOPE', 1390), ('AMP ENVELOPE', 1563)):
        text(s, x, 822, 11, F['din'], plate_ink)

    # placca LCD in alluminio spazzolato con viti
    plate_mat = vp.surface_material(skin, vp.SKIN[skin]['plate'])
    plate_mat.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.9
    (x0, y0), (x1, y1) = M(320, 275), M(895, 570)
    bz = vp.sweep('bezel', abs(x1 - x0) / 2, abs(y1 - y0) / 2, 0.06,
                  [(-0.04, T + 0.09, 0)] + [(o, z, 0) for o, z in vp.quarter(-0.04, T + 0.09, 0.04, 4)[1:]] + [(0, T, 0)],
                  [plate_mat], center_mat=0)
    bz.location.x, bz.location.y = (x0 + x1) / 2, (y0 + y1) / 2
    for sx, sy in ((343, 297), (878, 297), (343, 521), (878, 521)):
        x, y = M(sx, sy)
        vp.screw(skin, (x, y, T + 0.09), 0.17)
    flat_rrect('lcd-frame', 350, 345, 865, 500, 0.05, mat('lcdframe', (0.012, 0.013, 0.015), 0.4), T + 0.09)
    flat_rrect('lcd-glass', *LCD_SCREEN, 0.02, mat('screen', P['screen'], 0.15), T + 0.095)
    text('VIRUS', 678, 319, 22, F['black'], ink, align='RIGHT', shear=0.18, z=T + 0.09)
    flat_rrect('bar', 688, 306, 691, 332, 0.005, ink, T + 0.09)
    text('TI SNOW', 700, 319, 22, F['regular'], ink, align='LEFT', z=T + 0.09)
    text('BPM/LFO', 405, 322, 8, F['din'], ink, z=T + 0.09)

    # serigrafia del pannello
    for s, x, y, c in (('TAP TEMPO', 238, 374, 11), ('PANIC', 238, 395, 9), ('EXIT', 246, 557, 11),
                       ('MODE', 238, 578, 9), ('VOLUME', 238, 783, 11), ('VALUE 1', 437, 783, 11),
                       ('VALUE 2', 612, 783, 11), ('VALUE 3', 787, 783, 11), ('CUTOFF', 1388, 783, 11),
                       ('RESONANCE', 1563, 783, 11), ('EDIT/SHIFT', 985, 735, 10), ('PART', 1072, 735, 10),
                       ('BANK', 1160, 735, 10), ('POWER ON/OFF', 1030, 782, 9), ('SEARCH', 1160, 782, 9),
                       ('VALUE -', 983, 552, 10), ('VALUE +', 1070, 552, 10), ('PARAMETERS', 1202, 552, 10),
                       ('AUDITION', 1333, 552, 10), ('MULTI', 1421, 552, 10), ('CONFIG', 1508, 552, 10),
                       ('STORE', 1596, 552, 10)):
        text(s, x, y, c, F['din'], ink)
    for s, x in zip(['OSC 1', 'OSC 2', 'FILTERS', 'MOD', 'ENV', 'EFFECTS', 'ARP', 'COMMON'], ROW_X):
        text(s, x, 368, 10, F['din'], ink)
    for i, x in enumerate(ROW_X):
        text(str(i + 1), x - 14, 253, 10, F['din'], ink)
        text(str(i + 1), x - 14, 438, 10, F['din'], ink)
    text('<', 1150, 552, 10, F['din'], ink)
    text('>', 1254, 552, 10, F['din'], ink)
    for x0, x1 in ((945, 965), (1095, 1115)):            # parentesi di POWER ON/OFF
        flat_rrect('br', x0, 781, x1, 783, 0.005, ink, Z_INK)
    text('<', 1006 - 90, 738, 9, F['din'], ink) if False else None

    # fessure dei tasti, LED spenti, collari e scale a puntini
    slot = mat('slot', P['slot'], 0.9)
    h = KEY_SIZE * 50 / 2 + 3
    for kx, ky in KEYS.values():
        flat_rrect('slot', kx - h, ky - h, kx + h, ky + h, 0.05, slot, T, height=0.001)
    ledm = mat('led', P['led'], 0.25)
    for lx, ly in LEDS.values():
        disc('led', lx, ly, 0.11, ledm, T, height=0.03)
    collar = mat('collar', P['collar'], 0.45)
    dot = mat('dot', P['ink'], 0.6)
    for kid, (kx, ky, has_collar) in KNOBS.items():
        if has_collar:
            ring('collar', kx, ky, KNOB_R * 0.98, KNOB_R * 1.27, collar, T)
        if kid == 'frontKnobVolume':
            arc = [(kx + 61 * math.sin(math.radians(a)), ky - 61 * math.cos(math.radians(a))) for a in range(-115, 15, 5)]
            groove_path(arc, mat('arc', P['logo'], 0.5), depth=0.03)
            continue
        rad = 66 if has_collar else 62
        for i in range(11):
            a = math.radians(-135 + i * 27)
            disc('dot', kx + rad * math.sin(a), ky - rad * math.cos(a), 0.045, dot, Z_INK, height=0.002, segs=16)
        if has_collar:
            text('0', kx - 50, ky + 62, 9, F['din'], ink)
            text('12', kx + 52, ky + 62, 9, F['din'], ink)


def render_faceplate(skin):
    vp.reset(10, 10, samples=24 if PREVIEW else 160)
    project, w, h = frame()
    build_faceplate(skin)
    vp.OUT = OUT
    vp.render_save(f'faceplate-{skin}', alpha_floor=0.01)

    # posizioni dei controlli per il CSS (percentuali dell'immagine)
    lay = {'aspect': w / h, 'knobs': {}, 'keys': {}, 'leds': {}}
    for kid, (kx, ky, _) in KNOBS.items():
        cx, cy = project(kx, ky)
        lay['knobs'][kid] = dict(x=round(cx, 3), y=round(cy, 3), d=round(KNOB_R * 2 / w * 100, 3))
    for kid, (kx, ky) in KEYS.items():
        cx, cy = project(kx, ky)
        lay['keys'][kid] = dict(x=round(cx, 3), y=round(cy, 3), s=round(KEY_SIZE / w * 100, 3))
    for lid, (lx, ly) in LEDS.items():
        cx, cy = project(lx, ly, T + 0.09 if lid == 'snowLcdBpmLed' else T)
        lay['leds'][lid] = dict(x=round(cx, 3), y=round(cy, 3))
    (ax, ay), (bx, by) = project(LCD_SCREEN[0], LCD_SCREEN[1], T + 0.1), project(LCD_SCREEN[2], LCD_SCREEN[3], T + 0.1)
    lay['lcd'] = dict(x=round(ax, 3), y=round(ay, 3), w=round(bx - ax, 3), h=round(by - ay, 3))
    with open(os.path.join(OUT, 'layout.json'), 'w') as f:
        json.dump(lay, f, indent=1)
    print('layout', json.dumps(lay)[:300])
    return w


def render_controls(skin, panel_w):
    """manopola e tasto con la stessa scala del pannello (px per unita' = PPU)"""
    # manopola: cella = 1.6 x diametro, 64 fotogrammi
    vs.reset_scene()
    cell = round(KNOB_R * 2 * 1.6 * PPU)
    bpy.context.scene.render.resolution_x = bpy.context.scene.render.resolution_y = cell
    bpy.context.scene.cycles.samples = 16 if PREVIEW else 64
    vs.add_lights()
    vs.add_shadow_catcher()
    vs.add_camera(1.6 * KNOB_R)
    rotor = vs.build_knob(skin, False)
    rotor.scale = (KNOB_R,) * 3
    frames = []
    idx = [FRAMES // 2] if PREVIEW else range(FRAMES)
    for i in idx:
        deg = -135 + i / (FRAMES - 1) * 270
        rotor.rotation_euler = (0, 0, -math.radians(deg))
        frames.append(vs.render_to_array(os.path.join(bpy.app.tempdir, f'k{i:03d}.png')))
    vs.OUT = OUT
    vs.save_sheet(frames, 1 if PREVIEW else COLS, cell, f'fp-knob-{skin}' + ('-preview' if PREVIEW else ''))

    # tasto: cella = 1.8 x lato
    vs.reset_scene()
    cell = round(KEY_SIZE * 1.8 * PPU)
    bpy.context.scene.render.resolution_x = bpy.context.scene.render.resolution_y = cell
    bpy.context.scene.cycles.samples = 16 if PREVIEW else 96
    vs.add_lights(overhead=True)
    vs.add_shadow_catcher()
    vs.add_camera(0.9 * KEY_SIZE)
    key = vs.build_key(skin)
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and not o.is_shadow_catcher:
            o.scale = (KEY_SIZE,) * 3
    frames = []
    for pressed in (False, True):
        key.location.z = (0.07 if pressed else 0.14) * KEY_SIZE
        frames.append(vs.render_to_array(os.path.join(bpy.app.tempdir, f'key{int(pressed)}.png')))
    vs.save_sheet(frames, 2, cell, f'fp-key-{skin}' + ('-preview' if PREVIEW else ''))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for sk in SKINS:
        w = render_faceplate(sk)
        render_controls(sk, w)
