import './style.css'
import './loading.css'
import { initLoadingScreen } from './loading.js'
import { initParticlesBg } from './particles-bg.js'

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Loading Screen ──
    initLoadingScreen();

    // ── 1b. Ambient background particles (after loader exits) ──
    document.addEventListener('resplandor:loaded', () => {
        initParticlesBg();
    }, { once: true });

    // ── 2. Custom Cursor ──
    initCustomCursor();

    // ── 3. Mobile Menu ──
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    if (menuBtn && mobileMenu && closeMenuBtn) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.remove('translate-x-full'));
        closeMenuBtn.addEventListener('click', () => mobileMenu.classList.add('translate-x-full'));
    }

    // ── 4. Sticky Header ──
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('bg-[rgba(6,10,18,0.92)]', 'backdrop-blur-md', 'shadow-md', 'py-2');
                header.classList.remove('bg-transparent', 'py-4');
            } else {
                header.classList.remove('bg-[rgba(6,10,18,0.92)]', 'backdrop-blur-md', 'shadow-md', 'py-2');
                header.classList.add('bg-transparent', 'py-4');
            }
        }, { passive: true });
    }

    // ── 5. Scroll Reveal ──
    const revealElements = document.querySelectorAll('.reveal-hidden');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
        });
    }, { root: null, rootMargin: '0px', threshold: 0.12 });

    revealElements.forEach(el => revealObserver.observe(el));

    // Initial reveal for elements already visible
    setTimeout(() => {
        revealElements.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight)
                el.classList.add('reveal-visible');
        });
    }, 100);

    // ── 6. Hero Parallax ──
    initParallax();

    // ── 7. Code/Night Mode Toggle ──
    initCodeModeToggle();
});

/* ─────────────────────────────────────
   CUSTOM CURSOR
───────────────────────────────────── */
function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const trail = document.getElementById('cursor-trail');
    if (!dot || !trail) return;

    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;
    let rafId;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Dot follows instantly
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
    }, { passive: true });

    // Trail follows with easing via RAF
    function animateTrail() {
        trailX += (mouseX - trailX) * 0.14;
        trailY += (mouseY - trailY) * 0.14;
        trail.style.left = `${trailX}px`;
        trail.style.top = `${trailY}px`;
        rafId = requestAnimationFrame(animateTrail);
    }
    animateTrail();

    // Hover state for interactive elements
    const interactiveEls = document.querySelectorAll('a, button, [role="button"], input, textarea, label, select');
    interactiveEls.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        trail.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        trail.style.opacity = '1';
    });
}

/* ─────────────────────────────────────
   HERO PARALLAX
───────────────────────────────────── */
function initParallax() {
    const heroBg = document.getElementById('hero-bg-layer');
    if (!heroBg) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroSection = document.getElementById('hero');
                if (!heroSection) return;
                const heroHeight = heroSection.offsetHeight;
                // Only apply parallax while hero is in view
                if (scrollY < heroHeight + 100) {
                    const offset = scrollY * 0.28; // subtle movement
                    heroBg.style.transform = `translateY(${offset}px) scale(1.08)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/* ─────────────────────────────────────
   CODE / NIGHT MODE TOGGLE
───────────────────────────────────── */
function initCodeModeToggle() {
    const toggle = document.getElementById('code-mode-toggle');
    if (!toggle) return;

    // Restore preference
    const saved = localStorage.getItem('resplandor_code_mode');
    if (saved === '1') {
        document.body.classList.add('code-mode');
        toggle.classList.add('active');
        toggle.setAttribute('aria-pressed', 'true');
    }

    toggle.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('code-mode');
        toggle.classList.toggle('active', isActive);
        toggle.setAttribute('aria-pressed', String(isActive));
        localStorage.setItem('resplandor_code_mode', isActive ? '1' : '0');
    });
}
