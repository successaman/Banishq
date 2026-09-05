// Minimal Shopify-Liquid compatibility layer: enough filters/tags/objects to
// render this theme's sections locally for visual review. Not a Shopify emulator.
const fs = require('fs');
const path = require('path');

const THEME = path.join(__dirname, '..', 'banishq-shopify-theme');

const PHOTOS = [
  'https://images.unsplash.com/photo-1599725728598-dc7ed109ff89',
  'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf',
  'https://images.unsplash.com/photo-1654005018306-7066fc118281',
  'https://images.unsplash.com/photo-1632149877166-f75d49000351',
  'https://images.unsplash.com/photo-1608146226687-b39d090a8c20',
  'https://images.unsplash.com/photo-1594035795519-19274ae37f71',
  'https://images.unsplash.com/photo-1619603364937-8d7af41ef206',
  'https://images.unsplash.com/photo-1635650805023-f2529440b5aa',
];
const img = (i, w = 800) => `${PHOTOS[i % PHOTOS.length]}?w=${w}&q=80&auto=format&fit=crop`;

// ---- mock catalogue -------------------------------------------------------
const NAMES = [
  'Heavyweight Cotton Tee', 'Relaxed Overshirt', 'Wide-Leg Cargo', 'Linen Co-ord Set',
  'Oversized Crew Sweat', 'Pleated Trouser', 'Cropped Denim Jacket', 'Ribbed Knit Polo',
  'Utility Field Shirt', 'Tapered Chino', 'Boxy Graphic Tee', 'Drawstring Short',
];
const PRICES = [199, 899, 1299, 1499, 1899, 2199, 2499, 2999];

function makeProduct(i) {
  const price = PRICES[i % PRICES.length];
  const onSale = i % 3 === 0;
  const compare = onSale ? Math.round(price * 1.45) : price;
  const media = { src: img(i), alt: NAMES[i % NAMES.length], width: 800, height: 1000,
                  preview_image: { src: img(i) } };
  const SIZES = ['S', 'M', 'L', 'XL'];
  const variants = SIZES.map((s, vi) => ({
    id: 1000 + i * 10 + vi, price: price * 100, compare_at_price: compare * 100,
    // one size out of stock on some products, so disabled chips are exercised
    available: !(i % 4 === 1 && s === 'XL'),
    title: s, sku: `BQ-${1000 + i}-${s}`, featured_media: media,
    options: [s], option1: s, option2: null, option3: null,
  }));
  const variant = variants.find(v => v.available) || variants[0];
  return {
    id: 500 + i, title: NAMES[i % NAMES.length], handle: `product-${i}`, url: `/products/product-${i}`,
    featured_image: media, featured_media: media, media: [0,1,2,3,4].map(function(k){ return { id: 900+i*10+k, media_type:'image', src: img(i+k), alt: NAMES[i % NAMES.length], width:800, height:1000, preview_image:{src:img(i+k)} }; }),
    images: [media], price: price * 100, compare_at_price: compare * 100,
    price_min: price * 100, price_max: price * 100, available: i % 7 !== 5,
    vendor: 'BANISHQ', type: 'Apparel', tags: i % 4 === 0 ? ['new'] : [],
    variants, first_available_variant: variant,
    selected_or_first_available_variant: variant, has_only_default_variant: false,
    // Shopify exposes option values as plain strings, plus selected_value,
    // which is what the variant picker keys its `checked` state off.
    options_with_values: [{ name: 'Size', position: 1, values: SIZES,
                            selected_value: variant.title }],
    options: ['Size'],
    description: '<p>Built for repeat wear. Heavier cotton, cleaner cuts.</p>',
    empty: false,
  };
}
const ALL = Array.from({ length: 12 }, (_, i) => makeProduct(i));

