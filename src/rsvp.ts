import { wedding, type WeddingEvent } from './config';

const STORE = 'jwg:rsvp';

// ---------- Calendar: an RFC 5545 file built in the browser ----------

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsEscape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function downloadIcs(events: WeddingEvent[]) {
  const title = `${wedding.partnerOne} & ${wedding.partnerTwo}`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//JasonWedsGracia//Invite//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  events.forEach((e, i) => lines.push(
    'BEGIN:VEVENT',
    `UID:${icsDate(e.start)}-${i}@jasonwedsgracia`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(e.start)}`,
    `DTEND:${icsDate(e.end)}`,
    `SUMMARY:${icsEscape(`${title} — ${e.title}`)}`,
    `LOCATION:${icsEscape(`${e.venue}, ${e.address}`)}`,
    `DESCRIPTION:${icsEscape(`${e.note ?? ''}\n${e.mapUrl}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(`${title} tomorrow!`)}`, 'END:VALARM',
    'END:VEVENT',
  ));
  lines.push('END:VCALENDAR');

  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'jason-and-gracia.ics' });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(e: WeddingEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${wedding.partnerOne} & ${wedding.partnerTwo} — ${e.title}`,
    dates: `${icsDate(e.start)}/${icsDate(e.end)}`,
    location: `${e.venue}, ${e.address}`,
    details: `${e.note ?? ''}\n${e.mapUrl}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// ---------- RSVP: no server, the reply travels by WhatsApp or email ----------

interface Reply { name: string; attending: boolean; guests: number; note: string }

export function initRsvp(opts: { onAccept: () => void; toast: (msg: string) => void }) {
  const form = document.querySelector<HTMLFormElement>('#rsvp-form')!;
  const thanks = document.querySelector<HTMLElement>('#rsvp-thanks')!;
  const thanksText = document.querySelector<HTMLElement>('#rsvp-thanks-text')!;
  const output = document.querySelector<HTMLOutputElement>('#guests')!;
  const stepper = document.querySelector<HTMLElement>('#stepper')!;
  const error = document.querySelector<HTMLElement>('#form-error')!;
  let guests = 1;

  const setGuests = (n: number) => {
    guests = Math.max(1, Math.min(wedding.rsvp.maxGuests, n));
    output.value = String(guests);
    output.classList.remove('bump');
    void output.offsetWidth;
    output.classList.add('bump');
  };
  stepper.addEventListener('click', (e) => {
    const step = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-step]');
    if (step) setGuests(guests + Number(step.dataset.step));
  });
  form.addEventListener('change', () => {
    stepper.classList.toggle('is-disabled', (form.elements.namedItem('attending') as RadioNodeList).value === 'no');
  });

  const showThanks = (r: Reply) => {
    form.hidden = true;
    thanks.hidden = false;
    thanksText.textContent = r.attending
      ? `${r.name}, we can’t wait to celebrate with you${r.guests > 1 ? ` and your ${r.guests - 1 === 1 ? 'plus one' : `${r.guests - 1} guests`}` : ''}.`
      : `${r.name}, we’ll miss you dearly — thank you for letting us know.`;
  };

  try {
    const saved = localStorage.getItem(STORE);
    if (saved) showThanks(JSON.parse(saved) as Reply);
  } catch { /* storage unavailable: start fresh */ }

  document.querySelector('#rsvp-again')!.addEventListener('click', () => {
    thanks.hidden = true;
    form.hidden = false;
    (form.elements.namedItem('name') as HTMLInputElement).focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    if (!name) {
      error.textContent = 'We’d love to know who you are.';
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
      (form.elements.namedItem('name') as HTMLInputElement).focus();
      return;
    }
    error.textContent = '';
    const reply: Reply = { name, attending: data.get('attending') === 'yes', guests, note: String(data.get('note') ?? '').trim() };

    const message = [
      `RSVP — ${wedding.partnerOne} & ${wedding.partnerTwo}`,
      `Name: ${reply.name}`,
      `Attending: ${reply.attending ? `Yes, ${reply.guests} guest${reply.guests > 1 ? 's' : ''}` : 'Sadly, no'}`,
      reply.note && `Note: ${reply.note}`,
    ].filter(Boolean).join('\n');

    const { whatsapp, email } = wedding.rsvp;
    const href = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
      : `mailto:${email}?subject=${encodeURIComponent(`RSVP from ${reply.name}`)}&body=${encodeURIComponent(message)}`;
    if (whatsapp) window.open(href, '_blank', 'noopener');
    else window.location.href = href;

    try { localStorage.setItem(STORE, JSON.stringify(reply)); } catch { /* fine */ }
    showThanks(reply);
    if (reply.attending) opts.onAccept();
    opts.toast(whatsapp ? 'Opening WhatsApp — just hit send ✦' : 'Opening your email — just hit send ✦');
  });
}
