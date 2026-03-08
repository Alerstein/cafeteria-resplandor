/**
 * Resplandor — Loading Screen (High-Precision Edition)
 *
 * Fix 1 — Particle anchoring: strong steering force keeps each particle
 *          tightly anchored to its home position while Perlin noise adds
 *          just a subtle organic shimmer (±4px). Result: logo fully legible.
 *
 * Fix 2 — Neon grid pulses: GLSL shader fires bright "pulse" streaks that
 *          travel along every grid line (both X and Y axes). Each line gets
 *          an independent random speed/phase via hash. Canvas gets a CSS
 *          drop-shadow for the overall neon-light-bleed effect.
 *
 * Fix 3 — Clean fade: on exit, both layers animate to opacity 0 before DOM
 *          removal. Cursor stays default at all times inside #loading-screen.
 *
 * Scoping: everything lives inside #loading-screen.
 *          No body/global style changes.
 *          Triggers on window 'load' (min 2.5 s guaranteed display).
 */

/* ════════════════════════════════════════════
   BRAND PALETTE
════════════════════════════════════════════ */
const C_BLUE = [0, 174, 239];   // #00AEEF
const C_GOLD = [253, 184, 19];   // #FDB813
const C_WHITE = [255, 255, 255];

function mapToBrand(r, g, b) {
    // Dominant-channel mapping to brand palette
    if (b > r && b > g && b > 60) return C_BLUE;
    if (r > 140 && g > 90 && b < 110) return C_GOLD;
    return C_WHITE;
}

/* ════════════════════════════════════════════
   WEBGL2 SHADERS
════════════════════════════════════════════ */
const VS = /* glsl */`#version 300 es
in vec2 pos;
void main() { gl_Position = vec4(pos, 0.0, 1.0); }`;

