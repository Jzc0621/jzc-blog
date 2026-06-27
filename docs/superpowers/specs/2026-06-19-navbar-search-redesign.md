# Navbar & Search Redesign — Minimal Professional

## Goal
Replace the current Animal-Crossing capsule-style navbar and hidden-icon search with a clean, professional design inspired by modern documentation/tech blog sites.

## Current State
- Navbar: capsule card (rounded border + thick shadow), centered in page, `> DRIFT` logo + text links
- Search: hidden behind 🔍 icon, opens full-screen modal overlay

## Target Design

### Navbar
- **Full-width, stuck to top of viewport** — maximizes content space
- **Clean background** — white in light mode, dark surface in dark mode. 1px bottom border separator
- **Layout**: logo left → nav links left → spacer → search box → theme toggle right
- **Active state**: 2px bottom indicator bar on current page link. Hover darkens text.
- **No thick borders or heavy shadows** — flat, minimal
- **Dark mode**: background #1a1a2e, border #2a2a4a, text adapts

### Search
- **Always-visible search trigger** in navbar — a small input-like pill showing `🔍 搜索文章  ⌘K`
- **On click/focus/Ctrl+K**: the trigger expands into a dropdown panel below the navbar, containing:
  - Search input (auto-focused)
  - Results list (matched by title + content), each row showing tag + title + date
  - Keyboard navigation: ↑↓ to move, ↩ to open, Esc to close
  - Click-outside to dismiss
- **Empty state**: "没有找到相关文章" + suggest trying other keywords
- **Dark mode**: dropdown background #252540, border #4a4a6a

### Mobile (< 768px)
- Navbar: logo left, 🔍 + hamburger (☰) right
- Search: clicking 🔍 replaces the nav links area with a full-width search input + results inline
- Hamburger: toggles a dropdown menu below navbar

### Colors (light mode)
- Background: #fff (navbar), #fff (dropdown)
- Border: #e5e7eb (navbar bottom), #f0f0f0 (internal)
- Text: #111 (active), #666 (inactive), #999 (placeholder)
- Accent: keep existing #19c8b9 for links/tags

### Colors (dark mode)
- Background: #1a1a2e (navbar), #252540 (dropdown)
- Border: #2a2a4a (navbar bottom)
- Text: #d8d8e8 (active), #9090a8 (inactive)

### Transitions
- Navbar link hover: 0.2s color + indicator width
- Search dropdown: 0.15s opacity + transform (slide down 4px)
- Search results highlight: 0.15s background

## What Stays
- Theme toggle (🌙/☀️)
- Random post dice (🎲)
- RSS link (moved to footer, already there)
- All existing page routes
- Dark mode localStorage persistence

## What Changes
- `.nav-bar` CSS completely rewritten
- `.search-overlay` removed, replaced with `.search-dropdown`
- `openSearch()` / `closeSearch()` JS rewritten
- Ctrl+K handler triggers dropdown instead of overlay
- Mobile hamburger menu JS updated

## Files to Touch
- `templates/base.html` — navbar HTML structure, search dropdown markup
- `static/css/animal.css` — .nav-bar, .search-* styles
- `static/js/main.js` — search + mobile nav logic
