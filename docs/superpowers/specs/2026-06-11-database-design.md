# 博客数据库化设计文档

**日期：** 2026-06-11  
**目标：** 添加 PostgreSQL 数据库，实现评论系统、页面阅读统计、在线编辑器持久化

---

## 1. 数据库表设计

### posts

| 列 | 类型 | 约束 |
|---|---|---|
| id | Integer | PK, auto-increment |
| slug | String(200) | UNIQUE, NOT NULL |
| title | String(200) | NOT NULL |
| content | Text | NOT NULL |
| excerpt | String(500) | |
| tag | String(50) | default "未分类" |
| is_post | Boolean | default True（True=文章, False=笔记） |
| status | String(20) | default "published"（published/draft） |
| created_at | DateTime | auto |
| updated_at | DateTime | auto |

### comments

| 列 | 类型 | 约束 |
|---|---|---|
| id | Integer | PK |
| post_id | Integer | FK→ posts.id, ON DELETE CASCADE |
| author_name | String(50) | NOT NULL |
| content | Text | NOT NULL |
| created_at | DateTime | auto |

### page_views

| 列 | 类型 | 约束 |
|---|---|---|
| id | Integer | PK |
| post_slug | String(200) | UNIQUE |
| count | Integer | default 0 |
| last_updated | DateTime | auto |

---

## 2. 架构

```
Vercel (Flask) ──── Neon PostgreSQL (数据库)
    │
    ├── 页面渲染 ──→ 读取 DB
    ├── 在线编辑器 ──→ 写入 DB
    ├── 评论 API ──→ 读写 DB
    └── 阅读统计 ──→ 写入 DB

GitHub Actions (build.py) ──→ 读取 DB ──→ 生成 dist/ ──→ GitHub Pages
```

核心原则：**数据库是唯一数据源**。本地 `posts/*.md` 降级为草稿/备份文件，通过 `migrate.py` 一次性导入。

---

## 3. 文件变更

### 新增
- `config.py` — 环境变量读取 DATABASE_URL
- `extensions.py` — SQLAlchemy(db) 单例
- `models.py` — Post, Comment, PageView 模型
- `migrate.py` — 将现有 posts/*.md 和 notes/*.md 导入数据库

### 修改
- `app.py` — get_posts/get_notes 改为查 DB；editor/save 写 DB；新增 /comment 和 /view/<slug> 路由
- `build.py` — 基本不改（Flask test client 自动走 DB 数据源）
- `requirements.txt` — 增加 flask-sqlalchemy, psycopg2-binary

### 删除
- 无（posts/ 和 notes/ 目录保留作为备份和导入源）

---

## 4. 新增 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/comment` | POST | 提交评论 `{slug, author_name, content}` |
| `/api/comment/<slug>` | GET | 获取某文章评论列表 |
| `/api/view/<slug>` | POST | 记录一次页面阅读 |

---

## 5. 部署步骤

1. 注册 Neon（neon.tech），创建数据库
2. 获取 DATABASE_URL 连接字符串
3. 在 Vercel 项目设置中添加环境变量 `DATABASE_URL`
4. 运行 `migrate.py` 导入现有文章
5. `git push` 触发 Vercel 自动部署

---

## 6. 实现顺序

1. 安装依赖，创建 config.py / extensions.py / models.py
2. 改写 app.py 的 get_posts() / get_notes() 为数据库查询
3. 改写 /editor/save 为数据库写入
4. 添加评论和阅读量路由 + 模板展示
5. 编写 migrate.py 导入现有文章
6. 本地测试全流程
7. 部署到 Vercel + Neon
