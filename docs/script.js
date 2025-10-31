// Mobile menu toggle for main navigation
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('!hidden');
    navLinks.classList.toggle('!flex');
    this.setAttribute('aria-expanded', navLinks.classList.contains('!flex'));
  });
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('nav') && navLinks) {
    navLinks.classList.add('!hidden');
    navLinks.classList.remove('!flex');
    if (mobileMenuToggle) {
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
  }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Close mobile menu after clicking
    if (navLinks && navLinks.classList.contains('!flex')) {
      navLinks.classList.add('!hidden');
      navLinks.classList.remove('!flex');
    }
  });
});

// Documentation sidebar toggle for mobile
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebarContent = document.querySelector('.sidebar-content');

if (sidebarToggle && sidebarContent) {
  sidebarToggle.addEventListener('click', function() {
    sidebarContent.classList.toggle('active');
    this.classList.toggle('active');
    this.setAttribute('aria-expanded', sidebarContent.classList.contains('active'));
  });
}

// Active link highlighting in documentation sidebar
const currentPath = window.location.pathname;
const currentHash = window.location.hash;

// Highlight current section in sidebar
function updateActiveLink() {
  const sidebarLinks = document.querySelectorAll('.sidebar-section a');

  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');

    if (href === currentHash || (currentHash && href.includes(currentHash))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Update active link on load and hash change
if (document.querySelector('.docs-sidebar')) {
  updateActiveLink();

  window.addEventListener('hashchange', updateActiveLink);

  // Update active link on scroll
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        const sections = document.querySelectorAll('.docs-section[id]');
        let current = '';

        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.clientHeight;

          if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
          }
        });

        if (current) {
          const sidebarLinks = document.querySelectorAll('.sidebar-section a');
          sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
              link.classList.add('active');
            }
          });
        }

        ticking = false;
      });

      ticking = true;
    }
  });
}
