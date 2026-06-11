import os, re, math
from datetime import datetime
from email.utils import format_datetime
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

import markdown
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, Response
from markdown.extensions.toc import TocExtension
from pygments.formatters import HtmlFormatter

app = Flask(__name__)

POSTS_DIR = Path(__file__).parent / "posts"
NOTES_DIR = Path(__file__).parent / "notes"
POSTS_DIR.mkdir(exist_ok=True)
NOTES_DIR.mkdir(exist_ok=True)

# Database imports wrapped so Vercel build doesn't fail if a driver is missing
_HAS_DB = False
try:
    from config import Config
    from extensions import db
    from models import Post, Comment, PageView

    app.config.from_object(Config)
    db.init_app(app)
    _HAS_DB = True
except Exception:
    Post = Comment = PageView = db = None

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
    if not _HAS_DB:
        return []
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
    if not _HAS_DB:
        return []
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
    if not _HAS_DB:
        return []
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
    if not _HAS_DB:
        return render_template("404.html"), 404
    post = Post.query.filter_by(slug=slug, is_post=True, status="published").first()
    if not post:
        return render_template("404.html"), 404
    posts = get_posts()
    p = next((x for x in posts if x["slug"] == slug), None)
    if not p:
        return render_template("404.html"), 500
    idx = posts.index(p)
    prev_post = posts[idx + 1] if idx + 1 < len(posts) else None
    next_post = posts[idx - 1] if idx > 0 else None

    pv = PageView.query.filter_by(post_slug=slug).first()
    view_count = pv.count if pv else 0

    return render_template(
        "post.html", post=p, prev_post=prev_post, next_post=next_post,
        view_count=view_count,
    )


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
    if not _HAS_DB:
        return "Database not available", 503
    mode = request.form.get("mode", "post")
    title = request.form.get("title", "").strip()
    tag = request.form.get("tag", "未分类").strip()
    content = request.form.get("content", "").strip()

    if not title:
        return "Title is required", 400

    slug = re.sub(r"[^\w\-]", "", title.lower().replace(" ", "-"))
    # If slug is empty or all non-ASCII, generate a hash-based slug
    if not slug or not any(c.isascii() and c.isalpha() for c in slug):
        import hashlib
        slug = "post-" + hashlib.md5(title.encode()).hexdigest()[:8]
    excerpt = content[:120].replace("\n", " ") if content else ""
    is_post = mode != "note"

    original_slug = request.form.get("original_slug", "").strip()
    lookup_slug = original_slug or slug
    existing = Post.query.filter_by(slug=lookup_slug).first()
    if existing:
        existing.slug = slug  # Update slug if title changed
        existing.title = title
        existing.content = content
        existing.excerpt = excerpt
        existing.tag = tag
    else:
        post = Post(
            slug=slug, title=title, content=content,
            excerpt=excerpt, tag=tag, is_post=is_post,
        )
        db.session.add(post)

    db.session.commit()
    return redirect(url_for("post_detail", slug=slug) if is_post else url_for("notes_page"))


# ---------- Editor: list + edit + delete ----------
@app.route("/editor/list")
def editor_list():
    """Return all posts as JSON for the editor panel."""
    if not _HAS_DB:
        return {"posts": []}
    posts = Post.query.filter_by(is_post=True).order_by(Post.created_at.desc()).all()
    return {
        "posts": [
            {"slug": p.slug, "title": p.title, "tag": p.tag,
             "status": p.status, "date": str(p.created_at.date()) if p.created_at else ""}
            for p in posts
        ]
    }


@app.route("/editor/get/<slug>")
def editor_get(slug: str):
    """Return a single post's content for editing."""
    if not _HAS_DB:
        return {"error": "Database not available"}, 503
    post = Post.query.filter_by(slug=slug, is_post=True).first()
    if not post:
        return {"error": "post not found"}, 404
    return {
        "slug": post.slug,
        "title": post.title,
        "content": post.content,
        "tag": post.tag,
        "status": post.status,
    }


@app.route("/editor/delete", methods=["POST"])
def editor_delete():
    """Delete a post by slug."""
    if not _HAS_DB:
        return {"error": "Database not available"}, 503
    slug = (request.form.get("slug") or "").strip()
    if not slug:
        return {"error": "slug required"}, 400
    post = Post.query.filter_by(slug=slug, is_post=True).first()
    if not post:
        return {"error": "post not found"}, 404
    db.session.delete(post)
    db.session.commit()
    return {"ok": True}


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


# ---------- Comments ----------
@app.route("/comment/<slug>", methods=["GET"])
def get_comments(slug: str):
    """Get all comments for a post."""
    if not _HAS_DB:
        return {"comments": []}
    post = Post.query.filter_by(slug=slug, status="published").first()
    if not post:
        return {"comments": []}
    comments = post.comments.order_by(Comment.created_at.asc()).all()
    return {
        "comments": [
            {
                "author_name": c.author_name,
                "content": c.content,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for c in comments
        ]
    }


@app.route("/comment", methods=["POST"])
def post_comment():
    """Submit a comment. Requires: slug, author_name, content."""
    if not _HAS_DB:
        return {"error": "database not available"}, 503
    data = request.get_json() or {}
    slug = (data.get("slug") or "").strip()
    author_name = (data.get("author_name") or "").strip()
    content = (data.get("content") or "").strip()

    if not slug or not author_name or not content:
        return {"error": "slug, author_name, content are required"}, 400
    if len(author_name) > 50 or len(content) > 2000:
        return {"error": "name too long (max 50) or content too long (max 2000)"}, 400

    post = Post.query.filter_by(slug=slug, status="published").first()
    if not post:
        return {"error": "post not found"}, 404

    comment = Comment(post_id=post.id, author_name=author_name, content=content)
    db.session.add(comment)
    db.session.commit()
    return {"ok": True}, 201


# ---------- Page Views ----------
@app.route("/view/<slug>", methods=["POST"])
def record_view(slug: str):
    """Record a page view for a post."""
    if not _HAS_DB:
        return {"count": 0}
    post = Post.query.filter_by(slug=slug, status="published").first()
    if not post:
        return {"error": "post not found"}, 404
    pv = PageView.query.filter_by(post_slug=slug).first()
    if pv:
        pv.count += 1
        pv.last_updated = datetime.now()
    else:
        pv = PageView(post_slug=slug, count=1)
        db.session.add(pv)
    db.session.commit()
    return {"count": pv.count}


_tables_created = False


@app.before_request
def _ensure_tables():
    """Create tables on first request if they don't exist."""
    global _tables_created
    if _HAS_DB and not _tables_created:
        db.create_all()
        _tables_created = True


if __name__ == "__main__":
    app.run(debug=True, port=5000)
