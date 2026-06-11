import os, re, math
from datetime import datetime
from email.utils import format_datetime
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

import frontmatter
import markdown
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, Response
from markdown.extensions.toc import TocExtension
from pygments.formatters import HtmlFormatter

from config import Config
from extensions import db
from models import Post, Comment, PageView

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

POSTS_DIR = Path(__file__).parent / "posts"
NOTES_DIR = Path(__file__).parent / "notes"
POSTS_DIR.mkdir(exist_ok=True)
NOTES_DIR.mkdir(exist_ok=True)

# ---------- markdown 渲染 (with Pygments + TOC) ----------
toc_ext = TocExtension(permalink=False)
md = markdown.Markdown(extensions=["fenced_code", "codehilite", "tables", toc_ext])

# Pygments style for code blocks
PYGMENTS_CSS = HtmlFormatter(style="monokai").get_style_defs(".codehilite")


def _render_post(post: Post) -> dict:
    """Render a Post model into the dict format templates expect."""
    html = md.convert(post.content)
    toc_html = getattr(md, "toc", "") or ""
    md.reset()
    text = post.content
    chinese_chars = len(re.findall(r'[一-鿿]', text))
    english_words = len(re.findall(r'[a-zA-Z]+', text))
    word_count = chinese_chars + english_words
    read_time = max(1, math.ceil(word_count / 400))
    return {
        "slug": post.slug,
        "title": post.title,
        "date": str(post.created_at.date()) if post.created_at else "",
        "tag": post.tag,
        "excerpt": post.excerpt or "",
        "content": post.content,
        "html": html,
        "toc": toc_html,
        "word_count": word_count,
        "read_time": read_time,
    }


def get_posts(tag: str | None = None) -> list[dict]:
    """Get all published posts, optionally filtered by tag, sorted by date desc."""
    query = Post.query.filter_by(is_post=True, status="published").order_by(
        Post.created_at.desc()
    )
    if tag:
        query = query.filter_by(tag=tag)
    all_posts = [_render_post(p) for p in query.all()]

    for p in all_posts:
        p["html"] = _add_internal_links(p["html"], p["slug"], all_posts)

    return all_posts


def get_all_tags() -> list[str]:
    """Get unique tags from all published posts."""
    rows = Post.query.with_entities(Post.tag).filter_by(
        is_post=True, status="published"
    ).distinct().all()
    return sorted(row[0] for row in rows if row[0])


def _add_internal_links(html: str, current_slug: str, all_posts: list[dict]) -> str:
    """Replace mentions of other post titles with internal links."""
    candidates = [(p["title"], p["slug"]) for p in all_posts
                  if p["slug"] != current_slug and len(p["title"]) >= 4]
    # Longest first to avoid partial matches
    candidates.sort(key=lambda x: -len(x[0]))

    for title, slug in candidates:
        parts = re.split(r"(<[^>]*>)", html)
        for i in range(len(parts)):
            if parts[i].startswith("<"):
                continue
            if title in parts[i]:
                parts[i] = parts[i].replace(
                    title,
                    f'<a href="/post/{slug}" class="internal-link">{title}</a>',
                    1,
                )
                break
        html = "".join(parts)

    return html


def get_notes() -> list[dict]:
    """Get all published notes, sorted by date desc."""
    query = Post.query.filter_by(is_post=False, status="published").order_by(
        Post.created_at.desc()
    )
    return [_render_post(p) for p in query.all()]


# ---------- card color helper ----------
COLORS = [
    "app-blue", "app-green", "app-orange", "app-pink", "purple",
    "app-teal", "brown", "lime-green", "yellow-green", "app-yellow",
    "warm-peach-pink", "app-red",
]

def color_for(tag: str | None) -> str:
    """Pick a stable color based on tag name."""
    if not tag:
        return "app-blue"
    idx = hash(tag) % len(COLORS)
    return COLORS[idx]


app.jinja_env.globals["color_for"] = color_for
app.jinja_env.globals["pygments_css"] = PYGMENTS_CSS
app.jinja_env.globals["site_url"] = "https://jiazhichao.xyz"


