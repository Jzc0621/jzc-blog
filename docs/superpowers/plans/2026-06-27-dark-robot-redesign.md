# Dark Robot Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the blog from Animal Crossing pastel style to dark minimalist modern aesthetic matching the black robot Spline 3D hero.

**Architecture:** Token-level CSS refactor — rewrite `:root` variables, body defaults, then each page template section-by-section. Remove playful elements (icon-wall, fortune widget, island clock, loading screen). Swap fonts. No structural HTML changes to routes or Flask app.

**Tech Stack:** Flask + Jinja2 templates, vanilla CSS, vanilla JS, Inter Google Font, Spline viewer web component.

## Global Constraints

- Dark mode is the default (not opt-in)
- Accent color: `#a3ff4d` (荧光绿), hover: `#beff73`
- Border radius: `4px` (not 20-50px)
- Font: Inter (English) + Noto Sans SC (Chinese, system native), no CDN for Chinese
- Shadows: subtle dark glow, not Nintendo press-down style
- No decorative backgrounds, patterns, or emoji-heavy UI
- Preserve: search, theme toggle, smooth scroll, lightbox, code highlighting, tag filtering, RSS

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `static/css/animal.css` | Modify heavily | Design tokens, body, typography, all component styles |
| `static/js/main.js` | Modify | Remove loading screen, fortune widget, icon wall; change theme default to dark |
| `templates/base.html` | Modify | Fonts, nav items, remove loading screen/fortune/clock widgets |
| `templates/home.html` | Modify | Hero title overlay, remove icon-wall, restyle sections |
| `templates/post.html` | Modify | Code blocks, tags, comment cards |
| `templates/notes.html` | Modify | Note card backgrounds |
| `templates/about.html` | Modify | Text updates (remove Animal Crossing reference), card styles |
| `templates/editor.html` | Modify | Input/button styles, emoji removal |
| `templates/404.html` | Modify | Text updates, emoji removal |

---

### Task 1: Rewrite CSS Design Tokens and Body Reset

**Files:**
- Modify: `static/css/animal.css:1-110` (tokens + body reset section)

**Interfaces:**
- Produces: CSS custom properties consumable by all component styles; dark-by-default body theme with `body.dark` for light mode toggle

- [ ] **Step 1: Rewrite `:root` design tokens**

Replace lines 1-56 in `static/css/animal.css`:

```css
/* ============================================
   Dark Robot — 暗黑极简设计规范
   ============================================ */

/* Google Fonts loaded via <link> in HTML */

/* ---------- Design Tokens ---------- */
:root {
  /* Background */
  --bg-body: #0d0d0d;
  --bg-card: #1a1a1a;
  --bg-warm: #1a1a1a;

  /* Text */
  --text-body: #e0e0e0;
  --text-heading: #ffffff;
  --text-secondary: #666666;
  --text-muted: #555555;
  --text-disabled: #444444;

  /* Border */
  --border-standard: #2a2a2a;
  --border-input: #333333;

  /* Accent — 荧光绿 */
  --accent: #a3ff4d;
  --accent-hover: #beff73;
  --accent-active: #8ce030;

  /* Focus / Status */
  --focus-yellow: #a3ff4d;
  --shadow-btn: none;
  --shadow-input: none;
  --success: #a3ff4d;
  --warning: #ffe500;
  --error: #ff4444;
  --switch-on: #a3ff4d;
  --switch-off: #444444;

  /* Code */
  --code-bg: #111111;
  --code-border: #2a2a2a;
  --code-text: #e0e0e0;

  /* Sidebar */
  --sidebar-active: #2a2a2a;
  --sidebar-hover: #222222;

  /* Shape */
  --radius-btn: 4px;
  --radius-card: 4px;
  --radius-input: 4px;
  --radius-code: 4px;
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Typography */
  --font: Inter, 'Noto Sans SC', -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;

  /* Card palette — monochrome with accent hints */
  --card-default: #1a1a1a;
  --app-pink: #1a1a1a;
  --purple: #1a1a1a;
  --app-blue: #1a1a1a;
  --app-yellow: #1a1a1a;
  --app-orange: #1a1a1a;
  --app-teal: #1a1a1a;
  --app-green: #1a1a1a;
  --app-red: #1a1a1a;
  --lime-green: #1a1a1a;
  --yellow-green: #1a1a1a;
  --brown: #2a2a2a;
  --warm-peach-pink: #1a1a1a;
}
```

