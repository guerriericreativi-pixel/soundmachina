"""Pack the transparent Snow chassis over the shared studio desk."""
from pathlib import Path
from PIL import Image, ImageChops
ROOT = Path(__file__).resolve().parents[2]
image = Image.open(ROOT / 'output/blender/snow-plate.png').convert('RGBA')
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
image.save(ROOT / 'assets/panel/snow-studio.webp', quality=95, method=6)
print('Transparent Snow chassis packed with a smooth outer shadow margin.')
