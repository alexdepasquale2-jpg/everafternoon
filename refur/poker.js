/* REFUR poker scoring. No DOM. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.RefurPoker = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var HAND = {
    HIGH: { cat: 0, name: "HIGH CARD", chips: 5, mult: 1 },
    PAIR: { cat: 1, name: "PAIR", chips: 10, mult: 2 },
    TWO: { cat: 2, name: "TWO PAIR", chips: 20, mult: 2 },
    TRIPS: { cat: 3, name: "TRIPS", chips: 30, mult: 3 },
    STRAIGHT: { cat: 4, name: "STRAIGHT", chips: 30, mult: 4 },
    FLUSH: { cat: 5, name: "FLUSH", chips: 35, mult: 4 },
    HOUSE: { cat: 6, name: "FULL HOUSE", chips: 40, mult: 4 },
    QUADS: { cat: 7, name: "QUADS", chips: 60, mult: 7 },
    STRAIGHT_FLUSH: { cat: 8, name: "STRAIGHT FLUSH", chips: 100, mult: 8 },
    FIVE: { cat: 9, name: "FIVE OF A KIND", chips: 120, mult: 12 }
  };

  function suitKey(suit, wrong) {
    if (wrong && (suit === "h" || suit === "s")) return "hs";
    return suit;
  }

  function groupsOf(cards) {
    var map = Object.create(null);
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].rank;
      map[r] = (map[r] || 0) + 1;
    }
    var groups = [];
    for (var k in map) groups.push({ r: +k, n: map[k] });
    groups.sort(function (a, b) { return b.n - a.n || b.r - a.r; });
    return groups;
  }

  function byRankDesc(cards) {
    return cards.slice().sort(function (a, b) { return b.rank - a.rank; });
  }

  function ofRank(cards, rank) {
    return cards.filter(function (c) { return c.rank === rank; });
  }

  function straightHigh(cards) {
    if (cards.length !== 5) return 0;
    var uniq = [];
    var seen = Object.create(null);
    for (var i = 0; i < cards.length; i++) {
      if (seen[cards[i].rank]) return 0;
      seen[cards[i].rank] = true;
      uniq.push(cards[i].rank);
    }
    uniq.sort(function (a, b) { return a - b; });
    var wheel = uniq[0] === 2 && uniq[1] === 3 && uniq[2] === 4 && uniq[3] === 5 && uniq[4] === 14;
    if (wheel) return 5;
    for (var j = 1; j < uniq.length; j++) {
      if (uniq[j] !== uniq[0] + j) return 0;
    }
    return uniq[4];
  }

  function isFlush(cards, wrong) {
    if (cards.length !== 5) return false;
    var key = suitKey(cards[0].suit, wrong);
    for (var i = 1; i < cards.length; i++) {
      if (suitKey(cards[i].suit, wrong) !== key) return false;
    }
    return true;
  }

  function pack(def, scoring, tie) {
    return {
      cat: def.cat,
      name: def.name,
      baseChips: def.chips,
      baseMult: def.mult,
      scoring: scoring,
      tie: tie
    };
  }

  function classify(cards, wrong) {
    if (!cards.length) return null;
    var g = groupsOf(cards);
    var desc = byRankDesc(cards);
    var flush = isFlush(cards, wrong);
    var sh = straightHigh(cards);
    if (cards.length === 5 && g[0].n === 5) {
      return pack(HAND.FIVE, cards.slice(), [g[0].r]);
    }
    if (flush && sh) return pack(HAND.STRAIGHT_FLUSH, cards.slice(), [sh]);
    if (g[0].n === 4) {
      var quad = ofRank(cards, g[0].r);
      var kicker = desc.filter(function (c) { return c.rank !== g[0].r; })[0];
      return pack(HAND.QUADS, quad, [g[0].r, kicker ? kicker.rank : 0]);
    }
    if (g[0].n === 3 && g[1] && g[1].n >= 2) {
      return pack(HAND.HOUSE, cards.slice(), [g[0].r, g[1].r]);
    }
    if (flush) return pack(HAND.FLUSH, cards.slice(), desc.map(function (c) { return c.rank; }));
    if (sh) return pack(HAND.STRAIGHT, cards.slice(), [sh]);
    if (g[0].n === 3) {
      var kick = desc.filter(function (c) { return c.rank !== g[0].r; }).map(function (c) { return c.rank; });
      return pack(HAND.TRIPS, ofRank(cards, g[0].r), [g[0].r].concat(kick));
    }
    if (g[0].n === 2 && g[1] && g[1].n === 2) {
      var hi = Math.max(g[0].r, g[1].r);
      var lo = Math.min(g[0].r, g[1].r);
      var kick2 = desc.filter(function (c) { return c.rank !== hi && c.rank !== lo; })[0];
      return pack(HAND.TWO, ofRank(cards, hi).concat(ofRank(cards, lo)), [hi, lo, kick2 ? kick2.rank : 0]);
    }
    if (g[0].n === 2) {
      var kick3 = desc.filter(function (c) { return c.rank !== g[0].r; }).map(function (c) { return c.rank; });
      return pack(HAND.PAIR, ofRank(cards, g[0].r), [g[0].r].concat(kick3));
    }
    return pack(HAND.HIGH, [desc[0]], desc.map(function (c) { return c.rank; }));
  }

  function better(a, b) {
    if (!b) return a;
    var n = Math.max(a.tie.length, b.tie.length);
    if (a.cat !== b.cat) return a.cat > b.cat ? a : b;
    for (var i = 0; i < n; i++) {
      var av = a.tie[i] || 0;
      var bv = b.tie[i] || 0;
      if (av !== bv) return av > bv ? a : b;
    }
    return a;
  }

  function combinations(cards) {
    var out = [];
    var n = cards.length;
    if (n <= 5) return [cards.slice()];
    function rec(start, acc) {
      if (acc.length === 5) { out.push(acc.slice()); return; }
      for (var i = start; i < n; i++) {
        acc.push(cards[i]);
        rec(i + 1, acc);
        acc.pop();
      }
    }
    rec(0, []);
    return out;
  }

  function bestHand(cards, wrong) {
    if (!cards || !cards.length) return null;
    var best = null;
    var sets = combinations(cards);
    for (var i = 0; i < sets.length; i++) {
      var hand = classify(sets[i], !!wrong);
      best = better(hand, best);
    }
    return best;
  }

  function finalizeScore(hand, mods) {
    mods = mods || {};
    if (!hand) {
      return {
        name: "EMPTY FURROW",
        chips: 0, mult: 0, score: 0,
        baseChips: 0, baseMult: 0, rankSum: 0,
        bonusChips: 0, bonusMult: 0, lean: false, scoring: []
      };
    }
    var rankSum = 0;
    for (var i = 0; i < hand.scoring.length; i++) {
      var r = hand.scoring[i].rank;
      if (mods.twelve && r >= 11 && r <= 13) r *= 2;
      rankSum += r;
    }
    var bonusChips = mods.bonusChips || 0;
    var bonusMult = mods.bonusMult || 0;
    var chips = hand.baseChips + rankSum + bonusChips;
    var mult = hand.baseMult + bonusMult;
    var lean = !!mods.lean;
    if (lean) mult *= 3;
    if (mult < 0) mult = 0;
    return {
      name: hand.name,
      chips: chips,
      mult: mult,
      score: Math.floor(chips * mult),
      baseChips: hand.baseChips,
      baseMult: hand.baseMult,
      rankSum: rankSum,
      bonusChips: bonusChips,
      bonusMult: bonusMult,
      lean: lean,
      scoring: hand.scoring
    };
  }

  function titheAmount(ante, day, gnaw) {
    var bases = [60, 90, 140];
    var base = bases[(day - 1)] || 140;
    var t = Math.round(base * Math.pow(1.6, ante - 1));
    if (gnaw) t = Math.round(t * 0.8);
    return Math.max(1, t);
  }

  function goldForScore(score, tithe) {
    var g = 3;
    if (score > tithe && tithe > 0) {
      var tenths = Math.floor(((score - tithe) / tithe) * 10);
      g += Math.max(1, tenths);
    }
    return g;
  }

  return {
    HAND: HAND,
    bestHand: bestHand,
    finalizeScore: finalizeScore,
    titheAmount: titheAmount,
    goldForScore: goldForScore,
    classify: classify
  };
});
