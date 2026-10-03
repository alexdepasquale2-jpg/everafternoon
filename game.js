/* The Everafternoon — a small story game about the first shadow.
   Plain script (no modules) so it runs from file:// as well as a server.
   Everything is drawn with Phaser Graphics; no image files. */
(function () {
'use strict';

// ---------------------------------------------------------------- constants
const W = 960, H = 800, HORIZON = 470;
const BASE_Y = 578, STEM = 80, BUD_X = 540;
const SUN = { x: 240, y: 195, r: 88 };
const COL = {
  sky: 0x87cefa, grass: 0x50be46, sunFill: 0xffdc28, sunEdge: 0xf5be00, ray: 0xffc800,
  eye: 0x3c2814, cheek: 0xff9678, cloud: 0xffffff, stem: 0x1e781e, leaf: 0x289628,
  center: 0xffd200, bud: 0x5ab4ff, shadow: 0x5d655d, rain: 0x4f93d8
};
const FLOWERS = [
  { id: 'orange', x: 330, color: 0xff8c00 },
  { id: 'pink',   x: 450, color: 0xff5a96 },
  { id: 'white',  x: 630, color: 0xffffff },
  { id: 'purple', x: 795, color: 0xb464ff }
];
const HOURS = ['Twelve', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven'];
const TRAIT_NAME = { sunny: 'Sunny', rainy: 'Rainy', rooted: 'Rooted' };
const TRAIT_COLOR = { sunny: '#c47800', rainy: '#2f6fb0', rooted: '#2b7a2f' };
const FONT = '"Trebuchet MS", "Segoe UI", Verdana, "DejaVu Sans", sans-serif';

const SPEAKERS = {
  '':        { name: '',            color: '#7a6a4a' },
  rayling:   { name: 'Rayling',     color: '#d08a00' },
  ray:       { name: 'Ray',         color: '#e0a000' },
  orange:    { name: 'Orange',      color: '#ff7a00' },
  pink:      { name: 'Pink',        color: '#ff4f8e' },
  white:     { name: 'White',       color: '#8b8f99' },
  purple:    { name: 'Purple',      color: '#9b4fe8' },
  greenfolk: { name: 'The Greenfolk', color: '#24852a' },
  hush:      { name: 'Hush',        color: '#6f8fae' },
  drift:     { name: 'Drift',       color: '#4f98cf' },
  puff:      { name: 'A Puff',      color: '#8a96a3' },
  dice:      { name: 'Two dice',    color: '#b08400' }
};

// ---------------------------------------------------------------- helpers
const params = new URLSearchParams(location.search);
const FAST = params.has('fast');
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = params.has('seed') ? mulberry32(parseInt(params.get('seed'), 10) || 1) : Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function lerpColor(a, b, t) {
  t = clamp(t, 0, 1);
  const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const hourIdx = m => Math.floor(m / 60) % 12;
function timeWords(m) {
  m = Math.round(m / 5) * 5;
  const h = Math.floor(m / 60) % 12, mm = m % 60, Hn = HOURS[h], N = HOURS[(h + 1) % 12];
  return ({ 0: `${Hn} o'clock`, 5: `five past ${Hn}`, 10: `ten past ${Hn}`, 15: `quarter past ${Hn}`, 20: `twenty past ${Hn}`,
    25: `twenty-five past ${Hn}`, 30: `half past ${Hn}`, 35: `twenty-five to ${N}`, 40: `twenty to ${N}`, 45: `quarter to ${N}`,
    50: `ten to ${N}`, 55: `five to ${N}` })[mm];
}

// ---------------------------------------------------------------- state
let S = null;
function freshState(traits) {
  return {
    traits: Object.assign({ sunny: 1, rainy: 1, rooted: 1 }, traits || {}),
    petals: 5, sky: 0, blush: 4,
    gw: { orange: 0, pink: 0, white: 0, purple: 0 },
    flags: {}, min: 4 * 60 + 20, slipUsed: false, pending: null,
    rayHour: 'Four', rayNext: 'Five', route: null, ending: null, rolls: []
  };
}
function fill(text) {
  if (!S) return text;
  return text
    .replace(/\{time\}/g, timeWords(S.min))
    .replace(/\{Time\}/g, cap(timeWords(S.min)))
    .replace(/\{Hour\}/g, HOURS[hourIdx(S.min)])
    .replace(/\{Next\}/g, HOURS[(hourIdx(S.min) + 1) % 12])
    .replace(/\{RayHour\}/g, S.rayHour)
    .replace(/\{RayNext\}/g, S.rayNext);
}
const gwSum = () => S.gw.orange + S.gw.pink + S.gw.white + S.gw.purple;
function skyWords(v) {
  if (v <= -4) return 'flooding'; if (v <= -2) return 'drizzly'; if (v === -1) return 'a bit damp';
  if (v === 0) return 'just right'; if (v === 1) return 'a bit warm'; if (v <= 3) return 'hot'; return 'scorching';
}
function blushWords(v) {
  if (v <= 0) return 'pale'; if (v <= 2) return 'faintly pink'; if (v <= 4) return 'pink';
  if (v <= 6) return 'rosy'; if (v <= 8) return 'red'; return 'burning';
}

// ---------------------------------------------------------------- sound (WebAudio, optional)
const Snd = {
  ctx: null, master: null, ok: true,
  muted: (function () { try { return localStorage.getItem('ea_muted') === '1'; } catch (e) { return false; } })(),
  ensure() {
    if (this.ctx || !this.ok) return this.ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.ok = false; return null; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ok = false; this.ctx = null; }
    return this.ctx;
  },
  resume() { const c = this.ensure(); if (c && c.state === 'suspended') { try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } } },
  setMuted(m) { this.muted = m; try { localStorage.setItem('ea_muted', m ? '1' : '0'); } catch (e) { /* ignore */ } if (this.master) this.master.gain.value = m ? 0 : 0.55; },
  live() { return !!(this.ctx && !this.muted && this.ctx.state === 'running'); },
  tone(freq, dur, type, vol, delay, toFreq) {
    if (!this.live()) return;
    try {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* ignore */ }
  },
  noise(dur, vol, type, freq, delay, freqTo, attack) {
    if (!this.live()) return;
    try {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq || 800, t);
      if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
      const g = c.createGain(); const a = attack || 0.01;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master); src.start(t); src.stop(t + dur + 0.05);
    } catch (e) { /* ignore */ }
  },
  chime(base) { const b = base || 1318.5; this.tone(b, 1.6, 'sine', 0.07); this.tone(b * 2.01, 1.0, 'sine', 0.025); this.tone(b * 1.5, 1.2, 'triangle', 0.02, 0.06); },
  sigh() { this.noise(1.5, 0.09, 'lowpass', 900, 0, 260, 0.6); },
  rain() { for (let i = 0; i < 14; i++) this.noise(0.05, 0.05, 'highpass', 2500 + Math.random() * 2500, i * 0.09 + Math.random() * 0.05); },
  whisper() { this.noise(0.5, 0.025, 'bandpass', 4200, 0, 6000, 0.15); },
  click(delay) { this.tone(700 + Math.random() * 300, 0.04, 'square', 0.03, delay || 0); },
  pop() { this.tone(620, 0.25, 'sine', 0.12, 0, 180); },
  sprout() { this.tone(330, 0.9, 'sine', 0.08, 0, 880); this.chime(1046.5); },
  good() { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.06, i * 0.09)); },
  meh() { this.tone(784, 0.4, 'sine', 0.05); this.tone(698, 0.5, 'sine', 0.05, 0.12); },
  bad() { this.tone(392, 0.5, 'triangle', 0.06); this.tone(330, 0.7, 'triangle', 0.06, 0.15); },
  baa() { this.tone(520, 0.25, 'triangle', 0.04, 0, 470); }
};
window.addEventListener('pointerdown', () => Snd.resume(), { capture: true });
window.addEventListener('keydown', () => Snd.resume(), { capture: true });

// ---------------------------------------------------------------- the story
// A line is [speaker, text, fx]. fx is a state change object and/or {v: w => visual}.
// A rolled choice has a trait and three outcomes: full (10+), partial (7-9), miss (6-).

function puffIntro(S) {
  if (S.flags.hidden) return [
    ['', `A Puff wanders over and lies down right on top of the spot where your shadow is hidden. It doesn't know why. It just likes it there.`, { v: w => w.puffWalk() }],
    ['', `Then it notices that it's cool. Its wool goes stiff. It is about to rain on exactly the place you're hiding.`, { v: w => w.puffStiff() }],
    ['greenfolk', `—don't—  —don't rain on it—  —it'll show—  —shh, shh—`],
    ['rayling', `It's {time}. Puffs mostly rain at about twenty to. Nobody knows why. I just know when things are.`]
  ];
  return [
    ['', `A Puff wanders down the row the way Puffs do, which is without thinking about it at all.`, { v: w => w.puffWalk() }],
    ['', `It steps into your shadow. Nothing in the Everafternoon has ever been cool before. The Puff stops. Its wool goes stiff. It is about to rain.`, { v: w => w.puffStiff() }],
    ['greenfolk', `—cold—  —it's cold in there—  —is it hurt?—  —it's going to—  —it's going to—`],
    ['rayling', `It's {time}. Puffs mostly rain at about twenty to. Nobody knows why. I just know when things are.`]
  ];
}
function revealIfHidden(S) {
  if (!S.flags.hidden) return [];
  return [['', `The rain flattens the grass, and there it is again: your shadow, gray as ever, in plain sight.`, { unflag: 'hidden', v: w => w.unhideShadow() }]];
}

const PUFF_CHOICES = [
  { trait: 'rooted', text: `Hold perfectly still and let it work out that cold is allowed.`,
    full: { t: [['', `You don't move. Not a petal. The Puff stares at nothing for a while, then folds its legs and lies down in your shadow. It is the first nap anyone has ever taken in the shade.`]], fx: { flag: 'puffNap', gw: { white: 1, pink: 1 }, v: w => w.puffSleep() } },
    partial: { t: [['', `It lies down in the end, but first it sneezes once: one small, surprised shower right on top of you.`]], fx: { sky: -1, flag: 'puffNap', v: w => { w.puffRain(0.8); w.puffSleep(1.0); } } },
    miss: S => ({ t: [['', `You wobble. The Puff bolts and rains the whole way down the row. Your petals take most of it.`], ...revealIfHidden(S)], fx: { sky: -2, petals: -1, v: w => w.puffRain(2.4, true) } }) },
  { trait: 'rainy', text: `Point your leaf up at Hush and Drift, so they'll call it home. (Every leaf in the meadow points at the Clouds. Yours does too.)`,
    full: { t: [['hush', `...there you are... come on up...`], ['', `Hush lets out the long low sigh that Puffs come home to. The Puff floats up off the grass without dropping a single drop.`]], fx: { gw: { pink: 1 }, v: w => w.puffHome() } },
    partial: { t: [['drift', `Oh, is that one ours? I'll get it, I'll— where was I—`], ['', `The Puff goes home, but Drift comes down to fetch it and drizzles on everybody on the way.`]], fx: { sky: -1, v: w => { w.puffHome(); w.cloudRain(1.6); } } },
    miss: S => ({ t: [['drift', `Was that for me? I thought you meant— what were we—`], ['', `Drift comes down far too fast. The Puff panics. Now there are two Clouds and a Puff all raining at once.`], ...revealIfHidden(S)], fx: { sky: -2, petals: -1, v: w => { w.puffRain(2.4); w.cloudRain(2.4); } } }) },
  { trait: 'sunny', text: `Open your center a little, so it sees something warm and yellow right in front of it.`,
    full: { t: [['', `The Puff sees a very small Sun right in front of its nose and forgets to be frightened. It leans on your stem, warm on one side and cool on the other, and seems to like it.`]], fx: { flag: 'puffNap', gw: { orange: 1 }, v: w => w.puffSleep() } },
    partial: { t: [['', `It calms down. Up above, the Sun notices you copying it and blushes so hard the air over the meadow wobbles.`]], fx: { sky: 1, blush: 1, flag: 'puffNap', v: w => w.puffSleep() } },
    miss: S => ({ t: [['', `Too bright, too sudden. The Puff jumps straight up and pours, all over White.`], ['white', `Wet.`], ...revealIfHidden(S)], fx: { sky: -2, gw: { white: -1 }, v: w => w.puffRain(2.4) } }) }
];

function councilEnding(level) {
  const g = gwSum();
  const ok = level === 'full' || (level === 'partial' && g >= 0) || (level === 'miss' && g >= 3);
  if (!ok) return 'end_whisper';
  if (S.sky >= 3) return 'end_shade';
  if (S.sky <= -3) return 'end_puddle';
  if (S.flags.hidden) return 'end_folded';
  return 'end_sundial';
}

