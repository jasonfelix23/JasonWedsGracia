// Full-screen WebGL fragment shader: domain-warped fBm folded into liquid silk.
// Rendered at reduced resolution and upscaled — the softness is a feature, and it keeps us at 60fps.

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uReveal;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.04;
  uv.y += uScroll * 0.35;

  vec2 q = vec2(fbm(uv * 1.3 + t), fbm(uv * 1.3 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(uv * 1.5 + 3.0 * q + vec2(1.7, 9.2) + 0.15 * t + m * 0.25),
    fbm(uv * 1.5 + 3.0 * q + vec2(8.3, 2.8) - 0.12 * t)
  );
  float f = fbm(uv * 1.1 + 2.6 * r);

  // Silk folds: sharp specular bands riding the warped field
  float fold = 0.5 + 0.5 * sin(f * 9.0 + r.x * 5.0 - uTime * 0.15);
  float sheen = pow(fold, 14.0);
  float soft = pow(fold, 3.0);

  vec3 ink   = vec3(0.03, 0.035, 0.065);
  vec3 deep  = vec3(0.13, 0.14, 0.26);
  vec3 wine  = vec3(0.36, 0.11, 0.17);
  vec3 gold  = vec3(0.86, 0.71, 0.46);

  vec3 col = mix(ink, deep, smoothstep(0.2, 0.8, f));
  col = mix(col, wine, 0.55 * smoothstep(0.45, 0.9, r.y));
  col += gold * (0.12 * soft + 0.75 * sheen) * smoothstep(0.3, 0.8, length(q));

  // Warm light that follows the pointer
  col += gold * 0.1 * exp(-4.0 * length(uv - m));

  col *= 1.0 - 0.45 * dot(uv * 0.75, uv * 0.75);
  col *= uReveal;
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function initSilk(canvas: HTMLCanvasElement, reducedMotion: boolean) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    canvas.classList.add('is-fallback');
    return { reveal() {} };
  }

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one oversized triangle
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uScroll = u('uScroll'), uReveal = u('uReveal');

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let reveal = 0, revealTarget = 0, scroll = 0;

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio, 2) * (window.innerWidth < 768 ? 0.45 : 0.6);
    canvas.width = Math.round(window.innerWidth * scale);
    canvas.height = Math.round(window.innerHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  const start = performance.now();
  let running = true;
  const frame = (now: number) => {
    if (!running) return;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    reveal += (revealTarget - reveal) * 0.03;
    scroll += (window.scrollY / window.innerHeight - scroll) * 0.08;
    gl.uniform1f(uTime, reducedMotion ? 20 : (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, scroll);
    gl.uniform1f(uReveal, 0.35 + 0.65 * reveal);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  return { reveal() { revealTarget = 1; } };
}
