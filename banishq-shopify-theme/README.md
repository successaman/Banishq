# BANISHQ — Shopify theme

A Shopify Online Store 2.0 theme in Liquid, built to the *BANISHQ Master Brand
Design Brief* (Udaan Craft Media). Wear Your Presence.

- **Colours** — Black `#111111` and Warm Bone `#F4F1EB` dominate; Signature
  Burgundy `#7B2330` carries recognition; Stone Grey `#A7A39C` supports
  information only. Burgundy is never placed directly on black.
- **Type** — Instrument Serif (display), Manrope (interface), IBM Plex Mono
  (prices, sizes, SKUs, dates), loaded from Google Fonts.
- **Logo** — the four locked marks ship in `assets/` as images and are
  *referenced, never redrawn*. Replace them with the traced vector exports when
  those land, or upload your own in **Theme settings → Brand**.

---

## Install

**Option A — upload the zip**

1. Zip the *contents* of `banishq-shopify-theme/` (the `assets`, `config`,
   `layout`, `locales`, `sections`, `snippets`, `templates` folders must sit at
   the root of the zip, not inside a wrapper folder).
2. Shopify admin → **Online Store → Themes → Add theme → Upload zip file**.
3. **Customize** to preview, then **Publish** when ready.

`banishq-theme.zip` in the parent folder is already packaged this way.

**Option B — Shopify CLI (recommended for ongoing work)**

```bash
npm install -g @shopify/cli @shopify/theme
cd banishq-shopify-theme
shopify theme dev --store your-store.myshopify.com
```

`shopify theme dev` gives you hot reload; `shopify theme push` uploads.

---

## Setup checklist

Do these in order. The theme renders placeholders until the data exists.

### 1. Navigation (Content → Menus)

Create a menu handled `main-menu` with this shape. Any top-level item that has
**grandchildren** opens as a mega panel; one with only children opens as a
quiet dropdown.

```
Men          → Tops      → T-shirts, Polos, Shirts, Overshirts, Sweatshirts
             → Bottoms   → Cargos, Trousers, Denim, Shorts
             → Collections → Drop 01, Under 999, New in
Women        → (same three-column shape)
Unisex       → Co-ords, Outerwear, Accessories
Drop 01
Under 999
```

Also create a `footer` menu for the footer columns.

### 2. Collections

At minimum: `drop-01`, `new-in`, `best-sellers`, `under-999`, plus one per
category tile. Give each a **collection image** — it becomes the collection
banner and the tile artwork.

### 2b. Category landing pages (Men / Women / Unisex)

`collection.mens.json`, `collection.womens.json` and `collection.unisex.json`
are branded landing pages — campaign hero, a featured rail, an editorial block
and a promo banner — sitting directly above the normal filterable product grid.

They only appear once you attach them to a collection:

1. **Products → Collections** → open the collection (e.g. *Men*).
2. In the right-hand **Theme template** box, choose **collection.mens**.
3. Save. `/collections/mens` now renders the branded page instead of the plain
   grid, which is where the homepage category tiles already point.

Repeat for Women (`collection.womens`) and Unisex (`collection.unisex`).

Until you do this the links still work — they just land on the standard
collection layout. Nothing breaks either way.

> Note: these were originally written as `index-mens.json` and friends, which
> Shopify can never route to. A store has exactly one homepage template, and
> alternate templates exist only for collections, products, pages, blogs and
> articles. Collection templates are the correct home for this.

### 3. Pages

Create each page in **Content → Pages**, then pick its template in the
**Theme template** box on the right.

| Page | Template to assign |
|---|---|
| Contact | `page.contact` |
| Size guide | `page.size-guide` |
| Our story / About | `page.about` |
| Stores | `page.stores` |
| Franchise | `page.franchise` |
| Track order | `page.track-order` |
| Returns & exchanges | `page.returns` |
| Wishlist | `page.wishlist` |
| Lookbook | `page.lookbook` |
| Shipping, Privacy, Terms | `page` |

Then wire the links:

- Size guide URL → **Product → Variant picker → Size guide link**
- Wishlist page → **Header → Wishlist page**, and **Cart → Wishlist page**
- Track order and Size guide → **Announcement bar → Right link 1 / 2**

`page.returns` includes a `main-page` section between the steps and the FAQ, so
whatever you write in the page body renders inside the designed layout rather
than replacing it.

### 4. Filters

Install Shopify's free **Search & Discovery** app and add filters for Size,
Colour, Price, Product type and any fabric metafield. `main-collection.liquid`
renders whatever filters that app exposes — no code change needed.

### 5. Product option naming

The theme keys off option names, so name them consistently:

- An option containing **"size"** gets the size chips on cards, the size-guide
  link on the product page, and rectangular swatches.
- An option containing **"colour"** or **"color"** renders as round swatches.
  Swatch colour is taken from the **last word** of the value, so use
  `Burgundy`, `Warm Bone`, `Olive` — values whose last word is a CSS colour
  name. For anything else, add proper swatch metafields or a swatch app.

### 6. Theme settings

**Brand** — upload the primary horizontal lockup, the utility wordmark and the
bird icon. Defaults ship in `assets/` so the theme is never unbranded.

**Cart** — drawer or cart page, and the free-shipping threshold in rupees
(`999` by default; blank hides the progress bar).

**Product cards** — image ratio, hover image, size chips, quick add, and the
minimum discount that earns a sale badge (10% by default, so a ₹50 markdown on
a ₹1,999 shirt does not shout).

---

## What is in here

```
assets/          base.css (design tokens + every component), theme.js, the four marks
config/          settings_schema.json, settings_data.json
layout/          theme.liquid, password.liquid
locales/         en.default.json
sections/        29 sections + header-group.json / footer-group.json
snippets/        product-card, price, icon, cart-drawer, meta-tags, pagination, …
templates/       JSON templates for every page type + customer account Liquid templates
```

