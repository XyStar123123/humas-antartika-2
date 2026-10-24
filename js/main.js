(function ($) {
  'use strict';

  /* Preloader */
  $(window).on('load', function () {
    $('#preloader').addClass('hide');
    setTimeout(function () { $('#preloader').remove(); }, 600);
  });
  setTimeout(function () { $('#preloader').addClass('hide'); }, 4000); // safety net

  /* Scroll-reveal animations: WOW.js + animate.css (replaces Elementor "animated fadeInUp") */
  document.querySelectorAll('[data-wow]').forEach(function (el) {
    el.classList.add('wow', 'animate__' + el.getAttribute('data-wow'));
  });
  if (window.WOW) { new WOW({ animateClass: 'animate__animated', offset: 60, mobile: true }).init(); }

  /* GSAP: heading split-text + image reveal */
  if (window.gsap && window.ScrollTrigger && window.SplitText) {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    document.querySelectorAll('.split-style-3').forEach(function (el) {
      var split = SplitText.create(el, { type: 'lines,words,chars', linesClass: 'split-line' });
      gsap.set(split.chars, { opacity: 0, x: 50 });
      gsap.to(split.chars, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        x: 0, opacity: 1, duration: 1, ease: 'back.out', stagger: 0.02
      });
    });

    document.querySelectorAll('.reveal-img').forEach(function (box) {
      var img = box.querySelector('img');
      var tl = gsap.timeline({ scrollTrigger: { trigger: box, toggleActions: 'play none none none' } });
      tl.from(box, { xPercent: -100, duration: 1, ease: 'power2.out' })
        .from(img, { xPercent: 100, duration: 1, ease: 'power2.out' }, 0);
    });
  }

  /* Header: sticky on scroll */
  var $header = $('#siteHeader');
  var topbarH = $header.find('> div').first().outerHeight() || 0;
  $(window).on('scroll', function () {
    $header.toggleClass('stuck', $(this).scrollTop() > topbarH + 80);
  });

  /* Mobile menu */
  var $nav = $('#mainNav'), $toggle = $('#navToggle');
  function setNav(open) {
    $nav.toggleClass('open', open);
    $toggle.attr('aria-expanded', open);
  }
  $toggle.on('click', function () { setNav(!$nav.hasClass('open')); });
  $('#navClose').on('click', function () { setNav(false); });
  $nav.find('a[href^="#"]').not('[href="#"]').on('click', function () { setNav(false); });
  // sub-menus: tap to open on small screens
  $('.has-sub > a').on('click', function (e) {
    e.preventDefault();
    if (window.innerWidth < 1024) { $(this).parent().toggleClass('open'); }
  });

  /* Active link on scroll */
  var sections = ['content', 'profil', 'mou', 'mou-univ', 'alur', 'faq', 'pengurus', 'hubungi'];
  $(window).on('scroll', function () {
    var y = $(window).scrollTop() + 140, current = 'content';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) { current = id; }
    });
    $nav.find('.nav-link').removeClass('active');
    $nav.find('a[href="#' + current + '"].nav-link').addClass('active');
  });

  /* FAQ accordion (one open at a time) */
  $('.faq-q').on('click', function () {
    var $item = $(this).closest('.faq-item');
    var willOpen = !$item.hasClass('active');
    $('.faq-item').removeClass('active').find('.faq-q').attr('aria-expanded', 'false');
    $('.faq-item .faq-a').stop(true, true).slideUp(250);
    if (willOpen) {
      $item.addClass('active').find('.faq-q').attr('aria-expanded', 'true');
      $item.find('.faq-a').stop(true, true).slideDown(250);
    }
  });
  $('.faq-item.active .faq-a').show();

  /* Video popup: Magnific Popup */
  if ($.fn.magnificPopup) {
    $('.popup-youtube').magnificPopup({
      type: 'iframe', mainClass: 'mfp-fade', removalDelay: 160, preloader: false, fixedContentPos: false
    });
  }

  /* Magic cursor */
  var ball = document.getElementById('ball');
  if (ball && window.matchMedia('(hover:hover) and (pointer:fine)').matches && window.gsap) {
    var x = gsap.quickTo(ball, 'x', { duration: 0.35, ease: 'power3' });
    var y = gsap.quickTo(ball, 'y', { duration: 0.35, ease: 'power3' });
    $(document).on('mousemove', function (e) { x(e.clientX); y(e.clientY); });
    $('a, button').on('mouseenter', function () { gsap.to(ball, { scale: 1.6, opacity: 0.3, duration: 0.25 }); })
                  .on('mouseleave', function () { gsap.to(ball, { scale: 1, opacity: 0.5, duration: 0.25 }); });
  }
})(jQuery);

/* Hero: entrance timeline + synchronized progress timer & smooth image slider */
(function ($) {
  var card = document.querySelector('.hero-card');
  if (!card) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chips = $('#heroChips .hero-chip');
  var fills = $('#heroProgress i');
  var $heroPhoto = $('.hero-photo');

  // Array foto background untuk masing-masing chip (0: Magang/PKL, 1: MoU, 2: Hak Cipta)
  var heroImages = [
    'https://picsum.photos/seed/school1/1600/900', // Magang/PKL slide image
    'https://picsum.photos/seed/school2/1600/900', // MoU slide image
    'https://picsum.photos/seed/school3/1600/900'  // Hak Cipta slide image
  ];

  var idx = 0, tween;

  function setActive(n) {
    chips.removeClass('active').eq(n).addClass('active');
  }

  if (!window.gsap || reduce) { 
    setActive(0); 
    return; 
  }

  // 1. LANGSUNG pasang gambar pertama (Magang/PKL) saat baru di-load
  $heroPhoto.attr('src', heroImages[0]).css('opacity', 1);

  // 2. Entrance animation GSAP
  var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from(card, { opacity: 0, duration: 0.9 })
    .from('.hero-card .h-anim', { opacity: 0, y: 18, duration: 0.7, stagger: 0.18 }, 0.45);

  // 3. Fungsi ganti gambar secara halus (crossfade)
  function changeHeroImage(newIndex, onCompleteCallback) {
    gsap.to($heroPhoto, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: function() {
        $heroPhoto.attr('src', heroImages[newIndex]);
        gsap.to($heroPhoto, {
          opacity: 1,
          duration: 0.3,
          ease: 'power2.inOut',
          onComplete: onCompleteCallback
        });
      }
    });
  }

  // 4. Timer slide berulang yang tersinkronisasi
  function run() {
    setActive(idx);

    tween = gsap.fromTo(fills[idx], { scaleX: 0 }, {
      scaleX: 1, 
      duration: 5, 
      ease: 'none', 
      delay: idx === 0 ? 1.4 : 0,
      onComplete: function () {
        gsap.set(fills[idx], { scaleX: 0 });
        var nextIdx = (idx + 1) % fills.length;

        // Ganti gambar ketika progress bar segmen selesai
        changeHeroImage(nextIdx, function() {
          idx = nextIdx;
          run();
        });
      }
    });
  }
  run();

  // 5. Klik pada segmen progress bar bawah untuk lompat slide
  $('#heroProgress span').on('click', function() {
    var targetIdx = $(this).index();
    if (targetIdx === idx) return;

    if (tween) tween.kill();
    gsap.set(fills, { scaleX: 0 });
    for (var i = 0; i < targetIdx; i++) {
      gsap.set(fills[i], { scaleX: 1 });
    }

    changeHeroImage(targetIdx, function() {
      idx = targetIdx;
      run();
    });
  });

})(jQuery);