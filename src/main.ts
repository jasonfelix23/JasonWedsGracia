import { wedding } from './config';
import { initSilk } from './silk';
import { createConfetti } from './confetti';
import { initCountdown } from './countdown';
import { initStory } from './story';
import { initRsvp, downloadIcs, googleCalendarUrl } from './rsvp';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const weddingDate = new Date(wedding.date);
const fmt = (opts: Intl.DateTimeFormatOptions, d = weddingDate) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: wedding.timeZone, ...opts }).format(d);

// ---------- Content from config ----------

const [m1, m2] = wedding.monogram;
$$('[data-monogram]').forEach((el) => (el.innerHTML = `${m1}<i>&amp;</i>${m2}`));
$$('[data-names]').forEach((el) => (el.innerHTML = `${wedding.partnerOne} <i>&amp;</i> ${wedding.partnerTwo}`));
$$('[data-date-short]').forEach((el) => (el.textContent = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' · ')));
$$('[data-date-long]').forEach((el) => (el.textContent = `${fmt({ weekday: 'long' })} · ${fmt({ day: 'numeric', month: 'long', year: 'numeric' })} · ${wedding.city}`));
$$('[data-hashtag]').forEach((el) => (el.textContent = wedding.hashtag));
$$('[data-deadline]').forEach((el) => (el.textContent = wedding.rsvp.deadline));

// Names arrive letter by letter
$$('[data-split]').forEach((el) => {
  const name = el.dataset.partner === '1' ? wedding.partnerOne : wedding.partnerTwo;
  el.setAttribute('aria-label', name);
  el.innerHTML = [...name].map((ch, i) => `<span aria-hidden="true" style="--i:${i}">${ch}</span>`).join('');
});

// Event cards
const time = (iso: string) => fmt({ hour: 'numeric', minute: '2-digit', hour12: true }, new Date(iso)).toUpperCase();
$('#cards').innerHTML = [
  ...wedding.events.map((e, i) => `
    <article class="card" data-tilt data-reveal style="--d:${i * 120}ms">
      <div class="card-inner">
        <span class="card-num">0${i + 1}</span>
        <h3>${e.title}</h3>
        <p class="card-time">${time(e.start)} — ${time(e.end)}</p>
        <p class="card-venue">${e.venue}</p>
        <p class="card-addr">${e.address}</p>
        ${e.note ? `<p class="card-note">${e.note}</p>` : ''}
        <a class="link" href="${e.mapUrl}" target="_blank" rel="noopener">Get directions →</a>
      </div>
    </article>`),
  `<article class="card" data-tilt data-reveal style="--d:${wedding.events.length * 120}ms">
    <div class="card-inner">
      <span class="card-num">0${wedding.events.length + 1}</span>
      <h3>${wedding.dressCode.title}</h3>
      <p class="card-venue">${wedding.dressCode.headline}</p>
      <p class="card-addr">${wedding.dressCode.text}</p>
      <div class="swatches">${wedding.dressCode.palette.map((c) => `<span style="--c:${c}"></span>`).join('')}</div>
    </div>
  </article>`,
].join('');

// ---------- Engines ----------

const silk = initSilk($<HTMLCanvasElement>('#silk'), reducedMotion);
const confetti = createConfetti($<HTMLCanvasElement>('#confetti'));
initCountdown($('#flips'), $('#countdown-done'), weddingDate);
initStory($('#story-body'), $<HTMLOListElement>('#chapters'), wedding.story, reducedMotion);

let toastTimer = 0;
const toast = (msg: string) => {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('is-on'), 3600);
};

initRsvp({ onAccept: () => confetti.burst(), toast });
$<HTMLAnchorElement>('#gcal').href = googleCalendarUrl(wedding.events[0]);
$('#ics').addEventListener('click', () => {
  downloadIcs(wedding.events);
  toast('Calendar file downloaded ✦');
});

// ---------- The envelope ----------

const intro = $('#intro');
const openInvite = () => {
  if (intro.classList.contains('is-opening')) return;
  intro.classList.add('is-opening');
  const scale = reducedMotion ? 0.15 : 1;
  setTimeout(() => {
    intro.classList.add('is-leaving');
    document.body.classList.add('is-open');
    silk.reveal();
  }, 2300 * scale);
  setTimeout(() => {
    intro.remove();
    document.body.classList.remove('is-locked');
    $('#main').focus({ preventScroll: true });
  }, 3300 * scale);
};
$('#seal').addEventListener('click', openInvite);
$('.skip').addEventListener('click', openInvite);
requestAnimationFrame(() => intro.classList.add('is-ready'));
$('#seal').focus({ preventScroll: true });

// ---------- Scroll reveals ----------

const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
$$('[data-reveal], .chapter').forEach((el) => io.observe(el));

// ---------- Velocity marquee: speeds up and leans into your scroll ----------

const marquee = $('#marquee');
const phrase = `<span>Save the date</span><i>✦</i><span>${fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</span><i>✦</i><span>${wedding.hashtag}</span><i>✦</i>`;
marquee.innerHTML = `<div>${phrase.repeat(4)}</div><div aria-hidden="true">${phrase.repeat(4)}</div>`;
{
  let x = 0, lastY = window.scrollY, velocity = 0;
  const step = () => {
    const y = window.scrollY;
    velocity += ((y - lastY) - velocity) * 0.1;
    lastY = y;
    const half = marquee.scrollWidth / 2;
    if (!reducedMotion) x = (x - 0.6 - Math.abs(velocity) * 0.25) % half;
    marquee.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-12, Math.min(12, -velocity * 0.4))}deg)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Pointer craft: cursor, magnetic buttons, holographic tilt, hero parallax ----------

if (finePointer && !reducedMotion) {
  document.body.classList.add('has-cursor');
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { ...p };
  addEventListener('pointermove', (e) => {
    p.x = e.clientX; p.y = e.clientY;
    dot.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
    const hot = (e.target as Element).closest('a, button, input, textarea, label, summary, .seal');
    document.body.classList.toggle('cursor-hot', !!hot);
  }, { passive: true });
  addEventListener('pointerdown', () => document.body.classList.add('cursor-down'));
  addEventListener('pointerup', () => document.body.classList.remove('cursor-down'));
  const follow = () => {
    r.x += (p.x - r.x) * 0.16; r.y += (p.y - r.y) * 0.16;
    ring.style.transform = `translate3d(${r.x}px,${r.y}px,0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);

  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.25}px, ${(e.clientY - b.top - b.height / 2) * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });

  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      el.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  const names = $('.names');
  addEventListener('pointermove', (e) => {
    const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
    names.style.transform = `translate3d(${dx * -18}px, ${dy * -12}px, 0)`;
  }, { passive: true });
}

// ---------- Little delights ----------

const title = document.title;
document.addEventListener('visibilitychange', () => {
  document.title = document.hidden ? 'Come back — we’re getting married 💍' : title;
});

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let k = 0;
addEventListener('keydown', (e) => {
  k = e.key.toLowerCase() === KONAMI[k].toLowerCase() ? k + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (k === KONAMI.length) {
    k = 0;
    confetti.rain(90, 'heart');
    confetti.rain(60, 'petal');
    toast('You found it. Of course you did. ♥');
  }
});

console.log(
  `%c${m1} & ${m2}%c\n\nHey, fellow developer 👋\nNo frameworks, no libraries — just a fragment shader, some trigonometry and a lot of love.\nSee you at the wedding. (Try the Konami code.)`,
  'font: italic 32px Georgia, serif; color: #d8b77a; padding: 8px 0',
  'font: 13px/1.6 ui-monospace, monospace; color: #9aa0b4',
);
