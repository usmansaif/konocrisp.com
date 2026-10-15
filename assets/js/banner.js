/* Hero banner slider.
   Edit BANNER_SLIDES to change the content; each slide needs an image, heading, text and a CTA. */
(function(){
  "use strict";

  var BANNER_SLIDES = [
    {
      image: 'https://images.unsplash.com/photo-1688978181542-87a886a16fbe?w=1800&q=80&auto=format&fit=crop',
      alt: 'A generous pile of freshly fried, golden crispy fries',
      badge: 'Lahore<br>since 2023',
      heading: 'The crispiest<br>fries in Lahore',
      text: 'Fried fresh to order and shaken in bold seasonings.',
      cta: {label: 'Order now', href: 'order.html'}
    },
    {
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1800&q=80&auto=format&fit=crop',
      alt: 'Golden fried samosas served with chutney and green chilli',
      badge: 'From<br>Rs. 80',
      heading: 'Golden samosas,<br>five flavours',
      text: 'Malai boti, BBQ, pizza and more, crisp outside and generous inside.',
      cta: {label: 'See the menu', href: 'menu.html'}
    },
    {
      image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=1800&q=80&auto=format&fit=crop',
      alt: 'A wooden tray piled high with golden fries',
      badge: '11<br>sauces',
      heading: 'Dip into<br>something bold',
      text: 'Eleven sauces and two dry seasonings, always free with your box.',
      cta: {label: 'Explore sauces', href: 'menu.html#sauces'}
    },
    {
      image: 'https://images.unsplash.com/photo-1583067837451-c3491dce56b6?w=1800&q=80&auto=format&fit=crop',
      alt: 'A basket piled with crispy golden samosas',
      badge: 'Open<br>daily',
      heading: 'Find us on<br>Model Town Link Road',
      text: 'Takeaway and delivery, every day from 12 PM to 12 AM.',
      cta: {label: 'Get directions', href: 'visit.html'}
    }
  ];
  var AUTOPLAY_MS = 5000;
  var SWIPE_PX = 40;

  var root = document.getElementById('heroBanner');
  if(!root || !BANNER_SLIDES.length) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M%PATH%" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ----- Build markup ----- */
  var viewport = el('div', 'banner-viewport');
  var slideEls = BANNER_SLIDES.map(function(s, i){
    var slide = el('div', 'banner-slide');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', (i + 1) + ' of ' + BANNER_SLIDES.length);
    slide.innerHTML =
      '<img class="banner-img" src="' + s.image + '" alt="' + s.alt + '"' +
        (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">' +
      '<div class="container banner-content">' +
        '<div class="banner-badge" aria-hidden="true"><span>' + s.badge + '</span></div>' +
        '<h2 class="banner-title">' + s.heading + '</h2>' +
        '<p class="banner-text">' + s.text + '</p>' +
        '<a class="btn btn-white" href="' + s.cta.href + '">' + s.cta.label + '</a>' +
      '</div>';
    viewport.appendChild(slide);
    return slide;
  });

  var prev = arrow('prev', 'Previous slide', 'M14.5 5.5L8 12l6.5 6.5');
  var next = arrow('next', 'Next slide', 'M9.5 5.5L16 12l-6.5 6.5');
  var dotsWrap = el('div', 'banner-dots');
  var dots = BANNER_SLIDES.map(function(_, i){
    var d = el('button', 'banner-dot');
    d.type = 'button';
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.addEventListener('click', function(){ goTo(i, true); });
    dotsWrap.appendChild(d);
    return d;
  });
  var foot = el('div', 'container banner-foot');
  foot.innerHTML = '<span>Fry Day, Every Day</span><span>Open daily, 12 PM &ndash; 12 AM</span>';

  root.appendChild(viewport);
  root.appendChild(prev);
  root.appendChild(next);
  foot.insertBefore(dotsWrap, foot.children[1]);
  root.appendChild(foot);
  root.appendChild(el('div', 'banner-edge'));

  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Featured at Kono Crisp');
  root.tabIndex = 0;

  /* ----- State ----- */
  var current = 0;
  var timer = null;
  var hovering = false, focusing = false;

  function el(tag, cls){ var n = document.createElement(tag); n.className = cls; return n; }
  function arrow(dir, label, path){
    var b = el('button', 'banner-arrow banner-arrow--' + dir);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.innerHTML = ARROW.replace('%PATH%', path.replace(/^M/, ''));
    b.addEventListener('click', function(){ goTo(dir === 'next' ? current + 1 : current - 1, true); });
    return b;
  }

  function goTo(i, user){
    current = (i + slideEls.length) % slideEls.length;
    slideEls.forEach(function(s, n){
      var on = n === current;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    dots.forEach(function(d, n){
      d.classList.toggle('is-active', n === current);
      if(n === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    if(user) restart();
  }

  /* ----- Autoplay ----- */
  function canPlay(){
    return !motionQuery.matches && !hovering && !focusing && !document.hidden && slideEls.length > 1;
  }
  function stop(){ clearTimeout(timer); timer = null; }
  function restart(){
    stop();
    root.setAttribute('aria-live', canPlay() ? 'off' : 'polite');
    if(canPlay()) timer = setTimeout(function(){ goTo(current + 1); restart(); }, AUTOPLAY_MS);
  }

  var on = {
    enter: function(){ hovering = true; restart(); },
    leave: function(){ hovering = false; restart(); },
    focusin: function(){ focusing = true; restart(); },
    focusout: function(e){ if(!root.contains(e.relatedTarget)){ focusing = false; restart(); } },
    visibility: function(){ restart(); },
    motion: function(){ root.classList.toggle('is-static', motionQuery.matches); restart(); },
    key: function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); goTo(current - 1, true); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); goTo(current + 1, true); }
    }
  };

  /* ----- Swipe ----- */
  var startX = 0, startY = 0, tracking = false;
  function touchStart(e){
    if(e.touches.length !== 1) return;
    tracking = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }
  function touchEnd(e){
    if(!tracking) return;
    tracking = false;
    var t = e.changedTouches[0], dx = t.clientX - startX, dy = t.clientY - startY;
    if(Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) goTo(current + (dx < 0 ? 1 : -1), true);
  }

  root.addEventListener('mouseenter', on.enter);
  root.addEventListener('mouseleave', on.leave);
  root.addEventListener('focusin', on.focusin);
  root.addEventListener('focusout', on.focusout);
  root.addEventListener('keydown', on.key);
  root.addEventListener('touchstart', touchStart, {passive:true});
  root.addEventListener('touchend', touchEnd, {passive:true});
  document.addEventListener('visibilitychange', on.visibility);
  if(motionQuery.addEventListener) motionQuery.addEventListener('change', on.motion);
  else if(motionQuery.addListener) motionQuery.addListener(on.motion);

  /* Remove every timer and listener, e.g. if the banner is ever unmounted */
  function destroy(){
    stop();
    root.removeEventListener('mouseenter', on.enter);
    root.removeEventListener('mouseleave', on.leave);
    root.removeEventListener('focusin', on.focusin);
    root.removeEventListener('focusout', on.focusout);
    root.removeEventListener('keydown', on.key);
    root.removeEventListener('touchstart', touchStart);
    root.removeEventListener('touchend', touchEnd);
    document.removeEventListener('visibilitychange', on.visibility);
    if(motionQuery.removeEventListener) motionQuery.removeEventListener('change', on.motion);
    else if(motionQuery.removeListener) motionQuery.removeListener(on.motion);
    window.removeEventListener('pagehide', destroy);
  }
  window.addEventListener('pagehide', destroy);

  on.motion();
  goTo(0);
})();
