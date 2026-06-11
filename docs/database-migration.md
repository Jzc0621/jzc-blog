# 博客数据库化改造记录

**日期：** 2026-06-11  
**原文部署：** GitHub Pages（静态） + Vercel（Flask 运行时）

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 后端框架 | Flask 3.1.0 |
| 数据库 | Neon PostgreSQL（serverless，免费 500MB） |
| ORM | Flask-SQLAlchemy 3.1.1 |
| 数据库驱动 | psycopg2-binary 2.9.10 |
| Markdown 渲染 | Python-Markdown + Pygments 代码高亮 + TOC 目录 |
| 部署 | Vercel（Flask 运行时）+ GitHub Pages（静态站点备份） |
| 本地开发回退 | SQLite（无需数据库即可本地运行） |
| 前端 | Jinja2 模板 + 手写 CSS（动森主题）+ 原生 JS |

---

## 新增文件

| 文件 | 作用 |
|------|------|
| `config.py` | 数据库连接配置，环境变量 `DATABASE_URL`（线上 Neon），默认回退 SQLite |
| `extensions.py` | `db = SQLAlchemy()` 单例，避免循环引用 |
| `models.py` | Post、Comment、PageView 三个数据模型 |
| `migrate.py` | 一次性脚本，将 `posts/*.md` 和 `notes/*.md` 导入数据库 |
| `api/index.py` | Vercel serverless function 入口，导入 Flask app |
| `api/requirements.txt` | Vercel 函数依赖（与根目录 `requirements.txt` 同步） |
| `.python-version` | 指定 Python 3.12 运行时 |
| `pyproject.toml` | Vercel 入口点配置 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `app.py` | 数据访问从文件系统改为数据库；新增评论 API、阅读量 API；中文标题自动生成英文 slug |
| `templates/post.html` | 添加评论区（昵称 + 内容）+ 数据库阅读计数器 |
| `build.py` | 构建时添加数据库初始化和 app context |
| `requirements.txt` | +flask-sqlalchemy, +psycopg2-binary |
| `.github/workflows/deploy.yml` | +新依赖, +DATABASE_URL 环境变量 |
| `.gitignore` | +blog.db, +dist/ |
| `vercel.json` | 改为 `functions` 配置 + 路由规则 |

---

## 新增功能

- **在线编辑器持久化** — `/editor` 发表的文章存入 Neon，之前只能存到临时文件
- **评论系统** — `GET/POST /comment` API，文章底部评论区
- **页面阅读统计** — 每次访问文章自动 +1，独立于第三方不蒜子统计

---

## 数据库表结构

### posts
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
slug        VARCHAR(200) UNIQUE NOT NULL INDEXED
title       VARCHAR(200) NOT NULL
content     TEXT NOT NULL
excerpt     VARCHAR(500)
tag         VARCHAR(50) DEFAULT '未分类'
is_post     BOOLEAN DEFAULT TRUE       -- TRUE=文章, FALSE=笔记
status      VARCHAR(20) DEFAULT 'published'  -- published / draft
created_at  DATETIME
updated_at  DATETIME
```

### comments
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
post_id     INTEGER FK → posts.id ON DELETE CASCADE
author_name VARCHAR(50) NOT NULL
content     TEXT NOT NULL
created_at  DATETIME
```

### page_views
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
post_slug   VARCHAR(200) UNIQUE INDEXED
count       INTEGER DEFAULT 0
last_updated DATETIME
```

---

## 遇到的问题与解决方法

### 1. Vercel 部署一直返回旧代码（静态页面）

**现象：** 新加的 API 路由全部 404，页面没有评论区。

**原因：** Vercel 项目 Framework Preset 设为 "Flask" 时，检测到仓库中的 `dist/` 目录，将其当作静态站点输出，完全忽略了 Flask 服务端代码。

**解决：**
- 将 `dist/` 从 Git 仓库中移除（`git rm --cached dist/`）
- 将 Framework Preset 改为 "Other"
- 使用 `api/index.py` 作为 Vercel serverless function 入口

### 2. pip install 不执行（ModuleNotFoundError: No module named 'markdown'）

**现象：** 每次部署都报 `ModuleNotFoundError`，所有 Python 依赖都未安装。

**原因：** Framework Preset 设为 "Other" 时，Vercel 不会自动运行 `pip install -r requirements.txt`，手动设置的 Install Command 也不生效。

**解决：** 在 `api/` 目录下创建 `requirements.txt`（与根目录内容相同）。Vercel 会自动检测 `api/` 目录下的 Python 函数并安装其目录下的 `requirements.txt`。

### 3. `/api/*` 路由被 Vercel 拦截

**现象：** `/api/comment`、`/api/view` 等路由在 Vercel 上返回 404。

**原因：** Vercel 默认将 `/api/*` 路径映射到 serverless functions 目录，不会转发到 Flask 应用。

**解决：** 将所有 API 路由从 `/api/xxx` 改为 `/xxx`（`/comment`、`/view`），并在 `vercel.json` 的 `routes` 中用 `/(.*)` 将所有请求转发到 `api/index.py`。

### 4. 中文标题文章 404

**现象：** 中文标题的博客文章在首页显示，但点击后 404。

**原因：** 标题完全为中文时，slug 也是纯中文（如 `黑暗中总有一丝光明`），Vercel 的 URL 路由层对纯中文路径处理有兼容问题。

**解决：** 修改 `editor_save()` 中的 slug 生成逻辑——当 slug 不含任何 ASCII 字母时，使用 `md5(title)[:8]` 生成 `post-` 前缀的英文哈希 slug。

### 5. `datetime.utcnow` 已弃用

**现象：** Python 3.12+ 中 `datetime.utcnow()` 产生 DeprecationWarning。

**解决：** 全局替换为 `lambda: datetime.now(timezone.utc)`，使用 timezone-aware datetime。

### 6. `db.create_all()` 每次请求都执行

**现象：** 代码 review 发现 `@app.before_request` 中每个请求都调用 `db.create_all()`，浪费数据库连接。

**解决：** 添加 `_tables_created` 模块级布尔标记，只在第一次请求时执行建表。

### 7. `post_detail` 仍使用文件系统检查

**现象：** 迁移到数据库后，`post_detail` 路由仍检查 `posts/<slug>.md` 是否存在，导致数据库创建的文章 404。

**解决：** 改为 `Post.query.filter_by(slug=slug, is_post=True, status="published").first()` 数据库查询。

### 8. `build.py` 静态生成需要 app context

**现象：** `python build.py` 报 `RuntimeError: Working outside of application context`。

**原因：** `get_posts()` 现在使用 SQLAlchemy 查询，需要 Flask app context。

**解决：** 在 `build.py` 中添加 `from extensions import db` 和 `with app.app_context(): db.create_all()`，并在 `main()` 中用 `with app.app_context()` 包裹数据库查询。
