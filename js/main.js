/* =========================================================
   METALURGIA ANDINA S.A.C. — main.js
   Navegación, pestañas de Organización, revelado al scroll
   y efecto parallax (GSAP + ScrollTrigger)
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- compartir: Gmail / Facebook / Twitter ---------- */
  var pageUrl = window.location.href;
  var pageTitle = document.title || 'Metalurgia Andina S.A.C.';

  document.querySelectorAll('.js-share-mail').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var subject = encodeURIComponent(pageTitle);
      var body = encodeURIComponent('Te comparto esta página de Metalurgia Andina S.A.C.: ' + pageUrl);
      var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=' + subject + '&body=' + body;
      window.open(gmailUrl, '_blank', 'noopener');
    });
  });

  document.querySelectorAll('.js-share-fb').forEach(function (a) {
    var u = encodeURIComponent(pageUrl);
    a.setAttribute('href', 'https://www.facebook.com/sharer/sharer.php?u=' + u);
  });

  document.querySelectorAll('.js-share-tw').forEach(function (a) {
    var u = encodeURIComponent(pageUrl);
    var t = encodeURIComponent(pageTitle);
    a.setAttribute('href', 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t);
  });

  /* ---------- comentarios (guardados en este navegador) ---------- */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    var d = new Date(iso);
    var opts = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString('es-PE', opts);
  }

  var commentForm = document.getElementById('comment-form');
  var commentList = document.getElementById('comment-list');
  var commentEmpty = document.getElementById('comment-empty');

  if (commentForm && commentList) {
    var pageKey = commentForm.getAttribute('data-page') || 'pagina';
    var storageKey = 'ma_comments_' + pageKey;

    function loadComments() {
      try {
        return JSON.parse(window.localStorage.getItem(storageKey)) || [];
      } catch (err) {
        return [];
      }
    }

    function saveComments(list) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(list));
      } catch (err) { /* almacenamiento no disponible */ }
    }

    function renderComments() {
      var comments = loadComments();
      commentList.querySelectorAll('li:not(#comment-empty)').forEach(function (li) { li.remove(); });

      if (comments.length === 0) {
        if (commentEmpty) commentEmpty.style.display = 'block';
        return;
      }
      if (commentEmpty) commentEmpty.style.display = 'none';

      comments.slice().reverse().forEach(function (c) {
        var li = document.createElement('li');
        li.innerHTML =
          '<div class="c-head"><span class="c-name">' + escapeHtml(c.nombre) +
          '</span><span class="c-date">' + formatDate(c.fecha) + '</span></div>' +
          '<p class="c-text">' + escapeHtml(c.texto) + '</p>';
        commentList.appendChild(li);
      });
    }

    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = commentForm.nombre.value.trim();
      var texto = commentForm.texto.value.trim();
      if (!nombre || !texto) return;

      var comments = loadComments();
      comments.push({ nombre: nombre, texto: texto, fecha: new Date().toISOString() });
      saveComments(comments);
      renderComments();
      commentForm.reset();
    });

    renderComments();
  }

  /* ---------- carrusel de fotografías + lightbox ---------- */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
    var dotsWrap = carousel.querySelector('.carousel-dots');
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll('button')) : [];
    var titleEl = carousel.parentElement.querySelector('.carousel-caption h4');
    var phraseEl = carousel.parentElement.querySelector('.carousel-caption p');
    var current = 0;
    var timer = null;
    var autoplayMs = parseInt(carousel.getAttribute('data-autoplay'), 10) || 3000;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === current); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
      if (titleEl) titleEl.textContent = slides[current].getAttribute('data-title') || '';
      if (phraseEl) phraseEl.textContent = slides[current].getAttribute('data-phrase') || '';
    }

    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(next, autoplayMs);
    }
    function stopAutoplay() { if (timer) clearInterval(timer); }

    var nextBtn = carousel.querySelector('.carousel-arrow.next');
    var prevBtn = carousel.querySelector('.carousel-arrow.prev');
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); startAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); startAutoplay(); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function (e) { e.stopPropagation(); show(i); startAutoplay(); });
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    var viewport = carousel.querySelector('.carousel-viewport');
    if (viewport) {
      viewport.addEventListener('click', function () {
        openLightbox(slides, current);
        stopAutoplay();
      });
    }

    show(0);
    startAutoplay();
  });

  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('.lightbox-img-wrap img');
    var lbTitle = lightbox.querySelector('.lightbox-cap h4');
    var lbPhrase = lightbox.querySelector('.lightbox-cap p');
    var lbClose = lightbox.querySelector('.lightbox-close');
    var lbPrev = lightbox.querySelector('.lightbox-arrow.prev');
    var lbNext = lightbox.querySelector('.lightbox-arrow.next');
    var lbCollage = lightbox.querySelector('.lightbox-collage');
    var lbSlides = [];
    var lbIndex = 0;

    window.openLightbox = function (slides, startIndex) {
      lbSlides = slides;
      lbIndex = startIndex;
      if (lbCollage) {
        lbCollage.innerHTML = slides.map(function (s) {
          var img = s.querySelector('img');
          return '<img src="' + img.getAttribute('src') + '" alt="">';
        }).join('');
      }
      renderLightbox();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    function renderLightbox() {
      var slide = lbSlides[lbIndex];
      var img = slide.querySelector('img');
      lbImg.setAttribute('src', img.getAttribute('src'));
      lbImg.setAttribute('alt', img.getAttribute('alt') || '');
      lbTitle.textContent = slide.getAttribute('data-title') || '';
      lbPhrase.textContent = slide.getAttribute('data-phrase') || '';
      // reinicia la animación de zoom (mismo <img>, hay que forzar el reflow)
      lbImg.classList.remove('kenburns');
      void lbImg.offsetWidth;
      lbImg.classList.add('kenburns');
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    function lbNextFn() { lbIndex = (lbIndex + 1) % lbSlides.length; renderLightbox(); }
    function lbPrevFn() { lbIndex = (lbIndex - 1 + lbSlides.length) % lbSlides.length; renderLightbox(); }

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbNext) lbNext.addEventListener('click', lbNextFn);
    if (lbPrev) lbPrev.addEventListener('click', lbPrevFn);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') lbNextFn();
      if (e.key === 'ArrowLeft') lbPrevFn();
    });
  }

  /* ---------- menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }

  /* ---------- pestañas de Nuestra Organización ---------- */
  var tabBtns = document.querySelectorAll('.org-tab-btn');
  var panels = document.querySelectorAll('.org-panel');
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');

        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });

        btn.classList.add('active');
        var panel = document.getElementById(target);
        if (panel) {
          panel.classList.add('active');
          if (window.location.hash !== '#' + target) {
            history.replaceState(null, '', '#' + target);
          }
        }
      });
    });

    var hash = window.location.hash.replace('#', '');
    var initial = document.querySelector('.org-tab-btn[data-tab="' + hash + '"]');
    if (initial) initial.click();
  }

  /* ---------- revelado simple al hacer scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- GSAP · efecto parallax de desplazamiento ---------- */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.gsap && window.ScrollTrigger && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);

    var images = gsap.utils.toArray('.parallax-img-wrap svg');

    images.forEach(function (img) {
      // Escala 0.7 -> 1.2 y opacidad 0 -> 1 a lo largo de 600px de scroll
      gsap.fromTo(img,
        { scale: 0.7, opacity: 0 },
        {
          scale: 1.2,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: '+=600',
            scrub: true
          }
        }
      );
    });

    // Las imágenes se desplazan verticalmente un 20% más lento que el scroll (profundidad)
    var wraps = gsap.utils.toArray('.parallax-img-wrap');
    wraps.forEach(function (wrap) {
      var inner = wrap.querySelector('svg');
      gsap.to(inner, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  } else if (images_fallback_needed()) {
    document.querySelectorAll('.parallax-img-wrap svg').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'scale(1)';
    });
  }

  function images_fallback_needed() {
    return true;
  }
});
