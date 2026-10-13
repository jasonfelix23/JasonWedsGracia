// Split-flap countdown. Each card has four layers: the static top half shows the next value,
// the static bottom half shows the current one, and a hinged leaf carries current→next across the fold.

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const;

const half = (cls: string) => `<div class="${cls}"><span></span></div>`;

export function initCountdown(root: HTMLElement, done: HTMLElement, target: Date) {
  root.innerHTML = UNITS.map(({ key, label }) => `
    <div class="flip" data-unit="${key}">
      <div class="flip-card">
        ${half('half top')}${half('half bottom')}
        <div class="leaf">${half('leaf-face leaf-front')}${half('leaf-face leaf-back')}</div>
      </div>
      <span class="flip-label">${label}</span>
    </div>`).join('');

  const cards = UNITS.map(({ key }) => {
    const el = root.querySelector<HTMLElement>(`[data-unit="${key}"] .flip-card`)!;
    const q = (s: string) => el.querySelector<HTMLSpanElement>(`${s} span`)!;
    return { el, top: q('.top'), bottom: q('.bottom'), front: q('.leaf-front'), back: q('.leaf-back'), value: '' };
  });

  const set = (card: (typeof cards)[number], next: string) => {
    if (card.value === next) return;
    const prev = card.value || next;
    card.value = next;
    card.top.textContent = next;
    card.back.textContent = next;
    card.front.textContent = prev;
    card.bottom.textContent = prev;
    card.el.classList.remove('is-flipping');
    void card.el.offsetWidth; // restart the animation
    card.el.classList.add('is-flipping');
    window.setTimeout(() => { card.bottom.textContent = next; }, 600);
  };

  let timer = 0;
  const update = () => {
    const ms = target.getTime() - Date.now();
    if (ms <= 0) {
      root.hidden = true;
      done.hidden = false;
      window.clearInterval(timer);
      return;
    }
    const s = Math.floor(ms / 1000);
    const values = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    values.forEach((v, i) => set(cards[i], String(v).padStart(i === 0 && v > 99 ? 3 : 2, '0')));
    root.setAttribute('aria-label', `${values[0]} days, ${values[1]} hours and ${values[2]} minutes to go`);
  };
  update();
  timer = window.setInterval(update, 1000);
}
