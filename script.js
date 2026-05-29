/* ============================================================
   ЗАБОРЫЧ — script.js
   ============================================================ */

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────
  const header      = document.getElementById('header');
  const burger      = document.getElementById('burger');
  const mobileMenu  = document.getElementById('mobileMenu');
  const fab         = document.getElementById('fab');
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn   = document.getElementById('submitBtn');
  const revealEls   = document.querySelectorAll('.reveal');
  const counterEls  = document.querySelectorAll('[data-count]');

  // ── Scroll — header & FAB ─────────────────────────────────
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 20);
    fab.classList.toggle('visible', y > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Burger menu ───────────────────────────────────────────
  function toggleMenu(open) {
    burger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', () => {
    toggleMenu(!mobileMenu.classList.contains('open'));
  });

  // Close mobile menu on link click
  document.querySelectorAll('.mobile-nav__link, .mobile-nav__cta').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // ── Reveal on scroll (IntersectionObserver) ───────────────
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings in same parent
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal:not(.visible)'));
          const idx = siblings.indexOf(entry.target);
          const delay = Math.min(idx * 80, 400);
          setTimeout(() => entry.target.classList.add('visible'), delay);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach(el => revealObserver.observe(el));

  // ── Counter animation ─────────────────────────────────────
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counterEls.forEach(el => counterObserver.observe(el));

  // ── Smooth scroll for anchor links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Active nav link on scroll ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  function setActiveLink() {
    const scrollY = window.scrollY;
    let current = '';
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.style.color = href === current ? 'var(--orange)' : '';
    });
  }
  window.addEventListener('scroll', setActiveLink, { passive: true });

  // ── Phone input mask ──────────────────────────────────────
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      let val = this.value.replace(/\D/g, '');
      if (val.startsWith('8')) val = '7' + val.slice(1);
      if (!val.startsWith('7') && val.length > 0) val = '7' + val;
      val = val.slice(0, 11);
      let formatted = '';
      if (val.length > 0) formatted = '+7';
      if (val.length > 1) formatted += ' (' + val.slice(1, 4);
      if (val.length >= 4) formatted += ') ' + val.slice(4, 7);
      if (val.length >= 7) formatted += '-' + val.slice(7, 9);
      if (val.length >= 9) formatted += '-' + val.slice(9, 11);
      this.value = formatted;
    });
  }

  // ── Telegram Bot ──────────────────────────────────────────
  const TG_TOKEN  = '8843033045:AAG3XqNpQj5cbyeKx0_zmAgNya6MmrAvtL8';
  const TG_CHATID = '-1003954966351';

  async function sendToTelegram(name, phone, comment) {
    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    const lines = [
      '🏠 Новая заявка с сайта Заборыч!',
      '',
      '👤 Имя: ' + name,
      '📞 Телефон: ' + phone,
      comment ? '💬 Комментарий: ' + comment : '',
      '',
      '🕐 ' + now,
    ].filter(Boolean).join('\n');

    const params = new URLSearchParams({
      chat_id: TG_CHATID,
      text: lines,
    });
    const url = 'https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage?' + params;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) throw new Error('Telegram error: ' + data.description);
  }

  // ── Form submission ───────────────────────────────────────
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name    = document.getElementById('name').value.trim();
      const phone   = document.getElementById('phone').value.trim();
      const comment = document.getElementById('comment').value.trim();

      if (!name)  { shakeInput(document.getElementById('name'));  return; }
      if (phone.replace(/\D/g, '').length < 11) { shakeInput(document.getElementById('phone')); return; }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.querySelector('.submit-text').hidden = true;
      submitBtn.querySelector('.submit-loader').hidden = false;

      // Показываем успех через 2 сек, отправка идёт в фоне
      sendToTelegram(name, phone, comment).catch(() => {});
      setTimeout(() => {
        submitBtn.hidden = true;
        formSuccess.hidden = false;
        contactForm.querySelectorAll('.form-input').forEach(i => {
          i.value = '';
          i.disabled = true;
        });
      }, 2000);
    });
  }

  function shakeInput(input) {
    input.style.borderColor = '#FF4444';
    input.style.animation = 'shake 0.4s ease';
    input.addEventListener('animationend', () => {
      input.style.animation = '';
    }, { once: true });
    input.focus();
  }

  // Inject shake keyframe
  const style = document.createElement('style');
  style.textContent = `@keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)}
    40%{transform:translateX(8px)}
    60%{transform:translateX(-5px)}
    80%{transform:translateX(5px)}
  }`;
  document.head.appendChild(style);

  // ── Service card "Подробнее" ──────────────────────────────
  document.querySelectorAll('.service-card__btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const title = this.closest('.service-card').querySelector('.service-card__title').textContent;
      // Scroll to contact and prefill comment
      document.getElementById('comment').value = `Интересует: ${title}`;
      const contactSection = document.getElementById('contact');
      const headerH = 72;
      window.scrollTo({
        top: contactSection.getBoundingClientRect().top + window.scrollY - headerH,
        behavior: 'smooth'
      });
      setTimeout(() => document.getElementById('name').focus(), 600);
    });
  });

  // ── Parallax glow ─────────────────────────────────────────
  const glow1 = document.querySelector('.hero__glow--1');
  const glow2 = document.querySelector('.hero__glow--2');
  if (glow1 && glow2) {
    window.addEventListener('mousemove', function (e) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      glow1.style.transform = `translate(${x * 30 - 15}px, ${y * 30 - 15}px)`;
      glow2.style.transform = `translate(${-x * 20 + 10}px, ${-y * 20 + 10}px)`;
    }, { passive: true });
  }

  // ── Tilt on why/service cards ─────────────────────────────
  document.querySelectorAll('.why__card, .review-card').forEach(card => {
    card.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.style.transform = `translateY(-4px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    });
    card.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });

})();