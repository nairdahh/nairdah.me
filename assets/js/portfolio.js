/* ============================================
   PORTFOLIO - Adrian-Nicolae Neacsu
   JavaScript - Theme, Animations, Interactions
   ============================================ */

// ============================================
// 1. THEME MANAGER
// ============================================
const ThemeManager = {
  STORAGE_KEY: 'portfolio-theme',

  init() {
    // Check for saved theme or system preference
    const savedTheme = this.getStoredTheme();
    const systemPreference = this.getSystemPreference();
    const theme = savedTheme || systemPreference;

    // Apply theme immediately (before DOM content loaded to prevent flash)
    this.setTheme(theme);
    this.bindEvents();
  },

  getStoredTheme() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {
      return null;
    }
  },

  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (e) {
      // localStorage not available
    }
  },

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  bindEvents() {
    // Theme toggle button
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)')
        .addEventListener('change', (e) => {
          // Only update if user hasn't manually set a preference
          if (!this.getStoredTheme()) {
            this.setTheme(e.matches ? 'light' : 'dark');
          }
        });
    }
  }
};

// ============================================
// 2. HEADER SCROLL BEHAVIOR
// ============================================
const HeaderScroll = {
  header: null,
  scrollThreshold: 50,

  init() {
    this.header = document.querySelector('.header');
    if (!this.header) return;

    this.handleScroll();
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
  },

  handleScroll() {
    if (window.scrollY > this.scrollThreshold) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
  }
};

// ============================================
// 3. MOBILE NAVIGATION
// ============================================
const MobileNav = {
  toggle: null,
  nav: null,

  init() {
    this.toggle = document.querySelector('.mobile-menu-toggle');
    this.nav = document.querySelector('.header__nav');

    if (!this.toggle || !this.nav) return;

    this.toggle.addEventListener('click', () => this.toggleMenu());

    // Close menu when clicking nav links
    this.nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.toggle.contains(e.target) && !this.nav.contains(e.target)) {
        this.closeMenu();
      }
    });
  },

  toggleMenu() {
    this.toggle.classList.toggle('active');
    this.nav.classList.toggle('active');
    document.body.style.overflow = this.nav.classList.contains('active') ? 'hidden' : '';
  },

  closeMenu() {
    this.toggle.classList.remove('active');
    this.nav.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// ============================================
// 4. SCROLL ANIMATIONS
// ============================================
const ScrollAnimations = {
  init() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements
      document.querySelectorAll('[data-animate]').forEach(el => {
        el.classList.add('animate-in');
      });
      return;
    }

    this.observeElements();
  },

  observeElements() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }
};

// ============================================
// 5. PROJECT CARDS
// ============================================
const ProjectCards = {
  init() {
    this.setAnimationDelays();
    this.addKeyboardNavigation();
  },

  setAnimationDelays() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
      card.style.setProperty('--card-index', index);
    });
  },

  addKeyboardNavigation() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
      // Make cards focusable
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }

      // Navigate on Enter or Space
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const link = card.getAttribute('data-href') || card.querySelector('a')?.href;
          if (link) {
            window.location.href = link;
          }
        }
      });
    });
  }
};

// ============================================
// 6. SMOOTH SCROLL
// ============================================
const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
};

// ============================================
// 7. SCREENSHOT GALLERY (Lightbox)
// ============================================
const Gallery = {
  init() {
    const screenshots = document.querySelectorAll('.screenshot-item img');
    if (screenshots.length === 0) return;

    screenshots.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => this.openLightbox(img.src, img.alt));
    });

    // Close lightbox on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLightbox();
      }
    });
  },

  openLightbox(src, alt) {
    // Create lightbox if it doesn't exist
    let lightbox = document.querySelector('.lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <div class="lightbox__overlay"></div>
        <div class="lightbox__content">
          <button class="lightbox__close" aria-label="Close">&times;</button>
          <img src="" alt="" />
        </div>
      `;
      document.body.appendChild(lightbox);

      // Add styles dynamically
      const style = document.createElement('style');
      style.textContent = `
        .lightbox {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
        }
        .lightbox.active {
          opacity: 1;
          visibility: visible;
        }
        .lightbox__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          cursor: pointer;
        }
        .lightbox__content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          z-index: 1;
        }
        .lightbox__content img {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .lightbox__close {
          position: absolute;
          top: -40px;
          right: 0;
          width: 36px;
          height: 36px;
          font-size: 28px;
          color: white;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .lightbox__close:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);

      // Close on overlay click
      lightbox.querySelector('.lightbox__overlay').addEventListener('click', () => this.closeLightbox());
      lightbox.querySelector('.lightbox__close').addEventListener('click', () => this.closeLightbox());
    }

    // Set image and show
    const img = lightbox.querySelector('img');
    img.src = src;
    img.alt = alt || '';

    requestAnimationFrame(() => {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  },

  closeLightbox() {
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
};

// ============================================
// 8. CURRENT YEAR
// ============================================
const CurrentYear = {
  init() {
    const yearElements = document.querySelectorAll('[data-year]');
    const year = new Date().getFullYear();
    yearElements.forEach(el => {
      el.textContent = year;
    });
  }
};

// ============================================
// 9. INITIALIZATION
// ============================================

// Initialize theme immediately to prevent flash
ThemeManager.init();

// Initialize everything else when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  HeaderScroll.init();
  MobileNav.init();
  ScrollAnimations.init();
  ProjectCards.init();
  SmoothScroll.init();
  Gallery.init();
  CurrentYear.init();
});

// Export for potential external use
window.Portfolio = {
  ThemeManager,
  HeaderScroll,
  MobileNav,
  ScrollAnimations,
  ProjectCards,
  SmoothScroll,
  Gallery
};
