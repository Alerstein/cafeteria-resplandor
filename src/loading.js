/**
 * Resplandor — Loading Screen (Solid Logo + Shine Sweep Edition)
 *
 * Logo: Resplandor_Logo.png displayed as a solid, crisp <img>.
 * Shine: diagonal neon sweep (Electric Blue / White) cycling L→R.
 * Background: WebGL2 neon-grid shader with independent neon pulses.
 * Cursor: system default at all times inside #loading-screen.
 * Exit: smooth opacity fade-out on window load (min 4 s display).
 */

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
float pulse(int axis, float lineIdx, float coordAlong, float coordPerp, float cellSz) {
    float seed  = h11(lineIdx * 7.3 + float(axis) * 13.7);
    float speed = mix(0.08, 0.22, seed);
    float phase = h11(seed * 91.3);
    float pPos  = fract(u_t * speed + phase);
    float width = mix(0.04, 0.10, h11(seed * 17.1));
    float dist  = abs(coordAlong - pPos);
    dist = min(dist, 1.0 - dist);
    float intensity = smoothstep(width, 0.0, dist);
    float onLine = smoothstep(0.018 * cellSz, 0.0, coordPerp);
    return intensity * onLine * mix(0.6, 1.0, h11(seed));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

    /* ── Grid geometry ────────────────── */
    float cellLarge = 0.085;
    float cellSmall = 0.042;

    vec2 gL = abs(mod(uv, cellLarge) - 0.5 * cellLarge);
    float lineL = min(gL.x, gL.y);
    float gridL = smoothstep(0.0065, 0.0, lineL);

    vec2 gS = abs(mod(uv, cellSmall) - 0.5 * cellSmall);
    float lineS = min(gS.x, gS.y);
    float gridS = smoothstep(0.0030, 0.0, lineS) * 0.30;

    float gridMask = max(gridL, gridS);

    /* ── Neon pulses on large grid lines ─ */
    vec2 uvN = (uv + 0.9) / 1.8;

    float rowIdx    = floor((uv.y + 0.9) / cellLarge);
    float perpH     = gL.y;
    float alongH    = fract(uvN.x);
    float pulseH    = pulse(0, rowIdx, alongH, perpH, cellLarge);

    float rowIdx2   = floor((uv.y + 0.9) / cellSmall);
    float perpH2    = gS.y;
    float pulseH2   = pulse(0, rowIdx2 + 100.0, alongH, perpH2, cellSmall) * 0.5;

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
    vec3 bg   = vec3(0.008, 0.016, 0.030);

    vec3 gridCol  = mix(blue, gold, ripple * 0.55);
    vec3 pulseCol = mix(blue * 1.6, vec3(1.0, 0.92, 0.5), totalPulse * 0.7);

    float baseBright = gridMask * mix(0.25, 0.85, ripple);
    vec3 col = mix(bg, gridCol, baseBright);
    col += pulseCol * totalPulse * 0.9;

    float shimmer = h21(floor(uv / cellLarge)) * 0.15;
    col += gridCol * shimmer * gridMask;

    col *= smoothstep(0.0, 1.2, u_t);
    col  = mix(col, vec3(0.0), u_fade * u_fade);

    fragColor = vec4(col, 1.0);
}`;

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

    /* ── WebGL2 neon-grid background ──── */
    const bg = _buildBG(screen, W, H);

    /* ── Logo + shine sweep ─────────────
       Two-layer background elimination:
       1. JS strips any pixel with luma < 55 (catches dark blue-grey PNG bg)
       2. CSS mix-blend-mode: screen on the wrapper removes any residual tint
       Result: only the bright cup + text are visible above the neon grid.
    ────────────────────────────────────── */
    const wrap = document.createElement('div');
    wrap.id = 'ls-logo-wrap';

    const logo = document.createElement('img');
    logo.id = 'ls-logo-img';
    logo.alt = 'Resplandor';
    logo.draggable = false;

    wrap.appendChild(logo);
    screen.appendChild(wrap);

    /* Strip near-black / dark-bg pixels from the PNG in-browser */
    const srcImg = new Image();
    srcImg.onload = () => {
        const oc = document.createElement('canvas');
        oc.width = srcImg.naturalWidth;
        oc.height = srcImg.naturalHeight;
        const ctx = oc.getContext('2d');
        ctx.drawImage(srcImg, 0, 0);
        const id = ctx.getImageData(0, 0, oc.width, oc.height);
        const d = id.data;
        // Raise threshold to 55 to catch dark-blue-grey backgrounds
        for (let i = 0; i < d.length; i += 4) {
            const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (luma < 55) d[i + 3] = 0;
        }
        ctx.putImageData(id, 0, 0);
        logo.src = oc.toDataURL('image/png');
    };
    // Fallback: show original while canvas processes
    logo.src = '/Resplandor_Logo.png';
    srcImg.src = '/Resplandor_Logo.png';



    /* ── Skip / Exit ─────────────────── */
    let exiting = false;
    function doExit() {
        if (exiting) return;
        exiting = true;
        bg.fadeOut();
        /* Smooth opacity-0 fade of entire screen */
        screen.style.transition = 'opacity 0.6s ease';
        screen.style.opacity = '0';
        screen.style.cursor = 'default';
        setTimeout(() => {
            bg.stop();
            screen.style.display = 'none';
            screen.style.opacity = '';
            document.body.classList.add('page-entered');
            document.dispatchEvent(new CustomEvent('resplandor:loaded'));
        }, 650);
    }

    const btn = document.getElementById('ls-skip');
    if (btn) btn.addEventListener('click', doExit, { once: true });
    document.addEventListener('keydown', e => e.key === 'Escape' && doExit(), { once: true });

    /* ── window.load trigger (min 4 s) ── */
    const MIN_MS = 4000;
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
        filter: 'drop-shadow(0 0 6px rgba(0,174,239,0.35)) drop-shadow(0 0 18px rgba(0,174,239,0.12))',
        transition: 'opacity 0.7s ease',
    });
    screen.insertBefore(cvs, screen.firstChild);

    const gl = cvs.getContext('webgl2');
    if (!gl) { screen.style.background = '#040c18'; return { fadeOut() { }, stop() { } }; }

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
