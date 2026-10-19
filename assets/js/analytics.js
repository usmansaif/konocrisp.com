/* Track taps on any WhatsApp link (contact buttons, footer, floating button). */
document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
  if(a && window.gtag) gtag('event', 'whatsapp_click', { link_url: a.href, page_path: location.pathname });
});
