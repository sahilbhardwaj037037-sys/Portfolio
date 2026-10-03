// Hero card tuning: degrees, pixels, and easing duration in milliseconds.
const heroTiltSettings = { maxTilt: 3, translation: 1.5, depth: 4, smoothing: 140 };
const heroCard = document.querySelector('.hero-image-card');
if (heroCard) {
  const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px) and (prefers-reduced-motion: no-preference)');
  const current = { x: 0, y: 0, active: 0 };
  const target = { x: 0, y: 0, active: 0 };
  let frame = 0;
  let previousTime = 0;

  function renderHeroCard(time) {
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16.7;
    previousTime = time;
    // Time-based interpolation feels consistent on different refresh rates.
    const ease = 1 - Math.exp(-elapsed / heroTiltSettings.smoothing);
    let settled = true;
    for (const key of ['x', 'y', 'active']) {
      current[key] += (target[key] - current[key]) * ease;
      if (Math.abs(target[key] - current[key]) < .001) current[key] = target[key];
      else settled = false;
    }
    const { x, y, active } = current;
    const { maxTilt, translation, depth } = heroTiltSettings;
    heroCard.style.transform = `perspective(1000px) translate3d(${x * translation}px, ${y * translation}px, ${active * depth}px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg)`;
    heroCard.style.setProperty('--hero-glow-x', `${(x + 1) * 50}%`);
    heroCard.style.setProperty('--hero-glow-y', `${(y + 1) * 50}%`);
    heroCard.style.setProperty('--hero-glow-opacity', active);
    if (!settled) frame = requestAnimationFrame(renderHeroCard);
    else {
      frame = 0;
      previousTime = 0;
      if (!target.active) {
        heroCard.style.removeProperty('transform');
        heroCard.classList.remove('is-tilting');
      }
    }
  }
  function startHeroFrame() {
    if (!frame) frame = requestAnimationFrame(renderHeroCard);
  }
  // One movement listener; measure the stationary parent to avoid tilt feedback.
  heroCard.addEventListener('pointermove', event => {
    if (!enabled.matches || event.pointerType !== 'mouse') return;
    const bounds = heroCard.parentElement.getBoundingClientRect();
    target.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / heroCard.offsetWidth * 2 - 1));
    target.y = Math.max(-1, Math.min(1, (event.clientY - bounds.top - heroCard.offsetTop) / heroCard.offsetHeight * 2 - 1));
    target.active = 1;
    heroCard.classList.add('is-tilting');
    startHeroFrame();
  }, { passive: true });
  function releaseHeroCard() {
    target.x = target.y = target.active = 0;
    if (enabled.matches) startHeroFrame();
  }
  heroCard.addEventListener('pointerleave', releaseHeroCard);
  heroCard.addEventListener('pointercancel', releaseHeroCard);
  window.addEventListener('blur', releaseHeroCard);
  // Immediately reset if the user changes motion preferences or device mode.
  enabled.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    frame = previousTime = 0;
    current.x = current.y = current.active = 0;
    target.x = target.y = target.active = 0;
    heroCard.style.removeProperty('transform');
    heroCard.style.removeProperty('--hero-glow-x');
    heroCard.style.removeProperty('--hero-glow-y');
    heroCard.style.removeProperty('--hero-glow-opacity');
    heroCard.classList.remove('is-tilting');
  });
}

// Mobile navigation: preserve normal anchor behavior and keyboard access.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

// Native details supports Enter/Space and also works without JavaScript.
const faqs = document.querySelectorAll('.faq-list details');
faqs.forEach(faq => faq.addEventListener('toggle', () => {
  if (faq.open) faqs.forEach(other => { if (other !== faq) other.open = false; });
}));

// Named placeholders remain obvious in the HTML, but don't lead to error pages.
// Once a placeholder is replaced with a real URL, the link works normally.
const notice = document.querySelector('.notice');
let noticeTimer;
document.querySelectorAll('a[href]').forEach(link => {
  const url = link.getAttribute('href');
  if (/^PROJECT_[1-7]_URL$/.test(url) || url === 'FIVERR_PROFILE_URL' || url === 'mailto:YOUR_EMAIL_HERE') {
    link.addEventListener('click', event => {
      event.preventDefault();
      notice.textContent = url.startsWith('PROJECT_') ? 'This project link will be added soon.' : 'Contact details will be added soon.';
      notice.classList.add('visible');
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => notice.classList.remove('visible'), 4000);
    });
  }
});

// Focus supports touch and keyboard users as well as hover.
document.querySelectorAll('.coming-soon').forEach(button => {
  button.addEventListener('click', () => {
    button.classList.add('show-tooltip');
    setTimeout(() => button.classList.remove('show-tooltip'), 2500);
  });
});

// Observe sections instead of running work on every scroll event.
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navigation.querySelectorAll('a').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.service-card, .project-card, .about-copy').forEach(element => {
      element.classList.add('reveal-ready');
      revealObserver.observe(element);
    });
  }
}
