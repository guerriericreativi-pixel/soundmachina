"""Pack Blender PNG frames as WebP, removing residual catcher rectangles.

Run after virus_snow_knob_atlas.py with a Python runtime containing Pillow.
The PNGs contain the physical lighting and shadow; only their matte is cleaned.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CELL = 192
sheet = Image.new('RGBA', (CELL * 8, CELL * 8))
for frame in range(64):
    image = Image.open(f'/tmp/snow-knob-frames/{frame:03d}.png').convert('RGBA')
    alpha = image.getchannel('A')
    boundary = [alpha.getpixel((x, y)) for x in range(CELL)
                for y in (0, CELL - 1)]
    boundary += [alpha.getpixel((x, y)) for y in range(CELL)
                 for x in (0, CELL - 1)]
    floor = min(254, max(boundary) + 1)
    cleaned = alpha.point(lambda a: round(max(0, (a - floor) * 255 / (255 - floor))))
    # Smooth only the transparent outer margin, leaving the knob untouched.
    pixels = cleaned.load()
    for y in range(CELL):
        for x in range(CELL):
            distance = min(x, y, CELL - 1 - x, CELL - 1 - y)
            t = min(1, distance / 6)
            pixels[x, y] = round(pixels[x, y] * t * t * (3 - 2 * t))
    assert all(pixels[x, y] == 0 for x in range(CELL) for y in (0, CELL - 1))
    assert cleaned.getextrema()[1] == 255, 'Opaque knob surface must be preserved'
    image.putalpha(cleaned)
    sheet.paste(image, ((frame % 8) * CELL, (frame // 8) * CELL))
sheet.save(ROOT / 'assets/panel/snow-knob.webp', quality=95, method=6)
print('64 frames packed; transparent boundaries and opaque surfaces verified.')
