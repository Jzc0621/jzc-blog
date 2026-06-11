# 博客数据库化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客添加 PostgreSQL 数据库，实现评论系统、页面阅读统计、在线编辑器持久化。

**Architecture:** Flask + Flask-SQLAlchemy + Neon PostgreSQL（环境变量切换 SQLite 本地开发）。数据库是唯一数据源，本地 Markdown 文件通过 migrate.py 一次性导入后降级为备份。

**Tech Stack:** Flask 3.1, Flask-SQLAlchemy, psycopg2-binary, Neon PostgreSQL (serverless)

---

## File Structure

```
jzc-blog/
├── config.py          NEW - 数据库连接配置（环境变量 → DATABASE_URL）
├── extensions.py      NEW - db = SQLAlchemy() 单例，避免循环引用
├── models.py          NEW - Post, Comment, PageView 三个模型
├── migrate.py         NEW - 一次性导入 posts/*.md + notes/*.md 到数据库
├── app.py             MODIFY - 数据访问改为 DB，新增评论/阅读量路由
├── build.py           MODIFY - 加 db 初始化以触发表创建
├── requirements.txt   MODIFY - 加 flask-sqlalchemy, psycopg2-binary
├── templates/
│   └── post.html      MODIFY - 加评论区和阅读计数
├── .github/workflows/
│   └── deploy.yml     MODIFY - 加 DATABASE_URL 环境变量和 pip 依赖
```

---

### Task 1: 安装新依赖

**Files:**
- Modify: `requirements.txt`

- [ ] **Step 1: 更新 requirements.txt**

```
flask==3.1.0
markdown==3.8
pygments==2.19.1
python-frontmatter==1.1.0
pillow==11.3.0
flask-sqlalchemy==3.1.1
psycopg2-binary==2.9.10
```

- [ ] **Step 2: 安装依赖**

```bash
pip install -r requirements.txt
```

- [ ] **Step 3: 验证安装**

```bash
python -c "import flask_sqlalchemy; import psycopg2; print('OK')"
```

- [ ] **Step 4: Commit**

```bash
git add requirements.txt
git commit -m "deps: add flask-sqlalchemy and psycopg2-binary"
```

---

### Task 2: 创建 config.py

**Files:**
- Create: `config.py`

- [ ] **Step 1: 编写 config.py**

```python
"""App configuration. All values read from environment variables."""
import os


class Config:
    # Neon PostgreSQL in production, SQLite for local dev
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.dirname(__file__), "blog.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
```

- [ ] **Step 2: 验证语法正确**

```bash
python -c "from config import Config; print(Config.SQLALCHEMY_DATABASE_URI)"
```
Expected output: `sqlite:///...blog.db`（本地默认 SQLite）

- [ ] **Step 3: Commit**

```bash
git add config.py
git commit -m "feat: add database config (Neon in prod, SQLite for local dev)"
```

---

### Task 3: 创建 extensions.py

**Files:**
- Create: `extensions.py`

- [ ] **Step 1: 编写 extensions.py**

```python
"""Flask extension instances. Kept separate from app.py to avoid circular imports."""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
```

- [ ] **Step 2: Commit**

```bash
git add extensions.py
git commit -m "feat: add SQLAlchemy extension singleton"
```

---

### Task 4: 创建 models.py

**Files:**
- Create: `models.py`

- [ ] **Step 1: 编写 models.py**

