(function () {
  'use strict';

  var inProductPages = location.pathname.indexOf('/product-pages/') !== -1;

  function rootPath(path) {
    return inProductPages ? '../' + path : path;
  }

  function normalizeAssetPath(path) {
    path = String(path || '').trim();
    if (!path) return '';
    while (path.indexOf('../') === 0) path = path.slice(3);
    if (path.charAt(0) === '/') path = path.replace(/^\/+/, '');
    if (path && path.indexOf('assets/') === -1 && path.indexOf('/') === -1) {
      path = 'assets/img/product/' + path;
    }
    return path;
  }

  function displayPath(path) {
    path = normalizeAssetPath(path);
    if (!path) return '';
    if (inProductPages && path.indexOf('assets/') === 0) return '../' + path;
    return path;
  }

  function productPageUrl(slug) {
    return inProductPages ? slug + '.html' : 'product-pages/' + slug + '.html';
  }

  function storeUrl(slug) {
    return 'product-pages/' + slug + '.html';
  }

  // Client catalog used when the API is unavailable. API remains the authority when it responds.
  var SEED = [
    { slug: 'rosemary', name: 'Rosemary Hibiscus Elixir', price: 10500, image: 'assets/img/product/p-2-1.png', page: 'product-pages/rosemary.html', category: 'Scalp Care' },
    { slug: 'badam', name: 'Badam Noor Oil', price: 7500, image: 'assets/img/product/p-2-2.png', page: 'product-pages/badam.html', category: 'Shine' },
    { slug: 'safed-til', name: 'Safed Til Elixir', price: 6500, image: 'assets/img/product/p-2-3.png', page: 'product-pages/safed-til.html', category: 'Traditional Care' },
    { slug: 'black-seed', name: 'Black Seed Crown Oil', price: 8900, image: 'assets/img/product/p-2-4.png', page: 'product-pages/black-seed.html', category: 'Root Care' },
    { slug: 'amla', name: 'Amla Amrit Oil', price: 8200, image: 'assets/img/product/p-2-5.png', page: 'product-pages/amla.html', category: 'Hair Vitality' },
    { slug: 'magic-blend', name: 'Magic Blend Serum Oil', price: 11200, image: 'assets/img/product/p-2-6.png', page: 'product-pages/magic-blend.html', category: 'Frizz Control' },
    { slug: 'flaxen', name: 'Flaxen Glow Oil', price: 6800, image: 'assets/img/product/p-2-7.png', page: 'product-pages/flaxen.html', category: 'Smoothness' },
    { slug: 'coconut', name: 'Coconut Elixir', price: 5500, image: 'assets/img/product/p-2-8.png', page: 'product-pages/coconut.html', category: 'Deep Nourishment' },
    { slug: 'kulwanji', name: 'Kulwanji Root Oil', price: 9600, image: 'assets/img/product/p-2-9.png', page: 'product-pages/kulwanji.html', category: 'Root Strength' },
    { slug: 'heritage', name: 'Heritage Herbal Oil', price: 12000, image: 'assets/img/product/p-2-10.png', page: 'product-pages/heritage.html', category: 'Signature Blend' }
  ];

  function mapProduct(p) {
    var img = p.image || '';
    if (img.indexOf('assets/') === -1) img = 'assets/img/product/' + img;
    return {
      slug: p.slug,
      name: p.name,
      price: +p.price || +p.price_pkr || 0,
      url: storeUrl(p.slug),
      image: normalizeAssetPath(img),
      category: p.category || 'Hair Oil'
    };
  }

  var products = SEED.map(mapProduct);

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  function cart() {
    return read('zulfan_cart');
  }

  function wish() {
    return read('zulfan_wishlist');
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) {
    return 'Rs. ' + Math.round(n).toLocaleString('en-PK');
  }

  function toastHost() {
    var host = document.getElementById('zulfanToastHost');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'zulfanToastHost';
    host.className = 'zulfan-toast-host';
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
    return host;
  }

  function showToast(title, sub, kind) {
    var host = toastHost();
    var el = document.createElement('div');
    el.className = 'zulfan-toast is-' + (kind || 'success');
    var icon = kind === 'wish' ? '♥' : '✓';
    el.innerHTML =
      '<span class="zulfan-toast-icon">' +
      icon +
      '</span><span class="zulfan-toast-body"><span class="zulfan-toast-title">' +
      esc(title) +
      '</span><span class="zulfan-toast-sub">' +
      esc(sub || '') +
      '</span></span>';
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 280);
    }, 2200);
  }

  function pulseCart() {
    document.querySelectorAll('.header-icons a.zulfan-cart-link').forEach(function (link) {
      link.classList.remove('is-pulse');
      void link.offsetWidth;
      link.classList.add('is-pulse');
      var badge = link.querySelector('.zulfan-count');
      if (badge) {
        badge.classList.remove('is-pop');
        void badge.offsetWidth;
        badge.classList.add('is-pop');
      }
      setTimeout(function () {
        link.classList.remove('is-pulse');
        if (badge) badge.classList.remove('is-pop');
      }, 600);
    });
  }

  function markButton(btn, stateText) {
    if (!btn) return;
    var original = btn.getAttribute('data-zulfan-label');
    if (!original) {
      original = (btn.textContent || '').trim();
      btn.setAttribute('data-zulfan-label', original);
    }
    btn.classList.add('is-adding');
    if (btn.matches('a.vs-btn') || /add to cart/i.test(original)) {
      btn.textContent = stateText || 'Adding…';
    }
    setTimeout(function () {
      btn.classList.remove('is-adding');
      btn.classList.add('is-added');
      if (btn.matches('a.vs-btn') || /add to cart/i.test(original) || /adding/i.test(btn.textContent || '')) {
        btn.textContent = 'Added ✓';
      }
      setTimeout(function () {
        btn.classList.remove('is-added');
        if (btn.getAttribute('data-zulfan-label')) btn.textContent = btn.getAttribute('data-zulfan-label');
      }, 1200);
    }, 280);
  }



  function findBySlug(slug) {
    return products.filter(function (p) {
      return p.slug === slug;
    })[0] || null;
  }

  function findByName(name) {
    var n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    return products.filter(function (p) {
      return String(p.name || '').toLowerCase() === n;
    })[0] || null;
  }

  function findProduct(slug, name) {
    return findByName(name) || findBySlug(slug) || null;
  }

  var api = {
    addToCart: function (p, sourceBtn) {
      if (!p || !p.slug) return;
      if (sourceBtn) markButton(sourceBtn, 'Adding…');
      var known = findProduct(p.slug, p.name);
      if (known) {
        p = {
          slug: known.slug,
          name: known.name,
          price: known.price,
          image: known.image,
          url: known.url,
          qty: p.qty
        };
      }
      var c = cart();
      var existing = c.find(function (x) {
        return x.slug === p.slug;
      });
      var qty = Math.min(20, Math.max(1, +p.qty || 1));
      var img = normalizeAssetPath(p.image);
      var url = String(p.url || storeUrl(p.slug)).replace(/^(\.\.\/)+/, '');
      if (p.slug && url.indexOf('product-pages/') === -1) url = storeUrl(p.slug);
      if (existing) {
        existing.qty = Math.min(20, (+existing.qty || 1) + qty);
        existing.name = p.name || existing.name;
        existing.price = +p.price || existing.price;
        if (img) existing.image = img;
        if (url) existing.url = url;
      } else {
        c.push({
          slug: p.slug,
          name: p.name,
          price: +p.price || 0,
          qty: qty,
          image: img,
          url: url
        });
      }
      save('zulfan_cart', c);
      render();
      pulseCart();
      showToast('Added to cart', p.name || 'Item saved', 'success');
    },
    removeFromCart: function (slug) {
      save(
        'zulfan_cart',
        cart().filter(function (x) {
          return x.slug !== slug;
        })
      );
      render();
    },
    setQty: function (slug, qty) {
      var c = cart();
      var item = c.find(function (x) {
        return x.slug === slug;
      });
      if (item) item.qty = Math.min(20, Math.max(1, +qty || 1));
      save('zulfan_cart', c);
      render();
    },
    cartItems: cart,
    cartCount: function () {
      return cart().reduce(function (n, x) {
        return n + (+x.qty || 0);
      }, 0);
    },
    cartTotal: function () {
      return cart().reduce(function (n, x) {
        return n + (+x.price || 0) * (+x.qty || 0);
      }, 0);
    },
    addWishlist: function (p) {
      var w = wish();
      if (!w.some(function (x) {
        return x.slug === p.slug;
      })) {
        w.push(p);
        save('zulfan_wishlist', w);
      }
      render();
    },
    removeWishlist: function (slug) {
      slug = String(slug || '');
      save(
        'zulfan_wishlist',
        wish().filter(function (x) {
          return String(x.slug || '') !== slug;
        })
      );
      render();
    },
    inWishlist: function (slug) {
      return wish().some(function (x) {
        return x.slug === slug;
      });
    },
    applyCoupon: function (code) {
      if (String(code || '').trim().toUpperCase() === 'ZULFAN10') {
        sessionStorage.setItem('zulfan_coupon', 'ZULFAN10');
        render();
        return true;
      }
      sessionStorage.removeItem('zulfan_coupon');
      render();
      return false;
    },
    clearCart: function () {
      save('zulfan_cart', []);
      sessionStorage.removeItem('zulfan_coupon');
      render();
    }
  };
  window.Zulfan = api;

  function ensureChrome() {
    var href = rootPath('account.html');
    document.querySelectorAll('.header-icons').forEach(function (box) {
      if (!box.querySelector('.account-header-link')) {
        var cartLink = box.querySelector('a[href="cart.html"],a[href="../cart.html"]');
        var a = document.createElement('a');
        a.href = href;
        a.className = 'account-header-link';
        a.title = 'Account';
        a.setAttribute('aria-label', 'Account — sign in or create account');
        a.innerHTML = '<i class="far fa-user"></i>';
        if (cartLink) box.insertBefore(a, cartLink);
        else box.appendChild(a);
      }
    });
    var list = document.querySelector('.vs-mobile-menu ul');
    if (list && !list.querySelector('.account-mobile-link')) {
      var li = document.createElement('li');
      var m = document.createElement('a');
      m.href = href;
      m.className = 'account-mobile-link';
      m.textContent = 'Account';
      li.appendChild(m);
      list.appendChild(li);
    }
  }

  function render() {
    var c = cart();
    var w = wish();
    ensureChrome();

    document.querySelectorAll('.header-icons').forEach(function (box) {
      var cartLink = box.querySelector('a[href="cart.html"],a[href="../cart.html"]');
      if (!cartLink) return;
      cartLink.classList.add('zulfan-cart-link');
      var badge = cartLink.querySelector('.zulfan-count');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'zulfan-count';
        cartLink.appendChild(badge);
      }
      var n = api.cartCount();
      badge.textContent = String(n);
      badge.classList.toggle('is-zero', !n);
    });

    document.querySelectorAll('.wishlist-items').forEach(function (el) {
      el.innerHTML = w
        .map(function (x) {
          return (
            '<div class="recent-post zulfan-wish-row" data-slug="' +
            esc(x.slug) +
            '"><button type="button" class="zulfan-wish-remove" data-wish-remove="' +
            esc(x.slug) +
            '" data-name="' +
            esc(x.name) +
            '" title="Remove from wishlist" aria-label="Remove ' +
            esc(x.name) +
            ' from wishlist">×</button><div class="media-img"><a href="' +
            esc(x.url) +
            '"><img src="' +
            esc(displayPath(x.image)) +
            '" alt="' +
            esc(x.name) +
            '"></a></div><div class="media-body"><h4 class="post-title"><a class="text-inherit" href="' +
            esc(x.url) +
            '">' +
            esc(x.name) +
            '</a></h4><div class="recent-post-meta"><span class="text-theme">' +
            money(x.price) +
            '</span></div><a href="#" class="vs-btn style4 zulfan-wish-cart-btn" data-add-cart data-slug="' +
            esc(x.slug) +
            '" data-name="' +
            esc(x.name) +
            '" data-price="' +
            x.price +
            '" data-image="' +
            esc(x.image) +
            '" data-url="' +
            esc(x.url) +
            '">Add to Cart</a></div></div>'
          );
        })
        .join('');
    });

    document.querySelectorAll('.wishlist-empty').forEach(function (el) {
      el.style.display = w.length ? 'none' : '';
    });

    document.querySelectorAll('[data-wish]').forEach(function (el) {
      el.classList.toggle('is-wished', api.inWishlist(el.dataset.slug));
    });

    var body = document.getElementById('cartBody');
    if (body) {
      body.innerHTML = c.length
        ? c
            .map(function (x) {
              return (
                '<tr class="cart_item" data-slug="' +
                esc(x.slug) +
                '"><td data-title="Product"><a class="cart-productimage" href="' +
                esc(x.url) +
                '"><img width="91" height="91" src="' +
                esc(displayPath(x.image)) +
                '" alt="' +
                esc(x.name) +
                '"></a></td><td data-title="Name"><a class="cart-productname" href="' +
                esc(x.url) +
                '">' +
                esc(x.name) +
                '</a></td><td data-title="Price"><span class="amount">' +
                money(x.price) +
                '</span></td><td data-title="Quantity"><div class="quantity"><button type="button" class="quantity-minus qty-btn">−</button><input type="number" class="qty-input" value="' +
                x.qty +
                '" min="1" max="20"><button type="button" class="quantity-plus qty-btn">+</button></div></td><td data-title="Total"><span class="amount line-total">' +
                money(x.price * x.qty) +
                '</span></td><td data-title="Remove"><a href="#" class="remove">×</a></td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="6">Your cart is empty — <a href="shop.html">Shop now</a></td></tr>';

      var sub = api.cartTotal();
      var discount = sessionStorage.getItem('zulfan_coupon') === 'ZULFAN10' ? Math.round(sub * 0.1) : 0;
      var ship = sub - discount > 3000 ? 0 : 250;

      function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
      }
      setText('cartSubtotal', money(sub));
      setText('cartDiscount', '− ' + money(discount));
      var discountRow = document.getElementById('discountRow');
      if (discountRow) discountRow.style.display = discount ? '' : 'none';
      setText('cartTotal', money(sub - discount + ship));
      var shipEl = document.querySelector('.ct-ship-opt span');
      if (shipEl) shipEl.textContent = ship ? 'Rs. 250' : 'Free (Pakistan)';
      var checkoutBtn = document.querySelector('.ct-btn');
      if (checkoutBtn) checkoutBtn.style.display = c.length ? '' : 'none';
    }

    var place = document.getElementById('placeOrderButton');
    if (place) place.style.display = c.length ? '' : 'none';
  }

  function slugFromHref(href) {
    var file = (String(href || '').split('/').pop() || '').split('?')[0].split('#')[0];
    return file.replace(/\.html$/i, '');
  }

  function priceFromText(text) {
    var n = String(text || '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    var v = parseFloat(n);
    return isNaN(v) ? 0 : Math.round(v);
  }

  function productFromCard(card) {
    var link =
      card.querySelector('.product-title a[href*=".html"]') ||
      card.querySelector('a[href*="product-pages/"]') ||
      card.querySelector('a[href$=".html"]');
    var href = link ? link.getAttribute('href') : '';
    var titleEl = card.querySelector('.product-title');
    var name = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    var img = card.querySelector('img');
    var priceEl = card.querySelector('.product-price');
    var price = priceFromText(priceEl && priceEl.textContent);
    var slug = slugFromHref(href);
    var known = findProduct(slug, name);
    if (known) return known;
    if (!slug && !name) return null;
    return {
      slug: slug || '',
      name: name || slug,
      price: price,
      image: normalizeAssetPath(img ? img.getAttribute('src') : ''),
      url: String(href || '').replace(/^(\.\.\/)+/, '') || storeUrl(slug)
    };
  }

  function productFromPage() {
    var about = document.querySelector('.product-about');
    if (!about) return null;
    var titleEl = about.querySelector('.product-title');
    var name = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    var slug = slugFromHref(location.pathname);
    var img = document.querySelector('.product-big-img img');
    var priceEl = about.querySelector('.product-price');
    var known = findProduct(slug, name);
    if (known) return known;
    return {
      slug: slug,
      name: name || slug,
      price: priceFromText(priceEl && priceEl.textContent),
      image: normalizeAssetPath(img ? img.getAttribute('src') : ''),
      url: storeUrl(slug)
    };
  }

  function isCartButton(a) {
    return !!(a.querySelector('.fa-shopping-cart') || /add to cart/i.test(a.textContent || ''));
  }

  function stamp(el, product, isWish) {
    if (isWish) el.setAttribute('data-wish', '1');
    else el.setAttribute('data-add-cart', '1');
    el.dataset.slug = product.slug;
    el.dataset.name = product.name;
    el.dataset.price = String(product.price);
    el.dataset.image = normalizeAssetPath(product.image);
    el.dataset.url = String(product.url || '').replace(/^(\.\.\/)+/, '') || storeUrl(product.slug);
  }

  function decorate() {
    document.querySelectorAll('.vs-product').forEach(function (card) {
      var p = productFromCard(card);
      if (!p || !p.slug) return;
      card.querySelectorAll('a.icon-btn, a.vs-btn').forEach(function (a) {
        if (a.querySelector('.fa-heart')) stamp(a, p, true);
        else if (isCartButton(a)) stamp(a, p, false);
        else if (a.querySelector('.fa-eye') || a.querySelector('.fa-search')) {
          a.setAttribute('href', p.url);
          a.setAttribute('title', 'View ' + p.name);
        }
      });
      // product image + title links
      card.querySelectorAll('a[href="#"], a[href=""]').forEach(function (a) {
        if (a.closest('.actions')) return;
        a.setAttribute('href', p.url);
      });
    });

    var about = document.querySelector('.product-about');
    var current = productFromPage();
    if (!about || !current || !current.slug) return;

    about.querySelectorAll('a.vs-btn').forEach(function (a) {
      if (/add to cart/i.test(a.textContent || '')) stamp(a, current, false);
    });
    about.querySelectorAll('a.icon-btn').forEach(function (a) {
      if (a.querySelector('.fa-heart')) stamp(a, current, true);
    });

    var qty = about.querySelector('.qty-input');
    var btn = about.querySelector('[data-add-cart]');
    if (qty && btn && !btn.dataset.qtyBound) {
      btn.dataset.qtyBound = '1';
      btn.addEventListener(
        'click',
        function () {
          btn.dataset.qty = qty.value || '1';
        },
        true
      );
    }
  }

  function syncStoredPrices() {
    ['zulfan_cart', 'zulfan_wishlist'].forEach(function (key) {
      var rows = read(key);
      var changed = false;
      rows.forEach(function (item) {
        var p = findProduct(item.slug, item.name);
        if (!p) return;
        if (
          item.slug !== p.slug ||
          +item.price !== +p.price ||
          item.name !== p.name ||
          item.image !== p.image ||
          item.url !== p.url
        ) {
          item.slug = p.slug;
          item.price = p.price;
          item.name = p.name;
          item.image = normalizeAssetPath(p.image);
          item.url = p.url.indexOf('product-pages/') === 0 ? p.url : storeUrl(p.slug);
          changed = true;
        }
      });
      if (changed) save(key, rows);
    });
  }

  function loadCatalog() {
    var base = inProductPages ? '../api/products.php' : 'api/products.php';
    return fetch(base)
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (!d.ok || !Array.isArray(d.products) || !d.products.length) throw new Error('catalog');
        products = d.products.map(function (p) {
          return mapProduct({
            slug: p.slug,
            name: p.name,
            price: p.price_pkr,
            image: p.image,
            category: p.category
          });
        });
        syncStoredPrices();
      })
      .catch(function () {
        // Keep SEED catalog so the shop and cart still work without PHP.
        products = SEED.map(mapProduct);
      });
  }

  function renderShop() {
    var grid = document.getElementById('productGrid');
    if (!grid) return;
    var shopHref = inProductPages ? '../shop.html' : 'shop.html';
    grid.innerHTML = products.length
      ? products
          .map(function (p) {
            return (
              '<div class="col-md-6 col-xl-4 product-item"><div class="vs-product product-style2"><div class="product-img"><a href="' +
              esc(p.url) +
              '"><img src="' +
              esc(displayPath(p.image)) +
              '" alt="' +
              esc(p.name) +
              '" class="w-100"></a><div class="actions"><a href="#" class="icon-btn" data-wish="1" data-slug="' +
              esc(p.slug) +
              '" data-name="' +
              esc(p.name) +
              '" data-price="' +
              p.price +
              '" data-image="' +
              esc(p.image) +
              '" data-url="' +
              esc(p.url) +
              '"><i class="far fa-heart"></i></a><a href="' +
              esc(p.url) +
              '" class="icon-btn"><i class="far fa-eye"></i></a><a href="#" class="icon-btn" data-add-cart="1" data-slug="' +
              esc(p.slug) +
              '" data-name="' +
              esc(p.name) +
              '" data-price="' +
              p.price +
              '" data-image="' +
              esc(p.image) +
              '" data-url="' +
              esc(p.url) +
              '"><i class="far fa-shopping-cart"></i></a></div></div><div class="product-body"><div class="product-content"><h3 class="product-title"><a class="text-inherit" href="' +
              esc(p.url) +
              '">' +
              esc(p.name) +
              '</a></h3><div class="product-category"><a href="' +
              shopHref +
              '">' +
              esc(p.category || 'Hair Oil') +
              '</a></div></div><span class="product-price"><span class="currency">Rs.</span> ' +
              Math.round(p.price).toLocaleString('en-PK') +
              '</span></div></div></div>'
            );
          })
          .join('')
      : '<div class="col-12"><p>No oils are available right now.</p></div>';
    if (window.zulfanRefreshShop) window.zulfanRefreshShop();
    grid.querySelectorAll('.product-item').forEach(function (el, i) {
      el.classList.add('zulfan-reveal');
      el.style.animationDelay = Math.min(i * 0.05, 0.4) + 's';
    });
  }

  // Capture phase so sidemenu stopPropagation cannot block cart/wishlist actions
  document.addEventListener(
    'click',
    function (e) {
      var wishRemove = e.target.closest('[data-wish-remove]');
      if (wishRemove) {
        e.preventDefault();
        e.stopPropagation();
        var removedSlug = wishRemove.getAttribute('data-wish-remove') || '';
        var removedName = wishRemove.getAttribute('data-name') || '';
        if (removedSlug) {
          api.removeWishlist(removedSlug);
          showToast('Removed from wishlist', removedName, 'wish');
        }
        return;
      }

      var add = e.target.closest('[data-add-cart]');
      if (add) {
        e.preventDefault();
        e.stopPropagation();
        var data = {
          slug: add.dataset.slug,
          name: add.dataset.name,
          price: add.dataset.price,
          image: add.dataset.image,
          url: add.dataset.url,
          qty: add.dataset.qty || '1'
        };
        // Read live quantity from product detail form when present
        if (add.closest('.product-about')) {
          var qtyInput = document.querySelector('.product-about .qty-input');
          if (qtyInput) data.qty = qtyInput.value || '1';
        }
        api.addToCart(data, add);
        return;
      }

      var wishBtn = e.target.closest('[data-wish]');
      if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        wishBtn.classList.remove('is-pop');
        void wishBtn.offsetWidth;
        wishBtn.classList.add('is-pop');
        if (api.inWishlist(wishBtn.dataset.slug)) {
          api.removeWishlist(wishBtn.dataset.slug);
          showToast('Removed from wishlist', wishBtn.dataset.name || '', 'wish');
        } else {
          api.addWishlist(wishBtn.dataset);
          showToast('Saved to wishlist', wishBtn.dataset.name || '', 'wish');
        }
        return;
      }

      var remove = e.target.closest('.cart_item .remove');
      if (remove) {
        e.preventDefault();
        e.stopPropagation();
        var row = remove.closest('.cart_item');
        if (row && row.dataset.slug) api.removeFromCart(row.dataset.slug);
        return;
      }

      var plus = e.target.closest('.cart_item .quantity-plus');
      var minus = e.target.closest('.cart_item .quantity-minus');
      if (plus || minus) {
        e.preventDefault();
        e.stopPropagation();
        var crow = (plus || minus).closest('.cart_item');
        if (!crow) return;
        var input = crow.querySelector('.qty-input');
        if (!input) return;
        api.setQty(crow.dataset.slug, (+input.value || 1) + (plus ? 1 : -1));
        return;
      }

      if (e.target.closest('#applyCoupon')) {
        e.preventDefault();
        var ok = api.applyCoupon(document.getElementById('couponCode').value);
        var notice = document.getElementById('cartNotice');
        if (notice) {
          notice.style.display = '';
          notice.textContent = ok ? 'Coupon applied: 10% off.' : 'Invalid coupon';
        }
      }
    },
    true
  );

  document.addEventListener('change', function (e) {
    if (e.target.matches('.cart_item .qty-input')) {
      api.setQty(e.target.closest('.cart_item').dataset.slug, e.target.value);
    }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.matches('.form-style1')) {
      var email = form.querySelector('input[type="email"]');
      if (!email) return;
      e.preventDefault();
      var base = inProductPages ? '../api/' : 'api/';
      fetch(base + 'newsletter.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim() })
      })
        .then(function (r) {
          return r.json().then(function (d) {
            if (!r.ok || !d.ok) throw new Error(d.error || 'Unable to subscribe');
            return d;
          });
        })
        .then(function () {
          var msg = form.querySelector('.newsletter-message');
          if (!msg) {
            msg = document.createElement('p');
            msg.className = 'newsletter-message';
            form.appendChild(msg);
          }
          msg.textContent = 'Subscribed';
          email.value = '';
        })
        .catch(function (err) {
          var msg = form.querySelector('.newsletter-message');
          if (!msg) {
            msg = document.createElement('p');
            msg.className = 'newsletter-message';
            form.appendChild(msg);
          }
          msg.textContent = err.message;
        });
      return;
    }
    if (form.matches('.ajax-contact')) {
      e.preventDefault();
      var base = inProductPages ? '../api/' : 'api/';
      fetch(base + 'contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      })
        .then(function (r) {
          return r.json().then(function (d) {
            if (!r.ok || !d.ok) throw new Error(d.error || 'Unable to send message');
            return d;
          });
        })
        .then(function () {
          var msg = form.querySelector('.form-messages');
          if (msg) msg.textContent = 'Thank you! Your message has been sent.';
          form.reset();
        })
        .catch(function (err) {
          var msg = form.querySelector('.form-messages');
          if (msg) msg.textContent = err.message;
        });
    }
  });

  var booted = false;
  function normalizeStoredAssets() {
    ['zulfan_cart', 'zulfan_wishlist'].forEach(function (key) {
      var rows = read(key);
      var changed = false;
      rows.forEach(function (item) {
        var img = normalizeAssetPath(item.image);
        var url = String(item.url || '').replace(/^(\.\.\/)+/, '');
        if (item.slug && url && url.indexOf('product-pages/') === -1 && /\.html$/i.test(url)) {
          url = 'product-pages/' + url.split('/').pop();
        }
        if (img !== item.image || url !== item.url) {
          item.image = img;
          item.url = url;
          changed = true;
        }
      });
      if (changed) save(key, rows);
    });
  }

  function boot() {
    if (booted) return;
    booted = true;
    document.documentElement.classList.add('zulfan-page-enter');
    normalizeStoredAssets();
    decorate();
    render();
    renderShop();
    loadCatalog().then(function () {
      normalizeStoredAssets();
      renderShop();
      decorate();
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
