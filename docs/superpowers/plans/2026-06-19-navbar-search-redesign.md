# Navbar & Search Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace capsule-style navbar and modal search overlay with a clean, full-width minimal professional navbar with inline dropdown search.

**Architecture:** Pure CSS + vanilla JS changes to 3 existing files. No backend changes. Navbar HTML restructured in base.html, CSS rewritten for nav/search components, JS updated for dropdown search and mobile nav.

**Tech Stack:** Flask, Jinja2, vanilla CSS/JS

## Global Constraints

- No new dependencies or libraries
- Dark mode must work with existing `body.dark` class
- Mobile responsive at breakpoints 768px and 480px
- Ctrl+K keyboard shortcut must still open search
- Existing features preserved: theme toggle, random dice, RSS, clock, fortune, visitors

---

## File Map

| File | Role |
|------|------|
| `templates/base.html` | Navbar HTML structure + search dropdown markup |
| `static/css/animal.css` | All nav/search/dropdown styles, mobile responsive |
| `static/js/main.js` | Search open/close/execute, active link detection, mobile nav toggle |

---

### Task 1: Update base.html — navbar structure + search dropdown

**Files:** Modify `templates/base.html`

- [ ] **Step 1: Replace nav-bar HTML (lines 38-50)**

Replace the capsule nav with full-width layout:

```html
<nav class="nav-bar" id="navBar">
  <div class="nav-left">
    <a href="/" class="nav-brand">DRIFT</a>
    <div class="nav-links" id="navLinks">
      <a href="/" class="nav-link">文章</a>
      <a href="/notes" class="nav-link">便签</a>
      <a href="/editor" class="nav-link">写文章</a>
      <a href="/about" class="nav-link">关于</a>
    </div>
  </div>
  <div class="nav-right">
    <div class="search-box" id="searchBox">
      <span class="search-box-icon">🔍</span>
      <input class="search-box-input" id="searchInput" placeholder="搜索文章..." autocomplete="off">
      <kbd class="search-box-kbd">⌘K</kbd>
      <div class="search-dropdown" id="searchDropdown">
        <div class="search-dropdown-results" id="searchResults"></div>
        <div class="search-dropdown-footer">
          <span>↑↓ 导航</span><span>↩ 打开</span><span>Esc 关闭</span>
        </div>
      </div>
    </div>
    <button class="nav-icon-btn" id="themeToggle" onclick="toggleTheme()" title="切换暗色模式" aria-label="切换暗色模式">🌙</button>
    <button class="nav-icon-btn" id="diceBtn" onclick="randomPost()" title="随机一篇文章" aria-label="随机文章">🎲</button>
    <button class="nav-hamburger" onclick="toggleMobileNav()" aria-label="菜单">☰</button>
  </div>
</nav>
```

- [ ] **Step 2: Remove search overlay HTML (lines 80-90)**

Remove the entire `<!-- Search overlay -->` block including `<div class="search-overlay" id="searchOverlay">` through its closing `</div>`.

- [ ] **Step 3: Verify HTML has no syntax errors**

Run: `python -c "from jinja2 import Environment; env=Environment(); env.parse(open('templates/base.html').read()); print('OK')"`
Expected: `OK` printed, no parse errors.

- [ ] **Step 4: Commit**

```bash
git add templates/base.html
git commit -m "feat: restructure navbar HTML for minimal professional design"
```

---

### Task 2: Rewrite navbar + search CSS

**Files:** Modify `static/css/animal.css`

- [ ] **Step 1: Replace old nav CSS (lines 138-218)**

Replace from `/* ---------- Navigation Bar (capsule) ---------- */` through the closing `}` of the `@media (max-width: 480px)` nav block with new minimal nav styles.

```css
/* ---------- Navigation Bar ---------- */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-brand {
  font-size: 17px;
  font-weight: 800;
  color: #111;
  text-decoration: none;
  letter-spacing: 0.01em;
}
.nav-links {
  display: flex;
  gap: 4px;
}
.nav-link {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  position: relative;
}
.nav-link:hover {
  color: #111;
  background: #f3f4f6;
}
.nav-link.active {
  color: #111;
  font-weight: 600;
}
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: #111;
  border-radius: 1px;
}

/* Icon buttons */
.nav-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  color: #666;
}
.nav-icon-btn:hover {
  background: #f3f4f6;
}

/* Hamburger (mobile) */
.nav-hamburger {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.nav-hamburger:hover {
  background: #f3f4f6;
}

/* Mobile nav */
@media (max-width: 768px) {
  .nav-bar {
    padding: 0 16px;
  }
  .nav-left {
    gap: 16px;
  }
  .nav-links {
    display: none;
  }
  .nav-links.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    padding: 8px 16px;
    gap: 2px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  .nav-links.open .nav-link {
    padding: 10px 14px;
    border-radius: 8px;
  }
  .nav-hamburger {
    display: inline-flex;
  }
}

@media (max-width: 480px) {
  .nav-bar {
    padding: 0 12px;
  }
  .nav-brand {
    font-size: 15px;
  }
}
```