```python
"""Database models: Post, Comment, PageView."""
from datetime import datetime
from extensions import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(500), default="")
    tag = db.Column(db.String(50), default="未分类")
    is_post = db.Column(db.Boolean, default=True)  # True=文章, False=笔记
    status = db.Column(db.String(20), default="published")  # published / draft
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = db.relationship("Comment", backref="post", lazy="dynamic",
                                cascade="all, delete-orphan")


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False, index=True)
    author_name = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PageView(db.Model):
    __tablename__ = "page_views"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    post_slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    count = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 2: 验证语法正确**

```bash
python -c "from models import Post, Comment, PageView; print('OK')"
```
Expected: 报错 `ModuleNotFoundError: No module named 'flask'`（需要 Flask app context 初始化才能验证关系声明）— 这说明需要在 app 初始化后才能验证。语法层面没问题即可。

- [ ] **Step 3: Commit**

```bash
git add models.py
git commit -m "feat: add Post, Comment, PageView database models"
```

---

### Task 5: 初始化数据库并改写 app.py 数据访问

这是最核心的任务——将 app.py 从文件系统读写改为数据库读写。

**Files:**
- Modify: `app.py`

**当前 app.py 结构（参考）：**
- 1-18 行：import + Flask app 初始化
- 21-27 行：markdown 渲染配置
- 28-56 行：`_parse_file()` — 解析 .md 文件
- 59-74 行：`get_posts()` — 读目录返回文章列表
- 77-82 行：`get_all_tags()` — 从文章列表取标签
- 85-106 行：`_add_internal_links()` — 文章间自动链接
- 109-117 行：`get_notes()` — 读 notes 目录
- 120-137 行：颜色常量 + `color_for()` + Jinja globals
- 151-288 行：路由函数

- [ ] **Step 1: 修改导入区（app.py 顶部）**

替换当前 1-13 行：

```python
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
```

- [ ] **Step 2: 删除旧的 `_parse_file()` 函数（28-56 行）**

因为不再需要从 `.md` 文件解析文章。保留 markdown 渲染能力但改为处理数据库对象。

替换 `_parse_file` 为一个渲染辅助函数 `_render_post(post)`，放在原 `_parse_file` 位置：

```python
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
```

- [ ] **Step 3: 重写 `get_posts()`**

替换当前 59-74 行：

```python
def get_posts(tag: str | None = None) -> list[dict]:
    """Get all published posts, optionally filtered by tag, sorted by date desc."""
    query = Post.query.filter_by(is_post=True, status="published").order_by(
        Post.created_at.desc()
    )
    if tag:
        query = query.filter_by(tag=tag)
    all_posts = [_render_post(p) for p in query.all()]

    # Apply internal links (second pass)
    for p in all_posts:
        p["html"] = _add_internal_links(p["html"], p["slug"], all_posts)

    return all_posts
```

- [ ] **Step 4: 重写 `get_all_tags()`**

替换当前 77-82 行：

```python
def get_all_tags() -> list[str]:
    """Get unique tags from all published posts."""
    rows = Post.query.with_entities(Post.tag).filter_by(
        is_post=True, status="published"
    ).distinct().all()
    return sorted(row[0] for row in rows if row[0])
```

- [ ] **Step 5: 重写 `get_notes()`**

替换当前 109-117 行：

```python
def get_notes() -> list[dict]:
    """Get all published notes, sorted by date desc."""
    query = Post.query.filter_by(is_post=False, status="published").order_by(
        Post.created_at.desc()
    )
    return [_render_post(p) for p in query.all()]
```

- [ ] **Step 6: 重写 `editor_save()` 路由**

替换当前 197-223 行：

```python
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
```

- [ ] **Step 7: 添加 `before_request` 自动建表**

在 `if __name__ == "__main__":` 之前添加：

```python
@app.before_request
def _ensure_tables():
    """Create tables on first request if they don't exist."""
    db.create_all()
```

这样在 Vercel 部署时首次请求自动建表，无需手动 migration。

- [ ] **Step 8: 验证语法正确**

```bash
python -c "
from app import app
with app.app_context():
    from models import Post, Comment, PageView
    from extensions import db
    db.create_all()
    print('Tables created OK')
"
```

预期输出: `Tables created OK`

- [ ] **Step 9: Commit**

```bash
git add app.py
git commit -m "feat: migrate data access from filesystem to database"
```

---

### Task 6: 添加评论和阅读统计路由

**Files:**
- Modify: `app.py` 尾部

- [ ] **Step 1: 在 app.py 的 `search()` 路由之后，`if __name__ == "__main__":` 之前，添加以下路由**

```python
# ---------- Comments ----------
@app.route("/api/comment/<slug>", methods=["GET"])
def get_comments(slug: str):
    """Get all comments for a post."""
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


