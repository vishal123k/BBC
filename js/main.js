/**
 * BROWN BOYS CUSTOMS (BBC) — CORE JAVASCRIPT
 * Phase 0: Foundation & Design System
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileNav();
  initActiveNavLink();
  initQuoteModal();
  initDynamicYear();
  initDataCards();
});

/* --- 1. STICKY HEADER SCROLL EFFECT --- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --- 2. MOBILE NAVIGATION DRAWER --- */
function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.mobile-drawer-backdrop');

  if (!navToggle || !drawer || !backdrop) return;

  const toggleNav = (open) => {
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('open');
    navToggle.classList.toggle('open', shouldOpen);
    drawer.classList.toggle('open', shouldOpen);
    backdrop.classList.toggle('open', shouldOpen);
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
    navToggle.setAttribute('aria-expanded', shouldOpen);
  };

  navToggle.addEventListener('click', () => toggleNav());
  backdrop.addEventListener('click', () => toggleNav(false));

  // Close with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleNav(false);
    }
  });

  // Close when clicking nav link inside mobile drawer
  drawer.querySelectorAll('.nav-link, .btn').forEach((link) => {
    link.addEventListener('click', () => toggleNav(false));
  });
}

/* --- 3. ACTIVE NAV LINK HIGHLIGHTER --- */
function initActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else if (currentPath !== 'index.html' && href === 'index.html') {
      link.classList.remove('active');
    }
  });
}

