/* Hero banner slider.
   BANNER_SLIDES defines all slides in order.
   Each slide can be either a VIDEO slide or an IMAGE slide:
     - For video: { type: 'video', video: 'path/to/video.mp4', poster: 'path/to/poster.jpg', badge, heading, text, cta }
     - For image: { type: 'image', image: 'path/to/photo.jpg', alt: '...', badge, heading, text, cta }
   You can add as many video or image slides as you like.
*/
(function(){
  "use strict";

  /* ── Slides configuration ── */
  var BANNER_SLIDES = [
    /* Slide 1: Hero Video */
    {
      type:    'video',
      video:   'assets/images/advertisement/frozen/mixed-products/videos/Frozen_samosas_floating_in_studio_20261024201822.mp4',
      poster:  'https://images.unsplash.com/photo-1688978181542-87a886a16fbe?w=1800&q=80&auto=format&fit=crop',
      badge:   'Kono<br>Crisp',
      heading: 'Fry Day,<br>Every Day',
      text:    'Freshly fried and served hot at Model Town, Lahore.',
      cta:     {label: 'Order now', href: 'order.html'}
    },

    /* Slide 2: Video - Frozen Samosas */
    {
      type:    'video',
      video:   'assets/images/advertisement/frozen/mixed-products/videos/541454093_1792680718811898.mp4',
      poster:  'assets/photos/samosa-tray-1536.avif',
      badge:   'New<br>Frozen',
      heading: 'Samosas<br> at Home',
      text:    'Stock your freezer with handcrafted 12-piece packs, ready to fry in minutes.',
      cta:     {label: 'Order frozen', href: 'frozen.html'}
    },

    /* Slide 3: Video - Crispy Fries */
    {
      type:    'video',
      video:   'assets/images/advertisement/frozen/mixed-products/videos/Commercial_for_KONO_CRISP_frozen…_20261024202759.mp4',
      poster:  'assets/photos/hero-fries-1536.avif',
      badge:   'Double<br>Crunch',
      heading: 'The Crispiest<br>Fries in Lahore',
      text:    'Double-fried fresh to order and paired with signature dips.',
      cta:     {label: 'See the menu', href: 'menu.html'}
    },

    /* Slide 4: Video - Mixed Specials & Dips */
    {
      type:    'video',
      video:   'assets/images/advertisement/frozen/mixed-products/videos/KONO_CRISP_frozen_samosas_floating_20261024201707.mp4',
      poster:  'assets/photos/dips-tray-1536.avif',
      badge:   '11<br>Sauces',
      heading: 'Dip Into<br>Something Bold',
      text:    'Six signature sauces, always complimentary with your box.',
      cta:     {label: 'Explore sauces', href: 'menu.html#sauces'}
    },

    /* Slide 5: Image - Visit & Takeaway */
    {
      type:    'image',
      image:   'https://images.unsplash.com/photo-1583067837451-c3491dce56b6?w=1800&q=80&auto=format&fit=crop',
      alt:     'Crispy golden samosas served fresh',
      badge:   'Open<br>daily',
      heading: 'Find Us on<br>Model Town Link Road',
      text:    'Takeaway and delivery, every day from 12 PM to 12 AM.',
      cta:     {label: 'Get directions', href: 'visit.html'}
    }
  ];

  var AUTOPLAY_MS = 6000;
  var SWIPE_PX = 40;

  var root = document.getElementById('heroBanner');
  if(!root || !BANNER_SLIDES.length) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M%PATH%" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ----- Build markup ----- */
  var viewport = el('div', 'banner-viewport');
  var slideEls  = [];
  var totalSlides = BANNER_SLIDES.length;

  BANNER_SLIDES.forEach(function(s, i){
    var isVideo = (s.type === 'video') || Boolean(s.video || s.videoSrc);
    var slide = el('div', 'banner-slide' + (isVideo ? ' banner-slide--video' : ''));
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', (i + 1) + ' of ' + totalSlides);

    if (isVideo) {
      var vid = document.createElement('video');
      vid.className   = 'banner-video';
      vid.src         = s.video || s.videoSrc;
      if (s.poster || s.image) vid.poster = s.poster || s.image;
      vid.muted       = true;
      vid.loop        = true;
      vid.playsInline = true;
      vid.preload     = (i < 2 ? 'auto' : 'metadata');
      vid.setAttribute('aria-hidden', 'true');
      slide.appendChild(vid);
    } else {
      var img = document.createElement('img');
      img.className = 'banner-img';
      img.src = s.image;
      img.alt = s.alt || '';
      if (i === 0) img.setAttribute('fetchpriority', 'high');
      else img.loading = 'lazy';
      img.decoding = 'async';
      slide.appendChild(img);
    }

    var content = document.createElement('div');
    content.className = 'container banner-content';
    var contentHtml = '';
    if (s.badge) {
      contentHtml += '<div class="banner-badge" aria-hidden="true"><span>' + s.badge + '</span></div>';
    }
    if (s.heading) {
      contentHtml += '<h2 class="banner-title">' + s.heading + '</h2>';
    }
    if (s.text) {
      contentHtml += '<p class="banner-text">' + s.text + '</p>';
    }
    if (s.cta && s.cta.href) {
      contentHtml += '<a class="btn btn-white" href="' + s.cta.href + '">' + s.cta.label + '</a>';
    }
    content.innerHTML = contentHtml;
    slide.appendChild(content);

    viewport.appendChild(slide);
    slideEls.push(slide);
  });

  var prev = arrow('prev', 'Previous slide', 'M14.5 5.5L8 12l6.5 6.5');
  var next = arrow('next', 'Next slide', 'M9.5 5.5L16 12l-6.5 6.5');
  var dotsWrap = el('div', 'banner-dots');
  var dots = slideEls.map(function(_, i){
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

      /* Manage video playback for this slide */
      var vid = s.querySelector('video.banner-video');
      if (vid) {
        if (on && !motionQuery.matches) {
          try { vid.currentTime = 0; } catch(_) {}
          vid.play().catch(function(){});
        } else {
          vid.pause();
        }
      }
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
    var slideDuration = (BANNER_SLIDES[current] && BANNER_SLIDES[current].duration) || AUTOPLAY_MS;
    if(canPlay()) timer = setTimeout(function(){ goTo(current + 1); restart(); }, slideDuration);
  }

  var on = {
    enter: function(){ hovering = true; restart(); },
    leave: function(){ hovering = false; restart(); },
    focusin: function(){ focusing = true; restart(); },
    focusout: function(e){ if(!root.contains(e.relatedTarget)){ focusing = false; restart(); } },
    visibility: function(){
      if (document.hidden) {
        slideEls.forEach(function(s){
          var v = s.querySelector('video.banner-video');
          if (v) v.pause();
        });
      } else if (!motionQuery.matches) {
        var activeVid = slideEls[current] ? slideEls[current].querySelector('video.banner-video') : null;
        if (activeVid) activeVid.play().catch(function(){});
      }
      restart();
    },
    motion: function(){
      root.classList.toggle('is-static', motionQuery.matches);
      if (motionQuery.matches) {
        slideEls.forEach(function(s){
          var v = s.querySelector('video.banner-video');
          if (v) v.pause();
        });
      } else {
        var activeVid = slideEls[current] ? slideEls[current].querySelector('video.banner-video') : null;
        if (activeVid) activeVid.play().catch(function(){});
      }
      restart();
    },
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

  /* Clean up listeners if unmounted */
  function destroy(){
    stop();
    slideEls.forEach(function(s){
      var v = s.querySelector('video.banner-video');
      if (v) v.pause();
    });
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