@app.route("/api/comment", methods=["POST"])
def post_comment():
    """Submit a comment. Requires: slug, author_name, content."""
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
@app.route("/api/view/<slug>", methods=["POST"])
def record_view(slug: str):
    """Record a page view for a post."""
    pv = PageView.query.filter_by(post_slug=slug).first()
    if pv:
        pv.count += 1
        pv.last_updated = datetime.utcnow()
    else:
        pv = PageView(post_slug=slug, count=1)
        db.session.add(pv)
    db.session.commit()
    return {"count": pv.count}
```

- [ ] **Step 2: 在 `post_detail()` 路由中传入 view_count**

需要修改 `post_detail` 函数以查询 `PageView` 并传给模板。找到 `post_detail` 路由（大约第 161 行），替换为：

```python
@app.route("/post/<slug>")
def post_detail(slug: str):
    post = Post.query.filter_by(slug=slug, is_post=True, status="published").first()
    if not post:
        posts = get_posts()  # still needed for surrounding link rendering
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
```

- [ ] **Step 3: Commit**

```bash
git add app.py
git commit -m "feat: add comment and page view APIs"
```

---

### Task 7: 更新模板——评论区 + 阅读计数

**Files:**
- Modify: `templates/post.html`

- [ ] **Step 1: 修改 `templates/post.html`**

替换整个文件内容为：

```jinja
{% extends "base.html" %}
{% block title %}{{ post.title }} — JZC{% endblock %}
{% block og_title %}{{ post.title }}{% endblock %}
{% block og_desc %}{{ post.excerpt }}{% endblock %}
{% block content %}

<div class="mt-20">
  <a href="/" class="btn btn-sm">← 返回</a>
</div>

<div class="post-layout mt-20">
  <article class="article-body">
    <div class="tag mb-12">#{{ post.tag }}</div>
    <h1>{{ post.title }}</h1>
    <div class="post-meta mb-24" style="font-size:11px;color:var(--text-disabled);">
      <span>{{ post.date }}</span>
      <span>{{ post.read_time }} 分钟阅读</span>
      <span>{{ post.word_count }} 字</span>
      <span id="pageViewCount">阅读 <span id="viewCount">{{ view_count }}</span> 次</span>
      <span id="busuanzi_container_page_pv" style="display:none;">阅读 <span id="busuanzi_value_page_pv"></span> 次</span>
    </div>

    <div class="divider divider-brown" style="margin:0 0 20px;"></div>

    {{ post.html | safe }}
  </article>

  {% if post.toc %}
  <aside class="toc-sidebar">
    <div class="toc-sticky">
      <div class="section-title">目录</div>
      <div class="toc-content">{{ post.toc | safe }}</div>
    </div>
  </aside>
  {% endif %}
</div>

<div class="flex-between mt-32 mb-24" style="max-width:960px;margin-left:auto;margin-right:auto;">
  {% if prev_post %}
    <a href="/post/{{ prev_post.slug }}" class="btn">← {{ prev_post.title }}</a>
  {% else %}
    <span></span>
  {% endif %}
  {% if next_post %}
    <a href="/post/{{ next_post.slug }}" class="btn btn-primary">{{ next_post.title }} →</a>
  {% else %}
    <span></span>
  {% endif %}
</div>

<!-- Comment Section -->
<div class="comment-section" style="max-width:960px;margin:0 auto;padding:0 20px;">
  <div class="divider divider-teal"></div>
  <div class="section-title">评论</div>

  {% if not hide_editor %}
  <form class="comment-form" id="commentForm" onsubmit="submitComment(event)" style="margin-bottom:24px;">
    <input class="input" name="author_name" placeholder="你的昵称" maxlength="50" required style="margin-bottom:8px;">
    <textarea class="textarea" name="content" placeholder="写下你的想法..." maxlength="2000" required style="min-height:80px;"></textarea>
    <button type="submit" class="btn btn-primary btn-sm" style="margin-top:8px;">发送评论</button>
  </form>
  {% endif %}

  <div id="commentList"></div>
</div>