const FS = /* glsl */`#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  u_res;
uniform float u_t;       // time (seconds)
uniform float u_fade;    // 0 = visible, 1 = black

/* ── Hash helpers ─────────────────────── */
float h11(float n) { return fract(sin(n) * 43758.5453123); }
float h21(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

/* ── Neon grid pulse ──────────────────── */
// Returns extra brightness for a neon pulse travelling along a grid line.
// axis: 0 = horizontal (x-travelling), 1 = vertical (y-travelling)
// lineIdx: integer index of the grid line
// coord: the coordinate *along* the line (0-1 normalized)
float pulse(int axis, float lineIdx, float coordAlong, float coordPerp, float cellSz) {
    // Each line gets a unique random speed + phase
    float seed  = h11(lineIdx * 7.3 + float(axis) * 13.7);
    float speed = mix(0.08, 0.22, seed);         // tiles/sec
    float phase = h11(seed * 91.3);

    // Pulse position (wraps 0-1 across the full normalized axis)
    float pPos  = fract(u_t * speed + phase);
    // Pulse width (narrow! gives a sharp spark)
    float width = mix(0.04, 0.10, h11(seed * 17.1));
    // Intensity along the line
    float dist  = abs(coordAlong - pPos);
    dist = min(dist, 1.0 - dist);               // wrap-around distance
    float intensity = smoothstep(width, 0.0, dist);
    // On-line factor: how close are we to the grid line itself?
    float onLine = smoothstep(0.018 * cellSz, 0.0, coordPerp);
    return intensity * onLine * mix(0.6, 1.0, h11(seed));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    /* ── Grid geometry ────────────────── */
    float cellLarge = 0.085;
    float cellSmall = 0.042;

    // Large grid lines (distance to nearest line)
    vec2 gL = abs(mod(uv, cellLarge) - 0.5 * cellLarge);
    float lineL = min(gL.x, gL.y);
    float gridL = smoothstep(0.0065, 0.0, lineL);

    // Fine grid (half density, dimmer)
    vec2 gS = abs(mod(uv, cellSmall) - 0.5 * cellSmall);
    float lineS = min(gS.x, gS.y);
    float gridS = smoothstep(0.0030, 0.0, lineS) * 0.30;

    float gridMask = max(gridL, gridS);

    /* ── Neon pulses on large grid lines ─ */
    // Normalized 0-1 coords within full uv range (roughly -0.9 to 0.9)
    vec2 uvN = (uv + 0.9) / 1.8;

    // Horizontal lines — pulses travel along X
    float rowIdx    = floor((uv.y + 0.9) / cellLarge);
    float perpH     = gL.y;                          // distance to nearest H line
    float alongH    = fract(uvN.x);                  // X coord normalized 0-1
    float pulseH    = pulse(0, rowIdx, alongH, perpH, cellLarge);

    // Additional offset rows for denser pulse coverage
    float rowIdx2   = floor((uv.y + 0.9) / cellSmall);
    float perpH2    = gS.y;
    float pulseH2   = pulse(0, rowIdx2 + 100.0, alongH, perpH2, cellSmall) * 0.5;

    // Vertical lines — pulses travel along Y
    float colIdx    = floor((uv.x + 0.9) / cellLarge);
    float perpV     = gL.x;
    float alongV    = fract(uvN.y);
    float pulseV    = pulse(1, colIdx, alongV, perpV, cellLarge);

    float colIdx2   = floor((uv.x + 0.9) / cellSmall);
    float perpV2    = gS.x;
    float pulseV2   = pulse(1, colIdx2 + 200.0, alongV, perpV2, cellSmall) * 0.5;

    float totalPulse = max(max(pulseH, pulseH2), max(pulseV, pulseV2));

    /* ── Ripple (center wave) ─────────── */
    float d   = length(uv);
    float rip = sin(d * 11.0 - u_t * 1.9) * 0.5 + 0.5;
    float env = smoothstep(1.1, 0.0, d);
    float ripple = rip * env;

    /* ── Colors ──────────────────────── */
    vec3 blue = vec3(0.000, 0.682, 0.937);   // #00AEEF
    vec3 gold = vec3(0.992, 0.722, 0.075);   // #FDB813
    vec3 bg   = vec3(0.008, 0.016, 0.030);   // near-black deep blue

    // Base grid color: blue/gold blend by ripple phase
    vec3 gridCol = mix(blue, gold, ripple * 0.55);

    // Pulse color: brighter, more saturated
    vec3 pulseCol = mix(blue * 1.6, vec3(1.0, 0.92, 0.5), totalPulse * 0.7);

    // Combine
    float baseBright = gridMask * mix(0.25, 0.85, ripple);
    vec3 col = mix(bg, gridCol, baseBright);

    // Add neon pulse on top
    col += pulseCol * totalPulse * 0.9;

    // Shimmer: random per-cell flicker
    float shimmer = h21(floor(uv / cellLarge)) * 0.15;
    col += gridCol * shimmer * gridMask;

    // Fade-in (first second)
    col *= smoothstep(0.0, 1.2, u_t);

    // Exit fade-out
    col = mix(col, vec3(0.0), u_fade * u_fade);

    fragColor = vec4(col, 1.0);
}`;

