/* ==========================================================
   Abraham Wood — site behaviour
   1. Marquee content
   2. Step grid
   3. Web Audio groove (synthesised kick / snare / hat)
   4. Canvas waveform
   ========================================================== */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. marquee ---------- */

  var CREDITS = [
    'Mariners Church',
    'Matt Redman',
    'Scott Cunningham',
    '12+ churches &amp; camps',
    'Ableton Live',
    'Playback',
    'Prime',
    'Nashville number charts',
    'Session drums',
    'Bass',
    'Music direction'
  ];

  var mq = document.getElementById('mq');
  if (mq) {
    var run = CREDITS.map(function (c) {
      return '<span>' + c + '</span><b>&#9679;</b>';
    }).join('');
    mq.innerHTML = run + run; // duplicated so the -50% loop is seamless
  }

  /* ---------- 2. pattern + step grid ---------- */

  // 16 sixteenth-notes. A straight-ahead worship pocket.
  var PATTERN = {
    kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  };

  var stepsEl = document.getElementById('steps');
  var stepEls = [];

  if (stepsEl) {
    for (var i = 0; i < 16; i++) {
      var s = document.createElement('i');
      if (i % 4 === 0) { s.className = 'beat'; }
      stepsEl.appendChild(s);
      stepEls.push(s);
    }
  }

  /* ---------- 3. audio ---------- */

  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var master = null;

  var playing = false;
  var current = 0;
  var nextTime = 0;
  var timer = null;
  var bpm = 92;

  var LOOKAHEAD = 25;      // ms
  var SCHEDULE_AHEAD = 0.1; // s

  var energy = 0; // drives the waveform

  function ensureCtx() {
    if (ctx) { return; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }

  function noiseBuffer() {
    var len = Math.floor(ctx.sampleRate * 0.4);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { data[i] = Math.random() * 2 - 1; }
    return buf;
  }

  var noise = null;

  function kick(t) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.95, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.36);
  }

  function snare(t) {
    if (!noise) { noise = noiseBuffer(); }

    var src = ctx.createBufferSource();
    src.buffer = noise;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    src.connect(hp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.19);

    var o = ctx.createOscillator();
    var og = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, t);
    og.gain.setValueAtTime(0.35, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(og).connect(master);
    o.start(t);
    o.stop(t + 0.12);
  }

  function hat(t) {
    if (!noise) { noise = noiseBuffer(); }
    var src = ctx.createBufferSource();
    src.buffer = noise;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7800;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(hp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.06);
  }

  function schedule(step, t) {
    if (PATTERN.hat[step])   { hat(t); }
    if (PATTERN.kick[step])  { kick(t); }
    if (PATTERN.snare[step]) { snare(t); }

    var delay = Math.max(0, (t - ctx.currentTime) * 1000);
    window.setTimeout(function () {
      paintStep(step);
      if (PATTERN.kick[step])  { energy = Math.max(energy, 1); }
      if (PATTERN.snare[step]) { energy = Math.max(energy, 0.85); }
      if (PATTERN.hat[step])   { energy = Math.max(energy, 0.42); }
    }, delay);
  }

  function paintStep(step) {
    for (var i = 0; i < stepEls.length; i++) {
      if (i === step) { stepEls[i].classList.add('on'); }
      else { stepEls[i].classList.remove('on'); }
    }
  }

  function tick() {
    var secondsPerStep = 60 / bpm / 4; // sixteenths
    while (nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      schedule(current, nextTime);
      nextTime += secondsPerStep;
      current = (current + 1) % 16;
    }
  }

  var playBtn = document.getElementById('playBtn');
  var label = playBtn ? playBtn.querySelector('.t-label') : null;

  function start() {
    ensureCtx();
    if (ctx.state === 'suspended') { ctx.resume(); }
    playing = true;
    current = 0;
    nextTime = ctx.currentTime + 0.06;
    timer = window.setInterval(tick, LOOKAHEAD);
    if (playBtn) { playBtn.setAttribute('aria-pressed', 'true'); }
    if (label) { label.textContent = 'STOP'; }
  }

  function stop() {
    playing = false;
    window.clearInterval(timer);
    timer = null;
    if (playBtn) { playBtn.setAttribute('aria-pressed', 'false'); }
    if (label) { label.textContent = 'PLAY'; }
    for (var i = 0; i < stepEls.length; i++) { stepEls[i].classList.remove('on'); }
  }

  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (playing) { stop(); } else { start(); }
    });
  }

  var bpmInput = document.getElementById('bpm');
  var bpmVal = document.getElementById('bpmVal');

  if (bpmInput) {
    bpmInput.addEventListener('input', function () {
      bpm = parseInt(bpmInput.value, 10);
      if (bpmVal) { bpmVal.textContent = bpm; }
    });
  }

  /* ---------- 4. waveform ---------- */

  var cvs = document.getElementById('wave');
  if (!cvs) { return; }

  var c = cvs.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0;
  var H = 0;

  function size() {
    var r = cvs.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height));
    cvs.width = W * dpr;
    cvs.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(phase) {
    c.clearRect(0, 0, W, H);

    var mid = H / 2;
    var amp = (H / 2 - 4) * (0.16 + energy * 0.84);

    var grad = c.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(240,166,60,0.28)');
    grad.addColorStop(0.5, 'rgba(240,166,60,0.95)');
    grad.addColorStop(1, 'rgba(240,166,60,0.28)');

    c.beginPath();
    for (var x = 0; x <= W; x += 2) {
      var n = x / W;
      var env = Math.sin(n * Math.PI); // taper at both ends
      var y = mid
        + Math.sin(n * 15 + phase) * amp * 0.5 * env
        + Math.sin(n * 34 - phase * 1.7) * amp * 0.28 * env
        + Math.sin(n * 7 + phase * 0.6) * amp * 0.22 * env;
      if (x === 0) { c.moveTo(x, y); } else { c.lineTo(x, y); }
    }
    c.strokeStyle = grad;
    c.lineWidth = 1.6;
    c.lineJoin = 'round';
    c.stroke();

    // centre line
    c.beginPath();
    c.moveTo(0, mid);
    c.lineTo(W, mid);
    c.strokeStyle = 'rgba(255,255,255,0.06)';
    c.lineWidth = 1;
    c.stroke();
  }

  var phase = 0;

  function frame() {
    phase += playing ? 0.075 : 0.012;
    energy *= 0.94;
    if (!playing && energy < 0.08) { energy = 0.08; }
    draw(phase);
    window.requestAnimationFrame(frame);
  }

  size();
  window.addEventListener('resize', function () { size(); draw(phase); });

  if (reduced) {
    energy = 0.35;
    draw(0);
  } else {
    energy = 0.12;
    frame();
  }
})();
