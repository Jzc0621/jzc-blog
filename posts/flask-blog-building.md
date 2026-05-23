---
title: 从零搭建一个零数据库博客
date: 2026-05-18
tag: 技术
excerpt: 不用 WordPress、不用数据库，用 Flask + Markdown 搭一个完全属于自己的博客。
---

## 为什么不用 WordPress

WordPress 很强大，但对我来说太重了。我需要的是：

- 用 Markdown 写文章，而不是富文本编辑器
- 不需要数据库备份
- 版本管理用 Git
- 页面加载快，不依赖几十个插件

Flask + Markdown 完美满足这四点。

## 核心思路

整个博客只有三个核心文件：

```python
# app.py — 不到 100 行
from flask import Flask, render_template
import markdown, frontmatter
from pathlib import Path

app = Flask(__name__)

@app.route("/")
def home():
    posts = []  # 从 posts/ 目录读取 .md 文件
    return render_template("home.html", posts=posts)

@app.route("/post/<slug>")
def post(slug):
    # 读取对应 .md，转 HTML，渲染模板
    ...
```

## Markdown 文件即文章

每篇文章就是一个 `.md` 文件，放在 `posts/` 目录：

```markdown
---
title: 文章标题
date: 2026-05-18
tag: 技术
---

正文内容...
```

YAML 头部存元数据，正文就是 Markdown。

## 部署到 GitHub Pages

用我写的 `build.py` 一键把 Flask 渲染成静态 HTML，推送到 `gh-pages` 分支，GitHub Pages 自动托管。

整个过程：
1. 写完 `.md` 文件
2. `python build.py`
3. `git push`
4. 网站更新

## 总结

零数据库博客的优点：快、简单、可 Git 追踪、部署免费。缺点：没有评论系统（但可以加 Giscus）。

适合想完全掌控自己内容的人。