const SCENES = {
  intro: {
    lines: () => [
      ['', `In the Everafternoon the light comes from everywhere at once. So nothing has a shadow, and nobody has ever needed a word for one.`],
      ['', `Between Pink and White there has always been a gap. Nobody planted anything there. It was just the place where the row went quiet.`],
      ['', `Then something pushes up out of the dirt in the gap. A stem. One leaf. A small round head, and in the middle of it a yellow that is exactly the Sun's yellow.`, { v: w => w.sprout() }],
      ['', `The Greenfolk stop whispering. All of them at once, across the whole meadow.`, { v: w => w.silence(true) }],
      ['', `Up in the sky, the Sun's cheeks go pinker. It has never seen anything new before.`, { blush: 1 }],
      ['', `And lying on the grass behind you is a flat gray thing the same shape as you. It's cool to the touch. Nobody else has one.`, { v: w => w.showShadow() }],
      ['', `Something small and yellow comes loose from one of the Sun's rays and tumbles all the way down.`, { v: w => w.tumbleRayling() }],
      ['rayling', `Oof. Hello! It's {time}. I just fell off Four. Bits of Four come off sometimes.`],
      ['rayling', `That's yours.`, { v: w => w.raylingHop() }],
      ['rayling', `Where did you get that?`],
      ['', `You don't know. You've been alive for about a minute. At the far end of the row, White is starting to turn its head.`]
    ],
    prompt: 'What do you do first?',
    choices: [
      { text: `Ask the Four Eldest why there was always a gap.`, go: 'eldest', route: 'ask' },
      { text: `Follow your shadow and see where it points.`, go: 'follow', route: 'follow' },
      { text: `Hide it before the White flower calls the council.`, go: 'hide', route: 'hide' }
    ]
  },

  // ------------------------------------------------ route: ask the Eldest
  eldest: {
    lines: () => [
      ['', `You turn your head toward the Eldest. The four of them have stood in this row since the first rain.`],
      ['orange', `Hey. Gap. You're standing in the Gap. I said that first.`],
      ['pink', `Oh, look at you. Is your stem alright? It's leaning. Mine leaned for a while. It's fine now. Is yours fine?`],
      ['white', `That is the gap.`],
      ['purple', `I had a dream about the gap once... it was full of something that was mostly not... and the Sun was facing the other...`],
      ['rayling', `It's {time}, and nobody's ever answered that question. I'd know. I've been here for every {time} there's ever been.`]
    ],
    prompt: 'How do you ask?',
    choices: [
      { trait: 'sunny', text: `Turn your yellow center to Orange and ask out loud, before anybody else can talk.`,
        full: { t: [['orange', `Ha! First! Fine. The Sun and the Clouds made four of us, and then they stopped to look at us. They looked for a long time. The gap is where they stopped.`]], fx: { gw: { orange: 1 }, flag: 'knowStop' } },
        partial: { t: [['orange', `Ha! First! Fine. They made four of us and stopped to look. The gap's where they stopped.`], ['', `Your center catches the light, and the Sun sees a small yellow face looking back at it. Its cheeks burn. The afternoon gets hotter.`]], fx: { sky: 1, blush: 1, gw: { orange: 1 }, flag: 'knowStop' } },
        miss: { t: [['orange', `I GO FIRST.`], ['', `The whole row flinches. A Puff near White's stem startles and rains on everybody.`]], fx: { sky: -2, gw: { orange: -1 }, v: w => w.puffRain(1.8, false, 1) } } },
      { trait: 'rainy', text: `Wait for Pink's leaf to drift close, and ask her quietly.`,
        full: { t: [['pink', `We always left room. Nobody told us to. It just seemed rude to fill it.`], ['', `Pink's leaf touches yours. It reaches exactly this far, and you are exactly this far away.`]], fx: { gw: { pink: 1 }, flag: 'pinkLeaf' } },
        partial: { t: [['pink', `We always left room. It seemed rude to fill it.`], ['', `Hush sees two leaves touching and comes over to look, trailing a little drizzle.`]], fx: { sky: -1, gw: { pink: 1 }, flag: 'pinkLeaf', v: w => w.cloudRain(1.4) } },
        miss: { t: [['', `Pink's leaf reaches out, and stops short. She has never had to reach this far.`], ['pink', `Oh. Oh, I'm sorry, I didn't mean to—`], ['', `She droops. Drift drifts over to cry about it.`]], fx: { sky: -2, gw: { pink: -1 }, v: w => w.cloudRain(2.2) } } },
      { trait: 'rooted', text: `Push a root toward Purple's roots and listen underground, where her dreams get finished.`,
        full: { t: [['purple', `...a flower that was mostly lying down. Gray. Pointing at the bottom of the sky, the flat line. And the line... the line didn't mind.`], ['', `Through the dirt, the dream comes all the way to the end. It's the first one of Purple's anybody has heard finish.`]], fx: { gw: { purple: 1 }, flag: 'purpleDream' } },
        partial: { t: [['purple', `...mostly lying down... gray... pointing at the flat line...`], ['', `You hear most of it before the Greenfolk shiver over your root. The Clouds drift in to see what's moving down there.`]], fx: { sky: -1, gw: { purple: 1 }, flag: 'purpleDream' } },
        miss: { t: [['', `Your root bumps Purple's root, and she wakes up.`], ['purple', `I was nearly at the end of that one...`], ['', `You pulled too hard to get there. A petal lets go.`]], fx: { petals: -1, gw: { purple: -1 } } } }
    ],
    next: 'puff'
  },

  puff: { lines: puffIntro, prompt: 'The Puff is about to rain. What do you do?', choices: PUFF_CHOICES, next: 'council' },

  // ------------------------------------------------ the council (shared)
  council: {
    lines: S => {
      const l = [
        ['', `White doesn't turn its head all the way. It doesn't need to.`, { v: w => w.councilFace() }],
        ['white', `Council. Now.`],
        ['', `The Eldest lean in. A council in the Everafternoon is just everyone facing the same way at the same time.`],
        ['orange', `I say it stays! Or goes. I'll tell you which in a second. But I said it first.`]
      ];
      if (S.gw.pink > 0) l.push(['pink', `It let me touch its leaf. Nobody's leaf has ever reached mine from that side.`]);
      else l.push(['pink', `It's been very polite. Mostly. It hasn't asked us for anything.`]);
      if (S.flags.purpleDream) l.push(['purple', `It's the one from the dream... the lying-down one... I told you all about it, didn't I... or I meant to...`]);
      else l.push(['purple', `It reminds me of a... there was a... no, it's gone.`]);
      l.push(['white', S.flags.hidden ? `Something is cold. Here. Explain.` : `The shadow. Explain.`]);
      l.push(['rayling', `It's {time}. Nobody's ever explained anything at {time}. Good luck!`]);
      return l;
    },
    prompt: S => S.flags.hidden ? 'They haven\'t seen it. Yet.' : 'Everyone is looking at you, and behind you.',
    choices: S => {
      const pinkAnswer = { trait: 'rainy', text: `Lean your leaf toward Pink's and let her answer for you.`,
        full: { t: [['pink', `It's only been here a few minutes, and it's been kind the whole time. It's cool behind it, but that isn't its fault. I think the gap was for it. I think we were saving the room.`]], fx: { gw: { pink: 1, purple: 1 } }, next: (S, l) => councilEnding(l) },
        partial: { t: [['pink', `I think we were saving the room. I think it was for this.`], ['', `Hush drifts closer to listen, and drizzles on the council.`]], fx: { sky: -1, gw: { pink: 1 }, v: w => w.cloudRain(1.4) }, next: (S, l) => councilEnding(l) },
        miss: { t: [['pink', `I think it's... I think... oh. Everyone's looking at me.`], ['', `Pink goes so pink she can't say anything else. Drift feels awful about it, and rains.`]], fx: { sky: -2, v: w => w.cloudRain(2) }, next: (S, l) => councilEnding(l) } };
      if (S.flags.hidden) return [
        { trait: 'rooted', text: `Keep it folded away and say nothing at all.`,
          full: { t: [['', `You say nothing. You think about nothing. The Eldest see a fifth flower, a little blue, a little crooked, perfectly ordinary.`]], fx: { gw: { white: 1 } }, next: (S, l) => councilEnding(l) },
          partial: { t: [['', `You say nothing, but the grass near you can't help itself.`], ['greenfolk', `—cold—  —shh—  —cold, though—`], ['', `White looks at the grass for a long time.`]], fx: { blush: -1 }, next: (S, l) => councilEnding(l) },
          miss: { t: [['', `You say nothing very loudly. A corner of shadow slips out from under you.`, { unflag: 'hidden', v: w => w.unhideShadow() }], ['white', `There.`]], fx: { gw: { white: -1 } }, next: (S, l) => councilEnding(l) } },
        { trait: 'sunny', text: `Unfold it in front of everyone, all at once.`,
          full: { t: [['', `You let it all out at once: long, gray, pointing at the Horizon.`, { v: w => w.unhideShadow() }], ['orange', `Whoa! I saw it first!`], ['purple', `That's the one... the lying-down...`], ['white', `Hm. Brave.`]], fx: { unflag: 'hidden', gw: { white: 1, orange: 1 } }, next: (S, l) => councilEnding(l) },
          partial: { t: [['', `You unfold it, and the Sun, seeing it again, blushes so hard the whole meadow warms up.`, { v: w => w.unhideShadow() }], ['white', `Hm.`]], fx: { unflag: 'hidden', sky: 1, blush: 1 }, next: (S, l) => councilEnding(l) },
          miss: { t: [['', `It snaps out so fast it slaps across White's stem.`, { v: w => w.unhideShadow() }], ['white', `Cold.`], ['white', `Rude.`]], fx: { unflag: 'hidden', gw: { white: -1 } }, next: (S, l) => councilEnding(l) } },
        pinkAnswer
      ];
      return [
        { trait: 'rooted', text: `Hold still and let them watch it turn when the hour turns.`,
          bonus: S => S.flags.sundial ? { n: 1, why: 'you\'ve seen it turn before' } : null,
          full: { t: [['', `You hold still. They watch. The bright Ray changes, and your shadow swings round by one ray's width, all by itself.`, { jumpHour: true }], ['white', `Again.`], ['', `It does it again.`, { jumpHour: true }]], fx: { flag: 'sundial', gw: { white: 1 } }, next: (S, l) => councilEnding(l) },
          partial: { t: [['', `It turns, but slowly, and Orange gets bored and says so. First.`, { jumpHour: true }], ['orange', `Boring! ...Do it again.`]], fx: { flag: 'sundial' }, next: (S, l) => councilEnding(l) },
          miss: { t: [['', `You're so nervous you sway, and the shadow sways with you. It just looks like you're wobbling.`], ['white', `Wobbling.`]], fx: { gw: { white: -1 } }, next: (S, l) => councilEnding(l) } },
        { trait: 'sunny', text: `Speak first, before Orange can.`,
          full: { t: [['', `"It's mine," you say, before Orange can open its mouth. "I don't know where I got it. I'm keeping it."`], ['orange', `HA! It went first! I like it.`], ['', `Orange liking you is most of a council.`]], fx: { gw: { orange: 2 } }, next: (S, l) => councilEnding(l) },
          partial: { t: [['', `You say it first. Orange laughs. The Sun is so pleased with you that it goes hot all over.`]], fx: { sky: 1, blush: 1, gw: { orange: 1 } }, next: (S, l) => councilEnding(l) },
          miss: { t: [['orange', `I'M FIRST.`], ['', `And that's the whole council, more or less.`]], fx: { gw: { orange: -1 } }, next: (S, l) => councilEnding(l) } },
        pinkAnswer
      ];
    }
  },

  // ------------------------------------------------ route: follow the shadow
  follow: {
    lines: () => [
      ['', `You look where the gray thing is looking. It lies across the grass behind you and points away, past White and Purple, toward the bottom edge of the sky.`, { v: w => w.shadowLen(0.55) }],
      ['', `That edge is the Horizon. It is perfectly straight. It has never moved, never been touched, and nobody has ever pointed at it.`],
      ['greenfolk', `—it's on me—  —cool, it's cool—  —do it again—  —where's it going—`],
      ['rayling', `It's {time}. Flowers don't walk, you know. I'm only saying. At {time}.`]
    ],
    prompt: 'Flowers can\'t walk. How do you follow it?',
    choices: [
      { trait: 'rooted', text: `Send one long root out sideways, under the grass, after it.`,
        full: { t: [['', `You can't walk, so you grow. The root goes the whole way through the dirt, and the shadow lies along the top of it like a sleeve.`]], fx: { flag: 'rootRunner', v: w => w.shadowLen(0.78) } },
        partial: { t: [['', `It gets there. But White feels a root slide past its own and goes even stiffer than usual.`], ['white', `Roots. Mine.`]], fx: { flag: 'rootRunner', gw: { white: -1 }, v: w => w.shadowLen(0.75) } },
        miss: { t: [['', `The root goes a little way and stops. You pulled too hard. A petal lets go.`]], fx: { petals: -1, v: w => w.shadowLen(0.62) } } },
      { trait: 'rainy', text: `Ask the Greenfolk to pass a whisper all the way down the shadow. (Grass can't do anything but whisper. It is very good at that.)`,
        full: { t: [['greenfolk', `—edge—  —it goes to the edge—  —touching?—  —nearly touching the line—`], ['', `The whisper comes back from the Horizon one blade at a time. Now you know how far it is.`]], fx: { flag: 'whisperChain', v: w => w.shadowLen(0.75) } },
        partial: { t: [['greenfolk', `—edge—  —nearly at the line—`], ['', `So much whispering at once rustles the Puffs, and they drizzle a little.`]], fx: { sky: -1, flag: 'whisperChain', v: w => { w.shadowLen(0.72); w.puffRain(1.2, true); } } },
        miss: { t: [['greenfolk', `—what—  —what did it say—  —cold—  —COLD—  —it's COLD—`], ['', `Halfway down, the whisper turns into a rumor about how cold you are. The Puffs hear it and rain.`]], fx: { sky: -2, gw: { pink: -1 }, v: w => w.puffRain(2, true) } } },
      { trait: 'sunny', text: `Stretch up tall toward the Sun, so your shadow gets longer.`,
        full: { t: [['', `The Sun sees you reaching for it and its cheeks go hot pink. Your shadow stretches out like a yawn, nearly to the Horizon.`]], fx: { flag: 'stretched', v: w => w.shadowLen(0.82) } },
        partial: { t: [['', `Your shadow stretches. But the Sun is so pleased that the whole afternoon gets hotter, and Orange's edges curl.`], ['orange', `Hot! I noticed that first!`]], fx: { sky: 1, gw: { orange: -1 }, flag: 'stretched', v: w => w.shadowLen(0.8) } },
        miss: { t: [['', `You stretch too far, too fast. Your stem creaks, a petal falls, and the Sun goes red with worry.`]], fx: { petals: -1, sky: 1 } } }
    ],
    next: 'ray'
  },

  ray: {
    enter: S => { S.rayHour = HOURS[hourIdx(S.min)]; S.rayNext = HOURS[(hourIdx(S.min) + 1) % 12]; },
    lines: () => [
      ['', `Twelve Rays go round the Sun, slowly, always. They're the Hours. Only one is bright at a time, and only the bright one can talk.`],
      ['', `Right now, that's {RayHour}.`, { v: w => w.rayFlash() }],
      ['ray', `I'm {RayHour}. I'm bright. Your gray thing moved a little when I lit up. Nothing has ever moved when I lit up.`],
      ['ray', `When I go dim, {RayNext} lights. I think your gray thing will turn for {RayNext} too. I'd like to see. I won't, though. I'll be dim.`],
      ['rayling', `It's {time}. I used to be a bit of {RayHour}. The bit at the end.`]
    ],
    prompt: '{RayHour} is bright, for now.',
    choices: [
      { trait: 'rooted', text: `Stand perfectly still through the turn of the hour, and watch.`,
        full: { t: [['', `{RayNext} lights. {RayHour} dims. Your shadow swings round by exactly one ray's width, and stops. You've just told the time without anyone telling you.`, { jumpHour: true }], ['rayling', `It's {time}! You knew that before I did!`]], fx: { flag: 'sundial' } },
        partial: { t: [['', `It turns, and you see it turn. But standing that still for that long makes your roots ache, and Hush comes over to see why everyone's gone so quiet.`, { jumpHour: true }]], fx: { flag: 'sundial', sky: -1 } },
        miss: { t: [['', `You fidget right at the end. Did it move because of the hour, or because of you? You'll never know. A petal shakes loose.`, { jumpHour: true }]], fx: { petals: -1 } } },
      { trait: 'sunny', text: `Turn your center up and ask {RayHour} to stay bright a little longer.`,
        full: { t: [['ray', `Longer? Nobody's ever wanted more of me.`], ['', `{RayHour} stays lit a moment past its time. In that moment your shadow lies long and still, and you see exactly where it points: one particular spot on the Horizon.`]], fx: { flag: 'spot', v: w => w.shadowLen(0.9) } },
        partial: { t: [['', `{RayHour} stays bright. But the Sun is jealous of all the attention and blushes hot, and the meadow warms.`]], fx: { flag: 'spot', sky: 1, blush: 1, v: w => w.shadowLen(0.88) } },
        miss: { t: [['', `{RayHour} flares, trying to stay, and for a breath the whole sky goes white-hot. Pink's petals curl. So does one of yours, and it drops.`]], fx: { sky: 2, petals: -1, gw: { pink: -1 } } } },
      { trait: 'rainy', text: `Thank {RayHour} before it dims, so it isn't dim alone.`,
        full: { t: [['ray', `Oh. Nobody's ever said anything at the end of me.`], ['', `{RayHour} dims slowly and gladly. When {RayNext} lights, it's already looking at you, and your shadow turns toward it.`, { jumpHour: true }]], fx: { flag: 'sundial', blush: 1 } },
        partial: { t: [['ray', `Oh. Thank you.`], ['', `Hush overhears and lets out a long sigh that turns into drizzle on the way down.`, { jumpHour: true }]], fx: { flag: 'sundial', sky: -1, v: w => w.cloudRain(1.5) } },
        miss: { t: [['', `Your thank-you comes out as a drip. {RayHour} goes dim before it hears. Drift sees a sad little flower and comes to rain on it, to help.`, { jumpHour: true }]], fx: { sky: -2, v: w => w.cloudRain(2.2) } } }
    ],
    next: 'horizon'
  },

  horizon: {
    lines: () => [
      ['', `Now the shadow reaches nearly all the way. Its tip lies just short of the Horizon.`, { v: w => w.shadowLen(0.93) }],
      ['', `The Horizon doesn't do anything. It's the only thing in the Everafternoon that doesn't sway, drift, whisper, or shine. It is perfectly straight, and it's waiting, or it isn't.`],
      ['hush', `...careful... nothing's ever touched it...`],
      ['drift', `Oh, but I'd like to see— I mean— where am I?—`],
      ['rayling', `It's {time}. I've never seen anything happen at {time}. I've seen every single {time}.`]
    ],
    prompt: 'One more little bit. How?',
    choices: [
      { trait: 'rooted', text: `Hold still and let the tip of your shadow settle across the Horizon on its own.`,
        bonus: S => (S.flags.rootRunner || S.flags.spot || S.flags.whisperChain) ? { n: 1, why: 'you know where it reaches' } : null,
        full: { t: [['', `You hold still. The tip settles. It lies across the Horizon like a stem across a path.`]], next: 'end_later' },
        partial: { t: [['', `It settles across the line. Holding that still for that long costs you: a petal lets go and floats off toward the edge too.`]], fx: { petals: -1 }, next: 'end_later' },
        miss: { t: [['', `The tip trembles, falls short, and the shadow snaps back to you like a dropped stem. Every Puff in the meadow startles at once.`, { v: w => w.shadowLen(0.5) }]], fx: { sky: -2, v: w => w.puffRain(2.2, true) }, next: 'council' } },
      { trait: 'rainy', text: `Ask Hush and Drift to step aside, so the only light is the Sun's.`,
        bonus: S => S.flags.sundial ? { n: 1, why: 'you know which light moves it' } : null,
        full: { t: [['hush', `...alright... just for a moment...`], ['', `Hush and Drift step aside. For one moment the light comes from one place only, and your shadow slides the last little way and lies across the Horizon.`]], next: 'end_later' },
        partial: { t: [['drift', `Aside? Which side? This side?`], ['', `They step aside, then drift back, dripping. But it was enough. The tip is across the line.`]], fx: { sky: -1 }, next: 'end_later' },
        miss: { t: [['', `Hush steps aside. Drift steps the same way. They bump, and rain on the whole row. The shadow snaps back to you.`, { v: w => w.shadowLen(0.5) }]], fx: { sky: -2, v: w => w.cloudRain(2.4) }, next: 'council' } },
      { trait: 'sunny', text: `Lean toward the Sun, so the shadow stretches the last little bit.`,
        bonus: S => S.flags.stretched ? { n: 1, why: 'you know how to stretch' } : null,
        full: { t: [['', `You lean. The Sun leans back, delighted. The shadow stretches the last little bit and lies across the Horizon.`]], next: 'end_later' },
        partial: { t: [['', `It reaches. But the Sun is so thrilled that it blazes, and the edges of the meadow go crisp.`]], fx: { sky: 1, blush: 1 }, next: 'end_later' },
        miss: { t: [['', `You lean too far. Your stem bends, a petal goes, and the shadow springs back to you. Up above, the Sun goes hot with worry.`, { v: w => w.shadowLen(0.5) }]], fx: { petals: -1, sky: 2 }, next: 'council' } }
    ]
  },

  // ------------------------------------------------ route: hide it
  hide: {
    lines: () => [
      ['', `White's head is turning. When White turns its head, there's a council. There hasn't been a council since the Puffs were invented.`],
      ['rayling', `It's {time}. White takes about five minutes to turn round. You've got until {Next}, nearly. Well. Not nearly.`],
      ['greenfolk', `—hide it—  —where?—  —under us?—  —it's so cold, though—  —hide it—`]
    ],
    prompt: 'How do you hide a shadow?',
    choices: [
      { trait: 'sunny', text: `Turn your center straight up at the Sun, so your shadow shrinks to a dot underneath you.`,
        full: { t: [['', `You look straight up. The Sun looks straight down, delighted, and your shadow shrinks into a small gray coin under your stem.`]], fx: { flag: 'hidden', v: w => w.hideShadow() } },
        partial: { t: [['', `It shrinks to a coin. But the Sun stares back so hard that the meadow heats up around you.`]], fx: { flag: 'hidden', sky: 1, blush: 1, v: w => w.hideShadow() } },
        miss: { t: [['', `You can't look straight up for long. The moment you blink, the shadow springs back out longer than before. The Sun is very pleased with itself.`, { v: w => w.shadowLen(0.7) }]], fx: { sky: 2 } } },
      { trait: 'rainy', text: `Ask the Greenfolk to grow tall over it, slowly, one blade at a time.`,
        full: { t: [['greenfolk', `—here—  —shh—  —tickles—  —cold, cold, alright—`], ['', `The grass closes over it. From above you look like a flower standing in slightly taller grass. The Sun can't see your shadow any more, and it misses it.`]], fx: { flag: 'hidden', blush: -1, v: w => w.hideShadow() } },
        partial: { t: [['greenfolk', `—shh—  —grow—  —needs water—`], ['', `Grass grows best with a little rain, and Hush is happy to help. The shadow's covered, and so is everyone else, in drizzle.`]], fx: { flag: 'hidden', sky: -1, blush: -1, v: w => { w.hideShadow(); w.cloudRain(1.5); } } },
        miss: { t: [['', `The Greenfolk grow tall, then can't stand the cold and lean away from it in a perfect gray circle. It's more noticeable than before.`], ['greenfolk', `—sorry—  —too cold—  —sorry—`]], fx: { gw: { white: -1 } } } },
      { trait: 'rooted', text: `Pull it down your stem and into the ground, the one place the light has never reached.`,
        full: { t: [['', `Your shadow slides down your stem and into the dirt like water soaking in. Under the ground it's just more of the same. Your roots learn something nobody else knows: the ground was like this all along.`]], fx: { flag: ['hidden', 'groundKnows'], blush: -1, v: w => w.hideShadow(true) } },
        partial: { t: [['', `It goes down into the dirt. But now your roots are full of cold, and a petal turns pale and drops.`]], fx: { flag: 'hidden', petals: -1, blush: -1, v: w => w.hideShadow(true) } },
        miss: { t: [['', `The shadow goes halfway down and sticks. Now it looks like you're standing in a gray puddle. A petal comes off from the effort.`, { v: w => w.shadowLen(0.25) }]], fx: { petals: -1 } } }
    ],
    next: 'puff'
  },

  // ------------------------------------------------ the Sun's smile slips (Blush reached zero)
  slip: {
    lines: () => [
      ['', `The Sun's cheeks go pale. Then paler. Then the pink is gone completely.`, { v: w => w.smileSlip(true) }],
      ['', `And the smile slips. Only a little. A line where a curve has always been.`],
      ['', `The Rays stop going round. The Greenfolk stop. Even Drift stops drifting.`],
      ['rayling', `It's {time}. It's... I don't know what time it is. I've always known what time it is.`]
    ],
    prompt: 'The Sun has never not smiled. What do you do?',
    choices: [
      { trait: 'sunny', text: `Open your center as wide as it goes, and show the Sun its own yellow.`,
        full: { t: [['', `The Sun looks down and sees its own yellow looking back. The corners of its mouth find their way up again.`]], fx: { blush: 5, v: w => w.smileSlip(false) }, next: () => S.pending },
        partial: { t: [['', `It sees, and it remembers, slowly. The smile comes back a bit crooked, and the Sun overdoes the blushing to make up for it.`]], fx: { blush: 5, sky: 1, v: w => w.smileSlip(false) }, next: () => S.pending },
        miss: { t: [['', `Your center isn't big enough. Not yet. The Sun looks away.`]], next: 'end_overcast' } },
      { trait: 'rainy', text: `Point your leaf at Hush and Drift, and ask them to go close to the Sun. (It has loved the two Clouds forever.)`,
        full: { t: [['hush', `...we're here... we're right here...`], ['', `Hush and Drift come close, one on each side. The Sun's cheeks come back pink, all at once, the way they did the very first time.`]], fx: { blush: 5, v: w => w.smileSlip(false) }, next: () => S.pending },
        partial: { t: [['drift', `Here? Closer? Like this?`], ['', `They come close. The smile comes back. The Clouds are so relieved they rain a little.`]], fx: { blush: 5, sky: -1, v: w => { w.smileSlip(false); w.cloudRain(1.2); } }, next: () => S.pending },
        miss: { t: [['', `Hush and Drift come, but slowly, and they come in front instead of beside.`]], next: 'end_overcast' } },
      { trait: 'rooted', text: `Let the Sun see your shadow move: the one new thing in the whole world.`,
        full: { t: [['', `You hold still and the shadow turns, the smallest amount. The Sun watches the only thing that's ever changed, and it smiles again, curious.`]], fx: { blush: 5, flag: 'sundial', v: w => w.smileSlip(false) }, next: () => S.pending },
        partial: { t: [['', `The shadow turns. The Sun watches it, and the smile creeps back, a little at a time. Holding that still costs you a petal.`]], fx: { blush: 5, petals: -1, v: w => w.smileSlip(false) }, next: () => S.pending },
        miss: { t: [['', `The shadow doesn't move. Nothing moves. The Sun stops looking.`]], next: 'end_overcast' } }
    ]
  }
};

