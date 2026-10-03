# The Everafternoon

A small browser game built from a child's drawing: a smiling Sun, two Clouds, four flowers in a row, and a gap where a fifth flower should be. You are the bud that sprouts in the gap, and you have the world's first and only shadow.

**Play:** https://alexdepasquale2-jpg.github.io/everafternoon/

Made with [Phaser 3](https://phaser.io) (3.90.0). Everything is drawn and voiced procedurally; there are no image or sound files.

## How it's built

- `game.js` is the whole game (story, rules, drawing, sound).
- `dev.html` is the development page. It expects `lib/phaser.min.js` (not committed). The root `index.html` is the built single-file game.
- `build_single.py` inlines Phaser and `game.js` into one self-contained HTML file.
- `.github/workflows/pages.yml` fetches `phaser@3.90.0` from npm, checks its hash, builds the single file and deploys it to GitHub Pages.

To run locally: `npm pack phaser@3.90.0`, copy `package/dist/phaser.min.js` to `lib/`, then `python3 -m http.server` and open http://localhost:8000/dev.html (or just open `index.html`).
