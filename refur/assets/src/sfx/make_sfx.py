#!/usr/bin/env python3
"""Synthesize every REFUR sound effect and both music loops.

No samples and no pretrained models: numpy, scipy, and ffmpeg (libvorbis).

    python3 refur/assets/src/sfx/make_sfx.py

Writes refur/assets/sfx/<name>.ogg at 44.1 kHz. Sound effects are mono,
music loops are stereo. PCM peaks are normalized to about -3 dBFS, then
the encoded peak is measured and the gain is corrected once.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import signal

SR = 44100
PEAK_DB = -3.0
PEAK_LIN = 10 ** (PEAK_DB / 20.0)

# Musical grid. Both tempos divide the sample rate evenly, so every beat
# lands on a sample and a loop can end on a bar line.
DAY_BPM = 70
DAY_BARS = 8
DUSK_BPM = 100
DUSK_BARS = 12

SFX_NAMES = [
    "engine_clack",
    "engine_stamp",
    "engine_groan",
    "plant",
    "pop",
    "boots",
    "cloth",
    "rope",
    "steal",
    "quill",
    "sap",
    "glint",
    "burr",
    "water",
    "shoo",
    "card_draw",
    "compost",
    "score_tick",
    "wag_fire",
    "ui_tap",
]
MUSIC_NAMES = ["music_day", "music_dusk"]


def out_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "sfx"


def seconds(n: int) -> np.ndarray:
    return np.arange(n, dtype=np.float64) / SR


def n_for(dur: float) -> int:
    return int(round(dur * SR))


def rng_of(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def noise(n: int, seed: int) -> np.ndarray:
    return rng_of(seed).uniform(-1.0, 1.0, n)


def midi_hz(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


def place(dst: np.ndarray, src: np.ndarray, at: float, gain: float = 1.0) -> None:
    """Mix `src` into `dst` at `at` seconds."""
    if gain == 0.0 or len(src) == 0:
        return
    i0 = int(round(float(at) * SR))
    if i0 >= len(dst):
        return
    if i0 < 0:
        src = src[-i0:]
        i0 = 0
        if len(src) == 0:
            return
    i1 = min(len(dst), i0 + len(src))
    dst[i0:i1] += gain * src[: i1 - i0]


def butter_sos(kind: str, freq, order: int = 2):
    if kind == "band":
        lo, hi = freq
        lo = float(np.clip(lo, 25.0, SR * 0.45))
        hi = float(np.clip(hi, lo + 20.0, SR * 0.49))
        return signal.butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    cutoff = float(np.clip(freq, 20.0, SR * 0.45))
    return signal.butter(order, cutoff, btype=kind, fs=SR, output="sos")


def filt(x: np.ndarray, kind: str, freq, order: int = 2) -> np.ndarray:
    return signal.sosfilt(butter_sos(kind, freq, order), x)


def fade_edges(x: np.ndarray, fade_in: float, fade_out: float) -> np.ndarray:
    y = np.array(x, dtype=np.float64, copy=True)
    n_in = min(len(y) // 2, int(round(fade_in * SR)))
    n_out = min(len(y) // 2, int(round(fade_out * SR)))
    if n_in > 1:
        y[:n_in] *= np.sin(np.linspace(0.0, np.pi / 2.0, n_in)) ** 2
    if n_out > 1:
        y[-n_out:] *= np.cos(np.linspace(0.0, np.pi / 2.0, n_out)) ** 2
    return y


def env_decay(n: int, tau: float, attack: float = 0.0015) -> np.ndarray:
    t = seconds(n)
    attack_env = 1.0 - np.exp(-t / max(attack, 1e-4))
    return attack_env * np.exp(-t / tau)


def peak_norm(x: np.ndarray, db: float = PEAK_DB) -> np.ndarray:
    peak = float(np.max(np.abs(x)))
    if peak < 1e-10:
        return x
    return x * (10 ** (db / 20.0) / peak)


def at_level(x: np.ndarray, level: float) -> np.ndarray:
    """Scale a layer so its peak is `level`, before it is mixed with others."""
    peak = float(np.max(np.abs(x)))
    if peak < 1e-10:
        return np.zeros_like(x)
    return x * (level / peak)


def finalize(x: np.ndarray, fade_in: float = 0.003, fade_out: float = 0.018, hp: float = 32.0) -> np.ndarray:
    y = np.asarray(x, dtype=np.float64)
    if hp and len(y) > 64:
        y = filt(y, "high", hp, order=2)
    y = fade_edges(y, fade_in, fade_out)
    y = peak_norm(y)
    if not np.isfinite(y).all():
        raise RuntimeError("non-finite samples in sound effect")
    return y


def modal(n: int, modes: list[tuple[float, float, float, float]]) -> np.ndarray:
    """modes: (freq_hz, amp, decay_seconds, phase_rad)."""
    t = seconds(n)
    y = np.zeros(n)
    for freq, amp, tau, phase in modes:
        y += amp * np.sin(2.0 * np.pi * freq * t + phase) * np.exp(-t / tau)
    return y


def lin_chirp(f0: float, f1: float, n: int) -> np.ndarray:
    t = seconds(n)
    dur = max(n / SR, 1e-6)
    phase = 2.0 * np.pi * (f0 * t + 0.5 * (f1 - f0) * t * t / dur)
    return np.sin(phase)


def exp_chirp(f0: float, f1: float, n: int) -> np.ndarray:
    t = seconds(n)
    dur = max(n / SR, 1e-6)
    f0 = max(f0, 1.0)
    f1 = max(f1, 1.0)
    k = np.log(f1 / f0) / dur
    if abs(k) < 1e-8:
        return np.sin(2.0 * np.pi * f0 * t)
    phase = 2.0 * np.pi * f0 * (np.exp(k * t) - 1.0) / k
    return np.sin(phase)


def karplus(freq: float, n: int, decay: float = 0.996, seed: int = 1, brightness: float = 0.35) -> np.ndarray:
    period = max(2, int(round(SR / freq)))
    buf = rng_of(seed).uniform(-1.0, 1.0, period)
    y = np.empty(n)
    idx = 0
    prev = 0.0
    damp = 1.0 - brightness
    for i in range(n):
        sample = buf[idx]
        y[i] = sample
        averaged = damp * 0.5 * (sample + prev) + brightness * sample
        prev = sample
        buf[idx] = decay * averaged
        idx += 1
        if idx == period:
            idx = 0
    return y


def tv_filter(x: np.ndarray, freq: np.ndarray, q: float, mode: str = "band") -> np.ndarray:
    """Blockwise RBJ biquad. Frequency may move; state carries across blocks."""
    y = np.empty_like(x)
    zi = np.zeros(2)
    block = 32
    q = max(0.7, float(q))
    for start in range(0, len(x), block):
        end = min(len(x), start + block)
        f = float(np.clip(freq[start], 45.0, SR * 0.45))
        w0 = 2.0 * np.pi * f / SR
        cw = np.cos(w0)
        sw = np.sin(w0)
        alpha = sw / (2.0 * q)
        if mode == "band":
            b0, b1, b2 = alpha, 0.0, -alpha
        elif mode == "low":
            b0 = b2 = (1.0 - cw) * 0.5
            b1 = 1.0 - cw
        else:
            b0 = b2 = (1.0 + cw) * 0.5
            b1 = -(1.0 + cw)
        a0 = 1.0 + alpha
        b = np.array([b0, b1, b2], dtype=np.float64) / a0
        a = np.array([1.0, -2.0 * cw / a0, (1.0 - alpha) / a0], dtype=np.float64)
        seg, zi = signal.lfilter(b, a, x[start:end], zi=zi)
        y[start:end] = seg
    return y


def smooth(x: np.ndarray, win: int) -> np.ndarray:
    win = max(1, int(win))
    if win < 3:
        return x
    kernel = np.ones(win) / win
    return np.convolve(x, kernel, mode="same")


def force_zero_ends(y: np.ndarray, fade_in: float = 0.0012, fade_out: float = 0.012) -> np.ndarray:
    return fade_edges(y, fade_in, fade_out)


def coin_ping(n: int, f_a: float, f_b: float, tau: float = 0.07, seed: int = 1) -> np.ndarray:
    t = seconds(n)
    tone = np.sin(2.0 * np.pi * f_a * t) + 0.85 * np.sin(2.0 * np.pi * f_b * t)
    tone *= np.exp(-t / tau)
    click = noise(n, seed) * np.exp(-t / 0.0035)
    click = filt(click, "high", 2500.0, order=1)
    return tone + 0.35 * click


def tine(n: int, freq: float, tau: float = 0.07, dull: float = 0.0) -> np.ndarray:
    """Inharmonic music-box tooth. `dull` damps the upper partials."""
    t = seconds(n)
    y = np.zeros(n)
    stiffness = 0.006
    partials = [1.0, 0.42 * (1.0 - 0.7 * dull), 0.16 * (1.0 - dull), 0.06 * (1.0 - dull)]
    for k, amp in enumerate(partials, start=1):
        if amp <= 0.0:
            continue
        fk = freq * k * np.sqrt(1.0 + stiffness * k * k)
        y += amp * np.sin(2.0 * np.pi * fk * t) * np.exp(-t / (tau / k))
    return y


def short_room(x: np.ndarray, mix: float = 0.18) -> np.ndarray:
    wet = np.zeros_like(x)
    for delay, decay in ((1201, 0.38), (1597, 0.32), (2011, 0.26), (2557, 0.2)):
        if delay >= len(x):
            continue
        wet[delay:] += decay * x[:-delay]
        twice = delay * 2
        if twice < len(x):
            wet[twice:] += decay * decay * 0.5 * x[:-twice]
    wet = filt(wet, "low", 4800.0, order=2)
    return x + mix * wet


def tube(x: np.ndarray, delay_s: float = 0.0032, repeats: int = 4, feedback: float = 0.45) -> np.ndarray:
    """A short comb, for hollow boots and the engine's mouth."""
    y = np.array(x, copy=True)
    d = max(1, int(round(delay_s * SR)))
    acc = np.array(x, copy=True)
    gain = feedback
    for _ in range(repeats):
        if d >= len(y):
            break
        y[d:] += gain * acc[:-d]
        acc = np.concatenate([np.zeros(d), acc[:-d]])
        gain *= feedback
    return y