// ---------------------------------------------------------------- endings
const ENDINGS = {
  end_sundial: {
    title: 'What a shadow is for:\ntelling the time',
    v: w => w.endSundial(),
    lines: () => [
      ['', `They let you stay. Then they keep watching. Every time the bright Ray changes, your shadow swings round by one ray's width, and stops.`],
      ['orange', `It did that first! Before anybody!`],
      ['white', `Again.`],
      ['', `It does it again.`],
      ['', `After that, the Raylings stop tumbling down to tell everyone the hour. They just come and look at you.`],
      ['rayling', `It's {time}. I know because of you. That's backwards. I love it.`],
      ['', `The gap isn't a gap any more. It's where the meadow keeps the time.`]
    ]
  },
  end_later: {
    title: 'What a shadow is for:\npointing at later',
    v: w => w.endLater(),
    lines: () => [
      ['', `The tip of your shadow lies across the Horizon. The Horizon stays perfectly straight. But something is touching it now, and there's one place on it that's a little different from the rest: the place you point at.`],
      ['', `On that side, and only that side, the Sun's cheek turns orange.`],
      ['hush', `...oh...`],
      ['drift', `Where's it going? Can I come?`],
      ['rayling', `It's {time}. It's still the afternoon. It's just... later than it's ever been. I've never said "later" before.`],
      ['', `It's still afternoon, everywhere. But every hour from now on will be a little later than the one before, and the meadow has a word for which way that is.`]
    ]
  },
  end_shade: {
    title: 'What a shadow is for:\nstanding in',
    v: w => w.endShade(),
    lines: () => [
      ['', `They let you stay. But it's so hot by now that Orange's edges are brown and the Greenfolk have gone the color of straw.`],
      ['', `There is exactly one cool place in the whole Everafternoon. It's behind you.`],
      ['', `By the time the hour turns, there are three Puffs, a Rayling and most of Pink's leaf tucked into your shadow.`],
      ['greenfolk', `—over here—  —by the new one—  —cool—  —budge up—`],
      ['', `Nobody has a word for it yet. They call it "by the new one."`]
    ]
  },
  end_puddle: {
    title: 'What a shadow is for:\nseeing yourself',
    v: w => w.endPuddle(),
    lines: () => [
      ['', `They let you stay, though everyone's standing in water by now. The Puffs rained and rained, and the gap has filled into a small round puddle.`],
      ['', `Clear water in a bright meadow only shows more light. But your shadow falls across the puddle and darkens it, and in the dark part there's a wobbling upside-down meadow.`],
      ['pink', `Is that... me? Is that what I look like? I've been worrying about everyone else's stems for so long.`],
      ['purple', `I dreamt this... I did... the meadow upside down and all of us in it...`],
      ['', `For the first time, the Eldest see their own faces. They spend the rest of the afternoon, which is all of it, leaning over the gap.`]
    ]
  },
  end_folded: {
    title: 'What a shadow is for:\nkeeping',
    v: w => w.endFolded(),
    lines: () => [
      ['white', `Fine. Stays.`],
      ['', `A fifth flower, a little blue, no shadow at all. The gap closes up around you as if it was never there.`],
      ['', `You keep it folded. Mostly. Every hour at twenty past, it peeks out for a minute.`],
      ['', `Pink pretends not to notice. It's the kindest thing anyone in the meadow has ever done on purpose.`],
      ['rayling', `It's {time}. I won't tell. I only tell the time.`],
      ['', `Now the Everafternoon has a secret. It's in the gap, and it's cool to the touch.`]
    ]
  },
  end_whisper: {
    title: 'What a shadow is for:\ntalking about',
    v: w => w.endWhisper(),
    lines: () => [
      ['white', `No.`],
      ['', `Nobody can make a flower leave. You stay where you sprouted. But the Eldest turn their leaves so they don't point at you, and the gap is still a gap, only now there's something in it.`],
      ['greenfolk', `—cold—  —gray—  —it moves, you know—  —have you seen—  —I've seen—  —it moves—`],
      ['', `The meadow has its first rumor. In the Everafternoon nothing ever stops, so the rumor won't either.`],
      ['rayling', `It's {time}. I think it's a good shadow. I'll sit in it at twenty past, if you like.`],
      ['', `Maybe, some afternoon, which is this afternoon, someone else will come and sit in it on purpose.`]
    ]
  },
  end_overcast: {
    title: 'Overcast',
    v: w => w.endOvercast(),
    lines: () => [
      ['', `Hush and Drift move in front of the Sun together, so that nobody has to see its face like that.`],
      ['', `For the first time ever, the light doesn't come from everywhere. It comes from nowhere in particular. It's soft and gray and even.`],
      ['', `And in that light, nothing has a shadow. Not even you.`],
      ['hush', `...shh... it's only resting...`],
      ['', `You're just a fifth flower now, in a gap, under the first cloudy afternoon. Somewhere behind the Clouds, the Sun is trying to remember how its face goes.`]
    ]
  },
  end_seed: {
    title: 'Gone to seed',
    v: w => w.endSeed(),
    lines: S => [
      ['', S.sky >= 3 ? `The heat gets to you first. Your last petal curls up and lets go.`
        : S.sky <= -3 ? `The rain beats down on you until your last petal lets go.`
        : `You've given everything you had. Your last petal lets go.`],
      ['', `What's left of your head is round and white and soft, and the next breath of air takes it apart.`],
      ['', `The seeds go everywhere. Most of them land in the gap.`],
      ['rayling', `It's {time}. They'll be up by twenty past. Things are always up by twenty past.`],
      ['', `Nothing in the Everafternoon ends, so it's still the same afternoon when they come up: five small buds between Pink and White, and behind each one, a small gray shadow.`]
    ]
  }
};

