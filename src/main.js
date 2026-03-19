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

    // ── 2. Mobile Menu ──
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    if (menuBtn && mobileMenu && closeMenuBtn) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.remove('translate-x-full'));
        closeMenuBtn.addEventListener('click', () => mobileMenu.classList.add('translate-x-full'));
    }

    // ── 4. Sticky Header ──
    window.addEventListener('scroll', syncHeaderTheme, { passive: true });
    syncHeaderTheme();

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

    // ── 7. Theme Mode Toggle ──
    initThemeModeToggle();
});

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

function syncHeaderTheme() {
    const header = document.getElementById('header');
    if (!header) return;

    const isLight = document.body.classList.contains('light-mode');
    const scrolled = window.scrollY > 20;
    const lightBg = 'bg-[rgba(248,250,252,0.92)]';
    const darkBg = 'bg-[rgba(6,10,18,0.92)]';

    // Always remove previous theme background before applying
    header.classList.remove(lightBg, darkBg);

    if (scrolled) {
        header.classList.add(isLight ? lightBg : darkBg, 'backdrop-blur-md', 'shadow-md', 'py-2');
        header.classList.remove('bg-transparent', 'py-4');
    } else {
        header.classList.remove('backdrop-blur-md', 'shadow-md', 'py-2', lightBg, darkBg);
        header.classList.add('bg-transparent', 'py-4');
    }
}

/* ─────────────────────────────────────
   THEME MODE TOGGLE (DARK/LIGHT)
───────────────────────────────────── */
function initThemeModeToggle() {
    const toggleDesktop = document.getElementById('theme-mode-toggle');
    const toggleMobile = document.getElementById('theme-mode-toggle-mobile');

    // Restore preference (default dark)
    const saved = localStorage.getItem('resplandor_theme_mode');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        if (toggleDesktop) {
            toggleDesktop.classList.add('light');
            toggleDesktop.setAttribute('aria-pressed', 'true');
            toggleDesktop.setAttribute('title', 'Cambiar a Modo Oscuro');
        }
        if (toggleMobile) {
            toggleMobile.classList.add('light');
            toggleMobile.setAttribute('aria-pressed', 'true');
        }
    }

    // Ensure header matches the restored mode
    syncHeaderTheme();

    // Function to handle toggle
    const handleToggle = (toggle) => {
        const isLight = document.body.classList.toggle('light-mode');
        toggle.classList.toggle('light', isLight);
        toggle.setAttribute('aria-pressed', String(isLight));
        toggle.setAttribute('title', isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro');
        localStorage.setItem('resplandor_theme_mode', isLight ? 'light' : 'dark');
        syncHeaderTheme();
    };

    if (toggleDesktop) {
        toggleDesktop.addEventListener('click', () => handleToggle(toggleDesktop));
    }
    if (toggleMobile) {
        toggleMobile.addEventListener('click', () => handleToggle(toggleMobile));
    }
}
