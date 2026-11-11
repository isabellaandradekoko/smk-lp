/* SMK · LP — interações e motion (vanilla, sem dependências) */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = window.SMK_CONFIG || { checkout: {}, links: {} };

  /* ---------- links: checkout / whatsapp / termo ---------- */
  // Repassa UTMs e outros parâmetros de campanha da URL pro checkout.
  function withParams(url) {
    var keep = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'gclid'];
    var here = new URLSearchParams(location.search);
    try {
      var u = new URL(url, location.href);
      keep.forEach(function (k) { if (here.has(k) && !u.searchParams.has(k)) u.searchParams.set(k, here.get(k)); });
      return u.toString();
    } catch (e) { return url; }
  }

  document.querySelectorAll('[data-checkout]').forEach(function (a) {
    var url = (cfg.checkout || {})[a.dataset.checkout];
    a.href = url ? withParams(url) : '#oferta';
  });
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = (cfg.links || {})[a.dataset.link];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.href = a.dataset.link === 'whatsapp' ? '#faq' : '#oferta'; }
  });

  /* ---------- topbar + CTA mobile ---------- */
  var topbar = document.querySelector('.topbar');
  var mcta = document.querySelector('.mcta');
  var hero = document.querySelector('.hero');
  var oferta = document.getElementById('oferta');
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    var heroEnd = hero.offsetHeight - 80;
    topbar.classList.toggle('is-solid', y > 20);
    topbar.classList.toggle('is-hidden', y > heroEnd && y > lastY + 2);
    if (y < lastY - 2 || y < heroEnd) topbar.classList.remove('is-hidden');

    var r = oferta.getBoundingClientRect();
    var inOffer = r.top < window.innerHeight && r.bottom > 0;
    mcta.classList.toggle('is-on', y > heroEnd && !inOffer);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll (com stagger entre irmãos) ---------- */
  var groups = new Map();
  document.querySelectorAll('.reveal').forEach(function (el) {
    var p = el.parentElement;
    if (!groups.has(p)) groups.set(p, 0);
    var i = groups.get(p);
    groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
  });

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        e.target.querySelectorAll('[data-scramble]').forEach(scramble);
        e.target.querySelectorAll('[data-count]').forEach(countUp);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- scramble ("decodificando") ---------- */
  var glyphs = '01•○●▪#/<>';
  function scramble(el) {
    var final = el.textContent, start = null, dur = 700, delay = 250;
    function frame(t) {
      if (!start) start = t;
      var p = (t - start - delay) / dur;
      if (p < 0) { requestAnimationFrame(frame); return; }
      var n = Math.floor(Math.min(p, 1) * final.length);
      var out = final.slice(0, n);
      for (var i = n; i < final.length; i++) out += final[i] === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0];
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- contador ---------- */
  function countUp(el) {
    var to = +el.dataset.count, start = null, dur = 1200;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- hero: boot do ícone na tela CRT ---------- */
  var icon = document.querySelector('.crt__icon svg');
  var bar = document.querySelector('.crt__bar i');
  var label = document.querySelector('.crt__label');

  if (icon) {
    var dots = Array.prototype.slice.call(icon.querySelectorAll('circle'));
    if (reduce || !dots[0].animate) {
      bar.style.width = '100%';
      label.textContent = 'tech social: online';
    } else {
      dots.forEach(function (c, i) {
        c.style.opacity = 0;
        c.animate(
          [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.15)', offset: .7 }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 420, delay: 300 + i * 14, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
        );
      });
      var total = 300 + dots.length * 14 + 420;
      bar.animate([{ width: '0%' }, { width: '100%' }], { duration: total, easing: 'steps(25, end)', fill: 'forwards' });
      setTimeout(function () {
        label.textContent = 'tech social: online';
        dots.forEach(function (c) {
          c.style.opacity = 1;
          c.getAnimations().forEach(function (a) { a.cancel(); });
        });
        blinkLoop();
        repel(dots);
      }, total + 100);
    }
  }

  /* bolinhas do ícone desviam do cursor */
  function repel(dots) {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var wrap = icon.parentElement;
    wrap.classList.add('is-live');
    var pos = dots.map(function (c) { return [+c.getAttribute('cx'), +c.getAttribute('cy')]; });
    var pending = null;
    hero.addEventListener('pointermove', function (e) {
      pending = e;
      requestAnimationFrame(function () {
        if (!pending) return;
        var m = icon.getScreenCTM();
        if (!m) return;
        var p = new DOMPoint(pending.clientX, pending.clientY).matrixTransform(m.inverse());
        pending = null;
        dots.forEach(function (c, i) {
          var dx = pos[i][0] - p.x, dy = pos[i][1] - p.y, d = Math.sqrt(dx * dx + dy * dy);
          var R = 220;
          if (d < R && d > 0) {
            var f = (1 - d / R) * 38;
            c.style.transform = 'translate(' + (dx / d * f).toFixed(1) + 'px,' + (dy / d * f).toFixed(1) + 'px)';
          } else if (c.style.transform) {
            c.style.transform = '';
          }
        });
      });
    });
    hero.addEventListener('pointerleave', function () { dots.forEach(function (c) { c.style.transform = ''; }); });
  }

  function blinkLoop() {
    var eyes = icon.querySelectorAll('.eye');
    function blink() {
      eyes.forEach(function (e) {
        e.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.12)' }, { transform: 'scaleY(1)' }], { duration: 220, easing: 'ease-in-out' });
      });
      setTimeout(blink, 3200 + Math.random() * 2800);
    }
    setTimeout(blink, 900);
  }

  /* ---------- hero: campo de bolinhas que reage ao cursor ---------- */
  var canvas = document.querySelector('.hero__dots');
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, gap = 26, mx = -9999, my = -9999, tx = -9999, ty = -9999, running = false, visible = true;

    function size() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      mx += (tx - mx) * 0.12; my += (ty - my) * 0.12;
      var R = 150;
      for (var y = gap / 2; y < H; y += gap) {
        for (var x = gap / 2; x < W; x += gap) {
          var dx = x - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy);
          var k = d < R ? 1 - d / R : 0;
          k = k * k;
          if (k > 0.01) {
            ctx.fillStyle = 'rgba(180,243,94,' + (0.08 + k * 0.75) + ')';
            ctx.beginPath(); ctx.arc(x, y, 1.6 + k * 3.2, 0, 6.2832); ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(244,241,232,0.07)';
            ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
          }
        }
      }
    }

    function loop() {
      if (!visible) { running = false; return; }
      draw();
      if (Math.abs(tx - mx) > 0.5 || Math.abs(ty - my) > 0.5) requestAnimationFrame(loop);
      else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

    if (finePointer && !reduce) {
      hero.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        tx = e.clientX - r.left; ty = e.clientY - r.top;
        if (mx < -1000) { mx = tx; my = ty; }
        kick();
      });
      hero.addEventListener('pointerleave', function () { tx = ty = -9999; mx = my = -9999; draw(); });
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    }

    window.addEventListener('resize', size);
    size();
  }

  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- barra de progresso de leitura ---------- */
  var prog = document.querySelector('.progress i');
  if (prog) {
    var setProg = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', setProg, { passive: true });
    setProg();
  }

  /* ---------- cursor de bolinha ---------- */
  var cur = document.querySelector('.cursor');
  if (cur && fine && !reduce) {
    var cx = 0, cy = 0, px = 0, py = 0, raf = null;
    var follow = function () {
      px += (cx - px) * 0.25; py += (cy - py) * 0.25;
      cur.style.transform = 'translate(' + px + 'px,' + py + 'px)';
      raf = (Math.abs(cx - px) + Math.abs(cy - py) > 0.3) ? requestAnimationFrame(follow) : null;
    };
    document.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      cur.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(follow);
    });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('is-big', !!e.target.closest('a, button, summary, [data-tilt], .vs__row'));
    });
  }

  if (!reduce && fine) {
    /* ---------- tilt 3D ---------- */
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg');
      });
    });

    /* ---------- spotlight de bolinhas ---------- */
    document.querySelectorAll('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* ---------- balão "digitando" de novo ---------- */
    document.querySelectorAll('.pain').forEach(function (card) {
      var b = card.querySelector('.bubble');
      var full = b.textContent, timer = null;
      b.style.minHeight = b.offsetHeight + 'px';
      card.addEventListener('mouseenter', function () {
        if (timer) return;
        b.style.minHeight = b.offsetHeight + 'px';
        b.style.minWidth = b.offsetWidth + 'px';
        var i = 0;
        b.classList.add('is-typing');
        b.textContent = '';
        timer = setInterval(function () {
          i += 2;
          b.textContent = full.slice(0, i);
          if (i >= full.length) {
            clearInterval(timer); timer = null;
            b.textContent = full;
            setTimeout(function () { b.classList.remove('is-typing'); }, 900);
          }
        }, 22);
      });
    });

    /* ---------- números: decodifica de novo no hover ---------- */
    document.querySelectorAll('.stats li').forEach(function (li) {
      var b = li.querySelector('b'), busy = false;
      li.addEventListener('mouseenter', function () {
        if (busy) return;
        busy = true;
        b.querySelectorAll('[data-count]').forEach(function (s) { s.textContent = s.dataset.count; });
        var final = b.textContent;
        b.dataset.final = final;
        scramble(b);
        setTimeout(function () { b.textContent = final; busy = false; }, 1100);
      });
    });
  }

  /* ---------- painel: posts × resultado (bolinhas) ---------- */
  var panel = document.querySelector('.panel');
  if (panel) {
    var svg = panel.querySelector('.panel__chart');
    var NS = 'http://www.w3.org/2000/svg';
    var COLS = 13, ROWS = 11, G = 20, R = 7.2;
    var BAR_A = [1, 2, 3, 4], BAR_B = [8, 9, 10, 11];
    svg.setAttribute('viewBox', '0 0 ' + COLS * G + ' ' + ROWS * G);
    var grid = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) {
        var ci = document.createElementNS(NS, 'circle');
        ci.setAttribute('cx', c * G + G / 2); ci.setAttribute('cy', r * G + G / 2); ci.setAttribute('r', R);
        svg.appendChild(ci); grid[r][c] = ci;
      }
    }
    var mode = panel.querySelector('.panel__mode');
    var cap = panel.querySelector('.panel__cap');
    var l1 = panel.querySelector('.panel__l1');
    var hA = 0, hB = 0, tA = 0, tB = 0, scene = 0, stepTimer = null, sceneTimer = null;

    var paint = function () {
      for (var r = 0; r < ROWS; r++) {
        var level = ROWS - r; // 1 = linha de baixo
        BAR_A.forEach(function (c) { grid[r][c].setAttribute('class', level <= hA ? 'on-a' : ''); });
        BAR_B.forEach(function (c) { grid[r][c].setAttribute('class', level <= hB ? 'on-b' : ''); });
      }
    };
    var step = function () {
      var moved = false;
      if (hA !== tA) { hA += hA < tA ? 1 : -1; moved = true; }
      if (hB !== tB) { hB += hB < tB ? 1 : -1; moved = true; }
      paint();
      if (!moved) { clearInterval(stepTimer); stepTimer = null; }
    };
    var go = function () { if (!stepTimer) stepTimer = setInterval(step, 70); };
    var setScene = function (s) {
      scene = s;
      panel.classList.toggle('is-data', s === 1);
      if (s === 0) {
        mode.textContent = '> modo: executor';
        l1.textContent = 'posts';
        cap.innerHTML = 'postar mais <i>≠</i> ganhar mais';
        tA = ROWS; tB = 2;
      } else {
        mode.textContent = '> modo: tech social';
        l1.textContent = 'dado lido';
        cap.innerHTML = 'decidir por dado <i>=</i> cobrar mais';
        tA = 6; tB = ROWS;
      }
      go();
    };

    if (reduce) {
      hA = tA = ROWS; hB = tB = 2; setScene(0); hA = tA; hB = tB; paint();
    } else {
      paint();
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          if (!sceneTimer) {
            setScene(scene);
            sceneTimer = setInterval(function () { setScene(scene ? 0 : 1); }, 3600);
          }
        } else if (sceneTimer) {
          clearInterval(sceneTimer); sceneTimer = null;
        }
      }, { threshold: 0.3 }).observe(panel);
    }
  }
})();