// ---------------------------------------------------------------- the scene
function rotEllipse(g, cx, cy, rx, ry, a) {
  const pts = [], ca = Math.cos(a), sa = Math.sin(a);
  for (let i = 0; i < 22; i++) {
    const th = i / 22 * Math.PI * 2, x = Math.cos(th) * rx, y = Math.sin(th) * ry;
    pts.push({ x: cx + x * ca - y * sa, y: cy + x * sa + y * ca });
  }
  g.fillPoints(pts, true);
}

class World extends Phaser.Scene {
  constructor() { super('world'); }

  txt(x, y, s, size, color, extra) {
    return this.add.text(x, y, s, Object.assign({ fontFamily: FONT, fontSize: size + 'px', color: color || '#3a3226', resolution: 2 }, extra || {}));
  }

  create() {
    this.t = 0;
    this.gBack = this.add.graphics().setDepth(0);
    this.gWorld = this.add.graphics().setDepth(5);
    this.gFront = this.add.graphics().setDepth(8);
    this.gCard = this.add.graphics().setDepth(20);
    this.gDice = this.add.graphics().setDepth(22);
    this.gUI = this.add.graphics().setDepth(30);

    // grass tufts (the Greenfolk, up close)
    this.tufts = [];
    const r = mulberry32(7);
    for (let i = 0; i < 46; i++) {
      const x = 20 + r() * 920, y = HORIZON + 22 + r() * 110;
      if (y > 596) continue;
      this.tufts.push({ x, y, ph: r() * 6, s: 0.7 + r() * 0.6 });
    }

    // card
    this.gCard.fillStyle(0xfffbea, 0.97).fillRoundedRect(18, 604, 924, 186, 16);
    this.gCard.lineStyle(3, 0xead9a4, 1).strokeRoundedRect(18, 604, 924, 186, 16);
    this.nameText = this.txt(40, 614, '', 17, '#7a6a4a', { fontStyle: 'bold' }).setDepth(23);
    this.bodyText = this.txt(40, 640, '', 19, '#3a3226', { wordWrap: { width: 760, useAdvancedWrap: true }, lineSpacing: 5 }).setDepth(23);
    this.statusText = this.txt(924, 614, '', 14, '#8a7a5a').setOrigin(1, 0).setDepth(23);
    this.hintText = this.txt(924, 768, 'click or Enter \u25B8', 13, '#b0a07a').setOrigin(1, 0).setDepth(23).setVisible(false);
    this.bigTitle = this.txt(W / 2, 395, '', 40, '#ffffff', { fontStyle: 'bold', align: 'center', stroke: '#d79a00', strokeThickness: 7 }).setOrigin(0.5).setDepth(15);
    this.subTitle = this.txt(W / 2, 450, '', 20, '#ffffff', { align: 'center', stroke: '#5c8fb0', strokeThickness: 4 }).setOrigin(0.5).setDepth(15);
    this.muteText = this.txt(946, 10, '', 14, '#5a4a2a', { backgroundColor: '#fffbeaee', padding: { x: 8, y: 4 } }).setOrigin(1, 0).setDepth(40).setInteractive({ useHandCursor: true });
    this.muteText.on('pointerdown', () => this.toggleMute());
    this.refreshMute();

    this.choiceObjs = []; this.choiceCb = null; this.choiceCount = 0;
    this.queue = []; this.onQueueDone = null; this.typing = false; this.full = ''; this.shown = 0;
    this.dice = { show: false, a: 1, b: 1, spin: 0 };
    this.setupObjs = [];

    this.input.keyboard.addCapture('SPACE,ENTER,ONE,TWO,THREE,FOUR');
    this.input.keyboard.on('keydown', e => this.onKey(e));
    this.input.on('pointerdown', (p, over) => {
      if (over && over.length) return;
      if (this.mode === 'title') this.openSetup();
      else if (this.mode === 'talk') this.advance();
    });

    this.resetVis();
    this.toTitle();
    window.EA = { scene: this, get state() { return S; }, get mode() { return this.scene.mode; } };
  }

  // ------------------------------------------------ visual state
  resetVis() {
    this.tweens.killAll();
    if (this.timers) this.timers.forEach(t => t.remove(false));
    this.timers = [];
    this.vis = {
      sky: 0, blush: 4, budP: 0, shadowA: 0, shadowAT: 0, shadowL: 0.45, shadowLT: 0.45, hide: 0, hideT: 0,
      tx: 860, rayRot: 0.15, raySpeed: 0.05, slip: 0, slipT: 0, overcast: 0, overcastT: 0, puddle: 0, puddleT: 0,
      glow: 0, glowT: 0, chip: false, silent: false, sundial: false, folded: false, whisperEnd: false,
      leanAway: false, council: false, flash: 0, seed: 0, seedlings: 0, laterCheek: false, cloudRain: 0
    };
    this.lean = { orange: 0, pink: 0, white: 0, purple: 0 };
    this.bob = { orange: 0, pink: 0, white: 0, purple: 0, hush: 0, drift: 0 };
    this.puffs = [
      { x: 118, y: 566, s: 0.9, ph: 0.0, state: 'idle', rain: 0, alpha: 1, hx: 118, hy: 566 },
      { x: 238, y: 590, s: 0.8, ph: 1.7, state: 'idle', rain: 0, alpha: 1, hx: 238, hy: 590 },
      { x: 905, y: 572, s: 1.0, ph: 3.1, state: 'idle', rain: 0, alpha: 1, hx: 905, hy: 572 }
    ];
    this.scenePuff = this.puffs[2];
    this.rayling = { show: false, x: 0, y: 0, rot: 0, hop: 0 };
    this.extraRaylings = [];
    this.drops = []; this.falling = []; this.seeds = []; this.whispers = this.whispers || [];
    this.whispers.forEach(o => o.destroy()); this.whispers = [];
    this.nextAmbient = 1.5;
    this.budHead = { x: BUD_X, y: BASE_Y - 70 };
    this.dice.show = false;
  }

