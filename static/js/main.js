// ═══════════════════════════════════════════
// Dark mode toggle
// ═══════════════════════════════════════════
(function() {
  var saved = localStorage.getItem('drift-theme');
  if (saved === 'dark') document.body.classList.add('dark');
  updateToggleIcon();
})();

function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('drift-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateToggleIcon();
}

function updateToggleIcon() {
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

// ═══════════════════════════════════════════
// Smooth Scroll (Lenis-like inertia)
// ═══════════════════════════════════════════
var SmoothScroll = (function() {
  var current = 0;
  var target = 0;
  var ease = 0.08;
  var raf = null;
  var html = document.documentElement;
  var height = 0;

  function clamp(v, min, max) { return Math.max(min, Math.min(v, max)); }

  function update() {
    // Recalc height in case content changed
    height = html.scrollHeight - window.innerHeight;

    current += (target - current) * ease;

    if (Math.abs(target - current) < 0.1) {
      current = target;
      raf = null;
    }

    window.scrollTo(0, current);

    if (raf !== null) {
      raf = requestAnimationFrame(update);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    target += e.deltaY;
    target = clamp(target, 0, height);

    if (!raf) {
      raf = requestAnimationFrame(update);
    }
  }

  function init() {
    if ('ontouchstart' in window) return;
    height = html.scrollHeight - window.innerHeight;
    current = window.scrollY;
    target = current;
    window.addEventListener('wheel', onWheel, { passive: false });
    // Sync internal state when user scrolls via scrollbar/keyboard
    window.addEventListener('scroll', function() {
      if (!raf) {
        current = window.scrollY;
        target = current;
      }
    }, { passive: true });
  }

  return { init: init };
})();

// ═══════════════════════════════════════════
// Loading Screen
// ═══════════════════════════════════════════
(function() {
  var screen = document.getElementById('loadingScreen');
  if (!screen) return;

  // Create expanding rings
  for (var i = 1; i <= 3; i++) {
    var ring = document.createElement('div');
    ring.className = 'loading-screen-rings';
    ring.style.animationDelay = (i * 0.15) + 's';
    screen.appendChild(ring);
  }

  // Hide after animations complete
  var minDuration = 1800;
  var startTime = Date.now();

  function hide() {
    var elapsed = Date.now() - startTime;
    var remaining = Math.max(0, minDuration - elapsed);

    setTimeout(function() {
      screen.classList.add('hidden');
      // Remove from DOM after transition
      setTimeout(function() {
        if (screen.parentNode) screen.parentNode.removeChild(screen);
      }, 700);
    }, remaining);
  }

  window.addEventListener('load', hide);
  // Fallback: hide after 3s even if load event hasn't fired
  setTimeout(hide, 3000);
})();

// ═══════════════════════════════════════════
// Back to top + reading progress
// ═══════════════════════════════════════════
window.addEventListener('scroll', function() {
  var btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);

  var bar = document.getElementById('progressBar');
  if (bar) {
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }

  // Parallax sticky effect
  var stickyEl = document.querySelector('.parallax-sticky-inner');
  if (stickyEl) {
    var rect = stickyEl.closest('.parallax-section').getBoundingClientRect();
    var speed = 0.3;
    var y = rect.top * speed;
    stickyEl.style.transform = 'translateY(' + y + 'px)';
  }
});

// ═══════════════════════════════════════════
// Random post
// ═══════════════════════════════════════════
var _postSlugs = [];
function randomPost() {
  var dice = document.getElementById('diceBtn');
  if (dice) dice.classList.add('spinning');
  setTimeout(function() { if (dice) dice.classList.remove('spinning'); }, 600);

  if (!_postSlugs.length) {
    document.querySelectorAll('a[href*="/post/"]').forEach(function(a) {
      var m = a.href.match(/\/post\/([^/]+)/);
      if (m && _postSlugs.indexOf(m[1]) < 0) _postSlugs.push(m[1]);
    });
  }
  if (_postSlugs.length) {
    var slug = _postSlugs[Math.floor(Math.random() * _postSlugs.length)];
    window.location.href = '/post/' + slug;
    return;
  }
  fetch('/search-index.json').then(function(r) { return r.json(); }).then(function(data) {
    if (data.length) {
      var idx = Math.floor(Math.random() * data.length);
      window.location.href = '/post/' + data[idx].slug;
    }
  });
}

// ═══════════════════════════════════════════
// Island Clock
// ═══════════════════════════════════════════
function updateClock() {
  var now = new Date();
  var days = ['日', '一', '二', '三', '四', '五', '六'];
  var dateEl = document.getElementById('clockDate');
  var timeEl = document.getElementById('clockTime');
  if (dateEl) dateEl.textContent = '星期' + days[now.getDay()];
  if (timeEl) timeEl.textContent =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}
updateClock();
setInterval(updateClock, 30000);

// ═══════════════════════════════════════════
// Daily Fortune
// ═══════════════════════════════════════════
var fortunes = [
  { icon: '🍀', text: '今天适合重构代码，删掉的比写的多才是进步' },
  { icon: '☕', text: '咖啡要趁热喝，bug 要趁早修' },
  { icon: '🌟', text: '今天可能会遇到一个让你豁然开朗的答案' },
  { icon: '🌸', text: '好心情是最好的 debug 工具' },
  { icon: '🐢', text: '慢就是快，今天不要 rush' },
  { icon: '🎣', text: '像钓鱼一样对待灵感：耐心等待，它会上钩的' },
  { icon: '🌈', text: '今天写的代码明天可能删掉，但那是有意义的' },
  { icon: '🦉', text: '深夜写代码容易出 bug，早点休息吧' },
  { icon: '🌿', text: '偶尔休息一下不是偷懒，是给自己的缓存清理' },
  { icon: '🦊', text: '聪明的狐狸说：console.log 是最好的朋友' },
  { icon: '🍂', text: '秋风吹走了 bug，春天又长出新 feature' },
  { icon: '⭐', text: '今天的你会解决一个难了三天的问题' },
  { icon: '🎵', text: '戴上耳机，好音乐让代码自己写出来' },
  { icon: '🐚', text: '小贝壳说：模块化是通往幸福的路' },
  { icon: '🪐', text: '抬头看看远方，bug 没有那么重要' },
];

function drawFortune() {
  var btn = document.getElementById('fortuneBtn');
  if (btn) btn.classList.add('shaking');
  setTimeout(function() { if (btn) btn.classList.remove('shaking'); }, 500);

  var old = document.querySelector('.fortune-popup');
  if (old) { old.remove(); return; }

  var today = new Date().toISOString().slice(0, 10);
  var seed = 0;
  for (var i = 0; i < today.length; i++) seed += today.charCodeAt(i);
  var f = fortunes[seed % fortunes.length];

  var popup = document.createElement('div');
  popup.className = 'fortune-popup';
  popup.innerHTML =
    '<div class="fortune-icon">' + f.icon + '</div>' +
    '<div class="fortune-text">' + f.text + '</div>' +
    '<div class="fortune-date">' + today + '</div>' +
    '<div style="margin-top:8px;font-size:10px;color:var(--text-disabled);">点击摇签筒关闭 · 每日一签</div>';
  document.body.appendChild(popup);

  setTimeout(function() { if (popup.parentNode) popup.remove(); }, 10000);
}

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
  if (!searchBox || searchBox.contains(e.target)) return;
  if (!searchDropdown.classList.contains('open')) return;
  closeSearch();
});