- [ ] **Step 2: Replace search CSS (lines 843-889)**

Replace the `/* ---------- Search ---------- */` block through `.search-result-item:hover` with dropdown search styles.

```css
/* ---------- Search Box ---------- */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-box-icon {
  position: absolute;
  left: 12px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}
.search-box-input {
  width: 180px;
  height: 36px;
  padding: 0 12px 0 34px;
  font-family: var(--font);
  font-size: 13px;
  color: #333;
  background: #f3f4f6;
  border: 1px solid transparent;
  border-radius: 8px;
  outline: none;
  transition: all 0.15s;
}
.search-box-input::placeholder {
  color: #999;
}
.search-box-input:focus {
  background: #fff;
  border-color: #111;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
  width: 260px;
}
.search-box-kbd {
  position: absolute;
  right: 8px;
  padding: 2px 5px;
  font-family: var(--font);
  font-size: 10px;
  color: #999;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  pointer-events: none;
  transition: opacity 0.15s;
}
.search-box-input:focus ~ .search-box-kbd {
  opacity: 0;
}

/* ---------- Search Dropdown ---------- */
.search-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  min-width: 320px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  z-index: 200;
}
.search-dropdown.open {
  display: block;
}
.search-dropdown-results {
  max-height: 320px;
  overflow-y: auto;
}
.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 13px;
  color: #333;
  text-decoration: none;
  transition: background 0.1s;
  border-bottom: 1px solid #f5f5f5;
}
.search-result-item:last-child {
  border-bottom: none;
}
.search-result-item:hover,
.search-result-item.active {
  background: #f3f4f6;
}
.search-result-item .result-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
}
.search-result-item .result-title {
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-result-item .result-date {
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
}
.search-dropdown-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: #999;
}
.search-dropdown-footer {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 10px;
  color: #bbb;
}

/* ---------- Dark Mode: Navbar & Search ---------- */
body.dark .nav-bar {
  background: #1a1a2e;
  border-bottom-color: #2a2a4a;
}
body.dark .nav-brand {
  color: #d8d8e8;
}
body.dark .nav-link {
  color: #9090a8;
}
body.dark .nav-link:hover {
  color: #d8d8e8;
  background: rgba(255,255,255,0.06);
}
body.dark .nav-link.active {
  color: #d8d8e8;
}
body.dark .nav-link.active::after {
  background: #d8d8e8;
}
body.dark .nav-icon-btn {
  color: #9090a8;
}
body.dark .nav-icon-btn:hover {
  background: rgba(255,255,255,0.08);
}
body.dark .nav-hamburger {
  color: #9090a8;
}
body.dark .nav-hamburger:hover {
  background: rgba(255,255,255,0.08);
}
body.dark .search-box-input {
  background: rgba(255,255,255,0.06);
  color: #c8c8d8;
}
body.dark .search-box-input::placeholder {
  color: #606080;
}
body.dark .search-box-input:focus {
  background: #1a1a2e;
  border-color: #4a4a6a;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.04);
}
body.dark .search-box-kbd {
  background: rgba(255,255,255,0.06);
  border-color: #3a3a5a;
  color: #606080;
}
body.dark .search-dropdown {
  background: #252540;
  border-color: #4a4a6a;
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}
body.dark .search-result-item {
  color: #c8c8d8;
  border-bottom-color: rgba(255,255,255,0.05);
}
body.dark .search-result-item:hover,
body.dark .search-result-item.active {
  background: rgba(255,255,255,0.06);
}
body.dark .search-result-item .result-date {
  color: #606080;
}
body.dark .search-dropdown-footer {
  border-top-color: rgba(255,255,255,0.05);
  color: #606080;
}

/* Mobile: search full-width */
@media (max-width: 768px) {
  .search-box-input {
    width: 140px;
  }
  .search-box-input:focus {
    width: 200px;
  }
  .search-dropdown {
    min-width: 280px;
  }
}
@media (max-width: 480px) {
  .search-box-input {
    width: 120px;
    font-size: 12px;
  }
  .search-box-input:focus {
    width: 160px;
  }
  .search-box-kbd {
    display: none;
  }
  .search-dropdown {
    position: fixed;
    top: 56px;
    left: 8px;
    right: 8px;
    min-width: auto;
    border-radius: 12px;
  }
}
```

- [ ] **Step 3: Remove stale .search-overlay and .search-trigger styles**

Search for `.search-overlay`, `.search-modal`, `.search-trigger` in animal.css and remove leftover blocks. The old search-trigger block (`.search-trigger { cursor: pointer; ... }`) and the old overlay block (`.search-overlay { position: fixed; ... }`) should be gone from the replacements above; verify no orphaned styles remain.

- [ ] **Step 4: Commit**

```bash
git add static/css/animal.css
git commit -m "feat: rewrite navbar and search CSS for minimal professional design"
```

---

### Task 3: Rewrite search + mobile nav JS

**Files:** Modify `static/js/main.js`

- [ ] **Step 1: Replace search functions (lines 238-308)**

Replace `openSearch()` through the end of `doSearch()` with dropdown-based search including keyboard navigation:

```javascript
// ═══════════════════════════════════════════
// Search (dropdown style)
// ═══════════════════════════════════════════
var searchInput = document.getElementById('searchInput');
var searchDropdown = document.getElementById('searchDropdown');
var searchResults = document.getElementById('searchResults');
var searchBox = document.getElementById('searchBox');
var activeSearchIdx = -1;

function openSearch() {
  searchDropdown.classList.add('open');
  searchInput.focus();
  searchInput.select();
}

function closeSearch() {
  searchDropdown.classList.remove('open');
  searchInput.value = '';
  searchResults.innerHTML = '';
  activeSearchIdx = -1;
}

// Ctrl+K shortcut
document.addEventListener('keydown', function(e) {
  if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    if (searchDropdown.classList.contains('open')) {
      closeSearch();
      searchInput.blur();
    }
  }
});

// Close on click outside
document.addEventListener('click', function(e) {
  if (searchBox && !searchBox.contains(e.target)) {
    closeSearch();
  }
});

// Focus opens dropdown
if (searchInput) {
  searchInput.addEventListener('focus', function() {
    if (searchInput.value.trim()) {
      doSearch();
    }
    searchDropdown.classList.add('open');
  });
}

// Preload search index
(function() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/search-index.json', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try { window._searchIndex = JSON.parse(xhr.responseText); } catch(e) {}
    }
  };
  xhr.send();
})();

var searchTimer;
function doSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function() {
    var q = searchInput.value.trim().toLowerCase();
    activeSearchIdx = -1;
    if (!q) { searchResults.innerHTML = ''; return; }

    if (window._searchIndex) {
      var results = window._searchIndex.filter(function(p) {
        return p.title.toLowerCase().indexOf(q) >= 0 || p.content.toLowerCase().indexOf(q) >= 0;
      });
      if (!results.length) {
        searchResults.innerHTML = '<div class="search-dropdown-empty">没有找到相关文章<br><span style="font-size:11px;">试试其他关键词</span></div>';
        return;
      }
      searchResults.innerHTML = results.map(function(p, i) {
        return '<a href="/post/' + p.slug + '" class="search-result-item" data-idx="' + i + '">' +
          '<span class="result-tag">#' + p.tag + '</span>' +
          '<span class="result-title">' + p.title + '</span>' +
          '<span class="result-date">' + p.date + '</span>' +
          '</a>';
      }).join('');
      return;
    }

    fetch('/search?q=' + encodeURIComponent(q))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.results || !data.results.length) {
          searchResults.innerHTML = '<div class="search-dropdown-empty">没有找到相关文章<br><span style="font-size:11px;">试试其他关键词</span></div>';
          return;
        }
        searchResults.innerHTML = data.results.map(function(p, i) {
          return '<a href="/post/' + p.slug + '" class="search-result-item" data-idx="' + i + '">' +
            '<span class="result-tag">#' + p.tag + '</span>' +
            '<span class="result-title">' + p.title + '</span>' +
            '<span class="result-date">' + p.date + '</span>' +
            '</a>';
        }).join('');
      });
  }, 200);
}

// Keyboard navigation in dropdown
document.addEventListener('keydown', function(e) {
  if (!searchDropdown.classList.contains('open')) return;
  var items = searchResults.querySelectorAll('.search-result-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSearchIdx = Math.min(activeSearchIdx + 1, items.length - 1);
    updateSearchActive(items);
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSearchIdx = Math.max(activeSearchIdx - 1, 0);
    updateSearchActive(items);
  }
  if (e.key === 'Enter' && activeSearchIdx >= 0) {
    e.preventDefault();
    items[activeSearchIdx].click();
  }
});

function updateSearchActive(items) {
  items.forEach(function(item, i) {
    item.classList.toggle('active', i === activeSearchIdx);
  });
}
```

- [ ] **Step 2: Update theme toggle icon to use new button ID**

Replace `updateToggleIcon()` function:

```javascript
function updateToggleIcon() {
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}
```

- [ ] **Step 3: Add active link detection on page load**

Add after `initIconWall();` inside the `DOMContentLoaded` callback:

```javascript
  // Set active nav link based on current page
  var path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === '/' && path === '/') {
      link.classList.add('active');
    } else if (href !== '/' && path.startsWith(href)) {
      link.classList.add('active');
    }
  });
```

- [ ] **Step 4: Commit**

```bash
git add static/js/main.js
git commit -m "feat: rewrite search JS with dropdown style and keyboard navigation"
```

---

### Task 4: Verification

- [ ] **Step 1: Start dev server and check all states**

```bash
cd c:\Users\28476\jzc-blog && python app.py
```

Verify at `http://localhost:5000`:
- Light mode: navbar full-width, white bg, thin border. Search box visible with ⌘K
- Click/search: type keyword, dropdown shows results, keyboard nav works, Esc closes
- Dark mode: toggle works, all colors adapt
- Mobile (375px): hamburger menu works, search responsive
- All pages: `/notes`, `/about`, `/editor`, post detail — active link indicator correct

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "chore: final polish for navbar and search redesign"
```