  // ------------------------------------------------ title & setup
  toTitle() {
    this.mode = 'title';
    S = null;
    this.clearChoices();
    this.bigTitle.setText('The Everafternoon').setFontSize(60).setY(380);
    this.subTitle.setText('a short story about the first shadow').setY(440);
    this.nameText.setText('');
    this.setBody(`An afternoon that never ends, a Sun that never stops smiling, and a gap in a row of flowers.\nClick, or press Enter, to begin.`, true);
    this.hintText.setVisible(true);
  }

  openSetup() {
    if (this.mode !== 'title') return;
    this.mode = 'setup';
    this.bigTitle.setText(''); this.subTitle.setText('');
    this.hintText.setVisible(false);
    this.setBody('Choose how your bud grows. Press 1-4 for a preset, or use the − and + buttons. Enter to sprout.', true);
    this.setupTraits = { sunny: 1, rainy: 1, rooted: 1 };
    const g = this.gUI, o = this.setupObjs;
    g.clear();
    g.fillStyle(0xfffbea, 0.97).fillRoundedRect(70, 40, 820, 548, 18);
    g.lineStyle(3, 0xead9a4, 1).strokeRoundedRect(70, 40, 820, 548, 18);
    o.push(this.txt(W / 2, 58, 'How does your bud grow?', 30, '#3a3226', { fontStyle: 'bold' }).setOrigin(0.5, 0));
    o.push(this.txt(W / 2, 100, 'Spend 3 points. Each trait goes from −1 to +2.', 17, '#7a6a4a').setOrigin(0.5, 0));
    const rows = [
      ['sunny', 'Your center is exactly the Sun\'s yellow. Being bold, being charming, being seen. Makes the Sun blush, and the day hotter.'],
      ['rainy', 'Your leaf points up at the Clouds, like every leaf here. Being gentle, patient, soothing. Brings the rain closer.'],
      ['rooted', 'Your roots go down into the dirt. Holding on, holding still, listening to the ground. Leaves the sky alone.']
    ];
    this.setupVals = {};
    rows.forEach((rw, i) => {
      const y = 136 + i * 78, k = rw[0];
      o.push(this.txt(96, y + 4, TRAIT_NAME[k], 22, TRAIT_COLOR[k], { fontStyle: 'bold' }));
      o.push(this.button(206, y + 2, '−', () => this.bump(k, -1), 22));
      this.setupVals[k] = this.txt(272, y + 4, '', 22, '#3a3226', { fontStyle: 'bold' }).setOrigin(0.5, 0);
      o.push(this.setupVals[k]);
      o.push(this.button(304, y + 2, '+', () => this.bump(k, 1), 22));
      o.push(this.txt(360, y, rw[1], 15, '#5a4a32', { wordWrap: { width: 510 }, lineSpacing: 3 }));
    });
    this.presets = [
      ['1  Sun-faced', { sunny: 2, rainy: 0, rooted: 1 }],
      ['2  Cloud-leaning', { sunny: 0, rainy: 2, rooted: 1 }],
      ['3  Deep-rooted', { sunny: 1, rainy: 0, rooted: 2 }],
      ['4  Even', { sunny: 1, rainy: 1, rooted: 1 }]
    ];
    o.push(this.txt(96, 372, 'Or pick:', 16, '#7a6a4a'));
    this.presets.forEach((p, i) => o.push(this.button(180 + i * 170, 368, p[0], () => this.applyPreset(i), 16)));
    o.push(this.txt(96, 414,
      'When you try something: two dice + one trait.\n' +
      '10 or more: it goes well.   7 to 9: it works, but the sky reacts.   6 or less: something goes wrong, usually weather.\n' +
      'You have 5 petals. At 2 or fewer you\'re wilting (−1 to every roll). At none, you go to seed.\n' +
      'Watch the sky\'s color (too hot one way, too wet the other) and the Sun\'s cheeks.', 15, '#5a4a32', { wordWrap: { width: 770 }, lineSpacing: 5 }));
    this.leftText = this.txt(96, 540, '', 17, '#7a6a4a');
    o.push(this.leftText);
    this.startBtn = this.button(718, 530, 'Sprout  \u25B8', () => this.trySetupStart(), 22);
    o.push(this.startBtn);
    o.forEach(x => x.setDepth(31));
    this.refreshSetup();
  }

  button(x, y, label, cb, size) {
    const b = this.txt(x, y, label, size || 18, '#3a3226', { backgroundColor: '#ffeeb0', padding: { x: 10, y: 4 } }).setInteractive({ useHandCursor: true });
    b.on('pointerover', () => { if (!b.disabled) b.setBackgroundColor('#ffd966'); });
    b.on('pointerout', () => b.setBackgroundColor(b.disabled ? '#eee6cc' : '#ffeeb0'));
    b.on('pointerdown', () => { if (!b.disabled) cb(); });
    return b;
  }
  bump(k, d) { const v = this.setupTraits[k] + d; if (v < -1 || v > 2) return; this.setupTraits[k] = v; Snd.click(); this.refreshSetup(); }
  applyPreset(i) { if (!this.presets[i]) return; this.setupTraits = Object.assign({}, this.presets[i][1]); Snd.click(); this.refreshSetup(); }
  pointsLeft() { const t = this.setupTraits; return 3 - (t.sunny + t.rainy + t.rooted); }
  refreshSetup() {
    for (const k in this.setupVals) { const v = this.setupTraits[k]; this.setupVals[k].setText(v > 0 ? '+' + v : '' + v); }
    const left = this.pointsLeft();
    this.leftText.setText(left === 0 ? 'Ready.' : left > 0 ? `${left} point${left > 1 ? 's' : ''} left to spend.` : `${-left} point${left < -1 ? 's' : ''} too many.`);
    this.startBtn.disabled = left !== 0;
    this.startBtn.setBackgroundColor(left !== 0 ? '#eee6cc' : '#ffeeb0').setColor(left !== 0 ? '#b0a080' : '#3a3226');
  }
  trySetupStart() {
    if (this.pointsLeft() !== 0) { Snd.bad(); return; }
    this.setupObjs.forEach(x => x.destroy()); this.setupObjs = []; this.gUI.clear();
    this.startGame(this.setupTraits);
  }
  startGame(traits) {
    S = freshState(traits);
    this.mode = 'talk';
    this.runScene('intro');
  }

  // ------------------------------------------------ input
  onKey(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') { this.toggleMute(); return; }
    if (this.mode === 'title') { if (k === 'Enter' || k === ' ') this.openSetup(); return; }
    if (this.mode === 'setup') { if ('1234'.indexOf(k) >= 0 && k.length === 1) this.applyPreset(+k - 1); else if (k === 'Enter') this.trySetupStart(); return; }
    if (this.mode === 'choice') { const n = parseInt(k, 10); if (n >= 1 && n <= this.choiceCount) this.choose(n - 1); return; }
    if (this.mode === 'talk' && (k === 'Enter' || k === ' ' || k === 'ArrowRight')) this.advance();
  }
  toggleMute() { Snd.resume(); Snd.setMuted(!Snd.muted); this.refreshMute(); if (!Snd.muted) Snd.chime(); }
  refreshMute() { this.muteText.setText(Snd.muted ? '\u266A sound off (M)' : '\u266A sound on (M)'); }

  // ------------------------------------------------ dialogue
  setBody(text, instant) {
    this.full = text; this.shown = instant || FAST ? text.length : 0; this.typing = !(instant || FAST);
    this.bodyText.setText(instant || FAST ? text : '');
  }
  say(lines, done) { this.queue = lines.slice(); this.onQueueDone = done; this.mode = 'talk'; this.nextBeat(); }
  nextBeat() {
    if (!this.queue.length) { const d = this.onQueueDone; this.onQueueDone = null; if (d) d(); return; }
    const b = this.queue.shift();
    if (b[2]) applyFx(this, b[2]);
    if (!b[1]) { this.nextBeat(); return; }
    this.showLine(b[0] || '', fill(b[1]));
  }
  showLine(who, text) {
    const sp = SPEAKERS[who] || SPEAKERS[''];
    let name = sp.name;
    if (who === 'ray') name = `${S.rayHour}, the bright Ray`;
    this.nameText.setText(name).setColor(sp.color);
    this.bodyText.setColor(who === '' ? '#5a4a32' : '#3a3226').setFontStyle(who === '' ? 'italic' : 'normal');
    this.setBody(text);
    this.hintText.setVisible(false);
    this.react(who, text);
  }
  react(who, text) {
    if (this.bob[who] !== undefined) this.bob[who] = 1;
    if (who === 'rayling') { this.raylingHop(); Snd.chime(1567.98); }
    if (who === 'ray') { this.vis.flash = 1; Snd.chime(1174.66); }
    if (who === 'hush' || who === 'drift') Snd.sigh();
    if (who === 'puff') Snd.baa();
    if (who === 'greenfolk') { this.vis.silent = false; this.whisper(text.split(/\s{2,}/)); }
    if (who === 'white') Snd.tone(523.25, 0.5, 'sine', 0.05);
    if (who === 'orange') Snd.tone(659.25, 0.25, 'square', 0.025);
    if (who === 'pink') Snd.tone(880, 0.4, 'sine', 0.04);
    if (who === 'purple') { Snd.tone(587.33, 0.9, 'sine', 0.035); Snd.tone(740, 0.9, 'sine', 0.025, 0.2); }
  }
  advance() {
    if (this.mode !== 'talk') return;
    if (this.typing) { this.typing = false; this.shown = this.full.length; this.bodyText.setText(this.full); return; }
    this.nextBeat();
  }

  showChoices(prompt, items, cb, keepBody) {
    this.clearChoices();
    this.mode = 'choice';
    this.choiceCb = cb; this.choiceCount = items.length;
    this.nameText.setText(prompt ? fill(prompt) : '').setColor('#7a6a4a');
    let y = 640;
    if (keepBody) { this.bodyText.setColor('#5a4a32').setFontStyle('italic'); this.setBody(fill(keepBody), true); y += this.bodyText.height + 12; }
    else this.setBody('', true);
    this.hintText.setVisible(false);
    items.forEach((it, i) => {
      const tagStr = `${i + 1}` + (it.trait ? `  ${TRAIT_NAME[it.trait]} ${S.traits[it.trait] >= 0 ? '+' : ''}${S.traits[it.trait]}` : '');
      const tag = this.txt(42, y + 3, tagStr, 15, it.trait ? TRAIT_COLOR[it.trait] : '#7a6a4a', { fontStyle: 'bold' }).setDepth(25);
      const main = this.txt(150, y, fill(it.text), 17, '#3a3226', { wordWrap: { width: 772, useAdvancedWrap: true }, lineSpacing: 2 }).setDepth(25);
      const h = Math.max(main.height, 22) + 6;
      const bg = this.add.rectangle(30, y - 3, 900, h, 0xffe9a8, 1).setOrigin(0, 0).setDepth(24).setAlpha(0).setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setAlpha(1));
      bg.on('pointerout', () => bg.setAlpha(0));
      bg.on('pointerdown', () => this.choose(i));
      this.choiceObjs.push(tag, main, bg);
      y += h + 4;
    });
  }
  clearChoices() { this.choiceObjs.forEach(o => o.destroy()); this.choiceObjs = []; this.choiceCount = 0; }
  choose(i) {
    if (this.mode !== 'choice' || !this.choiceCb) return;
    const cb = this.choiceCb; this.choiceCb = null;
    this.clearChoices(); this.mode = 'busy';
    Snd.click();
    cb(i);
  }

  // ------------------------------------------------ scenes
  runScene(id) {
    const sc = SCENES[id];
    this.sceneId = id;
    this.dice.show = false;
    if (S) S.min += 5;
    if (sc.enter) sc.enter(S);
    const lines = typeof sc.lines === 'function' ? sc.lines(S) : sc.lines;
    this.say(lines, () => {
      const ch = typeof sc.choices === 'function' ? sc.choices(S) : sc.choices;
      const prompt = typeof sc.prompt === 'function' ? sc.prompt(S) : sc.prompt;
      this.showChoices(prompt, ch, i => this.pick(sc, ch[i]));
    });
  }
  pick(sc, c) {
    S.min += 5;
    if (c.go) { if (c.route) S.route = c.route; this.go(c.go); return; }
    const bonus = c.bonus ? c.bonus(S) : null;
    this.roll(c.trait, bonus, level => {
      let out = c[level]; if (typeof out === 'function') out = out(S);
      const push = c.trait === 'sunny' ? { sky: 1, blush: 1 } : c.trait === 'rainy' ? { sky: -1 } : null;
      const lines = [['', '', w => { if (push) applyFx(w, push); if (level === 'miss') applyFx(w, { blush: -1 }); applyFx(w, out.fx); }]].concat(out.t || []);
      this.say(lines, () => {
        let next = out.next || c.next || sc.next;
        if (typeof next === 'function') next = next(S, level);
        this.postCheck(next);
      });
    });
  }
  roll(trait, bonus, cb) {
    this.mode = 'rolling';
    const a = 1 + Math.floor(rng() * 6), b = 1 + Math.floor(rng() * 6);
    const t = S.traits[trait], wilt = S.petals <= 2 ? -1 : 0, bn = bonus ? bonus.n : 0;
    const total = a + b + t + wilt + bn;
    const level = total >= 10 ? 'full' : total >= 7 ? 'partial' : 'miss';
    S.rolls.push({ scene: this.sceneId, trait, a, b, total, level });
    this.dice.show = true;
    this.nameText.setText(`Two dice + ${TRAIT_NAME[trait]}`).setColor(TRAIT_COLOR[trait]);
    this.setBody('...', true);
    let n = 0; const steps = FAST ? 1 : 12;
    const tick = () => {
      n++;
      if (n < steps) {
        this.dice.a = 1 + Math.floor(Math.random() * 6); this.dice.b = 1 + Math.floor(Math.random() * 6); this.dice.spin = 1;
        Snd.click();
        this.time.delayedCall(55 + n * 6, tick);
        return;
      }
      this.dice.a = a; this.dice.b = b; this.dice.spin = 0;
      let s = `${a} + ${b}, ${TRAIT_NAME[trait]} ${t >= 0 ? '+' : '−'}${Math.abs(t)}`;
      if (wilt) s += ', wilting −1';
      if (bn) s += `, +${bn} because ${bonus.why}`;
      const verdict = { full: 'It goes well.', partial: 'It works, but the sky reacts.', miss: 'Something goes wrong.' }[level];
      if (level === 'full') Snd.good(); else if (level === 'partial') Snd.meh(); else Snd.bad();
      this.mode = 'talk';
      this.queue = []; this.onQueueDone = () => cb(level);
      this.nameText.setText(`Two dice + ${TRAIT_NAME[trait]}`).setColor(TRAIT_COLOR[trait]);
      this.bodyText.setColor('#3a3226').setFontStyle('bold');
      this.setBody(`${s}  =  ${total}.   ${verdict}`, true);
    };
    tick();
  }
  postCheck(next) {
    if (S.petals <= 0) return this.ending('end_seed');
    if (S.sky >= 5 || S.sky <= -5) return this.say(damageLines(), () => this.postCheck(next));
    if (S.blush <= 0) {
      if (!S.slipUsed) { S.slipUsed = true; S.pending = next; return this.runScene('slip'); }
      return this.ending('end_overcast');
    }
    this.go(next);
  }
  go(next) {
    if (!next) next = 'council';
    if (next.indexOf('end_') === 0) this.ending(next); else this.runScene(next);
  }
  ending(id) {
    const E = ENDINGS[id];
    S.ending = id;
    this.sceneId = id;
    this.dice.show = false;
    E.v(this);
    this.time.delayedCall(FAST ? 10 : 600, () => { this.bigTitle.setText(E.title).setFontSize(38).setY(400); this.subTitle.setText(''); });
    this.say(E.lines(S), () => {
      const ls = E.lines(S), last = ls[ls.length - 1][1];
      this.showChoices('The end of this afternoon.', [{ text: 'Start another afternoon.' }], () => this.restart(), last);
    });
  }
  restart() { this.resetVis(); this.bigTitle.setText(''); this.toTitle(); }

  // ------------------------------------------------ visual hooks used by the story
  sprout() { this.tweens.add({ targets: this.vis, budP: 1, duration: FAST ? 10 : 1800, ease: 'Sine.easeOut' }); Snd.sprout(); }
  silence(b) { this.vis.silent = b; }
  showShadow() { this.vis.shadowAT = 1; this.vis.shadowLT = 0.5; Snd.tone(220, 1.2, 'sine', 0.05, 0, 165); }
  shadowLen(L) { this.vis.shadowLT = L; this.vis.hideT = 0; this.vis.shadowAT = 1; }
  hideShadow(ground) { this.vis.hideT = 1; if (ground) this.vis.shadowAT = 0; Snd.whisper(); }
  unhideShadow() { this.vis.hideT = 0; this.vis.shadowAT = 1; this.vis.shadowLT = Math.max(this.vis.shadowLT, 0.6); }
  tumbleRayling() {
    const a = this.vis.rayRot + 4 * Math.PI / 6 - Math.PI / 2, rl = this.rayling;
    rl.show = true; rl.x = SUN.x + Math.cos(a) * 140; rl.y = SUN.y + Math.sin(a) * 140; rl.rot = 0;
    this.vis.chip = true;
    const d = FAST ? 10 : 1300;
    this.tweens.add({ targets: rl, x: 492, duration: d, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: rl, y: 584, duration: d, ease: 'Bounce.easeOut' });
    this.tweens.add({ targets: rl, rot: Math.PI * 6 + 0.2, duration: d, ease: 'Quad.easeOut' });
    Snd.chime(1760); Snd.chime(1318.5); this.time.delayedCall(d * 0.6, () => Snd.pop());
  }
  raylingHop() { this.rayling.hop = 1; }
  rayFlash() { this.vis.flash = 1; Snd.chime(1174.66); }
  councilFace() { this.vis.council = true; }
  smileSlip(b) { this.vis.slipT = b ? 1 : 0; this.vis.silent = b; if (b) Snd.bad(); else Snd.good(); }
  shadowPoint(f) {
    const v = this.vis, L = v.shadowL * (1 - v.hide * 0.94);
    const ex = BUD_X + (v.tx - BUD_X) * L, ey = BASE_Y + (HORIZON + 3 - BASE_Y) * L;
    return { x: BUD_X + (ex - BUD_X) * f, y: BASE_Y + (ey - BASE_Y) * f };
  }
  puffWalk() {
    const p = this.scenePuff;
    const tgt = S && S.flags.hidden ? { x: 566, y: 582 } : this.shadowPoint(0.86);
    p.state = 'walk'; p.alpha = 1;
    this.tweens.add({ targets: p, x: tgt.x + 18, y: tgt.y + 6, duration: FAST ? 10 : 1800, ease: 'Sine.easeInOut', onComplete: () => { if (p.state === 'walk') p.state = 'idle'; } });
    Snd.baa();
  }
  puffStiff() { this.scenePuff.state = 'stiff'; }
  puffRain(dur, all, idx) {
    const list = all ? this.puffs : [idx !== undefined ? this.puffs[idx] : this.scenePuff];
    list.forEach(p => { if (p.alpha > 0.2) { p.rain = dur; p.state = 'startled'; } });
    Snd.rain(); Snd.baa();
  }
  puffSleep(delay) {
    const p = this.scenePuff;
    this.time.delayedCall(FAST ? 0 : (delay || 0) * 1000, () => {
      const tgt = S && S.flags.hidden ? { x: 566, y: 584 } : this.shadowPoint(0.78);
      p.state = 'sleep'; p.rain = 0;
      this.tweens.add({ targets: p, x: tgt.x + 10, y: tgt.y + 8, duration: FAST ? 10 : 700 });
    });
  }
  puffHome() {
    const p = this.scenePuff; p.state = 'float'; p.rain = 0;
    this.tweens.add({ targets: p, x: 680, y: 150, alpha: 0, duration: FAST ? 10 : 2200, ease: 'Sine.easeIn',
      onComplete: () => this.time.delayedCall(4000, () => { p.x = p.hx; p.y = p.hy; p.state = 'idle'; this.tweens.add({ targets: p, alpha: 1, duration: 800 }); }) });
    Snd.sigh();
  }
  cloudRain(dur) { this.vis.cloudRain = Math.max(this.vis.cloudRain, dur); Snd.rain(); }
  scorchFlash() { this.vis.flash = 1; Snd.tone(196, 1.0, 'sawtooth', 0.03); }
  dropPetals(n) {
    for (let i = 0; i < n; i++) {
      this.falling.push({ x: this.budHead.x + (Math.random() - 0.5) * 16, y: this.budHead.y, vx: 18 + Math.random() * 40, vy: -40 - Math.random() * 30, life: 3 });
    }
    Snd.pop();
  }

  // endings
  endSundial() {
    const v = this.vis; v.sundial = true; v.hideT = 0; v.shadowAT = 1; v.shadowLT = 0.7;
    this.extraRaylings = [{ x: 590, y: 586, rot: -0.2, hop: 0, ph: 0.5 }, { x: 606, y: 588, rot: 0.25, hop: 0, ph: 1.3 }];
    this.timers.push(this.time.addEvent({ delay: 2400, loop: true, callback: () => { S.min += 60; this.vis.flash = 1; Snd.chime(1318.5 + (hourIdx(S.min) % 4) * 110); this.extraRaylings.forEach(r => r.hop = 1); this.rayling.hop = 1; } }));
  }
  endLater() { const v = this.vis; v.shadowLT = 1.0; v.hideT = 0; v.shadowAT = 1; v.glowT = 1; v.laterCheek = true; Snd.chime(880); Snd.sigh(); }
  endShade() {
    const v = this.vis; v.hideT = 0; v.shadowAT = 1; v.shadowLT = 0.6;
    this.puffs.forEach((p, i) => {
      const pt = this.shadowPoint(0.35 + i * 0.22);
      p.state = 'walk'; p.rain = 0;
      this.tweens.add({ targets: p, x: pt.x + 10, y: pt.y + 8, alpha: 1, duration: FAST ? 10 : 2200 + i * 500, ease: 'Sine.easeInOut', onComplete: () => { p.state = 'sleep'; } });
    });
    const pt = this.shadowPoint(0.2);
    this.tweens.add({ targets: this.rayling, x: pt.x + 4, y: pt.y, duration: FAST ? 10 : 1500 });
  }
  endPuddle() { this.vis.puddleT = 1; this.vis.hideT = 0; this.vis.shadowAT = 1; this.vis.shadowLT = 0.25; Snd.rain(); }
  endFolded() { this.vis.folded = true; this.vis.hideT = 1; this.vis.shadowAT = 1; }
  endWhisper() { this.vis.leanAway = true; this.vis.whisperEnd = true; this.vis.hideT = 0; this.vis.shadowAT = 1; }
  endOvercast() { this.vis.overcastT = 1; this.vis.shadowAT = 0; this.vis.raySpeed = 0.01; Snd.sigh(); }
  endSeed() {
    this.vis.seed = 1; this.vis.shadowAT = 0;
    this.time.delayedCall(FAST ? 10 : 1500, () => {
      for (let i = 0; i < 26; i++) this.seeds.push({ x: this.budHead.x, y: this.budHead.y, vx: 20 + Math.random() * 90, vy: -30 - Math.random() * 60, life: 4 + Math.random() * 2 });
      this.vis.seed = 2; Snd.sigh();
      this.tweens.add({ targets: this.vis, seedlings: 1, delay: FAST ? 0 : 3500, duration: FAST ? 10 : 2000 });
    });
  }

  whisper(frags, small) {
    frags = frags.filter(f => f && f.trim());
    frags.forEach((f, i) => {
      const x = 40 + Math.random() * 860, y = 500 + Math.random() * 80;
      const o = this.txt(x, y, f.trim(), small ? 13 : 15, '#1f6b22', { fontStyle: 'italic' }).setDepth(9).setAlpha(0);
      this.whispers.push(o);
      this.tweens.add({ targets: o, alpha: small ? 0.55 : 0.95, y: y - 10, delay: i * 260, duration: 700, yoyo: true, hold: 900,
        onComplete: () => { o.destroy(); this.whispers = this.whispers.filter(w => w !== o); } });
    });
    if (frags.length) Snd.whisper();
  }

  // ------------------------------------------------ frame update
  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    this.t += dt;
    const v = this.vis;
    const k = 1 - Math.pow(0.02, dt);  // smoothing
    if (S) { v.sky = lerp(v.sky, S.sky, k); v.blush = lerp(v.blush, S.blush, k); }
    v.shadowA = lerp(v.shadowA, v.shadowAT, k * 1.2);
    v.shadowL = lerp(v.shadowL, v.shadowLT, k * 0.8);
    v.hide = lerp(v.hide, v.hideT, k);
    v.slip = lerp(v.slip, v.slipT, k);
    v.overcast = lerp(v.overcast, v.overcastT, k * 0.5);
    v.puddle = lerp(v.puddle, v.puddleT, k * 0.5);
    v.glow = lerp(v.glow, v.glowT, k * 0.5);
    v.flash = Math.max(0, v.flash - dt * 0.8);
    v.rayRot += dt * v.raySpeed * (1 - v.slip);
    if (v.folded) { const ph = (this.t % 6) / 6; v.hideT = ph > 0.75 ? 0.55 : 1; }
    let tx;
    if (v.sundial && S) tx = 660 + ((hourIdx(S.min) - 4 + 12) % 4) * 90;
    else tx = S ? clamp(860 + (S.min - 260) / 60 * 40, 600, 950) : 860;
    v.tx = lerp(v.tx, tx + Math.sin(this.t * 0.6) * 5, k);
    for (const id in this.bob) this.bob[id] = Math.max(0, this.bob[id] - dt * 1.5);
    this.rayling.hop = Math.max(0, this.rayling.hop - dt * 2.5);
    this.extraRaylings.forEach(r => r.hop = Math.max(0, r.hop - dt * 2.5));
    for (const f of FLOWERS) {
      const dir = Math.sign(BUD_X - f.x);
      let tgt = S ? S.gw[f.id] * 0.06 * dir : 0;
      if (v.council) tgt += 0.04 * dir;
      if (v.leanAway) tgt = -0.14 * dir;
      if (v.sky > 3) tgt += (v.sky - 3) * 0.06;  // heat droop
      this.lean[f.id] = lerp(this.lean[f.id], tgt, k);
    }
    // ambient whispering
    this.nextAmbient -= dt;
    if (this.nextAmbient <= 0) {
      this.nextAmbient = v.whisperEnd ? 0.7 : 2.2 + Math.random() * 1.8;
      if (!v.silent && (this.mode === 'title' || this.mode === 'setup' || v.whisperEnd || Math.random() < 0.5)) {
        const pool = v.whisperEnd ? ['—cold—', '—gray—', '—it moves—', '—have you seen—', '—I\'ve seen—', '—the new one—']
          : ['—warm—', '—still afternoon—', '—shh—', '—did you hear—', '—warm again—', '—sss—', '—afternoon—'];
        this.whisper([pool[Math.floor(Math.random() * pool.length)]], !v.whisperEnd);
      }
    }
    // puffs, rain, petals, seeds
    for (const p of this.puffs) {
      if (p.rain > 0) {
        p.rain -= dt;
        if (Math.random() < 0.9) this.drops.push({ x: p.x + (Math.random() - 0.5) * 30 * p.s, y: p.y + 10, vy: 240 + Math.random() * 80, ground: p.y + 30 + Math.random() * 10 });
        if (p.rain <= 0 && p.state === 'startled') p.state = 'idle';
      }
    }
    if (v.cloudRain > 0 || v.sky < -3.2) {
      v.cloudRain = Math.max(0, v.cloudRain - dt);
      const rate = v.cloudRain > 0 ? 0.9 : 0.25;
      for (const c of this.cloudPos()) if (Math.random() < rate) this.drops.push({ x: c.x + (Math.random() - 0.5) * 100 * c.s, y: c.y + 30 * c.s, vy: 360 + Math.random() * 80, ground: HORIZON + 20 + Math.random() * 110 });
    }
    this.drops = this.drops.filter(d => { d.y += d.vy * dt; return d.y < d.ground; });
    this.falling = this.falling.filter(f => { f.vy += 60 * dt; f.x += f.vx * dt; f.y = Math.min(BASE_Y + 12, f.y + f.vy * dt); f.life -= dt; return f.life > 0; });
    this.seeds = this.seeds.filter(s => { s.vy += (Math.random() - 0.55) * 30 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; return s.life > 0; });
    // typewriter
    if (this.typing) {
      this.shown += delta * 0.065;
      const n = Math.floor(this.shown);
      if (n >= this.full.length) { this.typing = false; this.bodyText.setText(this.full); }
      else this.bodyText.setText(this.full.slice(0, n));
    }
    if (this.mode === 'talk' && !this.typing) this.hintText.setVisible(Math.floor(this.t * 2) % 2 === 0);
    else if (this.mode !== 'title') this.hintText.setVisible(false);
    this.updateStatus();
    this.draw();
  }

  updateStatus() {
    if (!S) { this.statusText.setText(''); return; }
    const t = S.traits, f = x => (x > 0 ? '+' : '') + x;
    this.statusText.setText(`Sunny ${f(t.sunny)} · Rainy ${f(t.rainy)} · Rooted ${f(t.rooted)}     ${S.petals} petal${S.petals === 1 ? '' : 's'}${S.petals <= 2 ? ' (wilting)' : ''} · sky ${skyWords(S.sky)} · Sun's cheeks ${blushWords(S.blush)}`);
  }

  cloudPos() {
    const v = this.vis, t = this.t, frz = 1 - v.slip;
    const h = { x: 670 + Math.sin(t * 0.25 * frz) * 14, y: 125 + Math.sin(t * 0.4) * 3, s: 1 };
    const d = { x: 822 + Math.sin(t * 0.13 * frz + 1) * 38, y: 212 + Math.sin(t * 0.3 + 2) * 4, s: 0.95 };
    const swell = Math.max(0, -v.sky / 5) * 0.35 - Math.max(0, v.sky / 5) * 0.18;
    h.s += swell + this.bob.hush * 0.05; d.s += swell + this.bob.drift * 0.05;
    // when the smile slips, the Clouds lean toward the Sun; when overcast, they cover it
    const near = Math.max(v.slip * 0.25, v.overcast);
    h.x = lerp(h.x, 205, near); h.y = lerp(h.y, 175, near); h.s = lerp(h.s, 2.0, v.overcast);
    d.x = lerp(d.x, 285, near); d.y = lerp(d.y, 215, near); d.s = lerp(d.s, 1.8, v.overcast);
    return [h, d];
  }

  // ------------------------------------------------ drawing
  draw() {
    const v = this.vis, gb = this.gBack, g = this.gWorld, gf = this.gFront, t = this.t;
    gb.clear(); g.clear(); gf.clear();
    const sv = clamp(v.sky / 5, -1, 1);
    let skyC = sv >= 0 ? lerpColor(COL.sky, 0xfff0b4, sv * 0.85) : lerpColor(COL.sky, 0x8b9db2, -sv * 0.85);
    skyC = lerpColor(skyC, 0xc4ccd4, v.overcast * 0.9);
    let grassC = sv >= 0 ? lerpColor(COL.grass, 0xbcc152, sv * 0.8) : lerpColor(COL.grass, 0x3b9466, -sv * 0.8);
    grassC = lerpColor(grassC, 0x5b9a58, v.overcast * 0.6);
    gb.fillStyle(skyC, 1).fillRect(0, 0, W, HORIZON);
    if (v.glow > 0.01) {
      const p = this.shadowPoint(1);
      gb.fillStyle(0xffe2a8, 0.85 * v.glow).fillEllipse(p.x, HORIZON, 560 * v.glow, 210);
      gb.fillStyle(0xffc078, 0.9 * v.glow).fillEllipse(p.x, HORIZON, 300 * v.glow, 110);
      gb.fillStyle(0xff9f5a, 0.9 * v.glow).fillEllipse(p.x, HORIZON, 120 * v.glow, 44);
    }
    if (v.sky > 2.5) { // heat wobble
      gb.lineStyle(2, 0xffffff, 0.25 * (v.sky - 2.5) / 2.5);
      for (let i = 0; i < 6; i++) {
        const y = HORIZON - 20 - i * 14, pts = [];
        for (let x = 0; x <= W; x += 24) pts.push({ x, y: y + Math.sin(x * 0.03 + t * 3 + i) * 3 });
        gb.strokePoints(pts);
      }
    }
    gb.fillStyle(grassC, 1).fillRect(0, HORIZON, W, H - HORIZON);
    if (v.sky < -2.5) { // standing water
      gb.fillStyle(0x7fc0ee, 0.55 * clamp((-v.sky - 2.5) / 2.5, 0, 1));
      gb.fillEllipse(170, 548, 120, 16); gb.fillEllipse(720, 590, 150, 18); gb.fillEllipse(880, 520, 90, 12);
    }
    if (v.puddle > 0.01) gb.fillStyle(0x7cc2f0, 1).fillEllipse(565, 586, 250 * v.puddle, 38 * v.puddle);
    // tufts of Greenfolk
    const tuftC = lerpColor(grassC, 0x1e781e, 0.35);
    gb.lineStyle(3, tuftC, 1);
    const whisperSway = v.silent ? 0.2 : 1;
    for (const tf of this.tufts) {
      const sw = Math.sin(t * 1.4 + tf.ph) * 3 * whisperSway, s = tf.s;
      gb.lineBetween(tf.x, tf.y, tf.x - 5 * s + sw, tf.y - 10 * s);
      gb.lineBetween(tf.x, tf.y, tf.x + sw, tf.y - 13 * s);
      gb.lineBetween(tf.x, tf.y, tf.x + 5 * s + sw, tf.y - 10 * s);
    }

    this.drawSun(g);
    for (const c of this.cloudPos()) this.drawCloud(g, c.x, c.y, c.s);
    this.drawShadow(g);
    if (v.puddle > 0.3) { // upside-down meadow in the shaded water
      const a = clamp((v.puddle - 0.3) / 0.7, 0, 1);
      [[0xff8c00, 500], [0xff5a96, 528], [COL.bud, 556], [0xffffff, 590], [0xb464ff, 618]].forEach(([c, x], i) => {
        g.fillStyle(c, 0.75 * a).fillCircle(x, 592 + Math.sin(t * 2 + i) * 1.5, 7);
        g.lineStyle(2, COL.stem, 0.5 * a).lineBetween(x, 585, x, 578);
      });
      g.fillStyle(COL.sunFill, 0.7 * a).fillCircle(470, 596, 6);
    }
    FLOWERS.forEach((f, i) => {
      const sway = Math.sin(t * 1.1 + i * 1.3) * 0.035 + Math.sin(t * 9) * 0.04 * this.bob[f.id];
      this.drawFlower(g, f.x, f.color, sway + this.lean[f.id], 6, 1);
    });
    this.drawBud(g);
    for (const p of this.puffs) this.drawPuff(g, p);
    if (this.rayling.show) this.drawRayling(g, this.rayling);
    this.extraRaylings.forEach(r => this.drawRayling(g, r));

    // front layer: rain, falling petals, seeds
    gf.lineStyle(2, COL.rain, 0.85);
    for (const d of this.drops) gf.lineBetween(d.x, d.y, d.x - 1, d.y + 8);
    for (const f of this.falling) { gf.fillStyle(COL.bud, clamp(f.life / 1.5, 0, 1)).fillEllipse(f.x, f.y, 14, 9); }
    for (const s of this.seeds) {
      const a = clamp(s.life / 2, 0, 1);
      gf.lineStyle(1, 0x9a8f7a, a).lineBetween(s.x, s.y, s.x, s.y + 6);
      gf.fillStyle(0xffffff, a).fillCircle(s.x, s.y, 4);
    }
    this.drawDice();
  }

  drawSun(g) {
    const v = this.vis, sx = SUN.x, sy = SUN.y, R = SUN.r, bright = S ? hourIdx(S.min) : 4;
    for (let i = 0; i < 12; i++) {
      const a = v.rayRot + i * Math.PI / 6 - Math.PI / 2, isB = i === bright && v.overcast < 0.5;
      let r1 = 106, r2 = 150;
      if (i === 4 && v.chip) r2 -= 12;
      if (isB) r2 += 12 + v.flash * 10;
      const c = Math.cos(a), s = Math.sin(a);
      if (isB) { g.lineStyle(17 + v.flash * 6, 0xffa000, 1); g.lineBetween(sx + c * (r1 - 3), sy + s * (r1 - 3), sx + c * (r2 + 3), sy + s * (r2 + 3)); }
      g.lineStyle(isB ? 9 : 9, isB ? 0xfffbe6 : COL.ray, 1);
      g.lineBetween(sx + c * r1, sy + s * r1, sx + c * r2, sy + s * r2);
    }
    if (v.blush > 7.5) { g.lineStyle(3, 0xffffff, 0.25 + 0.15 * Math.sin(this.t * 4)); g.strokeCircle(sx, sy, R + 14 + Math.sin(this.t * 3) * 3); }
    g.fillStyle(COL.sunEdge, 1).fillCircle(sx, sy, R + 4);
    g.fillStyle(COL.sunFill, 1).fillCircle(sx, sy, R - 3);
    g.fillStyle(COL.eye, 1).fillEllipse(sx - 30, sy - 18, 13, 19).fillEllipse(sx + 30, sy - 18, 13, 19);
    const b = clamp(v.blush / 10, 0, 1) * (1 - v.slip);
    const cheekC = b < 0.5 ? lerpColor(COL.sunFill, COL.cheek, b * 2) : lerpColor(COL.cheek, 0xff4a6a, (b - 0.5) * 2);
    const cw = 26 + b * 14, ch = 15 + b * 6;
    g.fillStyle(cheekC, 1).fillEllipse(sx - 54, sy + 16, cw, ch);
    g.fillStyle(v.laterCheek ? lerpColor(cheekC, 0xff8a1e, v.glow) : cheekC, 1).fillEllipse(sx + 54, sy + 16, cw, ch);
    const amp = 21 * (1 - v.slip) + clamp(v.blush - 6, 0, 4) * 1.2 * (1 - v.slip), pts = [];
    for (let x = -44; x <= 44; x += 4) pts.push({ x: sx + x, y: sy + 27 + amp * (1 - (x / 44) * (x / 44)) });
    g.lineStyle(6, COL.eye, 1).strokePoints(pts);
    g.fillStyle(COL.eye, 1).fillCircle(sx - 44, sy + 27, 3).fillCircle(sx + 44, sy + 27, 3);
  }

  drawCloud(g, x, y, s) {
    const v = this.vis;
    let c = lerpColor(0xffffff, 0xb4c0cc, Math.max(0, -v.sky / 5));
    c = lerpColor(c, 0xdde3e8, v.overcast);
    g.fillStyle(c, 1);
    [[-42, 10, 27], [-14, -8, 35], [22, -2, 31], [48, 12, 24], [0, 16, 27], [-32, 18, 21], [30, 18, 22]].forEach(([dx, dy, r]) => g.fillCircle(x + dx * s, y + dy * s, r * s));
  }

  drawShadow(g) {
    const v = this.vis;
    if (v.shadowA < 0.01 || v.budP < 0.3) return;
    const base = { x: BUD_X, y: BASE_Y }, tip = this.shadowPoint(1);
    const ang = Math.atan2(tip.y - base.y, tip.x - base.x), len = Math.hypot(tip.x - base.x, tip.y - base.y);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const a = 0.68 * v.shadowA;
    g.fillStyle(COL.shadow, a);
    if (len > 14) {
      const sEnd = this.shadowPoint(0.82), w0 = 4, w1 = 2.2;
      g.fillPoints([
        { x: base.x + nx * w0, y: base.y + ny * w0 }, { x: sEnd.x + nx * w1, y: sEnd.y + ny * w1 },
        { x: sEnd.x - nx * w1, y: sEnd.y - ny * w1 }, { x: base.x - nx * w0, y: base.y - ny * w0 }], true);
      const lp = this.shadowPoint(0.45);
      rotEllipse(g, lp.x + nx * 9, lp.y + ny * 9, Math.max(6, len * 0.07), 6, ang + 0.3);
      const hp = this.shadowPoint(0.9);
      rotEllipse(g, hp.x, hp.y, Math.max(12, len * 0.11), 17 * (1 - v.hide * 0.5), ang);
    }
    // the small gray coin right under the stem (what's left when it's hidden)
    rotEllipse(g, base.x + 3, base.y + 3, 14, 6, 0);
  }

  drawFlower(g, x, color, angle, nPetals, scale) {
    const len = STEM * scale, hx = x + Math.sin(angle) * len, hy = BASE_Y - Math.cos(angle) * len;
    g.lineStyle(6 * scale, COL.stem, 1).lineBetween(x, BASE_Y, hx, hy);
    const lx = lerp(hx, x, 0.55), ly = lerp(hy, BASE_Y, 0.55);
    g.fillStyle(COL.leaf, 1).fillEllipse(lx + 19 * scale, ly, 38 * scale, 19 * scale);
    g.fillStyle(color, 1);
    for (let i = 0; i < nPetals; i++) {
      const a = i * Math.PI * 2 / nPetals + angle - Math.PI / 2;
      g.fillCircle(hx + Math.cos(a) * 16 * scale, hy + Math.sin(a) * 16 * scale, 17 * scale);
    }
    g.fillStyle(COL.center, 1).fillCircle(hx, hy, 13 * scale);
  }

  drawBud(g) {
    const v = this.vis, p = v.budP;
    if (p <= 0.001) return;
    const len = 72 * clamp(p * 1.3, 0, 1);
    const wilt = S && S.petals <= 2 && v.seed === 0 ? 0.3 : 0;
    const ang = Math.sin(this.t * 1.3 + 2) * 0.03 + wilt;
    const hx = BUD_X + Math.sin(ang) * len, hy = BASE_Y - Math.cos(ang) * len;
    this.budHead = { x: hx, y: hy };
    g.lineStyle(5, COL.stem, 1).lineBetween(BUD_X, BASE_Y, hx, hy);
    if (p > 0.35) {
      const k = clamp((p - 0.35) / 0.4, 0, 1), lx = lerp(hx, BUD_X, 0.55), ly = lerp(hy, BASE_Y, 0.55);
      g.fillStyle(COL.leaf, 1).fillEllipse(lx + 15 * k, ly, 30 * k, 15 * k);
    }
    const hp = clamp((p - 0.5) / 0.5, 0, 1);
    if (hp <= 0) return;
    if (v.seed === 1) {
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.fillCircle(hx + Math.cos(a) * 11, hy + Math.sin(a) * 11, 8); }
      g.fillStyle(0xeeeeee, 1).fillCircle(hx, hy, 10);
    } else if (v.seed === 2) {
      g.fillStyle(0xb8a978, 1).fillCircle(hx, hy, 5);
    } else {
      const n = S ? S.petals : 5;
      g.fillStyle(COL.bud, 1);
      for (let i = 0; i < n; i++) {
        const a = i * Math.PI * 2 / 5 + ang - Math.PI / 2;
        g.fillCircle(hx + Math.cos(a) * 12 * hp, hy + Math.sin(a) * 12 * hp, 11.5 * hp);
      }
      g.fillStyle(COL.sunFill, 1).fillCircle(hx, hy, 9.5 * hp);
    }
    if (v.seedlings > 0.01) {
      [470, 505, 540, 575, 610].forEach((x, i) => {
        const s = v.seedlings, y = BASE_Y + 4;
        g.fillStyle(COL.shadow, 0.5 * s); rotEllipse(g, x + 10 * s, y + 2, 9 * s, 3, -0.25);
        g.lineStyle(3, COL.stem, s).lineBetween(x, y, x, y - 18 * s);
        g.fillStyle(COL.leaf, s).fillEllipse(x + 5 * s, y - 10 * s, 10 * s, 5 * s);
        g.fillStyle(COL.bud, s).fillCircle(x, y - 20 * s, 4 * s + Math.sin(this.t * 2 + i) * 0.3);
      });
    }
  }

  drawPuff(g, p) {
    if (p.alpha <= 0.02) return;
    const t = this.t, s = p.s;
    let x = p.x, y = p.y, sq = 1;
    if (p.state === 'idle' || p.state === 'walk') y -= Math.abs(Math.sin(t * (p.state === 'walk' ? 6 : 3) + p.ph)) * 6;
    if (p.state === 'stiff' || p.state === 'startled') { x += (Math.random() - 0.5) * 2.5; y += (Math.random() - 0.5) * 2; }
    if (p.state === 'sleep') { sq = 0.75; y += 5; }
    if (p.state === 'float') y += Math.sin(t * 3) * 3;
    const wool = p.state === 'startled' || p.rain > 0 ? 0xdfe7ef : 0xffffff;
    if (p.state !== 'sleep') {
      g.lineStyle(3, 0x6d6d6d, p.alpha);
      [-9, -3, 4, 10].forEach(dx => g.lineBetween(x + dx * s, y + 6 * s, x + dx * s, y + 15 * s));
    }
    g.fillStyle(wool, p.alpha);
    [[-9, 0, 10], [9, 0, 10], [0, -6, 12], [0, 3, 11]].forEach(([dx, dy, r]) => g.fillCircle(x + dx * s, y + dy * s * sq, r * s));
    if (p.state === 'stiff' || p.state === 'startled') { g.fillCircle(x - 4 * s, y - 16 * s, 4 * s); g.fillCircle(x + 6 * s, y - 15 * s, 3.5 * s); }
    g.fillStyle(0x9aa4ae, p.alpha).fillCircle(x - 17 * s, y - 2 * s * sq, 6.5 * s);
    if (p.state === 'sleep') { g.lineStyle(1.5, 0x3c3c3c, p.alpha).lineBetween(x - 20 * s, y - 3 * s * sq, x - 16 * s, y - 3 * s * sq); }
    else { g.fillStyle(0x2a2a2a, p.alpha).fillCircle(x - 19 * s, y - 4 * s, 1.6 * s); }
  }

  drawRayling(g, r) {
    const hop = r.hop > 0 ? Math.sin(r.hop * Math.PI) * 10 : 0;
    g.save();
    g.translateCanvas(r.x, r.y - hop);
    g.rotateCanvas(r.rot + (r.hop > 0 ? Math.sin(r.hop * 12) * 0.08 : 0));
    g.fillStyle(COL.ray, 1).fillRoundedRect(-6.5, -17, 13, 34, 4);
    g.fillStyle(COL.eye, 1).fillCircle(-2.6, -8, 1.7).fillCircle(2.6, -8, 1.7);
    g.lineStyle(1.6, COL.eye, 1); g.beginPath(); g.arc(0, -4.5, 3, 0.25, Math.PI - 0.25, false); g.strokePath();
    g.fillStyle(0xff9678, 0.9).fillCircle(-4, -4, 1.6).fillCircle(4, -4, 1.6);
    g.restore();
  }

  drawDice() {
    const gd = this.gDice; gd.clear();
    if (!this.dice.show) return;
    const pip = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    [[838, this.dice.a], [892, this.dice.b]].forEach(([x, val], i) => {
      const y = 700 + (this.dice.spin ? Math.sin(this.t * 40 + i) * 4 : 0), sz = 44;
      gd.fillStyle(0xffffff, 1).fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 9);
      gd.lineStyle(3, 0xe8b400, 1).strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 9);
      gd.fillStyle(0xe09a00, 1);
      pip[val].forEach(([px, py]) => gd.fillCircle(x + px * 11, y + py * 11, 4.2));
    });
  }
}

