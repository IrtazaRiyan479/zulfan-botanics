(function () {
  'use strict';

  function api(name) {
    return location.pathname.indexOf('/product-pages/') !== -1 ? '../api/' + name : 'api/' + name;
  }

  function money(n) {
    return 'Rs. ' + Math.round(n).toLocaleString('en-PK');
  }

  function text(message) {
    var el = document.getElementById('paymentMessage');
    if (el) el.textContent = message;
  }

  function safe(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function checkReturn(orderNo) {
    return fetch(api('orders.php?order_no=' + encodeURIComponent(orderNo))).then(function (r) {
      return r.json().then(function (x) {
        if (!r.ok || !x.ok) throw Error(x.error || 'Unable to load order');
        return x.order;
      });
    });
  }

  function render() {
    var form = document.getElementById('checkoutForm');
    var box = form && form.querySelector('.order-summary');
    if (!box || !window.Zulfan) return;

    var items = window.Zulfan.cartItems();
    var sub = items.reduce(function (n, x) {
      return n + x.price * x.qty;
    }, 0);
    var disc = sessionStorage.getItem('zulfan_coupon') === 'ZULFAN10' ? Math.round(sub * 0.1) : 0;
    var ship = sub - disc > 3000 ? 0 : 250;

    box.querySelector('.os-items').innerHTML = items.length
      ? items
          .map(function (x) {
            return (
              '<div class="os-line"><span class="os-name">' +
              safe(x.name) +
              ' <small>× ' +
              x.qty +
              '</small></span><span class="os-price">' +
              money(x.price * x.qty) +
              '</span></div>'
            );
          })
          .join('')
      : '<div class="os-line"><span>Your cart is empty</span></div>';

    box.querySelector('.checkout-subtotal').textContent = money(sub);
    box.querySelector('.checkout-discount').textContent = '− ' + money(disc);
    box.querySelector('.checkout-shipping').textContent = ship ? 'Rs. 250' : 'Free (Pakistan)';
    box.querySelector('.checkout-total').textContent = money(sub - disc + ship);

    var btn = form.querySelector('.place-order-btn');
    if (btn) btn.disabled = !items.length;
  }

  function fieldValue(form, placeholderRx, nameHint) {
    var inputs = Array.from(form.querySelectorAll('input,textarea'));
    var byName = nameHint
      ? inputs.find(function (i) {
          return (i.name || '').toLowerCase().indexOf(nameHint) !== -1;
        })
      : null;
    if (byName && byName.value.trim()) return byName.value.trim();
    var byPlaceholder = inputs.find(function (i) {
      return placeholderRx.test(i.placeholder || '');
    });
    return byPlaceholder ? byPlaceholder.value.trim() : '';
  }

  function payload(form, method) {
    return {
      customer: {
        name: (fieldValue(form, /^First Name/i, 'first') + ' ' + fieldValue(form, /^Last Name/i, 'last')).trim(),
        phone: fieldValue(form, /^Phone/i, 'phone'),
        address: fieldValue(form, /^Street Address/i, 'address'),
        city: fieldValue(form, /^City/i, 'city'),
        email: fieldValue(form, /^Email Address/i, 'email'),
        notes: fieldValue(form, /^Order notes/i, 'notes')
      },
      items: window.Zulfan.cartItems(),
      coupon: sessionStorage.getItem('zulfan_coupon') || '',
      payment_method: method
    };
  }

  function create(form, method) {
    if (!form.reportValidity()) throw Error('Complete the required checkout fields');
    var data = payload(form, method);
    if (!data.items.length) throw Error('Your cart is empty');
    if (!/^03\d{9}$/.test(data.customer.phone)) throw Error('Phone must be 03 followed by 9 digits.');

    return fetch(api('orders.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) {
        return r.json().then(function (x) {
          if (!r.ok || !x.ok) throw Error(x.error || 'Unable to create order');
          return x;
        });
      })
      .then(function (order) {
        var client = window.ZulfanSupabase;
        if (!client) return order;
        return client.auth.getUser().then(function (r) {
          if (!r.data.user) return order;
          var user = r.data.user;
          var sub = data.items.reduce(function (n, i) {
            return n + i.price * i.qty;
          }, 0);
          var disc = data.coupon === 'ZULFAN10' ? Math.round(sub * 0.1) : 0;
          var ship = sub - disc > 3000 ? 0 : 250;
          return client
            .from('customer_orders')
            .insert({
              order_no: order.order_no,
              user_id: user.id,
              status: order.status,
              payment_method: method,
              subtotal: sub,
              discount: disc,
              shipping: ship,
              total: order.total,
              customer_name: data.customer.name,
              phone: data.customer.phone,
              email: data.customer.email || user.email || '',
              address: data.customer.address,
              city: data.customer.city
            })
            .then(function (x) {
              if (x.error) throw x.error;
              return client
                .from('customer_order_items')
                .insert(
                  data.items.map(function (i) {
                    return {
                      order_no: order.order_no,
                      user_id: user.id,
                      slug: i.slug,
                      name: i.name,
                      price: i.price,
                      qty: i.qty
                    };
                  })
                )
                .then(function (y) {
                  if (y.error) throw y.error;
                  return order;
                });
            });
        });
      });
  }

  function paid(orderNo) {
    window.Zulfan.clearCart();
    var form = document.getElementById('checkoutForm');
    var success = document.getElementById('orderSuccess');
    if (form) form.style.display = 'none';
    if (success) {
      success.style.display = '';
      var msg = success.querySelector('.woocommerce-message');
      if (msg) msg.textContent = 'Order number: ' + orderNo;
      var h2 = success.querySelector('h2');
      if (h2) h2.textContent = 'Payment received';
      var p = success.querySelector('p');
      if (p) p.textContent = 'Payment received for order ' + orderNo + '.';
    }
  }

  function complete(order, method) {
    var form = document.getElementById('checkoutForm');
    var success = document.getElementById('orderSuccess');
    if (method === 'cod') window.Zulfan.clearCart();
    if (form) form.style.display = 'none';
    if (success) {
      success.style.display = '';
      var msg = success.querySelector('.woocommerce-message');
      if (msg) msg.textContent = 'Order number: ' + order.order_no;
      var h2 = success.querySelector('h2');
      if (h2) h2.textContent = method === 'cod' ? 'Order confirmed' : 'Order created';
      var p = success.querySelector('p');
      if (p) {
        p.textContent =
          method === 'cod'
            ? 'We will contact you on WhatsApp or phone to confirm delivery.'
            : 'Order number: ' + order.order_no;
      }
    }
  }

  function hosted(url, fields) {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    Object.keys(fields).forEach(function (key) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  function pollEasy(orderNo, left) {
    text('Approve the payment in the EasyPaisa app. Waiting…');
    return fetch(api('easypaisa.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_no: orderNo, action: 'status' })
    })
      .then(function (r) {
        return r.json().then(function (x) {
          if (!r.ok || !x.ok) throw Error(x.error || 'Unable to check EasyPaisa');
          return x;
        });
      })
      .then(function (x) {
        if (x.paid) {
          paid(orderNo);
          return;
        }
        if (x.pending && left > 0) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(pollEasy(orderNo, left - 1));
            }, 5000);
          });
        }
        text(x.message || 'Payment is still pending.');
        var btn = document.querySelector('#checkoutForm .place-order-btn');
        if (btn) btn.disabled = false;
      })
      .catch(function (e) {
        text(e.message);
        var btn = document.querySelector('#checkoutForm .place-order-btn');
        if (btn) btn.disabled = false;
      });
  }

  function pay(method, action) {
    var form = document.getElementById('checkoutForm');
    if (!form) return;
    var btn = form.querySelector('.place-order-btn');
    if (btn) btn.disabled = true;

    var promise;
    try {
      promise = create(form, method);
    } catch (e) {
      text(e.message);
      if (btn) btn.disabled = false;
      return;
    }

    promise
      .then(function (order) {
        if (method === 'cod') {
          complete(order, method);
          return;
        }

        var body = { order_no: order.order_no, action: action };
        if (method === 'jazzcash') {
          var jazzMobile = document.getElementById('jazzMobile');
          var jazzCnic = document.getElementById('jazzCnic');
          body.mobile = jazzMobile ? jazzMobile.value.trim() : '';
          body.cnic6 = jazzCnic ? jazzCnic.value.trim() : '';
        }
        if (method === 'easypaisa') {
          var easyMobile = document.getElementById('easyMobile');
          body.mobile = easyMobile ? easyMobile.value.trim() : '';
        }

        var endpoint =
          method === 'jazzcash' ? 'jazzcash.php' : method === 'easypaisa' ? 'easypaisa.php' : 'meezan.php';

        return fetch(api(endpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
          .then(function (r) {
            return r.json().then(function (x) {
              if (!r.ok || !x.ok) throw Error(x.error || 'Payment request failed');
              return x;
            });
          })
          .then(function (x) {
            if (x.paid) {
              paid(order.order_no);
              return;
            }
            if (x.pending && method === 'easypaisa' && action === 'ma') {
              return pollEasy(order.order_no, 12);
            }
            if (x.url && x.fields) {
              hosted(x.url, x.fields);
              return;
            }
            if (x.url) {
              location.href = x.url;
              return;
            }
            text(x.message || 'Payment is pending.');
            if (btn) btn.disabled = false;
          });
      })
      .catch(function (e) {
        text(e.message);
        if (btn) btn.disabled = false;
      });
  }

  function showMeezanIfEnabled() {
    fetch(api('payment-options.php'))
      .then(function (r) {
        return r.json();
      })
      .then(function (x) {
        if (x.meezan_enabled) {
          var el = document.getElementById('meezanOption');
          if (el) {
            el.hidden = false;
            el.style.display = '';
          }
        }
      })
      .catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('checkoutForm');
    if (!form) return;

    render();
    showMeezanIfEnabled();

    form.addEventListener('change', function (e) {
      if (!e.target.matches('[name="payment_method"]')) return;
      var method = form.querySelector('[name="payment_method"]:checked').value;
      ['jazzcash', 'easypaisa', 'meezan'].forEach(function (key) {
        var fields = document.getElementById(key + 'Fields');
        if (fields) fields.style.display = method === key ? '' : 'none';
      });
    });

    var client = window.ZulfanSupabase;
    if (client) {
      client.auth.getUser().then(function (r) {
        var user = r.data.user;
        if (!user) return;

        var picker = document.getElementById('checkoutAddressPicker');
        if (picker) picker.style.display = '';

        client
          .from('profiles')
          .select('full_name,phone,email')
          .eq('id', user.id)
          .maybeSingle()
          .then(function (x) {
            if (!x.data) return;
            var parts = (x.data.full_name || '').split(' ');
            var inputs = Array.from(form.querySelectorAll('input'));
            function set(rx, value) {
              var el = inputs.find(function (i) {
                return rx.test(i.placeholder || '');
              });
              if (el && value) el.value = value;
            }
            set(/^First Name/i, parts.shift());
            set(/^Last Name/i, parts.join(' '));
            set(/^Phone/i, x.data.phone);
            set(/^Email Address/i, x.data.email || user.email);
          });

        var sel = document.getElementById('savedAddress');
        if (!sel) return;

        client
          .from('customer_addresses')
          .select('*')
          .order('created_at', { ascending: false })
          .then(function (x) {
            (x.data || []).forEach(function (a) {
              var option = document.createElement('option');
              option.value = a.id;
              option.textContent = a.label + ' — ' + a.address + ', ' + a.city;
              option.dataset.name = a.recipient_name;
              option.dataset.phone = a.phone;
              option.dataset.address = a.address;
              option.dataset.city = a.city;
              sel.appendChild(option);
            });
          });

        sel.addEventListener('change', function () {
          var option = sel.options[sel.selectedIndex];
          if (!option.value) return;
          var parts = (option.dataset.name || '').split(' ');
          var inputs = Array.from(form.querySelectorAll('input'));
          function set(rx, value) {
            var el = inputs.find(function (i) {
              return rx.test(i.placeholder || '');
            });
            if (el) el.value = value;
          }
          set(/^First Name/i, parts.shift());
          set(/^Last Name/i, parts.join(' '));
          set(/^Phone/i, option.dataset.phone);
          set(/^Street Address/i, option.dataset.address);
          set(/^City/i, option.dataset.city);
        });
      });
    }

    var couponBtn = document.getElementById('applyCheckoutCoupon');
    if (couponBtn) {
      couponBtn.addEventListener('click', function () {
        var codeInput = document.getElementById('checkoutCoupon');
        var code = codeInput ? codeInput.value.trim() : '';
        fetch(api('coupon.php'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, subtotal: window.Zulfan.cartTotal() })
        })
          .then(function (r) {
            return r.json().then(function (x) {
              if (!r.ok || !x.ok) throw Error(x.error || 'Invalid coupon');
              sessionStorage.setItem('zulfan_coupon', code.toUpperCase());
              render();
              text('Coupon applied.');
            });
          })
          .catch(function (e) {
            text(e.message);
          });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var method = form.querySelector('[name="payment_method"]:checked').value;
      if (method === 'cod') pay('cod', '');
      else text('Use the payment button for the selected method.');
    });

    var jazzWallet = document.getElementById('jazzWalletButton');
    if (jazzWallet) jazzWallet.addEventListener('click', function () {
      pay('jazzcash', 'mwallet');
    });
    var jazzHosted = document.getElementById('jazzHostedButton');
    if (jazzHosted) jazzHosted.addEventListener('click', function () {
      pay('jazzcash', 'hosted');
    });
    var easyRequest = document.getElementById('easyRequestButton');
    if (easyRequest) easyRequest.addEventListener('click', function () {
      pay('easypaisa', 'ma');
    });
    var easyHosted = document.getElementById('easyHostedButton');
    if (easyHosted) easyHosted.addEventListener('click', function () {
      pay('easypaisa', 'hosted');
    });
    var meezanBtn = document.getElementById('meezanPayButton');
    if (meezanBtn) meezanBtn.addEventListener('click', function () {
      pay('meezan', 'hosted');
    });

    var query = new URLSearchParams(location.search);
    var state = query.get('payment');
    var orderNo = query.get('order_no');
    if (state === 'paid' && orderNo) {
      checkReturn(orderNo)
        .then(function (order) {
          if (order.status === 'paid') paid(orderNo);
          else text('Payment is still pending for order ' + orderNo);
        })
        .catch(function () {
          text('Unable to confirm payment for order ' + orderNo);
        });
    } else if (state === 'pending' && orderNo) {
      text('Payment pending for order ' + orderNo);
    } else if (state === 'cancelled') {
      text('Payment cancelled. The order remains pending.');
    }
  });
})();
