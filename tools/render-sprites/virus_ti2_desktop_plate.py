"""Export the TI2 metal chassis and its full-page anthracite studio desk.

Blender -b -P tools/render-sprites/virus_ti2_desktop_plate.py
Then run pack_ti2_plate.py with a Python interpreter providing Pillow.
The existing camera and control anchors remain unchanged.
"""
from pathlib import Path
import sys

import bpy

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import virus_panels as vp


def hide_live_controls(scene):
    """Retain physical slots and labels; the app renders moving controls live."""
    for obj in scene.objects:
        if obj.name.startswith('Manopola '):
            obj.hide_render = True
            for child in obj.children_recursive:
                child.hide_render = True
        elif obj.name.startswith('Tasto '):
            obj.hide_render = True
        elif obj.name.startswith('LED acceso'):
            # Keep the molded LED lens, with runtime illumination supplied by UI.
            obj.data.materials.clear()
            obj.data.materials.append(bpy.data.materials['LED TI2 spento'])
        elif obj.type == 'FONT' and obj.data.body in (
            'MULTI          PART 01', 'STUDIO SETUP', 'Cutoff   Resonance   Pan'
        ):
            obj.hide_render = True


def main():
    vp.reset(10, 10)
    bpy.ops.wm.open_mainfile(
        filepath=str(ROOT / 'output/blender/virus-ti2-desktop-panel-focus.blend')
    )
    scene = bpy.context.scene
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 960
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    hide_live_controls(scene)
    # The painted wedge continues behind the optional decorative front trim.
    bpy.data.objects['Bordo anteriore in noce'].hide_render = True
    desk = bpy.data.objects['Scrivania studio']
    desk.is_shadow_catcher = True
    scene.render.film_transparent = True
    scene.render.filepath = str(ROOT / 'output/blender/ti2-plate.png')
    bpy.ops.render.render(write_still=True)

    # Export the same native desk material and lighting without the instrument.
    for obj in scene.objects:
        if obj.type not in {'CAMERA', 'LIGHT'}:
            obj.hide_render = obj != desk
    desk.is_shadow_catcher = False
    scene.render.film_transparent = False
    scene.cycles.samples = 32
    scene.render.filepath = str(ROOT / 'output/blender/ti2-desk.png')
    bpy.ops.render.render(write_still=True)
    print('Exported TI2 metal chassis and anthracite desk.', flush=True)


if __name__ == '__main__':
    main()