### Sections you will reorder most

| Section | Does |
|---|---|
| `hero` | Full-bleed campaign slides, separate mobile crop, adjustable darkening |
| `marquee` | Running strip; bird mark on the bone scheme, hairline dot on black/burgundy |
| `category-tiles` | Shop-by tiles, or circular quick links for mobile-first routing |
| `featured-collection` | Product rail; grid on desktop, optional swipe row on mobile |
| `collection-tabs` | One rail, tabbed by Men / Women / Unisex |
| `editorial-split` | Half image, half statement — the label story unit |
| `drop-banner` | Campaign end-frame with an optional countdown |
| `shop-the-look` | One campaign frame with product hotspots and a card list under it |
| `lookbook` | Campaign grid with one double-width anchor |
| `blog-posts` | Journal rail pulled from a chosen blog |
| `instagram-feed` | UGC grid from uploaded images — no API token to expire |
| `press-logos` | Quiet "as seen in" strip |
| `recently-viewed` | Reads handles from the browser, fetches live cards |
| `testimonials` | Customer quotes with ratings |
| `value-props` | Delivery, returns, fit and price reassurances |
| `size-guide` | Unisex tables, authored as plain comma-separated text |
| `text-columns` | Icon and text columns — carries the policy and service pages |
| `page-hero` | The banner every content page opens with |
| `store-locator` | One block per store, city filter appears past three stores |
| `franchise-form` | Franchise enquiry with investment ranges |
| `track-order` | AWB lookup plus status explainers |
| `wishlist` | Wishlist page |
| `newsletter-popup` | First-visit signup, off by default |

### The cart

`sections/main-cart.liquid` follows the taneira.com layout: line items at 7/12
on the left, a sticky order summary at 4/12 on the right.

- **Left rail** — offer banner, PIN code delivery check, "n/n items selected"
  row with bulk actions, then the item cards with quantity stepper, delete,
  move-to-wishlist and a per-item arrival date.
- **Right rail** — coupon panel, savings band, Order Details (Total MRP,
  discount on MRP, shipping, promo, coupon, TOTAL), taxes note, international
  shipping line, checkout with the total inside the button, continue shopping,
  and the add-from-wishlist panel.
- **Empty state** — trending searches as chips, trending category tiles, and a
  top-sellers rail, matching Taneira's empty cart.

Three deliberate differences, because Taneira runs on Salesforce Commerce Cloud
and this runs on Shopify:

1. **Selection drives bulk actions, not partial checkout.** Shopify always
   checks out the whole cart, so the checkboxes remove or move several lines at
   once and the totals always describe the whole cart. Nothing can be silently
   excluded from what you pay for.
2. **Coupons are validated at checkout.** Shopify has no cart-side discount API.
   Applying a code stores it and routes checkout through
   `/discount/CODE?redirect=/checkout`, where Shopify accepts or rejects it. The
   cart never claims a discount it cannot prove.
3. **The PIN check is an estimate, not a rate quote.** It reads the prefix lists
   you set in the section settings and shows an arrival date. Real shipping is
   priced at checkout. Set your actual serviceable prefixes before launch, or
   clear the field to accept every valid Indian PIN.

---

## How it behaves

**Nothing depends on JavaScript to make a sale.** Variant options are radios
inside the product form with a `<noscript>` variant select behind them; filters
and sort are a plain GET form; the cart page posts to `/cart`. JavaScript then
upgrades all three — fetch-and-swap filtering, instant variant price and
availability, and a slide-out bag — without changing the markup contract.

**Accessibility** — visible focus rings, labelled controls, `aria-hidden` on
closed panels, `prefers-reduced-motion` honoured across the marquee, hero and
reveals.

**Performance** — one stylesheet, one deferred script, no framework. Hero and
first-row product images load eagerly; everything else is lazy. Google Fonts
loads non-blocking with a real fallback stack.

**SEO** — Open Graph and Twitter cards, plus `Product` and `Organization`
JSON-LD in `snippets/meta-tags.liquid`.

---

## Brand rules the code enforces

1. Desktop header and footer use the **primary horizontal lockup** (min 120px).
2. Mobile header uses the **utility wordmark** (min 80px).
3. Favicon and small marks use the **bird icon** (min 16px).
4. The **BQ monogram** is not used on the storefront — it is reserved for
   social, app icon and packaging seals.
5. The brand line sits near the logo, never locked to the artwork.
6. Burgundy is never set directly on black.

The supplied bird icon is burgundy on an opaque warm-bone ground, so it renders
only on the bone marquee scheme; black and burgundy schemes fall back to a
hairline dot rather than a redrawn mark. Supply a transparent or bone-reversed
bird export and the fallback can be removed.

---

## Known gaps to close before launch

- **Wishlist and recently-viewed** are stored in the browser only
  (`localStorage`), so they do not follow a customer across devices. Wire them
  to a metafield or a wishlist app if that matters.
- **PIN serviceability** ships with a plausible default prefix list, not your
  courier's. Replace it in **Cart → Delivery check** and **Product → Delivery
  estimate** before you launch, or the estimate will be wrong.
- **Complementary products** on the product page need Shopify's free Search &
  Discovery app; the block renders nothing until you set them.
- **Franchise and track-order forms** post through Shopify's contact form, so
  submissions arrive as email rather than in a CRM.
- **Colour swatches** derive from the option value's last word. Move to swatch
  metafields for anything outside the named palette.
- **Reviews** — `card_show_rating` is off; turn it on after installing a
  reviews app and rendering its block.
- **Store locator** for the franchise rollout is not built; the footer has a
  slot for it.
