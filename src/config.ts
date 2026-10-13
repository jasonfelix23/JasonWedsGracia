// Every detail of the day lives here. Edit this file — the whole site follows.
// Values marked TODO are placeholders.

export interface WeddingEvent {
  title: string;
  start: string; // ISO 8601 with offset
  end: string;
  venue: string;
  address: string;
  mapUrl: string;
  note?: string;
}

export interface Chapter {
  when: string;
  title: string;
  text: string;
}

export const wedding = {
  partnerOne: 'Jason',
  partnerTwo: 'Gracia',
  monogram: ['J', 'G'] as const,
  hashtag: '#JasonWedsGracia',
  city: 'Mumbai', // TODO
  date: '2026-11-13T16:00:00+05:30', // TODO: ceremony start, with your UTC offset
  timeZone: 'Asia/Kolkata', // dates are shown in the venue's time, wherever the guest is

  events: [
    {
      title: 'The Ceremony',
      start: '2026-11-13T16:00:00+05:30', // TODO
      end: '2026-11-13T17:30:00+05:30',
      venue: 'Methodist Tamil Church', // TODO
      address: 'Bhandup, Mumbai', // TODO
      mapUrl: 'https://maps.app.goo.gl/dFSf798abJ5XZh5R8', // TODO
      note: 'Please be seated by 3:45 PM',
    },
    {
      title: 'The Reception',
      start: '2026-11-13T19:00:00+05:30', // TODO
      end: '2026-11-13T23:00:00+05:30',
      venue: 'Bright High School', // TODO
      address: 'Bhandup, Mumbai', // TODO
      mapUrl: 'https://maps.app.goo.gl/YoD1V471zm3q66WA6', // TODO
      note: 'An evening of good food, warm toasts and the people we love most',
    },
  ] satisfies WeddingEvent[],

  dressCode: {
    title: 'What to Wear',
    headline: 'Come as you are',
    text: 'Wear whatever makes you feel comfortable and at ease. If you’d like to join in, these are the colours of our day, but your presence matters far more than what you wear.',
    palette: ['#0f1424', '#d8b77a', '#f4ede1', '#7a2e3a'],
  },

  // TODO: replace with your real story
  story: [
    { when: 'Chapter I', title: 'Two strangers', text: 'Two separate lives, two separate cities, each one quietly writing a story without knowing it was only half of one.' },
    { when: 'Chapter II', title: 'The first hello', text: 'A conversation that was meant to last five minutes and somehow didn’t end. Coffee went cold. Nobody noticed.' },
    { when: 'Chapter III', title: 'Every day after', text: 'Late-night calls, long drives, shared playlists, and the slow realisation that home had become a person.' },
    { when: 'Chapter IV', title: 'The question', text: 'One knee, one ring, one very nervous groom-to-be — and the easiest “yes” ever spoken.' },
    { when: 'Chapter V', title: 'Forever, together', text: 'Two threads, one weave. And we would love for you to be there when it begins.' },
  ] satisfies Chapter[],

  rsvp: {
    deadline: 'November 10, 2026', // TODO
    maxGuests: 4,
    // RSVPs are delivered without a backend: WhatsApp if a number is set, otherwise email.
    whatsapp: '917738515058', // TODO: e.g. '919876543210' (country code, no +)
    email: 'jasonfelix789@gmail.com', // TODO
  },
};
