(function(){
  "use strict";
  var navbar = document.getElementById('navbar');
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navbar shadow on scroll */
  function onScroll(){
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  /* Mobile menu toggle */
  function closeMenu(){
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  }
  function openMenu(){
    mobileMenu.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
  }
  hamburger.addEventListener('click', function(){
    if(mobileMenu.classList.contains('open')) closeMenu(); else openMenu();
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeMenu();
  });

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !reducedMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  /* Seasoning picker: vertical track that fills up to the chosen seasoning */
  var picker = document.getElementById('picker');
  if(picker){
    var buttons = picker.querySelectorAll('.picker-list button');
    var fill = picker.querySelector('.track-fill');
    var knob = picker.querySelector('.track-knob');
    var bowl = picker.querySelector('.picker-visual .bowl');
    var desc = picker.querySelector('.picker-visual p');
    var track = picker.querySelector('.track');

    function select(btn){
      buttons.forEach(function(b){
        b.classList.remove('active');
        b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      /* Items are listed top-to-bottom; the fill grows from the bottom up to the centre of the chosen item */
      var trackBox = track.getBoundingClientRect();
      var btnBox = btn.getBoundingClientRect();
      var centre = btnBox.top + btnBox.height / 2 - trackBox.top;
      var pct = Math.max(0, Math.min(100, 100 - (centre / trackBox.height) * 100));
      fill.style.height = pct + '%';
      knob.style.bottom = pct + '%';
      bowl.style.setProperty('--sauce', btn.dataset.color);
      desc.textContent = btn.dataset.desc;
    }
    buttons.forEach(function(b){
      b.addEventListener('click', function(){ select(b); });
    });
    var initial = picker.querySelector('.picker-list button.active') || buttons[0];
    select(initial);
    window.addEventListener('resize', function(){
      select(picker.querySelector('.picker-list button.active'));
    });
  }

  /* Hero banner slider */
  var slider = document.getElementById('heroSlider');
  if(slider){
    var slides = slider.querySelectorAll('.hero-slide');
    var dotsWrap = document.getElementById('heroDots');
    var current = 0;
    var timer = null;
    var DELAY = 5000;

    slides.forEach(function(slide, i){
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Show slide ' + (i + 1));
      if(i === 0){ dot.classList.add('is-active'); dot.setAttribute('aria-selected', 'true'); }
      else dot.setAttribute('aria-selected', 'false');
      dot.addEventListener('click', function(){ goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('button');

    function goTo(i){
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
      current = i;
      slides[current].classList.add('is-active');
      dots[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected', 'true');
    }
    function next(){ goTo((current + 1) % slides.length); }
    function restart(){
      if(reducedMotion || slides.length < 2) return;
      clearInterval(timer);
      timer = setInterval(next, DELAY);
    }
    if(slides.length > 1) restart();
  }

  /* Menu page: highlight the category tab for the section in view */
  var tabs = document.querySelectorAll('.menu-tab');
  if(tabs.length && 'IntersectionObserver' in window){
    var byId = {};
    tabs.forEach(function(t){ byId[t.getAttribute('href').slice(1)] = t; });
    var tabIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        tabs.forEach(function(t){ t.classList.remove('active'); });
        byId[entry.target.id].classList.add('active');
      });
    }, {rootMargin:'-35% 0px -60% 0px'});
    Object.keys(byId).forEach(function(id){
      var el = document.getElementById(id);
      if(el) tabIo.observe(el);
    });
  }
})();
