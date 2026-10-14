"""Scena 3D del Virus TI2 Desktop, distinta dal modello TI Snow.

Riferimento: fotografia frontale fornita dall'utente il 14 ottobre 2026.
Le posizioni vengono tracciate sulla foto; i dettagli sono una ricostruzione
procedurale, non un modello CAD del produttore. Nessun asset dell'app viene sovrascritto.

Blender -b -P tools/render-sprites/virus_ti2_studio_preview.py -- [--preview]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import virus_studio_preview as studio
import virus_panels as vp
import virus_sprites as vs
import virus_faceplate as fp

OUT = os.path.join(vp.ROOT, 'output', 'blender')
PREVIEW = '--preview' in sys.argv
WIDTH, DEPTH = 47.0, 18.8
PANEL_TILT = math.radians(12)
PANEL_Z = 4.6


def xy(px, py):
    """Foto di riferimento 1824x1368, rettangolo del pannello (115,343)-(1719,1049)."""
    return ((px - 917) * WIDTH / 1604, (696 - py) * DEPTH / 706)


def label(text, px, py, size=9, mat=None, z=0.03, align='CENTER'):
    curve = bpy.data.curves.new('Serigrafia ' + text, 'FONT')
    curve.body = text
    curve.font = FONTS['regular']
    curve.size = size * DEPTH / 706 / 0.72
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.extrude = 0.0003
    obj = bpy.data.objects.new('Serigrafia ' + text, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (*xy(px, py), z)
    obj.data.materials.append(mat or INK)
    return obj


def rectangle(name, x0, y0, x1, y1, mat, height=0.01, z=0.0, bevel=0.01):
    ax, ay = xy(x0, y0)
    bx, by = xy(x1, y1)
    return studio.box(name, (abs(bx - ax), abs(by - ay), height),
                      ((ax + bx) / 2, (ay + by) / 2, z + height / 2), mat, bevel)


def line(points, mat= None, width=0.013, z=0.028):
    curve = bpy.data.curves.new('Contorno serigrafato', 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = width
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, (px, py) in zip(spline.points, points):
        p.co = (*xy(px, py), z, 1)
    obj = bpy.data.objects.new('Contorno serigrafato', curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat or INK)
    return obj


def led(px, py, on=True, color='red'):
    x, y = xy(px, py)
    ring = studio.cylinder('Sede LED', 0.10, 0.025, (x, y, 0.025), SLOT)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12,
                                       radius=0.078, location=(x, y, 0.045))
    obj = bpy.context.object
    obj.name = 'LED acceso' if on else 'LED spento'
    obj.scale.z = 0.52
    obj.data.materials.append(LED_WHITE if on and color == 'white' else LED_RED if on else LED_OFF)
    bpy.ops.object.shade_smooth()
    return ring


def button(px, py, text='', sub='', width=43):
    x, y = xy(px, py)
    sx, sy = width * WIDTH / 1604, 42 * DEPTH / 706
    studio.box('Fessura tasto', (sx + 0.10, sy + 0.10, 0.018), (x, y, 0.015), SLOT, 0.02)
    studio.box('Tasto ' + text, (sx, sy, 0.23), (x, y, 0.13), RUBBER, 0.025)
    if text:
        label(text, px, py + 36, 8.5)
    if sub:
        label(sub, px, py + 49, 6, MUTED)


def knob(px, py, text, sub='', angle=0, scale=0.9, limits=('0', '12')):
    rotor = vs.build_knob('dark', False)
    rotor.name = 'Manopola ' + text
    rotor.location = (*xy(px, py), 0.025)
    rotor.scale = (scale,) * 3
    rotor.rotation_euler.z = math.radians(angle)
    for obj in rotor.children:
        if obj.name.startswith('cap'):
            obj.data.materials[0] = CAP
        elif obj.name.startswith('skirt'):
            obj.data.materials[0] = GRIP
        elif obj.name.startswith('pointer'):
            obj.data.materials[0] = POINTER
    # Scale stampate sulla foto: puntini bianchi, non collari metallici aggiunti.
    x, y = xy(px, py)
    if limits:
        for i in range(11):
            a = math.radians(-135 + i * 27)
            studio.cylinder('Scala manopola', 0.025, 0.007,
                            (x + scale * 1.22 * math.sin(a), y + scale * 1.22 * math.cos(a), 0.026), INK)
        label(limits[0], px - 29, py + 38, 7)
        label(limits[1], px + 30, py + 38, 7)
    label(text, px, py + 56, 9)
    if sub:
        label(sub, px, py + 71, 6.5, MUTED)
    return rotor


def group(name, bounds, title_x=None, fill=True):
    x0, y0, x1, y1 = bounds
    if fill:
        rectangle('Area ' + name, x0, y0, x1, y1, RECESS, height=0.006)
    line([(x0 + 10, y0), (x1 - 10, y0), (x1, y0 + 10), (x1, y1 - 10),
          (x1 - 10, y1), (x0 + 10, y1), (x0, y1 - 10), (x0, y0 + 10), (x0 + 10, y0)])
    x = title_x or x0 + 80
    width = max(65, len(name) * 7.2)
    rectangle('Etichetta ' + name, x - width / 2, y0 - 16, x + width / 2,
              y0 + 1, INK, height=0.01, z=0.02)
    label(name, x, y0 - 7, 8, DARK_INK, z=0.035)


def access_symbol(px, py, size=0.45, mat=None):
    """Simbolo stilizzato a tre elementi, ricostruito come geometria vettoriale."""
    x, y = xy(px, py)
    material = mat or INK
    studio.cylinder('Centro simbolo Access', size * 0.21, 0.005, (x, y, 0.031), material)
    for i in range(3):
        a = math.radians(i * 120 + 15)
        points = [(0.28, 0.12), (1.0, 0.42), (0.61, -0.29), (0.36, -0.31)]
        verts = [(x + size * (px * math.cos(a) - py * math.sin(a)),
                  y + size * (px * math.sin(a) + py * math.cos(a)), 0.035) for px, py in points]
        vs.mesh_obj('Simbolo Access', verts, [(0, 1, 2, 3)], material, smooth=False)


def chassis():
    """Scocca a cuneo, con bordo anteriore in legno come nel TI2 Desktop."""
    a, b = WIDTH / 2, DEPTH / 2
    z_front = PANEL_Z - b * math.sin(PANEL_TILT)
    z_back = PANEL_Z + b * math.sin(PANEL_TILT)
    y_front, y_back = -b * math.cos(PANEL_TILT), b * math.cos(PANEL_TILT)
    verts = [(-a, y_front, 0), (a, y_front, 0), (a, y_back, 0), (-a, y_back, 0),
             (-a, y_front, z_front), (a, y_front, z_front), (a, y_back, z_back), (-a, y_back, z_back)]
    faces = [(0, 3, 2, 1), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)]
    obj = vs.mesh_obj('Scocca TI2 Desktop', verts, faces, BODY, smooth=False)
    bevel = obj.modifiers.new('Bordo lamiera', 'BEVEL')
    bevel.width = 0.10
    bevel.segments = 4
    bevel.harden_normals = True
    obj.modifiers.new('Normali scocca', 'WEIGHTED_NORMAL')
    wood = studio.wood()
    studio.box('Bordo anteriore in noce', (WIDTH - 0.18, 0.42, z_front - 0.22),
               (0, y_front - 0.11, z_front / 2 - 0.1), wood, 0.10)
    for x in (-21, 21):
        for y in (-7, 7):
            studio.box('Piedino gomma', (1.5, 1.4, 0.18), (x, y, 0.0), GRIP, 0.15)


def panel():
    global FONTS, INK, MUTED, DARK_INK, BODY, RECESS, SLOT, RUBBER, CAP, GRIP, POINTER
    global LED_RED, LED_WHITE, LED_OFF
    FONTS = fp.fonts()
    INK = studio.material('Serigrafia TI2', '#d7dedf', 0.7)
    MUTED = studio.material('Serigrafia secondaria TI2', '#9ca8ac', 0.75)
    DARK_INK = studio.material('Testo etichette TI2', '#313b40', 0.75)
    BODY = studio.grain_material('Vernice antracite TI2', '#30383c', 0.52, 0.18, 80, 0.008, contrast=0.08)
    RECESS = studio.material('Aree operative TI2', '#222b30', 0.58, 0.10)
    SLOT = studio.material('Fessure TI2', '#0d1113', 0.9)
    RUBBER = vs.plastic('Tasti TI2 opachi', vs.srgb('#30353a'), 0.76, coat=0.0, bump=0.08)
    CAP = vs.plastic('Cappucci TI2 grigi', vs.srgb('#565c60'), 0.57, coat=0.025, bump=0.07)
    GRIP = vs.plastic('Impugnatura TI2 scanalata', vs.srgb('#24292d'), 0.72, coat=0.0, bump=0.1)
    POINTER = studio.material('Indice TI2 chiaro', '#c7cfce', 0.67)
    LED_RED = fp.mat('LED TI2 rosso', vs.srgb('#ff1833'), 0.3, emission=3.2)
    LED_WHITE = fp.mat('LED BPM TI2', vs.srgb('#eeeaff'), 0.3, emission=1.8)
    LED_OFF = studio.material('LED TI2 spento', '#4a242b', 0.32)
    chassis()
    before = set(bpy.data.objects)

    # Il pannello è assemblato in piano e inclinato insieme: geometria e serigrafia restano solidali.
    label('access', 242, 377, 31, z=0.045)
    access_symbol(156, 377, 0.42)
    for text, x in [('USB', 574), ('MIDI IN', 667), ('MIDI OUT', 742), ('MIDI THRU', 819),
                    ('S/PDIF', 935), ('INPUT', 1068), ('OUTPUT 1', 1200),
                    ('OUTPUT 2', 1337), ('OUTPUT 3', 1472), ('12V DC IN', 1575), ('HEADPHONES', 1650)]:
        rectangle('Etichetta connettore', x - 35, 371, x + 35, 386, MUTED)
        label(text, x, 379, 7, DARK_INK, z=0.021)

    # Contorno del blocco superiore: ARP, MATRIX, MODULATORS, OSCILLATORS, FILTERS.
    rectangle('Area sintesi', 267, 439, 1696, 677, RECESS, height=0.006)
    line([(145, 677), (145, 580), (158, 570), (234, 570), (249, 562),
          (268, 439), (1680, 439), (1696, 449), (1696, 665), (1684, 677), (145, 677)])
    for name, x in [('ARP', 165), ('MATRIX', 299), ('MODULATORS', 450),
                    ('OSCILLATORS', 786), ('FILTERS', 1320)]:
        y = 570 if name == 'ARP' else 439
        width = max(60, len(name) * 7)
        rectangle('Titolo ' + name, x - width / 2, y - 16, x + width / 2, y + 1, INK, z=0.022)
        label(name, x, y - 7, 8, DARK_INK, z=0.034)
    for x in (388, 718, 1274):
        line([(x, 439), (x, 677)], width=0.01)
    group('EFFECTS', (139, 708, 588, 972), title_x=174)
    group('FILTER ENVELOPE', (1275, 708, 1696, 834), title_x=1344)
    group('AMPLIFIER ENVELOPE', (1275, 856, 1696, 972), title_x=1360)
    mixer = studio.material('Bande mixer TI2', '#73858a', 0.5, 0.3)
    rectangle('Banda MIXER', 1168, 439, 1274, 972, mixer, height=0.006)
    rectangle('Titolo MIXER', 1180, 423, 1237, 440, INK, z=0.022)
    label('MIXER', 1208, 431, 8, DARK_INK, z=0.034)
    access_symbol(1220, 706, 0.72, DARK_INK)

    knob(172, 490, 'VOLUME', angle=70, scale=1.10, limits=None)
    line([(148, 450), (162, 447), (177, 447), (191, 453), (206, 459)], width=0.035)
    knob(659, 486, 'RATE', 'LFO CONTOUR', angle=-35)
    for x, title, sub, angle, limits in [(770, 'SHAPE', '', -12, ('WAVE', 'PL')),
                (881, 'WAVE SELECT/PW', '', -80, ('0', '127')),
                (991, 'SEMITONE', 'PORTAMENTO', 65, ('-48', '+48')),
                (1100, 'DETUNE 2/3', 'UNISON DETUNE', -10, ('0', '127'))]:
        knob(x, 486, title, sub, angle, limits=limits)
    knob(1098, 609, 'FM AMOUNT', 'FM MODE', angle=30)
    for x, title, sub, angle in [(1350, 'CUTOFF', 'RESONANCE 2', -10),
                (1454, 'RESONANCE', '', 60), (1561, 'ENV AMOUNT', 'KEYFOLLOW', -5),
                (1665, 'FILTER BALANCE', '', -45)]:
        knob(x, 486, title, sub, angle)
    knob(1350, 609, 'CUTOFF 2', '', 80, limits=('-64', '+63'))
    for y, title, sub, angle in [(486, 'OSC BALANCE', 'PANORAMA', -15),
                (609, 'SUB OSC VOLUME', 'OSC3 VOLUME', 45),
                (782, 'OSC VOLUME', 'SATURATION', -65),
                (911, 'NOISE VOLUME', 'RING MODULATOR', -10)]:
        knob(1224, y, title, sub, angle)
    for y, secondary in [(762, 'SUSTAIN SLOPE'), (911, 'PATCH VOLUME')]:
        for x, title, angle in [(1345, 'ATTACK', 80), (1450, 'DECAY', -15),
                                 (1558, 'SUSTAIN', 80), (1663, 'RELEASE', 5)]:
            knob(x, y, title, secondary if title == 'SUSTAIN' else '', angle)
    for x, title, sub, angle in [(290, 'SEND', 'EQ GAIN', -70),
                (400, 'TIME/COLOR', 'EQ FREQ', 20), (511, 'FEEDBACK/DAMPING', 'EQ Q-FACTOR', 15)]:
        knob(x, 780, title, sub, angle)
    knob(290, 911, 'TYPE/MIX', '', 12)
    knob(397, 911, 'INTENSITY', '', -18)
    for x, name, sub, angle in [(765, 'VALUE 1', 'CATEGORY', -125),
                 (878, 'VALUE 2', 'BANK', -5), (986, 'VALUE 3', 'PROGRAM', 15)]:
        knob(x, 922, name, sub, angle)

    for args in [(295, 504, ''), (343, 504, ''), (295, 623, 'SELECT'),
                 (423, 504, 'EDIT'), (469, 504, 'ENV MODE'), (543, 504, 'SHAPE'),
                 (419, 623, 'SELECT'), (543, 623, 'SELECT'), (661, 623, 'SELECT'),
                 (177, 623, 'EDIT'), (224, 623, 'ARP ON', 'HOLD'),
                 (755, 623, 'SELECT'), (801, 623, 'EDIT'), (847, 623, 'OSC3 ON'),
                 (967, 623, 'MONO', 'PANIC'), (1013, 623, 'SYNC'),
                 (1435, 623, 'EDIT'), (1481, 623, 'FLT 1'),
                 (1571, 623, 'FLT 2'), (1617, 623, ''), (1664, 623, 'SELECT'),
                 (177, 788, 'SELECT'), (223, 788, 'EDIT'),
                 (177, 920, 'SELECT'), (223, 920, 'EDIT'),
                 (493, 938, ''), (540, 938, ''),
                 (617, 717, 'EXIT'), (664, 717, 'TAP'),
                 (617, 798, 'EDIT', 'MULTI EDIT'), (664, 798, 'CONFIG', 'REMOTE'),
                 (617, 866, 'STORE', 'RANDOM'), (664, 866, 'UNDO', 'REDO'),
                 (617, 938, 'SHIFT'), (664, 938, 'SEARCH', 'AUDITION'),
                 (1087, 717, ''), (1134, 717, ''),
                 (1087, 798, 'MULTI', 'SEQ MODE'), (1134, 798, 'SINGLE'),
                 (1087, 866, ''), (1134, 866, ''),
                 (1087, 938, 'VALUE -'), (1134, 938, 'VALUE +')]:
        button(*args)
    label('DESTINATION', 321, 540, 8)
    label('DEMOSONG', 321, 457, 8, MUTED)
    label('PRESS + HOLD', 321, 467, 6, MUTED)
    for text, x, y in [('MOD', 295, 585), ('LFO 1', 423, 585), ('LFO 2', 543, 585),
                        ('LFO 3', 661, 585), ('TRANSPOSE', 517, 976),
                        ('PART', 1110, 751), ('PARAMETERS', 1110, 900)]:
        label(text, x, y, 8)
    label('POWER ON/OFF', 517, 988, 6)
    label('BANK', 1110, 912, 6)
    for i, name in enumerate(('LFO 1', 'LFO 2', 'LFO 3')):
        led(423 + i * 47, 453, i != 1, 'white' if i != 1 else 'red')
        label(name, 445 + i * 47, 454, 8)
    for i, name in enumerate(('SLOT 1', 'SLOT 2', 'SLOT 3', 'SLOT 4', 'SLOT 5', 'SLOT 6')):
        led(334, 566 + i * 18, i < 4)
        label(name, 349, 566 + i * 18, 8, align='LEFT')
    for names, x, y in [(('OSC 1', 'OSC 2/3', 'PW', 'RESO', 'FLT GAIN', 'ASSIGN'), 460, 566),
                       (('CUTOFF 1', 'CUTOFF 2', 'SHAPE', 'FM AMT', 'PAN', 'ASSIGN'), 582, 566),
                       (('AF', 'LP', 'HP', 'BP', 'BS'), 1500, 568)]:
        for i, name in enumerate(names):
            led(x, y + i * 18, False)
            label(name, x + 11, y + i * 18, 7.5, align='LEFT')
    for i, name in enumerate(('DELAY', 'REVERB', 'LOW EQ', 'MID EQ', 'HIGH EQ')):
        x = 169 + i * 77
        led(x, 723, i != 1)
        label(name, x + 14, 723, 7, align='LEFT')
    for i, name in enumerate(('DISTORTION', 'CHARACTER', 'CHORUS', 'PHASER', 'OTHERS')):
        x = 172 + i * 75
        led(x, 852, i == 2)
        label(name, x + 10, 852, 6.7, align='LEFT')
    for x, y in [(407, 566), (580, 483), (757, 568), (1598, 587), (1644, 587),
                 (1131, 762), (541, 902)]:
        led(x, y, True)
    for x, y in [(470, 883), (424, 883), (488, 901), (521, 901), (802, 588),
                 (784, 568), (847, 568), (967, 587), (1013, 587)]:
        led(x, y, False)
    led(907, 623, True, 'white')
    label('BPM', 907, 646, 8)
    for i, name in enumerate(('OSC 1', 'OSC 2', 'OSC 3')):
        label(name, 774 + i * 43, 568, 7.5)
    label('MODE', 1520, 658, 7.5)
    label('FLT 1 / FLT 2', 1623, 587, 7.5)

    bezel = studio.material('Cornice display TI2', '#101619', 0.32)
    rectangle('Display TI2', 710, 706, 1048, 864, bezel, height=0.18, bevel=0.14)
    screen = fp.mat('LCD TI2 chiaro', vs.srgb('#d0d8cf'), 0.28, emission=0.6)
    rectangle('LCD TI2', 738, 746, 1019, 814, screen, height=0.012, z=0.18, bevel=0.045)
    lcd_ink = studio.material('Pixel LCD TI2', '#344449', 0.85)
    label('MULTI          PART 01', 750, 758, 10, lcd_ink, z=0.196, align='LEFT')
    label('STUDIO SETUP', 750, 780, 16, lcd_ink, z=0.196, align='LEFT')
    label('Cutoff   Resonance   Pan', 750, 803, 9, lcd_ink, z=0.196, align='LEFT')
    label('VIRUS | TI', 880, 839, 19, z=0.195)
    line([(739, 839), (794, 839)], width=0.012, z=0.195)
    line([(965, 839), (1018, 839)], width=0.012, z=0.195)

    top = bpy.data.objects.new('Pannello TI2 inclinato', None)
    bpy.context.scene.collection.objects.link(top)
    for obj in set(bpy.data.objects) - before:
        if obj != top and obj.parent is None:
            obj.parent = top
    top.rotation_euler.x = PANEL_TILT
    top.location.z = PANEL_Z


def camera(scene, width, center, tilt, distance=70):
    obj = bpy.data.objects.new('Camera TI2', bpy.data.cameras.new('Camera TI2'))
    scene.collection.objects.link(obj)
    obj.data.type = 'ORTHO'
    obj.data.ortho_scale = width
    obj.rotation_euler = (tilt, 0, 0)
    up = Vector((0, math.cos(tilt), math.sin(tilt)))
    view = Vector((0, math.sin(tilt), -math.cos(tilt)))
    obj.location = up * center - view * distance
    scene.camera = obj
    return obj


def main():
    os.makedirs(OUT, exist_ok=True)
    vp.reset(2040, 920, samples=64 if PREVIEW else 128)
    scene = bpy.context.scene
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 65 if PREVIEW else 100
    scene.view_settings.view_transform = 'AgX'
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.18, 0.21, 0.26, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.09
    for obj in list(bpy.data.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
    panel()
    studio.build_studio_environment()
    # Luce meno intensa sul pannello antracite: conserva il colore dei cappucci in plastica.
    for name, energy in [('Softbox principale', 10000), ('Riempimento freddo', 2000),
                         ('Luce posteriore studio', 3000)]:
        bpy.data.objects[name].data.energy = energy
    # Due camere: dettaglio dell'hardware e vista più larga dello studio.
    detail = camera(scene, 51, 1.2, math.radians(10))
    detail.name = 'Camera dettaglio TI2 Desktop'
    studio.render(scene, 'virus-ti2-desktop-dettaglio')
    camera(scene, 69, 10, math.radians(37), distance=90)
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1200
    scene.render.filepath = os.path.join(OUT, 'virus-ti2-desktop-studio.png')
    bpy.ops.file.pack_all()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'virus-ti2-desktop-studio.blend'))
    studio.render(scene, 'virus-ti2-desktop-studio')


if __name__ == '__main__':
    main()
