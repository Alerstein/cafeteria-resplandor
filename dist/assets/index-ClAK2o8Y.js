(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const l of e.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function s(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function r(t){if(t.ep)return;t.ep=!0;const e=s(t);fetch(t.href,e)}})();const L=`#version 300 es
in vec2 pos;
void main() { gl_Position = vec4(pos, 0.0, 1.0); }`,w=`#version 300 es
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
}`;function E(){S()}function S(){const o=document.getElementById("loading-screen");if(!o)return;o.style.cursor="default";const a=window.innerWidth,s=window.innerHeight,r=I(o,a,s),t=document.createElement("div");t.id="ls-logo-wrap";const e=document.createElement("img");e.id="ls-logo-img",e.alt="Resplandor",e.draggable=!1,t.appendChild(e),o.appendChild(t);const l=new Image;l.onload=()=>{const c=document.createElement("canvas");c.width=l.naturalWidth,c.height=l.naturalHeight;const d=c.getContext("2d");d.drawImage(l,0,0);const n=d.getImageData(0,0,c.width,c.height),f=n.data;for(let u=0;u<f.length;u+=4).299*f[u]+.587*f[u+1]+.114*f[u+2]<55&&(f[u+3]=0);d.putImageData(n,0,0),e.src=c.toDataURL("image/png")},e.src="/Resplandor_Logo.png",l.src="/Resplandor_Logo.png";let i=!1;function v(){i||(i=!0,r.fadeOut(),o.style.transition="opacity 0.6s ease",o.style.opacity="0",o.style.cursor="default",setTimeout(()=>{r.stop(),o.style.display="none",o.style.opacity="",document.body.classList.add("page-entered"),document.dispatchEvent(new CustomEvent("resplandor:loaded"))},650))}const m=document.getElementById("ls-skip");m&&m.addEventListener("click",v,{once:!0}),document.addEventListener("keydown",c=>c.key==="Escape"&&v(),{once:!0});const x=4e3,b=performance.now();function y(){const c=x-(performance.now()-b);setTimeout(v,Math.max(0,c))}document.readyState==="complete"?y():window.addEventListener("load",y,{once:!0})}function I(o,a,s){const r=Math.min(window.devicePixelRatio||1,1.5),t=document.createElement("canvas");t.width=Math.round(a*r),t.height=Math.round(s*r),Object.assign(t.style,{position:"absolute",inset:"0",width:"100%",height:"100%",zIndex:"0",pointerEvents:"none",cursor:"default",filter:"drop-shadow(0 0 6px rgba(0,174,239,0.35)) drop-shadow(0 0 18px rgba(0,174,239,0.12))",transition:"opacity 0.7s ease"}),o.insertBefore(t,o.firstChild);const e=t.getContext("webgl2");if(!e)return o.style.background="#040c18",{fadeOut(){},stop(){}};function l(g,p){const h=e.createShader(g);return e.shaderSource(h,p),e.compileShader(h),e.getShaderParameter(h,e.COMPILE_STATUS)||console.error("[Resplandor grid]",e.getShaderInfoLog(h)),h}const i=e.createProgram();e.attachShader(i,l(e.VERTEX_SHADER,L)),e.attachShader(i,l(e.FRAGMENT_SHADER,w)),e.linkProgram(i),e.useProgram(i);const v=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,v),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW);const m=e.getAttribLocation(i,"pos");e.enableVertexAttribArray(m),e.vertexAttribPointer(m,2,e.FLOAT,!1,0,0);const x=e.getUniformLocation(i,"u_res"),b=e.getUniformLocation(i,"u_t"),y=e.getUniformLocation(i,"u_fade");e.uniform2f(x,t.width,t.height);let c=0,d=!1,n=!1,f;const u=performance.now();return(function g(){if(n)return;const p=(performance.now()-u)*.001;d&&(c=Math.min(1,c+.022)),e.uniform1f(b,p),e.uniform1f(y,c),e.drawArrays(e.TRIANGLE_STRIP,0,4),f=requestAnimationFrame(g)})(),{fadeOut(){d=!0,t.style.opacity="0"},stop(){n=!0,cancelAnimationFrame(f),e.deleteProgram(i)}}}function A(){if(document.getElementById("rsp-particle-bg"))return;const o=document.createElement("canvas");o.id="rsp-particle-bg",o.style.cssText=`
        position:fixed; inset:0; width:100%; height:100%;
        z-index:0; pointer-events:none;
        opacity:0; transition: opacity 1.2s ease;
    `,document.body.insertBefore(o,document.body.firstChild);const a=o.getContext("2d");if(!a)return;let s,r,t=s/2,e=r/2,l=!1;function i(){s=o.width=window.innerWidth,r=o.height=window.innerHeight}i(),window.addEventListener("resize",i,{passive:!0}),document.addEventListener("mousemove",d=>{t=d.clientX,e=d.clientY,l=!0},{passive:!0});const v=90,m=[];for(let d=0;d<v;d++)m.push(x(s,r));function x(d,n){return{x:Math.random()*d,y:Math.random()*n,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.6+.4,alpha:Math.random()*.35+.05,type:Math.random()>.55?0:1,phase:Math.random()*Math.PI*2}}const b="rgba(250,204,21,",y="rgba(59,130,246,";function c(d){a.clearRect(0,0,s,r);for(const n of m){if(n.x+=n.vx,n.y+=n.vy,n.y+=Math.sin(d*3e-4+n.phase)*.12,l){const u=t-n.x,g=e-n.y,p=Math.sqrt(u*u+g*g);if(p<200){const h=(1-p/200)*.015;n.vx+=u/p*h,n.vy+=g/p*h}}n.vx*=.98,n.vy*=.98,n.x<-5&&(n.x=s+5),n.x>s+5&&(n.x=-5),n.y<-5&&(n.y=r+5),n.y>r+5&&(n.y=-5);const f=n.type===0?b:y;a.beginPath(),a.arc(n.x,n.y,n.r,0,Math.PI*2),a.fillStyle=f+n.alpha+")",a.fill()}requestAnimationFrame(c)}requestAnimationFrame(()=>{requestAnimationFrame(()=>{o.style.opacity="1"})}),requestAnimationFrame(c)}document.addEventListener("DOMContentLoaded",()=>{E(),document.addEventListener("resplandor:loaded",()=>{A()},{once:!0});const o=document.getElementById("mobile-menu-btn"),a=document.getElementById("mobile-menu"),s=document.getElementById("close-menu-btn");o&&a&&s&&(o.addEventListener("click",()=>a.classList.remove("translate-x-full")),s.addEventListener("click",()=>a.classList.add("translate-x-full")));const r=document.getElementById("header");r&&window.addEventListener("scroll",()=>{window.scrollY>20?(r.classList.add("bg-[rgba(6,10,18,0.92)]","backdrop-blur-md","shadow-md","py-2"),r.classList.remove("bg-transparent","py-4")):(r.classList.remove("bg-[rgba(6,10,18,0.92)]","backdrop-blur-md","shadow-md","py-2"),r.classList.add("bg-transparent","py-4"))},{passive:!0});const t=document.querySelectorAll(".reveal-hidden"),e=new IntersectionObserver(l=>{l.forEach(i=>{i.isIntersecting&&i.target.classList.add("reveal-visible")})},{root:null,rootMargin:"0px",threshold:.12});t.forEach(l=>e.observe(l)),setTimeout(()=>{t.forEach(l=>{l.getBoundingClientRect().top<window.innerHeight&&l.classList.add("reveal-visible")})},100),_(),M()});function _(){const o=document.getElementById("hero-bg-layer");if(!o)return;let a=!1;window.addEventListener("scroll",()=>{a||(requestAnimationFrame(()=>{const s=window.scrollY,r=document.getElementById("hero");if(!r)return;const t=r.offsetHeight;if(s<t+100){const e=s*.28;o.style.transform=`translateY(${e}px) scale(1.08)`}a=!1}),a=!0)},{passive:!0})}function M(){const o=document.getElementById("code-mode-toggle");if(!o)return;localStorage.getItem("resplandor_code_mode")==="1"&&(document.body.classList.add("code-mode"),o.classList.add("active"),o.setAttribute("aria-pressed","true")),o.addEventListener("click",()=>{const s=document.body.classList.toggle("code-mode");o.classList.toggle("active",s),o.setAttribute("aria-pressed",String(s)),localStorage.setItem("resplandor_code_mode",s?"1":"0")})}
