const fs = require('fs');
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
let html = fs.readFileSync('source.html', 'utf8');
const map = {
  __LOGO__: b64('logo-crop.png'),
  __WORDMARK__: b64('wordmark-crop.png'),
  '__WORDMARK-BLACK__': b64('wordmark-black-crop.png'),
  __BIRD__: b64('bird-sm.png'),
};
for (const [k, v] of Object.entries(map)) html = html.split(k).join(v);
const left = html.match(/__[A-Z-]+__/g);
if (left) { console.error('unreplaced tokens:', [...new Set(left)]); process.exit(1); }
fs.writeFileSync('banishq-storefront.html', html);
console.log('written', (fs.statSync('banishq-storefront.html').size / 1024).toFixed(0), 'KB');
