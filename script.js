const header = document.querySelector('#header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('img').forEach(image => {
  image.addEventListener('error', () => {
    image.hidden = true;
    image.parentElement?.classList.add('asset-placeholder');
  });
});

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
};

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
  navigation.classList.toggle('is-open', !open);
  document.body.classList.toggle('menu-open', !open);
});

navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
document.addEventListener('click', event => {
  if (navigation.classList.contains('is-open') && !navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const getHeaderOffset = () => {
  const rect = header.getBoundingClientRect();
  return Math.ceil(rect.height + 34);
};

const updateScrollOffset = () => {
  document.documentElement.style.setProperty('--header-offset', `${getHeaderOffset()}px`);
};

window.addEventListener('resize', updateScrollOffset, { passive: true });
updateScrollOffset();

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    const targetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: Math.max(0, targetTop), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    history.pushState(null, '', id);
  });
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
document.querySelectorAll('section[id]:not(#top)').forEach(section => sectionObserver.observe(section));

const form = document.querySelector('#signup-form');
const status = document.querySelector('#form-status');
const fields = {
  parentName: document.querySelector('#parent-name'),
  childName: document.querySelector('#child-name'),
  childAge: document.querySelector('#child-age'),
  phone: document.querySelector('#phone'),
  comment: document.querySelector('#comment'),
  consent: document.querySelector('#consent')
};

const setError = (field, message) => {
  const error = document.querySelector(`#${field.id}-error`);
  if (error) error.textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  field.closest('.field')?.classList.toggle('invalid', Boolean(message));
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  const errors = [
    [fields.parentName, fields.parentName.value.trim().length < 2 ? 'Введите имя — минимум 2 символа' : ''],
    [fields.childAge, fields.childAge.value.trim() ? '' : 'Введите возраст ребёнка'],
    [fields.phone, fields.phone.value.replace(/\D/g, '').length < 10 ? 'Введите не менее 10 цифр номера' : ''],
    [fields.consent, fields.consent.checked ? '' : 'Необходимо согласие на обработку данных']
  ];
  errors.forEach(([field, message]) => setError(field, message));
  const firstInvalid = errors.find(([, message]) => message);
  if (firstInvalid) {
    firstInvalid[0].focus();
    status.textContent = 'Проверьте отмеченные поля.';
    return;
  }
  const submitButton = form.querySelector('.submit-button');
  const payload = {
    parentName: fields.parentName.value.trim(),
    childName: fields.childName.value.trim(),
    childAge: fields.childAge.value.trim(),
    phone: fields.phone.value.trim(),
    comment: fields.comment.value.trim(),
    page: window.location.href
  };

  if (!window.LEAD_ENDPOINT) {
    status.innerHTML = '<div class="success-box"><b>Заявка заполнена.</b> Чтобы она автоматически приходила в ВК, добавьте URL обработчика в <code>window.LEAD_ENDPOINT</code> в index.html.<br><a class="button button-small" href="https://vk.com/garmonia.dvizhenia" target="_blank" rel="noopener noreferrer">Написать во ВКонтакте ↗</a></div>';
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Отправляем...';
  status.textContent = '';

  try {
    const response = await fetch(window.LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('request failed');
    form.reset();
    status.innerHTML = '<div class="success-box"><b>Спасибо!</b> Заявка отправлена. Мы скоро свяжемся с вами.</div>';
  } catch (error) {
    status.innerHTML = '<div class="success-box"><b>Не получилось отправить заявку автоматически.</b> Пожалуйста, напишите нам во ВКонтакте или позвоните: +7 (909) 062-74-84.<br><a class="button button-small" href="https://vk.com/garmonia.dvizhenia" target="_blank" rel="noopener noreferrer">Написать во ВКонтакте ↗</a></div>';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Записаться <span>→</span>';
  }
});

Object.values(fields).forEach(field => field.addEventListener('blur', () => {
  if (field.getAttribute('aria-invalid') === 'true') setError(field, '');
}));

document.querySelector('#year').textContent = new Date().getFullYear();

if (!reducedMotion.matches && window.matchMedia('(min-width: 901px)').matches) {
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  const updateParallax = () => {
    parallaxItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      item.style.transform = `translateY(${(rect.top - window.innerHeight / 2) * Number(item.dataset.parallax)}px)`;
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) requestAnimationFrame(updateParallax);
    ticking = true;
  }, { passive: true });
}

if (reducedMotion.matches) document.querySelector('.hero video')?.pause();
