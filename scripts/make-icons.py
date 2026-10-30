"""Generate Lease Coach app icons (PNG) with Pillow. Run: python scripts/make-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(exist_ok=True)

TOP = (17, 144, 155)      # gradient top
BOTTOM = (10, 52, 65)     # gradient bottom
WHITE = (255, 255, 255)
WINDOW = (14, 78, 90)
WHEEL = (7, 37, 46)
HUB = (207, 233, 236)
GREEN = (34, 197, 94)
SS = 4  # supersampling factor


def gradient(n):
    img = Image.new("RGB", (n, n))
    px = img.load()
    for y in range(n):
        t = y / (n - 1)
        col = tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))
        for x in range(n):
            px[x, y] = col
    return img


def render(size, mode):
    """mode: any (rounded, transparent corners), maskable (full bleed, smaller art), apple (full bleed)."""
    n = size * SS
    bg = gradient(n)
    fg_scale = {"any": 1.0, "maskable": 0.80, "apple": 0.96}[mode]
    k = (n / 512.0) * fg_scale
    c = n / 2.0

    def T(x, y):
        return (c + (x - 256) * k, c + (y - 262) * k)

    def R(x0, y0, x1, y1):
        a, b = T(x0, y0), T(x1, y1)
        return [a[0], a[1], b[0], b[1]]

    d = ImageDraw.Draw(bg)
    # Body and cabin
    d.rounded_rectangle(R(84, 268, 428, 346), radius=26 * k, fill=WHITE)
    d.polygon([T(128, 274), T(150, 200), T(318, 200), T(384, 274)], fill=WHITE)
    # Windows
    d.polygon([T(158, 268), T(170, 214), T(226, 214), T(226, 268)], fill=WINDOW)
    d.polygon([T(240, 268), T(240, 214), T(312, 214), T(354, 268)], fill=WINDOW)
    # Wheels
    for wx in (160, 352):
        cx, cy = T(wx, 346)
        r = 42 * k
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHEEL, outline=WHITE, width=max(1, int(6 * k)))
        h = 15 * k
        d.ellipse([cx - h, cy - h, cx + h, cy + h], fill=HUB)
    # "Deal verified" badge
    bx, by = T(392, 146)
    br = 56 * k
    d.ellipse([bx - br, by - br, bx + br, by + br], fill=GREEN)
    d.line([T(365, 148), T(385, 168), T(419, 128)], fill=WHITE, width=max(1, int(14 * k)), joint="curve")
    for px, py in (T(365, 148), T(419, 128)):
        rr = 7 * k
        d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=WHITE)

    img = bg.resize((size, size), Image.LANCZOS)
    if mode == "any":
        mask = Image.new("L", (n, n), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, n - 1, n - 1], radius=int(n * 0.225), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
        img = img.convert("RGBA")
        img.putalpha(mask)
    return img


def main():
    render(192, "any").save(OUT / "icon-192.png")
    render(512, "any").save(OUT / "icon-512.png")
    render(512, "maskable").save(OUT / "icon-maskable-512.png")
    render(180, "apple").convert("RGB").save(OUT / "apple-touch-icon.png")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