- [ ] **Step 2: Rewrite body and base reset**

Replace lines 58-108 in `static/css/animal.css` (body, decorations, links):

```css
/* ---------- Reset & Base ---------- */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html {
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font);
  font-weight: 400;
  background-color: var(--bg-body);
  color: var(--text-body);
  line-height: 1.7;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Light mode overrides (toggled by JS adding .dark class removed) */
body.light {
  --bg-body: #f5f5f5;
  --bg-card: #ffffff;
  --bg-warm: #ffffff;
  --text-body: #1a1a1a;
  --text-heading: #000000;
  --text-secondary: #888888;
  --text-muted: #999999;
  --text-disabled: #bbbbbb;
  --border-standard: #e5e5e5;
  --border-input: #dddddd;
  --code-bg: #f0f0f0;
  --code-border: #e0e0e0;
  --code-text: #1a1a1a;
  --card-default: #ffffff;
}

body.light .nav-bar {
  background: #ffffff;
  border-bottom: 1px solid var(--border-standard);
}

body.light .footer-wave { color: var(--text-secondary); }

a { color: var(--accent); text-decoration: none; font-weight: 500; }
a:hover { color: var(--accent-hover); }
a.internal-link { text-decoration-color: var(--accent); text-underline-offset: 4px; }
a.internal-link:hover { color: var(--accent); text-decoration-style: solid; }

h1, h2, h3, h4, h5, h6 {
  color: var(--text-heading);
  font-weight: 600;
  line-height: 1.3;
}
h1 { font-size: 24px; }
h2 { font-size: 20px; }
h3 { font-size: 17px; }
h4 { font-size: 15px; }
```

- [ ] **Step 3: Remove body decorative pseudo-elements**

Delete `body::before` and `body::after` rules (the leaf silhouette decorations). These are at approximately lines 88-108 in the original file.

- [ ] **Step 4: Update theme JS default to dark**

In `static/js/main.js:4-8`, change the dark mode init to default dark:

```js
(function() {
  var saved = localStorage.getItem('drift-theme');
  // Default to dark; only use light if explicitly saved as light
  if (saved === 'light') {
    document.body.classList.add('light');
  }
  updateToggleIcon();
})();
```

And update `toggleTheme()` at line 14:

```js
function toggleTheme() {
  if (document.body.classList.contains('light')) {
    document.body.classList.remove('light');
    localStorage.setItem('drift-theme', 'dark');
  } else {
    document.body.classList.add('light');
    localStorage.setItem('drift-theme', 'light');
  }
  updateToggleIcon();
}
```

And update `updateToggleIcon()` at line 20:

```js
function updateToggleIcon() {
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = document.body.classList.contains('light') ? '☀️' : '◐';
}
```

- [ ] **Step 5: Commit**

```bash
git add static/css/animal.css static/js/main.js
git commit -m "feat: rewrite design tokens for dark robot theme"
```

---

### Task 2: Swap Google Fonts and Clean Nav

**Files:**
- Modify: `templates/base.html:18-21` (fonts), `templates/base.html:38-65` (nav), `templates/base.html:30-35` (loading screen removal), `templates/base.html:80-92` (fortune + clock removal)

**Interfaces:**
- Consumes: CSS tokens from Task 1
- Produces: Clean nav with only brand, search, theme toggle; footer with RSS only

- [ ] **Step 1: Replace Google Fonts in `<head>`**

Replace lines 18-21 in `templates/base.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" media="print" onload="this.media='all';this.onload=null">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"></noscript>
<script>var f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';document.head.appendChild(f);</script>
```

- [ ] **Step 2: Remove loading screen from body**

Delete lines 30-35 in `templates/base.html` (the entire `<!-- Loading Screen -->` div block).

- [ ] **Step 3: Remove fortune widget and island clock from before `</body>`**

Delete lines 82-92 in `templates/base.html` (the `<!-- Fortune Widget -->` and `<!-- Island Clock -->` div blocks).

- [ ] **Step 4: Remove dice button from nav**

Remove line 61 in `templates/base.html`:
```html
<button class="nav-icon-btn" id="diceBtn" onclick="randomPost()" title="随机一篇文章" aria-label="随机文章">🎲</button>
```

