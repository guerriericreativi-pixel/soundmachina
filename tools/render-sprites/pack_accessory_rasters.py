"""Pack native accessory PNGs to WebP, preserving responsive raster dimensions."""
import sys
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output' / 'accessory-preview'


def pack():
    pattern = '*.png'
    if '--chassis-only' in sys.argv:
        pattern = 'chassis-*.png'
    elif '--buttons-only' in sys.argv:
        pattern = 'btn-*.png'
    for source in sorted(OUTPUT.glob(pattern)):
        raster = Image.open(source).convert('RGBA')
        if not source.stem.startswith(('surface-', 'bezel-')):
            # Cycles can leave a faint world contribution on transparent catchers.
            # Remove that floor without adding a rectangular shadow silhouette.
            alpha = raster.getchannel('A').point(
                lambda value: round(max(0, (value - 9) / 246) * 255)
            )
            raster.putalpha(alpha)
        if source.stem.startswith('chassis-'):
            # Only the catcher reaches the outer margin; fade its cut edge so
            # the nine-slice shadow joins the studio desk without a rectangle.
            width, height = raster.size
            def fade(distance):
                t = min(1, distance / 48)
                return t * t * (3 - 2 * t)
            xs = [fade(min(x, width - 1 - x)) for x in range(width)]
            ys = [fade(min(y, height - 1 - y)) for y in range(height)]
            margin = Image.new('L', raster.size)
            margin.putdata([round(255 * x * y) for y in ys for x in xs])
            raster.putalpha(ImageChops.multiply(raster.getchannel('A'), margin))
        reference = ROOT / 'assets' / 'sprites' / source.with_suffix('.webp').name
        if reference.exists():
            with Image.open(reference) as original:
                assert raster.size == original.size, source.name
        raster.save(source.with_suffix('.webp'), quality=95, method=6)
        print(source.with_suffix('.webp').name, raster.size)


if __name__ == '__main__':
    pack()
