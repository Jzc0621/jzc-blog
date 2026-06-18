"""Build static HTML from Flask app for GitHub Pages deployment."""
import shutil, json, sys, re, os
from datetime import datetime
from pathlib import Path
from app import app, get_posts, get_notes, POSTS_DIR, NOTES_DIR
from PIL import Image, ImageDraw, ImageFont
from extensions import db

# Create tables if they don't exist (needed for freeze to query DB)
with app.app_context():
    db.create_all()

DIST = Path(__file__).parent / "dist"
BASE = ""
SITE_URL = "https://jiazhichao.xyz"


def minify_css(css: str) -> str:
    """Basic CSS minification: remove comments and collapse whitespace."""
    css = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', css)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{},;:])\s*', r'\1', css)
    css = css.strip()
    return css


def minify_js(js: str) -> str:
    """Basic JS minification: remove // comments and collapse whitespace on non-string lines."""
    lines = []
    for line in js.split('\n'):
        # Strip // comments (preserving lines with strings containing //)
        if '//' in line and '"' not in line and "'" not in line:
            line = line[:line.index('//')]
        lines.append(line)
    js = '\n'.join(lines)
    # Collapse multiple blank lines
    js = re.sub(r'\n\s*\n', '\n', js)
    js = js.strip()
    return js


def freeze(url: str) -> str:
    """Render a Flask route and return the HTML with fixed paths."""
    with app.test_client() as client:
        app.jinja_env.globals["hide_editor"] = True
        resp = client.get(url)
        assert resp.status_code == 200, f"{url} returned {resp.status_code}"
        html = resp.data.decode("utf-8")
        # Fix absolute paths for GitHub Pages
        html = html.replace('href="/', f'href="{BASE}/')
        html = html.replace("href='/", f"href='{BASE}/")
        html = html.replace('src="/', f'src="{BASE}/')
        html = html.replace("src='/", f"src='{BASE}/")
        html = html.replace('action="/', f'action="{BASE}/')
        html = html.replace('fetch("/', f'fetch("{BASE}/')
        html = html.replace("fetch('/", f"fetch('{BASE}/")
        html = html.replace('"/search?', f'"{BASE}/search?')
        html = html.replace('"/random"', f'"{BASE}/random"')
        html = html.replace('"/search-index.json"', f'"{BASE}/search-index.json"')
        html = html.replace("'/post/", f"'{BASE}/post/")
        html = html.replace('"/post/', f'"{BASE}/post/')
        html = html.replace("'/notes'", f"'{BASE}/notes'")
        html = html.replace("'/about'", f"'{BASE}/about'")
        html = html.replace("'/rss.xml'", f"'{BASE}/rss.xml'")
        html = html.replace("'/editor'", f"'{BASE}/editor'")
        # Fix RSS URLs (test client uses localhost)
        html = html.replace("http://localhost/", f"{SITE_URL}/")
        return html