- [ ] **Step 5: Remove search box kbd hint**

Remove the `<kbd>` element from line 52:
```html
<kbd class="search-box-kbd">⌘K</kbd>
```

- [ ] **Step 6: Commit**

```bash
git add templates/base.html
git commit -m "feat: swap fonts to Inter, remove playful widgets from nav"
```

---

### Task 3: Navbar and Search Restyle

**Files:**
- Modify: `static/css/animal.css` (nav, search, footer sections)

**Interfaces:**
- Consumes: CSS tokens from Task 1, cleaned nav HTML from Task 2
- Produces: Minimal dark nav bar with search dropdown restyled

- [ ] **Step 1: Rewrite nav-bar styles**

Find `.nav-bar` and related styles (~lines 138-280). Replace with:

```css
/* ---------- Navbar ---------- */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  background: var(--bg-body);
  border-bottom: 1px solid var(--border-standard);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}
.nav-left { display: flex; align-items: center; gap: 32px; }
.nav-right { display: flex; align-items: center; gap: 8px; }
.nav-brand {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-heading);
  text-decoration: none;
  letter-spacing: 0.04em;
}
.nav-links { display: flex; gap: 4px; }
.nav-link {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-btn);
  transition: color 0.15s, background 0.15s;
  position: relative;
}
.nav-link:hover { color: var(--text-heading); background: var(--bg-card); }
.nav-link.active { color: var(--accent); font-weight: 600; }
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 14px;
  right: 14px;
  height: 1px;
  background: var(--accent);
}

/* Icon buttons */
.nav-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-btn);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  background: transparent;
  transition: color 0.15s, background 0.15s;
}
.nav-icon-btn:hover { color: var(--text-heading); background: var(--bg-card); }
.nav-hamburger { display: none; width: 44px; height: 44px; border: none; background: transparent; font-size: 20px; color: var(--text-secondary); cursor: pointer; }
.nav-hamburger:hover { color: var(--text-heading); }

/* Search box */
.search-box { position: relative; display: flex; align-items: center; }
.search-box-icon { font-size: 14px; color: var(--text-muted); margin-right: 4px; }
.search-box-input {
  border: 1px solid var(--border-input);
  background: var(--bg-card);
  color: var(--text-body);
  padding: 6px 12px;
  border-radius: var(--radius-input);
  font-size: 13px;
  font-family: var(--font);
  width: 180px;
  transition: border-color 0.2s, width 0.2s;
  outline: none;
}
.search-box-input:focus { border-color: var(--accent); width: 240px; }
.search-box-kbd { display: none; }
.search-dropdown { position: absolute; top: 100%; right: 0; margin-top: 4px; width: 360px; max-height: 400px; background: var(--bg-card); border: 1px solid var(--border-standard); border-radius: var(--radius-card); overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.4); display: none; z-index: 200; }
.search-dropdown.active { display: block; }
.search-dropdown-results { padding: 4px; }
.search-dropdown-footer { padding: 8px 12px; font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-standard); display: flex; justify-content: space-between; }
.search-dropdown .search-result-item { padding: 8px 12px; border-radius: var(--radius-btn); cursor: pointer; font-size: 13px; }
.search-dropdown .search-result-item:hover,
.search-dropdown .search-result-item.active { background: var(--sidebar-hover); }
.search-dropdown .search-result-title { font-weight: 600; color: var(--text-heading); }
.search-dropdown .search-result-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* Mobile nav */
@media (max-width: 768px) {
  .nav-bar { padding: 0 16px; }
  .nav-links { display: none; position: absolute; top: 56px; left: 0; right: 0; background: var(--bg-card); flex-direction: column; padding: 8px; border-bottom: 1px solid var(--border-standard); z-index: 99; }
  .nav-links.open { display: flex; }
  .nav-hamburger { display: flex; align-items: center; justify-content: center; }
  .search-box-input { width: 120px; }
  .search-box-input:focus { width: 160px; }
  .search-dropdown { width: 280px; }
}
@media (max-width: 480px) {
  .nav-bar { padding: 0 12px; }
}
```

- [ ] **Step 2: Rewrite footer styles**

Find footer styles (~lines 2004+). Replace with:

