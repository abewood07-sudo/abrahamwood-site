/* ==========================================================
   Abraham Wood — site behaviour
   1. Marquee content
   ========================================================== */

(function () {
  'use strict';

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
})();
