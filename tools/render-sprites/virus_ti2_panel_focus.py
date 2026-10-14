"""Inquadratura del TI2 Desktop per il PANEL: studio discreto, hardware dominante.

Usa la scena già salvata, senza ricostruire o modificare il modello hardware.
Blender -b -P tools/render-sprites/virus_ti2_panel_focus.py -- [--preview] [--snow]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import virus_studio_preview as studio

OUT = studio.OUT
SNOW = '--snow' in sys.argv
SOURCE = os.path.join(OUT, 'panel-studio-preview-virus-ti-snow.blend' if SNOW else 'virus-ti2-desktop-studio.blend')
NAME = 'virus-ti-snow-panel-focus' if SNOW else 'virus-ti2-desktop-panel-focus'
ENVIRONMENT_PREFIXES = ('Ripiano studio', 'Isolatore monitor', 'Monitor studio',
    'Cornice altoparlante', 'Sospensione gomma', 'Membrana', 'Sphere', 'LED monitor',
    'Parete acustica', 'Listello diffusore', 'Base display', 'Supporto display',
    'Display regia', 'Vetro regia', 'Forma onda')


def belongs_to_panel(obj):
    """La serigrafia e i controlli appartengono al gruppo inclinato del TI2."""
    if SNOW:
        # La scena Snow precedente non ha un gruppo padre; i nomi dell'ambiente sono distinti.
        return not obj.name.startswith(ENVIRONMENT_PREFIXES)
    current = obj
    while current:
        if current.name == 'Pannello TI2 inclinato':
            return True
        current = current.parent
    return obj.name.startswith(('Scocca TI2 Desktop', 'Bordo anteriore in noce', 'Piedino gomma'))


def main():
    if not os.path.isfile(SOURCE):
        generator = 'virus_studio_preview.py' if SNOW else 'virus_ti2_studio_preview.py'
        raise FileNotFoundError(f'Creare prima la scena con {generator}.')
    bpy.ops.wm.open_mainfile(filepath=SOURCE)
    scene = bpy.context.scene
    hidden = 0
    for obj in scene.objects:
        if obj.type in {'LIGHT', 'CAMERA'} or belongs_to_panel(obj) or obj.name == 'Scrivania studio':
            obj.hide_render = False
        else:
            obj.hide_render = True
            hidden += 1

    # Zoom +35% rispetto alla vista ambientata; leggera inclinazione per leggere le serigrafie.
    camera = scene.camera
    camera.name = 'Camera PANEL focus'
    camera.data.ortho_scale = 37 if SNOW else 51
    tilt = math.radians(18)
    up = Vector((0, math.cos(tilt), math.sin(tilt)))
    view = Vector((0, math.sin(tilt), -math.cos(tilt)))
    camera.rotation_euler = (tilt, 0, 0)
    camera.location = up * (0.2 if SNOW else 1.5) - view * 75
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080 if SNOW else 960
    scene.render.resolution_percentage = 65 if '--preview' in sys.argv else 100
    scene.cycles.samples = 24 if '--preview' in sys.argv else 128
    scene.cycles.use_denoising = True
    scene.render.filepath = os.path.join(OUT, NAME + '.png')
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, NAME + '.blend'))
    print(f'Oggetti di ambiente nascosti: {hidden}; modello: {"TI Snow" if SNOW else "TI2 Desktop"}.', flush=True)
    studio.render(scene, NAME)


if __name__ == '__main__':
    main()