```css
/* ---------- Footer ---------- */
.footer-wave {
  max-width: 960px;
  margin: 60px auto 12px;
  padding: 0 20px;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.footer {
  max-width: 960px;
  margin: 0 auto 40px;
  padding: 0 20px;
  font-size: 12px;
  color: var(--text-disabled);
  line-height: 1.8;
}
.footer a { color: var(--text-secondary); font-weight: 500; }
.footer a:hover { color: var(--accent); }
```

- [ ] **Step 3: Restyle back-to-top button (~lines 550+)**

```css
.back-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-standard);
  background: var(--bg-card);
  color: var(--text-secondary);
  border-radius: var(--radius-btn);
  font-size: 16px;
  cursor: pointer;
  display: none;
  transition: color 0.15s, border-color 0.15s;
  align-items: center;
  justify-content: center;
}
.back-to-top:hover { color: var(--accent); border-color: var(--accent); }
.back-to-top.visible { display: flex; }
```

- [ ] **Step 4: Restyle progress bar (~lines 1548+)**

```css
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  z-index: 9999;
  transition: width 0.1s linear;
}
```

- [ ] **Step 5: Remove loading screen CSS (~lines 1548-1592)**

Delete `.loading-screen`, `.loading-screen.hidden`, `.loading-screen-logo`, `.loading-screen-rings`, and related `@keyframes`.

- [ ] **Step 6: Remove fortune/clock CSS (~lines after loading screen)**

Delete fortune widget and island clock CSS blocks.

- [ ] **Step 7: Commit**

```bash
git add static/css/animal.css
git commit -m "feat: restyle nav, footer, back-to-top for dark robot theme"
```

---

### Task 4: Homepage Hero Overlay and Sections

**Files:**
- Modify: `templates/home.html` (hero, statement, icon-wall removal, posts, notes, cta)
- Modify: `static/css/animal.css` (hero, statement, posts, notes, cta sections)

**Interfaces:**
- Consumes: CSS tokens from Task 1, nav from Task 3
- Produces: Redesigned homepage with hero title overlay, minimal cards, no icon-wall

- [ ] **Step 1: Add hero title overlay to home.html**

Replace the hero section (lines 5-14) in `templates/home.html`:

```html
<!-- Hero: Spline 3D model -->
<section class="hm-hero" id="heroStage">
  <spline-viewer
    url="https://prod.spline.design/b3T4jfkrqn7ZfEQ2/scene.splinecode"
    class="hm-hero-spline">
  </spline-viewer>
  <div class="hm-hero-overlay">
    <h1 class="hm-hero-title">DRIFT</h1>
    <p class="hm-hero-subtitle">写点技术笔记，记些生活碎片</p>
  </div>
</section>
```

- [ ] **Step 2: Rewrite hero CSS**

In `static/css/animal.css`, replace `.hm-hero` block (~lines 1767-1797):

```css
/* ---------- Hero ---------- */
.hm-hero {
  border-radius: 0;
  position: relative;
  margin: 0 0 2px;
  overflow: hidden;
  background: var(--bg-body);
  height: 85vh;
  min-height: 500px;
}

.hm-hero-spline {
  position: absolute;
  inset: 0;
  border: none;
}

.hm-hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
  padding: 0 24px;
}

.hm-hero-title {
  font-family: var(--font);
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.08em;
  text-align: center;
  mix-blend-mode: difference;
  text-shadow: 0 0 40px rgba(0,0,0,0.5);
  line-height: 1;
}

.hm-hero-subtitle {
  font-family: var(--font);
  font-size: clamp(14px, 1.5vw, 18px);
  font-weight: 400;
  color: var(--text-secondary);
  letter-spacing: 0.06em;
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .hm-hero { height: 60vh; min-height: 350px; }
  .hm-hero-title { font-size: clamp(36px, 12vw, 56px); }
}
@media (max-width: 480px) {
  .hm-hero { height: 50vh; min-height: 280px; }
}
```

- [ ] **Step 3: Remove icon-wall from home.html**

Delete lines 25-45 in `templates/home.html` (the `<!-- Icon Wall -->` div block).

- [ ] **Step 4: Rewrite statement section CSS**

```css
/* ---------- Statement ---------- */
.hm-statement {
  background: var(--bg-card);
  margin: 0 0 2px;
  border-radius: 0;
}
.hm-statement-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: clamp(60px, 8vw, 100px) 24px;
}
.hm-statement-text {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.03em;
  color: var(--text-heading);
}
```

