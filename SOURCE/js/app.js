/* Showroom - CH5 demo panel (mockup). Plain JavaScript, no framework.
   Runs on its own (simulation). When a processor answers on digital join 1, the same controls
   send and follow joins (see _READ-ME.txt for the join map). */
(function () {
  'use strict';

  // ---------- helpers ----------
  function h(sel) {
    var p = sel.split('.'), e = document.createElement(p[0] || 'div');
    if (p.length > 1) e.className = p.slice(1).join(' ');
    for (var i = 1; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (k) { add(e, k); });
    else if (c.nodeType) e.appendChild(c);
    else if (typeof c === 'object') {
      for (var k in c) {
        if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), c[k]);
        else e.setAttribute(k, c[k]);
      }
    } else e.appendChild(document.createTextNode(c));
  }
  var IC = {
    back: '<path d="M15 5l-7 7 7 7"/>', up: '<path d="M5 15l7-7 7 7"/>', down: '<path d="M5 9l7 7 7-7"/>',
    stop: '<rect x="7" y="7" width="10" height="10"/>', minus: '<path d="M5 12h14"/>', plus: '<path d="M5 12h14M12 5v14"/>',
    play: '<path d="M8 5l11 7-11 7z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    next: '<path d="M6 5l9 7-9 7zM18 5v14"/>', prev: '<path d="M18 5l-9 7 9 7zM6 5v14"/>',
    theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
    home: '<rect x="5" y="5" width="14" height="14"/><path d="M12 15V9M9.5 11.5L12 9l2.5 2.5"/>',
    power: '<path d="M12 4v7M7.5 6.5a7 7 0 1 0 9 0"/>',
    living: '<path class="ln" pathLength="1" d="M22 110v-26a10 10 0 0 1 20 0v14h70V84a10 10 0 0 1 20 0v26zM42 98V70a8 8 0 0 1 8-8h54a8 8 0 0 1 8 8v28M30 110v10M124 110v10M77 62v36"/><path class="ln" pathLength="1" d="M150 120V62M139 62l4-14h14l4 14z"/><path class="lum" d="M139 62l4-14h14l4 14z"/><path class="lum soft" d="M139 62h22l9 58h-48z"/>',
    dining: '<path class="ln" pathLength="1" d="M30 92h110M42 92v40M128 92v40M85 20v26M63 62a22 16 0 0 1 44 0zM56 132v-24h-8M114 132v-24h8"/><path class="lum" d="M63 62a22 16 0 0 1 44 0z"/><path class="lum soft" d="M63 62h44l24 30H39z"/>',
    bedroom: '<path class="ln" pathLength="1" d="M26 126V58M26 100h118v26M144 100V86a10 10 0 0 0-10-10H26M40 76V66a6 6 0 0 1 6-6h26a6 6 0 0 1 6 6v10M26 118h118"/><path class="ln" pathLength="1" d="M126 22v20M119 49a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><circle class="lum" cx="126" cy="49" r="7"/><circle class="lum soft" cx="126" cy="49" r="26"/>',
    cinema: '<path class="ln" pathLength="1" d="M24 34h122v62H24zM40 136v-14a8 8 0 0 1 16 0v14zM77 136v-14a8 8 0 0 1 16 0v14zM114 136v-14a8 8 0 0 1 16 0v14zM24 110h122"/><rect class="lum" x="24" y="34" width="122" height="62"/>'
  };
  function ico(n, big) {
    var s = document.createElement('span');
    s.innerHTML = '<svg viewBox="0 0 ' + (big ? '170 170' : '24 24') + '">' + IC[n] + '</svg>';
    return s.firstChild;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var qs = new URLSearchParams(location.search);

  // ---------- data ----------
  function L(n, v) { return { n: n, v: v, t: v }; }
  function S(n, p, sheer) { return { n: n, p: p, t: p, sheer: sheer }; }
  function C(set, temp) { return { set: set, temp: temp, mode: 0, fan: 3, hum: 47 }; }
  var MODES = ['Cool', 'Fan', 'Auto', 'Off'], FANS = ['Low', 'Medium', 'High', 'Auto'];
  var STD = [{ n: 'Bright', v: [100, 100, 100, 100, 100] }, { n: 'Relax', v: [45, 60, 30, 50, 40] },
             { n: 'Evening', v: [15, 35, 0, 30, 25] }, { n: 'Off', v: [0, 0, 0, 0, 0] }];
  var SRC = [{ n: 'Streamer', t: 'Slow Tide', s: 'Northern Rooms' }, { n: 'Radio', t: 'Evening Jazz', s: 'Live radio' },
             { n: 'TV', t: 'Living room TV', s: 'Audio from the screen' }, { n: 'AirPlay', t: 'Ready to connect', s: 'Choose this room on your phone' }];
  var CSRC = [{ n: 'Movie server', t: 'The Long Horizon', s: '4K · Dolby Atmos' }, { n: 'Apple TV', t: 'Apple TV', s: '4K · Dolby Vision' },
              { n: 'Satellite', t: 'Live sport', s: 'HD · Stereo' }, { n: 'Console', t: 'Game console', s: '4K · 120 Hz' }];
  var ROOMS = [
    { id: 'living', name: 'Living', tabs: ['Lights', 'Shades', 'Climate', 'Media'], sc: STD, scene: -1,
      lights: [L('Chandelier', 70), L('Cove', 45), L('Downlights', 60), L('Floor lamp', 0), L('Art wall', 30)],
      shades: [S('Sheer', 100, 1), S('Blackout', 100)], cl: C(22.5, 23.4), md: { src: 0, play: false, vol: 35, pos: 0.2 } },
    { id: 'dining', name: 'Dining', tabs: ['Lights', 'Shades', 'Climate', 'Media'], sc: STD, scene: -1,
      lights: [L('Pendant', 0), L('Cove', 0), L('Downlights', 0), L('Sideboard', 0)],
      shades: [S('Sheer', 60, 1), S('Drape', 100)], cl: C(23, 23.8), md: { src: 1, play: false, vol: 25, pos: 0.5 } },
    { id: 'bedroom', name: 'Master Bedroom', tabs: ['Lights', 'Shades', 'Climate', 'Media'], sc: STD, scene: -1,
      lights: [L('Bedside left', 20), L('Bedside right', 20), L('Cove', 30), L('Downlights', 0), L('Dressing', 0)],
      shades: [S('Sheer', 0, 1), S('Blackout', 40), S('Skylight', 0)], cl: C(21.5, 21.9), md: { src: 0, play: false, vol: 20, pos: 0.7 } },
    { id: 'cinema', name: 'Cinema', tabs: ['Cinema', 'Lights', 'Climate'], scene: -1,
      sc: [{ n: 'Welcome', v: [60, 70, 40, 80] }, { n: 'Movie', v: [0, 8, 0, 15] }, { n: 'Intermission', v: [30, 40, 15, 60] }, { n: 'Off', v: [0, 0, 0, 0] }],
      lights: [L('Sconces', 60), L('Cove', 70), L('Star ceiling', 40), L('Step lights', 80)],
      shades: [], cl: C(21, 21.6), md: { src: 0, play: false, vol: 45, pos: 0.05 }, cin: { on: false, step: 0, wide: false } }
  ];

  // ---------- Crestron bridge (plain joins; room base = 100, 200, 300, 400) ----------
  var live = false, CR = window.CrComLib;
  function base(r) { return (r + 1) * 100; }
  function txA(j, v) { if (live) CR.publishEvent('n', String(j), Math.round(v)); }
  function txD(j) { if (live) { CR.publishEvent('b', String(j), true); CR.publishEvent('b', String(j), false); } }
  function bridge() {
    if (!CR || !CR.subscribeState || qs.get('sim')) return;
    CR.subscribeState('b', '1', function (v) { live = !!v; refresh(); });
    ROOMS.forEach(function (rm, r) {
      var B = base(r);
      rm.lights.forEach(function (l, i) { CR.subscribeState('n', String(B + 1 + i), function (v) { if (live) { l.v = l.t = v / 655.35; dirty = true; } }); });
      rm.shades.forEach(function (s, i) { CR.subscribeState('n', String(B + 21 + i), function (v) { if (live) { s.p = s.t = v / 655.35; dirty = true; } }); });
      CR.subscribeState('n', String(B + 41), function (v) { if (live && v) { rm.cl.set = v / 10; dirty = true; } });
      CR.subscribeState('n', String(B + 42), function (v) { if (live && v) { rm.cl.temp = v / 10; dirty = true; } });
    });
  }

  // ---------- actions ----------
  function setLight(r, i, v) { var l = ROOMS[r].lights[i]; l.v = l.t = v; ROOMS[r].scene = -1; txA(base(r) + 1 + i, v * 655.35); }
  function scene(r, k) {
    var rm = ROOMS[r]; rm.scene = k; txD(base(r) + 1 + k);
    rm.lights.forEach(function (l, i) { l.t = rm.sc[k].v[i]; });
  }
  function shade(r, i, cmd) { var s = ROOMS[r].shades[i]; s.t = cmd === 0 ? 100 : cmd === 2 ? 0 : s.p; txD(base(r) + 21 + i * 3 + cmd); }
  function setpoint(r, v) { var c = ROOMS[r].cl; c.set = clamp(Math.round(v * 2) / 2, 16, 30); txA(base(r) + 41, c.set * 10); }
  function avg(rm) { return rm.lights.reduce(function (a, l) { return a + l.v; }, 0) / rm.lights.length; }
  var seqT = [];
  function cinema(on) {
    var rm = ROOMS[3], c = rm.cin; seqT.forEach(clearTimeout); seqT = []; txD(base(3) + (on ? 71 : 72));
    if (!on) { c.on = false; c.step = 0; c.wide = false; rm.md.play = false; scene(3, 0); return; }
    c.on = true; c.step = 0; scene(3, 1);
    [600, 2200, 3800, 5000].forEach(function (ms, i) {
      seqT.push(setTimeout(function () { c.step = i + 1; if (i === 2) c.wide = true; if (i === 3) rm.md.play = true; refresh(); }, ms));
    });
  }

  // ---------- live updates ----------
  var ups = [], dirty = false;
  function refresh() { for (var i = 0; i < ups.length; i++) ups[i](); }
  function tick() {
    var ch = dirty; dirty = false;
    ROOMS.forEach(function (rm) {
      rm.lights.forEach(function (l) { if (l.v !== l.t) { var d = l.t - l.v; l.v = Math.abs(d) < 3 ? l.t : l.v + (d > 0 ? 3 : -3); ch = true; } });
      rm.shades.forEach(function (s) { if (s.p !== s.t) { var d = s.t - s.p; s.p = Math.abs(d) < 1.1 ? s.t : s.p + (d > 0 ? 1.1 : -1.1); ch = true; } });
      if (!live && rm.cl.mode !== 3 && Math.abs(rm.cl.temp - rm.cl.set) > 0.05) { rm.cl.temp += rm.cl.temp < rm.cl.set ? 0.004 : -0.004; ch = true; }
      if (rm.md.play) { rm.md.pos = (rm.md.pos + 0.0004) % 1; ch = true; }
    });
    if (ch) refresh();
  }

  // ---------- components ----------
  function slider(get, set) {
    var fill = h('div.sl-fill'), th = h('div.sl-th'), el = h('div.sl', h('div.sl-line'), fill, th), drag = false;
    function at(e) { var b = el.getBoundingClientRect(); set(clamp(Math.round((e.clientX - b.left) / b.width * 100), 0, 100)); refresh(); }
    el.addEventListener('pointerdown', function (e) { drag = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} at(e); });
    el.addEventListener('pointermove', function (e) { if (drag) at(e); });
    el.addEventListener('pointerup', function () { drag = false; });
    el.addEventListener('pointercancel', function () { drag = false; });
    ups.push(function () {
      var v = get(); fill.style.width = v + '%'; th.style.left = v + '%';
      th.style.boxShadow = '0 0 ' + (6 + v * 0.26) + 'px ' + (v * 0.05) + 'px rgba(var(--glow),' + (v / 100 * 0.6) + ')';
    });
    return el;
  }
  function row(name, get, set, unit) {
    var val = h('div.v');
    ups.push(function () { val.textContent = Math.round(get()) + (unit || '%'); });
    return h('div.row', h('div.n', name), slider(get, set), val);
  }
  function tile(label, isOn, fn, cls) {
    var b = h('button.tile' + (cls || ''), label, { onclick: function () { fn(); refresh(); } });
    ups.push(function () { b.classList.toggle('on', !!isOn()); });
    return b;
  }
  function ibtn(icon, fn, cls) { return h('button.ib' + (cls || ''), ico(icon), { onclick: function () { fn(); refresh(); } }); }

  // ---------- room tabs ----------
  function tLights(r) {
    var rm = ROOMS[r], orb = h('div.orb'), big = h('div.big');
    ups.push(function () {
      var a = avg(rm); big.textContent = Math.round(a) + '%';
      orb.style.background = 'rgba(var(--glow),' + (a / 100) + ')';
      orb.style.boxShadow = '0 0 ' + (a * 0.7) + 'px ' + (a * 0.12) + 'px rgba(var(--glow),' + (a / 100 * 0.55) + ')';
    });
    return h('div.cols',
      h('div.col', { style: 'flex:1.5' }, h('h3', 'Lutron lighting'),
        rm.lights.map(function (l, i) { return row(l.n, function () { return l.v; }, function (v) { setLight(r, i, v); }); })),
      h('div.col', { style: 'flex:none;width:400px' },
        h('button.orbt', orb, h('div', h('div.cap', 'Room level'), big),
          { onclick: function () { scene(r, avg(rm) > 1 ? 3 : 0); refresh(); } }),
        h('h3', 'Scenes'),
        h('div.grid', rm.sc.map(function (s, k) { return tile(s.n, function () { return rm.scene === k; }, function () { scene(r, k); }); }))));
  }
  function tShades(r) {
    var rm = ROOMS[r];
    return h('div.shades', rm.shades.map(function (s, i) {
      var fab = h('div.fab' + (s.sheer ? '.sheer' : '')), pc = h('span');
      ups.push(function () { fab.style.height = (100 - s.p) + '%'; pc.textContent = s.p >= 99.5 ? 'Open' : s.p <= 0.5 ? 'Closed' : Math.round(s.p) + '% open'; });
      return h('div.sh', h('div.win', fab), h('div.hd', h('b', s.n), pc),
        h('div.bt', [['up', 0], ['stop', 1], ['down', 2]].map(function (c) {
          return h('button.tile', ico(c[0]), { onclick: function () { shade(r, i, c[1]); refresh(); } });
        })));
    }));
  }
  function tClimate(r) {
    var c = ROOMS[r].cl, R = 170, CI = 2 * Math.PI * R, NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 400 400');
    svg.innerHTML = '<g transform="rotate(135 200 200)"><circle cx="200" cy="200" r="' + R + '" stroke-opacity=".18" stroke-dasharray="' + CI * 0.75 + ' ' + CI + '"/>' +
      '<circle class="arc" cx="200" cy="200" r="' + R + '" stroke-width="2.5"/></g><circle class="kn" r="9" fill="currentColor" stroke="none"/>';
    var arc = svg.querySelector('.arc'), kn = svg.querySelector('.kn');
    var sp = h('div.sp'), rt = h('b'), hu = h('b'), el = h('div.dial', svg), drag = false;
    function at(e) {
      var b = el.getBoundingClientRect(), a = Math.atan2(e.clientY - b.top - b.height / 2, e.clientX - b.left - b.width / 2) * 180 / Math.PI;
      a = (a - 135 + 720) % 360; if (a > 270) a = a > 315 ? 0 : 270;
      setpoint(r, 16 + a / 270 * 14); refresh();
    }
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.ib')) return;
      var b = el.getBoundingClientRect(), d = Math.hypot(e.clientX - b.left - b.width / 2, e.clientY - b.top - b.height / 2) / (b.width / 2);
      if (d < 0.68 || d > 1.05) return; drag = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} at(e);
    });
    el.addEventListener('pointermove', function (e) { if (drag) at(e); });
    el.addEventListener('pointerup', function () { drag = false; });
    el.addEventListener('pointercancel', function () { drag = false; });
    ups.push(function () {
      var f = (c.set - 16) / 14, a = (135 + f * 270) * Math.PI / 180, off = c.mode === 3;
      arc.setAttribute('stroke-dasharray', CI * 0.75 * f + ' ' + CI);
      kn.setAttribute('cx', 200 + R * Math.cos(a)); kn.setAttribute('cy', 200 + R * Math.sin(a));
      el.style.opacity = off ? 0.35 : 1; sp.textContent = c.set.toFixed(1) + '°';
      rt.textContent = c.temp.toFixed(1) + ' °C'; hu.textContent = c.hum + ' %';
    });
    add(el, [h('div.mid', h('div.cap', 'Set point'), sp, h('div.cap', '°C')),
      h('div.pm', ibtn('minus', function () { setpoint(r, c.set - 0.5); }), ibtn('plus', function () { setpoint(r, c.set + 0.5); }))]);
    return h('div.climate',
      h('div.side', h('h3', 'Room'), h('div.stat', h('span.cap', 'Temperature'), rt), h('div.stat', h('span.cap', 'Humidity'), hu)),
      el,
      h('div.side', h('h3', 'Mode'),
        h('div.grid', MODES.map(function (m, k) { return tile(m, function () { return c.mode === k; }, function () { c.mode = k; txD(base(r) + 41 + k); }, '.sm'); })),
        h('h3', { style: 'margin-top:30px' }, 'Fan'),
        h('div.grid', FANS.map(function (m, k) { return tile(m, function () { return c.fan === k; }, function () { c.fan = k; txD(base(r) + 45 + k); }, '.sm'); }))));
  }
  function transport(r) {
    var m = ROOMS[r].md, pl = h('button.ib.pl', { onclick: function () { m.play = !m.play; txD(base(r) + (m.play ? 61 : 62)); refresh(); } });
    ups.push(function () { pl.classList.toggle('on', m.play); pl.textContent = ''; pl.appendChild(ico(m.play ? 'pause' : 'play')); });
    return h('div.trans', ibtn('prev', function () { m.pos = 0; txD(base(r) + 63); }), pl, ibtn('next', function () { m.pos = 0; txD(base(r) + 64); }));
  }
  function volume(r) { var m = ROOMS[r].md; return row('Volume', function () { return m.vol; }, function (v) { m.vol = v; txA(base(r) + 51, v * 655.35); }, ' '); }
  function sources(r, list) {
    var m = ROOMS[r].md;
    return h('div.grid.g4', list.map(function (s, k) { return tile(s.n, function () { return m.src === k; }, function () { m.src = k; m.pos = 0; txD(base(r) + 51 + k); }, '.sm'); }));
  }
  function tMedia(r) {
    var m = ROOMS[r].md, ti = h('div.ti'), su = h('div.su'), pr = h('i');
    ups.push(function () { ti.textContent = SRC[m.src].t; su.textContent = SRC[m.src].s; pr.style.width = m.pos * 100 + '%'; });
    return h('div.cols', h('div.col', { style: 'padding:0 110px' },
      h('div.np', h('div.cap', 'Now playing'), ti, su, h('div.prog', pr)),
      h('h3', 'Sources'), sources(r, SRC), transport(r), volume(r)));
  }
  function tCinema(r) {
    var rm = ROOMS[r], c = rm.cin, m = rm.md, s1 = h('div.s1'), s2 = h('div.s2'), scr = h('div.scr', h('div.mk.t'), h('div.mk.b'), s1, s2);
    var steps = ['Lights to movie scene', 'Projector on', 'Screen masking to 2.39:1', 'Audio ready · playing'].map(function (t) { return h('div', h('b'), t); });
    var go = h('button.tile.go', { onclick: function () { cinema(!c.on); refresh(); } });
    ups.push(function () {
      var on = c.on && c.step >= 2;
      scr.classList.toggle('on', on); scr.classList.toggle('wide', c.wide);
      s1.textContent = on ? CSRC[m.src].t : 'Screen'; s2.textContent = on ? CSRC[m.src].s : (c.on ? 'Starting' : 'Standby');
      steps.forEach(function (e, i) { e.classList.toggle('ok', c.step > i); });
      go.textContent = c.on ? 'End cinema' : 'Start cinema'; go.classList.toggle('on', c.on);
    });
    return h('div.cols',
      h('div.col', { style: 'flex:1.45' }, scr, h('h3', 'Sources'), sources(r, CSRC),
        h('div.grid', { style: 'margin-top:14px' },
          tile('16:9', function () { return !c.wide; }, function () { c.wide = false; txD(base(r) + 73); }, '.sm'),
          tile('2.39:1 Scope', function () { return c.wide; }, function () { c.wide = true; txD(base(r) + 74); }, '.sm'))),
      h('div.col', h('h3', 'Sequence'), h('div.seq', steps), go, transport(r), volume(r)));
  }
  var TABS = { Lights: tLights, Shades: tShades, Climate: tClimate, Media: tMedia, Cinema: tCinema };

  // ---------- pages ----------
  var view, cur = -1, tab = 0;
  function show(el) {
    var old = view.querySelector('.page.in');
    if (old) { old.classList.remove('in'); setTimeout(function () { old.remove(); }, 450); }
    view.appendChild(el); el.offsetWidth; el.classList.add('in'); refresh();
  }
  function pRooms() {
    var hr = new Date().getHours(), sub = h('div.cap');
    function house(on) {
      txD(on ? 12 : 11);
      ROOMS.forEach(function (rm, r) { if (rm.cin && rm.cin.on) cinema(false); scene(r, on ? (rm.cin ? 0 : 1) : 3); });
    }
    ups.push(function () {
      var n = ROOMS.filter(function (rm) { return avg(rm) > 0.5; }).length;
      sub.textContent = n ? n + (n === 1 ? ' room lit' : ' rooms lit') : 'All lights off';
    });
    var head = h('div.gh', h('div', h('div.hi', hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'), sub),
      h('div.gb', h('button.pill', 'Welcome', { onclick: function () { house(true); refresh(); } }),
        h('button.pill', 'All off', { onclick: function () { house(false); refresh(); } })));
    return h('div.page', h('div.gw', head, h('div.rooms', ROOMS.map(function (rm, r) {
      var st = h('div.st'), c = rm.cin, pw = h('button.ib', { onclick: function () {
        if (c) cinema(!c.on); else scene(r, avg(rm) > 1 ? 3 : 1); refresh(); } });
      var ctl = h('div.ctl', slider(function () { return avg(rm); }, function (v) { rm.lights.forEach(function (l, i) { setLight(r, i, v); }); }), pw,
        { onclick: function (e) { e.stopPropagation(); } });
      var card = h('div.rc' + (c ? '.cin' : ''), h('div.art', ico(rm.id, 1)),
        h('div.meta', h('div.cap', '0' + (r + 1)), h('div.nm', rm.name), st, ctl), { onclick: function () { go(r); }, style: '--i:' + r });
      var was = null;
      ups.push(function () {
        var n = rm.lights.filter(function (l) { return l.v > 0; }).length, a = avg(rm) / 100, scr = c && c.on && c.step >= 2 ? 1 : 0;
        st.textContent = (c && c.on ? (scr ? 'Now showing' : 'Starting') : n ? n + (n === 1 ? ' light on' : ' lights on') : 'Lights off') + ' · ' + rm.cl.temp.toFixed(1) + '°';
        card.style.setProperty('--lv', c ? scr : Math.min(1, a * 1.6)); card.style.setProperty('--gl', c ? Math.max(a, scr) : Math.min(1, a * 1.6));
        var on = c ? c.on : a > 0.01; if (on !== was) { was = on; pw.textContent = ''; pw.appendChild(ico(c ? (on ? 'stop' : 'play') : 'power')); pw.classList.toggle('on', on); }
      });
      return card;
    }))));
  }
  function pRoom(r) {
    var rm = ROOMS[r], body = h('div.body'), tabs = rm.tabs.map(function (t, k) {
      return h('button.tab' + (k === tab ? '.on' : ''), t, { onclick: function () { tab = k; go(r, true); } });
    });
    body.appendChild(TABS[rm.tabs[tab]](r));
    return h('div.page', h('div.tabs', tabs), body);
  }
  var crumb, backB;
  function go(r, keepTab) {
    ups = ups.slice(0, fixedUps); cur = r; if (!keepTab) tab = 0;
    crumb.textContent = ''; add(crumb, r < 0 ? 'Rooms' : [h('i', 'Rooms  /  '), ROOMS[r].name]);
    backB.classList.toggle('hide', r < 0);
    show(r < 0 ? pRooms() : pRoom(r));
  }

  // ---------- shell ----------
  var stage = document.getElementById('stage'), fixedUps = 0, opening, idleT;
  function theme(t) {
    stage.setAttribute('data-theme', t); document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('showroom-theme', t); } catch (e) {}
  }
  function flip() { theme(stage.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
  function fit() {
    var s = Math.min(innerWidth / 1280, innerHeight / 800);
    stage.style.transform = 'scale(' + s + ')';
  }
  function showOpening() { opening.classList.remove('up', 'intro'); opening.offsetWidth; opening.classList.add('intro'); }
  function enter() {
    opening.classList.add('up'); view.style.setProperty('--d', '.8s'); go(-1);
    setTimeout(function () { view.style.setProperty('--d', '0s'); }, 3000);
  }

  // ---------- demo mode: a ghost finger walks through the GUI; any real touch takes over ----------
  var ghost, capt, demoB, tour = { on: false, t: [], loop: false, cut: 0 };
  function later(fn, ms) { tour.t.push(setTimeout(fn, ms)); }
  function ramp(ms, fn) { for (var k = 1; k <= 30; k++) (function (k) { later(function () { fn(k / 30); refresh(); if (tour.follow) point(tour.follow); }, ms * k / 30); })(k); }
  function point(sel) {
    var e = typeof sel === 'string' ? stage.querySelector(sel) : sel; if (!e) return null;
    var a = e.getBoundingClientRect(), b = stage.getBoundingClientRect(), k = b.width / 1280;
    ghost.style.left = (a.left + a.width / 2 - b.left) / k + 'px'; ghost.style.top = (a.top + a.height / 2 - b.top) / k + 'px'; return e;
  }
  function dimRoom(r, to, ms) {
    var from = avg(ROOMS[r]);
    ramp(ms, function (t) { var v = from + (to - from) * t; ROOMS[r].lights.forEach(function (l, i) { setLight(r, i, v); }); });
  }
  var STEPS = [
    { sel: '.frame', fn: function () { if (!opening.classList.contains('up')) enter(); else if (cur !== -1) go(-1); }, wait: 3400 },
    { cap: 'Every room at a glance', wait: 1800 },
    { cap: 'Control a room without opening it', sel: '.rc:nth-child(2) .ctl .ib', wait: 2200 },
    { cap: 'Dim from the card', sel: '.rc:nth-child(1) .sl-th', drag: 2700, fn: function () { dimRoom(0, 95, 1000); later(function () { dimRoom(0, 35, 1100); }, 1500); }, wait: 3300 },
    { cap: 'One touch for the whole house', sel: '.pill:nth-child(2)', wait: 2400 },
    { sel: '.pill:nth-child(1)', wait: 2400 },
    { cap: 'Inside a room', sel: '.rc:nth-child(1) .art', wait: 1500 },
    { sel: '.grid .tile:nth-child(3)', wait: 2200 },
    { cap: 'Light or dark', sel: '.top .th', wait: 2200 },
    { cap: 'Shades, live position', sel: '.tab:nth-child(2)', wait: 1200 },
    { sel: '.sh:nth-child(2) .tile:nth-child(3)', wait: 3200 },
    { cap: 'Climate, a turn of the ring', sel: '.tab:nth-child(3)', wait: 1300 },
    { sel: '.dial .kn', drag: 1500, fn: function () { var c = ROOMS[cur < 0 ? 0 : cur].cl, a = c.set; ramp(1400, function (t) { setpoint(cur < 0 ? 0 : cur, a + (20 - a) * t); }); }, wait: 2600 },
    { cap: 'Back to the rooms', sel: '.top .bk', wait: 2400 },
    { cap: 'Cinema, one button', sel: '.rc:nth-child(4) .art', wait: 1500 },
    { sel: '.go', fn: function () { cinema(true); }, wait: 7000 },
    { cap: 'Your turn', sel: '.top .th', wait: 2600 },
    { cap: '', sel: '.top .hm', wait: 3000 }
  ];
  function tourStop() { tour.on = false; tour.follow = null; ghost.classList.remove('dn', 'drag'); tour.t.forEach(clearTimeout); tour.t = []; ghost.classList.remove('on'); capt.classList.remove('on'); }
  function tourToggle(loop) { if (Date.now() - tour.cut < 500) return; if (tour.on) tourStop(); else tourStart(loop); refresh(); }
  function tourStart(loop) {
    tourStop(); tour.on = true; tour.loop = loop; ghost.classList.add('on'); var i = 0;
    if (ROOMS[3].cin.on) cinema(false);
    (function next() {
      if (!tour.on) return; idle();
      var st = STEPS[i++];
      if (!st) { if (tour.loop) later(function () { tourStart(true); }, 6000); else { tourStop(); refresh(); } return; }
      if (st.cap) { capt.textContent = st.cap; capt.classList.add('on'); } else if (st.cap === '') capt.classList.remove('on');
      var e = st.sel && point(st.sel);
      later(function () {
        if (e) { ghost.classList.add('dn'); later(function () { ghost.classList.remove('dn', 'drag'); tour.follow = null; }, st.drag || 200); }
        if (st.drag) { ghost.classList.add('drag'); tour.follow = st.sel; }
        if (st.fn) st.fn(); else if (e) e.click();
        refresh(); later(next, st.wait || 1500);
      }, e ? 850 : 0);
    })();
  }
  var attT;
  function idle() {   // 3 min without a touch: back to the opening; 20 s later the tour starts by itself and loops (showroom attract)
    clearTimeout(idleT); clearTimeout(attT);
    idleT = setTimeout(function () {
      showOpening();
      attT = setTimeout(function () { if (!tour.on) { tourStart(true); refresh(); } }, 20000);
    }, 180000);
  }
  function start() {
    var saved = null; try { saved = localStorage.getItem('showroom-theme'); } catch (e) {}
    theme(qs.get('theme') || saved || 'light');
    var clk = h('div.clock'), otime = h('div.time'), lv = h('div.live', h('b'), h('span'));
    function time() {
      var d = new Date(), t = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      clk.textContent = t; otime.textContent = t + '   ·   ' + d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    }
    crumb = h('div.crumb'); backB = ibtn('back', function () { go(-1); }, '.bk');
    view = h('div.view');
    opening = h('div.open', otime,
      h('div.frame', h('div.mark', 'THE\u00a0SHOWROOM'.split('').map(function (ch, k) { return h('span', ch, { style: '--k:' + k }); })), h('div.hl'), h('div.cap', 'Home automation  ·  Mockup')),
      h('div.hint', ico('up'), h('div.cap', 'Swipe up or tap to enter')),
      h('button.ib', ico('theme'), { onclick: function (e) { e.stopPropagation(); flip(); } }),
      h('button.pill', 'Play demo', { onclick: function (e) { e.stopPropagation(); tourToggle(true); } }));
    ghost = h('div.ghost'); capt = h('div.capt'); demoB = h('button.ib.dm', { onclick: function () { tourToggle(true); } });
    var y0 = null;
    opening.addEventListener('pointerdown', function (e) { y0 = e.clientY; });
    opening.addEventListener('pointerup', function (e) {
      if (e.target.closest('.ib,.pill') || y0 === null) return;
      if (y0 - e.clientY > -10) enter();
      y0 = null;
    });
    add(stage, [h('div.top', backB, crumb, h('div.sp'), lv, clk, demoB, ibtn('theme', flip, '.th'), ibtn('home', showOpening, '.hm')), view, opening, capt, ghost]);
    ups.push(function () { lv.classList.toggle('on', live); lv.lastChild.textContent = live ? 'Live' : 'Sim'; });
    ups.push(function () { if (demoB._on !== tour.on) { demoB._on = tour.on; demoB.textContent = ''; demoB.appendChild(ico(tour.on ? 'stop' : 'play')); demoB.classList.toggle('on', tour.on); } });
    addEventListener('pointerdown', function (e) { if (e.isTrusted && tour.on) { tourStop(); tour.cut = Date.now(); refresh(); } }, true);
    fixedUps = ups.length;
    time(); setInterval(time, 5000); setInterval(tick, 50);
    fit(); addEventListener('resize', fit);
    ['pointerdown', 'pointermove'].forEach(function (ev) { addEventListener(ev, idle, { passive: true }); }); idle();
    bridge(); go(-1); showOpening();
    if (qs.get('enter')) opening.classList.add('up');
    if (qs.get('demo')) setTimeout(function () { tourStart(true); }, 1500);
    if (qs.get('room')) { cur = +qs.get('room'); tab = +(qs.get('tab') || 0); go(cur, true); }
    window.__showroom = { cinema: cinema, scene: scene, refresh: refresh };
  }
  start();
})();
