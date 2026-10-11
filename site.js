(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var handlers = {};
  var FORM_URL = 'https://formspree.io/f/xyekpdao';
  function send(data) {
    return fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navigacija */
  var nav = $('#nav'), logo = $('[data-logo]'), scrolled = null;
  function onNav() {
    var s = window.scrollY > 30;
    if (s === scrolled || !nav) return;
    scrolled = s;
    nav.style.padding = s ? '12px clamp(20px,4vw,56px)' : '26px clamp(20px,4vw,56px)';
    nav.style.background = s ? 'rgba(253,251,247,.94)' : 'transparent';
    if (logo) logo.style.height = s ? '44px' : '64px';
  }
  var menu = $('#mob-menu');
  handlers.toggleMenu = function (e, el) { if (!menu) return; menu.hidden = !menu.hidden; el.setAttribute('aria-expanded', String(!menu.hidden)); };
  handlers.closeMenu = function () { if (menu) menu.hidden = true; };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) menu.hidden = true; });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && handlers[a.dataset.act]) handlers[a.dataset.act](e, a);
  });

  /* Animacije pojavljivanja (sadržaj je u HTML-u; skripta ga samo animira) */
  var pending = [];
  if (!reduce) {
    var ease = 'cubic-bezier(.2,.7,.2,1)';
    var prep = function (sel, hide, show, dur) {
      return $$(sel).map(function (el) { el.style.transition = dur + 's ' + ease; Object.assign(el.style, hide); el._show = show; return el; });
    };
    var els = [].concat(
      prep('[data-rise]', { transform: 'translateY(105%)' }, { transform: 'none' }, 1.2),
      prep('[data-reveal]', { opacity: '0', transform: 'translateY(30px)' }, { opacity: '1', transform: 'none' }, 1.1),
      prep('[data-clip]', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }, 1.4),
      prep('[data-draw]', { strokeDasharray: '1', strokeDashoffset: '1' }, { strokeDashoffset: '0' }, 1.6)
    );
    els.forEach(function (el) { if (el.dataset.draw !== undefined) el.style.transitionDelay = '700ms'; });
    pending = els.map(function (el) { return { el: el, probe: el.dataset.rise !== undefined ? el.parentElement : el }; });
  }
  function checkReveal() {
    var vh = window.innerHeight;
    pending = pending.filter(function (p) {
      var r = p.probe.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        if (p.el.dataset.delay) p.el.style.transitionDelay = p.el.dataset.delay + 'ms';
        Object.assign(p.el.style, p.el._show);
        return false;
      }
      return true;
    });
  }

  /* Paralaksa i kartice */
  var bun = $('[data-ref="bunRef"]');
  var heroImg = $('[data-ref="heroImgRef"]');
  var cards = ['card0', 'card1', 'card2'].map(function (k) { return $('[data-ref="' + k + '"]'); });
  function onScroll() {
    onNav();
    checkReveal();
    var y = window.scrollY, vh = window.innerHeight;
    if (reduce) return;
    if (bun && y < vh * 1.5) bun.style.transform = 'translateY(' + (y * 0.18) + 'px) rotate(' + (y * 0.06) + 'deg) scale(' + (1 + y * 0.0003) + ')';
    if (heroImg) { var r = heroImg.parentElement.getBoundingClientRect(); heroImg.style.transform = 'translateY(' + ((r.top / vh) * -8) + '%)'; }
    cards.forEach(function (c, i) {
      var next = cards[i + 1];
      if (!c || !next) return;
      var p = Math.min(1, Math.max(0, 1 - (next.getBoundingClientRect().top - c.getBoundingClientRect().top) / (vh * 0.7)));
      c.style.transform = 'scale(' + (1 - p * 0.06) + ')';
      c.style.filter = 'brightness(' + (1 - p * 0.18) + ')';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  requestAnimationFrame(function () { requestAnimationFrame(onScroll); });

  /* Početna: forma za upit i porudžbinu */
  var form = $('#kontakt-form');
  if (form) {
    var P_ORDER = 'npr. 200 burger lepinja L, 100 kifli XL - isporuka u petak, adresa…';
    var P_INQ = 'npr. Kolika je cena po komadu za 500 lepinja nedeljno? Da li dostavljate za Beograd i okolne gradove? Koja je minimalna količina za porudžbinu?';
    var type = 'order';
    var setType = function (t) {
      type = t;
      var ob = $('[data-act="setOrder"]', form), ib = $('[data-act="setInquiry"]', form);
      ob.style.background = t === 'order' ? '#3E2723' : 'transparent'; ob.style.color = t === 'order' ? '#FDFBF7' : '#3E2723';
      ib.style.background = t === 'inquiry' ? '#3E2723' : 'transparent'; ib.style.color = t === 'inquiry' ? '#FDFBF7' : '#3E2723';
      ob.setAttribute('aria-pressed', String(t === 'order')); ib.setAttribute('aria-pressed', String(t === 'inquiry'));
      $('#f-msg-label').textContent = t === 'order' ? 'Šta poručujete' : 'Vaše pitanje';
      form.elements.msg.placeholder = t === 'order' ? P_ORDER : P_INQ;
      $('#f-submit').textContent = t === 'order' ? 'Pošalji porudžbinu' : 'Pošalji upit';
    };
    handlers.setOrder = function () { setType('order'); };
    handlers.setInquiry = function () { setType('inquiry'); };
    if (new URLSearchParams(location.search).get('upit')) setType('inquiry');
    form.addEventListener('input', function () { $('#f-err').hidden = true; $('#f-sent').hidden = true; $('#f-fail').hidden = true; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, n = f.name.value.trim(), c = f.company.value.trim(), p = f.phone.value.trim(), m = f.msg.value.trim();
      if (!n || !c || !p) { $('#f-err').hidden = false; return; }
      var btn = $('#f-submit'), label = btn.textContent;
      $('#f-fail').hidden = true; btn.disabled = true; btn.textContent = 'Šaljem…';
      send({ _subject: (type === 'order' ? 'Porudžbina' : 'Upit') + ' - ' + c, Tip: type === 'order' ? 'Porudžbina' : 'Upit', 'Ime i prezime': n, Firma: c, Telefon: p, Poruka: m || ' - ', _gotcha: f._gotcha ? f._gotcha.value : '' })
        .then(function () { form.reset(); setType(type); $('#f-sent').hidden = false; })
        .catch(function () { $('#f-fail').hidden = false; })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  /* Ponuda: veličina, količina, porudžbina */
  if ($('[data-pick]')) {
    var GRAMS = { M: 60, L: 95, XL: 120, XXL: 140 };
    var NAMES = { burger: 'Burger lepinje', kifla: 'Kifle' };
    var sel = { burger: 'L', kifla: 'L' }, qty = { burger: 50, kifla: 50 }, order = [], ft;
    var ON = { bg: 'linear-gradient(160deg,#4A2E28 0%,#2C1A1D 100%)', ink: '#FDFBF7', sub: '#E2C08B', tf: 'perspective(500px) rotateX(0deg) translateY(5px)', sh: 'inset 0 1px 0 rgba(255,255,255,.12),0 2px 0 #1C1012,0 3px 0 #120A0B,0 8px 14px -8px rgba(44,26,29,.6)' };
    var OFF = { bg: 'linear-gradient(160deg,#FFFDF8 0%,#F1E4D2 100%)', ink: '#2C1A1D', sub: '#9A6B33', tf: 'perspective(500px) rotateX(10deg)', sh: 'inset 0 1px 0 rgba(255,255,255,.9),inset 0 -2px 0 rgba(154,107,51,.12),0 6px 0 #D9C3A3,0 8px 0 #C4A57C,0 18px 26px -10px rgba(62,39,35,.45)' };
    var paint = function (p) {
      $$('[data-pick^="' + p + ':"]').forEach(function (b) {
        var on = b.dataset.pick.split(':')[1] === sel[p], v = on ? ON : OFF;
        b.style.background = v.bg; b.style.boxShadow = v.sh; b.style.transform = v.tf;
        b.children[1].style.color = v.ink; b.children[2].style.color = v.sub;
        b.setAttribute('aria-pressed', String(on));
      });
    };
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]');
      if (b) { var ps = b.dataset.pick.split(':'); sel[ps[0]] = ps[1]; paint(ps[0]); return; }
      var rm = e.target.closest('[data-rm]');
      if (rm) { order.splice(+rm.dataset.rm, 1); renderCart(); }
    });
    var step = function (p, d) { qty[p] = Math.max(10, qty[p] + d); $('[data-qty="' + p + '"]').textContent = qty[p] + ' kom'; };
    var add = function (p, btn) {
      var size = sel[p], q = qty[p];
      var i = order.findIndex(function (o) { return o.p === p && o.size === size; });
      if (i >= 0) order[i].qty += q; else order.push({ p: p, size: size, qty: q });
      renderCart();
      btn.textContent = 'Dodato ✓';
      clearTimeout(ft); ft = setTimeout(function () { $$('[data-act$="Add"]').forEach(function (x) { x.textContent = 'Dodaj u porudžbinu'; }); }, 1400);
    };
    ['burger', 'kifla'].forEach(function (p) {
      handlers[p + 'Minus'] = function () { step(p, -10); };
      handlers[p + 'Plus'] = function () { step(p, 10); };
      handlers[p + 'Add'] = function (e, el) { add(p, el); };
    });
    var renderCart = function () {
      var total = order.reduce(function (a, o) { return a + o.qty; }, 0);
      $('#cart-total').textContent = total + ' kom';
      $('#cart-empty').hidden = order.length > 0;
      $('#cart-items').innerHTML = order.map(function (o, i) {
        return '<div style="display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:16px;padding:18px 0;border-bottom:1px solid rgba(62,39,35,.12)">' +
          '<div><div style="font-family:\'DM Serif Display\',serif;font-size:22px;line-height:1.1">' + NAMES[o.p] + '</div><div style="font-size:12px;font-weight:600;letter-spacing:.12em;color:#9A6B33;margin-top:4px">' + o.size + ' · ' + GRAMS[o.size] + ' g</div></div>' +
          '<span style="white-space:nowrap;font-family:\'DM Serif Display\',serif;font-size:22px">× ' + o.qty + '</span>' +
          '<button type="button" data-rm="' + i + '" aria-label="Ukloni" class="rm-btn" style="width:34px;height:34px;border:1px solid rgba(62,39,35,.3);border-radius:50%;background:none;color:#3E2723;font-size:16px;cursor:pointer">×</button></div>';
      }).join('');
    };

    var cf = $('#cart-form');
    cf.addEventListener('input', function () { $('#cart-err').hidden = true; $('#cart-fail').hidden = true; $('#cart-sent').hidden = true; });
    handlers.cartSend = function (e, btn) {
      var v = function (k) { return $('[name="' + k + '"]', cf).value.trim(); };
      if (!order.length || !v('name') || !v('company') || !v('phone') || !v('address')) { $('#cart-err').hidden = false; return; }
      var list = order.map(function (o) { return '- ' + NAMES[o.p] + ' ' + o.size + ' (' + GRAMS[o.size] + ' g) × ' + o.qty + ' kom'; }).join('\n');
      $('#cart-fail').hidden = true; btn.disabled = true; btn.textContent = 'Šaljem…';
      send({ _subject: 'Porudžbina - ' + v('company'), Tip: 'Porudžbina (korpa)', Stavke: list, 'Ukupno komada': order.reduce(function (a, o) { return a + o.qty; }, 0), 'Ime i prezime': v('name'), Firma: v('company'), Telefon: v('phone'), 'Adresa isporuke': v('address'), _gotcha: v('_gotcha') })
        .then(function () { order = []; renderCart(); $$('input', cf).forEach(function (i) { i.value = ''; }); $('#cart-sent').hidden = false; })
        .catch(function () { $('#cart-fail').hidden = false; })
        .then(function () { btn.disabled = false; btn.textContent = 'Poruči'; });
    };

    var jump = function () {
      var h = location.hash.slice(1); if (!h) return;
      var el = document.getElementById(h); if (!el) return;
      if (el.tagName === 'ARTICLE' && window.innerWidth < 900 && el.children[1]) el = el.children[1];
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'instant' });
    };
    requestAnimationFrame(function () { requestAnimationFrame(jump); });
    setTimeout(jump, 400);
  }

  /* Radionica: galerija */
  var track = $('[data-gal-track]');
  if (track) handlers.gal = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-gal]');
    if (!b || !track) return;
    var s = track.querySelector('figure');
    track.scrollBy({ left: (+b.dataset.gal) * ((s ? s.offsetWidth : 300) + 12), behavior: 'smooth' });
  });

  /* Ponuda: kombi */
  var stage = $('[data-van-stage]');
  if (stage) {
    var van = $('[data-van]', stage), road = $('[data-road]', stage);
    if (!reduce && van.animate) van.style.transform = 'translateX(-130%)';
    var go = function () {
      if (reduce || !van.animate) { van.style.transform = 'none'; return; }
      van.animate([{ transform: 'translateX(-130%)' }, { transform: 'translateX(4%)', offset: .8 }, { transform: 'translateX(0)' }], { duration: 2600, easing: 'cubic-bezier(.22,.8,.26,1)', fill: 'forwards' });
      $$('[data-wheel]', stage).forEach(function (w) { w.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 700, iterations: Infinity }); });
      road.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '-110px 0' }], { duration: 380, iterations: Infinity });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); io.disconnect(); } }, { threshold: .35 });
      io.observe(stage);
    } else go();
  }
})();
