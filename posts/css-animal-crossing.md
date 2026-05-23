---
title: 用纯 CSS 复刻动物森友会 UI 风格
date: 2026-05-25
tag: 设计
excerpt: 从一个 React 组件库的设计规范翻译成纯 CSS，记录设计 Token 迁移过程。
---

## 起因

这个博客的视觉风格来自 [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)，一个动物森友会风格的 React 组件库。但我的博客是 Flask + Jinja2，没法直接用 React 组件。

于是决定把它的设计规范"翻译"成纯 CSS。

## 设计 Token 迁移

从 DESIGN_PROMPT.md 里提取了所有关键数值：

| Token | 值 | CSS 变量 |
|-------|-----|---------|
| 主背景 | `#f8f8f0` | `--bg-warm` |
| 正文文字 | `#725d42` | `--text-body` |
| 主色调 | `#19c8b9` | `--accent` |
| 按钮圆角 | `50px` | `--radius-btn` |
| 按钮阴影 | `0 5px 0 0 #bdaea0` | Nintendo press 效果 |

## 最难还原的部分

**Nintendo 按钮按压效果：**

```css
.btn {
  box-shadow: 0 5px 0 0 var(--shadow-btn);
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 0 0 var(--shadow-btn);
}
.btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 var(--shadow-btn);
}
```

这种 3D 按下的感觉是所有交互的核心。

## 13 色卡片系统

动森 UI 有 13 种 NookPhone app 颜色。我用 CSS 变量 + 类名实现了：

```css
.card-app-blue  { background: #889df0; }
.card-app-green { background: #8ac68a; }
.card-app-pink  { background: #f8a6b2; }
/* ...共 13 种 */
```

## 心得

从一个成熟的设计系统迁移，比自己从零设计快得多。设计规范（DESIGN_PROMPT.md）里连字体粗细、动画缓动函数、禁用规则都写得清清楚楚——相当于有了设计稿直接切图。

如果你也想给自己的项目复刻某个 UI 风格，强烈建议先找有没有现成的 design token 文档。
