"""Build static HTML from Flask app for GitHub Pages deployment."""
import shutil, json, sys
from pathlib import Path
from app import app, get_posts, get_notes, POSTS_DIR, NOTES_DIR

DIST = Path(__file__).parent / "dist"
BASE = "/jzc-blog"


def freeze(url: str) -> str:
    """Render a Flask route and return the HTML with fixed paths."""
    with app.test_client() as client:
        resp = client.get(url)
        assert resp.status_code == 200, f"{url} returned {resp.status_code}"
        html = resp.data.decode("utf-8")
        # Fix absolute paths for GitHub Pages subdirectory
        html = html.replace('href="/', f'href="{BASE}/')
        html = html.replace("href='/", f"href='{BASE}/")
        html = html.replace('src="/', f'src="{BASE}/')
        html = html.replace("src='/", f"src='{BASE}/")
        html = html.replace('action="/', f'action="{BASE}/')
        html = html.replace("/static/css/animal.css", f"{BASE}/static/css/animal.css")
        # Fix JS paths
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
        return html


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    # static files
    css_dst = DIST / "static" / "css"
    css_dst.mkdir(parents=True)
    for f in (Path(__file__).parent / "static" / "css").glob("*"):
        shutil.copy(f, css_dst / f.name)

    (DIST / ".nojekyll").touch()

    posts = get_posts()

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

    # rss
    (DIST / "rss.xml").write_text(freeze("/rss.xml"), encoding="utf-8")

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