- [ ] **Step 5: Rewrite posts section CSS**

```css
/* ---------- Posts Section ---------- */
.hm-posts {
  background: var(--bg-card);
  margin: 0 0 2px;
  border-radius: 0;
}
.hm-posts-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: clamp(48px, 6vw, 80px) 24px;
}
.hm-posts-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 40px;
}
.hm-section-title {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 700;
  color: var(--text-heading);
  letter-spacing: 0.04em;
  margin-bottom: 0;
}
.hm-posts-body { /* grid handled below */ }
.hm-posts-grid { display: flex; flex-direction: column; gap: 0; }
.hm-post-card {
  display: block;
  padding: 28px 0 28px 16px;
  text-decoration: none;
  color: inherit;
  border-left: 2px solid var(--border-standard);
  border-bottom: 1px solid var(--border-standard);
  transition: border-left-color 0.2s, padding 0.2s;
  position: relative;
}
.hm-post-card:first-child { border-top: 1px solid var(--border-standard); }
.hm-post-card:hover { border-left-color: var(--accent); padding-left: 24px; }
.hm-post-card-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.hm-post-card-title {
  font-size: clamp(18px, 2vw, 22px);
  font-weight: 600;
  color: var(--text-heading);
  line-height: 1.4;
  margin-bottom: 4px;
}
.hm-post-card-excerpt {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 8px;
}
.hm-post-card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

/* Tag filter */
.tag-filter { display: flex; gap: 8px; flex-wrap: wrap; }
.tag-filter-btn {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 4px 12px;
  border: 1px solid var(--border-standard);
  border-radius: var(--radius-btn);
  transition: all 0.15s;
}
.tag-filter-btn:hover { color: var(--text-heading); border-color: var(--text-secondary); }
.tag-filter-btn.active { color: var(--accent); border-color: var(--accent); background: rgba(163, 255, 77, 0.05); }

.hm-empty { text-align: center; padding: 80px 20px; color: var(--text-secondary); font-size: 16px; }
```

- [ ] **Step 6: Rewrite notes section CSS (homepage)**

```css
/* ---------- Notes Section ---------- */
.hm-notes {
  background: var(--bg-card);
  margin: 0 0 2px;
  border-radius: 0;
}
.hm-notes-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: clamp(48px, 6vw, 80px) 24px;
}
.hm-notes-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}
.hm-more-link { font-size: 13px; font-weight: 500; color: var(--accent); text-decoration: none; }
.hm-more-link:hover { color: var(--accent-hover); }
.hm-notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.hm-note-card {
  padding: 20px;
  border-radius: var(--radius-card);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-body);
  background: var(--bg-body);
  border-left: 3px solid var(--border-standard);
}
.hm-note-date { font-size: 11px; color: var(--text-muted); margin-top: 8px; }
```

- [ ] **Step 7: Rewrite CTA section CSS**

```css
/* ---------- CTA ---------- */
.hm-cta {
  background: var(--bg-card);
  margin: 0 0 2px;
  border-radius: 0;
}
.hm-cta-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: clamp(48px, 6vw, 80px) 24px;
  text-align: center;
}
.hm-cta-text {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 700;
  color: var(--text-heading);
  margin-bottom: 28px;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 8: Rewrite button styles (~lines 288-330)**

```css
/* ---------- Button ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font);
  border: 1px solid var(--border-standard);
  background: var(--bg-card);
  color: var(--text-body);
  border-radius: var(--radius-btn);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: none;
}
.btn:hover { border-color: var(--accent); color: var(--accent); transform: none; box-shadow: none; }
.btn:active { transform: none; box-shadow: none; }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-primary { background: var(--accent); color: #0d0d0d; border-color: var(--accent); font-weight: 600; box-shadow: none; }
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); color: #0d0d0d; box-shadow: none; }
.btn-primary:active { background: var(--accent-active); box-shadow: none; }
.btn-sm { height: 28px; padding: 0 12px; font-size: 11px; border-radius: var(--radius-btn); }
.btn-lg { height: 48px; padding: 0 28px; font-size: 15px; border-radius: var(--radius-btn); }
```

- [ ] **Step 9: Rewrite input/select/textarea styles (~lines 370-435)**

```css
/* ---------- Input ---------- */
.input {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-family: var(--font);
  background: var(--bg-body);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-input);
  color: var(--text-body);
  box-shadow: none;
  transition: border-color 0.2s;
  outline: none;
}
.input:hover { border-color: var(--text-muted); }
.input:focus { border-color: var(--accent); box-shadow: none; }
.input-lg { height: 48px; padding: 0 18px; font-size: 15px; }
.input-sm { height: 32px; padding: 0 12px; font-size: 12px; }

.textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  font-family: var(--font);
  background: var(--bg-body);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-input);
  color: var(--text-body);
  resize: vertical;
  min-height: 200px;
  box-shadow: none;
  transition: border-color 0.2s;
  outline: none;
  line-height: 1.7;
}
.textarea:focus { border-color: var(--accent); box-shadow: none; }

.select {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-family: var(--font);
  background: var(--bg-body);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-input);
  color: var(--text-body);
  box-shadow: none;
  cursor: pointer;
  outline: none;
}
.select:focus { border-color: var(--accent); box-shadow: none; }
```

- [ ] **Step 10: Rewrite tag badge CSS (~lines 436-443)**

```css
.tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  letter-spacing: 0.04em;
  padding: 2px 0;
}
```

- [ ] **Step 11: Remove icon-wall CSS (~lines 1656-1685)**

Delete `.icon-wall`, `.icon-wall-track`, `.icon-wall-item`, and the `@keyframes iconScroll` block.

- [ ] **Step 12: Remove clip-reveal animation CSS (~lines 1594-1604)**

```css
/* Remove these: .clip-reveal, .clip-reveal.revealed, .clip-reveal-delay-* */
```

Keep stagger-reveal for post cards and note cards.

- [ ] **Step 13: Rewrite reveal animation CSS**

Replace the stagger-reveal rules (~lines 1688-1701):

```css
.stagger-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.stagger-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 14: Commit**

```bash
git add templates/home.html static/css/animal.css
git commit -m "feat: redesign homepage hero, posts, notes, cta for dark robot theme"
```

---

### Task 5: Post Detail Page and Code Blocks

**Files:**
- Modify: `templates/post.html` (code blocks, tag, comments)
- Modify: `static/css/animal.css` (code block, card, divider, article layout styles)

**Interfaces:**
- Consumes: CSS tokens from Task 1, global styles from Tasks 3-4
- Produces: Dark-themed article page with restyled code blocks

- [ ] **Step 1: Update post.html tag and heading**

Change line 13 in `templates/post.html` — remove clip-reveal from title, update tag style:

```html
<div class="tag mb-12">#{{ post.tag }}</div>
<h1 style="display:inline-block;">{{ post.title }}</h1>
```

- [ ] **Step 2: Update comment card style in post.html JS (~line 91)**

Change `var(--card-bg)` to `var(--bg-card)` and border-radius to `var(--radius-card)`:

```html
'<div class="comment-item" style="margin-bottom:16px;padding:12px;background:var(--bg-body);border-radius:var(--radius-card);border:1px solid var(--border-standard);">' +
```

- [ ] **Step 3: Rewrite code block CSS (~lines 445-470)**

```css
.code-block-wrap {
  position: relative;
  margin: 24px 0;
  border-radius: var(--radius-code);
  overflow: hidden;
  border: 1px solid var(--code-border);
  background: var(--code-bg);
}
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--code-border);
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}
.code-block-wrap pre { margin: 0; padding: 16px; overflow-x: auto; }
.code-block-wrap code {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--code-text);
}

:not(.code-block) > code {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  border: 1px solid var(--code-border);
}
```

- [ ] **Step 4: Rewrite article layout and card CSS**

