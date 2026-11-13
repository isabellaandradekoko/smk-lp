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
  var closeSec = document.querySelector('.close');
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    var heroEnd = hero.offsetHeight - 80;
    topbar.classList.toggle('is-solid', y > 20);
    topbar.classList.toggle('is-hidden', y > heroEnd && y > lastY + 2);
    if (y < lastY - 2 || y < heroEnd) topbar.classList.remove('is-hidden');

    var r = oferta.getBoundingClientRect();
    var c = closeSec ? closeSec.getBoundingClientRect() : { top: 1e9 };
    var inOffer = (r.top < window.innerHeight && r.bottom > 0) || c.top < window.innerHeight * .6;
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
  /* ---------- menu: pílula verde (hover + seção ativa) ---------- */
  var nav = document.querySelector('.topbar__nav');
  if (nav) {
    var pill = nav.querySelector('.topbar__pill');
    var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    var active = null, hovering = null;
    var place = function (a) {
      links.forEach(function (l) { l.classList.toggle('is-pill', l === a); });
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      pill.style.width = a.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    };
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { hovering = a; place(a); });
    });
    nav.addEventListener('mouseleave', function () { hovering = null; place(active); });
    var spy = function () {
      var mid = window.innerHeight * 0.4, found = null;
      links.forEach(function (a) {
        var s = document.querySelector(a.getAttribute('href'));
        if (!s) return;
        var r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) found = a;
      });
      if (found !== active) { active = found; if (!hovering) place(active); }
    };
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', function () { place(hovering || active); });
    spy();
  }

  /* ---------- Hector: fotos alternando ---------- */
  var slides = document.querySelector('.slides');
  if (slides && !reduce) {
    var imgs = slides.querySelectorAll('img'), sdots = slides.querySelectorAll('.slides__dots i'), si = 0;
    setInterval(function () {
      imgs[si].classList.remove('is-on'); sdots[si].classList.remove('is-on');
      si = (si + 1) % imgs.length;
      imgs[si].classList.add('is-on'); sdots[si].classList.add('is-on');
    }, 4500);
  }

  /* ---------- morph de bolinhas: celular -> monitor ---------- */
  var morph = document.querySelector('.morph');
  if (morph) {
    var msvg = morph.querySelector('.morph__svg');
    var NSM = 'http://www.w3.org/2000/svg', GS = 14, CELLS = 24;
    msvg.setAttribute('viewBox', '0 0 ' + GS * CELLS + ' ' + GS * CELLS);
    var INK = '#1B1B1B', PUR = '#B04BE8', GRN = '#9EE04A', GRY = '#C9C4B4';
    var rect = function (x0, y0, x1, y1, color, out) {
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++)
        if (y === y0 || y === y1 || x === x0 || x === x1) out.push([x, y, color]);
    };
    var fill = function (x0, y0, x1, y1, color, out) {
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) out.push([x, y, color]);
    };
    // estado A: celular com post (coração) e legenda
    var A = [];
    rect(7, 1, 16, 22, INK, A);
    fill(10, 3, 13, 3, INK, A);
    fill(11, 20, 12, 20, INK, A);
    ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'].forEach(function (row, dy) {
      row.split('').forEach(function (ch, dx) { if (ch === 'X') A.push([8 + dx, 7 + dy, PUR]); });
    });
    fill(9, 15, 14, 15, GRY, A);
    fill(9, 17, 12, 17, GRY, A);
    // estado B: monitor com gráfico subindo
    var B = [];
    rect(1, 2, 22, 16, INK, B);
    fill(10, 17, 13, 18, INK, B);
    fill(7, 19, 16, 19, INK, B);
    [[4, 2], [7, 3], [10, 5], [13, 7], [16, 10]].forEach(function (b) {
      fill(b[0], 15 - b[1], b[0] + 1, 14, GRN, B);
    });
    fill(19, 4, 20, 5, PUR, B);
    var order = function (p, q) { return p[1] - q[1] || p[0] - q[0]; };
    A.sort(order); B.sort(order);
    var N = Math.max(A.length, B.length);
    var pad = function (L) { var out = L.slice(); var k = 0; while (out.length < N) { var src = L[(k * 7) % L.length]; out.push([src[0], src[1], src[2], true]); k++; } return out; };
    A = pad(A); B = pad(B);
    var dotsM = [];
    for (var i = 0; i < N; i++) {
      var c = document.createElementNS(NSM, 'circle');
      c.setAttribute('r', GS * 0.38);
      c.style.setProperty('--dl', ((i * 37) % 23) * 0.018 + 's');
      msvg.appendChild(c); dotsM.push(c);
    }
    // brilhinhos em volta
    [[0, 0, GRN, '0s'], [22, 21, PUR, '1.2s']].forEach(function (s) {
      [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]].forEach(function (o) {
        var c = document.createElementNS(NSM, 'circle');
        c.setAttribute('cx', (s[0] + o[0]) * GS - GS); c.setAttribute('cy', (s[1] + o[1]) * GS - GS);
        c.setAttribute('r', GS * 0.3); c.setAttribute('fill', s[2]); c.setAttribute('class', 'sp');
        c.style.setProperty('--tw', s[3]);
        msvg.appendChild(c);
      });
    });
    var show = function (L, isB) {
      morph.classList.toggle('is-b', isB);
      L.forEach(function (p, i) {
        var c = dotsM[i];
        c.style.transform = 'translate(' + (p[0] * GS + GS / 2) + 'px,' + (p[1] * GS + GS / 2) + 'px)';
        c.style.fill = p[2];
        c.style.opacity = p[3] ? 0 : 1;
      });
    };
    show(A, false);
    if (!reduce) {
      var mstate = false, mtimer = null;
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !mtimer) {
          mtimer = setInterval(function () { mstate = !mstate; show(mstate ? B : A, mstate); }, 3200);
        } else if (!en[0].isIntersecting && mtimer) {
          clearInterval(mtimer); mtimer = null;
        }
      }, { threshold: 0.3 }).observe(morph);
    }
  }
  /* ---------- programa: título com a mesma altura do texto ao lado ---------- */
  var sh = document.querySelector('.split-head');
  if (sh) {
    var st = sh.querySelector('.title'), sp = sh.querySelector('.prose');
    var fitTitle = function () {
      if (window.innerWidth <= 860) { st.style.removeProperty('--fit'); return; }
      // sobe o tamanho do título até a altura dele alcançar a do texto
      var best = 32, bestDiff = Infinity;
      for (var F = 32; F <= 96; F += 1) {
        st.style.setProperty('--fit', F + 'px');
        var diff = st.offsetHeight - sp.offsetHeight;
        if (Math.abs(diff) < bestDiff) { bestDiff = Math.abs(diff); best = F; }
        if (diff >= 0) break;
      }
      st.style.setProperty('--fit', best + 'px');
    };
    var fitT = null;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitTitle);
    window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitTitle, 120); });
  }
  /* ---------- fecho: kokinha atravessando a linha ---------- */
  var cross = document.querySelector('.cross');
  var heroIcon = document.querySelector('.crt__icon svg');
  if (cross && heroIcon) {
    var csvg = cross.querySelector('.cross__svg');
    var NSC = 'http://www.w3.org/2000/svg', CG = 16, CCOLS = 27, CROWS = 17, LINE = 13;
    csvg.setAttribute('viewBox', '0 0 ' + CCOLS * CG + ' ' + CROWS * CG);
    var mk = function (x, y, r, cls) {
      var c = document.createElementNS(NSC, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r); c.setAttribute('class', cls);
      csvg.appendChild(c); return c;
    };
    // campo de bolinhas: cinza à esquerda, verde à direita, linha pontilhada no meio
    for (var ry = 0; ry < CROWS; ry++) for (var rx = 0; rx < CCOLS; rx++) {
      var cx0 = rx * CG + CG / 2, cy0 = ry * CG + CG / 2;
      if (rx === LINE) { if (ry % 2 === 0) mk(cx0, cy0, 2.6, 'line'); }
      else mk(cx0, cy0, 2, rx < LINE ? 'f-old' : 'f-new');
    }
    var lineX = LINE * CG + CG / 2;
    // kokinha: mesma grade do ícone do hero, em escala menor
    var src = Array.prototype.slice.call(heroIcon.querySelectorAll('circle'));
    var kdots = [], KW = 10, KTOP = 2;
    src.forEach(function (s) {
      var col = Math.round((+s.getAttribute('cx') - 35) / 69.5), row = Math.round((+s.getAttribute('cy') - 35) / 69.5);
      var d = mk(0, KTOP * CG + row * CG + CG / 2, CG * 0.42, 'k old');
      if (s.classList.contains('eye')) d.classList.add('eye');
      kdots.push({ el: d, col: col });
    });
    var startCol = 0.5, endCol = LINE + 2.5;
    var placeK = function (pos) { // pos = coluna da borda esquerda da kokinha
      kdots.forEach(function (k) {
        var x = (pos + k.col) * CG + CG / 2;
        k.el.setAttribute('cx', x.toFixed(1));
        var isNew = x > lineX;
        if (isNew !== k.el.classList.contains('new')) { k.el.classList.toggle('new', isNew); k.el.classList.toggle('old', !isNew); }
      });
    };
    var blinkK = function () {
      kdots.forEach(function (k) {
        if (k.el.classList.contains('eye') && k.el.animate)
          k.el.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)' }, { transform: 'scaleY(1)' }], { duration: 220 });
      });
    };
    if (reduce) { placeK(endCol); }
    else {
      placeK(startCol);
      var running = false, raf = null, t0 = 0, timers = [];
      var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
      var cycle = function () {
        placeK(startCol);
        timers.push(setTimeout(function () {
          t0 = performance.now();
          var walk = function (now) {
            var t = Math.min((now - t0) / 2600, 1);
            placeK(startCol + (endCol - startCol) * ease(t));
            if (t < 1) raf = requestAnimationFrame(walk);
            else {
              timers.push(setTimeout(blinkK, 350));
              timers.push(setTimeout(blinkK, 1500));
              timers.push(setTimeout(function () { if (running) cycle(); }, 3200));
            }
          };
          raf = requestAnimationFrame(walk);
        }, 900));
      };
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !running) { running = true; cycle(); }
        else if (!en[0].isIntersecting && running) {
          running = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = []; placeK(startCol);
        }
      }, { threshold: 0.3 }).observe(cross);
    }
  }

  /* ---------- álbum de depoimentos ---------- */
  (function () {
    var album = document.querySelector('.album'); if (!album) return;
    var track = album.querySelector('.chats');
    var cards = [].slice.call(track.children);
    var dots = [].slice.call(album.querySelectorAll('.album__dots i'));
    var count = album.querySelector('.album__count b');
    var prev = album.querySelector('[data-dir="-1"]'), next = album.querySelector('[data-dir="1"]');
    function step() { return cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; }
    function update() {
      var i = Math.round(track.scrollLeft / step());
      var end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (end) i = cards.length - 1;
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      count.textContent = ('0' + (i + 1)).slice(-2);
      prev.disabled = track.scrollLeft < 4; next.disabled = end;
    }
    [prev, next].forEach(function (b) {
      b.addEventListener('click', function () { track.scrollBy({ left: step() * +b.dataset.dir }); });
    });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { track.scrollBy({ left: step() }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { track.scrollBy({ left: -step() }); e.preventDefault(); }
    });
    /* arrastar com o mouse no computador */
    var down = false, x0 = 0, s0 = 0;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; x0 = e.clientX; s0 = track.scrollLeft; track.classList.add('is-drag'); });
    window.addEventListener('pointermove', function (e) { if (down) track.scrollLeft = s0 - (e.clientX - x0); });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false; track.classList.remove('is-drag');
      track.scrollTo({ left: Math.round(track.scrollLeft / step()) * step() });
    });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- FAQ: abrir uma pergunta fecha a anterior ---------- */
  var qas = [].slice.call(document.querySelectorAll('details.qa'));
  qas.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) qas.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
