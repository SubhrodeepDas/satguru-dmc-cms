'use strict';
(function () {

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function descToHtml(text) {
    if (!text) return '';
    return text.replace(/\r\n/g, '\n').split('\n').filter(function (l) {
      return l.trim();
    }).map(function (l) {
      return '<p>' + esc(l) + '</p>';
    }).join('');
  }

  function renderPage(itin) {
    // ── Hero ──────────────────────────────────────────────────
    var imgSrc = satguruCMS.imgUrl(itin.image) || itin.imageUrl || '';
    if (imgSrc) {
      var heroBg = document.getElementById('heroBg');
      if (heroBg) heroBg.style.backgroundImage = "url('" + imgSrc + "')";
    }

    var heroEl = document.getElementById('destHero');
    var heroLabel = itin.heroTitle || itin.title || '';
    if (heroEl && heroLabel) heroEl.setAttribute('data-section-name', heroLabel.toUpperCase());

    var badgeEl = document.getElementById('heroBadgeText');
    if (badgeEl && itin.heroBadge) badgeEl.textContent = itin.heroBadge;

    var titleEl = document.getElementById('heroTitle');
    if (titleEl) titleEl.textContent = heroLabel;

    if (itin.title) document.title = itin.title + ' — Satguru DMC Russia';

    // ── Build sidebar + content ───────────────────────────────
    var nav     = document.getElementById('sidebarNav');
    var content = document.getElementById('itineraryContent');
    if (!nav || !content) return;

    var days   = (itin.itinerary || []).slice().sort(function (a, b) { return a.day - b.day; });
    var spyIds = [];
    var sideHTML = '';
    var mainHTML = '';

    // Day items
    days.forEach(function (day, i) {
      var id = 'day' + day.day;
      spyIds.push(id);

      if (i > 0) sideHTML += '<div class="sidebar-divider"></div>';
      sideHTML +=
        '<a class="sidebar-day-item' + (i === 0 ? ' active' : '') + '" href="#' + id + '" data-target="' + id + '">' +
          '<div class="sidebar-day-num">' + day.day + '</div>' +
          '<div class="sidebar-day-text">' +
            '<span class="sidebar-day-label">Day ' + day.day + '</span>' +
            '<span class="sidebar-day-city">' + esc(day.title) + '</span>' +
          '</div>' +
        '</a>';

      var descHTML = descToHtml(day.description);
      var hlHTML   = (day.highlights || []).map(function (h) {
        return '<div class="dest-highlight-card"><p>' +
          (h.icon     ? '<i class="' + esc(h.icon) + '"></i>' : '') +
          (h.boldText ? '<strong>' + esc(h.boldText) + '</strong> ' : '') +
          (h.text     ? esc(h.text) : '') +
          '</p></div>';
      }).join('');

      mainHTML +=
        '<div class="dest-day-block" id="' + id + '">' +
          '<span class="dest-day-tag">Day ' + day.day + '</span>' +
          '<h2 class="dest-day-heading">' + esc(day.title) + '</h2>' +
          '<hr class="dest-day-rule">' +
          '<div class="dest-day-content">' + descHTML + hlHTML + '</div>' +
        '</div>';
    });

    // Gallery sidebar item
    spyIds.push('gallery');
    sideHTML +=
      '<div class="sidebar-divider"></div>' +
      '<a class="sidebar-day-item" href="#gallery" data-target="gallery">' +
        '<div class="sidebar-day-num icon-num"><i class="ri-image-line" style="font-size:14px;"></i></div>' +
        '<div class="sidebar-day-text">' +
          '<span class="sidebar-day-label">Gallery</span>' +
          '<span class="sidebar-day-city">Photos</span>' +
        '</div>' +
      '</a>';

    // Gallery content
    var gallery    = itin.gallery || [];
    var slidesHTML = gallery.map(function (g) {
      var src = satguruCMS.imgUrl(g.image) || g.imageUrl || '';
      return '<div class="swiper-slide"><img src="' + esc(src) + '" alt="' + esc(g.alt || '') + '" loading="lazy"></div>';
    }).join('');

    mainHTML +=
      '<div class="dest-gallery-section" id="gallery">' +
        '<h3 class="dest-section-heading">Photo Gallery</h3>' +
        '<div class="swiper dest-gallery-swiper">' +
          '<div class="swiper-wrapper">' + slidesHTML + '</div>' +
          '<div class="swiper-button-next"></div>' +
          '<div class="swiper-button-prev"></div>' +
          '<div class="swiper-pagination"></div>' +
        '</div>' +
      '</div>';

    // Pricing sidebar item
    spyIds.push('pricing');
    sideHTML +=
      '<div class="sidebar-divider"></div>' +
      '<a class="sidebar-day-item" href="#pricing" data-target="pricing">' +
        '<div class="sidebar-day-num icon-num-green"><i class="ri-price-tag-3-line" style="font-size:13px;"></i></div>' +
        '<div class="sidebar-day-text">' +
          '<span class="sidebar-day-label">Pricing</span>' +
          '<span class="sidebar-day-city">Accommodation</span>' +
        '</div>' +
      '</a>';

    // Pricing content
    var pricingRows = '';
    if (itin.priceDouble) pricingRows += '<tr><td>Double Room</td><td>' + esc(itin.priceDouble) + '</td></tr>';
    if (itin.priceSingle) pricingRows += '<tr><td>Single Supplementary</td><td>' + esc(itin.priceSingle) + '</td></tr>';

    mainHTML +=
      '<div class="dest-pricing-section" id="pricing">' +
        '<h3 class="dest-section-heading">Accommodation &amp; Pricing</h3>' +
        '<div class="dest-table-wrap">' +
          '<table class="dest-table">' +
            '<thead><tr><th>Type of Accommodation</th><th>Per Pax (USD)</th></tr></thead>' +
            '<tbody>' + pricingRows + '</tbody>' +
          '</table>' +
        '</div>' +
        (itin.hotelNotes ? '<p class="dest-hotel-notes">' + esc(itin.hotelNotes) + '</p>' : '') +
      '</div>';

    // Inclusions sidebar item
    spyIds.push('inclusions');
    sideHTML +=
      '<div class="sidebar-divider"></div>' +
      '<a class="sidebar-day-item" href="#inclusions" data-target="inclusions">' +
        '<div class="sidebar-day-num icon-num-green"><i class="ri-checkbox-circle-line" style="font-size:15px;"></i></div>' +
        '<div class="sidebar-day-text">' +
          '<span class="sidebar-day-label">Package</span>' +
          '<span class="sidebar-day-city">Inclusions</span>' +
        '</div>' +
      '</a>';

    // Inclusions content
    var inclHTML = (itin.inclusions || []).map(function (inc) {
      return '<li><span class="incl-dot"></span>' + esc(inc.text) + '</li>';
    }).join('');

    mainHTML +=
      '<div class="dest-inclusions-section" id="inclusions">' +
        '<h3 class="dest-section-heading">What\'s Included</h3>' +
        '<div class="dest-inclusions-card"><ul class="inclusions-list">' + inclHTML + '</ul></div>' +
      '</div>';

    // ── Inject ────────────────────────────────────────────────
    nav.innerHTML     = sideHTML;
    content.innerHTML = mainHTML;

    // Init gallery swiper
    if (gallery.length && typeof Swiper !== 'undefined') {
      new Swiper('.dest-gallery-swiper', {
        loop: true,
        spaceBetween: 0,
        slidesPerView: 1,
        navigation: {
          nextEl: '.dest-gallery-swiper .swiper-button-next',
          prevEl: '.dest-gallery-swiper .swiper-button-prev'
        },
        pagination: { el: '.dest-gallery-swiper .swiper-pagination', clickable: true },
        autoplay: { delay: 4500, disableOnInteraction: false }
      });
    }

    // Smooth scroll + immediate active on sidebar click
    nav.querySelectorAll('.sidebar-day-item').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        // Move active instantly — don't wait for scroll event
        nav.querySelectorAll('.sidebar-day-item').forEach(function (l) {
          l.classList.remove('active');
        });
        this.classList.add('active');
        // Then smooth-scroll to the section
        var el = document.getElementById(this.getAttribute('data-target'));
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
      });
    });

    // Scroll spy — keeps active in sync while user scrolls manually
    function updateActive() {
      var y = window.pageYOffset, cur = spyIds[0];
      spyIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.pageYOffset - 110 <= y) cur = id;
      });
      nav.querySelectorAll('.sidebar-day-item').forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('data-target') === cur);
      });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  // ── Bootstrap: derive slug from URL and fetch ─────────────
  var slug = (window.location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (!slug || typeof satguruCMS === 'undefined') return;

  satguruCMS.getItinerary(slug).then(function (data) {
    if (!data || !data.docs || !data.docs.length) {
      var content = document.getElementById('itineraryContent');
      if (content) content.innerHTML =
        '<div class="text-center py-5"><p style="color:#888;">Itinerary content not found in CMS for slug: <strong>' + esc(slug) + '</strong></p></div>';
      return;
    }
    renderPage(data.docs[0]);
  });

})();