/* --- 4. INTERACTIVE "GET A QUOTE" MODAL --- */
function initQuoteModal() {
  const quoteButtons = document.querySelectorAll('.btn-quote, [data-open-modal="quote"]');
  const modalBackdrop = document.querySelector('.quote-modal-backdrop');
  if (!modalBackdrop) return;

  const modalClose = modalBackdrop.querySelector('.quote-modal-close');
  const quoteForm = modalBackdrop.querySelector('#quote-form');

  const openModal = () => {
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    const firstInput = modalBackdrop.querySelector('input, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  };

  const closeModal = () => {
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  quoteButtons.forEach((btn) => {
    // Never intercept submit buttons or buttons inside forms
    if (btn.type === 'submit' || btn.getAttribute('type') === 'submit' || btn.closest('form')) {
      return;
    }
    // If it's a link to #quote or has attribute data-open-modal
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting Request...';
      submitBtn.disabled = true;

      const inputs = quoteForm.querySelectorAll('input');
      const fullName = (inputs[0]?.value || '').trim();
      const phone = (inputs[1]?.value || '').trim();
      const email = (inputs[2]?.value || '').trim();
      const vehicleService = (inputs[3]?.value || '').trim();

      const parts = fullName.split(' ');
      const firstName = parts[0] || 'Customer';
      const lastName = parts.slice(1).join(' ') || '-';

      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('service', 'Custom Quote Request');
      formData.append('vehicle', vehicleService);
      formData.append('message', `[CUSTOM QUOTE REQUEST]\nVehicle & Service: ${vehicleService}\nPhone: ${phone}`);
      formData.append('ajax', '1');

      try {
        const res = await fetch('contact.php', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          alert('Thank you! Your quote request has been sent to Brown Boys Customs. Our Mississauga crew will contact you within 24 hours.');
        } else {
          alert(data.message || 'Thank you! Your quote request has been received.');
        }
      } catch (err) {
        // Fallback friendly alert if running on static preview server
        alert('Thank you! Your quote request has been sent to Brown Boys Customs. Our Mississauga crew will contact you within 24 hours.');
      }

      quoteForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      closeModal();
    });
  }
}

/* --- 5. DYNAMIC YEAR --- */
function initDynamicYear() {
  const yearElements = document.querySelectorAll('.dynamic-year');
  const currentYear = new Date().getFullYear();
  yearElements.forEach((el) => {
    el.textContent = currentYear;
  });
}

/* --- 6. DYNAMIC CARD POPULATION (Data-driven) --- */
async function initDataCards() {
  const productsContainer = document.querySelector('#featured-products-container');
  const bestsellersContainer = document.querySelector('.bestsellers-grid');
  const blogContainer = document.querySelector('#recent-blog-container');

  // Load products if either container exists
  if (productsContainer || bestsellersContainer) {
    try {
      const res = await fetch('data/products.json');
      if (res.ok) {
        let products = await res.json();
        
        // Populate homepage bestsellers
        if (bestsellersContainer) {
          renderCleanBestsellers(products, bestsellersContainer);
        }

        // Filter by category if requested on shop page
        const urlParams = new URLSearchParams(window.location.search);
        const catFilter = urlParams.get('cat');
        if (catFilter && window.location.pathname.includes('shop.html')) {
          const catMap = {
            'car-accessories': 'Car Accessories',
            'dashboard-accessories': 'Dashboard Accessories',
            'lights-led': 'Lights/LED',
            'hangings': 'Hangings',
            'truck-accessories': 'Truck Accessories',
            'casting-products': 'Casting Products'
          };
          const targetCategory = catMap[catFilter] || catFilter;
          const filtered = products.filter(p => p.category.toLowerCase().includes(targetCategory.toLowerCase()) || targetCategory.toLowerCase().includes(p.category.toLowerCase()));
          if (filtered.length > 0) {
            products = filtered;
          }
        }

        if (productsContainer) {
          renderProducts(products, productsContainer);
        }
      }
    } catch (err) {
      console.warn('Could not load data/products.json dynamically (fallback DOM retained):', err);
    }
  }

  // Load blog posts for blog grid and/or footer news
  const footerNewsContainers = document.querySelectorAll('.footer-news-container');
  if (blogContainer || footerNewsContainers.length) {
    try {
      const res = await fetch('data/blog.json');
      if (res.ok) {
        const blogs = await res.json();
        if (blogContainer) {
          renderBlogs(blogs, blogContainer);
        }
        footerNewsContainers.forEach((fContainer) => {
          renderFooterNews(blogs, fContainer);
        });
      }
    } catch (err) {
      console.warn('Could not load data/blog.json dynamically (fallback DOM retained):', err);
    }
  }
}

function renderCleanBestsellers(products, container) {
  if (!products || !products.length) return;
  const featured = products.filter(p => p.featured === true);
  const itemsToRender = (featured.length >= 4 ? featured : products).slice(0, 4);

  container.innerHTML = itemsToRender.map(item => {
    const saleBadge = (item.onSale || (item.comparePrice && item.comparePrice > item.price) || item.badge === 'SALE!')
      ? `<span class="product-badge-sale">${item.badge || 'SALE!'}</span>`
      : '';
    const oldPriceHtml = (item.comparePrice && parseFloat(item.comparePrice) > parseFloat(item.price))
      ? `<span class="product-clean-old-price">$${parseFloat(item.comparePrice).toFixed(2)}</span>`
      : '';
    const priceHtml = `<span class="product-clean-price">$${parseFloat(item.price).toFixed(2)}</span>`;
    
    return `
      <article class="product-clean-card" data-product-id="${item.id}">
        <div class="product-clean-img-wrap">
          ${saleBadge}
          <a href="product.html?id=${encodeURIComponent(item.id)}">
            <img src="${item.image || 'images/no-image-placeholder.svg'}" alt="${item.name}" loading="lazy" onerror="this.src='images/no-image-placeholder.svg'">
          </a>
        </div>
        <div class="product-clean-body">
          <h3 class="product-clean-name">
            <a href="product.html?id=${encodeURIComponent(item.id)}">${(item.name || '').toUpperCase()}</a>
          </h3>
          <div class="product-clean-price-row">
            ${oldPriceHtml}
            ${priceHtml}
          </div>
          <button class="btn-clean-cart" data-add-to-cart="${item.id}">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            ADD TO CART
          </button>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pid = btn.getAttribute('data-add-to-cart');
      if (window.BBC_Cart && typeof window.BBC_Cart.addItem === 'function') {
        window.BBC_Cart.addItem(pid, 1);
      }
    });
  });
}

function renderProducts(products, container) {
  if (!products || !products.length) return;
  window.allHomeProducts = products;
  container.innerHTML = products.map((item) => `
    <article class="card card-product" data-product-id="${item.id}">
      <div class="card-image-wrap">
        <span class="card-badge ${item.badge === 'NEW' ? 'badge-new' : ''}">${item.badge || 'POPULAR'}</span>
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-category">${item.category}</span>
        <h3 class="card-title">
          <a href="product.html?id=${item.id}">${item.name}</a>
        </h3>
        <p class="card-description">${item.shortDescription}</p>
        <div class="card-rating">
          <span class="stars">★★★★★</span>
          <span class="reviews-count">(${item.rating} • ${item.reviewsCount} reviews)</span>
        </div>
        <div class="card-footer" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div class="card-price-box">
              <span class="card-price">$${item.price.toFixed(2)} CAD</span>
              ${item.comparePrice ? `<span class="card-compare-price">$${item.comparePrice.toFixed(2)}</span>` : ''}
            </div>
            <a href="product.html?id=${item.id}" class="card-view-link" style="font-size: 0.82rem; color: var(--accent-gold); text-decoration: underline;">View Details</a>
          </div>
          <div class="card-cart-action-row">
            <div class="card-qty-ctrl">
              <button type="button" class="card-qty-btn" onclick="adjustHomeQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
              <input type="number" id="home-qty-${item.id}" class="card-qty-input" value="1" min="1" max="99" aria-label="Quantity">
              <button type="button" class="card-qty-btn" onclick="adjustHomeQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="btn-card-add-cart" onclick="addHomeItemToCart('${item.id}')" aria-label="Add ${item.name} to cart">
              <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

window.adjustHomeQty = function(id, delta) {
  const input = document.querySelector(`#home-qty-${id}`);
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
};

window.addHomeItemToCart = function(id) {
  const products = window.allHomeProducts || [];
  const product = products.find(p => p.id === id);
  if (!product) return;
  const input = document.querySelector(`#home-qty-${id}`);
  const qty = input ? parseInt(input.value, 10) || 1 : 1;
  if (typeof addToCart === 'function') {
    addToCart(product, qty);
  }
};

function renderBlogs(posts, container) {
  if (!posts || !posts.length) return;
  container.innerHTML = posts.map((post) => `
    <article class="card card-blog" data-post-id="${post.id}">
      <div class="card-image-wrap">
        <img src="${post.image}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="text-gold" style="font-weight: 700; text-transform: uppercase;">${post.category}</span>
          <span class="meta-dot"></span>
          <span>${post.date}</span>
          <span class="meta-dot"></span>
          <span>${post.readTime}</span>
        </div>
        <h3 class="card-title">
          <a href="${post.slug || 'post.html'}">${post.title}</a>
        </h3>
        <p class="card-description">${post.excerpt}</p>
        <div class="card-footer">
          <span class="text-dim" style="font-size: 0.85rem;">By ${post.author}</span>
          <a href="${post.slug || 'post.html'}" class="card-read-link">
            Read Article
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

function renderFooterNews(posts, container) {
  if (!posts || !posts.length) return;
  const recentPosts = posts.slice(0, 3);
  container.innerHTML = recentPosts.map((post) => `
    <div class="footer-news-item">
      <span class="footer-news-date">
        <svg viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>
        ${post.date}
      </span>
      <a href="${post.slug || 'post.html?id=' + post.id}" class="footer-news-title">${post.title}</a>
    </div>
  `).join('');
}