function makeCollection(handle, title, n = 8) {
  const products = ALL.slice(0, n);
  return { id: handle, handle, title, url: `/collections/${handle}`, products,
           products_count: products.length, all_products_count: products.length,
           featured_image: { src: img(2, 900) }, image: { src: img(2, 900) },
           description: '', empty: false,
           filters: [], sort_by: 'best-selling', default_sort_by: 'best-selling',
           sort_options: [
             { name: 'Featured', value: 'manual' },
             { name: 'Best selling', value: 'best-selling' },
             { name: 'Price, low to high', value: 'price-ascending' },
             { name: 'Price, high to low', value: 'price-descending' },
           ] };
}
const collections = {
  all: makeCollection('all', 'All products', 12),
  mens: makeCollection('mens', "Men's", 8),
  womens: makeCollection('womens', "Women's", 8),
  unisex: makeCollection('unisex', 'Unisex', 8),
  'new-in': makeCollection('new-in', 'New in', 8),
  'best-sellers': makeCollection('best-sellers', 'Best sellers', 8),
  'drop-01': makeCollection('drop-01', 'Drop 01', 8),
};
collections[''] = collections.all;

// A real cart with line items — an item_count with an empty items array
// renders a drawer that shows a subtotal and no products, which is not a
// state Shopify can actually produce.
function buildCart() {
  const chosen = [ALL[0], ALL[3]];
  const items = chosen.map((prod, n) => {
    const v = prod.selected_or_first_available_variant;
    const qty = n === 0 ? 2 : 1;
    return {
      key: prod.handle + ':' + v.id,
      id: v.id,
      url: prod.url,
      quantity: qty,
      title: prod.title + ' - ' + v.title,
      product: prod,
      product_title: prod.title,
      variant: v,
      variant_title: v.title,
      image: prod.featured_image,
      final_price: v.price,
      original_price: v.compare_at_price,
      final_line_price: v.price * qty,
      original_line_price: v.compare_at_price * qty,
      line_price: v.price * qty,
      line_level_discount_allocations: [],
      selling_plan_allocation: null,
    };
  });
  const total = items.reduce((a, i) => a + i.final_line_price, 0);
  const original = items.reduce((a, i) => a + i.original_line_price, 0);
  return {
    item_count: items.reduce((a, i) => a + i.quantity, 0),
    items,
    total_price: total,
    items_subtotal_price: total,
    original_total_price: original,
    total_discount: original - total,
    cart_level_discount_applications: [],
    currency: { iso_code: 'INR' },
    note: '',
  };
}

