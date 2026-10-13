// A tiny confetti engine: drag, gravity, flutter, and a fake 3D flip via scaleY = cos(θ).

type Shape = 'paper' | 'heart' | 'petal';

interface Bit {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; flip: number; vf: number;
  size: number; color: string; shape: Shape; life: number;
}

const COLORS = ['#d8b77a', '#f3dfae', '#f4ede1', '#b8935a', '#7a2e3a', '#c98a8a'];

export function createConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const bits: Bit[] = [];
  let raf = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };
  resize();
  window.addEventListener('resize', resize);

  const heart = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s, 0, -s * 0.4);
    ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.4, 0, s * 0.3);
    ctx.fill();
  };

  const tick = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.vx *= 0.985;
      b.vy = b.vy * 0.985 + (b.shape === 'paper' ? 0.18 : 0.05);
      b.x += b.vx + Math.sin(b.flip * 0.5) * (b.shape === 'paper' ? 0.6 : 1.1);
      b.y += b.vy;
      b.rot += b.vr;
      b.flip += b.vf;
      b.life++;
      if (b.y > window.innerHeight + 40) { bits.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.scale(1, Math.cos(b.flip));
      ctx.fillStyle = b.color;
      ctx.globalAlpha = Math.min(1, b.life / 10);
      if (b.shape === 'heart') heart(b.size);
      else if (b.shape === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, b.size, b.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    }
    raf = bits.length ? requestAnimationFrame(tick) : 0;
  };

  const spawn = (b: Partial<Bit> & Pick<Bit, 'x' | 'y' | 'vx' | 'vy'>, shape: Shape) => {
    bits.push({
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      flip: Math.random() * Math.PI * 2,
      vf: 0.08 + Math.random() * 0.15,
      size: shape === 'paper' ? 8 + Math.random() * 8 : 6 + Math.random() * 7,
      color: shape === 'petal' ? (Math.random() < 0.7 ? '#e9b8b8' : '#f4ede1') : COLORS[(Math.random() * COLORS.length) | 0],
      shape,
      life: 0,
      ...b,
    });
    if (!raf) raf = requestAnimationFrame(tick);
  };

  return {
    // Two cannons fire inward from the bottom corners
    burst() {
      const w = window.innerWidth, h = window.innerHeight;
      for (let i = 0; i < 160; i++) {
        const left = i % 2 === 0;
        const angle = (left ? -60 : -120) + (Math.random() - 0.5) * 40;
        const speed = 14 + Math.random() * 14;
        const rad = (angle * Math.PI) / 180;
        spawn({ x: left ? 0 : w, y: h, vx: Math.cos(rad) * speed, vy: Math.sin(rad) * speed }, i % 9 === 0 ? 'heart' : 'paper');
      }
    },
    // Slow petal shower from above
    rain(count = 120, shape: Shape = 'petal') {
      for (let i = 0; i < count; i++) {
        spawn({ x: Math.random() * window.innerWidth, y: -20 - Math.random() * window.innerHeight, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 1.5 }, shape);
      }
    },
  };
}