```css
/* ---------- Article Layout ---------- */
.mt-20 { margin-top: 20px; }
.mt-32 { margin-top: 32px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.flex-row { display: flex; align-items: center; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-12 { gap: 12px; }

.post-layout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 40px;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
}
.article-body { min-width: 0; }
.article-body h2 { font-size: 22px; margin: 40px 0 12px; }
.article-body h3 { font-size: 18px; margin: 32px 0 8px; }
.article-body p { margin: 12px 0; line-height: 1.8; }
.article-body ul, .article-body ol { margin: 12px 0; padding-left: 24px; }
.article-body li { margin: 6px 0; }
.article-body blockquote {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 3px solid var(--accent);
  background: var(--bg-body);
  border-radius: 0 var(--radius-card) var(--radius-card) 0;
  font-style: italic;
  color: var(--text-secondary);
}
.article-body img { max-width: 100%; border-radius: var(--radius-card); margin: 16px 0; }
.article-body hr { border: none; border-top: 1px solid var(--border-standard); margin: 32px 0; }

@media (max-width: 768px) {
  .post-layout { grid-template-columns: 1fr; }
}

.toc-sidebar { position: relative; }
.toc-sticky { position: sticky; top: 72px; }
.toc-content { font-size: 13px; }
.toc-content ul { list-style: none; padding-left: 0; }
.toc-content li { margin: 6px 0; }
.toc-content a { color: var(--text-secondary); text-decoration: none; }
.toc-content a:hover { color: var(--accent); }

/* Card */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-standard);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: none;
}
.card:hover { transform: none; box-shadow: none; }
.card-clickable { cursor: pointer; }
.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-heading);
}

/* Dividers */
.divider { height: 1px; background: var(--border-standard); margin: 24px 0; border: none; border-radius: 0; }
.divider-teal { background: var(--accent); opacity: 0.3; }
.divider-brown { background: var(--border-standard); }
.divider-yellow { background: var(--accent); opacity: 0.2; }

/* Post meta */
.post-meta { display: flex; gap: 16px; flex-wrap: wrap; color: var(--text-muted); font-size: 12px; }

/* Comment section */
.comment-section { margin-bottom: 60px; }
.comment-item {
  margin-bottom: 12px;
  padding: 16px;
  background: var(--bg-body);
  border: 1px solid var(--border-standard);
  border-radius: var(--radius-card);
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-heading);
  margin: 16px 0;
}

/* Page header */
.page-header { text-align: center; padding: 40px 20px 20px; }
.page-header h1 { font-weight: 700; letter-spacing: 0.04em; }
.subtitle { color: var(--text-secondary); font-size: 15px; margin-top: 8px; }

.text-center { text-align: center; }
.text-muted { color: var(--text-muted); font-size: 13px; }
.mt-24 { margin-top: 24px; }
.mb-40 { margin-bottom: 40px; }
```

- [ ] **Step 5: Commit**

```bash
git add templates/post.html static/css/animal.css
git commit -m "feat: redesign post detail page and code blocks for dark theme"
```

---

### Task 6: Notes, About, Editor, and 404 Pages

**Files:**
- Modify: `templates/notes.html` (card styles)
- Modify: `templates/about.html` (text + styles)
- Modify: `templates/editor.html` (emoji removal)
- Modify: `templates/404.html` (text + emoji removal)
- Modify: `static/css/animal.css` (notes card, avatar circle, note-card styles)

**Interfaces:**
- Consumes: All previous tasks
- Produces: All remaining pages in dark robot style

- [ ] **Step 1: Update notes.html card background**

Change line 15 in `templates/notes.html` from pastel color to border-left accent:

```html
<div class="note-card" style="border-left: 3px solid var(--accent);">
```

- [ ] **Step 2: Update note-card CSS (~current styles)**

```css
.note-card {
  background: var(--bg-body);
  border: 1px solid var(--border-standard);
  border-radius: var(--radius-card);
  padding: 20px;
  margin-bottom: 12px;
  color: var(--text-body);
  transition: border-color 0.2s;
}
.note-card:hover { border-color: var(--text-muted); }
.note-date { font-size: 11px; color: var(--text-muted); }
```

- [ ] **Step 3: Update avatar circle CSS (~current styles)**

```css
.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-body);
  border: 2px solid var(--border-standard);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 32px;
}
```

- [ ] **Step 4: Update about.html text**

Remove the Animal Crossing reference (lines 25-27) and update:

```html
<p>
  DRIFT 是一个暗黑极简风格的个人博客，简约、克制、专注于文字。
</p>

<p>
  博客本身用 <b>Flask + Markdown + 纯 CSS</b> 搭建，没有数据库，没有登录系统。
  文章以 Markdown 文件存储，写就完了。
</p>
```

- [ ] **Step 5: Update 404.html**

Replace emoji and Animal Crossing references with minimal text:

