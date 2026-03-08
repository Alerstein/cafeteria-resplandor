/**
 * Resplandor — Ambient Particle Background
 * Lightweight 2D canvas with micro-dots drifting softly.
 * Activated AFTER the loading screen exits.
 * pointer-events: none — never blocks site interaction.
 */

export function initParticlesBg() {
    // Only run if page has entered (loader done)
    // Also guard against double-init
    if (document.getElementById('rsp-particle-bg')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'rsp-particle-bg';
    canvas.style.cssText = `
        position:fixed; inset:0; width:100%; height:100%;
        z-index:0; pointer-events:none;
        opacity:0; transition: opacity 1.2s ease;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W, H;
    let mouseX = W / 2, mouseY = H / 2;
    let mouseActive = false;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Track mouse for subtle attraction (after loader gone)
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseActive = true;
    }, { passive: true });

    // ── Particle pool ──
    const COUNT = 90;
    const particles = [];

    for (let i = 0; i < COUNT; i++) {
        particles.push(_makeParticle(W, H));
    }

    function _makeParticle(W, H) {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.6 + 0.4,
            alpha: Math.random() * 0.35 + 0.05,
            // Color: 0=yellow, 1=blue
            type: Math.random() > 0.55 ? 0 : 1,
            phase: Math.random() * Math.PI * 2,
        };
    }

    const YELLOW = 'rgba(250,204,21,';
    const BLUE = 'rgba(59,130,246,';

    function draw(ts) {
        ctx.clearRect(0, 0, W, H);

        for (const p of particles) {
            // Gentle drift
            p.x += p.vx;
            p.y += p.vy;

            // Slow oscillation
            p.y += Math.sin(ts * 0.0003 + p.phase) * 0.12;

            // Subtle mouse attraction (very soft)
            if (mouseActive) {
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) {
                    const force = (1 - dist / 200) * 0.015;
                    p.vx += dx / dist * force;
                    p.vy += dy / dist * force;
                }
            }

            // Dampen velocity
            p.vx *= 0.98;
            p.vy *= 0.98;

            // Wrap around edges
            if (p.x < -5) p.x = W + 5;
            if (p.x > W + 5) p.x = -5;
            if (p.y < -5) p.y = H + 5;
            if (p.y > H + 5) p.y = -5;

            // Draw
            const col = p.type === 0 ? YELLOW : BLUE;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = col + p.alpha + ')';
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    // Fade in after a short delay
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            canvas.style.opacity = '1';
        });
    });

    requestAnimationFrame(draw);
}
