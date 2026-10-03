#!/usr/bin/env python3
"""Inline lib/phaser.min.js and game.js into one self-contained everafternoon.html."""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / 'dev.html').read_text()
def safe(js):
    # keep inlined code from closing or confusing the <script> element
    js = re.sub(r'</(script)', r'<\\/\1', js, flags=re.I)
    js = js.replace('<!--', '<\\!--')
    return js
phaser = safe((root / 'lib' / 'phaser.min.js').read_text(encoding='utf-8'))
game = safe((root / 'game.js').read_text(encoding='utf-8'))
html = html.replace('<script src="lib/phaser.min.js"></script>', '<script>\n' + phaser + '\n</script>')
html = html.replace('<script src="game.js"></script>', '<script>\n' + game + '\n</script>')
assert 'src=' not in re.sub(r'<script>.*?</script>', '', html, flags=re.S), 'external reference left'
(root / 'everafternoon.html').write_text(html, encoding='utf-8')
print('wrote', root / 'everafternoon.html', (root / 'everafternoon.html').stat().st_size, 'bytes')
