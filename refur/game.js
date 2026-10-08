/* REFUR — one terrace, one day. Procedural stand-ins; drop Lincoln's files in assets/. */
(function () {
  "use strict";

  var IMAGES = [
    "bg_sky", "spire", "title_logo", "engine_0", "engine_1",
    "keeper_n_0", "keeper_n_1", "keeper_e_0", "keeper_e_1", "keeper_s_0", "keeper_s_1", "keeper_w_0", "keeper_w_1",
    "crop_sapgourd", "crop_quillstalk", "crop_glintpod", "crop_burrclutch", "crop_hand", "crop_oldroot",
    "grazer_bladderkin_0", "grazer_bladderkin_1", "grazer_habit_0", "grazer_habit_1",
    "grazer_ropejack_0", "grazer_ropejack_1", "grazer_longhabit",
    "card_frame", "suit_h", "suit_s", "suit_d", "suit_c",
    "wag_1", "wag_2", "wag_3", "wag_4", "wag_5", "wag_6", "wag_7", "wag_8", "wag_9", "wag_10", "wag_11", "wag_12",
    "ui_joystick", "ui_btn_a", "ui_btn_b", "ui_btn_c", "ui_btn_d", "ui_chip", "ui_gold", "ui_leaf"
  ];

  var COL = {
    ink: "#24161c", cream: "#f4e6c8", cream2: "#e7d3ae",
    sky0: "#6e5aa8", sky1: "#c9a4c6", sky2: "#f3c4a4", sky3: "#e39a78",
    terra: "#c4623e", terraD: "#8a3e2c", plum: "#5c3556", plumD: "#3a2438",
    moss: "#6e8f46", mossD: "#3d5a30", wheat: "#e4c56e",
    brass: "#e0b15a", brassD: "#a67a32", teal: "#2fbfb4", mag: "#e454a4",
    red: "#e24b4b", blue: "#3aa0d8", green: "#3cba78",
    soil: "#6a432c", stone: "#8a7368", path: "#5e463c"
  };

  var SUITS = ["h", "s", "d", "c"];
  var RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  var WAGS = [
    null,
    { id: 1, name: "Lathe-Tongue", cost: 5, blurb: "Quillstalks fire twice as fast. D: all of them loose a volley." },
    { id: 2, name: "Rust Halo", cost: 4, blurb: "Each Glintpod still standing at Harvest gives +3 gold. D: they pay 1 now and zap." },
    { id: 3, name: "The Overwinterer", cost: 6, blurb: "One surviving crop stays planted into the next Day. D: shield the weakest crop." },
    { id: 4, name: "Habit Coat", cost: 4, blurb: "+2 Mult for each Habit you shoo off the path. D: shove every Habit." },
    { id: 5, name: "Bladder Gut", cost: 4, blurb: "Popped Bladderkin have a 1 in 3 chance to drop a free 2. D: for 3s every pop drops one." },
    { id: 6, name: "Wrong Almanac", cost: 6, blurb: "Hearts and Spades count as the same suit for flushes. D: slow the rim for 3s." },
    { id: 7, name: "Fen Clock", cost: 5, blurb: "+1 plant action, −1 compost. D: slow the rim for 3s." },
    { id: 8, name: "Twelve Thumbs", cost: 5, blurb: "Face cards count twice for rank chips. D: Hands swat in a frenzy." },
    { id: 9, name: "Lean Year", cost: 4, blurb: "×3 Mult if you planted 4 or fewer cards. D: a pulse, stronger in a lean year." },
    { id: 10, name: "Scale Memory", cost: 5, blurb: "+4 Mult for each pair on adjacent plots. D: those pairs spark and heal." },
    { id: 11, name: "Back-Hair", cost: 3, blurb: "+15 chips for each surviving crop on the outer terrace. D: the outer row fires." },
    { id: 12, name: "Tithe-Gnaw", cost: 5, blurb: "Tithe −20% while you hold it, but every wave gets +2 grazers. D: gnaw every grazer." }
  ];
  var LINES = [
    "Two Wags. One is a good idea.",
    "I accept gold. I was built to accept gold. I resent it, slightly.",
    "The last keeper bought the Overwinterer. He is still out there, overwintering.",
    "Reroll? Bold. Costly. Correct, maybe."
  ];
  var OLD_NOTE = "The coat comes back one hair a day. The Engine counts the hairs. Don't argue with it about the count, it was here first.\nThe suits on the rim are mine. Old ones. They don't know they're empty. Plant thick where they step.\nIf a Ropejack takes your queen, it wanted her more than you did. Plant the twos.";
  var ENGINE_OPEN = "TITHE: SIXTY. I RECEIVE IN CHIPS. I ALSO RECEIVE IN APOLOGIES, BUT THEY ARE WORTH NOTHING.";
  var TUTORIAL = "Plant 3 cards. Walk the Keeper to a plot and press A, or tap the plot.\nPress D to start Dusk. One Bladderkin and one Habit will walk the rim.\nB shoos. C waters a crop, three times.\nWhatever is still standing is harvested as a poker hand. Its name comes up in big letters.\nBack-Hair pays extra chips for crops on the outer plots.";
  var BOSS = {
    long: { name: "The Long Habit", text: "A giant empty suit. It tramples a whole terrace column as it passes." },
    wind: { name: "Wind Lease", text: "Bladderkin come in double, at double speed." },
    rope: { name: "Ropejack Fair", text: "Every 4 seconds a Ropejack snatches a card from your hand." },
    mute: { name: "Mute Engine", text: "Wags are switched off this Day." }
  };
  var BOSSES = ["long", "wind", "rope", "mute"];
  var PLOTS = [
    { side: "L", outer: false, t: 0.66 },
    { side: "L", outer: false, t: 0.80 },
    { side: "L", outer: true, t: 0.60 },
    { side: "L", outer: true, t: 0.86 },
    { side: "R", outer: false, t: 0.20 },
    { side: "R", outer: false, t: 0.34 },
    { side: "R", outer: true, t: 0.14 },
    { side: "R", outer: true, t: 0.40 }
  ];
  var ADJ = [[0, 1], [2, 3], [0, 2], [1, 3], [4, 5], [6, 7], [4, 6], [5, 7]];
  var BLADDER_COLORS = ["#e24b4b", "#3aa0d8", "#3cba78", "#e454a4", "#e0b15a"];

  var canvas, ctx, view = { w: 960, h: 540 }, frame = null, hits = [];
  var keys = {}, joy = { on: false, x: 0, y: 0 }, btnHold = { A: false, B: false, C: false, D: false };
  var pointers = {};
  var IMG = {};
  var rngState = 1;
  var opts, col, meta, G;
  var finePointer = false;
  var booted = false;
  var tagModal = false;

  function storeGet(k, fallback) {
    try {
      var v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function storeSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  function storeDel(k) {
    try { localStorage.removeItem(k); } catch (e) {}
  }
  function saveCol() { storeSet("refur-collection", col); }
  function saveMeta() { storeSet("refur-meta", meta); }
  function saveOpts() { storeSet("refur-options", opts); RefurAudio.setEnabled(opts.sound, opts.music); }

  function seeCard(card) {
    if (!card) return;
    var k = card.suit + ":" + card.rank;
    if (col.cards[k]) return;
    col.cards[k] = 1;
    saveCol();
  }
  function seeWag(id) {
    var k = String(id);
    if (col.wags[k]) return;
    col.wags[k] = 1;
    saveCol();
  }
  function seeGrazer(type) {
    var map = { bladder: "bladderkin", habit: "habit", rope: "ropejack", long: "longhabit" };
    var k = map[type] || type;
    if (col.grazers[k]) return;
    col.grazers[k] = 1;
    saveCol();
  }
  function colStats() {
    var cards = Object.keys(col.cards).length;
    var wags = Object.keys(col.wags).length;
    var grazers = Object.keys(col.grazers).length;
    var seen = cards + wags + grazers;
    var total = 52 + 12 + 4;
    return { cards: cards, wags: wags, grazers: grazers, seen: seen, total: total, pct: Math.floor(seen / total * 100) };
  }

  function rng() {
    var a = rngState | 0;
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    rngState = a >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function formatDate(key) {
    var p = (key || todayKey()).split("-");
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return (+p[2]) + " " + months[(+p[1]) - 1] + " " + p[0];
  }

  function sfx(name) { RefurAudio.play(name); }
  function buzz(ms) {
    if (!opts || !opts.haptics || !navigator.vibrate) return;
    var ua = navigator.userActivation;
    if (ua && !ua.isActive) return;
    try { navigator.vibrate(ms); } catch (e) {}
  }
  function toast(text) { G.toast = { text: text, life: 2.1 }; }
  function engineTalk() { G.clack = 0.45; sfx("engine_clack"); }

  function freshShell() {
    return {
      screen: "title", time: 0, menu: 0, fx: [], fxText: [], bolts: [],
      toast: null, modal: null, shake: 0, clack: 0, hand: [], plots: null
    };
  }
  function rankStr(r) { return r === 14 ? "A" : r === 13 ? "K" : r === 12 ? "Q" : r === 11 ? "J" : String(r); }
  function suitName(s) { return { h: "Hearts", s: "Spades", d: "Diamonds", c: "Clubs" }[s]; }
  function suitGlyph(s) { return { h: "♥", s: "♠", d: "♦", c: "♣" }[s]; }
  function suitColor(s) { return s === "h" || s === "d" ? "#a33b3b" : "#24161c"; }
  function cardLabel(c) { return rankStr(c.rank) + " of " + suitName(c.suit); }
  function cropName(c) {
    if (c.rank === 14) return "Old Root";
    if (c.rank >= 11) return "Hand";
    return { h: "Sapgourd", s: "Quillstalk", d: "Glintpod", c: "Burrclutch" }[c.suit];
  }
  function cropImage(c) {
    if (c.rank === 14) return "crop_oldroot";
    if (c.rank >= 11) return "crop_hand";
    return { h: "crop_sapgourd", s: "crop_quillstalk", d: "crop_glintpod", c: "crop_burrclutch" }[c.suit];
  }
  function mainKind(c) {
    if (c.rank === 14) return "root";
    return { h: "sap", s: "quill", d: "glint", c: "burr" }[c.suit];
  }
  function isHand(c) { return c.rank >= 11 && c.rank <= 13; }
  function isGlint(c) { return c.suit === "d" && c.rank !== 14; }
  function hasWag(id) { return !!(G.wags && G.wags.indexOf(id) >= 0); }
  function wagOn(id) { return hasWag(id) && G.boss !== "mute"; }
  function makeCard(suit, rank) { return { id: G.cardSeq++, suit: suit, rank: rank }; }

  function buildDeck(kind) {
    var cards = [];
    var si, ri;
    for (si = 0; si < 4; si++) {
      for (ri = 0; ri < 13; ri++) {
        if (kind === "thorn" && SUITS[si] === "d") cards.push(makeCard("s", RANKS[ri]));
        else cards.push(makeCard(SUITS[si], RANKS[ri]));
      }
    }
    if (kind === "wealth") {
      var extra = [2, 6, 10, 14];
      for (ri = 0; ri < extra.length; ri++) cards.push(makeCard("d", extra[ri]));
    }
    return shuffle(cards);
  }

  function pathXY(t) {
    var a = t * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * 180, y: Math.sin(a) * 100 };
  }
  function plotDesign(i) {
    var d = PLOTS[i];
    var p = pathXY(d.t);
    var f = d.outer ? 1.28 : 0.74;
    return { x: p.x * f, y: p.y * f, t: d.t, side: d.side, outer: d.outer };
  }
  function angDist(a, b) {
    var d = Math.abs(a - b);
    if (d > 0.5) d = 1 - d;
    return d;
  }
  function plotNear(t, window) {
    var best = -1, bd = window, i, d;
    for (i = 0; i < 8; i++) {
      d = angDist(t, PLOTS[i].t);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function nearestGrazer(t, range) {
    var best = null, bd = range, i, g, d;
    if (!G.grazers) return null;
    for (i = 0; i < G.grazers.length; i++) {
      g = G.grazers[i];
      if (!g.alive) continue;
      d = angDist(t, g.t);
      if (d < bd) { bd = d; best = g; }
    }
    return best;
  }
  function grazersIn(t, range) {
    var out = [], i, g;
    if (!G.grazers) return out;
    for (i = 0; i < G.grazers.length; i++) {
      g = G.grazers[i];
      if (g.alive && angDist(t, g.t) <= range) out.push(g);
    }
    return out;
  }

  function initRun(mode, kind, seed) {
    rngState = (seed >>> 0) || 1;
    G = freshShell();
    G.v = 1;
    G.mode = mode;
    G.deckKind = kind;
    G.date = null;
    G.seed = rngState;
    G.ante = 1;
    G.day = 1;
    G.gold = 0;
    G.banked = 0;
    G.deck = [];
    G.discard = [];
    G.hand = [];
    G.exiled = [];
    G.plots = [null, null, null, null, null, null, null, null];
    G.wags = [11];
    G.keeper = { x: 0, y: 48, facing: "s", walk: 0 };
    G.cardSeq = 1;
    G.shopVisits = 0;
    G.won = false;
    G.credited = false;
    G.victoryShown = false;
    G.keepPlot = -1;
    G.selected = -1;
    G.grazers = [];
    G.phase = "plant";
    G.deck = buildDeck(kind);
    seeWag(11);
  }

  function waveList() {
    if (G.ante === 1 && G.day === 1) return ["bladder", "habit"];
    var a = G.ante, d = G.day;
    var bl = 2 + d + Math.floor((a - 1) * 1.1);
    var ha = Math.floor(a / 2) + (d > 1 ? 1 : 0);
    var ro = a >= 2 ? Math.floor((a + d) / 4) : 0;
    if (a === 1 && d === 3) { bl = 4; ha = 2; ro = 0; }
    if (G.boss === "wind") bl *= 2;
    if (G.boss === "rope") ro += 3;
    if (G.gnawToday) bl += 2;
    var seq = [];
    if (G.boss === "long") seq.push("long");
    var left = { bladder: bl, habit: ha, rope: ro };
    var order = ["bladder", "habit", "bladder", "rope", "habit", "bladder"];
    var i = 0, guard = 0;
    while (left.bladder + left.habit + left.rope > 0 && guard < 120) {
      var t = order[i % order.length];
      i++; guard++;
      if (left[t] > 0) { seq.push(t); left[t]--; }
    }
    return seq;
  }
  function waveSummary(list) {
    var n = { bladder: 0, habit: 0, rope: 0, long: 0 };
    var i;
    for (i = 0; i < list.length; i++) n[list[i]]++;
    var parts = [];
    if (n.bladder) parts.push(n.bladder + " Bladderkin");
    if (n.habit) parts.push(n.habit + " Habit" + (n.habit > 1 ? "s" : ""));
    if (n.rope) parts.push(n.rope + " Ropejack" + (n.rope > 1 ? "s" : ""));
    if (n.long) parts.push("the Long Habit");
    var s = parts.join(", ");
    if (G.boss === "rope") s += " · a snatch every 4s";
    return s;
  }

  function drawTo(n) {
    var drew = false;
    while (G.hand.length < n) {
      if (!G.deck.length) {
        if (!G.discard.length) break;
        G.deck = G.discard;
        G.discard = [];
        shuffle(G.deck);
      }
      var card = G.deck.pop();
      G.hand.push(card);
      seeCard(card);
      drew = true;
    }
    if (drew) sfx("card_draw");
  }
  function ensurePair() {
    var counts = {}, i, c;
    for (i = 0; i < G.hand.length; i++) {
      c = G.hand[i].rank;
      counts[c] = (counts[c] || 0) + 1;
    }
    for (var k in counts) if (counts[k] >= 2) return;
    if (!G.hand.length) return;
    var want = G.hand[0].rank;
    for (i = 0; i < G.deck.length; i++) {
      if (G.deck[i].rank === want && G.deck[i].suit !== G.hand[0].suit) {
        var swap = G.hand[G.hand.length - 1];
        G.hand[G.hand.length - 1] = G.deck[i];
        G.deck[i] = swap;
        seeCard(G.hand[G.hand.length - 1]);
        return;
      }
    }
  }

  function dawn() {
    G.phase = "plant";
    G.selected = -1;
    G.habitsShooed = 0;
    G.plantedCount = 0;
    G.watersLeft = 3;
    G.wagUsed = false;
    G.burst = null;
    G.grazers = [];
    G.bolts = [];
    G.glintGold = 0;
    G.shooCd = 0;
    G.keepPlot = G.keepPlot == null ? -1 : G.keepPlot;
    G.bankedThisDay = false;
    G.result = null;
    G.boss = G.day === 3 ? BOSSES[(G.ante - 1) % 4] : null;
    G.gnawToday = wagOn(12);
    G.tithe = RefurPoker.titheAmount(G.ante, G.day, G.gnawToday);
    var fen = wagOn(7);
    G.plantsLeft = fen ? 6 : 5;
    G.plantsMax = G.plantsLeft;
    G.compostsLeft = fen ? 2 : 3;
    G.compostsMax = G.compostsLeft;
    G.compostsUsed = 0;
    var i;
    for (i = 0; i < 8; i++) {
      if (!G.plots[i]) continue;
      G.plots[i].hp = G.plots[i].maxHp;
      G.plots[i].shield = 0;
      G.plots[i].paid = {};
      G.plots[i].cd = 0.4;
      G.plots[i].swatCd = 0.3;
    }
    if (G.day === 3) G.moltSeen = false;
    drawTo(7);
    if (G.mode === "story" && G.ante === 1 && G.day === 1) ensurePair();
    G.wave = waveList();
    G.preview = null;
  }

  function enterDay() {
    dawn();
    G.screen = "play";
    if (G.ante === 1 && G.day === 1 && !meta.sawTutorial) showTutorial();
    else if (G.day === 3) showMolt();
    else if (G.mode === "daily" && G.ante === 1 && G.day === 1) toast("Daily Furrow · " + formatDate(G.date) + " · Tithe " + G.tithe);
    persist();
    RefurAudio.setMusic("day");
  }

  function showTutorial() {
    G.modal = {
      kind: "tutorial",
      title: "DAY 1",
      body: TUTORIAL,
      buttons: [{ label: "I have the ledger", fn: function () { dismissModal(); } }]
    };
  }
  function showMolt() {
    var b = BOSS[G.boss];
    if (!b) return;
    G.modal = {
      kind: "molt",
      title: "MOLT DAY — " + b.name,
      body: b.text,
      buttons: [{ label: "Face the rim", fn: function () { dismissModal(); } }]
    };
  }
  function dismissModal() {
    if (!G.modal) return;
    var kind = G.modal.kind;
    G.modal = null;
    if (kind === "tutorial") { meta.sawTutorial = true; saveMeta(); }
    if (kind === "molt") { G.moltSeen = true; persist(); }
  }
  function openPause() {
    G.modal = {
      kind: "pause",
      title: "PAUSED",
      body: "The rim will wait.",
      buttons: [
        { label: "Resume", fn: function () { G.modal = null; } },
        { label: "Options", fn: function () { G.modal = null; G.backScreen = "play"; G.screen = "options"; } },
        { label: "Abandon the run", fn: confirmAbandon }
      ]
    };
  }
  function confirmAbandon() {
    G.modal = {
      kind: "abandon",
      title: "CLOSE THE LEDGER",
      body: "The Engine keeps what you already banked. This run ends.",
      buttons: [
        { label: "Abandon", fn: abandon },
        { label: "Stay", fn: function () { G.modal = null; } }
      ]
    };
  }

  function plantAt(i) {
    if (G.phase !== "plant" || G.modal) return;
    if (G.selected < 0 || !G.hand[G.selected]) { toast("Select a card."); return; }
    if (G.plantsLeft <= 0) { toast("No plantings left."); return; }
    if (G.plots[i]) { toast("That plot is taken."); return; }
    var card = G.hand.splice(G.selected, 1)[0];
    if (G.selected >= G.hand.length) G.selected = G.hand.length - 1;
    var hp = 20 + card.rank;
    G.plots[i] = { card: card, hp: hp, maxHp: hp, cd: 0.35, swatCd: 0.25, shield: 0, paid: {} };
    G.plantsLeft--;
    G.plantedCount++;
    var pd = plotDesign(i);
    G.keeper.x = pd.x;
    G.keeper.y = pd.y;
    sfx("plant");
    buzz(10);
    burst(pd.x, pd.y, "#6a432c", 5);
    persist();
  }
  function plantNearest() {
    var best = -1, bd = 78, i, p, d;
    for (i = 0; i < 8; i++) {
      if (G.plots[i]) continue;
      p = plotDesign(i);
      d = Math.hypot(p.x - G.keeper.x, p.y - G.keeper.y);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) { toast("Walk closer to an empty plot."); return; }
    plantAt(best);
  }
  function compostSelected() {
    if (G.phase !== "plant" || G.modal) return;
    if (G.selected < 0 || !G.hand[G.selected]) { toast("Select a card to compost."); return; }
    if (G.compostsLeft <= 0) { toast("No compost left."); return; }
    var target = G.hand.length;
    var card = G.hand.splice(G.selected, 1)[0];
    G.selected = -1;
    G.discard.push(card);
    G.compostsLeft--;
    G.compostsUsed++;
    sfx("compost");
    drawTo(target);
    toast("Compost +" + G.compostsUsed + " Mult today.");
    persist();
  }

  function onPlot(i) {
    if (G.modal) return;
    if (G.screen === "harvest") {
      if (wagOn(3) && G.plots[i]) {
        G.keepPlot = i;
        toast("The Overwinterer will keep this one.");
      }
      return;
    }
    if (G.screen !== "play") return;
    var pd = plotDesign(i);
    G.keeper.x = pd.x;
    G.keeper.y = pd.y;
    if (G.phase === "plant") {
      if (G.selected >= 0) plantAt(i);
      return;
    }
    if (G.phase === "dusk") waterPlot(i);
  }
  function onCard(i) {
    if (G.modal || G.screen !== "play" || G.phase !== "plant") return;
    G.selected = G.selected === i ? -1 : i;
    sfx("ui_tap");
  }
  function onWag(i) {
    if (G.modal || G.screen !== "play" || G.phase !== "plant") return;
    if (!G.wags[i] && G.wags[i] !== 0) return;
    var id = G.wags.splice(i, 1)[0];
    G.wags.unshift(id);
    toast(WAGS[id].name + " — " + WAGS[id].blurb);
    sfx("ui_tap");
    persist();
  }

  function armDusk() {
    G.phase = "dusk";
    G.spawnQ = (G.wave || []).slice();
    G.spawnT = 0.55;
    G.fairT = 1.2;
    G.grazers = [];
    G.cleared = 0;
    G.waveTotal = G.spawnQ.length;
    G.nextId = 1;
    G.bolts = [];
    G.glintGold = 0;
    G.burst = null;
    G.shooCd = 0;
    var i;
    for (i = 0; i < 8; i++) if (G.plots[i]) G.plots[i].paid = {};
  }
  function startDusk() {
    if (G.phase !== "plant" || G.modal) return;
    armDusk();
    G.screen = "play";
    sfx("ui_tap");
    RefurAudio.setMusic("dusk");
    persist();
  }

  function grazerHp(type) {
    var base = { bladder: 14, habit: 34, rope: 9, long: 86 }[type];
    return Math.round(base * (1 + (G.ante - 1) * 0.12));
  }
  function spawn(type, fair) {
    var hp = grazerHp(type);
    var speed = { bladder: 0.082, habit: 0.04, rope: 0.13, long: 0.028 }[type];
    if (type === "bladder" && G.boss === "wind") speed *= 2;
    if (fair) speed *= 1.35;
    var g = {
      id: G.nextId++, type: type, hp: hp, maxHp: hp, t: 0.002, speed: speed,
      biteCd: 0, stealDone: false, stealAt: fair ? 0.1 : 0.52,
      slowT: 0, rootT: 0, alive: true, fair: !!fair, didL: false, didR: false,
      color: BLADDER_COLORS[G.nextId % BLADDER_COLORS.length]
    };
    G.grazers.push(g);
    seeGrazer(type);
    if (fair) G.waveTotal++;
    var p = pathXY(0);
    burst(p.x, p.y - 20, "#f4e6c8", 4);
  }

  function hurt(g, dmg, byShoo) {
    if (!g || !g.alive || dmg <= 0) return;
    g.hp -= dmg;
    if (g.hp <= 0) killGrazer(g, !!byShoo);
  }
  function killGrazer(g, byShoo) {
    if (!g || !g.alive) return;
    g.alive = false;
    G.cleared = (G.cleared || 0) + 1;
    var pos = pathXY(g.t);
    if (byShoo && (g.type === "habit" || g.type === "long")) G.habitsShooed = (G.habitsShooed || 0) + 1;
    if (g.type === "bladder") {
      sfx("pop");
      burst(pos.x, pos.y, g.color, 7);
      bladderGut();
    } else if (g.type === "rope") sfx("rope");
    else sfx("cloth");
  }
  function escapeGrazer(g) {
    if (!g.alive) return;
    g.alive = false;
    G.cleared = (G.cleared || 0) + 1;
  }
  function bladderGut() {
    if (!(hasWag(5) && G.boss !== "mute")) return;
    var certain = G.burst && G.burst.id === 5;
    if (!certain && rng() >= 1 / 3) return;
    var card = makeCard(SUITS[Math.floor(rng() * 4)], 2);
    G.hand.push(card);
    seeCard(card);
    sfx("card_draw");
    toast("A free 2 dropped into your hand.");
  }
  function damageCrop(i, dmg) {
    var p = G.plots[i];
    if (!p || dmg <= 0) return;
    if (p.shield > 0) {
      var a = Math.min(p.shield, dmg);
      p.shield -= a;
      dmg -= a;
    }
    if (dmg <= 0) return;
    p.hp -= dmg;
    var pd = plotDesign(i);
    floatText("-" + dmg, pd.x, pd.y - 16);
    if (p.hp <= 0) wilt(i);
  }
  function wilt(i) {
    var p = G.plots[i];
    if (!p) return;
    G.discard.push(p.card);
    var pd = plotDesign(i);
    burst(pd.x, pd.y, "#6e8f46", 6);
    G.plots[i] = null;
    if (G.keepPlot === i) G.keepPlot = -1;
    sfx("cloth");
    floatText("wilt", pd.x, pd.y);
  }
  function healPlot(i, n) {
    var p = G.plots[i];
    if (!p) return;
    p.hp = Math.min(p.maxHp, p.hp + n);
  }
  function waterPlot(i) {
    if (G.phase !== "dusk" || G.modal) return;
    if (G.watersLeft <= 0) { toast("No water left."); return; }
    if (!G.plots[i]) { toast("Nothing planted there."); return; }
    healPlot(i, 14);
    G.watersLeft--;
    sfx("water");
    buzz(8);
    var pd = plotDesign(i);
    burst(pd.x, pd.y, "#3aa0d8", 5);
  }
  function waterNearest() {
    var best = -1, bd = 74, i, p, d;
    for (i = 0; i < 8; i++) {
      if (!G.plots[i]) continue;
      p = plotDesign(i);
      d = Math.hypot(p.x - G.keeper.x, p.y - G.keeper.y);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) { toast("No crop in reach."); return; }
    waterPlot(best);
  }
  function tryShoo() {
    if (G.phase !== "dusk" || G.modal) return;
    if (G.shooCd > 0) return;
    G.shooCd = 0.38;
    sfx("shoo");
    buzz(12);
    var hit = false, i, g, p, dx, dy;
    for (i = 0; i < G.grazers.length; i++) {
      g = G.grazers[i];
      if (!g.alive) continue;
      p = pathXY(g.t);
      if (g.type === "rope") p.y -= 36;
      dx = p.x - G.keeper.x; dy = p.y - G.keeper.y;
      if (dx * dx + dy * dy > 62 * 62) continue;
      hit = true;
      g.t -= 0.055;
      hurt(g, 7, true);
      if (g.alive && g.t < 0) killGrazer(g, true);
    }
    burst(G.keeper.x, G.keeper.y, "#f4e6c8", 4);
    if (!hit) floatText("miss", G.keeper.x, G.keeper.y - 18);
  }
  function stealFromHand(g) {
    g.stealDone = true;
    if (!G.hand.length) {
      floatText("empty hand", pathXY(g.t).x, pathXY(g.t).y);
      return;
    }
    var best = 0, i;
    for (i = 1; i < G.hand.length; i++) if (G.hand[i].rank >= G.hand[best].rank) best = i;
    var card = G.hand.splice(best, 1)[0];
    G.exiled.push(card);
    if (G.selected >= G.hand.length) G.selected = G.hand.length - 1;
    sfx("steal");
    toast("A Ropejack took the " + cardLabel(card) + ".");
  }
  function stomp(side) {
    sfx("boots");
    G.shake = 0.45;
    var dmg = 12 + (G.ante - 1) * 2, i;
    for (i = 0; i < 8; i++) if (PLOTS[i].side === side) damageCrop(i, dmg);
  }
  function addBolt(plot, g, color) {
    var p = pathXY(g.t);
    G.bolts.push({ x1: plot.x, y1: plot.y, x2: p.x, y2: p.y, life: 0.16, color: color });
  }

  function tryFire(i, kind) {
    var plot = plotDesign(i);
    var g, group, k;
    if (kind === "quill") {
      g = nearestGrazer(plot.t, 0.12);
      if (!g) return false;
      hurt(g, 6, false);
      sfx("quill");
      addBolt(plot, g, "#f4e6c8");
      return true;
    }
    if (kind === "sap") {
      g = nearestGrazer(plot.t, 0.1);
      if (!g) return false;
      group = grazersIn(g.t, 0.045);
      for (k = 0; k < group.length; k++) {
        group[k].slowT = Math.max(group[k].slowT, 1.3);
        hurt(group[k], 2, false);
      }
      sfx("sap");
      addBolt(plot, g, "#e24b4b");
      return true;
    }
    if (kind === "glint") {
      g = nearestGrazer(plot.t, 0.1);
      if (!g) return false;
      hurt(g, 2, false);
      addBolt(plot, g, "#e0b15a");
      return true;
    }
    if (kind === "burr") {
      g = nearestGrazer(plot.t, 0.09);
      if (!g || g.rootT > 0) return false;
      g.rootT = 1.35;
      hurt(g, 3, false);
      sfx("burr");
      return true;
    }
    if (kind === "root") {
      group = grazersIn(plot.t, 0.22);
      if (!group.length) return false;
      for (k = 0; k < group.length; k++) hurt(group[k], 7, false);
      sfx("burr");
      return true;
    }
    return false;
  }
  function trySwat(i) {
    var plot = plotDesign(i);
    var g = nearestGrazer(plot.t, 0.055);
    if (!g) return false;
    hurt(g, 4, false);
    addBolt(plot, g, "#f0c9a0");
    return true;
  }
  function updateGlint(i) {
    var card = G.plots[i].card;
    if (!isGlint(card)) return;
    var plot = plotDesign(i);
    var gs = grazersIn(plot.t, 0.1), k, id;
    if (!G.plots[i].paid) G.plots[i].paid = {};
    for (k = 0; k < gs.length; k++) {
      id = gs[k].id;
      if (G.plots[i].paid[id]) continue;
      G.plots[i].paid[id] = 1;
      G.glintGold = (G.glintGold || 0) + 1;
      sfx("glint");
      floatText("+1g", plot.x, plot.y - 12);
    }
  }
  function updateCrops(dt) {
    var frenzy = G.burst && G.burst.id === 8;
    var i, p, kind, interval;
    for (i = 0; i < 8; i++) {
      p = G.plots[i];
      if (!p) continue;
      updateGlint(i);
      p.cd -= dt;
      p.swatCd = (p.swatCd || 0) - dt;
      if (p.cd <= 0) {
        kind = mainKind(p.card);
        interval = { quill: 0.78, sap: 1.05, glint: 1.15, burr: 2.45, root: 1.7 }[kind] || 1;
        if (kind === "quill" && wagOn(1)) interval *= 0.5;
        p.cd = tryFire(i, kind) ? interval : 0.18;
      }
      if (isHand(p.card) && p.swatCd <= 0) p.swatCd = trySwat(i) ? (frenzy ? 0.16 : 0.72) : 0.15;
    }
  }

  function grazerSpeed(g) {
    var sp = g.speed;
    if (g.rootT > 0) return 0;
    if (g.slowT > 0) sp *= 0.55;
    if (G.burst && (G.burst.id === 6 || G.burst.id === 7)) sp *= 0.5;
    return sp;
  }
  function updateDusk(dt) {
    G.spawnT -= dt;
    if (G.spawnT <= 0 && G.spawnQ && G.spawnQ.length) {
      spawn(G.spawnQ.shift(), false);
      G.spawnT = 1.15;
    }
    if (G.boss === "rope") {
      G.fairT -= dt;
      if (G.fairT <= 0) { G.fairT = 4; spawn("rope", true); }
    }
    var i, g, prev;
    for (i = 0; i < G.grazers.length; i++) {
      g = G.grazers[i];
      if (!g.alive) continue;
      if (g.slowT > 0) g.slowT -= dt;
      if (g.rootT > 0) g.rootT -= dt;
      prev = g.t;
      g.t += grazerSpeed(g) * dt;
      if (!g.alive) continue;
      if (g.type === "long") {
        if (!g.didR && prev < 0.25 && g.t >= 0.25) { stomp("R"); g.didR = true; }
        if (!g.didL && prev < 0.75 && g.t >= 0.75) { stomp("L"); g.didL = true; }
      }
      if (g.type === "rope" && !g.stealDone && prev < g.stealAt && g.t >= g.stealAt) stealFromHand(g);
      if (!g.alive) continue;
      if (g.t >= 1) { escapeGrazer(g); continue; }
      if (g.t < 0) { killGrazer(g, true); continue; }
      if (g.rootT <= 0 && (g.type === "bladder" || g.type === "habit")) {
        g.biteCd -= dt;
        if (g.biteCd <= 0) {
          var idx = plotNear(g.t, 0.042);
          if (idx >= 0 && G.plots[idx]) {
            damageCrop(idx, g.type === "habit" ? 5 : 3);
            g.biteCd = (g.type === "habit" ? 0.58 : 0.72) * (g.slowT > 0 ? 1.65 : 1);
          }
        }
      }
    }
    updateCrops(dt);
    G.amb = (G.amb || 0) - dt;
    if (G.amb <= 0) {
      var habit = false, bi;
      for (bi = 0; bi < G.grazers.length; bi++) if (G.grazers[bi].alive && (G.grazers[bi].type === "habit" || G.grazers[bi].type === "long")) habit = true;
      if (habit) sfx("boots");
      G.amb = 1.25;
    }
    if ((!G.spawnQ || !G.spawnQ.length) && !aliveAny()) endDusk();
  }
  function aliveAny() {
    var i;
    for (i = 0; i < G.grazers.length; i++) if (G.grazers[i].alive) return true;
    return false;
  }
  function endDusk() {
    G.phase = "harvest";
    G.screen = "harvest";
    G.burst = null;
    sealResult();
    persist();
    RefurAudio.setMusic("day");
  }

  function outerAlive() {
    var n = 0, i;
    for (i = 0; i < 8; i++) if (PLOTS[i].outer && G.plots[i]) n++;
    return n;
  }
  function adjacentAlive() {
    var n = 0, i;
    for (i = 0; i < ADJ.length; i++) if (G.plots[ADJ[i][0]] && G.plots[ADJ[i][1]]) n++;
    return n;
  }
  function glintAlive() {
    var n = 0, i;
    for (i = 0; i < 8; i++) if (G.plots[i] && isGlint(G.plots[i].card)) n++;
    return n;
  }
  function standingCards() {
    var list = [], i;
    for (i = 0; i < 8; i++) if (G.plots[i]) list.push(G.plots[i].card);
    return list;
  }
  function currentScore() {
    var cards = standingCards();
    var hand = RefurPoker.bestHand(cards, wagOn(6));
    var mods = {
      twelve: wagOn(8),
      bonusChips: wagOn(11) ? 15 * outerAlive() : 0,
      bonusMult: (G.compostsUsed || 0) + (wagOn(4) ? 2 * (G.habitsShooed || 0) : 0) + (wagOn(10) ? 4 * adjacentAlive() : 0),
      lean: wagOn(9) && (G.plantedCount || 0) <= 4
    };
    return RefurPoker.finalizeScore(hand, mods);
  }
  function sealResult() {
    var s = currentScore();
    s.tithe = G.tithe;
    s.ok = s.score >= G.tithe;
    s.pay = s.ok ? RefurPoker.goldForScore(s.score, G.tithe) : 0;
    s.rust = (G.boss !== "mute" && hasWag(2)) ? 3 * glintAlive() : 0;
    s.glint = G.glintGold || 0;
    s.goldTotal = s.ok ? s.pay + s.rust + s.glint : 0;
    G.result = s;
    G.harvestShown = 0;
    G.harvestSound = false;
  }

  function advanceHarvest() {
    if (!G.result) return;
    if (G.harvestShown < G.result.score) {
      G.harvestShown = G.result.score;
      if (!G.harvestSound) {
        G.harvestSound = true;
        sfx(G.result.ok ? "engine_stamp" : "engine_groan");
      }
      return;
    }
    if (!G.result.ok) { lose(); return; }
    if (G.ante === 8 && G.day === 3 && !G.victoryShown) {
      G.victoryShown = true;
      G.won = true;
      G.screen = "victory";
      persist();
      return;
    }
    bankDay();
    openShop();
  }
  function bankDay() {
    if (G.bankedThisDay) return;
    G.bankedThisDay = true;
    G.banked += G.result.score;
    G.gold += G.result.goldTotal;
    resolveField();
    noteBest();
  }
  function resolveField() {
    var keep = -1, i, best, br;
    if (wagOn(3)) {
      if (G.keepPlot >= 0 && G.plots[G.keepPlot]) keep = G.keepPlot;
      else {
        best = -1; br = -1;
        for (i = 0; i < 8; i++) if (G.plots[i] && G.plots[i].card.rank > br) { br = G.plots[i].card.rank; best = i; }
        keep = best;
      }
    }
    for (i = 0; i < 8; i++) {
      if (!G.plots[i]) continue;
      if (i === keep) {
        G.plots[i].hp = G.plots[i].maxHp;
        G.plots[i].shield = 0;
        G.plots[i].paid = {};
        continue;
      }
      G.discard.push(G.plots[i].card);
      G.plots[i] = null;
    }
    for (i = 0; i < G.hand.length; i++) G.discard.push(G.hand[i]);
    G.hand = [];
    G.keepPlot = keep;
  }
  function openShop() {
    G.screen = "shop";
    rollShop();
    engineTalk();
    RefurAudio.setMusic("day");
    persist();
  }
  function rollShop() {
    var pool = [], i, offers, pack, suit, rank;
    for (i = 1; i <= 12; i++) if (G.wags.indexOf(i) < 0) pool.push(WAGS[i]);
    shuffle(pool);
    offers = pool.slice(0, 2);
    pack = [];
    for (i = 0; i < 3; i++) {
      suit = SUITS[Math.floor(rng() * 4)];
      rank = RANKS[Math.floor(rng() * RANKS.length)];
      var card = makeCard(suit, rank);
      pack.push(card);
      seeCard(card);
    }
    for (i = 0; i < offers.length; i++) seeWag(offers[i].id);
    var line = LINES[G.shopVisits % LINES.length];
    G.shopVisits++;
    G.shop = { offers: offers, pack: pack, taken: false, line: line };
  }
  function buyWag(i) {
    var o = G.shop.offers[i];
    if (!o) return;
    if (G.wags.length >= 5) { toast("The row is full."); engineTalk(); return; }
    if (G.gold < o.cost) { toast("Not enough gold."); engineTalk(); return; }
    G.gold -= o.cost;
    G.wags.push(o.id);
    seeWag(o.id);
    G.shop.offers[i] = null;
    engineTalk();
    toast(o.name + " joins the row.");
    persist();
  }
  function takePack(i) {
    if (!G.shop || G.shop.taken) return;
    var card = G.shop.pack[i];
    G.discard.push(card);
    G.shop.taken = true;
    G.shop.took = i;
    sfx("card_draw");
    toast(cropName(card) + " joins the deck.");
    persist();
  }
  function rerollShop() {
    if (G.gold < 2) { toast("Reroll costs 2 gold."); return; }
    var taken = G.shop && G.shop.taken;
    var took = G.shop && G.shop.took;
    var oldPack = G.shop && G.shop.pack;
    G.gold -= 2;
    rollShop();
    if (taken) {
      G.shop.taken = true;
      G.shop.took = took;
      G.shop.pack = oldPack;
    }
    engineTalk();
    persist();
  }
  function nextDay() {
    if (!G.shop || !G.shop.taken) { toast("Choose one seed."); return; }
    if (G.day >= 3) { G.ante += 1; G.day = 1; }
    else G.day += 1;
    G.shop = null;
    enterDay();
  }

  function noteBest() {
    if (!G || G.mode !== "daily" || !G.date) return;
    var all = storeGet("refur-daily-best", {});
    var prev = all[G.date];
    var banked = G.banked || 0;
    if (!prev || banked > prev.banked) {
      all[G.date] = { banked: banked, ante: G.ante, day: G.day };
      storeSet("refur-daily-best", all);
    }
  }
  function dailyBest() {
    var all = storeGet("refur-daily-best", {});
    return all[todayKey()] || null;
  }
  function todayDailySave() {
    var raw = storeGet("refur-daily-save", null);
    if (raw && raw.date !== todayKey()) { storeDel("refur-daily-save"); return null; }
    return raw;
  }
  function creditWin() {
    if (!G || !G.won || G.credited) return;
    G.credited = true;
    meta.wins = (meta.wins || 0) + 1;
    saveMeta();
  }
  function clearRunSave() {
    if (!G || !G.mode) return;
    storeDel(G.mode === "daily" ? "refur-daily-save" : "refur-save");
  }
  function lose() {
    sfx("engine_groan");
    creditWin();
    noteBest();
    clearRunSave();
    G.screen = "end";
    G.endKind = "lose";
    G.modal = null;
    RefurAudio.setMusic("day");
  }
  function stepDown() {
    if (G.result && G.result.ok && !G.bankedThisDay) bankDay();
    creditWin();
    noteBest();
    clearRunSave();
    G.screen = "end";
    G.endKind = "win";
    G.modal = null;
  }
  function keepWalking() {
    G.won = true;
    G.victoryShown = true;
    bankDay();
    openShop();
  }
  function abandon() {
    noteBest();
    creditWin();
    clearRunSave();
    G = freshShell();
    RefurAudio.setMusic("title");
  }
  function goTitle() {
    if (G && G.mode && (G.screen === "play" || G.screen === "shop" || G.screen === "harvest" || G.screen === "opening" || G.screen === "victory")) persist();
    G = freshShell();
    RefurAudio.setMusic("title");
  }

  function fireWag() {
    if (G.phase !== "dusk" || G.modal) return;
    if (G.boss === "mute") { toast("The Engine is mute today."); engineTalk(); return; }
    if (!G.wags.length) { toast("No Wag in the row."); engineTalk(); return; }
    if (G.wagUsed) { toast("That Wag is spent today."); return; }
    var id = G.wags[0];
    G.wagUsed = true;
    G.burst = { id: id, t: 3 };
    sfx("wag_fire");
    buzz(18);
    var i, g, pd, weakest, wh, grp;
    if (id === 1) {
      for (i = 0; i < 8; i++) if (G.plots[i] && mainKind(G.plots[i].card) === "quill") {
        g = nearestGrazer(plotDesign(i).t, 0.2);
        if (g) { hurt(g, 8, false); addBolt(plotDesign(i), g, "#f4e6c8"); }
      }
      sfx("quill");
    } else if (id === 2) {
      for (i = 0; i < 8; i++) if (G.plots[i] && isGlint(G.plots[i].card)) {
        G.glintGold = (G.glintGold || 0) + 1;
        g = nearestGrazer(plotDesign(i).t, 0.16);
        if (g) hurt(g, 6, false);
      }
      sfx("glint");
    } else if (id === 3) {
      weakest = -1; wh = 1e9;
      for (i = 0; i < 8; i++) if (G.plots[i] && G.plots[i].hp < wh) { wh = G.plots[i].hp; weakest = i; }
      if (weakest >= 0) G.plots[weakest].shield = (G.plots[weakest].shield || 0) + 18;
    } else if (id === 4) {
      for (i = 0; i < G.grazers.length; i++) {
        g = G.grazers[i];
        if (!g.alive || (g.type !== "habit" && g.type !== "long")) continue;
        g.t -= 0.08;
        hurt(g, 8, true);
        if (g.alive && g.t < 0) killGrazer(g, true);
      }
      sfx("shoo");
    } else if (id === 5) {
      for (i = 0; i < G.grazers.length; i++) if (G.grazers[i].alive && G.grazers[i].type === "bladder") hurt(G.grazers[i], 5, false);
    } else if (id === 8) {
      for (i = 0; i < 8; i++) if (G.plots[i] && isHand(G.plots[i].card)) trySwat(i);
    } else if (id === 9) {
      var dmg = (G.plantedCount || 0) <= 4 ? 10 : 4;
      for (i = 0; i < G.grazers.length; i++) if (G.grazers[i].alive) hurt(G.grazers[i], dmg, false);
    } else if (id === 10) {
      for (i = 0; i < ADJ.length; i++) {
        if (!(G.plots[ADJ[i][0]] && G.plots[ADJ[i][1]])) continue;
        healPlot(ADJ[i][0], 6);
        healPlot(ADJ[i][1], 6);
        pd = plotDesign(ADJ[i][0]);
        g = nearestGrazer(pd.t, 0.16);
        if (g) hurt(g, 6, false);
      }
    } else if (id === 11) {
      for (i = 0; i < 8; i++) if (PLOTS[i].outer && G.plots[i]) {
        g = nearestGrazer(plotDesign(i).t, 0.2);
        if (g) { hurt(g, 9, false); addBolt(plotDesign(i), g, "#e4c56e"); }
      }
    } else if (id === 12) {
      for (i = 0; i < G.grazers.length; i++) if (G.grazers[i].alive) hurt(G.grazers[i], 7, false);
    }
    toast(WAGS[id].name);
  }

  function zapAll(dmg) {
    var i;
    for (i = 0; i < G.grazers.length; i++) if (G.grazers[i].alive) hurt(G.grazers[i], dmg, false);
  }

  function moveKeeper(dt) {
    var x = 0, y = 0;
    if (keys.ArrowUp || keys.KeyW) y -= 1;
    if (keys.ArrowDown || keys.KeyS) y += 1;
    if (keys.ArrowLeft || keys.KeyA) x -= 1;
    if (keys.ArrowRight || keys.KeyD) x += 1;
    if (joy.on) { x += joy.x; y += joy.y; }
    var m = Math.sqrt(x * x + y * y);
    if (m > 1) { x /= m; y /= m; }
    if (m > 0.12) {
      G.keeper.x += x * 96 * dt;
      G.keeper.y += y * 78 * dt;
      G.keeper.facing = Math.abs(x) > Math.abs(y) ? (x > 0 ? "e" : "w") : (y > 0 ? "s" : "n");
      G.keeper.walk = (G.keeper.walk || 0) + dt;
    }
    var ex = G.keeper.x / 230, ey = G.keeper.y / 145;
    var e = ex * ex + ey * ey;
    if (e > 1) {
      G.keeper.x = (ex / Math.sqrt(e)) * 230;
      G.keeper.y = (ey / Math.sqrt(e)) * 145;
    }
  }

  function update(dt) {
    G.time = (G.time || 0) + dt;
    updateFx(dt);
    var portrait = window.innerHeight > window.innerWidth;
    if (G.screen === "opening" && G.openStep === 0 && !portrait) {
      G.openT = (G.openT || 0) + dt;
      if (G.openT > 3.3) G.openStep = 1;
    }
    if (G.screen === "play" && !G.modal && !portrait) {
      if (G.phase === "plant" || G.phase === "dusk") moveKeeper(dt);
      if (G.phase === "dusk") {
        G.shooCd = Math.max(0, (G.shooCd || 0) - dt);
        if (keys.KeyK || btnHold.B) tryShoo();
        if (G.burst) { G.burst.t -= dt; if (G.burst.t <= 0) G.burst = null; }
        updateDusk(dt);
      }
      G.preview = currentScore();
    }
    if (G.screen === "harvest" && G.result) {
      var target = G.result.score;
      var prev = G.harvestShown || 0;
      if (prev < target) {
        G.harvestShown = Math.min(target, prev + dt * Math.max(90, target * 0.85));
        if (Math.floor(G.harvestShown / 24) !== Math.floor(prev / 24)) RefurAudio.blip(420 + (target ? (G.harvestShown / target) * 680 : 0));
        if (G.harvestShown >= target && !G.harvestSound) {
          G.harvestSound = true;
          sfx(G.result.ok ? "engine_stamp" : "engine_groan");
        }
      }
    }
    var mode = "title";
    if (!opts.music) mode = "off";
    else if (G.screen === "play" && G.phase === "dusk") mode = "dusk";
    else if (G.screen === "title") mode = "title";
    else mode = "day";
    RefurAudio.setMusic(mode === "off" ? "off" : mode);
    RefurAudio.pump(dt);
  }
  function updateFx(dt) {
    if (!G.fx) G.fx = [];
    if (!G.fxText) G.fxText = [];
    if (G.clack > 0) G.clack -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.toast) { G.toast.life -= dt; if (G.toast.life <= 0) G.toast = null; }
    var i, p;
    for (i = G.fx.length - 1; i >= 0; i--) {
      p = G.fx[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) G.fx.splice(i, 1);
    }
    for (i = G.fxText.length - 1; i >= 0; i--) {
      G.fxText[i].life -= dt;
      G.fxText[i].y -= 14 * dt;
      if (G.fxText[i].life <= 0) G.fxText.splice(i, 1);
    }
    if (G.bolts) {
      for (i = G.bolts.length - 1; i >= 0; i--) {
        G.bolts[i].life -= dt;
        if (G.bolts[i].life <= 0) G.bolts.splice(i, 1);
      }
    }
  }
  function floatText(text, x, y) {
    if (!G.fxText) G.fxText = [];
    G.fxText.push({ text: text, x: x, y: y, life: 1 });
    if (G.fxText.length > 16) G.fxText.shift();
  }
  function burst(x, y, color, n) {
    if (!G.fx) G.fx = [];
    var i, a;
    for (i = 0; i < n; i++) {
      a = (Math.PI * 2 * i) / n;
      G.fx.push({ x: x, y: y, vx: Math.cos(a) * 36, vy: Math.sin(a) * 26, life: 0.45, color: color });
    }
  }

  function syncRng() { if (G) G.rngState = rngState >>> 0; }
  function snapshot() {
    syncRng();
    var screen = G.screen;
    if (screen === "options" || screen === "collection" || screen === "decks" || screen === "daily" || screen === "title") {
      screen = (G.backScreen && G.backScreen !== "title") ? G.backScreen : "play";
    }
    return {
      v: 1, screen: screen, phase: G.phase || "plant", mode: G.mode, deckKind: G.deckKind,
      date: G.date, seed: G.seed, rngState: G.rngState, cardSeq: G.cardSeq,
      ante: G.ante, day: G.day, gold: G.gold, banked: G.banked,
      deck: G.deck, discard: G.discard, hand: G.hand, exiled: G.exiled, plots: G.plots, wags: G.wags,
      plantsLeft: G.plantsLeft, plantsMax: G.plantsMax, compostsLeft: G.compostsLeft,
      compostsMax: G.compostsMax, compostsUsed: G.compostsUsed, watersLeft: G.watersLeft,
      wagUsed: !!G.wagUsed, plantedCount: G.plantedCount, habitsShooed: G.habitsShooed || 0,
      glintGold: G.glintGold || 0, boss: G.boss, tithe: G.tithe, gnawToday: !!G.gnawToday, wave: G.wave,
      keeper: G.keeper, shop: G.shop, shopVisits: G.shopVisits || 0, keepPlot: G.keepPlot,
      won: !!G.won, credited: !!G.credited, victoryShown: !!G.victoryShown, bankedThisDay: !!G.bankedThisDay,
      result: G.result, harvestShown: G.harvestShown || 0, harvestSound: !!G.harvestSound,
      selected: G.selected == null ? -1 : G.selected, openStep: G.openStep || 0, openT: G.openT || 0,
      openTalked: !!G.openTalked, moltSeen: !!G.moltSeen, endKind: G.endKind || null
    };
  }
  function persist() {
    if (!G || !G.mode) return;
    storeSet(G.mode === "daily" ? "refur-daily-save" : "refur-save", snapshot());
  }
  function restore(data) {
    if (!data || data.v !== 1 || !data.plots || data.plots.length !== 8 || !data.wags) return false;
    var t = G && G.time || 0;
    G = freshShell();
    var k;
    for (k in data) if (Object.prototype.hasOwnProperty.call(data, k)) G[k] = data[k];
    G.time = t;
    rngState = data.rngState || 1;
    G.grazers = [];
    G.bolts = [];
    G.fx = [];
    G.fxText = [];
    G.modal = null;
    G.toast = null;
    if (!G.keeper) G.keeper = { x: 0, y: 48, facing: "s", walk: 0 };
    if (!G.exiled) G.exiled = [];
    if (G.screen === "play" && G.phase === "dusk") armDusk();
    if (G.screen === "play" && G.phase === "plant" && G.ante === 1 && G.day === 1 && !meta.sawTutorial) showTutorial();
    else if (G.screen === "play" && G.phase === "plant" && G.day === 3 && !G.moltSeen) showMolt();
    RefurAudio.setMusic(G.phase === "dusk" ? "dusk" : "day");
    return true;
  }

  function startStory(kind) {
    initRun("story", kind, (Date.now() >>> 0) || 1);
    G.screen = "opening";
    G.openStep = 0;
    G.openT = 0;
    G.openTalked = false;
    persist();
    RefurAudio.setMusic("day");
  }
  function finishOpening() {
    if (G.openStep === 0) { G.openStep = 1; return; }
    if (G.openStep === 1) {
      G.openStep = 2;
      if (!G.openTalked) { G.openTalked = true; engineTalk(); }
      return;
    }
    enterDay();
  }
  function startDaily(fresh) {
    var key = todayKey();
    if (!fresh) {
      var save = todayDailySave();
      if (save && restore(save)) return;
    }
    storeDel("refur-daily-save");
    initRun("daily", "standard", hashStr("refur|" + key) || 1);
    G.date = key;
    enterDay();
  }
  function clickDaily() {
    sfx("ui_tap");
    if (todayDailySave()) G.screen = "daily";
    else startDaily(true);
  }

  function pressA() {
    sfx("ui_tap");
    buzz(6);
    if (G.modal) { var b = G.modal.buttons && G.modal.buttons[0]; if (b) b.fn(); return; }
    if (G.screen === "opening") { finishOpening(); return; }
    if (G.screen === "harvest") { advanceHarvest(); return; }
    if (G.screen === "victory") { keepWalking(); return; }
    if (G.screen === "end") { goTitle(); return; }
    if (G.screen === "shop") { nextDay(); return; }
    if (G.screen === "title") { activateTitle(titleItems()[G.menu || 0]); return; }
    if (G.screen === "decks" || G.screen === "collection" || G.screen === "options" || G.screen === "daily") return;
    if (G.screen === "play" && G.phase === "plant") plantNearest();
  }
  function pressB() {
    if (G.modal) {
      if (G.modal.kind === "pause" || G.modal.kind === "abandon") {
        var bs = G.modal.buttons;
        if (G.modal.kind === "abandon") { G.modal = null; return; }
        G.modal = null;
        return;
      }
      dismissModal();
      sfx("ui_tap");
      return;
    }
    if (G.screen === "play" && G.phase === "dusk") { tryShoo(); return; }
    if (G.screen === "play" && G.phase === "plant") {
      if (G.selected >= 0) { G.selected = -1; sfx("ui_tap"); return; }
      openPause();
      sfx("ui_tap");
      return;
    }
    if (G.screen === "opening") return;
    if (G.screen !== "title") {
      sfx("ui_tap");
      if (G.backScreen === "play" && G.mode) { G.screen = "play"; G.backScreen = null; return; }
      goTitle();
    }
  }
  function pressC() {
    if (G.modal) return;
    if (G.screen === "play" && G.phase === "plant") compostSelected();
    else if (G.screen === "play" && G.phase === "dusk") waterNearest();
  }
  function pressD() {
    if (G.modal) return;
    if (G.screen === "play" && G.phase === "plant") startDusk();
    else if (G.screen === "play" && G.phase === "dusk") fireWag();
  }
  function pressBtn(id) {
    if (id === "A") pressA();
    else if (id === "B") pressB();
    else if (id === "C") pressC();
    else if (id === "D") pressD();
  }

  function titleItems() {
    var save = storeGet("refur-save", null);
    var dsave = todayDailySave();
    var best = dailyBest();
    var st = colStats();
    return [
      { id: "new", label: "Start New Run", sub: "Wealth & Crop, or Thorn & Ledger" },
      { id: "cont", label: save ? ("Continue  ·  Ante " + save.ante + "  ·  Day " + save.day) : "Continue", sub: save ? "The ledger is still open" : "No run saved", disabled: !save },
      { id: "daily", label: dsave ? ("Resume furrow  ·  Ante " + dsave.ante + "  ·  Day " + dsave.day) : "Daily Furrow", sub: best ? ("Best " + best.banked + "  ·  Ante " + best.ante + " · Day " + best.day) : ("Today " + formatDate(todayKey()) + "  ·  no furrow yet") },
      { id: "col", label: "The Collection", sub: st.seen + " / " + st.total + "  ·  " + st.pct + "% seen" },
      { id: "opt", label: "Options", sub: "Sound, music, haptics, hands" }
    ];
  }
  function activateTitle(item) {
    if (!item || item.disabled) { sfx("ui_tap"); return; }
    sfx("ui_tap");
    buzz(8);
    if (item.id === "new") G.screen = "decks";
    else if (item.id === "cont") { var s = storeGet("refur-save", null); if (s) restore(s); }
    else if (item.id === "daily") clickDaily();
    else if (item.id === "col") { G.backScreen = "title"; G.screen = "collection"; }
    else if (item.id === "opt") { G.backScreen = "title"; G.screen = "options"; }
  }

  function readSafe() {
    var el = document.getElementById("insets");
    var r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: Math.max(0, window.innerWidth - r.right), b: Math.max(0, window.innerHeight - r.bottom) };
  }
  function layout(w, h, safe, left) {
    var L = safe.l, T = safe.t, R = w - safe.r, B = h - safe.b;
    var W = Math.max(220, R - L), H = Math.max(160, B - T);
    var u = Math.max(0.7, Math.min(1.2, H / 500));
    var joyR = Math.round(Math.max(40, Math.min(70, H * 0.145)));
    var btnR = Math.round(Math.max(18, Math.min(32, H * 0.064)));
    if (W < 760) { joyR = Math.min(joyR, 52); btnR = Math.min(btnR, 26); }
    var m = Math.round(8 * u);
    var joy = left
      ? { x: R - m - joyR, y: B - m - joyR, r: joyR }
      : { x: L + m + joyR, y: B - m - joyR, r: joyR };
    var cx = left ? (L + m + btnR * 2.2) : (R - m - btnR * 2.2);
    var cy = B - m - btnR * 2.2;
    var gap = btnR * 1.62;
    var buttons = {
      A: { x: cx, y: cy - gap, r: btnR, id: "A" },
      B: { x: cx - gap, y: cy, r: btnR, id: "B" },
      C: { x: cx, y: cy + gap, r: btnR, id: "C" },
      D: { x: cx + gap, y: cy, r: btnR, id: "D" }
    };
    var topH = Math.max(28, Math.round(32 * u));
    var wagW = Math.max(68, Math.min(104, W * 0.12));
    var handH = Math.max(74, Math.round(100 * u));
    var joyClear = joyR * 2 + m;
    var btnClear = btnR * 4.4 + m;
    var sideL = left ? btnClear : joyClear;
    var sideR = Math.max(wagW, left ? joyClear : btnClear);
    var play = { x: L + sideL, y: T + topH, w: Math.max(150, W - sideL - sideR), h: Math.max(110, H - topH - handH) };
    var wag = { x: R - wagW, y: T + topH, w: wagW - 8, h: Math.max(48, Math.min(play.h, H - topH - joyR * 2 - 16)) };
    return { L: L, T: T, R: R, B: B, W: W, H: H, u: u, joy: joy, buttons: buttons, topH: topH, wagW: wagW, handH: handH, play: play, wag: wag, left: left };
  }
  function camFrom(rect) {
    var margin = 34;
    var maxRx = Math.max(40, (rect.w / 2 - margin) / 1.36);
    var maxRy = Math.max(24, (rect.h / 2 - margin) / 1.36);
    var rx = Math.min(maxRx, maxRy / 0.56, rect.w * 0.34);
    var ry = Math.min(rx * 0.56, maxRy);
    rx = ry / 0.56;
    return { cx: rect.x + rect.w * 0.5, cy: rect.y + rect.h * 0.46, rx: rx, ry: ry, sx: rx / 180, sy: ry / 100 };
  }
  function W2S(cam, x, y) { return { x: cam.cx + x * cam.sx, y: cam.cy + y * cam.sy }; }

  /* ---------- drawing ---------- */
  function font(px, bold) { ctx.font = (bold ? "700 " : "") + px + "px Courier New, ui-monospace, monospace"; }
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function paint(name, x, y, w, h) {
    var img = IMG[name];
    if (!img || !img.complete || !img.naturalWidth) return false;
    ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    return true;
  }
  function wrap(text, maxW) {
    var paras = String(text).split("\n");
    var lines = [], p, words, line, i, t;
    for (p = 0; p < paras.length; p++) {
      words = paras[p].split(" ");
      line = "";
      for (i = 0; i < words.length; i++) {
        t = line ? line + " " + words[i] : words[i];
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
        else line = t;
      }
      lines.push(line);
    }
    return lines;
  }
  function inkText(text, x, y, fill) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = COL.ink;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill || COL.cream;
    ctx.fillText(text, x, y);
  }
  function panel(x, y, w, h) {
    roundRect(x, y, w, h, 12);
    ctx.fillStyle = "rgba(32,20,30,0.94)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COL.brass;
    ctx.stroke();
  }
  function uiButton(x, y, w, h, text, fn, disabled, hot) {
    roundRect(x, y, w, h, 8);
    ctx.fillStyle = disabled ? "#4a3c44" : (hot ? "#2a5c58" : "#6a3a58");
    ctx.fill();
    ctx.lineWidth = hot ? 3 : 2;
    ctx.strokeStyle = hot ? COL.teal : COL.ink;
    ctx.stroke();
    var u = frame ? frame.u : 1;
    var size = Math.round(15 * u);
    font(size, true);
    while (size > 10 && ctx.measureText(text).width > w - 16) { size--; font(size, true); }
    ctx.fillStyle = disabled ? "#b7a8a0" : COL.cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
    ctx.textBaseline = "alphabetic";
    if (!disabled && fn) hits.push({ x: x, y: y, w: w, h: h, fn: fn, modal: tagModal, kind: "ui", label: text });
  }

  function drawSky(w, h) {
    if (paint("bg_sky", 0, 0, w, h)) return;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, COL.sky0);
    g.addColorStop(0.42, COL.sky1);
    g.addColorStop(0.72, COL.sky2);
    g.addColorStop(1, COL.sky3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,220,190,0.35)";
    ctx.beginPath();
    ctx.ellipse(w * 0.72, h * 0.78, w * 0.28, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    var i, x, y;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (i = 0; i < 18; i++) {
      x = (i * 97 + 20) % w;
      y = (i * 53) % (h * 0.4);
      ctx.fillRect(x, y, 2, 2);
    }
  }
  function drawIsoBox(x, y, hw, hh, dep, top, leftC, rightC) {
    ctx.beginPath();
    ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath();
    ctx.fillStyle = top; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh + dep); ctx.lineTo(x - hw, y + dep); ctx.closePath();
    ctx.fillStyle = leftC; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh + dep); ctx.lineTo(x + hw, y + dep); ctx.closePath();
    ctx.fillStyle = rightC; ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - hw, y); ctx.lineTo(x - hw, y + dep); ctx.lineTo(x, y + hh + dep); ctx.lineTo(x + hw, y + dep); ctx.lineTo(x + hw, y);
    ctx.moveTo(x, y + hh); ctx.lineTo(x, y + hh + dep); ctx.stroke();
  }
  function drawSpire(cam) {
    if (paint("spire", cam.cx - cam.rx * 1.35, cam.cy - cam.ry * 2.1, cam.rx * 2.7, cam.ry * 3.3)) return;
    var layers = [
      { w: 1.15, h: 0.42, d: 0.22, y: 28, top: "#7f9a52", left: "#8d4030", right: "#c4623e" },
      { w: 0.92, h: 0.34, d: 0.18, y: 2, top: "#d7b85a", left: "#6d3348", right: "#a85a48" },
      { w: 0.7, h: 0.28, d: 0.16, y: -22, top: "#6e8f46", left: "#5c3556", right: "#8d4a3a" },
      { w: 0.5, h: 0.22, d: 0.14, y: -42, top: "#c4a15a", left: "#4a2c40", right: "#7a3e36" },
      { w: 0.32, h: 0.16, d: 0.2, y: -60, top: "#efe0bf", left: "#3a2438", right: "#6a3a58" }
    ];
    var i, L, c, s;
    for (i = 0; i < layers.length; i++) {
      L = layers[i];
      c = W2S(cam, 0, L.y);
      drawIsoBox(c.x, c.y, cam.rx * L.w, cam.ry * L.h, cam.ry * L.d * 1.3, L.top, L.left, L.right);
      ctx.strokeStyle = "rgba(36,22,28,0.35)";
      ctx.beginPath();
      for (s = -2; s <= 2; s++) {
        var a = W2S(cam, s * 28, L.y - 6);
        var b = W2S(cam, s * 28, L.y + 6);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }
    var crown = W2S(cam, 0, -78);
    ctx.fillStyle = "#d7fff8";
    ctx.fillRect(crown.x - 8, crown.y - 6, 16, 10);
    ctx.strokeStyle = COL.ink; ctx.strokeRect(crown.x - 8, crown.y - 6, 16, 10);
    var board = W2S(cam, -78, -70);
    ctx.fillStyle = "#6a432c";
    ctx.fillRect(board.x - 16, board.y - 14, 32, 26);
    ctx.fillStyle = COL.cream;
    ctx.fillRect(board.x - 12, board.y - 10, 24, 18);
    ctx.strokeStyle = COL.ink; ctx.strokeRect(board.x - 16, board.y - 14, 32, 26);
    ctx.fillStyle = COL.ink;
    ctx.fillRect(board.x - 8, board.y - 6, 16, 2);
    ctx.fillRect(board.x - 8, board.y - 2, 12, 2);
    ctx.fillRect(board.x - 8, board.y + 2, 14, 2);
    return board;
  }
  function drawMolts(cam) {
    var specs = [
      { x: -210, y: -130, s: 0.28, p: 0.4 },
      { x: 190, y: -150, s: 0.22, p: 1.3 },
      { x: 40, y: -180, s: 0.16, p: 2.1 }
    ];
    var i, sp, bob, c;
    for (i = 0; i < specs.length; i++) {
      sp = specs[i];
      bob = Math.sin(G.time * 0.6 + sp.p) * 8;
      c = W2S(cam, sp.x, sp.y + bob);
      drawIsoBox(c.x, c.y, cam.rx * sp.s, cam.ry * sp.s * 0.7, 8, "#b7a0c8", "#6a4a58", "#c48878");
      drawIsoBox(c.x, c.y - 10, cam.rx * sp.s * 0.55, cam.ry * sp.s * 0.4, 6, "#d8c8e4", "#5c4050", "#b07068");
    }
  }
  function drawPath(cam) {
    var i, p, s, n = 28;
    for (i = 0; i < n; i++) {
      p = W2S(cam, pathXY(i / n).x, pathXY(i / n).y);
      s = Math.max(7, cam.rx * 0.055);
      ctx.fillStyle = i % 2 ? "#6a5348" : "#7d6558";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, s, s * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5; ctx.stroke();
    }
    var gap = W2S(cam, pathXY(0).x, pathXY(0).y - 18);
    ctx.fillStyle = "rgba(244,230,200,0.85)";
    ctx.beginPath();
    ctx.ellipse(gap.x, gap.y, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawSuit(suit, x, y, r) {
    if (paint("suit_" + suit, x - r, y - r, r * 2, r * 2)) return;
    ctx.fillStyle = suitColor(suit);
    ctx.beginPath();
    if (suit === "d") {
      ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.75, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.75, y); ctx.closePath(); ctx.fill();
    } else if (suit === "h") {
      ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.45, 0, Math.PI * 2);
      ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r * 0.8, y); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.fill();
    } else if (suit === "c") {
      ctx.arc(x, y - r * 0.35, r * 0.38, 0, Math.PI * 2);
      ctx.arc(x - r * 0.4, y + r * 0.15, r * 0.38, 0, Math.PI * 2);
      ctx.arc(x + r * 0.4, y + r * 0.15, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 1, y, 2, r * 0.7);
    } else {
      ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.7, y + r * 0.15); ctx.lineTo(x, y + r * 0.45); ctx.lineTo(x - r * 0.7, y + r * 0.15); ctx.closePath(); ctx.fill();
      ctx.fillRect(x - 1, y + r * 0.3, 2, r * 0.6);
    }
  }
  function drawCropIcon(card, x, y, s) {
    var kind = mainKind(card);
    ctx.save();
    ctx.translate(x, y);
    if (kind === "sap") {
      ctx.fillStyle = "#e07a32"; ctx.beginPath(); ctx.ellipse(0, 2, s * 0.55, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3d5a30"; ctx.fillRect(-2, -s * 0.55, 4, s * 0.3);
    } else if (kind === "quill") {
      ctx.fillStyle = "#3a2438"; ctx.fillRect(-3, -s * 0.5, 6, s);
      ctx.fillStyle = "#f4e6c8";
      ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(0, -6); ctx.lineTo(0, 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.45, -4); ctx.lineTo(0, -8); ctx.lineTo(0, 2); ctx.fill();
    } else if (kind === "glint") {
      ctx.fillStyle = "#e0b15a";
      ctx.beginPath(); ctx.moveTo(0, -s * 0.55); ctx.lineTo(s * 0.4, 0); ctx.lineTo(0, s * 0.55); ctx.lineTo(-s * 0.4, 0); ctx.fill();
    } else if (kind === "burr") {
      ctx.fillStyle = "#3d5a30"; ctx.beginPath(); ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#24161c"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.2); ctx.lineTo(-s * 0.15, 0);
      ctx.moveTo(s * 0.4, -s * 0.1); ctx.lineTo(s * 0.15, 0.1);
      ctx.moveTo(0, s * 0.45); ctx.lineTo(0, s * 0.15);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#6a432c"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-s * 0.5, 4); ctx.quadraticCurveTo(0, -s * 0.4, s * 0.5, 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.2, 6); ctx.quadraticCurveTo(s * 0.1, -s * 0.2, s * 0.35, 6); ctx.stroke();
    }
    if (isHand(card)) {
      ctx.strokeStyle = "#e7b898"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(s * 0.55, -s * 0.35); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
  }
  function drawCrop(card, x, y, pix) {
    var name = cropImage(card);
    var w = 16 * pix, h = 20 * pix;
    if (paint(name, x - w / 2, y - h + 4, w, h)) return;
    drawCropIcon(card, x, y - 6 * (pix / 2), 10 + pix * 2);
  }
  function drawPlot(i, cam, pix) {
    var d = plotDesign(i);
    var s = W2S(cam, d.x, d.y);
    var rw = Math.max(16, 14 * pix), rh = rw * 0.55;
    ctx.fillStyle = "#4e3424";
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - rh); ctx.lineTo(s.x + rw, s.y); ctx.lineTo(s.x, s.y + rh); ctx.lineTo(s.x - rw, s.y); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6e8f46";
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - rh + 4); ctx.lineTo(s.x + rw - 5, s.y); ctx.lineTo(s.x, s.y + rh - 4); ctx.lineTo(s.x - rw + 5, s.y); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.stroke();
    if (G.plots && G.plots[i]) {
      drawCrop(G.plots[i].card, s.x, s.y, pix);
      var hp = G.plots[i].hp / G.plots[i].maxHp;
      ctx.fillStyle = "#24161c"; ctx.fillRect(s.x - 12, s.y - rh - 8, 24, 4);
      ctx.fillStyle = hp > 0.35 ? "#6e8f46" : "#e24b4b"; ctx.fillRect(s.x - 11, s.y - rh - 7, 22 * Math.max(0, hp), 2);
      if (G.keepPlot === i) {
        ctx.strokeStyle = "#2fbfb4"; ctx.strokeRect(s.x - 14, s.y - rh - 12, 28, 8);
      }
    }
    var glow = G.screen === "play" && G.phase === "plant" && G.ante === 1 && G.day === 1 && (G.plantedCount || 0) < 3 && !G.plots[i];
    if (glow) {
      var bob = Math.sin(G.time * 5 + i) * 3;
      ctx.fillStyle = "#f4e6c8";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - rh - 16 + bob); ctx.lineTo(s.x + 6, s.y - rh - 6 + bob); ctx.lineTo(s.x - 6, s.y - rh - 6 + bob);
      ctx.fill();
    }
    if (G.screen === "play" || G.screen === "harvest") {
      hits.push({ x: s.x, y: s.y, r: Math.max(22, rw), kind: "plot", plot: i, label: "plot" + i, fn: (function (idx) { return function () { onPlot(idx); }; })(i) });
    }
    return s.y;
  }
  function drawBladder(x, y, color, frameN, scale) {
    var w = 22 * scale, h = 18 * scale;
    if (paint("grazer_bladderkin_" + (frameN % 2), x - w / 2, y - h / 2, w, h)) return;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, 11 * scale, 9 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.ellipse(x - 3 * scale, y - 3 * scale, 3 * scale, 2 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 11 * scale, 9 * scale, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = COL.ink; ctx.beginPath(); ctx.moveTo(x, y - 9 * scale); ctx.lineTo(x, y - 16 * scale); ctx.stroke();
  }
  function drawHabitSprite(x, y, fr, scale, long) {
    var key = long ? "grazer_longhabit" : ("grazer_habit_" + (fr % 2));
    var w = (long ? 36 : 22) * scale, h = (long ? 40 : 28) * scale;
    if (!long && paint(key, x - w / 2, y - h + 4, w, h)) return;
    if (long && paint("grazer_longhabit", x - w / 2, y - h + 4, w, h)) return;
    var leg = fr % 2 ? 4 : -4;
    ctx.fillStyle = long ? "#d9c7a2" : "#c4b48a";
    ctx.fillRect(x - 8 * scale, y - 20 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = "#24161c";
    ctx.fillRect(x - 5 * scale, y - 16 * scale, 10 * scale, 8 * scale);
    ctx.fillStyle = "#6a432c";
    ctx.fillRect(x - 9 * scale, y - 24 * scale, 18 * scale, 5 * scale);
    ctx.fillStyle = "#3a2438";
    ctx.fillRect(x - 3 * scale, y - 4 * scale, 2 * scale, (8 + leg) * scale);
    ctx.fillRect(x + 2 * scale, y - 4 * scale, 2 * scale, (8 - leg) * scale);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.strokeRect(x - 8 * scale, y - 20 * scale, 16 * scale, 16 * scale);
    if (long) {
      ctx.clearRect ? null : null;
      ctx.fillStyle = "rgba(36,22,28,0.55)";
      ctx.fillRect(x - 3 * scale, y - 14 * scale, 6 * scale, 6 * scale);
    }
  }
  function drawRope(x, y, fr, scale) {
    var w = 26 * scale, h = 30 * scale;
    if (paint("grazer_ropejack_" + (fr % 2), x - w / 2, y - h / 2, w, h)) return;
    drawBladder(x, y - 16 * scale, "#e454a4", fr, scale * 0.55);
    ctx.strokeStyle = "#e0b15a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 10 * scale); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = "#2fbfb4";
    ctx.fillRect(x - 4 * scale, y - 4 * scale, 8 * scale, 8 * scale);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 4 * scale, y); ctx.lineTo(x - 16 * scale, y + (fr % 2 ? 6 : -2) * scale);
    ctx.moveTo(x + 4 * scale, y); ctx.lineTo(x + 16 * scale, y + (fr % 2 ? -2 : 8) * scale);
    ctx.stroke();
    ctx.strokeRect(x - 4 * scale, y - 4 * scale, 8 * scale, 8 * scale);
  }
  function drawKeeper(x, y, facing, fr, pix) {
    var key = "keeper_" + facing + "_" + (fr % 2);
    var w = 18 * pix, h = 26 * pix;
    if (paint(key, x - w / 2, y - h + 2, w, h)) return;
    var leg = fr % 2 ? 3 : -3;
    ctx.fillStyle = "#2fbfb4";
    ctx.fillRect(x - 7, y - 22, 14, 14);
    ctx.fillStyle = "#e7b898";
    if (facing !== "n") ctx.fillRect(x - 4, y - 18, 8, 7);
    else ctx.fillStyle = "#1c3a38";
    if (facing === "n") ctx.fillRect(x - 4, y - 18, 8, 7);
    ctx.fillStyle = "#6a432c";
    ctx.fillRect(x - 8, y - 26, 16, 5);
    ctx.fillStyle = "#3a2438";
    ctx.fillRect(x - 4, y - 8, 3, 8 + (facing === "s" ? leg : 0));
    ctx.fillRect(x + 1, y - 8, 3, 8 + (facing === "s" ? -leg : 0));
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.strokeRect(x - 7, y - 22, 14, 14);
  }
  function drawEngine(x, y, s, talk) {
    var w = 54 * s, h = 48 * s;
    if (paint(talk ? "engine_1" : "engine_0", x, y, w, h)) return;
    ctx.fillStyle = COL.brass;
    ctx.fillRect(x + 8, y + 16, 36 * s, 26 * s);
    ctx.fillStyle = COL.brassD;
    ctx.beginPath(); ctx.arc(x + 26 * s, y + 28 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = talk ? COL.ink : "#3a2438";
    ctx.fillRect(x + 18 * s, y + 22 * s, 6 * s, talk ? 8 * s : 3 * s);
    ctx.fillStyle = COL.teal;
    ctx.beginPath(); ctx.moveTo(x + 14 * s, y + 16); ctx.lineTo(x + 26 * s, y); ctx.lineTo(x + 26 * s, y + 16); ctx.fill();
    ctx.fillStyle = COL.mag;
    ctx.beginPath(); ctx.moveTo(x + 26 * s, y + 16); ctx.lineTo(x + 26 * s, y); ctx.lineTo(x + 40 * s, y + 16); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.strokeRect(x + 8, y + 16, 36 * s, 26 * s);
  }

  function drawWorld(cam, decor) {
    ctx.save();
    if (G.shake > 0 && !decor) ctx.translate(Math.sin(G.time * 70) * G.shake * 8, Math.cos(G.time * 60) * G.shake * 6);
    drawMolts(cam);
    var board = drawSpire(cam);
    drawPath(cam);
    var pix = Math.max(2, Math.round(cam.sx * 3.2));
    var stuff = [], i, s, g, p, fr;
    if (G.plots) {
      for (i = 0; i < 8; i++) {
        (function (idx) {
          var pd = plotDesign(idx);
          var sp = W2S(cam, pd.x, pd.y);
          stuff.push({ y: sp.y, draw: function () { drawPlot(idx, cam, pix); } });
        })(i);
      }
    }
    if (!decor && G.grazers) {
      for (i = 0; i < G.grazers.length; i++) {
        g = G.grazers[i];
        if (!g.alive) continue;
        p = pathXY(g.t);
        if (g.type === "rope") p.y -= 30;
        if (g.type === "bladder") p.y += Math.sin(G.time * 3 + g.id) * 3;
        s = W2S(cam, p.x, p.y);
        (function (gg, ss) {
          stuff.push({ y: ss.y, draw: function () {
            var frn = Math.floor(G.time * 6) % 2;
            var sc = Math.max(0.85, cam.sx * 1.15);
            if (gg.type === "bladder") drawBladder(ss.x, ss.y, gg.color, frn, sc);
            else if (gg.type === "rope") drawRope(ss.x, ss.y, frn, sc);
            else drawHabitSprite(ss.x, ss.y, frn, sc * (gg.type === "long" ? 1.7 : 1), gg.type === "long");
            if (gg.hp < gg.maxHp) {
              ctx.fillStyle = "#24161c"; ctx.fillRect(ss.x - 10, ss.y - 28, 20, 3);
              ctx.fillStyle = "#e24b4b"; ctx.fillRect(ss.x - 9, ss.y - 27, 18 * Math.max(0, gg.hp / gg.maxHp), 1);
            }
          } });
        })(g, s);
      }
    }
    if (decor) {
      for (i = 0; i < 3; i++) {
        var tt = (G.time * 0.025 + i * 0.31) % 1;
        var pp = pathXY(tt);
        pp.y -= 36;
        var ss = W2S(cam, pp.x, pp.y);
        (function (x, y, colr, ii) {
          stuff.push({ y: y, draw: function () { drawBladder(x, y, colr, Math.floor(G.time * 4 + ii) % 2, 1); } });
        })(ss.x, ss.y, BLADDER_COLORS[i], i);
      }
      var ht = (G.time * 0.02) % 1;
      var hp = pathXY(ht);
      var hs = W2S(cam, hp.x, hp.y);
      stuff.push({ y: hs.y, draw: function () { drawHabitSprite(hs.x, hs.y, Math.floor(G.time * 4) % 2, 1, false); } });
    }
    if (!decor && G.keeper) {
      var ks = W2S(cam, G.keeper.x, G.keeper.y);
      var moving = joy.on || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight || keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD;
      fr = moving ? Math.floor((G.keeper.walk || 0) * 6) % 2 : 0;
      stuff.push({ y: ks.y, draw: function () { drawKeeper(ks.x, ks.y, G.keeper.facing || "s", fr, pix); } });
    }
    stuff.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < stuff.length; i++) stuff[i].draw();
    if (G.bolts && cam) {
      ctx.lineWidth = 2;
      for (i = 0; i < G.bolts.length; i++) {
        var b1 = W2S(cam, G.bolts[i].x1, G.bolts[i].y1);
        var b2 = W2S(cam, G.bolts[i].x2, G.bolts[i].y2);
        ctx.strokeStyle = G.bolts[i].color;
        ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      }
    }
    if (G.fx) {
      for (i = 0; i < G.fx.length; i++) {
        var fp = W2S(cam, G.fx[i].x, G.fx[i].y);
        ctx.globalAlpha = Math.max(0, G.fx[i].life * 2);
        ctx.fillStyle = G.fx[i].color;
        ctx.fillRect(fp.x, fp.y, 3, 3);
        ctx.globalAlpha = 1;
      }
    }
    if (G.fxText) {
      font(Math.round(12 * (frame ? frame.u : 1)), true);
      ctx.textAlign = "center";
      for (i = 0; i < G.fxText.length; i++) {
        var tp = W2S(cam, G.fxText[i].x, G.fxText[i].y);
        ctx.globalAlpha = Math.max(0, G.fxText[i].life);
        inkText(G.fxText[i].text, tp.x, tp.y, COL.cream);
        ctx.globalAlpha = 1;
      }
    }
    var eng = W2S(cam, -36, 78);
    drawEngine(eng.x, eng.y, Math.max(0.7, cam.sx), G.clack > 0);
    ctx.restore();
    return board;
  }

  function chipShown() {
    if (G.screen === "play") return G.preview ? G.preview.score : 0;
    if (G.screen === "harvest" || G.screen === "victory") return (G.banked || 0) + Math.floor(G.harvestShown || 0);
    return G.banked || 0;
  }
  function goldShown() {
    if (G.screen === "play") return (G.gold || 0) + (G.glintGold || 0);
    if ((G.screen === "harvest" || G.screen === "victory") && G.result && !G.bankedThisDay) return (G.gold || 0) + (G.result.goldTotal || 0);
    return G.gold || 0;
  }
  function drawHUD() {
    if (!G.tithe && G.tithe !== 0) return;
    var u = frame.u;
    var y = frame.T + 6;
    var x = frame.L + 8;
    var h = frame.topH - 8;
    function pill(px, icon, text, img) {
      font(Math.round(13 * u), true);
      var tw = ctx.measureText(text).width;
      var w = tw + 36;
      roundRect(px, y, w, h, 8);
      ctx.fillStyle = "rgba(36,22,28,0.78)";
      ctx.fill();
      if (!paint(img, px + 6, y + (h - 16) / 2, 16, 16)) {
        ctx.fillStyle = icon;
        ctx.beginPath(); ctx.arc(px + 14, y + h / 2, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = COL.cream;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, px + 28, y + h / 2 + 1);
      ctx.textBaseline = "alphabetic";
      return px + w + 6;
    }
    x = pill(x, COL.wheat, String(Math.floor(chipShown())), "ui_chip");
    x = pill(x, COL.brass, String(goldShown()), "ui_gold");
    var leafN = G.screen === "play" && G.phase === "plant" ? (G.compostsLeft || 0) : (G.compostsUsed || 0);
    x = pill(x, COL.moss, String(leafN), "ui_leaf");
    var waveT = (G.wave && G.wave.length) || 0;
    var waveTxt = G.phase === "dusk" ? ((G.cleared || 0) + "/" + (G.waveTotal || waveT)) : ("0/" + waveT);
    x = pill(x, COL.teal, waveTxt, null);
    var ante = "A" + G.ante + "·D" + G.day + (G.ante > 8 ? " ENDLESS" : "") + "  Tithe " + G.tithe + (G.gnawToday ? " −20%" : "");
    font(Math.round(13 * u), true);
    var aw = ctx.measureText(ante).width + 16;
    roundRect(x, y, aw, h, 8);
    ctx.fillStyle = "rgba(36,22,28,0.78)";
    ctx.fill();
    ctx.fillStyle = COL.cream;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(ante, x + 8, y + h / 2 + 1);
    ctx.textBaseline = "alphabetic";
    if (G.screen === "play" && G.preview) {
      var name = G.preview.name;
      var ok = G.preview.score >= G.tithe;
      font(Math.round(13 * u), true);
      ctx.textAlign = "left";
      ctx.fillStyle = ok ? COL.moss : COL.terra;
      ctx.fillText(name, frame.play.x + 8, frame.play.y + 16);
      font(Math.round(11 * u));
      ctx.fillStyle = COL.ink;
      var sum = G.wave ? waveSummary(G.wave) : "";
      ctx.fillText(sum, frame.play.x + 8, frame.play.y + 30);
    }
  }
  function drawWagColumn() {
    if (!G.wags) return;
    var box = frame.wag;
    var u = frame.u;
    var n = Math.max(5, G.wags.length);
    var gap = 4;
    var bh = Math.min(72, (box.h - gap * 4) / 5);
    var i, y, id, active;
    for (i = 0; i < 5; i++) {
      y = box.y + i * (bh + gap);
      id = G.wags[i];
      roundRect(box.x, y, box.w, bh, 6);
      ctx.fillStyle = id ? "rgba(244,230,200,0.92)" : "rgba(36,22,28,0.35)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = i === 0 && id ? COL.teal : COL.ink;
      ctx.stroke();
      if (!id) continue;
      if (!paint("wag_" + id, box.x + 4, y + 4, bh - 8, bh - 8)) {
        ctx.fillStyle = COL.brass;
        ctx.fillRect(box.x + 6, y + 6, 16, 16);
        ctx.fillStyle = COL.ink;
        font(11, true);
        ctx.textAlign = "center";
        ctx.fillText(String(id), box.x + 14, y + 18);
      }
      font(Math.max(9, Math.round(10 * u)), true);
      ctx.fillStyle = COL.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      var nm = WAGS[id].name;
      ctx.fillText(nm.length > 14 ? nm.slice(0, 13) + "…" : nm, box.x + 4, y + bh - 16);
      ctx.textBaseline = "alphabetic";
      if (i === 0) {
        font(8, true);
        ctx.fillStyle = COL.teal;
        ctx.fillText("ACTIVE", box.x + 4, y + 12);
      }
      if (G.screen === "play") hits.push({ x: box.x, y: y, w: box.w, h: bh, fn: (function (idx) { return function () { onWag(idx); }; })(i) });
    }
    if (G.boss === "mute") {
      font(11, true);
      ctx.fillStyle = COL.mag;
      ctx.textAlign = "left";
      ctx.fillText("WAGS OFF", box.x, box.y - 2);
    }
  }
  function drawHand() {
    if (!G.hand) return;
    var n = G.hand.length;
    if (!n) return;
    var u = frame.u;
    var avail = frame.play.w;
    var overlap = 0.56;
    var cardW = Math.min(62 * u, avail / (1 + (n - 1) * overlap));
    cardW = Math.max(34, cardW);
    var cardH = cardW * 1.38;
    var step = cardW * overlap;
    var total = cardW + (n - 1) * step;
    var start = frame.play.x + frame.play.w / 2 - total / 2 + cardW / 2;
    var y = frame.B - cardH / 2 - 8;
    var i;
    for (i = 0; i < n; i++) {
      var rot = (i - (n - 1) / 2) * 0.07;
      var sel = G.selected === i;
      drawCard(G.hand[i], start + i * step, y - (sel ? 16 : 0), cardW, cardH, rot, true);
      hits.push({
        x: start + i * step - cardW / 2,
        y: y - cardH / 2 - (sel ? 16 : 0),
        w: cardW, h: cardH,
        kind: "card", card: i, label: "card" + i,
        fn: (function (idx) { return function () { onCard(idx); }; })(i)
      });
    }
  }
  function drawCard(card, x, y, w, h, rot, interactive) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    if (!paint("card_frame", -w / 2, -h / 2, w, h)) {
      roundRect(-w / 2, -h / 2, w, h, 5);
      ctx.fillStyle = COL.cream;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COL.ink;
      ctx.stroke();
    }
    font(Math.max(11, Math.round(w * 0.28)), true);
    ctx.fillStyle = suitColor(card.suit);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(rankStr(card.rank), -w / 2 + 4, -h / 2 + 3);
    drawSuit(card.suit, w / 2 - 10, -h / 2 + 12, Math.max(5, w * 0.12));
    drawCropIcon(card, 0, 4, w * 0.28);
    font(Math.max(8, Math.round(w * 0.13)), true);
    ctx.textAlign = "center";
    ctx.fillStyle = COL.ink;
    ctx.fillText(cropName(card), 0, h / 2 - 12);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }
  function captions() {
    if (G.screen !== "play") return { A: "", B: "", C: "", D: "" };
    if (G.phase === "plant") return { A: "Plant " + (G.plantsLeft || 0), B: "Back", C: "Compost " + (G.compostsLeft || 0), D: "Dusk" };
    return { A: "", B: "Shoo", C: "Water " + (G.watersLeft || 0), D: G.wagUsed ? "Spent" : "Wag" };
  }
  function drawControls() {
    if (G.screen !== "play") return;
    var j = frame.joy;
    if (!paint("ui_joystick", j.x - j.r, j.y - j.r, j.r * 2, j.r * 2)) {
      ctx.beginPath(); ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(20,12,16,0.45)"; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(244,230,200,0.8)"; ctx.stroke();
      var kx = j.x + joy.x * j.r * 0.45, ky = j.y + joy.y * j.r * 0.45;
      ctx.beginPath(); ctx.arc(kx, ky, j.r * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(244,230,200,0.9)"; ctx.fill();
    }
    var caps = captions();
    var cols = { A: "#3cba78", B: "#e24b4b", C: "#3aa0d8", D: "#e0b15a" };
    var ids = ["A", "B", "C", "D"];
    var i, b;
    for (i = 0; i < ids.length; i++) {
      b = frame.buttons[ids[i]];
      var img = "ui_btn_" + ids[i].toLowerCase();
      if (!paint(img, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2)) {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = cols[ids[i]]; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = COL.ink; ctx.stroke();
        font(Math.round(b.r * 0.7), true);
        ctx.fillStyle = COL.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ids[i], b.x, b.y + 1);
      }
      font(Math.max(9, Math.round(10 * frame.u)), true);
      ctx.fillStyle = COL.cream;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      inkText(caps[ids[i]], b.x, b.y + b.r + 2, COL.cream);
      ctx.textBaseline = "alphabetic";
      hits.push({ x: b.x, y: b.y, r: b.r + 6, btn: ids[i], fn: (function (id) { return function () { pressBtn(id); }; })(ids[i]) });
    }
    if (finePointer) {
      font(11);
      ctx.fillStyle = "rgba(36,22,28,0.8)";
      ctx.textAlign = "left";
      ctx.fillText("WASD  J plant  K shoo  L water  ; wag", frame.L + 8, frame.B - 4);
    }
    var deckN = (G.deck ? G.deck.length : 0) + " deck  " + (G.discard ? G.discard.length : 0) + " discard" + ((G.exiled && G.exiled.length) ? "  " + G.exiled.length + " taken" : "");
    ctx.textAlign = "right";
    ctx.fillText(deckN, frame.play.x + frame.play.w - 4, frame.play.y + frame.play.h - 4);
  }
  function drawLogo(x, y, sc) {
    if (paint("title_logo", x, y, 280 * sc, 84 * sc)) return 84 * sc;
    ctx.save();
    ctx.translate(x + 28 * sc, y + 34 * sc);
    ctx.fillStyle = COL.brass;
    ctx.beginPath(); ctx.arc(0, 0, 22 * sc, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COL.teal;
    ctx.beginPath(); ctx.moveTo(-18 * sc, 8 * sc); ctx.lineTo(0, -20 * sc); ctx.lineTo(0, 8 * sc); ctx.fill();
    ctx.fillStyle = COL.mag;
    ctx.beginPath(); ctx.moveTo(0, 8 * sc); ctx.lineTo(0, -20 * sc); ctx.lineTo(18 * sc, 8 * sc); ctx.fill();
    ctx.restore();
    font(Math.round(48 * sc), true);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    inkText("REFUR", x + 58 * sc, y + 52 * sc, "#f4e2b0");
    return 64 * sc;
  }

  function drawTitle() {
    var u = frame.u;
    var leftW = Math.min(420, frame.W * 0.46);
    var cam = camFrom({ x: frame.L + leftW * 0.55, y: frame.T, w: frame.W - leftW * 0.3, h: frame.H });
    var board = drawWorld(cam, true);
    if (board && G.screen === "title") {
      hits.push({ x: board.x - 20, y: board.y - 20, w: 40, h: 40, fn: function () {
        G.modal = { kind: "note", title: "THE OLD KEEPER", body: OLD_NOTE, buttons: [{ label: "Fold it", fn: function () { G.modal = null; } }] };
      } });
    }
    var x = frame.L + 16;
    var y = frame.T + 8;
    var lh = drawLogo(x, y, Math.max(0.62, Math.min(1, frame.H / 520)));
    y += lh + 4;
    font(Math.max(11, Math.round(12 * u)));
    ctx.fillStyle = COL.ink;
    ctx.textAlign = "left";
    var tag = wrap("One game to rule in them all. Farm the chaos.", leftW - 24);
    var li;
    for (li = 0; li < tag.length; li++) { ctx.fillText(tag[li], x, y + 14); y += 14; }
    y += 8;
    if ((meta.wins || 0) > 0) {
      font(12, true);
      ctx.fillStyle = COL.plumD;
      ctx.fillText("Husk refurred × " + meta.wins, x, y + 12);
      y += 18;
    }
    var items = titleItems();
    var bh = Math.max(28, Math.min(40, (frame.H - y) / 7));
    var i;
    for (i = 0; i < items.length; i++) {
      var hot = (G.menu || 0) === i;
      roundRect(x, y, leftW - 28, bh, 8);
      ctx.fillStyle = items[i].disabled ? "rgba(58,36,56,0.45)" : (hot ? "#8d4e3a" : "rgba(92,53,86,0.92)");
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = COL.ink; ctx.stroke();
      font(Math.max(12, Math.round(14 * u)), true);
      ctx.fillStyle = items[i].disabled ? "#cbb8a8" : COL.cream;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      var label = items[i].label;
      var size = Math.max(12, Math.round(14 * u));
      font(size, true);
      while (size > 10 && ctx.measureText(label).width > leftW - 48) { size--; font(size, true); }
      ctx.fillText(label, x + 10, y + bh * 0.38);
      font(Math.max(9, Math.round(10 * u)));
      ctx.fillStyle = items[i].disabled ? "#b7a898" : "#f4e6c8";
      ctx.fillText(items[i].sub, x + 10, y + bh * 0.74);
      ctx.textBaseline = "alphabetic";
      if (!items[i].disabled) hits.push({ x: x, y: y, w: leftW - 28, h: bh, kind: "ui", label: items[i].id, fn: (function (it, idx) { return function () { G.menu = idx; activateTitle(it); }; })(items[i], i) });
      y += bh + 6;
    }
  }

  function dim() {
    ctx.fillStyle = "rgba(18,10,16,0.62)";
    ctx.fillRect(0, 0, view.w, view.h);
  }
  function centerPanel(w, h) {
    var x = (view.w - w) / 2, y = (view.h - h) / 2;
    panel(x, y, w, h);
    return { x: x, y: y, w: w, h: h };
  }

  function drawDecks() {
    drawTitleWorldOnly();
    dim();
    var w = Math.min(640, view.w - 24), h = Math.min(360, view.h - 24);
    var p = centerPanel(w, h);
    font(Math.round(20 * frame.u), true);
    ctx.textAlign = "left"; ctx.fillStyle = COL.cream;
    ctx.fillText("Choose a deck", p.x + 16, p.y + 32);
    var bw = (w - 48) / 2, bh = h - 110;
    deckCard(p.x + 16, p.y + 48, bw, bh, "Wealth & Crop", "The standard 52, plus four extra Glintpods: ♦2, ♦6, ♦10, ♦A.", function () { startStory("wealth"); });
    deckCard(p.x + 32 + bw, p.y + 48, bw, bh, "Thorn & Ledger", "No Diamonds. Each Diamond is replaced by an extra Spade of the same rank.", function () { startStory("thorn"); });
    uiButton(p.x + 16, p.y + h - 40, 120, 28, "Back", function () { G.screen = "title"; });
  }
  function deckCard(x, y, w, h, title, body, fn) {
    roundRect(x, y, w, h, 10);
    ctx.fillStyle = "#3a2438"; ctx.fill();
    ctx.strokeStyle = COL.brass; ctx.stroke();
    font(16, true); ctx.fillStyle = COL.wheat; ctx.textAlign = "left";
    ctx.fillText(title, x + 12, y + 28);
    font(13); ctx.fillStyle = COL.cream;
    var lines = wrap(body, w - 24), i;
    for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], x + 12, y + 52 + i * 16);
    uiButton(x + 12, y + h - 44, w - 24, 32, "Deal this deck", fn);
  }
  function drawTitleWorldOnly() {
    drawSky(view.w, view.h);
    var cam = camFrom({ x: frame.L, y: frame.T, w: frame.W, h: frame.H });
    drawWorld(cam, true);
  }
  function drawCollection() {
    drawTitleWorldOnly();
    dim();
    var w = Math.min(720, view.w - 16), h = Math.min(view.h - 16, 460);
    var p = centerPanel(w, h);
    var st = colStats();
    font(20, true); ctx.fillStyle = COL.cream; ctx.textAlign = "left";
    ctx.fillText("The Collection  " + st.pct + "%", p.x + 16, p.y + 28);
    font(13);
    ctx.fillText("Cards " + st.cards + "/52    Wags " + st.wags + "/12    Grazers " + st.grazers + "/4    " + st.seen + "/" + st.total, p.x + 16, p.y + 48);
    var ranks = RANKS, suits = SUITS, cell = Math.min(18, (w - 80) / 13);
    var sx0 = p.x + 56, sy0 = p.y + 64, s, r, seen, lab;
    font(11, true);
    for (s = 0; s < 4; s++) {
      ctx.fillStyle = suitColor(suits[s]);
      ctx.textAlign = "right";
      ctx.fillText(suitGlyph(suits[s]), sx0 - 8, sy0 + s * (cell + 4) + cell - 2);
      for (r = 0; r < 13; r++) {
        seen = !!col.cards[suits[s] + ":" + ranks[r]];
        ctx.fillStyle = seen ? (suits[s] === "h" || suits[s] === "d" ? "#e07a72" : "#f4e6c8") : "rgba(244,230,200,0.15)";
        ctx.fillRect(sx0 + r * (cell + 2), sy0 + s * (cell + 4), cell, cell);
        ctx.strokeStyle = COL.ink; ctx.strokeRect(sx0 + r * (cell + 2), sy0 + s * (cell + 4), cell, cell);
      }
    }
    var gy = sy0 + 4 * (cell + 4) + 8;
    font(12, true); ctx.textAlign = "left"; ctx.fillStyle = COL.wheat;
    ctx.fillText("Wags", p.x + 16, gy + 12);
    var i, wx = p.x + 16;
    for (i = 1; i <= 12; i++) {
      var on = !!col.wags[String(i)];
      roundRect(wx, gy + 18, 52, 36, 4);
      ctx.fillStyle = on ? "#f4e6c8" : "rgba(244,230,200,0.12)";
      ctx.fill(); ctx.strokeStyle = COL.ink; ctx.stroke();
      font(9, true); ctx.fillStyle = COL.ink; ctx.textAlign = "center";
      ctx.fillText(on ? WAGS[i].name.split(" ")[0] : "?", wx + 26, gy + 40);
      wx += 56;
      if (wx > p.x + w - 60) { wx = p.x + 16; gy += 40; }
    }
    var grazers = [["bladderkin", "Bladderkin"], ["habit", "Habit"], ["ropejack", "Ropejack"], ["longhabit", "Long Habit"]];
    gy += 62;
    ctx.textAlign = "left"; font(12, true); ctx.fillStyle = COL.wheat;
    ctx.fillText("Grazers", p.x + 16, gy);
    font(12);
    var gx = p.x + 90;
    for (i = 0; i < grazers.length; i++) {
      var got = !!col.grazers[grazers[i][0]];
      ctx.fillStyle = got ? COL.cream : "rgba(244,230,200,0.35)";
      ctx.fillText(got ? grazers[i][1] : "not seen", gx, gy);
      gx += 120;
    }
    uiButton(p.x + 16, p.y + h - 40, 120, 28, "Back", function () {
      if (G.backScreen === "play" && G.mode) { G.screen = "play"; G.backScreen = null; }
      else G.screen = "title";
    });
  }
  function drawOptions() {
    drawTitleWorldOnly();
    dim();
    var w = Math.min(420, view.w - 24), h = 300;
    var p = centerPanel(w, h);
    font(20, true); ctx.fillStyle = COL.cream; ctx.textAlign = "left";
    ctx.fillText("Options", p.x + 16, p.y + 32);
    var rows = [
      ["Sound", opts.sound ? "On" : "Off", function () { opts.sound = !opts.sound; saveOpts(); }],
      ["Music", opts.music ? "On" : "Off", function () { opts.music = !opts.music; saveOpts(); }],
      ["Haptics", opts.haptics ? "On" : "Off", function () {
        opts.haptics = !opts.haptics; saveOpts();
        if (opts.haptics && !navigator.vibrate) toast("This device has no haptics.");
        else buzz(18);
      }],
      ["Hands", opts.left ? "Left" : "Right", function () { opts.left = !opts.left; saveOpts(); }]
    ];
    var i;
    for (i = 0; i < rows.length; i++) {
      var y = p.y + 52 + i * 48;
      font(16, true); ctx.fillStyle = COL.cream; ctx.textAlign = "left";
      ctx.fillText(rows[i][0], p.x + 20, y + 22);
      uiButton(p.x + w - 140, y, 110, 32, rows[i][1], rows[i][2]);
    }
    uiButton(p.x + 16, p.y + h - 40, 120, 28, "Back", function () {
      if (G.backScreen === "play" && G.mode) { G.screen = "play"; G.backScreen = null; }
      else G.screen = "title";
    });
  }
  function drawDaily() {
    drawTitleWorldOnly();
    dim();
    var save = todayDailySave();
    var best = dailyBest();
    var w = Math.min(440, view.w - 24), h = 240;
    var p = centerPanel(w, h);
    font(18, true); ctx.fillStyle = COL.cream; ctx.textAlign = "left";
    ctx.fillText("Daily Furrow  " + formatDate(todayKey()), p.x + 16, p.y + 32);
    font(14); ctx.fillStyle = COL.cream2;
    ctx.fillText(best ? ("Best today " + best.banked + "  ·  Ante " + best.ante + " · Day " + best.day) : "No score yet today.", p.x + 16, p.y + 58);
    ctx.fillText("A standard deck, shuffled from today's date.", p.x + 16, p.y + 80);
    if (save) {
      uiButton(p.x + 16, p.y + 110, w - 32, 34, "Resume Ante " + save.ante + " · Day " + save.day, function () { restore(save); });
      uiButton(p.x + 16, p.y + 152, w - 32, 34, "Start over", function () { startDaily(true); });
    }
    uiButton(p.x + 16, p.y + h - 40, 120, 28, "Back", function () { G.screen = "title"; });
  }

  function drawOpening(cam) {
    var zoom = 1, yoff = 0;
    if (G.openStep === 0) {
      var u = Math.min(1, (G.openT || 0) / 3.2);
      zoom = 0.62 + u * 0.38;
      yoff = (1 - u) * 30;
    }
    var zcam = { cx: cam.cx, cy: cam.cy + yoff, rx: cam.rx * zoom, ry: cam.ry * zoom, sx: cam.sx * zoom, sy: cam.sy * zoom };
    drawWorld(zcam, true);
    if (G.openStep === 0) {
      font(14); ctx.fillStyle = COL.cream; ctx.textAlign = "center";
      inkText("The coat is waiting.", view.w / 2, view.h - 28, COL.cream);
      return;
    }
    dim();
    var w = Math.min(560, view.w - 24), h = Math.min(340, view.h - 24);
    var p = centerPanel(w, h);
    font(16, true); ctx.fillStyle = COL.wheat; ctx.textAlign = "left";
    if (G.openStep === 1) {
      ctx.fillText("The Old Keeper's note", p.x + 16, p.y + 28);
      font(14); ctx.fillStyle = COL.cream;
      var lines = wrap(OLD_NOTE, w - 32), i;
      for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], p.x + 16, p.y + 52 + i * 18);
      uiButton(p.x + 16, p.y + h - 44, 160, 32, "Turn to the Engine", function () { finishOpening(); });
    } else {
      drawEngine(p.x + 16, p.y + 16, 1.1, true);
      font(14, true); ctx.fillStyle = COL.cream;
      var elines = wrap(ENGINE_OPEN, w - 40);
      for (i = 0; i < elines.length; i++) ctx.fillText(elines[i], p.x + 16, p.y + 90 + i * 18);
      ctx.fillStyle = COL.wheat;
      ctx.fillText("It spits out a Wag: Back-Hair.", p.x + 16, p.y + h - 78);
      uiButton(p.x + 16, p.y + h - 44, 160, 32, "Begin the day", function () { finishOpening(); });
    }
  }

  function chipsLine(s) {
    var bits = [String(s.baseChips), String(s.rankSum)];
    if (s.bonusChips) bits.push(String(s.bonusChips));
    return bits.join(" + ") + "  =  " + s.chips;
  }
  function multLine(s) {
    var inner = s.baseMult + (s.bonusMult || 0);
    if (s.lean) return "(" + inner + ") × 3  =  " + s.mult;
    if (!s.bonusMult) return String(s.baseMult);
    return s.baseMult + " + " + s.bonusMult + "  =  " + s.mult;
  }
  function drawHarvest() {
    if (!G.result) return;
    dim();
    var s = G.result;
    var shown = Math.floor(G.harvestShown || 0);
    var keepOn = wagOn(3) && shown >= s.score && s.ok;
    var w = Math.min(520, view.w - 20);
    var h = Math.min(keepOn ? 360 : 320, view.h - 16);
    var p = centerPanel(w, h);
    font(Math.round(26 * frame.u), true);
    ctx.textAlign = "center"; ctx.fillStyle = COL.wheat;
    inkText(s.name, p.x + w / 2, p.y + 36, COL.wheat);
    font(Math.round(15 * frame.u));
    ctx.fillStyle = COL.cream;
    ctx.textAlign = "left";
    ctx.fillText("Chips  " + chipsLine(s), p.x + 20, p.y + 66);
    ctx.fillText("Mult   " + multLine(s), p.x + 20, p.y + 86);
    font(Math.round(20 * frame.u), true);
    ctx.textAlign = "center";
    ctx.fillStyle = shown >= s.score && s.ok ? COL.moss : COL.cream;
    ctx.fillText(s.chips + "  ×  " + s.mult + "  =  " + shown, p.x + w / 2, p.y + 118);
    font(15, true);
    ctx.fillStyle = s.ok ? COL.moss : COL.terra;
    ctx.fillText("Tithe " + s.tithe + (shown >= s.score ? (s.ok ? "  ·  paid" : "  ·  short") : ""), p.x + w / 2, p.y + 144);
    if (shown >= s.score && s.ok) {
      font(14); ctx.fillStyle = COL.cream; ctx.textAlign = "center";
      var bits = ["Gold +" + s.goldTotal, "pay " + s.pay];
      if (s.glint) bits.push("glint " + s.glint);
      if (s.rust) bits.push("rust " + s.rust);
      ctx.fillText(bits.join("   "), p.x + w / 2, p.y + 170);
    }
    if (shown >= s.score && !s.ok) {
      font(15, true); ctx.textAlign = "center"; ctx.fillStyle = COL.terra;
      ctx.fillText("The Engine takes the husk back.", p.x + w / 2, p.y + 176);
    }
    var btnY = p.y + h - 42;
    if (keepOn) drawKeepRow(p.x + 16, btnY - 30, w - 32);
    uiButton(p.x + w / 2 - 70, btnY, 140, 30, shown < s.score ? "Skip" : (s.ok ? "To the Engine" : "Close the ledger"), advanceHarvest);
  }
  function drawKeepRow(x, y, width) {
    var keeps = [], i;
    for (i = 0; i < 8; i++) if (G.plots[i]) keeps.push(i);
    font(12); ctx.fillStyle = COL.teal; ctx.textAlign = "left";
    ctx.fillText(keeps.length ? "Overwinterer keeps" : "Nothing left to keep", x, y - 6);
    if (!keeps.length) return;
    var gap = 4;
    var kw = Math.min(58, (width - gap * (keeps.length - 1)) / keeps.length);
    for (i = 0; i < keeps.length; i++) {
      (function (idx, bx) {
        var label = rankStr(G.plots[idx].card.rank) + suitGlyph(G.plots[idx].card.suit);
        uiButton(bx, y, kw, 22, label, function () {
          G.keepPlot = idx;
          toast("The Overwinterer will keep the " + cardLabel(G.plots[idx].card) + ".");
        }, false, G.keepPlot === idx);
      })(keeps[i], x + i * (kw + gap));
    }
  }
  function drawShop() {
    dim();
    var shop = G.shop;
    if (!shop) return;
    var w = Math.min(680, view.w - 12), h = Math.min(view.h - 12, 400);
    var p = centerPanel(w, h);
    drawEngine(p.x + 12, p.y + 8, 0.85, G.clack > 0);
    font(13, true); ctx.fillStyle = COL.cream; ctx.textAlign = "left";
    var lines = wrap(shop.line, w - 90), i;
    var lineCap = h < 340 ? 1 : 2;
    for (i = 0; i < lines.length && i < lineCap; i++) ctx.fillText(lines[i], p.x + 72, p.y + 24 + i * 15);
    font(12); ctx.fillStyle = COL.wheat;
    ctx.fillText("Gold " + G.gold + "    Banked chips " + G.banked + "    Wags " + G.wags.length + "/5", p.x + 16, p.y + 62);
    var btnY = p.y + h - 40;
    var offerY = p.y + 74;
    var seedLabel = 16;
    var gap = 8;
    var remain = btnY - offerY - gap - seedLabel - gap;
    var offerH = Math.max(56, Math.min(108, Math.floor(remain * 0.46)));
    var cardTop = offerY + offerH + gap + seedLabel;
    var ch = Math.max(44, Math.min(92, btnY - cardTop - 8));
    var cw = Math.round(ch * 0.72);
    var bw = (w - 48) / 2;
    for (i = 0; i < 2; i++) {
      var o = shop.offers[i];
      var x = p.x + 16 + i * (bw + 16);
      var y = offerY;
      roundRect(x, y, bw, offerH, 8);
      ctx.fillStyle = "#3a2438"; ctx.fill(); ctx.strokeStyle = COL.brass; ctx.stroke();
      if (!o) {
        font(13); ctx.fillStyle = COL.cream2; ctx.textAlign = "left";
        ctx.fillText("Sold.", x + 12, y + 28);
        continue;
      }
      if (!paint("wag_" + o.id, x + 8, y + 8, 28, 28)) {
        ctx.fillStyle = COL.brass; ctx.fillRect(x + 8, y + 8, 22, 22);
      }
      font(13, true); ctx.fillStyle = COL.wheat; ctx.textAlign = "left";
      ctx.fillText(o.name + "  ·  " + o.cost + "g", x + 42, y + 22);
      if (offerH >= 88) {
        font(11); ctx.fillStyle = COL.cream;
        var bl = wrap(o.blurb, bw - 20);
        var maxLines = offerH >= 100 ? 2 : 1;
        var bi;
        for (bi = 0; bi < bl.length && bi < maxLines; bi++) ctx.fillText(bl[bi], x + 10, y + 42 + bi * 13);
        uiButton(x + 8, y + offerH - 28, Math.min(92, bw - 16), 22, "Buy " + o.cost + "g", (function (idx) { return function () { buyWag(idx); }; })(i));
      } else {
        uiButton(x + bw - 100, y + offerH - 28, 88, 22, "Buy " + o.cost + "g", (function (idx) { return function () { buyWag(idx); }; })(i));
      }
    }
    font(13, true); ctx.fillStyle = COL.wheat; ctx.textAlign = "left";
    ctx.fillText(shop.taken ? "Seed taken" : "Seed pack — take one", p.x + 16, cardTop - 6);
    for (i = 0; i < shop.pack.length; i++) {
      var cx = p.x + 16 + i * (cw + 10);
      drawCard(shop.pack[i], cx + cw / 2, cardTop + ch / 2, cw, ch, 0);
      if (!shop.taken) hits.push({ x: cx, y: cardTop, w: cw, h: ch, kind: "pack", label: "pack" + i, fn: (function (idx) { return function () { takePack(idx); }; })(i) });
      if (shop.taken && shop.took === i) {
        ctx.strokeStyle = COL.teal; ctx.lineWidth = 3;
        ctx.strokeRect(cx, cardTop, cw, ch);
      }
    }
    uiButton(p.x + w - 280, btnY, 120, 30, "Reroll 2g", rerollShop);
    uiButton(p.x + w - 148, btnY, 128, 30, "Next dawn", nextDay);
  }
  function drawVictory() {
    dim();
    var w = Math.min(460, view.w - 24), h = 220;
    var p = centerPanel(w, h);
    font(26, true); ctx.textAlign = "center"; ctx.fillStyle = COL.wheat;
    inkText("The coat is on.", p.x + w / 2, p.y + 48, COL.wheat);
    font(15); ctx.fillStyle = COL.cream;
    ctx.fillText("The husk is refurred. Ante " + G.ante + " can keep walking.", p.x + w / 2, p.y + 84);
    uiButton(p.x + 24, p.y + h - 56, (w - 64) / 2, 36, "Keep walking", keepWalking);
    uiButton(p.x + 40 + (w - 64) / 2, p.y + h - 56, (w - 64) / 2, 36, "Step down", stepDown);
  }
  function drawEnd() {
    dim();
    var w = Math.min(460, view.w - 24), h = 200;
    var p = centerPanel(w, h);
    font(20, true); ctx.textAlign = "center";
    ctx.fillStyle = G.endKind === "win" ? COL.wheat : COL.terra;
    var msg = G.endKind === "win" ? "The husk keeps its coat." : "The Engine takes the husk back.";
    ctx.fillText(msg, p.x + w / 2, p.y + 48);
    font(15); ctx.fillStyle = COL.cream;
    ctx.fillText("Banked " + (G.banked || 0) + "    Ante " + G.ante + " · Day " + G.day, p.x + w / 2, p.y + 80);
    if (G.mode === "daily") {
      var b = dailyBest();
      ctx.fillText(b ? ("Today's best " + b.banked) : "No best yet", p.x + w / 2, p.y + 104);
    }
    uiButton(p.x + w / 2 - 80, p.y + h - 52, 160, 34, "Back to the ledger", goTitle);
  }
  function drawModal() {
    if (!G.modal) return;
    dim();
    tagModal = true;
    var w = Math.min(520, view.w - 24);
    font(15);
    var lines = wrap(G.modal.body || "", w - 36);
    var h = Math.min(view.h - 20, 88 + lines.length * 18 + 48);
    var p = centerPanel(w, h);
    font(18, true); ctx.fillStyle = COL.wheat; ctx.textAlign = "left";
    ctx.fillText(G.modal.title || "", p.x + 16, p.y + 28);
    font(14); ctx.fillStyle = COL.cream;
    var i;
    for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], p.x + 16, p.y + 52 + i * 18);
    var buttons = G.modal.buttons || [];
    var bw = Math.min(180, (w - 24) / Math.max(1, buttons.length) - 8);
    for (i = 0; i < buttons.length; i++) {
      uiButton(p.x + 16 + i * (bw + 8), p.y + h - 44, bw, 30, buttons[i].label, buttons[i].fn);
    }
    tagModal = false;
  }
  function drawToast() {
    if (!G.toast) return;
    font(14, true);
    var w = Math.min(view.w - 24, ctx.measureText(G.toast.text).width + 28);
    var x = (view.w - w) / 2, y = frame ? frame.T + frame.topH + 6 : 40;
    roundRect(x, y, w, 28, 8);
    ctx.fillStyle = "rgba(36,22,28,0.9)";
    ctx.fill();
    ctx.fillStyle = COL.cream;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(G.toast.text, view.w / 2, y + 15);
    ctx.textBaseline = "alphabetic";
  }

  function draw() {
    hits = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (window.innerHeight > window.innerWidth) return;
    var safe = readSafe();
    frame = layout(view.w, view.h, safe, !!(opts && opts.left));
    drawSky(view.w, view.h);
    var scr = G.screen;
    if (scr === "title") drawTitle();
    else if (scr === "decks") drawDecks();
    else if (scr === "collection") drawCollection();
    else if (scr === "options") drawOptions();
    else if (scr === "daily") drawDaily();
    else {
      var cam = camFrom(frame.play);
      if (scr === "opening") drawOpening(cam);
      else {
        drawWorld(cam, false);
        drawHUD();
        drawWagColumn();
        if (scr === "play") { drawHand(); drawControls(); }
        if (scr === "harvest") { drawHand(); drawHarvest(); }
        if (scr === "shop") drawShop();
        if (scr === "victory") drawVictory();
        if (scr === "end") drawEnd();
      }
    }
    if (G.modal) drawModal();
    drawToast();
    if (G.screen === "play" && G.phase === "plant" && G.ante === 1 && G.day === 1 && (G.plantedCount || 0) >= 3) {
      var d = frame.buttons.D;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(G.time * 6);
      ctx.strokeStyle = COL.wheat; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function localPoint(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function hitTest(x, y) {
    var i, h;
    for (i = hits.length - 1; i >= 0; i--) {
      h = hits[i];
      if (G.modal && !h.modal && !(h.fn && G.modal)) {
        /* modal buttons are pushed last and are the only hits after dim; world hits remain.
           Skip anything that isn't inside the latest panel by requiring modal flag.
           Buttons in drawModal don't set modal flag — they are just later hits.
           A tap on a plot could pass through. Block world hits while modal is up. */
      }
      if (G.modal) {
        var modalHit = false;
        /* only accept hits registered after dim of modal: we mark them below */
      }
      if (h.r) { if (Math.hypot(x - h.x, y - h.y) <= h.r) return h; }
      else if (x >= h.x && y >= h.y && x <= h.x + h.w && y <= h.y + h.h) return h;
    }
    return null;
  }
  function onDown(e) {
    if (window.innerHeight > window.innerWidth) return;
    RefurAudio.unlock();
    canvas.setPointerCapture(e.pointerId);
    var p = localPoint(e);
    var rec = { x: p.x, y: p.y, sx: p.x, sy: p.y, joy: false, used: false };
    pointers[e.pointerId] = rec;
    if (!frame) return;
    if (G.screen === "play" && (G.phase === "plant" || G.phase === "dusk") && !G.modal) {
      var j = frame.joy;
      if (Math.hypot(p.x - j.x, p.y - j.y) <= j.r * 1.25) {
        rec.joy = true;
        joy.on = true;
        setJoy(p);
        e.preventDefault();
        return;
      }
    }
    var h = pick(p.x, p.y);
    if (h && h.btn) {
      rec.used = true;
      rec.hold = h.btn;
      btnHold[h.btn] = true;
      pressBtn(h.btn);
      e.preventDefault();
    }
  }
  function setJoy(p) {
    var j = frame.joy;
    var dx = p.x - j.x, dy = p.y - j.y;
    var m = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, m / j.r);
    joy.x = (dx / m) * k;
    joy.y = (dy / m) * k;
  }
  function pick(x, y) {
    var i, h, list = [];
    for (i = hits.length - 1; i >= 0; i--) {
      h = hits[i];
      var inside = h.r ? (Math.hypot(x - h.x, y - h.y) <= h.r) : (x >= h.x && y >= h.y && x <= h.x + h.w && y <= h.y + h.h);
      if (!inside) continue;
      if (G.modal && !h.modal) continue;
      return h;
    }
    return null;
  }
  function onMove(e) {
    var rec = pointers[e.pointerId];
    if (!rec) return;
    var p = localPoint(e);
    rec.x = p.x; rec.y = p.y;
    if (rec.joy && frame) setJoy(p);
  }
  function onUp(e) {
    var rec = pointers[e.pointerId];
    if (!rec) return;
    if (rec.joy) { joy.on = false; joy.x = 0; joy.y = 0; }
    if (rec.hold) btnHold[rec.hold] = false;
    if (!rec.used && !rec.joy && Math.hypot(rec.x - rec.sx, rec.y - rec.sy) < 14) {
      RefurAudio.unlock();
      var h = pick(rec.x, rec.y);
      if (h && h.fn && !h.btn) h.fn();
    }
    delete pointers[e.pointerId];
  }
  function onKey(e) {
    if (e.code === "Escape") { pressB(); return; }
    if (G.screen === "title") {
      var items = titleItems();
      if (e.code === "ArrowDown") { G.menu = Math.min(items.length - 1, (G.menu || 0) + 1); return; }
      if (e.code === "ArrowUp") { G.menu = Math.max(0, (G.menu || 0) - 1); return; }
      if (e.code === "Enter" || e.code === "KeyJ" || e.code === "Space") { activateTitle(items[G.menu || 0]); return; }
    }
    if (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3" || e.code === "Digit4" || e.code === "Digit5" || e.code === "Digit6" || e.code === "Digit7") {
      var n = +e.code.slice(5) - 1;
      if (G.hand && G.hand[n]) onCard(n);
      return;
    }
    if (e.code === "KeyJ" || e.code === "Enter" || e.code === "Space") pressA();
    else if (e.code === "KeyK") pressB();
    else if (e.code === "KeyL") pressC();
    else if (e.code === "Semicolon" || e.key === ";") pressD();
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    view.w = w; view.h = h;
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
  }
  function loadImages() {
    return Promise.all(IMAGES.map(function (name) {
      return new Promise(function (resolve) {
        var img = new Image();
        var done = false;
        function finish(ok) {
          if (done) return;
          done = true;
          if (ok) IMG[name] = img;
          resolve();
        }
        img.onload = function () { finish(true); };
        img.onerror = function () { finish(false); };
        img.src = "assets/img/" + name + ".png";
        setTimeout(function () { finish(false); }, 2500);
      });
    }));
  }
  function boot() {
    if (booted) return;
    booted = true;
    document.getElementById("boot").style.display = "none";
    canvas = document.getElementById("c");
    ctx = canvas.getContext("2d");
    opts = storeGet("refur-options", null) || { sound: true, music: true, haptics: true, left: false };
    col = storeGet("refur-collection", null) || { cards: {}, wags: {}, grazers: {} };
    if (!col.cards) col.cards = {};
    if (!col.wags) col.wags = {};
    if (!col.grazers) col.grazers = {};
    meta = storeGet("refur-meta", null) || { sawTutorial: false, wins: 0 };
    G = freshShell();
    finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onDown, { passive: false });
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    window.addEventListener("keydown", function (e) {
      RefurAudio.unlock();
      var block = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, KeyJ: 1, KeyK: 1, KeyL: 1, Semicolon: 1, Space: 1, Enter: 1, Escape: 1 };
      if (block[e.code]) e.preventDefault();
      if (e.repeat) { keys[e.code] = true; return; }
      keys[e.code] = true;
      onKey(e);
    });
    window.addEventListener("keyup", function (e) { keys[e.code] = false; if (e.code === "KeyK") btnHold.B = false; });
    RefurAudio.setEnabled(opts.sound, opts.music);
    RefurAudio.setMusic("title");
    var last = 0;
    function frameLoop(now) {
      if (!last) last = now;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      requestAnimationFrame(frameLoop);
    }
    requestAnimationFrame(frameLoop);
  }

  window.addEventListener("error", function (e) {
    var el = document.getElementById("err");
    if (!el) return;
    el.style.display = "flex";
    el.textContent = (e.message || "Error") + (e.filename ? "\n" + e.filename + ":" + e.lineno : "");
  });

  window.REFUR = {
    press: pressBtn,
    state: function () { return G; },
    tap: function (x, y) { var h = pick(x, y); if (h && h.fn) h.fn(); },
    options: function () { return opts; },
    hits: function () {
      return hits.map(function (h) {
        return { x: h.x, y: h.y, w: h.w || 0, h: h.h || 0, r: h.r || 0, label: h.label || "", kind: h.kind || "", btn: h.btn || "", modal: !!h.modal };
      });
    }
  };

  function start() {
    var imgP = loadImages();
    var sndP = RefurAudio.loadAll();
    Promise.all([imgP, sndP]).then(boot);
    setTimeout(boot, 2800);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
