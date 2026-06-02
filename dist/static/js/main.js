(function() {
  var saved = localStorage.getItem('jzc-theme');
  if (saved === 'dark') document.body.classList.add('dark');
  updateToggleIcon();
})();
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('jzc-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateToggleIcon();
}
function updateToggleIcon() {
  var btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}
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
});
var _postSlugs = [];
function randomPost() {
  var dice = document.querySelector('.nav-dice');
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
function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  document.getElementById('searchInput').focus();
}
function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeSearch();
  if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openSearch(); }
});
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
    var q = document.getElementById('searchInput').value.trim().toLowerCase();
    var container = document.getElementById('searchResults');
    if (!q) { container.innerHTML = ''; return; }
    if (window._searchIndex) {
      var results = window._searchIndex.filter(function(p) {
        return p.title.toLowerCase().indexOf(q) >= 0 || p.content.toLowerCase().indexOf(q) >= 0;
      });
      if (!results.length) {
        container.innerHTML = '<p class="text-muted">没找到匹配的文章</p>';
        return;
      }
      container.innerHTML = results.map(function(p) {
        return '<a href="/post/' + p.slug + '" class="search-result-item">' +
          '<span class="tag">#' + p.tag + '</span> ' +
          '<strong>' + p.title + '</strong> ' +
          '<span class="text-muted" style="font-size:11px;">' + p.date + '</span>' +
          '</a>';
      }).join('');
      return;
    }
    fetch('/search?q=' + encodeURIComponent(q))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.results || !data.results.length) {
          container.innerHTML = '<p class="text-muted">没找到匹配的文章</p>';
          return;
        }
        container.innerHTML = data.results.map(function(p) {
          return '<a href="/post/' + p.slug + '" class="search-result-item">' +
            '<span class="tag">#' + p.tag + '</span> ' +
            '<strong>' + p.title + '</strong> ' +
            '<span class="text-muted" style="font-size:11px;">' + p.date + '</span>' +
            '</a>';
        }).join('');
      });
  }, 200);
}
(function() {
  if (localStorage.getItem('jzc-welcome-seen')) return;
  localStorage.setItem('jzc-welcome-seen', '1');
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-box">' +
    '<div class="modal-icon">🏝️</div>' +
    '<h3>欢迎来到 JZC 的岛屿！</h3>' +
    '<p id="welcomeText"></p>' +
    '<div style="margin-top:20px;">' +
    '<button class="btn btn-primary" onclick="this.closest(\'.modal-overlay\').remove()">开始探索</button>' +
    '</div></div>';
  document.body.appendChild(overlay);
  var msg = '这里是一个安静的小岛，写点技术笔记，记些生活碎片，偶尔有小动物来访。慢慢逛，不着急。';
  var el = document.getElementById('welcomeText');
  var i = 0;
  function type() {
    if (i < msg.length) { el.textContent += msg[i]; i++; setTimeout(type, 50 + Math.random() * 30); }
  }
  type();
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
})();
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
function initReveal() {
  document.querySelectorAll('.post-card, .note-card, .card').forEach(function(el) {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });
}
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
function observeReveal() {
  document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
  });
}
function addCopyButtons() {
  document.querySelectorAll('.codehilite, .code-block, pre').forEach(function(block) {
    if (block.querySelector('.code-copy-btn')) return;
    if (block.closest('.code-block-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'code-block-wrap';
    block.parentNode.insertBefore(wrap, block);
    wrap.appendChild(block);
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
  });
}
document.addEventListener('DOMContentLoaded', addCopyButtons);
addCopyButtons();
document.addEventListener('DOMContentLoaded', function() {
  initReveal();
  observeReveal();
});
initReveal();
observeReveal();