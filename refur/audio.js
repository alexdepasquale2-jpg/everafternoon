/* REFUR sound. Synth stand-ins, replaced by assets/sfx/<name>.ogg|wav when those files load. */
(function (root) {
  "use strict";
  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var files = {};
  var musicEls = { day: null, dusk: null };
  var musicMode = "off";
  var wantMode = "off";
  var soundOn = true;
  var musicOn = true;
  var drone = null;
  var unlocked = false;

  function ac() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    var len = ctx.sampleRate * 1;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function unlock() {
    var c = ac();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    unlocked = true;
    var mode = wantMode;
    musicMode = "off";
    if (mode && mode !== "off") setMusic(mode);
  }

  function env(t, peak, dur, dest) {
    var g = ctx.createGain();
    g.connect(dest || master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }

  function osc(type, freq, t, dur, peak, slide) {
    var o = ctx.createOscillator();
    var g = env(t, peak, dur);
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(t, dur, peak, freq, q) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var g = env(t, peak, dur);
    var node = src;
    if (freq) {
      var f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq;
      f.Q.value = q || 0.7;
      src.connect(f);
      node = f;
    }
    node.connect(g);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  var SYNTH = {
    engine_clack: function (t) {
      noise(t, 0.09, 0.22, 1800, 0.6);
      osc("square", 420, t, 0.07, 0.08, 180);
    },
    engine_stamp: function (t) {
      osc("sine", 90, t, 0.35, 0.28, 48);
      noise(t, 0.12, 0.18, 400, 0.5);
    },
    engine_groan: function (t) {
      osc("sawtooth", 196, t, 0.7, 0.06, 70);
      osc("sine", 98, t, 0.8, 0.1, 50);
    },
    plant: function (t) {
      noise(t, 0.08, 0.2, 900, 1);
      osc("triangle", 520, t, 0.09, 0.08, 220);
    },
    pop: function (t) {
      osc("sine", 620, t, 0.18, 0.16, 140);
      noise(t, 0.1, 0.12, 1200, 0.4);
    },
    boots: function (t) {
      noise(t, 0.05, 0.16, 220, 0.8);
      noise(t + 0.12, 0.05, 0.12, 180, 0.8);
    },
    cloth: function (t) {
      noise(t, 0.22, 0.08, 1400, 0.4);
    },
    rope: function (t) {
      osc("triangle", 880, t, 0.16, 0.08, 220);
      osc("square", 1400, t, 0.05, 0.04, 400);
    },
    steal: function (t) {
      noise(t, 0.16, 0.14, 2000, 0.5);
      osc("sine", 990, t, 0.12, 0.06, 330);
    },
    quill: function (t) { osc("square", 1480, t, 0.05, 0.05, 700); },
    sap: function (t) { osc("sine", 240, t, 0.12, 0.08, 140); },
    glint: function (t) {
      osc("sine", 1320, t, 0.12, 0.06);
      osc("triangle", 1760, t + 0.04, 0.1, 0.04);
    },
    burr: function (t) { osc("triangle", 110, t, 0.14, 0.12, 70); },
    water: function (t) { noise(t, 0.18, 0.1, 1600, 0.6); },
    shoo: function (t) {
      noise(t, 0.14, 0.16, 800, 0.4);
      osc("sine", 300, t, 0.12, 0.06, 120);
    },
    card_draw: function (t) { noise(t, 0.07, 0.12, 2400, 0.8); },
    compost: function (t) {
      noise(t, 0.1, 0.12, 500, 0.7);
      osc("triangle", 180, t, 0.1, 0.05, 90);
    },
    score_tick: function (t) { osc("square", 660, t, 0.05, 0.05); },
    wag_fire: function (t) {
      osc("triangle", 523, t, 0.12, 0.07);
      osc("triangle", 659, t + 0.08, 0.12, 0.06);
      osc("sine", 784, t + 0.16, 0.16, 0.06);
    },
    ui_tap: function (t) { osc("square", 740, t, 0.04, 0.04, 500); },
    tick: function (t) { noise(t, 0.02, 0.05, 3000, 1.2); }
  };

  function play(name) {
    if (!soundOn || !unlocked) return;
    if (files[name]) {
      var a = new Audio(files[name]);
      a.volume = 0.55;
      a.play().catch(function () {});
      return;
    }
    if (!ctx || !SYNTH[name]) return;
    SYNTH[name](ctx.currentTime);
  }

  function blip(freq) {
    if (!soundOn || !unlocked || !ctx) return;
    osc("square", freq, ctx.currentTime, 0.06, 0.05);
  }

  function playTick(freqMul) {
    if (!musicOn || !unlocked || !ctx) return;
    osc("square", 1800, ctx.currentTime, 0.015, 0.02);
    if (freqMul && freqMul > 1) osc("square", 900, ctx.currentTime, 0.02, 0.015);
  }

  function ensureDrone() {
    if (drone || !ctx) return;
    var g = ctx.createGain();
    g.gain.value = 0;
    g.connect(master);
    var oscs = [];
    for (var i = 0; i < 4; i++) {
      var o = ctx.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      var og = ctx.createGain();
      og.gain.value = i === 0 ? 0.55 : 0.22;
      if (i === 3) o.detune.value = 8;
      o.connect(og);
      og.connect(g);
      o.start();
      oscs.push(o);
    }
    drone = { gain: g, oscs: oscs, acc: 0, chord: 0, tick: 0 };
  }

  var CHORDS = [
    [146.83, 174.61, 220.0, 148.5],
    [174.61, 220.0, 261.63, 176.2]
  ];

  function pump(dt) {
    if (!ctx || !musicOn || !unlocked) {
      if (drone) drone.gain.gain.setTargetAtTime(0.0001, ctx ? ctx.currentTime : 0, 0.05);
      return;
    }
    if (musicMode === "off") {
      if (drone) drone.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      return;
    }
    if (musicEls[musicMode === "dusk" ? "dusk" : "day"]) return;
    ensureDrone();
    drone.gain.gain.setTargetAtTime(musicMode === "title" ? 0.045 : 0.07, ctx.currentTime, 0.2);
    var step = musicMode === "dusk" ? 2.3 : 5.4;
    drone.acc += dt;
    if (drone.acc >= step) {
      drone.acc = 0;
      drone.chord = 1 - drone.chord;
    }
    var chord = CHORDS[drone.chord];
    for (var i = 0; i < 4; i++) {
      drone.oscs[i].frequency.setTargetAtTime(chord[i], ctx.currentTime, 0.08);
    }
    var tickEvery = musicMode === "dusk" ? 0.28 : 0.62;
    drone.tick += dt;
    if (drone.tick >= tickEvery) {
      drone.tick = 0;
      SYNTH.tick(ctx.currentTime);
    }
  }

  function stopFileMusic() {
    ["day", "dusk"].forEach(function (k) {
      var el = musicEls[k];
      if (!el) return;
      el.pause();
    });
  }

  function setMusic(mode) {
    wantMode = mode;
    if (!musicOn) mode = "off";
    if (mode === musicMode) return;
    stopFileMusic();
    musicMode = mode;
    if (mode === "off" || !unlocked) return;
    var key = mode === "dusk" ? "dusk" : "day";
    var src = files[key === "dusk" ? "music_dusk" : "music_day"];
    if (!src) return;
    if (!musicEls[key]) {
      var a = new Audio(src);
      a.loop = true;
      a.volume = 0.4;
      musicEls[key] = a;
    }
    musicEls[key].play().catch(function () {});
  }

  function setEnabled(sound, music) {
    soundOn = !!sound;
    musicOn = !!music;
    if (!musicOn) {
      stopFileMusic();
      if (drone && ctx) drone.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
      musicMode = "off";
    } else if (wantMode !== "off") {
      musicMode = "off";
      setMusic(wantMode);
    }
  }

  function loadOne(name) {
    function probe(ext) {
      return new Promise(function (resolve) {
        var url = "assets/sfx/" + name + "." + ext;
        var a = new Audio();
        var done = false;
        function finish(ok) {
          if (done) return;
          done = true;
          a.src = "";
          resolve(ok ? url : null);
        }
        a.preload = "auto";
        a.addEventListener("canplaythrough", function () { finish(true); }, { once: true });
        a.addEventListener("error", function () { finish(false); }, { once: true });
        a.src = url;
        setTimeout(function () { finish(false); }, 2500);
      });
    }
    return probe("ogg").then(function (url) {
      if (url) return url;
      return probe("wav");
    }).then(function (url) {
      if (url) files[name] = url;
    });
  }

  var NAMES = [
    "engine_clack", "engine_stamp", "engine_groan", "plant", "pop", "boots", "cloth",
    "rope", "steal", "quill", "sap", "glint", "burr", "water", "shoo", "card_draw",
    "compost", "score_tick", "wag_fire", "ui_tap", "music_day", "music_dusk"
  ];

  function loadAll() {
    return Promise.all(NAMES.map(loadOne));
  }

  root.RefurAudio = {
    unlock: unlock,
    play: play,
    blip: blip,
    pump: pump,
    setMusic: setMusic,
    setEnabled: setEnabled,
    loadAll: loadAll,
    names: NAMES
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
