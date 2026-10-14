"""Pack the two native Blender Snow key states without changing their shading."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
sheet = Image.new('RGBA', (384, 192))
for index, state in enumerate(('idle', 'pressed')):
    image = Image.open(f'/tmp/snow-key-{state}.png').convert('RGBA')
    image.putalpha(image.getchannel('A').point(
        lambda a: round(max(0, (a - 255 * .025) / .975))))
    sheet.paste(image, (index * 192, 0))
sheet.save(ROOT / 'assets/panel/snow-key.webp', quality=95, method=6)