# --- sound effects ---------------------------------------------------------


def engine_clack() -> np.ndarray:
    n = n_for(0.42)
    y = np.zeros(n)
    jaw = modal(
        n_for(0.16),
        [
            (168.0, 0.7, 0.045, 0.2),
            (390.0, 0.55, 0.04, 1.1),
            (860.0, 0.4, 0.03, 0.4),
            (1410.0, 0.22, 0.025, 2.0),
        ],
    )
    click = filt(noise(n_for(0.02), 11), "band", (1800, 7000), order=2)
    click *= env_decay(len(click), 0.004, attack=0.0004)
    place(y, at_level(jaw, 0.62), 0.0)
    place(y, at_level(click, 0.48), 0.0)
    jaw2 = modal(
        n_for(0.12),
        [
            (210.0, 0.45, 0.035, 0.5),
            (510.0, 0.3, 0.03, 1.4),
            (1280.0, 0.2, 0.02, 0.2),
        ],
    )
    place(y, at_level(jaw2, 0.4), 0.032)
    # Stripped comb: missing teeth, so the pings are uneven and a little sour.
    for at, freq, tau, dull, level in (
        (0.012, 740.0, 0.09, 0.65, 0.34),
        (0.028, 1510.0, 0.07, 0.1, 0.42),
        (0.047, 980.0, 0.08, 0.4, 0.28),
        (0.061, 2140.0, 0.05, 0.0, 0.36),
        (0.09, 1325.0, 0.06, 0.25, 0.24),
    ):
        ping = tine(n_for(0.16), freq, tau=tau, dull=dull)
        place(y, at_level(ping, level), at)
    place(y, at_level(coin_ping(n_for(0.12), 3980, 4310, tau=0.05, seed=21), 0.36), 0.05)
    place(y, at_level(coin_ping(n_for(0.1), 5120, 5480, tau=0.04, seed=22), 0.28), 0.095)
    y = tube(y, 0.0048, repeats=3, feedback=0.28)
    return finalize(short_room(y, 0.12), fade_in=0.001, fade_out=0.04)


def engine_stamp() -> np.ndarray:
    n = n_for(0.92)
    y = np.zeros(n)
    thump_n = n_for(0.45)
    thump = lin_chirp(96.0, 42.0, thump_n) * env_decay(thump_n, 0.11, attack=0.002)
    thump += 0.65 * lin_chirp(64.0, 36.0, thump_n) * env_decay(thump_n, 0.16, attack=0.003)
    body = filt(noise(thump_n, 30), "low", 220.0, order=2)
    body *= env_decay(thump_n, 0.03, attack=0.001)
    place(y, at_level(thump + 0.85 * body, 0.78), 0.0)
    # Solemn open fifth, the engine accepting the tithe.
    bloom_n = n_for(0.7)
    bloom = (
        np.sin(2.0 * np.pi * 98.0 * seconds(bloom_n))
        + 0.7 * np.sin(2.0 * np.pi * 147.0 * seconds(bloom_n))
        + 0.35 * np.sin(2.0 * np.pi * 196.0 * seconds(bloom_n))
    ) * env_decay(bloom_n, 0.28, attack=0.03)
    place(y, at_level(bloom, 0.36), 0.04)
    latch = modal(
        n_for(0.18),
        [
            (180.0, 0.8, 0.05, 0.3),
            (420.0, 0.55, 0.04, 1.0),
            (760.0, 0.5, 0.03, 0.6),
            (1540.0, 0.35, 0.02, 1.7),
        ],
    )
    place(y, at_level(latch, 0.52), 0.062)
    place(y, at_level(coin_ping(n_for(0.22), 2860, 3420, tau=0.09, seed=31), 0.3), 0.15)
    y = tube(y, 0.006, repeats=3, feedback=0.22)
    return finalize(short_room(y, 0.28), fade_in=0.0015, fade_out=0.08, hp=28.0)