def generate_sitemap(posts: list[dict]) -> str:
    """Generate sitemap.xml content."""
    urls = [
        (f"{SITE_URL}/", posts[0]["date"] if posts else "2026-01-01", "daily"),
        (f"{SITE_URL}/about/", "2026-05-01", "monthly"),
        (f"{SITE_URL}/notes/", posts[0]["date"] if posts else "2026-01-01", "weekly"),
    ]
    for p in posts:
        urls.append((f"{SITE_URL}/post/{p['slug']}/", p["date"], "monthly"))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, changefreq in urls:
        lines.append(f"  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append(f"    <changefreq>{changefreq}</changefreq>")
        lines.append(f"  </url>")
    lines.append('</urlset>')
    return '\n'.join(lines)


def _find_chinese_font() -> str | None:
    """Find an available Chinese font on the system."""
    candidates = []
    if sys.platform == "win32":
        windir = os.environ.get("WINDIR", "C:\\Windows")
        candidates = [
            os.path.join(windir, "Fonts", "msyh.ttc"),
            os.path.join(windir, "Fonts", "msyhbd.ttc"),
            os.path.join(windir, "Fonts", "simhei.ttf"),
            os.path.join(windir, "Fonts", "simsun.ttc"),
            os.path.join(windir, "Fonts", "STSONG.TTF"),
        ]
    else:
        candidates = [
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
            "/System/Library/Fonts/PingFang.ttc",
        ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def generate_og_image(dst: Path):
    """Generate a 1200x630 OG preview image for social sharing."""
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background: layered rounded rectangles in Animal Crossing palette
    # Outer margin
    draw.rounded_rectangle([20, 20, W - 20, H - 20], radius=40, fill=(248, 248, 240, 255))
    # Inner panel
    draw.rounded_rectangle([50, 50, W - 50, H - 50], radius=32, fill=(247, 243, 223, 255))
    # Accent strip at top
    draw.rounded_rectangle([50, 50, W - 50, 120], radius=32, fill=(25, 200, 185, 255))
    draw.rectangle([50, 88, W - 50, 120], fill=(25, 200, 185, 255))

    # Decorative dots on accent strip
    for x in range(80, W - 80, 80):
        draw.ellipse([x, 70, x + 16, 86], fill=(255, 255, 255, 60))
        draw.ellipse([x + 20, 78, x + 30, 88], fill=(255, 255, 255, 40))

    # Text
    font_path = _find_chinese_font()
    if font_path:
        try:
            font_title = ImageFont.truetype(font_path, 72)
            font_sub = ImageFont.truetype(font_path, 32)
            font_small = ImageFont.truetype(font_path, 24)
        except Exception:
            font_title = ImageFont.load_default()
            font_sub = font_title
            font_small = font_title
    else:
        font_title = ImageFont.load_default()
        font_sub = font_title
        font_small = font_title

    title = "DRIFT"  # DRIFT
    subtitle = "技术、生活，和随手笔记"  # 技术、生活，和随手笔记

    # Title on the accent strip
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, 55), title, font=font_title, fill=(255, 255, 255, 255))

    # Subtitle below accent
    bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw) / 2, 150), subtitle, font=font_sub, fill=(114, 93, 66, 255))

    # Decorative island elements
    decorations = [
        ("\U0001f33f", 160, 260),  # 🌿
        ("\U0001f43e", 280, 240),  # 🐾
        ("\U0001f332", 920, 250),  # 🌲
        ("\U0001f3dd", 750, 270),  # 🏝
        ("\U0001f340", 1000, 300), # 🍀
        ("☀️", 500, 230), # ☀️
    ]
    for emoji, ex, ey in decorations:
        try:
            draw.text((ex, ey), emoji, font=font_sub, embedded_color=True)
        except Exception:
            draw.text((ex, ey), emoji, font=font_sub)

    # Bottom info bar
    draw.rounded_rectangle([100, H - 130, W - 100, H - 80], radius=16, fill=(138, 198, 106, 40))
    footer_text = "jiazhichao.xyz  ·  Flask + Markdown  ·  Animal Crossing Style"
    bbox = draw.textbbox((0, 0), footer_text, font=font_small)
    fw = bbox[2] - bbox[0]
    draw.text(((W - fw) / 2, H - 125), footer_text, font=font_small, fill=(114, 93, 66, 180))

    dst.parent.mkdir(parents=True, exist_ok=True)
    img = img.convert("RGB")
    img.save(str(dst), "PNG", optimize=True)
    print(f"  OK og:image ({W}x{H})")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    with app.app_context():
        posts = get_posts()

    # static files (minified)
    css_dst = DIST / "static" / "css"
    css_dst.mkdir(parents=True)
    for f in (Path(__file__).parent / "static" / "css").glob("*.css"):
        raw = f.read_text(encoding="utf-8")
        (css_dst / f.name).write_text(minify_css(raw), encoding="utf-8")

    js_dst = DIST / "static" / "js"
    js_dst.mkdir(parents=True)
    for f in (Path(__file__).parent / "static" / "js").glob("*.js"):
        raw = f.read_text(encoding="utf-8")
        (js_dst / f.name).write_text(minify_js(raw), encoding="utf-8")

    # OG image for social sharing
    generate_og_image(DIST / "static" / "images" / "og-default.png")
    (DIST / "static" / "images" / ".gitkeep").touch()

    (DIST / ".nojekyll").touch()
    (DIST / "CNAME").write_text("jiazhichao.xyz")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")

    # home
    (DIST / "index.html").write_text(freeze("/"), encoding="utf-8")
    print("  OK /")

    # posts
    for p in posts:
        d = DIST / "post" / p["slug"]
        d.mkdir(parents=True)
        (d / "index.html").write_text(freeze(f"/post/{p['slug']}"), encoding="utf-8")
        print(f"  OK /post/{p['slug']}")

    # notes
    (DIST / "notes").mkdir(exist_ok=True)
    (DIST / "notes" / "index.html").write_text(freeze("/notes"), encoding="utf-8")
    print("  OK /notes")

    # about
    (DIST / "about").mkdir(exist_ok=True)
    (DIST / "about" / "index.html").write_text(freeze("/about"), encoding="utf-8")
    print("  OK /about")

    # editor
    (DIST / "editor").mkdir(exist_ok=True)
    (DIST / "editor" / "index.html").write_text(freeze("/editor"), encoding="utf-8")
    (DIST / "editor" / "note").mkdir(parents=True, exist_ok=True)
    (DIST / "editor" / "note" / "index.html").write_text(freeze("/editor/note"), encoding="utf-8")

    # 404 page
    (DIST / "404.html").write_text(freeze("/404"), encoding="utf-8")
    print("  OK /404.html")

    # rss
    (DIST / "rss.xml").write_text(freeze("/rss.xml"), encoding="utf-8")

    # sitemap
    (DIST / "sitemap.xml").write_text(generate_sitemap(posts), encoding="utf-8")
    print("  OK sitemap.xml")

    # search index
    search_data = [{
        "slug": p["slug"], "title": p["title"], "tag": p["tag"],
        "date": str(p["date"]), "excerpt": p["excerpt"], "content": p["content"],
    } for p in posts]
    (DIST / "search-index.json").write_text(json.dumps(search_data, ensure_ascii=False), encoding="utf-8")
    print("  OK search-index.json")

    total = sum(1 for _ in DIST.rglob("*") if _.is_file())
    print(f"\nDone! {total} files in dist/")


if __name__ == "__main__":
    main()