/* ════════════════════════════════════════════
   PERLIN NOISE (inline, zero deps)
════════════════════════════════════════════ */
const _p = (() => {
    const a = new Uint8Array(256);
    for (let i = 0; i < 256; i++) a[i] = i;
    for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; }
    const t = new Uint8Array(512);
    for (let i = 0; i < 512; i++) t[i] = a[i & 255];
    return t;
})();
const _fd = t => t * t * t * (t * (t * 6 - 15) + 10);
const _lp = (a, b, t) => a + t * (b - a);
const _gr = (h, x, y) => { const u = h < 2 ? x : y, v = h < 2 ? y : x; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
function noise2(x, y) {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = _fd(xf), v = _fd(yf);
    return _lp(
        _lp(_gr(_p[_p[xi] + yi], xf, yf), _gr(_p[_p[xi + 1] + yi], xf - 1, yf), u),
        _lp(_gr(_p[_p[xi] + yi + 1], xf, yf - 1), _gr(_p[_p[xi + 1] + yi + 1], xf - 1, yf - 1), u),
        v
    );
}

/* ════════════════════════════════════════════
   PARTICLE — anchored, brand-colored
════════════════════════════════════════════ */
class Particle {
    constructor(hx, hy, brand) {
        this.hx = hx; this.hy = hy;   // HOME position (from logo pixel)
        this.brand = brand;
        this.x = hx; this.y = hy;
        this.vx = 0; this.vy = 0;
        this.sz = Math.random() * 1.6 + 1.4;  // 1.4–3.0 px
        this.seed = Math.random() * 2000;
        this.alpha = 0;
        this.scattering = false;
        this.svx = 0; this.svy = 0;
    }

    update(elapsed, mx, my) {
        /* ── Fade in ───────────────────────── */
        if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + 0.045);

        /* ── Scatter (exit) ────────────────── */
        if (this.scattering) {
            this.x += this.svx; this.y += this.svy;
            this.svx *= 0.93; this.svy *= 0.93;
            this.alpha = Math.max(0, this.alpha - 0.022);
            return;
        }

        /* ── Strong home attraction (steering) */
        // Primary: always pull back to exact home position
        const toHomeX = this.hx - this.x;
        const toHomeY = this.hy - this.y;
        this.vx += toHomeX * 0.14;
        this.vy += toHomeY * 0.14;

        /* ── Subtle Perlin noise shimmer ±4px ─ */
        const ns = 0.0022, nt = elapsed * 0.00014;
        const nx = noise2(this.hx * ns + nt + this.seed, this.hy * ns);
        const ny = noise2(this.hy * ns + nt, this.hx * ns + 80 + this.seed);
        this.vx += nx * 0.28;   // ≈ ±4px shimmer, not ±10px drift
        this.vy += ny * 0.28;

        /* ── Mouse repulsion ───────────────── */
        const dx = this.x - mx, dy = this.y - my;
        const dSq = dx * dx + dy * dy;
        const R = 70;
        if (dSq < R * R && dSq > 0.01) {
            const d = Math.sqrt(dSq);
            const f = (1 - d / R) * 5.5;
            this.vx += (dx / d) * f;
            this.vy += (dy / d) * f;
        }

        /* ── Damping (tight) ───────────────── */
        this.vx *= 0.72;   // strong damping → settles fast at home
        this.vy *= 0.72;
        this.x += this.vx;
        this.y += this.vy;
    }

    scatter() {
        this.scattering = true;
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        const a = Math.atan2(this.hy - cy, this.hx - cx) + (Math.random() - 0.5) * 0.9;
        const sp = 6 + Math.random() * 13;
        this.svx = Math.cos(a) * sp;
        this.svy = Math.sin(a) * sp;
    }

    draw(ctx) {
        const [r, g, b] = this.brand;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = this.sz * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
        ctx.restore();
    }
}

/* ════════════════════════════════════════════
   EXPORTS
════════════════════════════════════════════ */
export function initLoadingScreen() { _boot(); }
export function initCarbonLoader() { _boot(); }

