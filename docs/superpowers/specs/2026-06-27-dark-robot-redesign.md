# Dark Robot Redesign — Design Spec

Date: 2026-06-27
Approach: Token-level refactor (方案 A), keeping existing CSS/HTML architecture.

## Core Vision

Dark minimalist, high contrast, negative space, modern tech feel. Restrained, clean, cool, futuristic. Black robot Spline 3D model as hero centerpiece.

Keywords: 暗黑极简、高对比度、留白艺术、现代科技感

---

## Design Tokens

### Colors

| Token | Light | Dark (default) |
|-------|-------|--------|
| bg-body | #f5f5f5 | #0d0d0d |
| bg-card | #ffffff | #1a1a1a |
| text-body | #1a1a1a | #e0e0e0 |
| text-heading | #000000 | #ffffff |
| text-secondary | #888888 | #666666 |
| text-muted | #999999 | #555555 |
| border | #e5e5e5 | #2a2a2a |
| accent | #a3ff4d (荧光绿) | #a3ff4d |
| accent-hover | #beff73 | #beff73 |

Dark mode is the **default**. Light mode kept as toggle option.

### Typography

- English: **Inter** (Google Fonts, weights 400/500/600/700)
- Chinese: **Noto Sans SC** (system native, no CDN load)
- Remove: Nunito, Zen Maru Gothic, Press Start 2P, SF Mono (code still uses monospace)
- Hero title: extremely large (`clamp(48px, 8vw, 96px)`), letter-spacing `0.06em`, white

### Shape

- Border radius: `4px` for cards/buttons/inputs (was 20-50px)
- Shadows: subtle dark glow (`box-shadow: 0 0 20px rgba(0,0,0,0.3)`) instead of Nintendo press-down shadows
- No decorative borders or patterns

---

## What Changes

### Global (base.html)
- CSS token file: rewrite `:root` and dark mode overrides
- Google Fonts: replace Nunito/Noto/Zen with Inter only
- Nav: remove dice button, keep theme toggle + search
- Remove: loading screen, fortune widget, island clock
- Progress bar: keep, restyle minimal
- Back to top: keep, restyle minimal

### Homepage (home.html)
- Hero: spline-viewer stays, overlay hero title with stencil/cut-out effect on text
- Remove: icon-wall section entirely
- Statement: repurpose as large-typography tagline + subtext, no clip-reveal
- Posts section: minimal list cards, white/dark bg, thin border, left accent bar
- Notes section: unified dark gray cards, left accent border for color coding (replaces pastel backgrounds)
- CTA: minimal, large type, accent-color button

### Post detail (post.html)
- Code blocks: dark theme (#1a1a1a bg), keep Pygments highlighting but ensure contrast
- Typography: clean reading layout, max-width content column
- Tags: simple text labels, no colored badges

### Notes page (notes.html)
- Note cards: unified dark background, left accent border per tag
- Remove candy-colored card backgrounds

### About page (about.html)
- Minimal dark style, no structural changes needed

### Editor pages (editor.html)
- Inputs/buttons: remove Nintendo press shadows, flat border style
- Keep functional layout, restyle tokens

### 404 page
- Dark style, minimal

---

## What Is Removed

| Element | Reason |
|---------|--------|
| icon-wall | Too playful, doesn't fit minimalist dark theme |
| fortune widget (运势签) | Cute style, doesn't fit |
| island clock | Animal Crossing relic |
| loading screen | Unnecessary for minimalist design |
| body leaf background | Too decorative |
| Nintendo press-down shadows | Doesn't fit modern geometric style |
| Pastel card colors | Replaced with unified dark palette |
| clip-reveal animations | Removed from statement; keep only for post cards |
| Random post dice button | Too playful |

---

## What Is Preserved

- Search box with dropdown
- Dark/light mode toggle
- RSS feed link
- Smooth scroll
- Lightbox for images
- Code highlighting (re-themed)
- Back to top button
- Progress bar
- Tag filtering on posts
- All functional JS (search, filter, reveal animations)
- All page routes and templates

---

## Implementation Order

1. CSS design tokens (`:root` variables, body, typography reset)
2. Font swap (Inter from Google Fonts)
3. Navbar restyle + remove playful elements
4. Homepage sections (hero overlay, posts, notes, CTA)
5. Post detail page (code blocks, layout)
6. Notes page, About page, Editor, 404
7. Remove dead elements (icon-wall HTML, fortune widget, island clock, loading screen)
8. Dark mode verification + responsive check
