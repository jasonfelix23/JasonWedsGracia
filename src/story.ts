import type { Chapter } from './config';

// Two sine threads with opposite phase spiral down the story. Their amplitude collapses
// towards the end so they become a single line. Scroll position draws them in.

export function initStory(body: HTMLElement, list: HTMLOListElement, chapters: Chapter[], reducedMotion: boolean) {
  list.innerHTML = chapters.map((c, i) => `
    <li class="chapter ${i % 2 ? 'is-right' : 'is-left'}">
      <span class="chapter-when">${c.when}</span>
      <h3>${c.title}</h3>
      <p>${c.text}</p>
    </li>`).join('');

  const svg = body.querySelector<SVGSVGElement>('#threads')!;
  const $ = <T extends SVGElement>(id: string) => svg.querySelector<T>(`#${id}`)!;
  const a = $<SVGPathElement>('thread-a'), b = $<SVGPathElement>('thread-b');
  const ga = $<SVGPathElement>('ghost-a'), gb = $<SVGPathElement>('ghost-b');
  const tipA = $<SVGCircleElement>('tip-a'), tipB = $<SVGCircleElement>('tip-b');
  const items = [...list.children] as HTMLElement[];

  let lenA = 0, lenB = 0, shown = 0;

  const build = () => {
    const w = body.clientWidth, h = body.clientHeight;
    const mobile = w < 720;
    const cx = mobile ? 26 : w / 2;
    const amp = mobile ? 14 : Math.min(70, w * 0.08);
    const turns = chapters.length * 1.5;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const path = (phase: number) => {
      let d = '';
      for (let i = 0; i <= 400; i++) {
        const t = i / 400;
        const fade = 1 - Math.pow(Math.max(0, (t - 0.72) / 0.28), 1.4); // threads merge in the last stretch
        const x = cx + Math.sin(t * Math.PI * 2 * turns + phase) * amp * fade;
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(t * h).toFixed(1)}`;
      }
      return d;
    };
    for (const [el, ghost, phase] of [[a, ga, 0], [b, gb, Math.PI]] as const) {
      const d = path(phase);
      el.setAttribute('d', d);
      ghost.setAttribute('d', d);
    }
    lenA = a.getTotalLength();
    lenB = b.getTotalLength();
    a.style.strokeDasharray = `${lenA}`;
    b.style.strokeDasharray = `${lenB}`;
    shown = -1;
  };

  const draw = () => {
    const r = body.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = reducedMotion ? 1 : Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
    if (Math.abs(p - shown) < 0.0005) return;
    shown = p;
    a.style.strokeDashoffset = `${lenA * (1 - p)}`;
    b.style.strokeDashoffset = `${lenB * (1 - p)}`;
    const pa = a.getPointAtLength(lenA * p), pb = b.getPointAtLength(lenB * p);
    tipA.setAttribute('cx', `${pa.x}`); tipA.setAttribute('cy', `${pa.y}`);
    tipB.setAttribute('cx', `${pb.x}`); tipB.setAttribute('cy', `${pb.y}`);
    svg.classList.toggle('is-joined', p > 0.98);

    // Light up chapters as the thread reaches them
    const tipY = p * r.height;
    for (const li of items) li.classList.toggle('is-reached', li.offsetTop + 30 < tipY);
  };

  build();
  new ResizeObserver(() => { build(); draw(); }).observe(body);
  const loop = () => { draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