// ---------------------------------------------------------------- effects
function applyFx(w, fx) {
  if (!fx) return;
  if (typeof fx === 'function') { fx(w); return; }
  if (fx.sky) S.sky = clamp(S.sky + fx.sky, -5, 5);
  if (fx.setSky !== undefined) S.sky = fx.setSky;
  if (fx.blush) {
    S.blush = clamp(S.blush + fx.blush, 0, 10);
    if (fx.blush > 0 && S.blush >= 8) S.sky = clamp(S.sky + 1, -5, 5); // a delighted Sun makes the day hotter
  }
  if (fx.petals) {
    const before = S.petals;
    S.petals = clamp(S.petals + fx.petals, 0, 5);
    if (S.petals < before) { w.dropPetals(before - S.petals); S.blush = clamp(S.blush - 1, 0, 10); }
  }
  if (fx.gw) for (const k in fx.gw) S.gw[k] = clamp(S.gw[k] + fx.gw[k], -2, 2);
  if (fx.gwAll) for (const k in S.gw) S.gw[k] = clamp(S.gw[k] + fx.gwAll, -2, 2);
  if (fx.flag) [].concat(fx.flag).forEach(f => { S.flags[f] = true; });
  if (fx.unflag) [].concat(fx.unflag).forEach(f => { delete S.flags[f]; });
  if (fx.jumpHour) { S.min = (Math.floor(S.min / 60) + 1) * 60 + 2; w.vis.flash = 1; Snd.chime(1046.5); }
  if (fx.v) fx.v(w);
}

function damageLines() {
  if (S.sky >= 5) return [
    ['', `The Sun has been delighted for too long. The air wobbles. The Eldest's edges go brown and crisp, and so do two of your petals.`, { petals: -2, gwAll: -1, blush: -2, setSky: 3, v: w => w.scorchFlash() }],
    ['orange', `Hot! I said so first! ...Ow.`],
    ['white', `Too much.`]
  ];
  return [
    ['', `Every Puff in the meadow lets go at once. The grass goes under. The Eldest bow under the weight of the water, and two of your petals are knocked clean off.`, { petals: -2, gwAll: -1, blush: -2, setSky: -3, v: w => w.puffRain(3, true) }],
    ['pink', `Is everyone alright? Is everyone— oh, my leaf.`],
    ['white', `Flood. Bad.`]
  ];
}

// ---------------------------------------------------------------- boot
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W, height: H,
  backgroundColor: '#87cefa',
  banner: false,
  audio: { noAudio: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [World]
});
window.EA_GAME = game;
})();
