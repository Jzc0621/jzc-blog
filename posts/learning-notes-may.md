---
title: 五月的学习笔记碎片
date: 2026-05-23
tag: 随笔
excerpt: 零零散散学到的东西，不成篇但值得记下来。
---

## 关于 async/await

之前一直以为 `async` 会让代码变快，其实不会。它只是让等待不阻塞其他任务。就像厨房里多线程做饭——菜不会熟得更快，但所有菜差不多同时出锅。

## Flask 模板里的全局变量

`app.jinja_env.globals["foo"] = bar` 可以在所有模板里直接访问 `{{ foo }}`。比每次都传 `render_template("x.html", foo=bar)` 方便太多。

## CSS 的 `object-fit: cover`

以前处理图片变形总是裁切后再上传，现在知道了 `object-fit: cover` 配合固定宽高容器就行。浏览器端裁切，省事。

## 发现的一个好习惯

写 Markdown 的时候，每写完一个段落就 `Ctrl+S`（保存）。不是怕丢数据，是保存的物理动作给了大脑一个"这段写完了"的信号，有助于保持节奏。

## 关于代码注释

最好的注释不是解释代码在做什么（代码本身应该能说明），而是解释为什么这么做。比如：

```python
# 别碰这里的排序逻辑——和前端的分页耦合了
# 改之前先看 PR #42 的讨论
data.sort(key=lambda x: x["date"], reverse=True)
```

这种注释比 `# 按日期降序排序` 有价值一百倍。

## 其他

- GitHub Actions 的 YAML 缩进报错时先检查是不是 Tab 和空格混用
- Windows 下的 Git 自动换行 LF/CRLF 是个老坑，`.gitattributes` 比全局设置靠谱
- 深夜不要动 CSS，你会把 `padding` 和 `margin` 搞反
