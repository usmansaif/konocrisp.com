(function(){
  "use strict";
  var navbar = document.getElementById('navbar');
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuLabel = hamburger.querySelector('.menu-btn-text');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header turns solid once the page scrolls */
  function onScroll(){
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  /* Full-screen menu */
  function setMenu(open){
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if(menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  hamburger.addEventListener('click', function(){
    setMenu(!mobileMenu.classList.contains('open'));
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ setMenu(false); });
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') setMenu(false);
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

  /* Home: fries / samosas toggle in the menu preview */
  var builder = document.getElementById('menuBuilder');
  if(builder){
    var toggles = builder.querySelectorAll('.base-toggle-btn');
    var lists = builder.querySelectorAll('.menu-list');
    var figures = builder.querySelectorAll('.menu-figure img');
    toggles.forEach(function(btn, i){
      btn.addEventListener('click', function(){
        toggles.forEach(function(b, j){
          b.classList.toggle('is-active', i === j);
          b.setAttribute('aria-pressed', i === j ? 'true' : 'false');
        });
        lists.forEach(function(l, j){ l.hidden = i !== j; });
        figures.forEach(function(f, j){ f.classList.toggle('is-active', i === j); });
      });
    });
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