/* ════════════════════════════════════════════
   BOOT
════════════════════════════════════════════ */
function _boot() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    screen.style.cursor = 'default';

    const W = window.innerWidth, H = window.innerHeight;

    /* ── WebGL2 background ──────────────── */
    const bg = _buildBG(screen, W, H);

    /* ── Particle canvas (built after logo loads) */
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = '/Resplandor_Logo.png';

    let particles = [], pCanvas = null, pCtx = null;
    let mouseX = W / 2, mouseY = H / 2, startTs = null, loopId = null;

    const onMM = e => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener('mousemove', onMM, { passive: true });

    function buildParticles() {
        /* Scale logo to 64% viewport width, max 660px */
        const maxW = Math.min(W * 0.64, 660);
        const sc = maxW / logoImg.naturalWidth;
        const lw = Math.round(logoImg.naturalWidth * sc);
        const lh = Math.round(logoImg.naturalHeight * sc);

        const off = document.createElement('canvas');
        off.width = lw; off.height = lh;
        const c2 = off.getContext('2d');
        c2.drawImage(logoImg, 0, 0, lw, lh);
        const pd = c2.getImageData(0, 0, lw, lh).data;

        /* Dense sampling: target 9000 particles */
        const stride = Math.max(1, Math.round(Math.sqrt((lw * lh) / 9000)));
        /* Center the logo on screen */
        const ox = Math.round((W - lw) / 2);
        const oy = Math.round((H - lh) / 2);

        for (let py = 0; py < lh; py += stride) {
            for (let px = 0; px < lw; px += stride) {
                const i = (py * lw + px) * 4;
                const a = pd[i + 3], r = pd[i], g = pd[i + 1], b = pd[i + 2];
                /* Skip transparent AND near-black pixels (logo background) */
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                if (a < 12 || luma < 28) continue;
                particles.push(new Particle(ox + px, oy + py, mapToBrand(r, g, b)));
            }
        }

        /* Particle canvas */
        pCanvas = document.createElement('canvas');
        pCanvas.width = W; pCanvas.height = H;
        Object.assign(pCanvas.style, {
            position: 'absolute', inset: '0',
            width: '100%', height: '100%',
            zIndex: '10', pointerEvents: 'none',
            cursor: 'default',
        });
        screen.appendChild(pCanvas);
        pCtx = pCanvas.getContext('2d');

        function render(ts) {
            if (!startTs) startTs = ts;
            pCtx.clearRect(0, 0, W, H);
            const elapsed = ts - startTs;
            for (const p of particles) p.update(elapsed, mouseX, mouseY);
            for (const p of particles) p.draw(pCtx);
            if (particles.some(p => p.alpha > 0.005)) loopId = requestAnimationFrame(render);
        }
        loopId = requestAnimationFrame(render);
    }

    logoImg.complete && logoImg.naturalWidth > 0
        ? buildParticles()
        : (logoImg.onload = buildParticles);

    /* ── Skip / Exit ─────────────────────── */
    let exiting = false;
    function doExit() {
        if (exiting) return;
        exiting = true;
        window.removeEventListener('mousemove', onMM);
        particles.forEach(p => p.scatter());
        bg.fadeOut();
        setTimeout(() => {
            cancelAnimationFrame(loopId);
            bg.stop();
            /* Smooth opacity-0 fade of entire screen */
            screen.style.transition = 'opacity 0.55s ease';
            screen.style.opacity = '0';
            screen.style.cursor = 'default';
            setTimeout(() => {
                screen.style.display = 'none';
                screen.style.opacity = '';
                document.body.classList.add('page-entered');
                document.dispatchEvent(new CustomEvent('resplandor:loaded'));
            }, 580);
        }, 1200);
    }

    const btn = document.getElementById('ls-skip');
    if (btn) btn.addEventListener('click', doExit, { once: true });
    document.addEventListener('keydown', e => e.key === 'Escape' && doExit(), { once: true });

    /* ── window.load trigger (min 2.5 s) ─── */
    const MIN_MS = 2500;
    const t0 = performance.now();
    function onLoaded() {
        const wait = MIN_MS - (performance.now() - t0);
        setTimeout(doExit, Math.max(0, wait));
    }
    document.readyState === 'complete'
        ? onLoaded()
        : window.addEventListener('load', onLoaded, { once: true });
}

/* ════════════════════════════════════════════
   WEBGL2 BACKGROUND
════════════════════════════════════════════ */
function _buildBG(screen, W, H) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cvs = document.createElement('canvas');
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(H * dpr);
    Object.assign(cvs.style, {
        position: 'absolute', inset: '0',
        width: '100%', height: '100%',
        zIndex: '0', pointerEvents: 'none', cursor: 'default',
        /* Neon global glow — light bleed on the canvas element */
        filter: 'drop-shadow(0 0 6px rgba(0,174,239,0.35)) drop-shadow(0 0 18px rgba(0,174,239,0.12))',
        transition: 'opacity 0.7s ease',
    });
    screen.insertBefore(cvs, screen.firstChild);

    const gl = cvs.getContext('webgl2');
    if (!gl) { screen.style.background = '#040c18'; return { fadeOut() { }, stop() { } }; }

    /* Compile & link */
    function mkShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            console.error('[Resplandor grid]', gl.getShaderInfoLog(s));
        return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uT = gl.getUniformLocation(prog, 'u_t');
    const uFade = gl.getUniformLocation(prog, 'u_fade');
    gl.uniform2f(uRes, cvs.width, cvs.height);

    let fadeVal = 0, fading = false, stopped = false, raf;
    const t0 = performance.now();

    (function loop() {
        if (stopped) return;
        const t = (performance.now() - t0) * 0.001;
        if (fading) fadeVal = Math.min(1, fadeVal + 0.022);
        gl.uniform1f(uT, t);
        gl.uniform1f(uFade, fadeVal);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        raf = requestAnimationFrame(loop);
    })();

    return {
        fadeOut() { fading = true; cvs.style.opacity = '0'; },
        stop() { stopped = true; cancelAnimationFrame(raf); gl.deleteProgram(prog); },
    };
}
