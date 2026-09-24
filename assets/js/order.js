/* Kono Crisp: box builder, cart and WhatsApp checkout.
   Everything priced or listed on the order form lives in CONFIG below. */
(function(){
  "use strict";

  var CONFIG = {
    whatsappNumber: '923311440036',   // international format, no + or leading 0
    deliveryFee: 100,                 // flat, delivery orders only
    maxSauces: 2,                     // sauces allowed per box
    fries: [
      {id:'regular', name:'Regular Fries', desc:'A proper solo portion', price:350},
      {id:'large',   name:'Large Fries',   desc:'For the serious craving', price:490},
      {id:'sharing', name:'Sharing Box',   desc:'Big enough for two', price:690}
    ],
    samosas: [
      {id:'malai-boti', name:'Malai Boti Samosa',       desc:'Creamy spiced malai boti filling', price:100},
      {id:'chicken-veg', name:'Chicken & Vegetable Samosa', desc:'Chicken and garden veg mix', price:80},
      {id:'pizza',       name:'Pizza Samosa',           desc:'Cheesy pizza-style filling', price:90},
      {id:'bbq',         name:'BBQ Samosa',             desc:'Smoky BBQ chicken filling', price:90},
      {id:'qeema',       name:'Qeema Samosa',           desc:'Spiced minced meat filling', price:90}
    ],
    seasonings: [
      {name:'Crave Classic', color:'#E9D29A'},
      {name:'Chaat Masala', color:'#B8672C'},
      {name:'Ember BBQ', color:'#8A3A1E'},
      {name:'Habanero Firestorm', color:'#D9401E'},
      {name:'Cheese Overload', color:'#F2B632'},
      {name:'Sweet Tangy', color:'#E58A5A'},
      {name:'Tamarind Tang', color:'#6E3B22'}
    ],
    sauces: [
      {name:'CRACK Sauce', color:'#EFA640'},
      {name:'Ghost Garlic', color:'#F4EFDD'},
      {name:'Golden Cheese', color:'#F4B72E'},
      {name:'Honey Glaze', color:'#D98E1F'},
      {name:'Curry Twist', color:'#C98A2B'},
      {name:'Green Fusion', color:'#6FA83A'},
      {name:'Peri-Peri Volcano', color:'#C9361F'},
      {name:'Frosty Mint', color:'#BFE3C8'},
      {name:'Samurai Sauce', color:'#E0703A'},
      {name:'Smoky BBQ', color:'#5A1A12'},
      {name:'Secret Sauce', color:'#E6B98A'}
    ]
  };

  var CART_KEY = 'kc_cart_v1';
  var CUSTOMER_KEY = 'kc_customer_v1';

  var FRIES_ICON = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 10h14l-1.6 10.2a1 1 0 01-1 .8H7.6a1 1 0 01-1-.8L5 10z" fill="currentColor"/><path d="M7.5 10L6.8 3.5M10 10l-.3-7.5M12.5 10l.2-6.5M15 10l.6-7M17 10l1-5" stroke="#F6C44F" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var SAMOSA_ICON = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 19L12 4l8 15H4z" fill="currentColor"/><path d="M8 19l4-8 4 8" stroke="#F6C44F" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n){ return 'Rs. ' + Number(n).toLocaleString('en-PK'); }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function itemsForBase(base){ return base === 'samosa' ? CONFIG.samosas : CONFIG.fries; }
  function itemById(base, id){ return itemsForBase(base).filter(function(x){ return x.id === id; })[0]; }

  function unitPrice(line){ return itemById(line.base, line.item).price; }  // seasoning & sauces are free

  /* =========================================================
     Branded POS invoice (PNG, generated on canvas, auto-downloaded
     the moment an order is sent on WhatsApp)
     ========================================================= */
  var BRAND = {
    name: 'Kono Crisp',
    tagline: 'Fry Day, Every Day',
    address: 'Model Town Link Road, Lahore',
    phone: '0300 111 2223',
    email: 'hello@konocrisp.com',
    logo: 'assets/logo-lockup.jpg?v=2', /* bump the query version whenever this file is replaced, so cached copies don't linger */
    logoRatio: 1101 / 904 /* logo-lockup.jpg natural height / width */
  };
  var INV = {
    blue: '#0D3182', blueDeep: '#0F1949', gold: '#F6C44F',
    pale: '#E8EDFB', ink: '#101A45', muted: '#8C90A3',
    line: '#E6E7EE', paper: '#FFFFFF'
  };
  var FF = "'Titillium Web', system-ui, sans-serif";
  var MF = "'Courier New', monospace";

  var logoImg = new Image();
  var logoReady = false;
  logoImg.onload = function(){ logoReady = true; };
  logoImg.src = BRAND.logo;

  function wrapText(ctx, str, maxWidth){
    var words = String(str).split(/\s+/).filter(Boolean);
    var lines = [], line = '';
    for(var i = 0; i < words.length; i++){
      var test = line ? line + ' ' + words[i] : words[i];
      if(ctx.measureText(test).width > maxWidth && line){
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if(line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function dashedLine(ctx, x1, y, x2){
    ctx.save();
    ctx.strokeStyle = INV.line;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y + 0.5);
    ctx.lineTo(x2, y + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function captureOrder(no){
    return {
      no: no,
      date: new Date(),
      orderType: orderType,
      customer: {
        name: $('#c_name').value.trim(),
        phone: normalisePhone($('#c_phone').value),
        address: $('#c_address').value.trim()
      },
      notes: $('#c_notes').value.trim(),
      items: cart.map(function(l){
        var f = itemById(l.base, l.item);
        return {
          name: f.name, qty: l.qty, unit: unitPrice(l),
          lineTotal: unitPrice(l) * l.qty,
          seasoning: l.seasoning, sauces: l.sauces.slice()
        };
      }),
      subtotal: subtotal(),
      deliveryFee: deliveryFee(),
      total: total()
    };
  }

  var SERIF = "Georgia, 'Times New Roman', serif";

  function buildInvoiceCanvas(order){
    /* POS-receipt proportions: narrow, tall strip like a thermal till slip */
    var W = 400, PAD = 20, CW = W - PAD * 2, SCALE = 2;

    var mcanvas = document.createElement('canvas');
    var mctx = mcanvas.getContext('2d');

    /* wrap using the same bold 11px font (and label width) the customer
       section actually draws with below, or lines that fit here can still
       come out wider than CW once rendered and get cut off at the edge */
    mctx.font = '700 11px ' + MF;
    var addrLabel = order.orderType === 'Delivery' ? 'Address: ' : 'Pickup: ';
    var addressText = order.orderType === 'Delivery' ? (order.customer.address || '-') : BRAND.address;
    var addressLines = wrapText(mctx, addressText, CW - mctx.measureText(addrLabel).width);

    var itemBlocks = order.items.map(function(it){
      var nameQty = it.name + '  x' + it.qty;
      var priceStr = money(it.lineTotal);
      mctx.font = '700 11px ' + MF;
      var fits = mctx.measureText(nameQty).width + 16 + mctx.measureText(priceStr).width <= CW;
      var nameLines = fits ? [nameQty] : wrapText(mctx, nameQty, CW);

      mctx.font = '400 9.5px ' + MF;
      var seasoningLines = wrapText(mctx, 'Seasoning: ' + it.seasoning, CW - 10);
      var sauceLines = wrapText(mctx, 'Sauces: ' + it.sauces.join(', '), CW - 10);

      var h = 10 + nameLines.length * 15 + seasoningLines.length * 13 + sauceLines.length * 13;
      return { it: it, nameLines: nameLines, fits: fits, priceStr: priceStr, seasoningLines: seasoningLines, sauceLines: sauceLines, h: h };
    });

    var notesLines = [];
    if(order.notes){ mctx.font = '400 9.5px ' + MF; notesLines = wrapText(mctx, order.notes, CW); }

    /* ---- layout: named section heights, reused for both the H sum and the draw pass ---- */
    var TOP = 22, LOGO_W = 150, LOGO_H = Math.round(LOGO_W * BRAND.logoRatio);
    var ADDR_GAP = 18, CONTACT_GAP = 18;
    var DIV_GAP = 20;
    var ORDER_ROW_GAP = 18, TYPE_ROW_GAP = 20;
    var ITEMS_LEAD = 6;
    var ITEMS_H = itemBlocks.reduce(function(s, b){ return s + b.h; }, 0);
    var SUBTOTAL_GAP = 18, DELIVERY_GAP = 18, TOTAL_DIV_GAP = 14, TOTAL_ROW_GAP = 24;
    var NOTES_H = notesLines.length ? (16 + notesLines.length * 13) : 0;
    var CUSTOMER_ROW_GAP = 18;
    var CUSTOMER_H = (2 + addressLines.length) * CUSTOMER_ROW_GAP;
    var THANKYOU_GAP = 32, VISIT_GAP = 18, BOTTOM_PAD = 26;

    var H = Math.ceil(
      TOP + LOGO_H + ADDR_GAP + CONTACT_GAP +
      DIV_GAP + ORDER_ROW_GAP + TYPE_ROW_GAP +
      DIV_GAP + ITEMS_LEAD + ITEMS_H +
      DIV_GAP + SUBTOTAL_GAP + DELIVERY_GAP + TOTAL_DIV_GAP + TOTAL_ROW_GAP +
      (NOTES_H ? NOTES_H + DIV_GAP / 2 : 0) +
      DIV_GAP + CUSTOMER_H +
      THANKYOU_GAP + VISIT_GAP + BOTTOM_PAD
    );

    var canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    var ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = INV.paper;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var y = TOP;

    /* ===== main logo (icon + wordmark + tagline, baked into the artwork) ===== */
    if(logoReady){
      try { ctx.drawImage(logoImg, cx - LOGO_W / 2, y, LOGO_W, LOGO_H); } catch(e){}
    }
    y += LOGO_H;

    /* ===== address / contact ===== */
    y += ADDR_GAP;
    ctx.textAlign = 'center';
    ctx.fillStyle = INV.ink;
    ctx.font = '400 9.5px ' + MF;
    ctx.fillText(BRAND.address + '  ·  Delivery & Takeaway', cx, y);

    y += CONTACT_GAP;
    ctx.fillStyle = INV.muted;
    ctx.font = '400 9.5px ' + MF;
    ctx.fillText('Tel: ' + BRAND.phone + '   ·   konocrisp.com', cx, y);

    /* ===== order meta ===== */
    y += DIV_GAP;
    dashedLine(ctx, PAD, y, W - PAD);

    y += ORDER_ROW_GAP;
    ctx.textAlign = 'left';
    ctx.fillStyle = INV.ink;
    ctx.font = '700 11px ' + MF;
    ctx.fillText('Order #' + order.no, PAD, y);
    ctx.textAlign = 'right';
    ctx.font = '400 10px ' + MF;
    var dateStr = order.date.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}) +
      ', ' + order.date.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
    ctx.fillText(dateStr, W - PAD, y);

    y += TYPE_ROW_GAP;
    ctx.textAlign = 'left';
    ctx.font = '400 11px ' + MF;
    ctx.fillText('Order Type: ' + order.orderType, PAD, y);

    /* ===== items ===== */
    y += DIV_GAP;
    dashedLine(ctx, PAD, y, W - PAD);
    y += ITEMS_LEAD;

    itemBlocks.forEach(function(b){
      y += 10;
      b.nameLines.forEach(function(l, i){
        y += 15;
        ctx.textAlign = 'left';
        ctx.fillStyle = INV.ink;
        ctx.font = '700 11px ' + MF;
        ctx.fillText(l, PAD, y);
        if(i === 0){
          ctx.textAlign = 'right';
          ctx.fillText(b.priceStr, W - PAD, y);
        }
      });

      ctx.textAlign = 'left';
      ctx.fillStyle = INV.muted;
      ctx.font = '400 9.5px ' + MF;
      b.seasoningLines.forEach(function(l){ y += 13; ctx.fillText(l, PAD, y); });
      b.sauceLines.forEach(function(l){ y += 13; ctx.fillText(l, PAD, y); });
    });

    /* ===== totals ===== */
    y += DIV_GAP;
    dashedLine(ctx, PAD, y, W - PAD);

    y += SUBTOTAL_GAP;
    ctx.font = '400 11px ' + MF;
    ctx.fillStyle = INV.ink;
    ctx.textAlign = 'left'; ctx.fillText('Subtotal', PAD, y);
    ctx.textAlign = 'right'; ctx.fillText(money(order.subtotal), W - PAD, y);

    y += DELIVERY_GAP;
    ctx.textAlign = 'left'; ctx.fillText('Delivery Fee', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(order.orderType === 'Delivery' ? money(order.deliveryFee) : 'Free (takeaway)', W - PAD, y);

    y += TOTAL_DIV_GAP;
    dashedLine(ctx, PAD, y, W - PAD);

    y += TOTAL_ROW_GAP;
    ctx.textAlign = 'left';
    ctx.fillStyle = INV.blueDeep;
    ctx.font = '700 17px ' + MF;
    ctx.fillText('TOTAL', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(money(order.total), W - PAD, y);

    /* ===== notes ===== */
    if(notesLines.length){
      y += DIV_GAP / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = INV.muted;
      ctx.font = '700 9px ' + MF;
      ctx.fillText('NOTES', PAD, y);
      ctx.fillStyle = INV.ink;
      ctx.font = '400 10px ' + MF;
      notesLines.forEach(function(l){ y += 13; ctx.fillText(l, PAD, y); });
    }

    /* ===== customer ===== */
    y += DIV_GAP;
    dashedLine(ctx, PAD, y, W - PAD);

    y += CUSTOMER_ROW_GAP;
    ctx.textAlign = 'left';
    ctx.fillStyle = INV.ink;
    ctx.font = '700 11px ' + MF;
    ctx.fillText('Name: ' + (order.customer.name || '-'), PAD, y);

    y += CUSTOMER_ROW_GAP;
    ctx.font = '700 11px ' + MF;
    ctx.fillText('Phone: ' + (order.customer.phone || '-'), PAD, y);

    addressLines.forEach(function(l, i){
      y += CUSTOMER_ROW_GAP;
      ctx.font = '700 11px ' + MF;
      ctx.fillText((i === 0 ? addrLabel : '') + l, PAD, y);
    });

    /* ===== footer ===== */
    y += THANKYOU_GAP;
    ctx.textAlign = 'center';
    ctx.fillStyle = INV.blueDeep;
    ctx.font = 'italic 700 15px ' + SERIF;
    ctx.fillText('Thank you for your order!', cx, y);

    y += VISIT_GAP;
    ctx.fillStyle = INV.muted;
    ctx.font = '400 11px ' + MF;
    ctx.fillText('Visit again!', cx, y);

    return canvas;
  }

  function downloadCanvas(canvas, filename){
    var url = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return url;
  }

  /* ---------- storage (fails soft in private mode) ---------- */
  function read(key, fallback){
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }
  function write(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){}
  }

  /* ---------- cart state ---------- */
  var cart = read(CART_KEY, []).map(function(l){
    if(l && !l.base && l.fries) return {base:'fries', item:l.fries, seasoning:l.seasoning, sauces:l.sauces, qty:l.qty};
    return l;
  }).filter(function(l){
    return l && itemById(l.base, l.item) && l.seasoning && Array.isArray(l.sauces) && l.qty > 0;
  });
  var orderType = 'Delivery';

  function lineKey(l){ return [l.base, l.item, l.seasoning, l.sauces.slice().sort().join('|')].join('::'); }
  function cartCount(){ return cart.reduce(function(n, l){ return n + l.qty; }, 0); }
  function subtotal(){ return cart.reduce(function(n, l){ return n + unitPrice(l) * l.qty; }, 0); }
  function deliveryFee(){ return orderType === 'Delivery' && cart.length ? CONFIG.deliveryFee : 0; }
  function total(){ return subtotal() + deliveryFee(); }

  function saveCart(){ write(CART_KEY, cart); renderCart(); }

  function addLine(line){
    var key = lineKey(line);
    var existing = cart.filter(function(l){ return lineKey(l) === key; })[0];
    if(existing) existing.qty += line.qty;
    else cart.push(line);
    saveCart();
  }

  /* ---------- toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 2200);
  }

  /* =========================================================
     Box builder
     ========================================================= */
  var builder = $('#builder');
  var qty = 1;
  var selectedBase = 'fries';

  function maxSauces(){
    return selectedBase === 'samosa' ? (qty >= 2 ? 2 : 1) : CONFIG.maxSauces;
  }

  function itemOptsHtml(base){
    var icon = base === 'samosa' ? SAMOSA_ICON : FRIES_ICON;
    var isSamosa = base === 'samosa';
    return itemsForBase(base).map(function(it, i){
      if(!isSamosa){
        return '<label class="opt opt--fries"><input type="radio" name="item" value="' + it.id + '"' + (i === 0 ? ' checked' : '') + '>' +
          '<span class="opt-box">' + icon + '<span class="opt-name">' + esc(it.name) + '<small>' + esc(it.desc) + '</small></span><b>' + money(it.price) + '</b></span></label>';
      }
      var qtyCtrl = '<span class="qty item-qty" data-item-qty="' + it.id + '" aria-label="Quantity"><button type="button" class="iq-btn" data-iq="-1" aria-label="Fewer">&minus;</button><output class="iq-out">1</output><button type="button" class="iq-btn" data-iq="1" aria-label="More">+</button></span>';
      return '<label class="opt opt--fries opt--samosa"><input type="radio" name="item" value="' + it.id + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span class="opt-box">' + icon + '<span class="opt-name">' + esc(it.name) + '<small>' + esc(it.desc) + '</small></span>' +
          '<span class="opt-foot"><b>' + money(it.price) + '</b>' + qtyCtrl + '</span></span></label>';
    }).join('');
  }

  function renderItemStep(){
    $('#itemStepTitle').textContent = selectedBase === 'samosa' ? 'Pick your samosas' : 'Pick your fries';
    var grid = $('#itemGrid');
    grid.className = 'opt-grid ' + (selectedBase === 'samosa' ? 'opt-grid--samosa' : 'opt-grid--fries');
    grid.innerHTML = itemOptsHtml(selectedBase);
  }

  function renderBuilder(){
    var seasOpts = CONFIG.seasonings.map(function(s){
      return '<label class="opt"><input type="radio" name="seasoning" value="' + esc(s.name) + '">' +
        '<span class="opt-box"><span class="swatch" style="--c:' + s.color + '"></span>' + esc(s.name) + '<span class="opt-tick"></span></span></label>';
    }).join('');
    var sauceOpts = CONFIG.sauces.map(function(s){
      return '<label class="opt"><input type="checkbox" name="sauce" value="' + esc(s.name) + '">' +
        '<span class="opt-box"><span class="swatch" style="--c:' + s.color + '"></span>' + esc(s.name) + '<span class="opt-tick"></span></span></label>';
    }).join('');

    builder.innerHTML =
      '<div class="b-step done" data-step="base"><div class="b-head"><span class="b-num">1</span><h3>Choose your base</h3><small>Fries or samosas</small></div>' +
        '<div class="seg" id="baseTabs" role="tablist" aria-label="Choose your base">' +
          '<button type="button" data-base="fries" class="active" aria-pressed="true">Fries</button>' +
          '<button type="button" data-base="samosa" aria-pressed="false">Samosas</button>' +
        '</div></div>' +
      '<div class="b-step done" data-step="item"><div class="b-head"><span class="b-num">2</span><h3 id="itemStepTitle">Pick your fries</h3><small>Choose one</small></div>' +
        '<div class="opt-grid opt-grid--fries" id="itemGrid"></div></div>' +
      '<div class="b-step" data-step="seasoning"><div class="b-head"><span class="b-num">3</span><h3>Choose a seasoning</h3><small>Choose one</small></div>' +
        '<div class="opt-grid opt-grid--chips">' + seasOpts + '</div></div>' +
      '<div class="b-step" data-step="sauce"><div class="b-head"><span class="b-num">4</span><h3>Add sauce flavours</h3><small id="sauceHint"></small></div>' +
        '<div class="opt-grid opt-grid--chips">' + sauceOpts + '</div></div>' +
      '<div class="b-foot">' +
        '<div class="b-summary" id="bSummary"></div>' +
        '<div class="qty" id="bFootQty" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Fewer">&minus;</button><output id="bQty">1</output><button type="button" data-q="1" aria-label="More">+</button></div>' +
        '<button type="button" class="btn btn-blue add-btn" id="addBox">Add to cart<span class="price" id="bPrice"></span></button>' +
      '</div>';

    renderItemStep();

    $('#baseTabs').addEventListener('click', function(e){
      var b = e.target.closest('button[data-base]');
      if(!b) return;
      selectedBase = b.dataset.base;
      $$('#baseTabs button', builder).forEach(function(x){
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      renderItemStep();
      $$('input[name=seasoning], input[name=sauce]', builder).forEach(function(i){ i.checked = false; });
      qty = 1;
      updateBuilder();
    });

    builder.addEventListener('click', function(e){
      var iqBtn = e.target.closest('.iq-btn');
      if(iqBtn){
        e.preventDefault();
        e.stopPropagation();
        qty = Math.max(1, Math.min(20, qty + Number(iqBtn.dataset.iq)));
        updateBuilder();
      }
    });

    builder.addEventListener('change', function(e){
      var t = e.target;
      if(t.name === 'item' && selectedBase === 'samosa') qty = 1;
      if(t.name === 'sauce' && t.checked && $$('input[name=sauce]:checked', builder).length > maxSauces()){
        t.checked = false;
        toast('You can choose up to ' + maxSauces() + ' sauce' + (maxSauces() === 1 ? '' : 's'));
      }
      updateBuilder();
    });
    $$('.b-foot .qty button', builder).forEach(function(b){
      b.addEventListener('click', function(){
        qty = Math.max(1, Math.min(20, qty + Number(b.dataset.q)));
        updateBuilder();
      });
    });
    $('#addBox').addEventListener('click', addBox);
    updateBuilder();
  }

  function enforceSauceMax(){
    var max = maxSauces();
    var checked = $$('input[name=sauce]:checked', builder);
    if(checked.length > max){
      checked.slice(max).forEach(function(i){ i.checked = false; });
      toast('Only ' + max + ' sauce' + (max === 1 ? '' : 's') + ' for ' + qty + (qty === 1 ? ' samosa' : ' samosas'));
    }
  }

  function currentSelection(){
    var it = $('input[name=item]:checked', builder);
    var s = $('input[name=seasoning]:checked', builder);
    return {
      base: selectedBase,
      item: it ? it.value : null,
      seasoning: s ? s.value : null,
      sauces: $$('input[name=sauce]:checked', builder).map(function(i){ return i.value; }),
      qty: qty
    };
  }

  function updateBuilder(){
    if(selectedBase === 'samosa') enforceSauceMax();

    var sel = currentSelection();
    $('[data-step=item]', builder).classList.toggle('done', !!sel.item);
    $('[data-step=seasoning]', builder).classList.toggle('done', !!sel.seasoning);
    $('[data-step=sauce]', builder).classList.toggle('done', sel.sauces.length > 0);
    if(sel.seasoning) $('[data-step=seasoning]', builder).classList.remove('missing');
    if(sel.sauces.length) $('[data-step=sauce]', builder).classList.remove('missing');

    $('#bQty').textContent = qty;
    var item = itemById(sel.base, sel.item);
    var unit = item ? unitPrice(sel) : 0;
    $('#bPrice').textContent = money(unit * qty);

    if(selectedBase === 'samosa'){
      $('#bFootQty').hidden = true;
      $$('.item-qty', builder).forEach(function(ctrl){
        var isSelected = ctrl.dataset.itemQty === sel.item;
        ctrl.hidden = !isSelected;
        if(isSelected) $('.iq-out', ctrl).textContent = qty;
      });
    } else {
      $('#bFootQty').hidden = false;
    }

    var max = maxSauces();
    $('#sauceHint').innerHTML = 'Choose up to ' + max + ' &middot; free';

    var parts = [];
    if(sel.seasoning) parts.push(sel.seasoning);
    if(sel.sauces.length) parts.push(sel.sauces.join(', '));
    $('#bSummary').innerHTML = '<strong>' + (item ? esc(item.name) : 'Your box') + '</strong>' +
      (parts.length ? esc(parts.join(' · ')) : 'Pick a seasoning and at least one sauce');
  }

  function addBox(){
    var sel = currentSelection();
    var missing = null;
    if(!sel.seasoning) missing = 'seasoning';
    else if(!sel.sauces.length) missing = 'sauce';
    if(missing){
      var step = $('[data-step=' + missing + ']', builder);
      step.classList.add('missing');
      step.scrollIntoView({behavior:'smooth', block:'center'});
      toast(missing === 'seasoning' ? 'Choose a seasoning for this box' : 'Pick at least one sauce');
      return;
    }
    addLine({base: sel.base, item: sel.item, seasoning: sel.seasoning, sauces: sel.sauces, qty: sel.qty});
    toast(sel.qty > 1 ? sel.qty + ' boxes added to your cart' : 'Box added to your cart');

    /* reset for the next box, keeping the base and item */
    $$('input[name=seasoning], input[name=sauce]', builder).forEach(function(i){ i.checked = false; });
    qty = 1;
    updateBuilder();
  }

  /* =========================================================
     Cart drawer
     ========================================================= */
  var drawer = $('#cartDrawer');
  var overlay = $('#drawerOverlay');
  var cartBar = $('#cartBar');
  var lastFocus = null;

  function showView(name){
    $$('.drawer-view', drawer).forEach(function(v){ v.hidden = v.dataset.view !== name; });
    $('#drawerTitle').textContent = {cart:'Your order', checkout:'Checkout', done:'Order sent'}[name];
  }

  function openDrawer(view){
    lastFocus = document.activeElement;
    showView(view || 'cart');
    if(toastEl) toastEl.classList.remove('show');
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderCart();
    setTimeout(function(){ $('#drawerClose').focus(); }, 50);
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    renderCart();
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderCart(){
    var count = cartCount();

    /* navbar badge + floating bar */
    $$('.cart-count').forEach(function(b){ b.textContent = count; b.hidden = count === 0; });
    if(cartBar){
      $('#cartBarCount').textContent = count + (count === 1 ? ' box' : ' boxes');
      $('#cartBarTotal').textContent = money(subtotal());
      cartBar.classList.toggle('show', count > 0 && !drawer.classList.contains('open'));
    }

    var list = $('#cartLines');
    if(!list) return;
    if(!cart.length){
      list.innerHTML = '<div class="cart-empty"><svg viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.4 11.2a1 1 0 001 .8h9.2a1 1 0 001-.8L20 8H6.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="17" cy="20" r="1.4" fill="currentColor"/></svg>' +
        '<strong>Your cart is empty</strong>Build your first box of fries to get started.<br><a href="' + (builder ? '#order' : 'order.html') + '" class="btn btn-blue" data-close-drawer>Build a box</a></div>';
      $('#cartFoot').hidden = true;
    } else {
      list.innerHTML = cart.map(function(l, i){
        var f = itemById(l.base, l.item);
        return '<div class="line">' +
          '<span class="line-no">' + (i + 1) + '</span>' +
          '<div><h4>' + esc(f.name) + '</h4><dl>' +
            '<dt>Seasoning: </dt><dd>' + esc(l.seasoning) + '</dd>' +
            '<dt>Sauces: </dt><dd>' + esc(l.sauces.join(', '))+'</dd>' +
            '<dt>Each: </dt><dd>' + money(unitPrice(l)) + '</dd>' +
          '</dl></div>' +
          '<div class="line-side"><span class="line-price">' + money(unitPrice(l) * l.qty) + '</span>' +
            '<div class="qty"><button type="button" data-line="' + i + '" data-d="-1" aria-label="Fewer">&minus;</button><output>' + l.qty + '</output><button type="button" data-line="' + i + '" data-d="1" aria-label="More">+</button></div>' +
            '<button type="button" class="line-remove" data-remove="' + i + '">Remove</button></div>' +
        '</div>';
      }).join('');
      $('#cartFoot').hidden = false;
    }

    var totalsHtml =
      '<div><span>Subtotal</span><span>' + money(subtotal()) + '</span></div>' +
      '<div><span>Delivery charges</span>' + (orderType === 'Delivery' ? '<span>' + money(CONFIG.deliveryFee) + '</span>' : '<span class="free">Free (takeaway)</span>') + '</div>' +
      '<div class="grand"><span>Total</span><span>' + money(total()) + '</span></div>';
    $$('.totals', drawer).forEach(function(t){ t.innerHTML = totalsHtml; });
  }

  drawer.addEventListener('click', function(e){
    var t = e.target.closest('button, a');
    if(!t) return;
    if(t.dataset.line !== undefined){
      var l = cart[Number(t.dataset.line)];
      l.qty = Math.max(1, Math.min(20, l.qty + Number(t.dataset.d)));
      if(l.base === 'samosa'){
        var lineMax = l.qty >= 2 ? 2 : 1;
        if(l.sauces.length > lineMax){
          l.sauces = l.sauces.slice(0, lineMax);
          toast('Only ' + lineMax + ' sauce' + (lineMax === 1 ? '' : 's') + ' for ' + l.qty + (l.qty === 1 ? ' samosa' : ' samosas'));
        }
      }
      saveCart();
    } else if(t.dataset.remove !== undefined){
      cart.splice(Number(t.dataset.remove), 1);
      saveCart();
    } else if(t.hasAttribute('data-close-drawer')){
      closeDrawer();
    }
  });

  $$('[data-open-cart]').forEach(function(b){
    b.addEventListener('click', function(e){ e.preventDefault(); openDrawer('cart'); });
  });
  $('#drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  $('#toCheckout').addEventListener('click', function(){
    showView('checkout');
    renderCart();
    $('.drawer-body', drawer).scrollTop = 0;
  });
  $('#backToCart').addEventListener('click', function(){ showView('cart'); });

  /* ---------- delivery / takeaway toggle ---------- */
  $$('#orderType button').forEach(function(b){
    b.addEventListener('click', function(){
      orderType = b.dataset.type;
      $$('#orderType button').forEach(function(x){
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      $('#fieldAddress').hidden = orderType !== 'Delivery';
      $('#pickupNote').hidden = orderType === 'Delivery';
      renderCart();
    });
  });

  /* ---------- checkout form ---------- */
  var saved = read(CUSTOMER_KEY, {});
  ['name', 'phone', 'address'].forEach(function(k){
    if(saved[k]) $('#c_' + k).value = saved[k];
  });

  function setInvalid(id, bad){ $('#' + id).classList.toggle('invalid', bad); return !bad; }
  function normalisePhone(v){ return v.replace(/[\s-]/g, '').replace(/^\+92/, '0').replace(/^92(?=3)/, '0'); }

  function validate(){
    var ok = true;
    ok = setInvalid('fieldName', !$('#c_name').value.trim()) && ok;
    ok = setInvalid('fieldPhone', !/^03\d{9}$/.test(normalisePhone($('#c_phone').value))) && ok;
    if(orderType === 'Delivery') ok = setInvalid('fieldAddress', !$('#c_address').value.trim()) && ok;
    else setInvalid('fieldAddress', false);
    if(!ok){
      var first = $('.field.invalid input, .field.invalid textarea', drawer);
      if(first) first.focus();
    }
    return ok;
  }

  function orderNumber(){
    var d = new Date();
    var pad = function(n){ return String(n).padStart(2, '0'); };
    return 'KC-' + String(d.getFullYear()).slice(-2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + (Math.floor(Math.random() * 900) + 100);
  }

  function buildMessage(no){
    var d = new Date();
    var lines = [];
    lines.push('*New Order - Kono Crisp*');
    lines.push('Order #: *' + no + '*');
    lines.push('Date: ' + d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}) + ', ' + d.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}));
    lines.push('Order type: *' + orderType + '*');
    lines.push('');
    lines.push('*Items:*');
    cart.forEach(function(l, i){
      var f = itemById(l.base, l.item);
      lines.push((i + 1) + '. *' + f.name + '* x' + l.qty + ' - ' + money(unitPrice(l) * l.qty));
      lines.push('   Seasoning: ' + l.seasoning);
      lines.push('   Sauces: ' + l.sauces.join(', '));
      lines.push('   Price: ' + money(unitPrice(l)) + ' each');
    });
    lines.push('');
    lines.push('Subtotal: ' + money(subtotal()));
    lines.push('Delivery charges: ' + (orderType === 'Delivery' ? money(CONFIG.deliveryFee) : 'Rs. 0 (takeaway)'));
    lines.push('*Total: ' + money(total()) + '*');
    lines.push('');
    lines.push('*Customer details*');
    lines.push('Name: ' + $('#c_name').value.trim());
    lines.push('Phone: ' + normalisePhone($('#c_phone').value));
    if(orderType === 'Delivery') lines.push('Address: ' + $('#c_address').value.trim());
    var notes = $('#c_notes').value.trim();
    if(notes) lines.push('Notes: ' + notes);
    return lines.join('\n');
  }

  $('#placeOrder').addEventListener('click', function(){
    if(!cart.length){ toast('Your cart is empty'); return; }
    if(!validate()) return;

    write(CUSTOMER_KEY, {
      name: $('#c_name').value.trim(),
      phone: $('#c_phone').value.trim(),
      address: $('#c_address').value.trim()
    });

    var no = orderNumber();
    var orderSnapshot = captureOrder(no);
    var url = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(buildMessage(no));

    /* Hand off to WhatsApp via a real anchor click, not window.open(): many
       mobile browsers and embedded webviews block or outright disable
       window.open(), but a plain target="_blank" anchor click (the same
       technique downloadCanvas below already uses successfully for the
       invoice file) is the most broadly supported way to open a link from
       a tap. Do it first, tied directly to this click's user gesture. */
    var waLink = document.createElement('a');
    waLink.href = url;
    waLink.target = '_blank';
    waLink.rel = 'noopener';
    document.body.appendChild(waLink);
    waLink.click();
    document.body.removeChild(waLink);

    var invoiceUrl = null;
    try {
      invoiceUrl = downloadCanvas(buildInvoiceCanvas(orderSnapshot), 'KonoCrisp-Invoice-' + no + '.png');
    } catch(e){ /* invoice image is a bonus, never block the order */ }

    $('#doneNo').textContent = no;
    $('#doneTotal').textContent = money(total());
    $('#doneResend').href = url;
    $('#doneResendLabel').textContent = 'Open WhatsApp again';
    if(invoiceUrl){
      $('#doneInvoice').href = invoiceUrl;
      $('#doneInvoice').download = 'KonoCrisp-Invoice-' + no + '.png';
      $('#doneInvoice').hidden = false;
    }
    $('#c_notes').value = '';
    cart = [];
    saveCart();
    showView('done');

    $('#doneMsg').textContent = 'WhatsApp has opened with your order, and a copy of your invoice has downloaded to your device. Just press send and we’ll confirm it shortly. If it didn’t open, use the button below.';
  });

  [['c_name','fieldName'],['c_phone','fieldPhone'],['c_address','fieldAddress']].forEach(function(p){
    $('#' + p[0]).addEventListener('input', function(){ $('#' + p[1]).classList.remove('invalid'); });
  });

  if(builder) renderBuilder();
  renderCart();
})();
