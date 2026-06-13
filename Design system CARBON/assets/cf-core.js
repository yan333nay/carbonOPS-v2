/**
 * Carbon Films — Core JS v1.0
 * Cursor, scroll reveal, grain, interações base
 * Vanilla JS, zero dependências
 */

(function () {
  'use strict';

  /* ===================================================
     CURSOR CUSTOMIZADO
     =================================================== */
  function initCursor() {
    const dot  = document.querySelector('.c-dot');
    const ring = document.querySelector('.c-ring');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let isHovering = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
    });

    // Expandir ring em elementos clicáveis
    document.querySelectorAll('a, button, [role="button"], input, textarea, select').forEach(el => {
      el.addEventListener('mouseenter', () => {
        isHovering = true;
        ring.style.width         = '48px';
        ring.style.height        = '48px';
        ring.style.borderColor   = 'rgba(255,255,255,0.5)';
      });
      el.addEventListener('mouseleave', () => {
        isHovering = false;
        ring.style.width         = '32px';
        ring.style.height        = '32px';
        ring.style.borderColor   = 'rgba(255,255,255,0.3)';
      });
    });

    // Click ripple
    document.addEventListener('click', () => {
      ring.style.transform = 'translate(-50%, -50%) scale(2.5)';
      ring.style.opacity   = '0';
      setTimeout(() => {
        ring.style.transform = 'translate(-50%, -50%) scale(1)';
        ring.style.opacity   = '1';
      }, 300);
    });

    function animate() {
      dot.style.left  = mx + 'px';
      dot.style.top   = my + 'px';
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animate);
    }
    animate();
  }


  /* ===================================================
     SCROLL REVEAL — Intersection Observer
     Adicionar .cf-reveal ao elemento
     JS adiciona .is-visible ao entrar na viewport
     =================================================== */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.cf-reveal');
    if (!elements.length) return;

    // Respeitar preferência de movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Stagger baseado em data-stagger
            const delay = entry.target.dataset.stagger || 0;
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, parseInt(delay));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => observer.observe(el));
  }


  /* ===================================================
     COUNTER ANIMATION — Para números de métricas
     Uso: <span class="cf-counter" data-target="300" data-suffix="%">0</span>
     =================================================== */
  function initCounters() {
    const counters = document.querySelectorAll('.cf-counter');
    if (!counters.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      counters.forEach(el => {
        el.textContent = (el.dataset.prefix || '') + el.dataset.target + (el.dataset.suffix || '');
      });
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el      = entry.target;
        const target  = parseFloat(el.dataset.target) || 0;
        const prefix  = el.dataset.prefix  || '';
        const suffix  = el.dataset.suffix  || '';
        const duration = parseInt(el.dataset.duration) || 1200;
        const start = performance.now();

        function tick(now) {
          const elapsed  = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const current  = Math.round(eased * target);
          el.textContent = prefix + current + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }


  /* ===================================================
     NAV — Adicionar classe ao rolar
     =================================================== */
  function initNav() {
    const nav = document.querySelector('.cf-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
    }, { passive: true });
  }


  /* ===================================================
     SMOOTH SCROLL para links de âncora
     =================================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }


  /* ===================================================
     INIT — Executar quando DOM estiver pronto
     =================================================== */
  function init() {
    initCursor();
    initScrollReveal();
    initCounters();
    initNav();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