// ---- filters --------------------------------------------------------------
function money(v) {
  const n = (Number(v) || 0) / 100;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function registerFilters(engine) {
  const F = engine.filters;
  const def = (name, fn) => engine.registerFilter(name, fn);

  def('money', money);
  def('money_with_currency', v => money(v) + ' INR');
  def('money_without_currency', v => ((Number(v) || 0) / 100).toFixed(2));
  def('money_without_trailing_zeros', v => '₹' + Math.round((Number(v) || 0) / 100).toLocaleString('en-IN'));

  def('image_url', (input, ...args) => {
    let w = 800;
    for (let i = 0; i < args.length; i++) if (args[i] === 'width') w = args[i + 1];
    if (!input) return img(0, w);
    const src = typeof input === 'string' ? input : (input.src || input.preview_image?.src || img(0, w));
    return src.includes('?') ? src.replace(/w=\d+/, `w=${w}`) : `${src}?w=${w}&q=80&auto=format&fit=crop`;
  });
  def('img_url', (i, s) => engine.filters.image_url(i));
  def('asset_url', s => `/assets/${s}`);
  def('asset_img_url', s => `/assets/${s}`);
  def('file_url', s => `/assets/${s}`);
  def('stylesheet_tag', s => `<link rel="stylesheet" href="${s}">`);
  def('script_tag', s => `<script src="${s}" defer></script>`);
  def('placeholder_svg_tag', (name, cls = '') =>
    `<img class="${cls}" src="${img(1, 900)}" alt="" style="width:100%;height:100%;object-fit:cover">`);
  def('image_tag', (src, ...a) => `<img src="${src}" alt="">`);

  def('t', function (key, ...args) {
    // liquidjs hands named filter args over as [key, value] arrays:
    // {{ 'k' | t: count: 3 }} -> [['count', 3]].
    const opts = {};
    for (const a of args) {
      if (Array.isArray(a) && a.length === 2) opts[a[0]] = a[1];
      else if (a && typeof a === 'object') Object.assign(opts, a);
    }
    // __locales now lives in globals, not environments — read through the
    // context so it resolves from either.
    let s = this.context.getSync(['__locales']) || this.context.environments.__locales;
    for (const part of String(key).split('.')) { if (!s) break; s = s[part]; }
    if (s && typeof s === 'object') s = s.other || s.one || Object.values(s)[0];
    if (typeof s !== 'string') return String(key).split('.').pop().replace(/_/g, ' ');
    return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (opts[k] !== undefined ? opts[k] : ''));
  });

  def('handle', s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  def('handleize', s => engine.filters.handle(s));
  def('json', v => JSON.stringify(v));
  def('within', (u) => u);
  def('link_to', (s, u) => `<a href="${u}">${s}</a>`);
  def('date', (v, f) => new Date().toDateString());
  def('weight_with_unit', v => `${v} g`);
  def('highlight', s => s);
  def('pluralize', (n, a, b) => (Number(n) === 1 ? a : b));
  def('default_pagination', () => '');
  def('sort_by', u => u);
  def('brightness_difference', () => 100);
  def('color_darken', c => c);
  def('color_lighten', c => c);
  def('color_to_rgb', c => c);
  def('color_modify', c => c);
  def('metafield_text', v => String(v ?? ''));
  def('metafield_tag', v => String(v ?? ''));
  def('payment_button', () => '');
  def('payment_terms', () => '');
  def('inline_asset_content', () => '');
  def('structured_data', v => '');
  def('camelize', s => s);
  def('format_address', () => '');
  def('article_img_url', i => img(3));
  def('external_video_tag', () => '');
  def('video_tag', () => '');
  def('model_viewer_tag', () => '');
  def('media_tag', () => '');
  def('time_tag', v => `<time>${v}</time>`);
  def('base64_encode', s => Buffer.from(String(s)).toString('base64'));
}

// ---- tags -----------------------------------------------------------------
function registerTags(engine, { onSectionSchema } = {}) {
  // {% schema %} … {% endschema %} — capture and drop
  engine.registerTag('schema', {
    parse(tagToken, remainTokens) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream.on('token', t => { if (t.name === 'endschema') stream.stop(); else this.tpls.push(t.getText?.() ?? ''); });
      stream.on('template', t => this.tpls.push(t.token?.getText?.() ?? ''));
      stream.start();
    },
    render() { return ''; },
  });

  for (const name of ['javascript', 'stylesheet']) {
    engine.registerTag(name, {
      parse(tagToken, remainTokens) {
        this.body = [];
        const end = 'end' + name;
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('token', t => { if (t.name === end) stream.stop(); else this.body.push(t.getText?.() ?? ''); });
        stream.on('template', t => this.body.push(t.token?.getText?.() ?? ''));
        stream.start();
      },
      render() {
        const src = this.body.join('');
        return name === 'stylesheet' ? `<style>${src}</style>` : `<script>${src}</script>`;
      },
    });
  }

  // {% form 'x' %} … {% endform %}
  engine.registerTag('form', {
    parse(tagToken, remainTokens) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream.on('template', t => this.tpls.push(t));
      stream.on('tag:endform', () => stream.stop());
      stream.start();
    },
    *render(ctx, emitter) {
      emitter.write('<form method="post" action="#">');
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      emitter.write('</form>');
    },
  });

  // {% paginate x by n %} … {% endpaginate %}
  engine.registerTag('paginate', {
    parse(tagToken, remainTokens) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream.on('template', t => this.tpls.push(t));
      stream.on('tag:endpaginate', () => stream.stop());
      stream.start();
    },
    *render(ctx, emitter) {
      ctx.push({ paginate: { pages: 1, current_page: 1, items: 12, parts: [], next: null, previous: null } });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
    },
  });

  engine.registerTag('style', {
    parse(tagToken, remainTokens) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream.on('template', t => this.tpls.push(t));
      stream.on('tag:endstyle', () => stream.stop());
      stream.start();
    },
    *render(ctx, emitter) {
      emitter.write('<style>');
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      emitter.write('</style>');
    },
  });

  // {% sections 'header-group' %} / {% section 'name' %} — emit a marker the
  // server swaps for the rendered group, since rendering is async up a level.
  for (const tag of ['sections', 'section']) {
    engine.registerTag(tag, {
      parse(tagToken) { this.name = String(tagToken.args || '').trim().replace(/^['"]|['"]$/g, ''); },
      render() { return `<!--RENDER:${tag}:${this.name}-->`; },
    });
  }
}

// ---- globals --------------------------------------------------------------
function globals(settings, locales) {
  return {
    __locales: locales,
    settings,
    shop: { name: 'BANISHQ', url: 'http://localhost:4400', domain: 'localhost',
            email: 'hello@banishq.in', description: 'Wear Your Presence.',
            money_format: '₹{{amount}}', permanent_domain: 'banishq.myshopify.com' },
    routes: {
      root_url: '/', collections_url: '/collections', all_products_collection_url: '/collections/all',
      search_url: '/search', cart_url: '/cart', cart_add_url: '/cart/add',
      cart_change_url: '/cart/change', cart_update_url: '/cart/update',
      account_url: '/account', account_login_url: '/account/login',
      account_register_url: '/account/register', account_logout_url: '/account/logout',
      predictive_search_url: '/search/suggest',
    },
    collections,
    all_products: Object.fromEntries(ALL.map(p => [p.handle, p])),
    cart: buildCart(),
    customer: null, template: { name: 'index', suffix: '' }, request: { page_type: 'index', design_mode: false },
    canonical_url: 'http://localhost:4400/', page_title: 'BANISHQ', page_description: 'Wear Your Presence.',
    content_for_header: '', content_for_layout: '',
    linklists: {
      'main-menu': { title: 'Main menu', links: [
        { title: 'Men', url: '/collections/mens', links: [
          { title: 'Tops', url: '/collections/mens', links: [
            { title: 'T-shirts', url: '/collections/mens', links: [] },
            { title: 'Shirts', url: '/collections/mens', links: [] },
            { title: 'Overshirts', url: '/collections/mens', links: [] }] },
          { title: 'Bottoms', url: '/collections/mens', links: [
            { title: 'Cargos', url: '/collections/mens', links: [] },
            { title: 'Trousers', url: '/collections/mens', links: [] }] }] },
        { title: 'Women', url: '/collections/womens', links: [
          { title: 'Tops', url: '/collections/womens', links: [
            { title: 'Kurtas', url: '/collections/womens', links: [] },
            { title: 'Co-ords', url: '/collections/womens', links: [] }] }] },
        { title: 'Unisex', url: '/collections/unisex', links: [] },
        { title: 'Drop 01', url: '/collections/drop-01', links: [] },
        { title: 'Under 999', url: '/collections/all', links: [] },
      ] },
      footer: { title: 'Footer', links: [
        { title: 'About', url: '/pages/about', links: [] },
        { title: 'Stores', url: '/pages/stores', links: [] },
        { title: 'Contact', url: '/pages/contact', links: [] }] },
    },
    images: {}, blogs: {}, articles: {}, pages: {}, localization: { available_countries: [], available_languages: [] },
    predictive_search: { performed: false, resources: {} },
    powered_by_link: '', additional_checkout_buttons: false,
    scripts: {}, current_tags: [], handle: 'index',
  };
}

module.exports = { THEME, registerFilters, registerTags, globals, collections, ALL, img, makeProduct };