<!-- Record view + Load comments -->
<script>
(function() {
  var slug = "{{ post.slug }}";

  // Record page view
  fetch("/api/view/" + slug, { method: "POST" })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var el = document.getElementById("viewCount");
      if (el) el.textContent = d.count;
    });

  // Load comments
  function loadComments() {
    fetch("/api/comment/" + slug)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var container = document.getElementById("commentList");
        if (!d.comments || !d.comments.length) {
          container.innerHTML = '<p class="text-muted" style="font-size:13px;">还没有评论，来写第一条吧。</p>';
          return;
        }
        container.innerHTML = d.comments.map(function(c) {
          return '<div class="comment-item" style="margin-bottom:16px;padding:12px;background:var(--card-bg);border-radius:16px;">' +
            '<div style="font-weight:700;font-size:13px;color:var(--accent);">' + escapeHtml(c.author_name) +
            ' <span style="font-weight:400;font-size:11px;color:var(--text-disabled);">' + c.created_at + '</span></div>' +
            '<div style="margin-top:6px;font-size:14px;white-space:pre-wrap;">' + escapeHtml(c.content) + '</div>' +
            '</div>';
        }).join("");
      });
  }

  function escapeHtml(text) {
    var d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  loadComments();
})();

function submitComment(e) {
  e.preventDefault();
  var form = document.getElementById("commentForm");
  var data = {
    slug: "{{ post.slug }}",
    author_name: form.author_name.value.trim(),
    content: form.content.value.trim()
  };
  if (!data.author_name || !data.content) return;
  fetch("/api/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.ok) {
        form.reset();
        location.reload();
      }
    });
}
</script>

{% endblock %}
```

- [ ] **Step 2: Commit**

```bash
git add templates/post.html
git commit -m "feat: add comment section and view counter to post template"
```

---

### Task 8: 创建 migrate.py — 导入现有文章

**Files:**
- Create: `migrate.py`

- [ ] **Step 1: 编写 migrate.py**

```python
"""One-time migration: import existing posts/*.md and notes/*.md into the database."""
import re, sys
from datetime import datetime
from pathlib import Path

from app import app
from extensions import db
from models import Post

import frontmatter


def import_dir(directory: Path, is_post: bool):
    """Import all .md files from directory into database."""
    count = 0
    for f in sorted(directory.glob("*.md")):
        try:
            meta = frontmatter.load(f)
        except Exception:
            print(f"  SKIP {f.name}: parse error")
            continue

        slug = f.stem
        title = meta.get("title", slug)
        date_str = meta.get("date", "")
        tag = meta.get("tag", "未分类")
        excerpt = meta.get("excerpt", "")
        content = meta.content

        # Parse date from frontmatter or filename
        dt = None
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M"):
            try:
                dt = datetime.strptime(str(date_str), fmt)
                break
            except ValueError:
                continue

        existing = Post.query.filter_by(slug=slug).first()
        if existing:
            print(f"  SKIP {f.name}: slug '{slug}' already exists")
            continue

        post = Post(
            slug=slug, title=title, content=content,
            excerpt=excerpt[:500], tag=tag, is_post=is_post,
            status="published",
        )
        if dt:
            post.created_at = dt
            post.updated_at = dt
        db.session.add(post)
        count += 1
        print(f"  OK {f.name} -> slug='{slug}'")

    return count