def _to_rfc2822(date_str: str) -> str:
    """Convert a date string like '2026-05-23' to RFC 2822 format."""
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M"):
        try:
            dt = datetime.strptime(str(date_str), fmt)
            return format_datetime(dt)
        except ValueError:
            continue
    return str(date_str)


# ---------- routes ----------
@app.route("/")
def home():
    tag = request.args.get("tag", "")
    posts = get_posts(tag if tag else None)
    notes = get_notes()[:5]
    all_tags = get_all_tags()
    return render_template("home.html", posts=posts, notes=notes, all_tags=all_tags, current_tag=tag)


@app.route("/post/<slug>")
def post_detail(slug: str):
    path = POSTS_DIR / f"{slug}.md"
    if not path.exists():
        return render_template("404.html"), 404
    posts = get_posts()
    p = next((x for x in posts if x["slug"] == slug), None)
    if not p:
        return render_template("404.html"), 500
    idx = posts.index(p)
    prev_post = posts[idx + 1] if idx + 1 < len(posts) else None
    next_post = posts[idx - 1] if idx > 0 else None
    return render_template("post.html", post=p, prev_post=prev_post, next_post=next_post)


@app.route("/notes")
def notes_page():
    notes = get_notes()
    return render_template("notes.html", notes=notes)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/editor")
def editor():
    return render_template("editor.html", mode="post")


@app.route("/editor/note")
def editor_note():
    return render_template("editor.html", mode="note")


@app.route("/editor/save", methods=["POST"])
def editor_save():
    mode = request.form.get("mode", "post")
    title = request.form.get("title", "").strip()
    tag = request.form.get("tag", "未分类").strip()
    content = request.form.get("content", "").strip()

    if not title:
        return "Title is required", 400

    slug = re.sub(r"[^\w\-]", "", title.lower().replace(" ", "-"))
    excerpt = content[:120].replace("\n", " ") if content else ""
    is_post = mode != "note"

    existing = Post.query.filter_by(slug=slug).first()
    if existing:
        existing.title = title
        existing.content = content
        existing.excerpt = excerpt
        existing.tag = tag
        existing.updated_at = datetime.utcnow()
    else:
        post = Post(
            slug=slug, title=title, content=content,
            excerpt=excerpt, tag=tag, is_post=is_post,
        )
        db.session.add(post)

    db.session.commit()
    return redirect(url_for("post_detail", slug=slug) if is_post else url_for("notes_page"))


# ---------- RSS ----------
@app.route("/rss.xml")
def rss_feed():
    site_url = request.url_root.rstrip("/")
    feed = Element("rss", version="2.0")
    channel = SubElement(feed, "channel")
    SubElement(channel, "title").text = "JZC's Island"
    SubElement(channel, "link").text = site_url
    SubElement(channel, "description").text = "技术、生活，和随手笔记"
    SubElement(channel, "language").text = "zh-CN"

    for p in get_posts()[:20]:
        item_url = f"{site_url}/post/{p['slug']}"
        item = SubElement(channel, "item")
        SubElement(item, "title").text = p["title"]
        SubElement(item, "link").text = item_url
        SubElement(item, "guid", isPermaLink="true").text = item_url
        SubElement(item, "description").text = p["excerpt"]
        SubElement(item, "pubDate").text = _to_rfc2822(p["date"])

    xml_str = minidom.parseString(tostring(feed, "utf-8")).toprettyxml(encoding="UTF-8")
    return Response(xml_str, mimetype="application/rss+xml")


# ---------- 404 ----------
@app.route("/404")
def not_found():
    return render_template("404.html")


# ---------- Random Post ----------
@app.route("/random")
def random_post():
    import random
    posts = get_posts()
    if not posts:
        return {"url": "/"}
    p = random.choice(posts)
    return {"url": f"/post/{p['slug']}"}


# ---------- Search API ----------
@app.route("/search")
def search():
    q = request.args.get("q", "").strip().lower()
    if not q:
        return {"results": []}
    results = []
    for p in get_posts():
        if q in p["title"].lower() or q in p["content"].lower():
            results.append({
                "slug": p["slug"],
                "title": p["title"],
                "tag": p["tag"],
                "date": p["date"],
                "excerpt": p["excerpt"],
            })
    return {"results": results}


@app.before_request
def _ensure_tables():
    """Create tables on first request if they don't exist."""
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