// Focus opens dropdown
if (searchInput) {
  searchInput.addEventListener('focus', function() {
    if (searchInput.value.trim()) {
      doSearch();
    }
    searchDropdown.classList.add('open');
  });
  searchInput.addEventListener('input', function() {
    doSearch();
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

// ═══════════════════════════════════════════
// Welcome Modal (first visit)
// ═══════════════════════════════════════════
(function() {
  if (localStorage.getItem('drift-welcome-seen')) return;
  localStorage.setItem('drift-welcome-seen', '1');

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-box">' +
    '<div class="modal-icon">🏝️</div>' +
    '<h3>欢迎来到 DRIFT</h3>' +
    '<p id="welcomeText"></p>' +
    '<div style="margin-top:20px;">' +
    '<button class="btn btn-primary" onclick="this.closest(\'.modal-overlay\').remove()">开始探索</button>' +
    '</div></div>';
  document.body.appendChild(overlay);

  var msg = '一个安静写东西的地方，写点技术笔记，记些生活碎片，偶尔有小动物来访。慢慢逛，不着急。';
  var el = document.getElementById('welcomeText');
  var i = 0;
  function type() {
    if (i < msg.length) { el.textContent += msg[i]; i++; setTimeout(type, 50 + Math.random() * 30); }
  }
  type();

  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
})();

// ═══════════════════════════════════════════
// Click Leaf Effect
// ═══════════════════════════════════════════
var leaves = ['🌿', '🍃', '🌱', '🍀', '✨', '🌸', '🍂', '🌾'];
document.addEventListener('click', function(e) {
  var leaf = document.createElement('span');
  leaf.className = 'click-leaf';
  leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
  leaf.style.left = e.clientX + 'px';
  leaf.style.top = e.clientY + 'px';
  leaf.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
  leaf.style.setProperty('--dy', -(Math.random() * 60 + 40) + 'px');
  leaf.style.setProperty('--rot', (Math.random() * 180 - 90) + 'deg');
  document.body.appendChild(leaf);
  setTimeout(function() { leaf.remove(); }, 1000);
});

// ═══════════════════════════════════════════
// Random Visitor
// ═══════════════════════════════════════════
var visitors = ['🦊', '🐿️', '🦉', '🐰', '🦌', '🐻', '🐸', '🦔'];
var speeches = [
  '今天天气不错呢！', '有好文章吗？', '咖啡真香~', '路过看看...',
  '代码写得不错！', '喵？不对，我是狐狸', '这地方真舒服', '加油写博客！'
];

function spawnVisitor() {
  var side = Math.random() > 0.5 ? 'left' : 'right';
  var v = document.createElement('div');
  v.className = 'visitor';
  v.textContent = visitors[Math.floor(Math.random() * visitors.length)];
  v.style[side] = Math.random() * 100 + 20 + 'px';
  v.style.bottom = '-60px';
  document.body.appendChild(v);

  v.addEventListener('click', function(e) {
    e.stopPropagation();
    var bubble = document.createElement('div');
    bubble.className = 'visitor-speech';
    bubble.textContent = speeches[Math.floor(Math.random() * speeches.length)];
    bubble.style.left = Math.min(e.clientX - 60, window.innerWidth - 160) + 'px';
    bubble.style.top = (e.clientY - 50) + 'px';
    document.body.appendChild(bubble);
    setTimeout(function() { bubble.remove(); }, 2500);
  });

  setTimeout(function() {
    v.classList.add('visitor-leaving');
    setTimeout(function() { v.remove(); }, 500);
  }, 8000 + Math.random() * 8000);

  setTimeout(spawnVisitor, 15000 + Math.random() * 30000);
}

setTimeout(spawnVisitor, 10000 + Math.random() * 20000);

// ═══════════════════════════════════════════
// Enhanced Scroll Reveal (clip-path + stagger)
// ═══════════════════════════════════════════
function initReveal() {
  // Add reveal classes to elements
  document.querySelectorAll('.post-card').forEach(function(el, i) {
    if (!el.classList.contains('reveal') && !el.classList.contains('stagger-reveal')) {
      el.classList.add('stagger-reveal');
    }
  });
  document.querySelectorAll('.section-title').forEach(function(el) {
    if (!el.classList.contains('clip-reveal')) {
      el.classList.add('clip-reveal');
    }
  });
  document.querySelectorAll('.note-card').forEach(function(el) {
    if (!el.classList.contains('stagger-reveal')) {
      el.classList.add('stagger-reveal');
    }
  });
}

var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      // Clip-path reveal
      if (entry.target.classList.contains('clip-reveal')) {
        entry.target.classList.add('revealed');
      }
      // Stagger reveal with delay based on index
      if (entry.target.classList.contains('stagger-reveal')) {
        var siblings = entry.target.parentNode.querySelectorAll('.stagger-reveal');
        var idx = Array.prototype.indexOf.call(siblings, entry.target);
        entry.target.style.animationDelay = (idx * 0.08) + 's';
        entry.target.classList.add('revealed');
      }
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function observeReveal() {
  document.querySelectorAll('.clip-reveal, .stagger-reveal').forEach(function(el) {
    revealObserver.observe(el);
  });
}

// ═══════════════════════════════════════════
// Code block enhancement
// ═══════════════════════════════════════════
function enhanceCodeBlocks() {
  document.querySelectorAll('.codehilite, .code-block, pre').forEach(function(block) {
    if (block.closest('.code-block-wrap')) return;

    var isCodehilite = block.classList.contains('codehilite');
    var wrap = document.createElement('div');
    wrap.className = 'code-block-wrap';
    block.parentNode.insertBefore(wrap, block);
    wrap.appendChild(block);

    // Language label
    if (isCodehilite) {
      var lang = null;
      block.classList.forEach(function(cls) {
        if (cls.startsWith('language-')) lang = cls.replace('language-', '');
      });
      if (lang) {
        var label = document.createElement('span');
        label.className = 'code-lang-label';
        label.textContent = lang;
        wrap.appendChild(label);
      }
    }

    // Copy button
    var btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.textContent = '复制';
    btn.onclick = function() {
      var code = block.textContent;
      navigator.clipboard.writeText(code).then(function() {
        btn.textContent = '已复制!';
        btn.classList.add('copied');
        setTimeout(function() { btn.textContent = '复制'; btn.classList.remove('copied'); }, 2000);
      });
    };
    wrap.appendChild(btn);

    // Line numbers
    var pre = block.tagName === 'PRE' ? block : block.querySelector('pre');
    if (!pre) return;
    var code = pre.querySelector('code') || pre;
    var lines = code.textContent.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    var gutter = document.createElement('div');
    gutter.className = 'code-line-numbers';
    for (var i = 1; i <= lines.length; i++) {
      var span = document.createElement('span');
      span.textContent = i;
      gutter.appendChild(span);
    }
    pre.parentNode.insertBefore(gutter, pre);
    pre.classList.add('code-with-lines');
  });
}

// ═══════════════════════════════════════════
// Image lightbox
// ═══════════════════════════════════════════
function initLightbox() {
  document.querySelectorAll('.article-body img').forEach(function(img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function() {
      var overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = '<img src="' + img.src + '" alt="' + (img.alt || '') + '">';
      overlay.addEventListener('click', function() { overlay.remove(); });
      document.body.appendChild(overlay);
      requestAnimationFrame(function() { overlay.classList.add('open'); });
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var lb = document.querySelector('.lightbox-overlay');
      if (lb) lb.remove();
    }
  });
}

// ═══════════════════════════════════════════
// Interactive Logo Stage (Human Made inspired)
// ═══════════════════════════════════════════
var InteractiveLogo = (function() {
  var stage, logo, rings, canvas, ctx;
  var particles = [];
  var mouseX = 0, mouseY = 0;
  var targetX = 0, targetY = 0;
  var currentX = 0, currentY = 0;
  var isDragging = false;
  var dragStartX = 0, dragStartY = 0;
  var rotateX = 0, rotateY = 0;
  var targetRotateX = 0, targetRotateY = 0;
  var width, height;
  var raf = null;
  var ringElements = [];

  function init() {
    stage = document.getElementById('heroStageInner');
    logo = document.getElementById('heroLogo');
    canvas = document.getElementById('heroCanvas');
    if (!stage || !canvas) return;

    ctx = canvas.getContext('2d');
    ringElements = [
      document.getElementById('ringOuter'),
      document.getElementById('ringMid'),
      document.getElementById('ringInner')
    ].filter(Boolean);

    resize();
    window.addEventListener('resize', resize);

    // Loading sequence
    stage.classList.add('is-loading');
    setTimeout(function() {
      stage.classList.remove('is-loading');
      stage.classList.add('is-loaded');
    }, 300);

    // Mouse tracking for magnetic effect
    var hero = document.getElementById('heroStage');
    hero.addEventListener('mousemove', onMouseMove);
    hero.addEventListener('mouseleave', onMouseLeave);

    // Drag interaction
    hero.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    // Touch
    hero.addEventListener('touchmove', onTouchMove, { passive: false });
    hero.addEventListener('touchstart', onTouchStart, { passive: false });
    hero.addEventListener('touchend', onTouchEnd);

    // Particle system
    initParticles();
    animate();

    // Reveal animation: logo fades in
    stage.style.opacity = '0';
    stage.style.transform = 'scale(0.8)';
    setTimeout(function() {
      stage.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      stage.style.opacity = '1';
      stage.style.transform = 'scale(1)';
    }, 200);
  }

  function resize() {
    var hero = document.getElementById('heroStage');
    width = hero.offsetWidth;
    height = hero.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  }

  // ── Magnetic cursor follow ──
  function onMouseMove(e) {
    var rect = stage.parentElement.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouseX = width / 2;
    mouseY = height / 2;
  }

  function onTouchMove(e) {
    e.preventDefault();
    var rect = stage.parentElement.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    mouseY = e.touches[0].clientY - rect.top;
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      var rect = stage.parentElement.getBoundingClientRect();
      dragStartX = e.touches[0].clientX - rect.left;
      dragStartY = e.touches[0].clientY - rect.top;
      isDragging = true;
      document.getElementById('heroStage').classList.add('is-dragging');
    }
  }

  function onTouchEnd() {
    isDragging = false;
    document.getElementById('heroStage').classList.remove('is-dragging');
    targetRotateX = 0;
    targetRotateY = 0;
  }

  // ── Drag ──
  function onDragStart(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    document.getElementById('heroStage').classList.add('is-dragging');
  }

  function onDragMove(e) {
    if (!isDragging) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    targetRotateY = dx * 0.08;
    targetRotateX = -dy * 0.08;
    // Clamp
    targetRotateY = Math.max(-8, Math.min(8, targetRotateY));
    targetRotateX = Math.max(-8, Math.min(8, targetRotateX));
  }

  function onDragEnd() {
    isDragging = false;
    document.getElementById('heroStage').classList.remove('is-dragging');
    targetRotateX = 0;
    targetRotateY = 0;
  }

  // ── Background elements ──
  var dots = [];
  var shapes = [];
  var scanlines = [];
  var time = 0;

  function initParticles() {
    var w = width || 800;
    var h = height || 600;

    // Floating particles
    particles = [];
    for (var i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.15,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.35 + 0.08
      });
    }

    // Grid dots (subtle tech grid)
    dots = [];
    var spacing = 50;
    for (var gx = spacing; gx < w; gx += spacing) {
      for (var gy = spacing; gy < h; gy += spacing) {
        dots.push({
          x: gx + (Math.random() - 0.5) * 10,
          y: gy + (Math.random() - 0.5) * 10,
          baseX: gx,
          baseY: gy,
          size: 1,
          opacity: Math.random() * 0.12 + 0.03
        });
      }
    }

    // Soft glowing orbs
    shapes = [];
    for (var j = 0; j < 5; j++) {
      shapes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: -(Math.random() * 0.15 + 0.05),
        vx: (Math.random() - 0.5) * 0.1,
        radius: Math.random() * 60 + 30,
        opacity: Math.random() * 0.06 + 0.02,
        hue: j % 2 === 0 ? '25, 200, 185' : '138, 198, 106'
      });
    }

    // Faint scanlines
    scanlines = [];
    for (var k = 0; k < 6; k++) {
      scanlines.push({
        y: Math.random() * h,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.06 + 0.02,
        length: Math.random() * 0.6 + 0.4
      });
    }
  }

  function updateParticles() {
    time += 0.016;

    // Particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
      var cx = width / 2;
      var cy = height / 2;
      p.vx += (cx - p.x) * 0.00003;
      p.vy += (cy - p.y) * 0.00003;
      p.vx *= 0.9995;
      p.vy *= 0.9995;
    }

    // Orbs drift slowly
    for (var j = 0; j < shapes.length; j++) {
      var s = shapes[j];
      s.y += s.vy;
      s.x += s.vx;
      if (s.y < -100) { s.y = height + 100; s.x = Math.random() * width; }
      if (s.y > height + 100) { s.y = -100; s.x = Math.random() * width; }
    }

    // Scanlines
    for (var k = 0; k < scanlines.length; k++) {
      var sl = scanlines[k];
      sl.y += sl.vy;
      if (sl.y < 0) sl.y = height;
      if (sl.y > height) sl.y = 0;
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    // Grid dots
    for (var di = 0; di < dots.length; di++) {
      var d = dots[di];
      var pulse = 1 + Math.sin(time * 1.5 + d.baseX * 0.01) * 0.3;
      var distX = d.baseX - mouseX;
      var distY = d.baseY - mouseY;
      var dist = Math.sqrt(distX * distX + distY * distY);
      var attract = Math.max(0, 1 - dist / 200) * 3;
      var tx = d.baseX + distX * attract * 0.02;
      var ty = d.baseY + distY * attract * 0.02;
      ctx.beginPath();
      ctx.arc(tx, ty, d.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(114, 93, 66, ' + (d.opacity * pulse) + ')';
      ctx.fill();
    }

    // Scanlines
    for (var si = 0; si < scanlines.length; si++) {
      var sl = scanlines[si];
      var grad = ctx.createLinearGradient(0, sl.y - 1, 0, sl.y + 1);
      grad.addColorStop(0, 'rgba(25, 200, 185, 0)');
      grad.addColorStop(0.5, 'rgba(25, 200, 185, ' + sl.opacity + ')');
      grad.addColorStop(1, 'rgba(25, 200, 185, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, sl.y - 1, width * sl.length, 2);
    }

    // Soft glowing orbs
    for (var qi = 0; qi < shapes.length; qi++) {
      var sh = shapes[qi];
      var grad = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, sh.radius);
      grad.addColorStop(0, 'rgba(' + sh.hue + ', ' + (sh.opacity * 2) + ')');
      grad.addColorStop(0.5, 'rgba(' + sh.hue + ', ' + sh.opacity + ')');
      grad.addColorStop(1, 'rgba(' + sh.hue + ', 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sh.x - sh.radius, sh.y - sh.radius, sh.radius * 2, sh.radius * 2);
    }

    // Floating particles
    for (var pi = 0; pi < particles.length; pi++) {
      var pt = particles[pi];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(25, 200, 185, ' + pt.opacity + ')';
      ctx.fill();
    }
  }

  // ── Animation loop ──
  function animate() {
    // Smooth cursor tracking
    var centerX = width / 2;
    var centerY = height / 2;
    targetX = (mouseX - centerX) * 0.3;
    targetY = (mouseY - centerY) * 0.3;

    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    // Rotate smoothing
    rotateX += (targetRotateX - rotateX) * 0.1;
    rotateY += (targetRotateY - rotateY) * 0.1;

    // Apply to rings at different intensities
    if (ringElements[0]) ringElements[0].style.transform =
      'translate(' + (currentX * 0.15) + 'px, ' + (currentY * 0.15) + 'px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
    if (ringElements[1]) ringElements[1].style.transform =
      'translate(' + (currentX * 0.3) + 'px, ' + (currentY * 0.3) + 'px) rotateX(' + (rotateX * 0.6) + 'deg) rotateY(' + (rotateY * 0.6) + 'deg)';
    if (ringElements[2]) ringElements[2].style.transform =
      'translate(' + (currentX * 0.5) + 'px, ' + (currentY * 0.5) + 'px) rotateX(' + (rotateX * 0.3) + 'deg) rotateY(' + (rotateY * 0.3) + 'deg)';

    // Apply to logo
    if (logo) logo.style.transform =
      'translate(' + (currentX * 0.2) + 'px, ' + (currentY * 0.2) + 'px) rotateX(' + (rotateX * 0.8) + 'deg) rotateY(' + (rotateY * 0.8) + 'deg)';

    // Particles
    updateParticles();
    drawParticles();

    raf = requestAnimationFrame(animate);
  }

  return { init: init };
})();

// ═══════════════════════════════════════════
// Icon Wall Auto-scroll (duplicate for seamless loop)
// ═══════════════════════════════════════════
function initIconWall() {
  var tracks = document.querySelectorAll('.icon-wall-track');
  tracks.forEach(function(track) {
    // Clone items for seamless loop
    var items = track.innerHTML;
    track.innerHTML = items + items;
  });
}

// ═══════════════════════════════════════════
// Init all on DOM ready
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  SmoothScroll.init();
  InteractiveLogo.init();
  enhanceCodeBlocks();
  initLightbox();
  initReveal();
  observeReveal();
  initIconWall();

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
});

// Also run immediately for elements already in DOM
enhanceCodeBlocks();
initLightbox();
initReveal();
observeReveal();
initIconWall();