def main():
    with app.app_context():
        db.create_all()

        print("Importing posts...")
        n_posts = import_dir(Path(__file__).parent / "posts", is_post=True)

        print("\nImporting notes...")
        n_notes = import_dir(Path(__file__).parent / "notes", is_post=False)

        db.session.commit()
        print(f"\nDone! {n_posts} posts + {n_notes} notes imported.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 本地测试导入**

```bash
python migrate.py
```

预期输出: 列出所有文章和便签的导入状态，最后显示 `Done! 10 posts + 5 notes imported.`

- [ ] **Step 3: 验证导入后页面正常**

启动 Flask 并访问首页确认文章显示正常：

```bash
python app.py &
sleep 2
curl -s http://localhost:5000/ | grep -o "欢迎来到" | head -1
kill %1
```

预期: 输出 `欢迎来到`

- [ ] **Step 4: Commit**

```bash
git add migrate.py
git commit -m "feat: add migration script for existing markdown files"
```

---

### Task 9: 更新 build.py — 构建时连接数据库

**Files:**
- Modify: `build.py`
- Modify: `.github/workflows/deploy.yml`

`build.py` 使用 Flask test client 的 `freeze()` 来抓取页面。现在数据来自数据库，所以需要确保数据库可用（即使是只读的本地 SQLite 文件）。

- [ ] **Step 1: 修改 build.py 中导入 app 后的初始化**

在 `build.py` 顶部，`from app import app, get_posts, get_notes, POSTS_DIR, NOTES_DIR` 之后，`DIST = ...` 之前，添加：

```python
from extensions import db

# Create tables if they don't exist (keep SQLite DB if migrated previously)
with app.app_context():
    db.create_all()
```

- [ ] **Step 2: 更新 build.py 中的 pip 依赖安装注释**

这一行只是提醒——build.py 不直接 import SQLAlchemy，但依赖 app.py 的间接导入。

不需要修改 build.py 的其他部分，因为 `freeze()` 走 Flask 路由，而路由已经从数据库读数据。

- [ ] **Step 3: 更新 GitHub Actions deploy.yml**

替换 `.github/workflows/deploy.yml` 为：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install flask markdown pygments python-frontmatter pillow flask-sqlalchemy psycopg2-binary

      - name: Build static site
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: python build.py

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
          cname: www.jiazhichao.xyz
```

变更：pip install 加了 `flask-sqlalchemy psycopg2-binary`，build 步骤加了 `DATABASE_URL` 环境变量。

- [ ] **Step 4: Commit**

```bash
git add build.py .github/workflows/deploy.yml
git commit -m "feat: wire database into build pipeline"
```

---

### Task 10: 部署 — 注册 Neon + 配环境变量

- [ ] **Step 1: 注册 Neon**

访问 https://neon.tech，用 GitHub 账号注册。

- [ ] **Step 2: 创建数据库**

在 Neon 控制台：
1. Create project → 名称 `jzc-blog`
2. 创建后获得连接字符串，格式：
   `postgresql://<user>:<password>@<host>/<dbname>?sslmode=require`

- [ ] **Step 3: 添加 Vercel 环境变量**

在 Vercel 项目设置 → Environment Variables → 添加：
- Key: `DATABASE_URL`
- Value: `postgresql://...`（Neon 连接字符串）
- 勾选所有环境（Production, Preview, Development）

重新部署 Vercel（push 或手动 redeploy）。

- [ ] **Step 4: 运行线上 migrate.py**

部署后，通过 Vercel CLI 或直接在线上访问一次以下 URL（临时调试路由）：

不需要——因为 `@app.before_request` 中的 `db.create_all()` 会自动建表。但需要导入数据。

**两种方式：**
- **方式 A（推荐）：** 本地设置 `DATABASE_URL` 为 Neon 连接串，运行 `python migrate.py`，直接写入线上数据库
- **方式 B：** 添加一个临时路由 `/admin/migrate`，访问即触发导入（需在 Vercel 上部署后访问），完成后删除该路由

推荐方式 A，更安全：

```bash
export DATABASE_URL="postgresql://..."  # Linux/Mac
set DATABASE_URL=postgresql://...       # Windows CMD
$env:DATABASE_URL="postgresql://..."    # Windows PowerShell

python migrate.py
```

- [ ] **Step 5: 验证线上功能**

- 访问 `https://jiazhichao.xyz` — 文章列表正常
- 访问任意文章 — 内容 + 评论框正常
- 从手机访问 `/editor` — 可以登录并发布文章
- 提交一条评论 — 评论显示正常
- 刷新文章页 — 阅读计数 +1

- [ ] **Step 6: Commit 最终的配置**

```bash
git add -A
git commit -m "chore: final deployment configuration"
git push origin master
```

---

## Verification Checklist

部署完成后逐项检查：

- [ ] 首页正常加载，文章列表完整
- [ ] 文章详情页正常，Markdown 渲染无误
- [ ] TOC 目录正常
- [ ] 随机文章正常
- [ ] 搜索正常
- [ ] 便签墙正常
- [ ] 编辑器可登录（密码门），可发布/编辑文章
- [ ] 评论区：提交评论 → 刷新可见
- [ ] 阅读计数：刷新文章 → 数字递增
- [ ] RSS 正常
- [ ] GitHub Pages 静态站点正常（CI 通过）
- [ ] 手机浏览器访问 → 所有功能正常