```html
{% extends "base.html" %}
{% block title %}404 — DRIFT{% endblock %}
{% block content %}

<div class="page-header" style="padding-top:60px;">
  <h1>404</h1>
  <p class="subtitle">页面不存在</p>
</div>

<div class="divider divider-teal"></div>

<div class="card" style="max-width:500px;margin:0 auto;text-align:center;">
  <p style="margin-bottom:16px;color:var(--text-secondary);">这个地址没有对应内容，可能已被移除或从未存在。</p>
  <div class="flex-row gap-12" style="justify-content:center;flex-wrap:wrap;">
    <a href="/" class="btn btn-primary">回到首页</a>
    <a href="/notes" class="btn">便签</a>
    <a href="/about" class="btn">关于</a>
  </div>
</div>

{% endblock %}
```

- [ ] **Step 6: Update editor.html emoji**

Remove island emoji on login gate (line 14): replace `🏝️` with a text label "DRIFT 后台".

- [ ] **Step 7: Commit**

```bash
git add templates/notes.html templates/about.html templates/editor.html templates/404.html static/css/animal.css
git commit -m "feat: finish dark robot redesign for notes, about, editor, 404 pages"
```

---

### Task 7: JS Cleanup and Container Layout Fix

**Files:**
- Modify: `static/js/main.js` (remove loading screen, fortune, icon wall JS)

**Interfaces:**
- Consumes: Template changes from previous tasks (removed HTML elements)
- Produces: Clean JS with no dead code references

- [ ] **Step 1: Remove loading screen JS (lines 84-122)**

Delete the entire `// Loading Screen` IIFE module.

- [ ] **Step 2: Remove fortune widget JS (lines 211+)**

Delete `function drawFortune()` and related code.

- [ ] **Step 3: Remove icon wall JS (lines 592-601)**

Delete `function initIconWall()` and its calls in init blocks (lines 612, 631).

- [ ] **Step 4: Remove initReveal/observeReveal calls for clip-reveal**

Update `initReveal()` to remove clip-reveal logic (line 471-475), keep only stagger-reveal:

```js
function initReveal() {
  document.querySelectorAll('.post-card').forEach(function(el, i) {
    if (!el.classList.contains('stagger-reveal')) {
      el.classList.add('stagger-reveal');
    }
  });
  document.querySelectorAll('.note-card').forEach(function(el) {
    if (!el.classList.contains('stagger-reveal')) {
      el.classList.add('stagger-reveal');
    }
  });
}
```

- [ ] **Step 5: Update container layout CSS**

Replace the `.container` override (~lines 1754-1764) with:

```css
/* ---------- Container ---------- */
.container {
  max-width: 100%;
  padding: 0;
}
.container > *:not(.hm-hero):not(.hm-statement):not(.hm-posts):not(.hm-notes):not(.hm-cta):not(.divider):not(.page-header):not(.card):not(.post-layout):not(.flex-between):not(.comment-section):not(.nav-bar):not(.footer-wave):not(.footer):not(.mt-20):not(script) {
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 20px;
  padding-right: 20px;
}
```

- [ ] **Step 6: Commit**

```bash
git add static/js/main.js static/css/animal.css
git commit -m "chore: remove dead JS and update container layout"
```

---

### Task 8: Build, Verify, and Deploy

**Files:**
- No file changes, build + verification only

**Interfaces:**
- Consumes: All previous tasks
- Produces: Deployed site at https://www.jiazhichao.xyz

- [ ] **Step 1: Build static site**

```bash
python build.py
```

Verify build succeeds with no errors.

- [ ] **Step 2: Check built output**

```bash
grep -l "Inter" dist/index.html dist/post/*/index.html dist/notes/index.html dist/about/index.html
```

Verify Inter font link is present.

- [ ] **Step 3: Verify no old tokens remain**

```bash
grep -r "Nunito\|Zen Maru\|18c8b9\|725d42\|e8f0e0\|f7f3df\|icon-wall\|fortune\|island-clock\|loading-screen\|ring-outer\|ring-inner\|ring-mid" dist/ || echo "Clean — no old tokens found"
```

- [ ] **Step 4: Push and deploy**

```bash
git push
```

Wait for GitHub Actions deploy to gh-pages.

- [ ] **Step 5: Verify live site**

Open https://www.jiazhichao.xyz and check:
- Dark background with Inter font
- Hero shows title overlay on spline model
- No icon wall, fortune widget, or island clock
- Posts cards have left accent border
- Code blocks are dark themed
- Theme toggle switches to light mode

- [ ] **Step 6: Commit any fixes if needed**
