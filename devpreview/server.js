const http = require('http');
const fs = require('fs');
const path = require('path');
const { Liquid } = require('liquidjs');
const S = require('./shopify');

const THEME = S.THEME;
const read = p => fs.readFileSync(p, 'utf8');
const locales = JSON.parse(read(path.join(THEME, 'locales', 'en.default.json')));

function themeSettings() {
  const schema = JSON.parse(read(path.join(THEME, 'config', 'settings_schema.json')));
  const out = {};
  for (const group of schema) for (const s of group.settings || []) if (s.id) out[s.id] = s.default;
  try {
    const data = JSON.parse(read(path.join(THEME, 'config', 'settings_data.json')));
    Object.assign(out, data.current?.settings || data.current || {});
  } catch {}
  return out;
}

function engine() {
  const e = new Liquid({
    // snippets first: Shopify's {% render %} resolves only against snippets/,
    // and this theme has both a section and a snippet named cart-drawer.
    root: [path.join(THEME, 'snippets'), path.join(THEME, 'sections'), path.join(THEME, 'layout')],
    extname: '.liquid', cache: false, jsTruthy: true, strictFilters: false, strictVariables: false,
  });
  S.registerFilters(e);
  S.registerTags(e);
  return e;
}

function sectionSchema(src) {
  const m = src.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// Shopify resolves reference-type settings (link_list, collection, product…)
// into full objects before the section sees them. Mirror that.
function resolveSetting(type, value, g) {
  if (value === undefined || value === null || value === '') {
    if (type === 'collection') return g.collections.all;
    return value;
  }
  switch (type) {
    case 'link_list':  return g.linklists[value] || g.linklists['main-menu'];
    case 'collection': return g.collections[value] || g.collections.all;
    case 'product':    return g.all_products[value] || Object.values(g.all_products)[0];
    case 'image_picker': return { src: S.img(3, 1600), alt: '', width: 1600, height: 2000 };
    case 'blog':       return { title: 'Journal', articles: [], url: '/blogs/journal' };
    case 'page':       return { title: 'Page', content: '', url: '/pages/x' };
    default:           return value;
  }
}

function applyTypes(defs, raw, g) {
  const out = { ...raw };
  for (const s of defs || []) {
    if (!s.id) continue;
    const t = s.type;
    if (['link_list', 'collection', 'product', 'image_picker', 'blog', 'page'].includes(t)) {
      out[s.id] = resolveSetting(t, raw[s.id], g);
    }
  }
  return out;
}

// Build a `section` drop from the template JSON + the section's own schema defaults
function buildSection(id, conf, src, g) {
  const schema = sectionSchema(src) || {};
  let settings = {};
  for (const s of schema.settings || []) if (s.id) settings[s.id] = s.default;
  Object.assign(settings, conf.settings || {});
  settings = applyTypes(schema.settings, settings, g);

  const blockDefaults = {};
  const blockDefs = {};
  for (const b of schema.blocks || []) {
    const d = {};
    for (const s of b.settings || []) if (s.id) d[s.id] = s.default;
    blockDefaults[b.type] = d;
    blockDefs[b.type] = b.settings || [];
  }

  let order = conf.block_order || Object.keys(conf.blocks || {});
  // If the template defines no blocks but the schema has a preset, use the preset
  if (!order.length && schema.presets?.[0]?.blocks?.length) {
    const pb = schema.presets[0].blocks;
    conf = { ...conf, blocks: {} };
    order = pb.map((b, i) => { const k = `p${i}`; conf.blocks[k] = b; return k; });
  }

  const blocks = order.map(key => {
    const b = (conf.blocks || {})[key] || {};
    const type = b.type || (schema.blocks?.[0]?.type ?? 'block');
    const merged = { ...(blockDefaults[type] || {}), ...(b.settings || {}) };
    return { id: key, type, shopify_attributes: '',
             settings: applyTypes(blockDefs[type], merged, g) };
  });

  return { id, type: conf.type, settings, blocks, blocks_count: blocks.length, index: 0, index0: 0 };
}

async function renderTemplate(templateName) {
  const eng = engine();
  const settings = themeSettings();
  const g = S.globals(settings, locales);

  const tplPath = path.join(THEME, 'templates', templateName + '.json');
  const tpl = JSON.parse(read(tplPath));
  const order = tpl.order || Object.keys(tpl.sections);

  const groups = ['header-group', 'footer-group'];
  const headerJson = JSON.parse(read(path.join(THEME, 'sections', 'header-group.json')));
  const footerJson = JSON.parse(read(path.join(THEME, 'sections', 'footer-group.json')));

  async function renderSectionList(json) {
    const ord = json.order || Object.keys(json.sections);
    let html = '';
    for (const id of ord) {
      const conf = json.sections[id];
      const file = path.join(THEME, 'sections', conf.type + '.liquid');
      if (!fs.existsSync(file)) { html += `<!-- missing section ${conf.type} -->`; continue; }
      const src = read(file);
      const section = buildSection(id, conf, src, g);
      try {
        // Shopify keeps global drops (settings, shop, routes…) visible inside
        // {% render %}; liquidjs only does that for `globals`, not scope.
        html += `<div id="shopify-section-${id}" class="shopify-section">` +
                (await eng.parseAndRender(src, { section }, { globals: g })) + '</div>';
      } catch (err) {
        html += `<div style="padding:14px;background:#fee;border:1px solid #c00;font:12px monospace;color:#900">` +
                `SECTION ERROR — ${conf.type}: ${String(err.message).slice(0, 400)}</div>`;
      }
    }
    return html;
  }

  const headerHtml = await renderSectionList(headerJson);
  const bodyHtml = await renderSectionList({ sections: tpl.sections, order });
  const footerHtml = await renderSectionList(footerJson);

  const layout = read(path.join(THEME, 'layout', 'theme.liquid'));
  let page = await eng.parseAndRender(layout,
    { content_for_layout: bodyHtml, content_for_header: '' },
    { globals: g });

  // Swap the {% sections %} / {% section %} markers for real rendered output.
  const groupHtml = { 'header-group': headerHtml, 'footer-group': footerHtml };
  const markers = [...page.matchAll(/<!--RENDER:(sections|section):([^>]*?)-->/g)];
  for (const m of markers) {
    let html = groupHtml[m[2]];
    if (html === undefined) {
      const f = path.join(THEME, 'sections', m[2] + '.liquid');
      html = fs.existsSync(f)
        ? await renderSectionList({ sections: { [m[2]]: { type: m[2] } }, order: [m[2]] })
        : `<!-- no section ${m[2]} -->`;
    }
    page = page.replace(m[0], html);
  }
  return page;
}

const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
               '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  try {
    if (url.startsWith('/assets/')) {
      const f = path.join(THEME, 'assets', url.replace('/assets/', ''));
      if (fs.existsSync(f)) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
        return res.end(fs.readFileSync(f));
      }
      res.writeHead(404); return res.end('no asset');
    }
    let name = 'index';
    if (url !== '/' && url !== '') name = url.replace(/^\//, '').replace(/\/$/, '');
    if (!fs.existsSync(path.join(THEME, 'templates', name + '.json'))) name = 'index';
    const html = await renderTemplate(name);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<pre style="padding:20px;font:13px monospace;color:#900">${err.stack}</pre>`);
  }
}).listen(4400, () => console.log('BANISHQ preview → http://localhost:4400'));
