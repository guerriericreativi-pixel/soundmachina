"""Render continuous accessory faceplates with the actual PANEL materials/rigs.

Blender -b -P tools/render-sprites/virus_accessory_illumination.py
Outputs 1920x1200 native PNGs and high quality WebP in output/accessory-preview.
"""
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output' / 'accessory-preview'
OUTPUT.mkdir(parents=True, exist_ok=True)
SOURCES = {
    'snow': ROOT / 'output/blender/virus-ti-snow-studio-refined.blend',
    'dark': ROOT / 'output/blender/virus-ti2-desktop-panel-focus.blend',
}


def render(skin, source):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    body = bpy.data.objects['body' if skin == 'snow' else 'Scocca TI2 Desktop']
    material = body.data.materials[0]
    # Keep precisely the stored PANEL coating shader, world and area-light rig.
    face_width = body.dimensions.x
    height = face_width * 1200 / 1920
    z = max((body.matrix_world @ Vector(corner)).z for corner in body.bound_box)
    for obj in list(scene.objects):
        if obj.type != 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, z))
    face = bpy.context.object
    face.name = 'Continuous accessory faceplate: actual PANEL coating'
    face.dimensions = (face_width * 1.01, height * 1.01, 0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    face.data.materials.append(material)
    # No lens tilt: the full map can stretch within a responsive chassis.
    camera = bpy.data.objects.new('Accessory top camera', bpy.data.cameras.new('Accessory top camera'))
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = face_width
    camera.location = (0, 0, z + 50)
    camera.rotation_euler = (0, 0, 0)
    scene.collection.objects.link(camera)
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1200
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.filepath = str(OUTPUT / f'accessory-top-{skin}.png')
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(scene.render.filepath)
    # PNG is already display-referred: avoid applying the PANEL view transform twice.
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 95
    image.save_render(str(OUTPUT / f'accessory-top-{skin}.webp'), scene=scene)
    print(f'ACCESSORY TOP {skin}: material={material.name}, width={face_width}, z={z}')


def render_matching_chassis(skin, source):
    """Reuse PANEL lighting/material on the existing two-bend responsive shell."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import virus_accessory_rasters as accessory
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    body = bpy.data.objects['body' if skin == 'snow' else 'Scocca TI2 Desktop']
    material = body.data.materials[0]
    scale = 8 / body.dimensions.x
    cherry = bpy.data.objects['Pannello frontale ciliegio'].data.materials[0] if skin == 'snow' else None
    for obj in list(scene.objects):
        if obj.type != 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            obj.location *= scale
            obj.data.energy *= scale * scale
            if obj.data.type == 'AREA':
                obj.data.size *= scale
            if obj.data.type == 'AREA' and obj.data.shape == 'RECTANGLE':
                obj.data.size_y *= scale
    texture_space = bpy.data.objects.new('Coating PANEL material scale', None)
    texture_space.scale = (scale, scale, scale)
    scene.collection.objects.link(texture_space)
    for node in material.node_tree.nodes:
        if node.type == 'TEX_COORD':
            node.object = texture_space
    accessory.vp.reset = lambda *args, **kwargs: scene
    accessory.surface = lambda *args, **kwargs: material
    if cherry is not None:
        accessory.cherry_material = lambda: cherry
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    accessory.chassis(skin)


def render_matching_buttons(skin, source):
    """Keep the physical PANEL key shader unchanged on crowned accessory keys."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import virus_accessory_rasters as accessory
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    body = bpy.data.objects['body' if skin == 'snow' else 'Scocca TI2 Desktop']
    scale = 8 / body.dimensions.x
    if skin == 'snow':
        material = bpy.data.materials['ABS rigido tasto Snow']
    else:
        key = next(obj for obj in scene.objects
                   if obj.type == 'MESH' and obj.name.startswith('Tasto '))
        material = key.data.materials[0]
    for obj in list(scene.objects):
        if obj.type != 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            obj.location *= scale
            obj.data.energy *= scale * scale
            if obj.data.type == 'AREA':
                obj.data.size *= scale
                if obj.data.shape == 'RECTANGLE':
                    obj.data.size_y *= scale
    def keep_studio_reset(*args, **kwargs):
        # Keep the exact rig/material between states, remove only state geometry.
        for obj in list(scene.objects):
            if obj.type != 'LIGHT':
                bpy.data.objects.remove(obj, do_unlink=True)
        return scene
    accessory.vp.reset = keep_studio_reset
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    accessory.button(skin, provided_material=material)
    print(f'EXACT PANEL BUTTON {skin}: {material.name}', flush=True)


if __name__ == '__main__':
    for skin, source in SOURCES.items():
        if '--dark-only' in sys.argv and skin != 'dark':
            continue
        if '--snow-only' in sys.argv and skin != 'snow':
            continue
        if '--buttons-only' in sys.argv:
            render_matching_buttons(skin, source)
        elif '--chassis-only' in sys.argv:
            render_matching_chassis(skin, source)
        else:
            render(skin, source)
