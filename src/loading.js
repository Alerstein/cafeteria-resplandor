/**
 * Resplandor — Loading Screen (Real Logo Version)
 * Sequence: BG → Logo PNG fade-in with glow → Text Reveal → Dot blink → Tagline → Exit
 * Total duration: ~4.5s
 */

export function initLoadingScreen() {
    // Skip if user has seen it recently (within 30 min)
    const lastSeen = localStorage.getItem('resplandor_loaded');
    const now = Date.now();
    if (lastSeen && now - parseInt(lastSeen) < 30 * 60 * 1000) {
        const screen = document.getElementById('loading-screen');
        if (screen) screen.style.display = 'none';
        document.body.classList.add('page-entered');
        return;
    }

    const screen = document.getElementById('loading-screen');
    if (!screen) return;

    // Prevent scroll during loading
    document.body.style.overflow = 'hidden';

    // Phase 1: Particles
    createParticles();

    // Phase 2: Logo image fade-in with golden glow (0.6s delay)
    const logoImg = document.getElementById('ls-logo-img');
    const logoRing = document.getElementById('ls-logo-ring');
    setTimeout(() => {
        if (logoImg) logoImg.classList.add('ls-logo--visible');
        if (logoRing) {
            setTimeout(() => logoRing.classList.add('ls-ring--active'), 400);
        }
    }, 600);

    // Phase 3: Text reveal (0.6 + 1.4s = 2.0s)
    setTimeout(() => {
        revealText();
    }, 2000);

    // Phase 4: Dot pulse (2.0 + 1.5s = 3.5s)
    setTimeout(() => {
        const dot = document.getElementById('ls-dot');
        if (dot) dot.classList.add('ls-dot--visible');
    }, 3500);

    // Phase 4b: Tagline (3.5 + 0.35s = 3.85s)
    setTimeout(() => {
        const tagline = document.getElementById('ls-tagline');
        if (tagline) tagline.classList.add('ls-tagline--visible');
    }, 3850);

    // Phase 5: Exit transition (3.85 + 0.9s ≈ 4.75s wait)
    let exitTimer = setTimeout(() => {
        exitAnimation(screen);
    }, 4750);

    // Skip: button click or ESC key
    const skipFn = () => {
        clearTimeout(exitTimer);
        exitAnimation(screen);
    };
    screen.addEventListener('skip', skipFn, { once: true });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') skipFn();
    }, { once: true });

    // Mouse glow tracking
    screen.addEventListener('mousemove', (e) => {
        const glow = document.getElementById('ls-glow');
        if (!glow) return;
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(250,204,21,0.08) 0%, rgba(30,64,175,0.06) 40%, transparent 65%)`;
    });
}

/* ── Particle system ── */
function createParticles() {
    const container = document.getElementById('ls-particles');
    if (!container) return;
    const COUNT = 40;
    for (let i = 0; i < COUNT; i++) {
        const p = document.createElement('div');
        p.className = 'ls-particle ' + (Math.random() > 0.6 ? 'yellow' : 'blue');
        const size = Math.random() * 2 + 0.8;
        p.style.cssText = `
            width:${size}px;height:${size}px;
            left:${Math.random() * 100}%;
            top:${Math.random() * 100}%;
            animation-delay:${Math.random() * 6}s;
            animation-duration:${Math.random() * 9 + 7}s;
            opacity:${Math.random() * 0.5 + 0.1};
        `;
        container.appendChild(p);
    }
}

/* ── Carbón Deslizante text reveal ── */
function revealText() {
    const textEl = document.getElementById('ls-brand-text');
    if (!textEl) return;
    textEl.classList.add('ls-text--active');

    // Particle sparks during reveal
    const sparkContainer = document.getElementById('ls-text-sparks');
    const totalDuration = 1500;

    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const spark = document.createElement('div');
            spark.className = 'ls-text-spark';
            const progress = i / 10;
            spark.style.left = `${progress * 100}%`;
            spark.style.top = `${Math.random() * 70 + 15}%`;
            sparkContainer.appendChild(spark);
            setTimeout(() => spark.remove(), 600);
        }, (i / 10) * totalDuration);
    }
}

/* ── Exit animation  ── */
function exitAnimation(screen) {
    const logoGroup = document.getElementById('ls-logo-group');
    screen.classList.add('ls-screen--exit');
    if (logoGroup) logoGroup.classList.add('ls-logo--exit');

    setTimeout(() => {
        screen.style.display = 'none';
        document.body.style.overflow = '';
        document.body.classList.add('page-entered');
        localStorage.setItem('resplandor_loaded', Date.now().toString());
    }, 900);
}
