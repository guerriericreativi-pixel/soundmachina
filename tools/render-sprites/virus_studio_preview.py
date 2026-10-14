"""Preview Blender del PANEL in studio, senza modificare gli asset interattivi.

Blender -b -P tools/render-sprites/virus_studio_preview.py -- [--preview]
Produce una scena modificabile e due render in output/blender.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import virus_faceplate as fp
import virus_panels as vp
import virus_sprites as vs

OUT = os.path.join(vp.ROOT, 'output', 'blender')
os.makedirs(OUT, exist_ok=True)
PREVIEW = '--preview' in sys.argv
SKIN = 'snow'
SUFFIX = '-virus-ti-snow'
if '--skin=dark' in sys.argv:
    raise SystemExit('Il TI2 Desktop usa virus_ti2_studio_preview.py: non è uno Snow scuro.')


def material(name, color, roughness=0.5, metallic=0):
    return fp.mat(name, vs.srgb(color), roughness, metallic)


def box(name, size, location, mat, bevel=0.12):
    obj = vs.beveled_box(name, size, bevel, mat, location)
    obj.modifiers['bevel'].harden_normals = True
    obj.modifiers.new('Normali superfici piane', 'WEIGHTED_NORMAL')
    return obj


def area(name, location, target, energy, size, color):
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA'))
    bpy.context.scene.collection.objects.link(light)
    light.location = location
    light.data.energy = energy
    light.data.shape = 'DISK'
    light.data.size = size
    light.data.color = color
    vs.look_at(light, target)
    return light


def wood():
    """Venatura procedurale anisotropa: nessuna texture esterna necessaria."""
    mat = material('Noce oliato', '#443127', 0.6)
    nt = mat.node_tree
    shader = nt.nodes['Principled BSDF']
    shader.inputs['Coat Weight'].default_value = 0.025
    shader.inputs['Specular IOR Level'].default_value = 0.2
    coords = nt.nodes.new('ShaderNodeTexCoord')
    mapping = nt.nodes.new('ShaderNodeVectorMath')
    mapping.operation = 'MULTIPLY'
    mapping.inputs[1].default_value = (2.5, 48.0, 8.0)
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 2.5
    noise.inputs['Detail'].default_value = 5
    noise.inputs['Roughness'].default_value = 0.7
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.18
    ramp.color_ramp.elements[0].color = (*vs.srgb('#30211b'), 1)
    ramp.color_ramp.elements[1].position = 0.82
    ramp.color_ramp.elements[1].color = (*vs.srgb('#5e4332'), 1)
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.18
    bump.inputs['Distance'].default_value = 0.025
    nt.links.new(coords.outputs['Generated'], mapping.inputs[0])
    nt.links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    nt.links.new(noise.outputs['Fac'], ramp.inputs[0])
    nt.links.new(ramp.outputs['Color'], shader.inputs['Base Color'])
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat


def cylinder(name, radius, depth, location, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth,
                                      location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    mod = obj.modifiers.new('Bordi arrotondati', 'BEVEL')
    mod.width = 0.07
    mod.segments = 3
    bpy.ops.object.shade_smooth()
    return obj


def grain_material(name, color, roughness, metallic, scale, depth, contrast=0.22):
    """Microgeometria visibile sotto luce radente, senza sporcare la serigrafia."""
    mat = material(name, color, roughness, metallic)
    nt = mat.node_tree
    shader = nt.nodes['Principled BSDF']
    coord = nt.nodes.new('ShaderNodeTexCoord')
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale
    noise.inputs['Detail'].default_value = 3
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.48
    bump.inputs['Distance'].default_value = depth
    variation = nt.nodes.new('ShaderNodeMapRange')
    variation.inputs['To Min'].default_value = roughness - 0.08
    variation.inputs['To Max'].default_value = roughness + 0.08
    nt.links.new(coord.outputs['Object'], noise.inputs['Vector'])
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    nt.links.new(noise.outputs['Fac'], variation.inputs['Value'])
    nt.links.new(variation.outputs[0], shader.inputs['Roughness'])
    tint = nt.nodes.new('ShaderNodeValToRGB')
    base = vs.srgb(color)
    tint.color_ramp.elements[0].position = 0.2
    tint.color_ramp.elements[0].color = (*(v * (1 - contrast) for v in base), 1)
    tint.color_ramp.elements[1].position = 0.8
    tint.color_ramp.elements[1].color = (*(min(v * (1 + contrast), 1) for v in base), 1)
    nt.links.new(noise.outputs['Fac'], tint.inputs[0])
    nt.links.new(tint.outputs[0], shader.inputs['Base Color'])
    return mat


def turned_aluminium(name, color):
    """Tornitura concentrica: tangente circolare per riflessi radiali reali."""
    mat = material(name, color, 0.27, 0.95)
    nt = mat.node_tree
    shader = nt.nodes['Principled BSDF']
    shader.inputs['Anisotropic'].default_value = 0.85
    coord = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    neg = nt.nodes.new('ShaderNodeMath')
    neg.operation = 'MULTIPLY'
    neg.inputs[1].default_value = -1
    tangent = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(coord.outputs['Object'], sep.inputs[0])
    nt.links.new(sep.outputs['Y'], neg.inputs[0])
    nt.links.new(neg.outputs[0], tangent.inputs['X'])
    nt.links.new(sep.outputs['X'], tangent.inputs['Y'])
    # Convertire la tangente locale in spazio mondo evita rotazioni errate dei riflessi.
    transform = nt.nodes.new('ShaderNodeVectorTransform')
    transform.vector_type = 'VECTOR'
    transform.convert_from = 'OBJECT'
    transform.convert_to = 'WORLD'
    nt.links.new(tangent.outputs[0], transform.inputs[0])
    nt.links.new(transform.outputs[0], shader.inputs['Tangent'])
    radial = nt.nodes.new('ShaderNodeVectorMath')
    radial.operation = 'LENGTH'
    xy = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(sep.outputs['X'], xy.inputs['X'])
    nt.links.new(sep.outputs['Y'], xy.inputs['Y'])
    nt.links.new(xy.outputs[0], radial.inputs[0])
    freq = nt.nodes.new('ShaderNodeMath')
    freq.operation = 'MULTIPLY'
    freq.inputs[1].default_value = 1700
    wave = nt.nodes.new('ShaderNodeMath')
    wave.operation = 'SINE'
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.12
    bump.inputs['Distance'].default_value = 0.0005
    nt.links.new(radial.outputs['Value'], freq.inputs[0])
    nt.links.new(freq.outputs[0], wave.inputs[0])
    nt.links.new(wave.outputs[0], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat


def speaker(x, cabinet, rubber, metal):
    """Monitor da studio con coni reali, poggiato su un isolatore."""
    box('Isolatore monitor', (7.2, 6.2, 0.55), (x, 17, 0.2), rubber)
    box('Monitor studio', (6.8, 5.2, 10.8), (x, 17, 5.8), cabinet, 0.3)
    # Faccia rivolta al musicista: asse dei cilindri lungo Y.
    rot = (math.pi / 2, 0, 0)
    for z, r in ((4.8, 2.15), (8.9, 0.85)):
        cylinder('Cornice altoparlante', r, 0.22, (x, 14.3, z), metal, rot)
        cylinder('Sospensione gomma', r * 0.89, 0.25, (x, 14.12, z), rubber, rot)
        cylinder('Membrana', r * 0.7, 0.28, (x, 13.98, z), cabinet, rot)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                           radius=r * 0.33, location=(x, 13.8, z))
        cap = bpy.context.object
        cap.scale = (1, 0.3, 1)
        cap.data.materials.append(rubber)
        bpy.ops.object.shade_smooth()
    led = fp.mat('Spia monitor', vs.srgb('#77b8dd'), 0.25, emission=2)
    cylinder('LED monitor', 0.055, 0.04, (x + 2.5, 14.32, 1.4), led, rot)


def build_scene():
    fp.BRAND = 'access'
    fp.PALETTE['snow']['logo'] = vs.srgb('#747a7b')

    def access_mark(px, py, radius, mat, z=fp.T):
        # Il vecchio generatore usava una stella a quattro punte: qui il simbolo è a tre elementi.
        x, y = fp.M(px, py)
        studio_radius = radius * 1.2
        cylinder('Centro simbolo Access Snow', studio_radius * 0.21, 0.005, (x, y, z + 0.005), mat)
        for i in range(3):
            a = math.radians(i * 120 + 15)
            points = [(0.28, 0.12), (1.0, 0.42), (0.61, -0.29), (0.36, -0.31)]
            verts = [(x + studio_radius * (px * math.cos(a) - py * math.sin(a)),
                      y + studio_radius * (px * math.sin(a) + py * math.cos(a)), z + 0.006)
                     for px, py in points]
            vs.mesh_obj('Simbolo Access Snow', verts, [(0, 1, 2, 3)], mat, smooth=False)

    fp.star = access_mark
    vp.reset(1600, 1000, samples=48 if PREVIEW else 128)
    scene = bpy.context.scene
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'AgX'
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.18, 0.21, 0.26, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.09
    for obj in list(bpy.data.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

    fp.frame()
    fp.build_faceplate(SKIN)
    body_mat = grain_material('Scocca verniciata a polvere',
                              '#dedfdd', 0.55, 0.08, 100, 0.003, contrast=0.04)
    bpy.data.objects['body'].data.materials[0] = body_mat
    for obj in list(bpy.data.objects):
        if obj.is_shadow_catcher:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Originali coordinate e camera: il dettaglio mantiene la proiezione del PANEL.
    for i, (name, (x, y, _)) in enumerate(fp.KNOBS.items()):
        rotor = vs.build_knob(SKIN, False)
        rotor.name = name
        mx, my = fp.M(x, y)
        rotor.location = (mx, my, fp.T + 0.015)
        rotor.scale = (fp.KNOB_R,) * 3
        rotor.rotation_euler.z = math.radians([25, -42, 12, 62, -35, 74][i])
        for child in rotor.children:
            if child.name.startswith('cap'):
                child.data.materials[0] = vs.plastic('Cappuccio Snow in plastica',
                    vs.srgb('#b1b2ae'), 0.61, coat=0.025, bump=0.08)
            elif child.name.startswith('pointer'):
                child.data.materials[0] = material('Indice Snow chiaro', '#e4e5df', 0.68)
    for name, (x, y) in fp.KEYS.items():
        before = set(bpy.data.objects)
        key = vs.build_key(SKIN)
        key.modifiers['bevel'].harden_normals = True
        key.modifiers.new('Normali tasto', 'WEIGHTED_NORMAL')
        parts = set(bpy.data.objects) - before
        pivot = bpy.data.objects.new(name, None)
        scene.collection.objects.link(pivot)
        pivot.location = (*fp.M(x, y), fp.T + 0.012)
        pivot.scale = (fp.KEY_SIZE,) * 3
        for obj in parts:
            obj.parent = pivot

    # Metallo satinato, riflessi morbidi e grain della plastica già presenti.
    bezel_mat = grain_material('Alluminio placca satinato', '#b5b7b8', 0.34, 0.9, 100, 0.002, contrast=0.04)
    bpy.data.objects['bezel'].data.materials[0] = bezel_mat
    bezel = bezel_mat.node_tree.nodes['Principled BSDF']
    bezel.inputs['Roughness'].default_value = 0.3
    bezel.inputs['Anisotropic'].default_value = 0.55
    screen = bpy.data.materials['screen'].node_tree.nodes['Principled BSDF']
    screen.inputs['Base Color'].default_value = (*vs.srgb('#a9dce6'), 1)
    screen.inputs['Emission Color'].default_value = (*vs.srgb('#9ddbe6'), 1)
    screen.inputs['Emission Strength'].default_value = 0.8
    screen.inputs['Roughness'].default_value = 0.24
    lcd_ink = material('Testo LCD preview', '#143e49', 0.65)
    fonts = fp.fonts()
    fp.text('MULTI     PART 1/4', 385, 387, 19, fonts['regular'], lcd_ink,
            align='LEFT', z=fp.T + 0.11)
    fp.text('STUDIO SETUP', 385, 427, 25, fonts['din'], lcd_ink,
            align='LEFT', z=fp.T + 0.11)
    fp.text('BASS  /  CH 01', 385, 468, 17, fonts['regular'], lcd_ink,
            align='LEFT', z=fp.T + 0.11)
    blue = fp.mat('LED attivo', vs.srgb('#579edf'), 0.22, emission=2.2)
    for name in ('frontRomLed0', 'frontRamLed0', 'snowLcdBpmLed'):
        if name in fp.LEDS:
            x, y = fp.LEDS[name]
            fp.disc('Indicatore attivo', x, y, 0.09, blue, fp.T + 0.1, height=0.035)

    build_studio_environment()
    return scene


def build_studio_environment():
    """Ambiente condiviso, indipendente dalla geometria del sintetizzatore."""

    walnut = wood()
    desk = grain_material('Piano studio antracite', '#26292c', 0.87, 0, 12, 0.12)
    cabinet = material('Monitor verniciato', '#20232a', 0.44)
    rubber = vs.plastic('Gomma isolante', vs.srgb('#111419'), 0.84, bump=0.2)
    metal = material('Anello monitor', '#343942', 0.32, 0.65)
    box('Scrivania studio', (84, 70, 2), (0, 7, -1.08), desk, 0.35)
    box('Ripiano studio', (78, 9, 1.2), (0, 23, 0.1), walnut, 0.2)
    for x in (-23, 23):
        speaker(x, cabinet, rubber, metal)
    felt = vs.plastic('Tessuto acustico', vs.srgb('#222830'), 0.95, bump=0.25)
    box('Parete acustica', (88, 2, 28), (0, 32, 12), felt)
    for x in range(-40, 41, 2):
        box('Listello diffusore', (0.7, 1.0, 24), (x, 30.5, 12), walnut, 0.06)
    # Display di regia discreto: grafica astratta, nessun dato reale dell'app.
    box('Base display', (9, 5, 0.4), (0, 23, 1.0), cabinet)
    box('Supporto display', (1.2, 1.2, 5), (0, 24, 3.2), metal)
    box('Display regia', (20, 1, 10), (0, 24, 9), cabinet, 0.22)
    display = fp.mat('Schermo regia', vs.srgb('#172a36'), 0.3, emission=0.45)
    box('Vetro regia', (18.9, 0.08, 8.8), (0, 23.46, 9), display, 0.05)
    waveform = fp.mat('Tracce audio', vs.srgb('#4f9fa5'), 0.5, emission=0.7)
    for row in range(4):
        for col in range(36):
            h = 0.08 + abs(math.sin(col * 1.7 + row) * math.sin(col * 0.39)) * 0.8
            box('Forma onda', (0.22, 0.04, h), (-7.5 + col * 0.42, 23.4, 6.4 + row * 1.65),
                waveform, 0.015)

    area('Softbox principale', (-18, 12, 23), (0, 0, 0), 14500, 11, (1, 0.95, 0.88))
    area('Riempimento freddo', (24, -12, 24), (0, 1, 1), 2400, 18, (0.77, 0.86, 1))
    area('Luce posteriore studio', (4, 27, 22), (0, 4, 0), 4000, 10, (1, 0.76, 0.51))


def render(scene, name):
    scene.render.filepath = os.path.join(OUT, name + '.png')
    print('Render:', name, flush=True)
    bpy.ops.render.render(write_still=True)


def main():
    scene = build_scene()
    # Questa camera è quella originale del PANEL, senza cambiare layout.json.
    camera = scene.camera
    detail_camera = camera.copy()
    detail_camera.data = camera.data.copy()
    scene.collection.objects.link(detail_camera)
    detail_camera.name = 'Camera PANEL originale'
    scale = 0.65 if PREVIEW else 0.85
    scene.render.resolution_percentage = round(scale * 100)
    render(scene, 'panel-materiali-preview' + SUFFIX)

    # Solo la vista ambientata usa una camera più bassa; quella del PANEL resta salvata.
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1200
    tilt = math.radians(42)
    camera.rotation_euler = (tilt, 0, 0)
    camera.data.ortho_scale = 60
    up = Vector((0, math.cos(tilt), math.sin(tilt)))
    view = Vector((0, math.sin(tilt), -math.cos(tilt)))
    camera.location = up * 11 - view * 85
    scene.render.filepath = os.path.join(OUT, 'panel-studio-preview' + SUFFIX + '.png')
    bpy.ops.file.pack_all()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'panel-studio-preview' + SUFFIX + '.blend'))
    render(scene, 'panel-studio-preview' + SUFFIX)


if __name__ == '__main__':
    main()
