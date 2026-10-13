# Jason & Gracia

A wedding invitation, hand-built with zero runtime dependencies.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ — host anywhere
```

All wedding details (names, date, venues, story, RSVP target) live in [`src/config.ts`](src/config.ts).

## What's inside

| Piece | How |
|---|---|
| Wax-sealed envelope intro | CSS clip-path paper, staged transitions, a seal that cracks in two |
| Living silk background | Raw WebGL fragment shader — domain-warped fBm, pointer-reactive, scroll-coupled |
| Split-flap countdown | Four-layer flip cards with `backface-visibility` |
| “Two threads” story | Opposite-phase sine paths that converge into one, drawn by scroll |
| Detail cards | 3D tilt + holographic sheen following the pointer |
| RSVP | No backend: composes a WhatsApp/email message, remembers the reply locally |
| Add to calendar | `.ics` generated in the browser + Google Calendar deep link |
| Confetti | Small canvas physics engine (drag, flutter, faux-3D flip) |
| Velocity marquee | Speed and skew follow scroll velocity |
| Easter eggs | Konami code, console note, tab title |

Respects `prefers-reduced-motion`, works on touch, and degrades gracefully without WebGL.
