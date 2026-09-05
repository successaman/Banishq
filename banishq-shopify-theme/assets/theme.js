/* =========================================================================
   BANISHQ — theme.js
   Vanilla, dependency-free. Progressive enhancement only: every interaction
   below has a working no-JS fallback (links, forms, native <details>).
   ========================================================================= */
(function () {
  'use strict';

  var BQ = window.BANISHQ || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------- helpers */
  function formatMoney(cents) {
    var format = BQ.moneyFormat || '₹{{amount}}';
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var whole = parts[0];
    var frac = parts[1];

    // Indian digit grouping: 1,23,456
    var lastThree = whole.slice(-3);
    var rest = whole.slice(0, -3);
    if (rest) lastThree = ',' + lastThree;
    var grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    return format
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/g, grouped)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, grouped)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, grouped + '.' + frac)
      .replace(/\{\{\s*amount\s*\}\}/g, grouped + '.' + frac);
  }

  function toast(message) {
    var el = $('[data-toast]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('data-toast', '');
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* ---------------------------------------------------- overlay + panels */
  var overlay = $('[data-overlay]');
  var openPanels = [];

  function showOverlay() {
    if (!overlay) return;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
    document.body.classList.add('bq-locked');
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    document.body.classList.remove('bq-locked');
    setTimeout(function () { if (!openPanels.length) overlay.hidden = true; }, 300);
  }

  function openPanel(el) {
    if (!el) return;
    el.classList.add('is-open');
    el.removeAttribute('aria-hidden');
    if (openPanels.indexOf(el) === -1) openPanels.push(el);
    showOverlay();
    var focusable = el.querySelector('input, button, a[href]');
    if (focusable) setTimeout(function () { focusable.focus(); }, 340);
  }

  function closePanel(el) {
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    openPanels = openPanels.filter(function (p) { return p !== el; });
    if (!openPanels.length) hideOverlay();
  }

  function closeAllPanels() {
    openPanels.slice().forEach(closePanel);
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) {
      var target = $(opener.getAttribute('data-open'));
      if (target) {
        e.preventDefault();
        if (target.classList.contains('is-open')) closePanel(target);
        else openPanel(target);
      }
      return;
    }
    var closer = e.target.closest('[data-close]');
    if (closer) {
      e.preventDefault();
      var panel = closer.closest('.is-open') || $(closer.getAttribute('data-close'));
      closePanel(panel);
    }
  });

  if (overlay) overlay.addEventListener('click', closeAllPanels);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openPanels.length) closeAllPanels();
  });

  /* --------------------------------------------------------- sticky head */
  var headerWrapper = $('[data-header]');
  if (headerWrapper) {
    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      headerWrapper.classList.toggle('is-scrolled', y > 8);
      lastY = y;
    }, { passive: true });
  }

  /* ------------------------------------------------- announcement rotator */
  $$('[data-announcement]').forEach(function (bar) {
    var slides = $$('.announcement__slide', bar);
    if (slides.length < 2) return;
    var i = 0;
    var speed = parseInt(bar.getAttribute('data-speed'), 10) || 5000;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, speed);
  });

  /* ----------------------------------------------------------- hero slider */
  $$('[data-hero]').forEach(function (hero) {
    var slides = $$('.hero__slide', hero);
    var dots = $$('.hero__dot', hero);
    if (slides.length < 2) return;
    var index = 0;
    var interval = parseInt(hero.getAttribute('data-interval'), 10) || 6000;
    var timer = null;

    function go(n) {
      slides[index].classList.remove('is-active');
      if (dots[index]) dots[index].classList.remove('is-active');
      index = (n + slides.length) % slides.length;
      slides[index].classList.add('is-active');
      if (dots[index]) dots[index].classList.add('is-active');
    }

    function start() { timer = setInterval(function () { go(index + 1); }, interval); }
    function stop() { clearInterval(timer); }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function () { stop(); go(n); start(); });
    });

    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    function step(by) { stop(); go(index + by); start(); }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  });

  /* ------------------------------------------------- mobile nav accordions */
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-subnav-toggle]');
    if (!toggle) return;
    e.preventDefault();
    var sub = toggle.parentElement.querySelector('.mobile-nav__sub');
    if (sub) {
      var open = sub.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  });

  /* -------------------------------------------------- footer accordions */
  document.addEventListener('click', function (e) {
    var title = e.target.closest('[data-footer-toggle]');
    if (!title || window.innerWidth >= 750) return;
    var col = title.closest('.footer__col');
    if (col) col.classList.toggle('is-open');
  });

  /* ------------------------------------------------------ quantity inputs */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty]');
    if (!btn) return;
    var wrap = btn.closest('.quantity');
    var input = wrap && wrap.querySelector('input');
    if (!input) return;
    var step = btn.getAttribute('data-qty') === 'plus' ? 1 : -1;
    var min = parseInt(input.getAttribute('min'), 10) || 1;
    var next = Math.max(min, (parseInt(input.value, 10) || min) + step);
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ------------------------------------------------------ variant picker */
  $$('[data-variant-picker]').forEach(function (picker) {
    var form = picker.closest('form') || $('#' + picker.getAttribute('data-form'));
    var variants = [];
    var dataEl = $('[data-variant-json]', picker);
    try { variants = JSON.parse(dataEl.textContent); } catch (err) { return; }

    var idInput = picker.querySelector('[data-variant-id]');
    var priceEl = $('[data-product-price]');
    var submitBtn = $('[data-add-to-cart]');
    var submitText = submitBtn && submitBtn.querySelector('[data-add-text]');
    var stickyPrice = $('[data-sticky-price]');

    function currentOptions() {
      return $$('[data-option-index]', picker).map(function (group) {
        var checked = group.querySelector('input:checked');
        return checked ? checked.value : null;
      });
    }

    function matchVariant(options) {
      return variants.find(function (v) {
        return options.every(function (opt, i) { return v.options[i] === opt; });
      });
    }

    function render() {
      var options = currentOptions();
      var variant = matchVariant(options);

      $$('[data-option-index]', picker).forEach(function (group) {
        var label = group.querySelector('[data-selected-value]');
        var checked = group.querySelector('input:checked');
        if (label && checked) label.textContent = checked.value;
      });

      if (!variant) {
        if (submitBtn) { submitBtn.setAttribute('disabled', 'disabled'); }
        if (submitText) submitText.textContent = BQ.strings.unavailable;
        return;
      }

      if (idInput) idInput.value = variant.id;

      if (window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }

      if (priceEl) {
        var html = '<span class="price__regular">' + formatMoney(variant.price) + '</span>';
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          var off = Math.round((1 - variant.price / variant.compare_at_price) * 100);
          html += '<s class="price__compare">' + formatMoney(variant.compare_at_price) + '</s>';
          html += '<span class="price__save">' + off + '% off</span>';
        }
        priceEl.innerHTML = html;
        priceEl.classList.toggle('price--sale', !!(variant.compare_at_price && variant.compare_at_price > variant.price));
      }
      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);

      if (submitBtn) {
        if (variant.available) {
          submitBtn.removeAttribute('disabled');
          if (submitText) submitText.textContent = BQ.strings.addToCart;
        } else {
          submitBtn.setAttribute('disabled', 'disabled');
          if (submitText) submitText.textContent = BQ.strings.soldOut;
        }
      }
    }

    picker.addEventListener('change', render);
    render();
  });

  /* -------------------------------------------------------- cart helpers */
  function refreshCartUI() {
    return fetch(BQ.routes.cart_url + '?section_id=cart-drawer', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('[data-cart-drawer-inner]');
        var current = $('[data-cart-drawer-inner]');
        if (fresh && current) current.innerHTML = fresh.innerHTML;
        return fetch(BQ.routes.cart_url + '.js').then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        $$('[data-cart-count]').forEach(function (el) {
          el.textContent = cart.item_count;
          el.hidden = cart.item_count === 0;
        });
        return cart;
      });
  }

  function addToCart(formData, opts) {
    opts = opts || {};
    return fetch(BQ.routes.cart_add_url + '.js', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: formData
    })
      .then(function (r) { return r.json().then(function (body) { return { ok: r.ok, body: body }; }); })
      .then(function (res) {
        if (!res.ok) {
          toast(res.body.description || res.body.message || 'Could not add to bag');
          return;
        }
        return refreshCartUI().then(function () {
          if (BQ.cartType === 'drawer' && !opts.silent) {
            openPanel($('[data-cart-drawer]'));
          } else {
            toast(BQ.strings.added);
          }
        });
      })
      .catch(function () { toast('Something went wrong. Try again.'); });
  }

  /* ------------------------------------------------- product / quick add */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.setAttribute('aria-disabled', 'true');
    addToCart(new FormData(form)).then(function () {
      if (btn) btn.removeAttribute('aria-disabled');
    });
  });

  // Size chip on product card = add that variant straight to the bag
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-quick-variant]');
    if (!chip) return;
    e.preventDefault();
    var fd = new FormData();
    fd.append('id', chip.getAttribute('data-quick-variant'));
    fd.append('quantity', 1);
    addToCart(fd);
  });

  /* ---------------------------------------------------- cart line changes */
  function changeLine(key, quantity) {
    return fetch(BQ.routes.cart_change_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: key, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function () {
        if (document.body.classList.contains('template-cart')) {
          window.location.reload();
          return;
        }
        return refreshCartUI();
      });
  }

  document.addEventListener('click', function (e) {
    var remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      changeLine(remove.getAttribute('data-cart-remove'), 0);
      return;
    }
    var qtyBtn = e.target.closest('[data-cart-qty]');
    if (qtyBtn) {
      e.preventDefault();
      var key = qtyBtn.getAttribute('data-cart-key');
      var next = parseInt(qtyBtn.getAttribute('data-cart-qty'), 10);
      changeLine(key, next);
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-cart-qty-input]');
    if (!input) return;
    changeLine(input.getAttribute('data-cart-key'), parseInt(input.value, 10) || 0);
  });

  /* ------------------------------------------------------ facet filtering */
  $$('[data-facet-form]').forEach(function (form) {
    var timer = null;
    form.addEventListener('change', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var params = new URLSearchParams(new FormData(form)).toString();
        var url = window.location.pathname + (params ? '?' + params : '');
        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            ['[data-product-grid]', '[data-facets]', '[data-collection-count]', '[data-active-facets]'].forEach(function (sel) {
              var fresh = doc.querySelector(sel);
              var current = document.querySelector(sel);
              if (fresh && current) current.innerHTML = fresh.innerHTML;
            });
            window.history.pushState({ url: url }, '', url);
            window.scrollTo({ top: (document.querySelector('[data-collection-top]') || document.body).offsetTop - 90, behavior: 'smooth' });
          });
      }, 250);
    });
  });

  document.addEventListener('change', function (e) {
    var sort = e.target.closest('[data-sort]');
    if (!sort) return;
    var url = new URL(window.location.href);
    url.searchParams.set('sort_by', sort.value);
    window.location.href = url.toString();
  });

  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.url) window.location.href = e.state.url;
  });

  /* -------------------------------------------------- predictive search */
  var searchInput = $('[data-predictive-input]');
  if (searchInput) {
    var results = $('[data-predictive-results]');
    var searchTimer = null;
    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim();
      clearTimeout(searchTimer);
      if (q.length < 2) { if (results) results.innerHTML = ''; return; }
      searchTimer = setTimeout(function () {
        fetch(BQ.routes.predictive_search_url + '?q=' + encodeURIComponent(q) + '&resources[type]=product,collection&resources[limit]=5&section_id=predictive-search')
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var fresh = doc.querySelector('[data-predictive-inner]');
            if (results && fresh) results.innerHTML = fresh.innerHTML;
          })
          .catch(function () {});
      }, 260);
    });
  }

  /* -------------------------------------------------------- PDP sticky bar */
  var stickyBar = $('[data-pdp-sticky]');
  var buyBlock = $('[data-buy-block]');
  if (stickyBar && buyBlock && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        stickyBar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
    }, { threshold: 0 }).observe(buyBlock);
  }

  /* ------------------------------------------------------------- gallery */
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest('[data-media-jump]');
    if (!thumb) return;
    var target = $('#' + thumb.getAttribute('data-media-jump'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ------------------------------------------------------------ wishlist */
  var WISH_KEY = 'banishq:wishlist';
  function readWishlist() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; } catch (err) { return []; }
  }
  function writeWishlist(list) {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(list)); } catch (err) { /* private mode */ }
  }
  function paintWishlist() {
    var list = readWishlist();
    $$('[data-wish]').forEach(function (btn) {
      btn.classList.toggle('is-active', list.indexOf(btn.getAttribute('data-wish')) !== -1);
    });
    $$('[data-wish-count]').forEach(function (el) {
      el.textContent = list.length;
      el.hidden = list.length === 0;
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wish]');
    if (!btn) return;
    e.preventDefault();
    var handle = btn.getAttribute('data-wish');
    var list = readWishlist();
    var idx = list.indexOf(handle);
    if (idx === -1) { list.push(handle); toast('Saved to wishlist'); }
    else { list.splice(idx, 1); toast('Removed from wishlist'); }
    writeWishlist(list);
    paintWishlist();
  });
  paintWishlist();

  /* ---------------------------------------------------------------- share */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-share]');
    if (!btn) return;
    e.preventDefault();
    var url = btn.getAttribute('data-share-url') || window.location.href;
    var title = btn.getAttribute('data-share-title') || document.title;
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () { /* user cancelled */ });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast('Link copied');
      }).catch(function () {
        window.prompt('Copy this link', url);
      });
    } else {
      window.prompt('Copy this link', url);
    }
  });

  /* ------------------------------------------------------- reveal on scroll */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------ countdown */
  $$('[data-countdown]').forEach(function (el) {
    var end = new Date(el.getAttribute('data-countdown')).getTime();
    if (isNaN(end)) return;
    var units = { days: $('[data-cd-days]', el), hours: $('[data-cd-hours]', el), minutes: $('[data-cd-minutes]', el), seconds: $('[data-cd-seconds]', el) };
    function tick() {
      var diff = end - Date.now();
      if (diff <= 0) { el.hidden = true; return; }
      var s = Math.floor(diff / 1000);
      var pad = function (n) { return String(n).padStart(2, '0'); };
      if (units.days) units.days.textContent = pad(Math.floor(s / 86400));
      if (units.hours) units.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      if (units.minutes) units.minutes.textContent = pad(Math.floor((s % 3600) / 60));
      if (units.seconds) units.seconds.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  });

  /* =====================================================================
     Cart page — Taneira-shaped controls
     ===================================================================== */

  /* ---- selection + bulk actions --------------------------------------- */
  var selectAll = $('[data-select-all]');
  if (selectAll) {
    var lines = function () { return $$('[data-line]'); };
    var checks = function () { return $$('[data-line-check]'); };

    function paintSelection() {
      var all = checks();
      var on = all.filter(function (c) { return c.checked; });
      var countEl = $('[data-selected-count]');
      if (countEl) countEl.textContent = on.length;
      selectAll.checked = on.length === all.length && all.length > 0;
      selectAll.indeterminate = on.length > 0 && on.length < all.length;
      lines().forEach(function (line) {
        var c = line.querySelector('[data-line-check]');
        line.classList.toggle('tline--unchecked', !!c && !c.checked);
      });
      $$('[data-bulk]').forEach(function (b) {
        if (on.length === 0) b.setAttribute('disabled', 'disabled');
        else b.removeAttribute('disabled');
      });
    }

    selectAll.addEventListener('change', function () {
      checks().forEach(function (c) { c.checked = selectAll.checked; });
      paintSelection();
    });

    document.addEventListener('change', function (e) {
      if (e.target.closest('[data-line-check]')) paintSelection();
    });

    function selectedLines() {
      return lines().filter(function (line) {
        var c = line.querySelector('[data-line-check]');
        return c && c.checked;
      });
    }

    // Remove several lines in sequence. Shopify's change endpoint reindexes
    // line items, so keys are resolved up front and removed one at a time.
    function removeKeys(keys) {
      return keys.reduce(function (chain, key) {
        return chain.then(function () {
          return fetch(BQ.routes.cart_change_url + '.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ id: key, quantity: 0 })
          });
        });
      }, Promise.resolve());
    }

    $$('[data-bulk]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var chosen = selectedLines();
        if (!chosen.length) { toast(BQ.strings.nothingSelected); return; }

        if (btn.getAttribute('data-bulk') === 'wishlist') {
          var list = readWishlist();
          chosen.forEach(function (line) {
            var handle = line.getAttribute('data-handle');
            if (handle && list.indexOf(handle) === -1) list.push(handle);
          });
          writeWishlist(list);
        }

        removeKeys(chosen.map(function (l) { return l.getAttribute('data-key'); }))
          .then(function () { window.location.reload(); });
      });
    });

    document.addEventListener('click', function (e) {
      var one = e.target.closest('[data-move-to-wishlist]');
      if (!one) return;
      e.preventDefault();
      var handle = one.getAttribute('data-wish-handle');
      var list = readWishlist();
      if (handle && list.indexOf(handle) === -1) list.push(handle);
      writeWishlist(list);
      removeKeys([one.getAttribute('data-move-to-wishlist')]).then(function () { window.location.reload(); });
    });

    paintSelection();
  }

  /* ---- PIN code serviceability + delivery estimate --------------------- */
  var PIN_KEY = 'banishq:pincode';
  var pinWrap = $('[data-pincode]');
  if (pinWrap) {
    var pinForm = $('[data-pincode-form]', pinWrap);
    var pinInput = $('[data-pincode-input]', pinWrap);
    var pinResult = $('[data-pincode-result]', pinWrap);

    var parseList = function (attr) {
      return (pinWrap.getAttribute(attr) || '')
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
    };

    function etaLabel(days) {
      var d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }

    function checkPin(pin, silent) {
      if (!/^[1-9][0-9]{5}$/.test(pin)) {
        if (!silent) {
          pinResult.hidden = false;
          pinResult.setAttribute('data-state', 'no');
          pinResult.textContent = BQ.strings.pinInvalid;
        }
        return;
      }

      var serviceable = parseList('data-serviceable');
      var metro = parseList('data-metro');
      var matches = function (list) {
        return list.some(function (prefix) { return pin.indexOf(prefix) === 0; });
      };

      var ok = serviceable.length === 0 || matches(serviceable);
      pinResult.hidden = false;

      if (!ok) {
        pinResult.setAttribute('data-state', 'no');
        pinResult.textContent = BQ.strings.pinNotServiceable.replace('{{ pincode }}', pin);
        return;
      }

      var days = parseInt(metro.length && matches(metro) ? pinWrap.getAttribute('data-metro-days') : pinWrap.getAttribute('data-days'), 10) || 6;
      var label = etaLabel(days);
      pinResult.setAttribute('data-state', 'ok');
      pinResult.textContent = BQ.strings.pinServiceable.replace('{{ pincode }}', pin) + ' · ' + BQ.strings.pinEta.replace('{{ date }}', label);

      $$('[data-line-eta] span').forEach(function (el) {
        el.textContent = BQ.strings.pinEta.replace('{{ date }}', label);
      });

      try { localStorage.setItem(PIN_KEY, pin); } catch (err) { /* private mode */ }
    }

    if (pinForm) {
      pinForm.addEventListener('submit', function (e) {
        e.preventDefault();
        checkPin(pinInput.value.trim());
      });
    }

    try {
      var savedPin = localStorage.getItem(PIN_KEY);
      if (savedPin) { pinInput.value = savedPin; checkPin(savedPin, true); }
    } catch (err) { /* private mode */ }
  }

  /* ---- coupons --------------------------------------------------------- */
  /* Shopify validates discount codes at checkout, not in the cart. Applying
     one here stores it and routes checkout through /discount/CODE. */
  var COUPON_KEY = 'banishq:coupon';
  var couponForm = $('[data-coupon-form]');
  if (couponForm) {
    var couponInput = $('[data-coupon-input]');
    var couponApplied = $('[data-coupon-applied]');
    var couponSummary = $('[data-coupon-summary]');
    var couponList = $('[data-coupon-list]');
    var couponToggle = $('[data-coupon-toggle]');
    var checkoutForm = $('[data-checkout-form]');

    function readCoupon() {
      try { return localStorage.getItem(COUPON_KEY) || ''; } catch (err) { return ''; }
    }

    function paintCoupon() {
      var code = readCoupon();
      if (couponApplied) {
        couponApplied.hidden = !code;
        var label = couponApplied.querySelector('span');
        if (label && code) label.textContent = BQ.strings.couponApplied.replace('{{ code }}', code);
      }
      if (couponSummary) {
        couponSummary.textContent = code ? code : '+ ' + (couponSummary.getAttribute('data-fallback') || couponSummary.textContent);
      }
      if (checkoutForm) {
        if (code) {
          // Send the shopper via Shopify's discount route, which applies the
          // code and forwards to checkout — or rejects it there, not here.
          checkoutForm.setAttribute('action', BQ.routes.root_url + 'discount/' + encodeURIComponent(code) + '?redirect=/checkout');
          checkoutForm.setAttribute('method', 'get');
          var hidden = checkoutForm.querySelector('[name="checkout"]');
          if (hidden) hidden.removeAttribute('name');
        } else {
          checkoutForm.setAttribute('action', BQ.routes.cart_url);
          checkoutForm.setAttribute('method', 'post');
          var btn = checkoutForm.querySelector('button[type="submit"]');
          if (btn && !btn.getAttribute('name')) btn.setAttribute('name', 'checkout');
        }
      }
    }

    function applyCoupon(code) {
      code = (code || '').trim().toUpperCase();
      if (!code) return;
      try { localStorage.setItem(COUPON_KEY, code); } catch (err) { /* private mode */ }
      paintCoupon();
      toast(BQ.strings.couponNote);
    }

    couponForm.addEventListener('submit', function (e) {
      e.preventDefault();
      applyCoupon(couponInput.value);
      couponInput.value = '';
    });

    document.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-coupon-pick]');
      if (pick) { e.preventDefault(); applyCoupon(pick.getAttribute('data-coupon-pick')); return; }

      var clear = e.target.closest('[data-coupon-clear]');
      if (clear) {
        e.preventDefault();
        try { localStorage.removeItem(COUPON_KEY); } catch (err) { /* private mode */ }
        paintCoupon();
      }
    });

    if (couponToggle && couponList) {
      couponToggle.addEventListener('click', function () {
        couponList.hidden = !couponList.hidden;
      });
    }

    if (couponSummary) couponSummary.setAttribute('data-fallback', couponSummary.textContent.replace(/^\+\s*/, ''));
    paintCoupon();
  }

  /* =====================================================================
     Deeper page set
     ===================================================================== */

  /* ---- tabbed product rails ------------------------------------------- */
  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('[role="tab"]', group);
    var panels = $$('[role="tabpanel"]', group);

    function activate(index) {
      tabs.forEach(function (t, i) {
        t.setAttribute('aria-selected', i === index ? 'true' : 'false');
        t.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach(function (p, i) { p.hidden = i !== index; });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i); });
      tab.addEventListener('keydown', function (e) {
        var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (next === null) return;
        e.preventDefault();
        var target = (next + tabs.length) % tabs.length;
        activate(target);
        tabs[target].focus();
      });
    });
  });

  /* ---- store locator filter ------------------------------------------- */
  var storeFilter = $('[data-store-filter]');
  if (storeFilter) {
    storeFilter.addEventListener('change', function () {
      var city = storeFilter.value;
      $$('[data-store]').forEach(function (store) {
        store.hidden = city !== '' && store.getAttribute('data-city') !== city;
      });
      var empty = $('[data-store-empty]');
      if (empty) empty.hidden = $$('[data-store]').some(function (s) { return !s.hidden; });
    });
  }

  /* ---- newsletter popup ------------------------------------------------ */
  var popup = $('[data-popup]');
  if (popup) {
    var POPUP_KEY = 'banishq:popup-seen';
    var seen = false;
    try { seen = localStorage.getItem(POPUP_KEY) === '1'; } catch (err) { seen = true; }

    function closePopup() {
      popup.classList.remove('is-open');
      try { localStorage.setItem(POPUP_KEY, '1'); } catch (err) { /* private mode */ }
    }

    if (!seen) {
      setTimeout(function () { popup.classList.add('is-open'); }, (parseInt(popup.getAttribute('data-delay'), 10) || 6) * 1000);
    }
    popup.addEventListener('click', function (e) {
      if (e.target === popup || e.target.closest('[data-popup-close]')) closePopup();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
    });
  }

  /* ---- recently viewed -------------------------------------------------- */
  var RECENT_KEY = 'banishq:recent';
  var recentHandle = document.body.getAttribute('data-product-handle');
  if (recentHandle) {
    try {
      var recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      recent = [recentHandle].concat(recent.filter(function (h) { return h !== recentHandle; })).slice(0, 12);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (err) { /* private mode */ }
  }

  var recentSection = $('[data-recent]');
  if (recentSection) {
    var handles = [];
    try { handles = JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (err) { handles = []; }
    handles = handles.filter(function (h) { return h !== recentHandle; }).slice(0, parseInt(recentSection.getAttribute('data-limit'), 10) || 4);

    if (handles.length) {
      var grid = $('[data-recent-grid]', recentSection);
      Promise.all(handles.map(function (handle) {
        return fetch(BQ.routes.root_url + 'products/' + handle + '?section_id=recently-viewed-card')
          .then(function (r) { return r.ok ? r.text() : ''; })
          .catch(function () { return ''; });
      })).then(function (chunks) {
        var html = chunks.filter(Boolean).map(function (chunk) {
          var node = new DOMParser().parseFromString(chunk, 'text/html').querySelector('[data-recent-card]');
          return node ? '<li>' + node.innerHTML + '</li>' : '';
        }).join('');
        if (html && grid) {
          grid.innerHTML = html;
          recentSection.hidden = false;
          paintWishlist();
        }
      });
    }
  }

  /* ---- wishlist page ---------------------------------------------------- */
  var wishlistPage = $('[data-wishlist-page]');
  if (wishlistPage) {
    var wHandles = readWishlist();
    var wGrid = $('[data-wishlist-grid]', wishlistPage);
    var wEmpty = $('[data-wishlist-empty]', wishlistPage);

    if (!wHandles.length) {
      if (wEmpty) wEmpty.hidden = false;
    } else {
      Promise.all(wHandles.map(function (handle) {
        return fetch(BQ.routes.root_url + 'products/' + handle + '?section_id=recently-viewed-card')
          .then(function (r) { return r.ok ? r.text() : ''; })
          .catch(function () { return ''; });
      })).then(function (chunks) {
        var html = chunks.filter(Boolean).map(function (chunk) {
          var node = new DOMParser().parseFromString(chunk, 'text/html').querySelector('[data-recent-card]');
          return node ? '<li>' + node.innerHTML + '</li>' : '';
        }).join('');
        if (html && wGrid) {
          wGrid.innerHTML = html;
          wGrid.hidden = false;
          paintWishlist();
        } else if (wEmpty) {
          wEmpty.hidden = false;
        }
      });
    }
  }

  /* ---------------------------------------------------- product rails */
  /* Arrows page the track by roughly one screenful. Swiping is native, so
     this only adds a pointer affordance and disables the arrow at each end. */
  function initRails(root) {
    var rails = (root || document).querySelectorAll('[data-rail]');
    Array.prototype.forEach.call(rails, function (rail) {
      if (rail.dataset.railReady) return;
      var track = rail.querySelector('[data-rail-track]');
      if (!track) return;
      rail.dataset.railReady = '1';

      var prev = rail.querySelector('[data-rail-prev]');
      var next = rail.querySelector('[data-rail-next]');

      function sync() {
        var max = track.scrollWidth - track.clientWidth;
        if (prev) prev.disabled = track.scrollLeft <= 4;
        if (next) next.disabled = track.scrollLeft >= max - 4;
      }
      function page(dir) {
        track.scrollBy({ left: dir * Math.round(track.clientWidth * 0.8), behavior: 'smooth' });
        // Arrow state derives from scrollLeft, which updates asynchronously;
        // re-sync shortly after so the end-stop arrow hides without a swipe.
        window.setTimeout(sync, 420);
      }
      if (prev) prev.addEventListener('click', function () { page(-1); });
      if (next) next.addEventListener('click', function () { page(1); });
      track.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  initRails();

  /* ------------------------------------------------- product gallery */
  /* Scroll-snap already moves the gallery; this only reflects which slide is
     showing (thumbnail, counter, arrow disabled state) and lets the thumbs and
     arrows drive the scroll. With JS off the gallery is still a swipeable
     scroller, just without the indicators. */
  function initProductGallery(root) {
    var gallery = (root || document).querySelector('[data-pdp-gallery]');
    if (!gallery || gallery.dataset.pdpReady) return;

    var slidesEl = gallery.querySelector('[data-pdp-slides]');
    if (!slidesEl) return;
    var slides = Array.prototype.slice.call(slidesEl.querySelectorAll('[data-pdp-slide]'));
    if (slides.length < 2) return;

    gallery.dataset.pdpReady = '1';

    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('[data-pdp-thumb]'));
    var current = gallery.querySelector('[data-pdp-current]');
    var prev = gallery.querySelector('[data-pdp-prev]');
    var next = gallery.querySelector('[data-pdp-next]');
    var index = 0;

    function paint(i) {
      index = i;
      thumbs.forEach(function (t, ti) { t.classList.toggle('is-active', ti === i); });
      if (current) current.textContent = String(i + 1);
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      var active = thumbs[i];
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function goTo(i) {
      var clamped = Math.max(0, Math.min(slides.length - 1, i));
      var target = slides[clamped];
      if (!target) return;
      // Paint straight away rather than waiting for the scroll handler: the
      // target is already known, and scroll events are throttled (or absent)
      // while the tab is backgrounded, which would leave the controls stale.
      paint(clamped);
      slidesEl.scrollTo({ left: target.offsetLeft - slidesEl.offsetLeft, behavior: 'smooth' });
    }

    // Nearest-slide-to-centre beats an IntersectionObserver here: with
    // scroll-snap and smooth scrolling the ratio can cross a threshold between
    // frames and the observer misses the change, leaving the thumbnail and
    // counter stuck on the previous image.
    function activeIndex() {
      var mid = slidesEl.scrollLeft + slidesEl.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var c = slides[i].offsetLeft + slides[i].clientWidth / 2;
        var d = Math.abs(c - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    }

    var ticking = false;
    slidesEl.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var i = activeIndex();
        if (i !== index) paint(i);
      });
    }, { passive: true });

    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { goTo(parseInt(t.dataset.pdpThumb, 10) || 0); });
    });
    if (prev) prev.addEventListener('click', function () { goTo(index - 1); });
    if (next) next.addEventListener('click', function () { goTo(index + 1); });

    paint(0);
  }

  initProductGallery();

  /* ------------------------------------------------ theme editor support */
  document.addEventListener('shopify:section:load', function (e) {
    paintWishlist();
    initProductGallery(e && e.target ? e.target : document);
    initRails(e && e.target ? e.target : document);
  });
})();