def engine_groan() -> np.ndarray:
    n = n_for(2.2)
    t = seconds(n)
    y = np.zeros(n)
    # Two low glides a sour interval apart: a contract that didn't close.
    for f0, f1, gain, vib_rate, phase in (
        (92.0, 58.0, 0.7, 2.4, 0.0),
        (97.5, 63.0, 0.55, 2.15, 1.3),
    ):
        dur = n / SR
        k = np.log(f1 / f0) / dur
        inst = f0 * np.exp(k * t) * (1.0 + 0.018 * np.sin(2.0 * np.pi * vib_rate * t + phase))
        glide_phase = 2.0 * np.pi * np.cumsum(inst) / SR
        partials = np.zeros(n)
        for h, amp in enumerate((1.0, 0.62, 0.34, 0.2, 0.12, 0.07), start=1):
            partials += amp * np.sin(h * glide_phase)
        swell = 0.65 + 0.35 * np.sin(2.0 * np.pi * 0.45 * t + phase)
        swell *= 0.85 + 0.15 * np.sin(2.0 * np.pi * 1.7 * t)
        partials *= swell * np.exp(-t / 2.6)
        y += gain * partials
    y = at_level(np.tanh(y * 1.4) / np.tanh(1.4), 0.42)

    creak_n = n
    raw = noise(creak_n, 41)
    slip = np.linspace(780.0, 240.0, creak_n)
    stumble = rng_of(42)
    for _ in range(14):
        at = int(stumble.integers(0, creak_n - SR // 5))
        drop = float(stumble.uniform(30.0, 110.0))
        slip[at:] -= drop
        recover = min(creak_n, at + int(stumble.uniform(0.05, 0.15) * SR))
        slip[at:recover] += np.linspace(drop, 0.0, recover - at)
    slip += 70.0 * np.sin(2.0 * np.pi * 3.3 * t)
    slip = np.clip(smooth(slip, 180), 120.0, 1600.0)
    creak = tv_filter(raw, slip, q=14.0, mode="band")
    creak_env = np.sin(np.linspace(0.0, np.pi, creak_n)) ** 1.2
    # Stick-slip amplitude: the creak speaks in gestures, not a steady hiss.
    gesture = np.zeros(n)
    for at, length, amp in (
        (0.08, 0.28, 0.8),
        (0.38, 0.22, 1.0),
        (0.66, 0.34, 0.7),
        (1.05, 0.26, 0.9),
        (1.38, 0.4, 0.75),
        (1.78, 0.28, 0.55),
    ):
        g = np.zeros(n_for(length))
        g += np.sin(np.linspace(0.0, np.pi, len(g))) ** 1.4
        place(gesture, g, at, amp)
    y += at_level(creak * creak_env * np.clip(gesture, 0.0, 1.2), 0.92)

    scrape = tv_filter(noise(n, 43), np.clip(slip * 3.2, 400.0, 5000.0), q=6.0, mode="band")
    y += at_level(scrape * creak_env * np.clip(gesture, 0.0, 1.0), 0.34)

    for at, freq in ((0.47, 640.0), (1.52, 510.0)):
        crack = modal(
            n_for(0.08),
            [(freq, 0.5, 0.02, 0.2), (freq * 1.7, 0.3, 0.015, 0.8), (140.0, 0.4, 0.03, 0.1)],
        )
        click_n = n_for(0.015)
        click = filt(noise(click_n, int(freq)), "high", 1000.0) * env_decay(click_n, 0.004)
        place(y, at_level(crack, 0.4), at)
        place(y, at_level(click, 0.28), at)
    return finalize(y, fade_in=0.02, fade_out=0.25, hp=30.0)


def plant() -> np.ndarray:
    n = n_for(0.48)
    y = np.zeros(n)
    snap = filt(noise(n_for(0.012), 51), "high", 1800.0, order=2)
    snap *= env_decay(len(snap), 0.003, attack=0.0003)
    paper = filt(noise(n_for(0.05), 52), "band", (900, 4200), order=2)
    paper *= env_decay(len(paper), 0.012, attack=0.001)
    place(y, at_level(snap, 0.7), 0.0)
    place(y, at_level(paper, 0.55), 0.0)
    card = modal(n_for(0.06), [(1180.0, 0.4, 0.012, 0.4), (1860.0, 0.2, 0.01, 1.2)])
    place(y, at_level(card, 0.4), 0.004)
    wet_n = n_for(0.28)
    wet_f = np.linspace(480.0, 130.0, wet_n)
    wet = tv_filter(noise(wet_n, 53), wet_f, q=7.0, mode="band")
    wet *= np.sin(np.linspace(0.0, np.pi, wet_n)) ** 1.1
    mud = exp_chirp(260.0, 90.0, wet_n) * env_decay(wet_n, 0.08, attack=0.008)
    place(y, at_level(0.9 * wet + 0.55 * mud, 0.72), 0.035)
    thud = lin_chirp(140.0, 70.0, n_for(0.16)) * env_decay(n_for(0.16), 0.05, attack=0.004)
    place(y, at_level(thud, 0.32), 0.06)
    return finalize(y, fade_in=0.001, fade_out=0.04)


def pop() -> np.ndarray:
    n = n_for(0.5)
    y = np.zeros(n)
    pop_n = n_for(0.09)
    body = exp_chirp(620.0, 95.0, pop_n) * env_decay(pop_n, 0.028, attack=0.001)
    wet = filt(noise(pop_n, 61), "low", 1400.0, order=2) * env_decay(pop_n, 0.02, attack=0.0008)
    place(y, at_level(body, 0.85), 0.0)
    place(y, at_level(wet, 0.55), 0.0)
    # Rubbery squeak in the tail: a bladder folding shut.
    sq_n = n_for(0.24)
    t = seconds(sq_n)
    # Bend up, then sag, like rubber released.
    car = 720.0 * (1.0 + 0.55 * np.sin(np.pi * np.clip(t / 0.16, 0, 1)))
    car *= np.exp(-0.6 * t)
    car = np.clip(car, 280.0, 1600.0)
    mod = np.sin(2.0 * np.pi * 14.0 * t)
    index = np.linspace(3.2, 0.4, sq_n)
    phase = 2.0 * np.pi * np.cumsum(car) / SR
    squeak = np.sin(phase + index * mod)
    squeak *= np.sin(np.linspace(0.0, np.pi, sq_n)) ** 0.8
    squeak += 0.15 * tv_filter(noise(sq_n, 62), car * 1.2, q=5.0) * np.sin(np.linspace(0, np.pi, sq_n))
    place(y, at_level(squeak, 0.36), 0.15)
    return finalize(y, fade_in=0.001, fade_out=0.04)


def boots() -> np.ndarray:
    n = n_for(0.62)
    y = np.zeros(n)

    def clop(seed: int, pitch: float) -> np.ndarray:
        m = n_for(0.22)
        knock = filt(noise(m, seed), "band", (500, 2200), order=2) * env_decay(m, 0.014, attack=0.0005)
        sole = lin_chirp(pitch, pitch * 0.62, m) * env_decay(m, 0.045, attack=0.002)
        tap = modal(m, [(980.0, 0.7, 0.01, 0.2), (1460.0, 0.4, 0.008, 0.9), (pitch * 2.1, 0.35, 0.02, 0.4)])
        step = at_level(knock, 0.85) + at_level(sole, 0.42) + at_level(tap, 0.62)
        return tube(step, 0.0026, repeats=3, feedback=0.34)

    place(y, at_level(clop(71, 148.0), 0.95), 0.0)
    place(y, at_level(clop(72, 126.0), 0.82), 0.29)
    return finalize(y, fade_in=0.001, fade_out=0.05)


def cloth() -> np.ndarray:
    n = n_for(0.78)
    y = np.zeros(n)
    for at, dur, f0, f1, gain, seed in (
        (0.0, 0.28, 1600.0, 420.0, 1.0, 81),
        (0.16, 0.26, 1900.0, 500.0, 0.75, 82),
        (0.34, 0.32, 1400.0, 360.0, 0.85, 83),
        (0.52, 0.22, 1700.0, 480.0, 0.4, 84),
    ):
        m = n_for(dur)
        flap = noise(m, seed)
        freq = np.linspace(f0, f1, m)
        flap = tv_filter(flap, freq, q=1.6, mode="low")
        flap *= np.sin(np.linspace(0.0, np.pi, m)) ** 1.3
        place(y, flap, at, gain)
    return finalize(y, fade_in=0.005, fade_out=0.06, hp=80.0)


def rope() -> np.ndarray:
    n = n_for(0.5)
    y = np.zeros(n)
    swing_n = n_for(0.09)
    swing = noise(swing_n, 91)
    swing = tv_filter(swing, np.linspace(400.0, 2200.0, swing_n), q=2.2, mode="band")
    swing *= np.linspace(0.05, 1.0, swing_n) ** 2
    place(y, at_level(swing, 0.55), 0.0)
    crack_n = n_for(0.04)
    crack = filt(noise(crack_n, 92), "high", 1200.0, order=1) * env_decay(crack_n, 0.006, attack=0.0003)
    crack = crack + 0.4 * modal(crack_n, [(220.0, 0.5, 0.02, 0.1), (90.0, 0.4, 0.03, 0.4)])
    place(y, at_level(crack, 0.82), 0.085)
    place(y, at_level(karplus(118.0, n_for(0.4), decay=0.997, seed=93, brightness=0.22), 0.7), 0.09)
    place(y, at_level(karplus(176.0, n_for(0.32), decay=0.995, seed=94, brightness=0.4), 0.32), 0.09)
    return finalize(y, fade_in=0.002, fade_out=0.04)


def steal() -> np.ndarray:
    n = n_for(0.52)
    y = np.zeros(n)
    for i, at in enumerate((0.0, 0.042, 0.078, 0.13, 0.168)):
        m = n_for(0.034)
        f0 = 2800.0 - i * 180.0
        chirp = exp_chirp(f0, f0 * 0.62, m) * env_decay(m, 0.012, attack=0.001)
        breath = filt(noise(m, 100 + i), "band", (1600, 4200)) * env_decay(m, 0.01, attack=0.001)
        place(y, chirp + 0.35 * breath, at, 0.55 - i * 0.04)
    swipe_n = n_for(0.24)
    swipe = noise(swipe_n, 110)
    swipe = tv_filter(swipe, np.linspace(3200.0, 900.0, swipe_n), q=2.4, mode="band")
    swipe *= np.sin(np.linspace(0.15, np.pi, swipe_n)) ** 1.1
    place(y, swipe, 0.2, 0.8)
    return finalize(y, fade_in=0.001, fade_out=0.04)


def quill() -> np.ndarray:
    n = n_for(0.32)
    y = np.zeros(n)
    whoosh_n = n_for(0.12)
    whoosh = noise(whoosh_n, 121)
    freq = np.concatenate([np.linspace(1400, 4200, whoosh_n // 2), np.linspace(4200, 1600, whoosh_n - whoosh_n // 2)])
    whoosh = tv_filter(whoosh, freq, q=3.5, mode="band")
    whoosh *= np.sin(np.linspace(0.0, np.pi, whoosh_n))
    place(y, at_level(whoosh, 0.95), 0.0)
    thunk_n = n_for(0.16)
    thunk = lin_chirp(180.0, 95.0, thunk_n) * env_decay(thunk_n, 0.04, attack=0.001)
    thunk += 0.45 * lin_chirp(96.0, 70.0, thunk_n) * env_decay(thunk_n, 0.05, attack=0.002)
    thunk += 0.3 * filt(noise(thunk_n, 122), "low", 500.0) * env_decay(thunk_n, 0.012, attack=0.0005)
    place(y, at_level(thunk, 0.5), 0.09)
    return finalize(y, fade_in=0.001, fade_out=0.03)


def sap() -> np.ndarray:
    n = n_for(0.6)
    y = np.zeros(n)
    lob_n = n_for(0.32)
    # Sticky pitch: it climbs, catches, then drops.
    pieces = [
        np.linspace(190.0, 340.0, n_for(0.1)),
        np.linspace(340.0, 360.0, n_for(0.05)),
        np.linspace(360.0, 510.0, n_for(0.08)),
        np.linspace(510.0, 160.0, lob_n - n_for(0.23)),
    ]
    freq = np.concatenate(pieces)[:lob_n]
    if len(freq) < lob_n:
        freq = np.pad(freq, (0, lob_n - len(freq)), mode="edge")
    goo = np.sin(2.0 * np.pi * np.cumsum(freq) / SR)
    goo = np.tanh(goo * 1.6)
    wet = tv_filter(noise(lob_n, 131), freq, q=4.0, mode="band")
    lob_env = np.sin(np.linspace(0.15, np.pi, lob_n)) ** 1.15
    place(y, at_level((0.4 * goo + wet) * lob_env, 0.62), 0.0)
    splat_n = n_for(0.18)
    splat = filt(noise(splat_n, 132), "low", 1400.0) * env_decay(splat_n, 0.035, attack=0.001)
    splat += 0.55 * lin_chirp(220.0, 70.0, splat_n) * env_decay(splat_n, 0.045, attack=0.0015)
    place(y, at_level(splat, 0.85), 0.3)
    for i, at in enumerate((0.31, 0.345, 0.39)):
        drop = exp_chirp(700.0 - i * 80, 180.0, n_for(0.06)) * env_decay(n_for(0.06), 0.02)
        place(y, at_level(drop, 0.28), at)
    return finalize(y, fade_in=0.004, fade_out=0.05)


def glint() -> np.ndarray:
    n = n_for(1.15)
    y = np.zeros(n)
    fundamental = 1568.0
    ratios = (1.0, 2.01, 2.97, 4.12, 5.48, 6.9)
    decays = (0.42, 0.32, 0.24, 0.16, 0.11, 0.08)
    amps = (1.0, 0.55, 0.32, 0.18, 0.1, 0.05)
    crystal = modal(n, [(fundamental * r, a, d, 0.2 * i) for i, (r, a, d) in enumerate(zip(ratios, amps, decays))])
    shimmer = modal(
        n,
        [(fundamental * r * 1.008, a * 0.45, d * 0.9, 1.0 + i) for i, (r, a, d) in enumerate(zip(ratios, amps, decays))],
    )
    y += at_level(crystal + shimmer, 0.78)
    place(y, at_level(coin_ping(n_for(0.28), 3340, 4020, tau=0.11, seed=141), 0.48), 0.0)
    place(y, at_level(coin_ping(n_for(0.16), 4980, 5290, tau=0.06, seed=142), 0.3), 0.012)
    return finalize(short_room(y, 0.2), fade_in=0.001, fade_out=0.12, hp=40.0)


def burr() -> np.ndarray:
    n = n_for(0.48)
    y = np.zeros(n)
    creak_n = n_for(0.18)
    creak = tv_filter(noise(creak_n, 151), np.linspace(280.0, 860.0, creak_n), q=12.0, mode="band")
    creak *= np.linspace(0.3, 1.0, creak_n) * np.sin(np.linspace(0.0, np.pi, creak_n))
    place(y, at_level(creak, 0.7), 0.0)
    snap = filt(noise(n_for(0.012), 152), "high", 1500.0) * env_decay(n_for(0.012), 0.003, attack=0.0002)
    place(y, at_level(snap, 0.88), 0.155)
    for at, freq in ((0.158, 180.0), (0.172, 150.0)):
        hit = modal(
            n_for(0.14),
            [
                (freq, 0.8, 0.05, 0.2),
                (freq * 2.3, 0.45, 0.03, 0.7),
                (freq * 5.0, 0.28, 0.02, 1.2),
            ],
        )
        place(y, at_level(hit, 0.55), at)
    spring = tine(n_for(0.12), 920.0, tau=0.04, dull=0.2)
    place(y, at_level(spring, 0.22), 0.16)
    return finalize(y, fade_in=0.002, fade_out=0.04)


def water() -> np.ndarray:
    n = n_for(0.7)
    y = np.zeros(n)
    pour_n = n_for(0.55)
    pour = noise(pour_n, 161)
    pour = tv_filter(pour, np.linspace(700.0, 1400.0, pour_n), q=1.3, mode="band")
    t = seconds(pour_n)
    bubble = 0.72 + 0.28 * np.sin(2.0 * np.pi * 13.0 * t)
    bubble *= 0.85 + 0.15 * np.sin(2.0 * np.pi * 23.0 * t + 0.6)
    pour *= bubble * np.sin(np.linspace(0.35, np.pi, pour_n)) ** 0.65
    place(y, at_level(pour, 0.88), 0.0)
    splash_n = n_for(0.28)
    splash = filt(noise(splash_n, 162), "band", (250, 3200)) * env_decay(splash_n, 0.07, attack=0.004)
    place(y, at_level(splash, 0.7), 0.3)
    drop_rng = rng_of(163)
    for _ in range(7):
        at = 0.32 + float(drop_rng.uniform(0.0, 0.16))
        freq = float(drop_rng.uniform(900.0, 2400.0))
        drop = exp_chirp(freq, freq * 0.5, n_for(0.05)) * env_decay(n_for(0.05), 0.016, attack=0.001)
        place(y, at_level(drop, 0.22), at)
    gurgle_n = n_for(0.16)
    gurgle = tv_filter(noise(gurgle_n, 164), np.linspace(640.0, 200.0, gurgle_n), q=4.0)
    gurgle *= np.sin(np.linspace(0, np.pi, gurgle_n))
    place(y, at_level(gurgle, 0.35), 0.48)
    return finalize(y, fade_in=0.004, fade_out=0.06, hp=60.0)


def shoo() -> np.ndarray:
    n = n_for(0.24)
    y = np.zeros(n)
    m = n_for(0.2)
    air = noise(m, 171)
    freq = np.concatenate([np.linspace(350, 2000, m // 2), np.linspace(2000, 900, m - m // 2)])
    air = tv_filter(air, freq, q=1.8, mode="band")
    air *= np.sin(np.linspace(0.0, np.pi, m)) ** 1.15
    push = lin_chirp(90.0, 55.0, n_for(0.1)) * env_decay(n_for(0.1), 0.04, attack=0.004)
    place(y, at_level(air, 0.9), 0.0)
    place(y, at_level(push, 0.22), 0.02)
    return finalize(y, fade_in=0.004, fade_out=0.03, hp=40.0)


def card_draw() -> np.ndarray:
    n = n_for(0.36)
    y = noise(n, 181)
    y = tv_filter(y, np.linspace(1400.0, 2800.0, n), q=1.5, mode="band")
    flutter = 0.75 + 0.25 * np.sin(2.0 * np.pi * 23.0 * seconds(n))
    env = np.sin(np.linspace(0.0, np.pi, n)) ** 0.85
    y *= flutter * env
    flick = filt(noise(n_for(0.03), 182), "high", 2500.0) * env_decay(n_for(0.03), 0.008, attack=0.001)
    place(y, flick, 0.3, 0.45)
    return finalize(y, fade_in=0.008, fade_out=0.03, hp=120.0)


def compost() -> np.ndarray:
    n = n_for(0.5)
    y = np.zeros(n)
    bed = filt(noise(n, 191), "band", (400, 2800), order=2)
    bed *= (0.35 + 0.65 * np.sin(np.linspace(0.2, np.pi, n)) ** 1.2) * 0.25
    y += bed
    cr = rng_of(192)
    for _ in range(16):
        at = float(cr.uniform(0.0, 0.42))
        dur = float(cr.uniform(0.012, 0.04))
        m = n_for(dur)
        lo = float(cr.uniform(700.0, 2000.0))
        hi = lo + float(cr.uniform(800.0, 2800.0))
        bit = filt(noise(m, int(cr.integers(1, 10_000))), "band", (lo, min(hi, 7500.0)))
        bit *= np.sin(np.linspace(0, np.pi, m)) ** 1.5
        if cr.random() < 0.5:
            bit += 0.4 * exp_chirp(float(cr.uniform(900, 1800)), float(cr.uniform(300, 700)), m) * np.sin(
                np.linspace(0, np.pi, m)
            )
        place(y, bit, at, float(cr.uniform(0.25, 0.7)))
    return finalize(y, fade_in=0.004, fade_out=0.04, hp=70.0)


def score_tick() -> np.ndarray:
    """One seed into a gourd. Kept short and clearly pitched so the game can shift it."""
    n = n_for(0.1)
    t = seconds(n)
    tick = np.sin(2.0 * np.pi * 620.0 * t) * np.exp(-t / 0.02)
    body = np.sin(2.0 * np.pi * 310.0 * t) * np.exp(-t / 0.028)
    click = filt(noise(n, 201), "band", (900, 4000)) * np.exp(-t / 0.0035)
    y = at_level(tick, 0.8) + at_level(body, 0.22) + at_level(click, 0.28)
    return finalize(y, fade_in=0.001, fade_out=0.012, hp=40.0)


def wag_fire() -> np.ndarray:
    n = n_for(0.72)
    y = np.zeros(n)
    pitches = [midi_hz(m) for m in (91, 95, 98, 103, 100)]
    for i, (at, freq) in enumerate(zip((0.0, 0.048, 0.1, 0.155, 0.21), pitches)):
        ratios = (1.0, 2.3, 3.05, 4.4, 5.7)
        decays = (0.28, 0.18, 0.12, 0.08, 0.05)
        amps = (1.0, 0.4, 0.22, 0.1, 0.05)
        bell = modal(
            n_for(0.45),
            [(freq * r, a, d, 0.3 * i) for r, a, d in zip(ratios, amps, decays)],
        )
        place(y, bell, at, 0.7 if i == 0 else 0.5)
    spark = filt(noise(n_for(0.05), 211), "high", 4000.0) * env_decay(n_for(0.05), 0.01, attack=0.0004)
    place(y, spark, 0.0, 0.15)
    return finalize(short_room(y, 0.16), fade_in=0.001, fade_out=0.08, hp=80.0)


def ui_tap() -> np.ndarray:
    n = n_for(0.06)
    t = seconds(n)
    tone = np.sin(2.0 * np.pi * 880.0 * t) * np.exp(-t / 0.012)
    body = np.sin(2.0 * np.pi * 440.0 * t) * np.exp(-t / 0.016)
    click = filt(noise(n, 221), "low", 1800.0) * np.exp(-t / 0.003)
    y = 0.7 * tone + 0.35 * body + 0.2 * click
    return finalize(y, fade_in=0.001, fade_out=0.012, hp=60.0)


# --- music -----------------------------------------------------------------


def samples_per_beat(bpm: float) -> int:
    spb = SR * 60.0 / bpm
    if abs(spb - round(spb)) > 1e-6:
        raise ValueError(f"{bpm} BPM is not sample-locked at {SR} Hz")
    return int(round(spb))


def loop_length(bpm: float, bars: int) -> int:
    return samples_per_beat(bpm) * 4 * bars


def _chord_gain(u: np.ndarray, center: float, crossfade: float) -> np.ndarray:
    """Equal-power, C1 chord window on a cyclic coordinate u in [0, 1)."""
    d = np.abs(u - center)
    d = np.minimum(d, 1.0 - d)
    edge = 0.25
    lo = edge - crossfade / 2.0
    hi = edge + crossfade / 2.0
    x = np.clip((d - lo) / max(hi - lo, 1e-9), 0.0, 1.0)
    smoothstep = x * x * (3.0 - 2.0 * x)
    return np.cos(0.5 * np.pi * smoothstep)


def two_chord_gains(n: int, loop_bars: int, chord_bars: int, crossfade_sec: float, bpm: float):
    """Chord A is centered on the loop point so the seam sits in a sustain."""
    cycle_bars = 2 * chord_bars
    if loop_bars % cycle_bars != 0:
        raise ValueError("chord cycle must divide the loop")
    bar_sec = 4.0 * 60.0 / bpm
    cycle_sec = cycle_bars * bar_sec
    crossfade = crossfade_sec / cycle_sec
    if not 0.0 < crossfade < 0.45:
        raise ValueError("crossfade does not fit the chord")
    bar_pos = np.arange(n) * (loop_bars / n)
    u = np.mod(bar_pos, cycle_bars) / cycle_bars
    am = _chord_gain(u, 0.0, crossfade)
    em = _chord_gain(u, 0.5, crossfade)
    power = am * am + em * em
    if float(np.max(np.abs(power - 1.0))) > 1e-3:
        raise RuntimeError("chord crossfade is not equal-power")
    return am, em


def periodic_lfo(n: int, cycles: int, phase: float = 0.0) -> np.ndarray:
    if cycles <= 0:
        raise ValueError("LFO cycles must be a positive integer")
    i = np.arange(n)
    return np.sin(2.0 * np.pi * (cycles * i / n) + phase)


def render_reed(
    n: int,
    f0: float,
    formant: float,
    vib_cycles: int,
    vib_depth: float,
    vib_phase: float,
    harm_phases: np.ndarray,
    bright: float = 0.0,
    bass: bool = False,
    max_hz: float = 8500.0,
) -> np.ndarray:
    i = np.arange(n)
    y = np.zeros(n)
    # Nasal reed: energy sits on the 3rd–6th harmonics, like a bellows reed.
    nasal = (0.72, 0.5, 0.78, 0.95, 0.8, 0.55, 0.36, 0.22, 0.14, 0.08, 0.05, 0.03, 0.02)
    round_bass = (1.0, 0.42, 0.16, 0.06)
    h = 1
    while h * f0 < max_hz and h <= len(harm_phases):
        k = int(round((f0 * h) * n / SR))
        if k < 1 or k >= n // 2:
            break
        f = k * SR / n
        vh = vib_cycles * SR / n
        beta = f * vib_depth / vh
        phi = (
            2.0 * np.pi * k * i / n
            - beta * np.cos(2.0 * np.pi * vib_cycles * i / n + vib_phase)
            + harm_phases[h - 1]
        )
        if bass:
            if h > len(round_bass):
                break
            amp = round_bass[h - 1]
        else:
            base = nasal[h - 1] if h <= len(nasal) else nasal[-1] * (0.72 ** (h - len(nasal)))
            base *= 1.0 + bright * min(h - 1, 8) / 8.0
            amp = base * (0.45 + 1.15 * np.exp(-0.5 * ((f - formant) / 680.0) ** 2))
        y += amp * np.sin(phi)
        h += 1
    return y


def mix_accordion(
    n: int,
    am_gain: np.ndarray,
    em_gain: np.ndarray,
    vib_cycles: int,
    vib_depth: float,
    detune_cents: float,
    bright: float,
) -> tuple[np.ndarray, np.ndarray]:
    chords = {
        "am": (am_gain, (45, 52, 57, 60, 64)),
        "em": (em_gain, (40, 47, 52, 55, 59)),
    }
    left = np.zeros(n)
    right = np.zeros(n)
    for name, (gain, notes) in chords.items():
        for note_i, note in enumerate(notes):
            f0 = midi_hz(note)
            bass = note < 48
            formant = 620.0 if bass else (1500.0 if note < 60 else 1850.0)
            harms = 4 if bass else 16
            # Bass stays near center. Upper reeds are a small chorus.
            if bass:
                voices = ((0.0, 1.0, 0.0), (4.0, 0.28, 0.22))
            else:
                voices = ((-detune_cents, 0.8, -0.58), (0.0, 1.0, 0.0), (detune_cents, 0.8, 0.58))
            note_gain = 0.62 if bass else (1.0 if note_i < 4 else 0.86)
            for detune_i, (cents, level, pan) in enumerate(voices):
                seed = 1000 + int(note) * 17 + detune_i * 3 + (0 if name == "am" else 50)
                phases = rng_of(seed).uniform(0.0, 2.0 * np.pi, harms)
                vib_phase = float(rng_of(seed + 1).uniform(0.0, 2.0 * np.pi))
                voice = render_reed(
                    n,
                    f0 * 2.0 ** (cents / 1200.0),
                    formant,
                    vib_cycles,
                    vib_depth,
                    vib_phase,
                    phases,
                    bright=bright,
                    bass=bass,
                )
                voice = np.tanh(voice * (1.15 if bass else 1.5))
                rms = np.sqrt(np.mean(voice * voice) + 1e-12)
                voice *= note_gain * level * 0.12 / rms
                voice *= gain
                # Equal-power pan. Center is 0.
                angle = (pan + 1.0) * np.pi / 4.0
                left += voice * np.cos(angle)
                right += voice * np.sin(angle)
    return left, right


def clock_tick(tight: bool, accent: bool) -> np.ndarray:
    """A small mechanical tick above the reed band, so the clock stays audible."""
    dur = 0.04 if tight else 0.07
    n = n_for(dur)
    t = seconds(n)
    click = noise(n, 3 if accent else 5)
    click = filt(click, "high", 3800.0 if tight else 3000.0, order=2)
    click *= np.exp(-t / (0.0016 if tight else 0.0032))
    wood_f = 4600.0 if tight else 3400.0
    wood = np.sin(2.0 * np.pi * wood_f * t) * np.exp(-t / (0.005 if tight else 0.012))
    # A short lower knock gives the tick a clock body without sitting on the reed.
    body_f = 2400.0 if tight else 1900.0
    body = np.sin(2.0 * np.pi * body_f * t) * np.exp(-t / (0.008 if tight else 0.016))
    y = at_level(click, 0.7) + at_level(wood, 0.55 if accent else 0.4) + at_level(body, 0.28 if accent else 0.16)
    return force_zero_ends(y, 0.0006, 0.006)


def low_pulse() -> np.ndarray:
    n = n_for(0.16)
    t = seconds(n)
    env = (1.0 - np.exp(-t / 0.004)) * np.exp(-t / 0.055)
    y = np.sin(2.0 * np.pi * 52.0 * t) * env
    y += 0.45 * np.sin(2.0 * np.pi * 104.0 * t) * env
    thump = filt(noise(n, 9), "low", 180.0) * np.exp(-t / 0.012)
    y += 0.35 * thump
    return force_zero_ends(y, 0.001, 0.02)


def place_on_beats(n: int, bpm: float, clip: np.ndarray, accent_clip: np.ndarray, gain: float) -> np.ndarray:
    """One tick per quarter note. Bar downbeats use the accented tick."""
    y = np.zeros(n)
    spb = samples_per_beat(bpm)
    beats = n // spb
    for beat in range(beats):
        if beat % 4 == 0:
            place(y, accent_clip, beat * spb / SR, gain)
        else:
            place(y, clip, beat * spb / SR, gain * 0.78)
    return y


def periodic_air(n: int, seed: int) -> np.ndarray:
    fade = 4096
    raw = rng_of(seed).normal(0.0, 1.0, n + fade)
    colored = filt(raw, "band", (350, 1800), order=2)
    t = np.linspace(0.0, np.pi / 2.0, fade)
    out = colored[:n].copy()
    out[:fade] = colored[:fade] * np.sin(t) + colored[n : n + fade] * np.cos(t)
    out -= np.mean(out)
    return out


def join_stats(x: np.ndarray) -> dict[str, float]:
    mono = x if x.ndim == 1 else x[:, 0]
    step = np.abs(np.diff(mono))
    twice = np.concatenate([mono, mono])
    boundary = len(mono)
    win = np.diff(twice[boundary - 48 : boundary + 48])
    ref = np.diff(twice[boundary // 2 : boundary // 2 + 96])
    return {
        "join_step": float(abs(mono[0] - mono[-1])),
        "median_step": float(np.median(step)),
        "p99_step": float(np.percentile(step, 99)),
        "boundary_rms": float(np.sqrt(np.mean(win * win) + 1e-18)),
        "interior_rms": float(np.sqrt(np.mean(ref * ref) + 1e-18)),
    }


def render_music(kind: str) -> np.ndarray:
    kind = kind.removeprefix("music_")
    if kind == "day":
        bpm, bars = DAY_BPM, DAY_BARS
        chord_bars = 4
        crossfade = 1.05
        vib_hz, vib_depth = 5.2, 0.0082
        trem_hz, trem_depth = 6.1, 0.17
        detune, bright = 8.0, 0.2
        bellows_slow, bellows_fast = 4, 8
        bellows_amt = (0.14, 0.08)
        tight = False
        tick_gain = 0.55
        pulse_gain = 0.0
        air_gain = 0.06
    elif kind == "dusk":
        bpm, bars = DUSK_BPM, DUSK_BARS
        chord_bars = 3
        crossfade = 0.36
        vib_hz, vib_depth = 6.05, 0.011
        trem_hz, trem_depth = 8.2, 0.28
        detune, bright = 12.0, 0.4
        bellows_slow, bellows_fast = 12, 24
        bellows_amt = (0.1, 0.12)
        tight = True
        tick_gain = 1.15
        pulse_gain = 0.5
        air_gain = 0.045
    else:
        raise ValueError(kind)

    n = loop_length(bpm, bars)
    duration = n / SR
    vib_cycles = max(1, int(round(vib_hz * duration)))
    trem_cycles = max(1, int(round(trem_hz * duration)))
    print(f"  rendering {kind}: {bars} bars at {bpm:.0f} BPM, {duration:.3f}s, {n} samples")
    am, em = two_chord_gains(n, bars, chord_bars, crossfade, bpm)
    left, right = mix_accordion(n, am, em, vib_cycles, vib_depth, detune, bright)

    trem = 1.0 + trem_depth * periodic_lfo(n, trem_cycles, phase=0.4)
    bellows = (
        1.0
        + bellows_amt[0] * periodic_lfo(n, bellows_slow, phase=0.2)
        + bellows_amt[1] * periodic_lfo(n, bellows_fast, phase=1.1)
    )
    motion = trem * bellows
    left *= motion
    right *= motion

    air = periodic_air(n, seed=7 if kind == "day" else 8)
    air_rms = np.sqrt(np.mean(air * air) + 1e-12)
    air *= air_gain / air_rms * 0.02
    left += air
    right += np.roll(air, 19)

    tick = clock_tick(tight=tight, accent=False)
    accent = clock_tick(tight=tight, accent=True)
    beats = bars * 4
    ticks = place_on_beats(n, bpm, tick, accent, gain=1.0)
    tick_peak = float(np.max(np.abs(ticks))) or 1.0
    ticks = ticks / tick_peak * tick_gain
    left += ticks
    right += ticks

    if pulse_gain:
        pulse = np.zeros(n)
        spb = samples_per_beat(bpm)
        one = low_pulse()
        for beat in range(beats):
            place(pulse, one, beat * spb / SR, 1.0 if beat % 2 == 0 else 0.65)
        pulse_peak = float(np.max(np.abs(pulse))) or 1.0
        pulse = pulse / pulse_peak * pulse_gain
        left += pulse
        right += pulse

    stereo = np.column_stack([left, right])
    stereo -= np.mean(stereo, axis=0, keepdims=True)
    # Gentle saturation keeps the clock from monopolizing the peak.
    drive = 1.55 if kind == "dusk" else 1.35
    stereo = np.tanh(stereo * drive) / np.tanh(drive)
    stereo = peak_norm(stereo)
    mono = stereo.mean(axis=1)

    def _frac(sig: np.ndarray, lo: float, hi: float) -> float:
        spec = np.abs(np.fft.rfft(sig * np.hanning(len(sig)))) ** 2
        freqs = np.fft.rfftfreq(len(sig), 1.0 / SR)
        total = float(np.sum(spec)) + 1e-12
        return float(np.sum(spec[(freqs >= lo) & (freqs < hi)]) / total)

    bar_n = samples_per_beat(bpm) * 4
    other = bars // 2
    print(
        f"  tone {kind}: bass {_frac(mono, 60, 180):.2f} "
        f"reed {_frac(mono, 700, 3200):.2f} hi {_frac(mono, 3200, 8000):.2f} "
        f"home {_frac(mono[:bar_n], 240, 400):.2f} "
        f"other {_frac(mono[other * bar_n:(other + 1) * bar_n], 160, 250):.2f}"
    )
    stats = join_stats(stereo)
    print(
        f"  seam {kind}: join {stats['join_step']:.3e} "
        f"median {stats['median_step']:.3e} "
        f"boundary/interior {stats['boundary_rms'] / stats['interior_rms']:.2f}"
    )
    if stats["join_step"] > 12.0 * stats["median_step"]:
        raise RuntimeError(f"{kind} loop join is not continuous")
    if stats["boundary_rms"] > 2.5 * stats["interior_rms"]:
        raise RuntimeError(f"{kind} loop boundary is louder than the phrase")
    return stereo.astype(np.float32)


# --- encode / report -------------------------------------------------------


def write_ogg(path: Path, audio: np.ndarray, quality: float) -> None:
    data = np.ascontiguousarray(audio, dtype=np.float32)
    channels = 1 if data.ndim == 1 else int(data.shape[1])
    cmd = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "f32le",
        "-ar",
        str(SR),
        "-ac",
        str(channels),
        "-i",
        "pipe:0",
        "-c:a",
        "libvorbis",
        "-q:a",
        str(quality),
        "-ar",
        str(SR),
        "-ac",
        str(channels),
        str(path),
    ]
    proc = subprocess.run(cmd, input=data.tobytes(), capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {path.name}: {proc.stderr.decode()}")


def decode(path: Path) -> tuple[np.ndarray, dict]:
    meta = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=sample_rate,channels,duration,codec_name",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
    )
    info = json.loads(meta.stdout)["streams"][0]
    channels = int(info["channels"])
    raw = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-f",
            "f32le",
            "-acodec",
            "pcm_f32le",
            "-ar",
            str(SR),
            "-ac",
            str(channels),
            "pipe:1",
        ],
        check=True,
        capture_output=True,
    ).stdout
    audio = np.frombuffer(raw, dtype=np.float32)
    if channels == 2:
        audio = audio.reshape(-1, 2)
    return audio, info


def encode_targeted(path: Path, audio: np.ndarray, quality: float) -> np.ndarray:
    """Encode, correcting gain until the decoded sample peak is near -3 dBFS."""
    candidate = np.asarray(audio, dtype=np.float32)
    decoded = candidate
    for _ in range(4):
        write_ogg(path, candidate, quality)
        decoded, _info = decode(path)
        peak = float(np.max(np.abs(decoded)))
        if peak < 1e-6:
            raise RuntimeError(f"{path.name} decoded to silence")
        measured = 20.0 * np.log10(peak)
        if abs(measured - PEAK_DB) <= 0.35:
            break
        gain = np.float32(PEAK_LIN / peak)
        candidate = np.clip(candidate * gain, -1.0, 1.0)
    return decoded


def duration_limits(name: str, dur: float) -> None:
    if name in MUSIC_NAMES:
        if not 24.0 <= dur <= 32.0:
            raise RuntimeError(f"{name} duration {dur:.3f}s is outside 24–32s")
        return
    hi = 2.5 if name == "engine_groan" else 1.5
    if not 0.05 <= dur <= hi:
        raise RuntimeError(f"{name} duration {dur:.3f}s is outside 0.05–{hi}s")


def build(only: list[str] | None) -> None:
    dest = out_dir()
    dest.mkdir(parents=True, exist_ok=True)
    jobs: list[tuple[str, np.ndarray, float]] = []
    selected = set(only) if only else None

    sfx = {
        "engine_clack": engine_clack,
        "engine_stamp": engine_stamp,
        "engine_groan": engine_groan,
        "plant": plant,
        "pop": pop,
        "boots": boots,
        "cloth": cloth,
        "rope": rope,
        "steal": steal,
        "quill": quill,
        "sap": sap,
        "glint": glint,
        "burr": burr,
        "water": water,
        "shoo": shoo,
        "card_draw": card_draw,
        "compost": compost,
        "score_tick": score_tick,
        "wag_fire": wag_fire,
        "ui_tap": ui_tap,
    }
    for name, fn in sfx.items():
        if selected and name not in selected:
            continue
        print(f"synth {name}")
        jobs.append((name, fn().astype(np.float32), 4))
    for name in MUSIC_NAMES:
        if selected and name not in selected:
            continue
        print(f"synth {name}")
        jobs.append((name, render_music(name), 5))

    print(f"\n{'name':<16} {'dur':>7} {'ch':>3} {'peak':>8} {'rate':>8} {'bytes':>8}")
    total = 0
    for name, audio, quality in jobs:
        path = dest / f"{name}.ogg"
        decoded = encode_targeted(path, audio, quality)
        info_proc = decode(path)[1]
        dur = float(info_proc["duration"])
        channels = int(info_proc["channels"])
        rate = int(info_proc["sample_rate"])
        peak = float(np.max(np.abs(decoded)))
        peak_db = 20.0 * np.log10(max(peak, 1e-9))
        size = path.stat().st_size
        total += size
        expect_ch = 2 if name in MUSIC_NAMES else 1
        if channels != expect_ch or rate != SR or info_proc["codec_name"] != "vorbis":
            raise RuntimeError(f"{name} encoded as {info_proc}, expected vorbis {SR} Hz {expect_ch} ch")
        if not -4.0 <= peak_db <= -2.2:
            raise RuntimeError(f"{name} peak {peak_db:.2f} dBFS is not around -3")
        duration_limits(name, dur)
        if name in MUSIC_NAMES:
            stats = join_stats(decoded.astype(np.float64))
            ratio = stats["boundary_rms"] / stats["interior_rms"]
            print(f"  decoded seam {name}: boundary/interior {ratio:.2f}")
            if ratio > 3.0 or stats["join_step"] > 20.0 * max(stats["median_step"], 1e-6):
                raise RuntimeError(f"{name} decoded loop is not seamless ({stats})")
        print(f"{name:<16} {dur:7.3f} {channels:3d} {peak_db:7.2f}d {rate:8d} {size:8d}")
    if selected is None:
        folder = sum(p.stat().st_size for p in dest.glob("*.ogg"))
        print(f"\nfolder bytes {folder} ({folder / 1048576:.2f} MB)")
        if folder > 3 * 1024 * 1024:
            raise RuntimeError("sfx folder exceeds 3 MB")


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthesize REFUR sfx and music")
    parser.add_argument("--only", nargs="*", help="render just these cue names")
    args = parser.parse_args()
    build(args.only)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise
