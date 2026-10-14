"""Pack the transparent TI2 chassis over the shared studio desk."""
from pathlib import Path
from PIL import Image, ImageChops
ROOT = Path(__file__).resolve().parents[2]
image = Image.open(ROOT / 'output/blender/ti2-plate.png').convert('RGBA')
width, height = image.size
alpha = image.getchannel('A').point(lambda a: round(max(0, (a - 7) * 255 / 248)))
# The chassis stays inside the margin. Feather only the outer catcher plane,
# so its long shadow blends into the page without a visible image rectangle.
def fade(distance):
    t = min(1, distance / 48)
    return t * t * (3 - 2 * t)
xs = [fade(min(x, width - 1 - x)) for x in range(width)]
ys = [fade(min(y, height - 1 - y)) for y in range(height)]
margin = Image.new('L', image.size)
margin.putdata([round(255 * x * y) for y in ys for x in xs])
image.putalpha(ImageChops.multiply(alpha, margin))
image.save(ROOT / 'assets/panel/ti2-desktop.webp', quality=95, method=6)
print('Transparent TI2 chassis packed with a smooth outer shadow margin.')

Image.open(ROOT / "output/blender/ti2-desk.png").convert("RGB").save(ROOT / "assets/panel/studio-anthracite.webp", quality=94, method=6)

# The accessory LCDs use the same neutral substrate as the physical TI2 PANEL.
import json
lcd = json.loads((ROOT / 'assets/panel/ti2-layout.json').read_text())['lcd']
plate = Image.open(ROOT / 'output/blender/ti2-plate.png').convert('RGB')
w, h = plate.size
bounds = (round(lcd['x'] * w / 100) + 3,
          round(lcd['y'] * h / 100) + 3,
          round((lcd['x'] + lcd['width']) * w / 100) - 3,
          round((lcd['y'] + lcd['height']) * h / 100) - 3)
plate.crop(bounds).save(ROOT / 'assets/panel/ti2-lcd-surface.webp', quality=95, method=6)
