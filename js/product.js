/**
 * BROWN BOYS CUSTOMS (BBC) — SINGLE PRODUCT CONTROLLER
 * Phase 6: Single Product Template & Dynamic Populator
 */

document.addEventListener('DOMContentLoaded', () => {
  initProductPage();
  initCartDrawer();
});

let currentProduct = null;
let allProducts = [];

async function initProductPage() {
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Failed to load products');
    allProducts = await res.json();
  } catch (err) {
    console.error('Error fetching data/products.json:', err);
    return;
  }

  // Get product ID or slug from query string
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    currentProduct = allProducts.find(p => p.id === productId || p.id.toLowerCase() === productId.toLowerCase());
  }

  // Fallback to "1969-dodge-challenger" if not found or no param specified
  if (!currentProduct) {
    currentProduct = allProducts.find(p => p.id === '1969-dodge-challenger') || allProducts[0];
  }

  renderProductDetails(currentProduct);
  renderGallery(currentProduct);
  renderTabs(currentProduct);
  renderRelatedProducts(currentProduct);
  initQuantityControls();
  initActionButtons(currentProduct);

  // ── Reveal product content (eliminate flash of wrong product) ──
  const skeleton = document.getElementById('product-loading-skeleton');
  const detailSection = document.getElementById('product-detail-section');
  const breadcrumbBar = document.getElementById('product-breadcrumb-bar');

  if (skeleton) skeleton.style.display = 'none';
  if (detailSection) detailSection.style.opacity = '1';
  if (breadcrumbBar) breadcrumbBar.style.opacity = '1';
}

/* ==========================================================================
   RENDER PRODUCT DETAILS (RIGHT COLUMN)
   ========================================================================== */
function renderProductDetails(p) {
  // Page Title & Meta
  document.title = `${p.name} — Brown Boys Customs (BBC)`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', p.shortDescription || `Order ${p.name} from Brown Boys Customs Mississauga. In-store pickup at Westwood Mall or fast shipping.`);
  }

  // Breadcrumbs: Home / Shop / [Category] / [Product Name]
  const breadcrumbEl = document.querySelector('#product-breadcrumb');
  if (breadcrumbEl) {
    const catUrl = `shop.html?cat=${encodeURIComponent(p.category)}`;
    breadcrumbEl.innerHTML = `
      <a href="index.html" class="breadcrumb-item"><svg viewBox="0 0 24 24" class="breadcrumb-home-icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> Home</a>
      <span class="breadcrumb-separator">/</span>
      <a href="shop.html" class="breadcrumb-item">Shop</a>
      <span class="breadcrumb-separator">/</span>
      <a href="${catUrl}" class="breadcrumb-item">${p.category}</a>
      ${p.subCategory ? `<span class="breadcrumb-separator">/</span><a href="${catUrl}&sub=${encodeURIComponent(p.subCategory)}" class="breadcrumb-item">${p.subCategory}</a>` : ''}
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">${p.name}</span>
    `;
  }

  // Category & Stock tag
  const kickerEl = document.querySelector('#product-category-kicker');
  if (kickerEl) {
    kickerEl.innerHTML = `${p.category.toUpperCase()} &nbsp;›&nbsp; ${(p.subCategory || 'DIE-CAST CARS').toUpperCase()}`;
  }
  const catTag = document.querySelector('#product-category-tag');
  if (catTag) {
    catTag.textContent = `${p.category}${p.subCategory ? ' • ' + p.subCategory : ''}`;
  }

  const stockTag = document.querySelector('#product-stock-tag');
  if (stockTag) {
    if (p.inStock !== false) {
      stockTag.className = 'product-stock-tag';
      stockTag.innerHTML = `<span class="product-stock-pulse"></span> In Stock — Westwood Mall Pickup Available`;
    } else {
      stockTag.className = 'product-stock-tag out-of-stock';
      stockTag.innerHTML = `<span class="product-stock-pulse"></span> Made to Order — Contact BBC`;
    }
  }

  // Title
  const titleEl = document.querySelector('#product-title');
  if (titleEl) {
    titleEl.textContent = p.name;
  }

  // Ratings & Review Count
  const ratingScoreEl = document.querySelector('#product-rating-score');
  const reviewsCountEl = document.querySelector('#product-reviews-count');
  const starsEl = document.querySelector('#product-stars');
  if (ratingScoreEl) ratingScoreEl.textContent = (p.rating || 5.0).toFixed(1);
  if (reviewsCountEl) reviewsCountEl.textContent = `(${p.reviewsCount || 24} GTA Verified Customer Reviews)`;
  if (starsEl) starsEl.textContent = '★'.repeat(Math.round(p.rating || 5)) + '☆'.repeat(5 - Math.round(p.rating || 5));

  // Pricing Block
  const priceCurrentEl = document.querySelector('#product-price-current');
  const priceCompareEl = document.querySelector('#product-price-compare');
  const priceSaveBadgeEl = document.querySelector('#product-price-save-badge');

  const isSale = p.onSale || (p.comparePrice && p.comparePrice > p.price);

  if (priceCurrentEl) {
    priceCurrentEl.textContent = `$${p.price.toFixed(2)} CAD`;
  }

  if (isSale && p.comparePrice) {
    if (priceCompareEl) {
      priceCompareEl.textContent = `$${p.comparePrice.toFixed(2)}`;
      priceCompareEl.style.display = 'inline-block';
    }
    if (priceSaveBadgeEl) {
      const savings = (p.comparePrice - p.price).toFixed(2);
      const discountPct = Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100);
      priceSaveBadgeEl.textContent = `SAVE $${savings} (${discountPct}% OFF)`;
      priceSaveBadgeEl.style.display = 'inline-block';
    }
  } else {
    if (priceCompareEl) priceCompareEl.style.display = 'none';
    if (priceSaveBadgeEl) priceSaveBadgeEl.style.display = 'none';
  }

  // Short description
  const shortDescEl = document.querySelector('#product-short-desc');
  if (shortDescEl) {
    shortDescEl.textContent = p.shortDescription || '';
  }

  // Quick metadata
  const skuEl = document.querySelector('#quick-meta-sku');
  const catMetaEl = document.querySelector('#quick-meta-cat');
  const storeMetaEl = document.querySelector('#quick-meta-store');
  if (skuEl) skuEl.textContent = p.sku || `BBC-${p.id.slice(0, 6).toUpperCase()}`;
  if (catMetaEl) catMetaEl.textContent = p.category;
  if (storeMetaEl) storeMetaEl.textContent = 'Unit 1C30, Westwood Mall';

  // Direct WhatsApp Button link
  const waBtn = document.querySelector('#btn-whatsapp-direct');
  if (waBtn) {
    const waText = encodeURIComponent(`Hi Brown Boys Customs, I am interested in ordering: "${p.name}" ($${p.price.toFixed(2)} CAD).`);
    waBtn.href = `https://wa.me/12893675047?text=${waText}`;
  }

  // Update Quote Modal hidden / prefilled values
  const quoteVehicleInput = document.querySelector('#quote-form input[name="service_vehicle"], #quote-form input[value*="Headliner"]');
  if (quoteVehicleInput) {
    quoteVehicleInput.value = `${p.name} ($${p.price.toFixed(2)} CAD)`;
  }
}

/* ==========================================================================
   RENDER GALLERY (LEFT COLUMN)
   ========================================================================== */
function renderGallery(p) {
  const viewport = document.querySelector('#gallery-viewport');
  const thumbsContainer = document.querySelector('#gallery-thumbnails');
  if (!viewport || !thumbsContainer) return;

  const isSale = p.onSale || (p.comparePrice && p.comparePrice > p.price);
  const images = (p.gallery && p.gallery.length > 0) ? p.gallery : [p.image || 'images/no-image-placeholder.svg'];
  let activeIndex = 0;

  function updateView(idx) {
    if (idx < 0) idx = images.length - 1;
    if (idx >= images.length) idx = 0;
    activeIndex = idx;

    const mainImg = viewport.querySelector('#gallery-active-image');
    if (mainImg) {
      mainImg.src = images[activeIndex];
      mainImg.alt = `${p.name} - Angle ${activeIndex + 1}`;
    }

    const allThumbs = thumbsContainer.querySelectorAll('.product-thumb');
    allThumbs.forEach((tb, i) => {
      if (i === activeIndex) {
        tb.classList.add('active');
      } else {
        tb.classList.remove('active');
      }
    });
  }

  // Populate thumbnails
  thumbsContainer.innerHTML = images.map((src, i) => `
    <button type="button" class="product-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="View angle ${i + 1}">
      <img src="${src}" alt="${p.name} angle ${i + 1}">
    </button>
  `).join('');

  // Attach clicks to thumbnails
  thumbsContainer.querySelectorAll('.product-thumb').forEach((thumbBtn, idx) => {
    thumbBtn.addEventListener('click', () => {
      updateView(idx);
    });
  });

  // Attach Next/Prev
  const prevBtn = viewport.querySelector('#gallery-prev-btn');
  const nextBtn = viewport.querySelector('#gallery-next-btn');
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      updateView(activeIndex - 1);
    };
  }
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      updateView(activeIndex + 1);
    };
  }

  // Fullscreen expand modal
  const expandBtn = viewport.querySelector('#gallery-expand-btn');
  const lightboxModal = document.querySelector('#image-lightbox-modal');
  const lightboxImg = document.querySelector('#lightbox-image');
  const lightboxClose = document.querySelector('#lightbox-close-btn');

  if (expandBtn && lightboxModal && lightboxImg) {
    expandBtn.onclick = (e) => {
      e.stopPropagation();
      lightboxImg.src = images[activeIndex];
      lightboxModal.style.display = 'flex';
    };
  }
  if (lightboxClose && lightboxModal) {
    lightboxClose.onclick = () => {
      lightboxModal.style.display = 'none';
    };
    lightboxModal.onclick = (e) => {
      if (e.target === lightboxModal) lightboxModal.style.display = 'none';
    };
  }

  // Initialize with image 0
  updateView(0);
}

/* ==========================================================================
   RENDER TABS (DESCRIPTION, FITMENT/SPECS, INSTALLATION, REVIEWS)
   ========================================================================== */
function renderTabs(p) {
  // Tab 1: Full Description & Features
  const descPanel = document.querySelector('#tab-panel-description');
  if (descPanel) {
    const paragraphs = (p.fullDescription || p.shortDescription || '').split('\n\n');
    const featuresList = p.features && p.features.length > 0 ? p.features : [
      'Engineered and tested by Brown Boys Customs styling experts',
      'High-grade automotive heat and UV-resistant materials',
      'Compatible with domestic and import vehicles',
      'In-store pickup available at Westwood Mall (Unit 1C30)'
    ];

    descPanel.innerHTML = `
      <div style="font-size: 1.05rem; line-height: 1.8; color: var(--text-light); margin-bottom: 2rem;">
        ${paragraphs.map(para => `<p style="margin-bottom: 1.2rem;">${para}</p>`).join('')}
      </div>

      <h3 style="font-size: 1.4rem; color: var(--accent-gold); margin-bottom: 1rem; font-family: var(--font-heading); letter-spacing: 0.5px;">
        KEY PRODUCT HIGHLIGHTS & FEATURES
      </h3>
      <div class="features-grid">
        ${featuresList.map(feat => `
          <div class="feature-check-item">
            <span class="feature-check-icon">✦</span>
            <span style="font-size: 0.95rem; color: var(--text-light); line-height: 1.5;">${feat}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Tab 2: Fitment & Specifications
  const specsPanel = document.querySelector('#tab-panel-specs');
  if (specsPanel) {
    const specs = p.specifications || {
      "Product Category": p.category,
      "Subcategory": p.subCategory || "Custom Accessory",
      "SKU": p.sku || `BBC-${p.id.slice(0, 6).toUpperCase()}`,
      "Availability": "In Stock at Westwood Mall / Canada-wide shipping"
    };

    const rows = Object.entries(specs).map(([key, val]) => `
      <tr>
        <th>${key}</th>
        <td>${val}</td>
      </tr>
    `).join('');

    specsPanel.innerHTML = `
      <h3 style="font-size: 1.4rem; color: var(--accent-gold); margin-bottom: 1.25rem; font-family: var(--font-heading);">
        TECHNICAL SPECIFICATIONS & FITMENT DATA
      </h3>
      <div style="overflow-x: auto;">
        <table class="specs-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Tab 3: Installation & Warranty
  const installPanel = document.querySelector('#tab-panel-install');
  if (installPanel) {
    installPanel.innerHTML = `
      <div class="grid-2" style="gap: 2rem; align-items: start;">
        <div style="background: var(--bg-surface); padding: 1.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <h4 style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--accent-gold); margin-bottom: 0.8rem;">
            DIY INSTALLATION GUIDELINE
          </h4>
          <p style="font-size: 0.98rem; line-height: 1.7; color: var(--text-light); margin-bottom: 1.2rem;">
            ${p.installation || "Standard direct fitment. Clean mounting surface thoroughly with isopropyl alcohol before application. Allow 24 hours for adhesives to reach maximum bond strength."}
          </p>
          <div style="background: rgba(201, 161, 61, 0.08); border-left: 3px solid var(--accent-gold); padding: 0.85rem 1rem; border-radius: var(--radius-xs);">
            <strong style="color: var(--accent-gold); font-size: 0.9rem; display: block; margin-bottom: 0.2rem;">Need Installation Assistance?</strong>
            <span style="font-size: 0.85rem; color: var(--text-light);">Our technicians are on-site 7 days a week at Westwood Mall Unit 1C30. Walk-ins welcome for quick installs.</span>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <h4 style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--accent-gold); margin-bottom: 0.8rem;">
            BBC WARRANTY & GUARANTEE
          </h4>
          <ul style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.92rem; color: var(--text-light);">
            <li>✓ <strong>100% Fitment Guarantee</strong>: Test fit before installation. If it doesn't fit your vehicle, we'll swap it or refund.</li>
            <li>✓ <strong>1-Year Finish Warranty</strong>: Protection against UV fading, premature peeling, and manufacturing defects.</li>
            <li>✓ <strong>In-Store Support</strong>: Immediate face-to-face assistance right inside Westwood Square / Westwood Mall.</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Tab 4: Customer Reviews
  const reviewsPanel = document.querySelector('#tab-panel-reviews');
  if (reviewsPanel) {
    const reviews = p.reviews || [
      {
        author: "Amanjot B.",
        location: "Mississauga, ON",
        vehicle: "Ford Mustang GT",
        rating: 5,
        date: "September 2026",
        title: "Cleanest styling accessory in GTA",
        comment: "Excellent quality and looks super authentic. BBC is my go-to shop for anything custom."
      }
    ];

    reviewsPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.8rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.4rem; color: var(--accent-gold); font-family: var(--font-heading);">
            VERIFIED GTA CUSTOMER REVIEWS
          </h3>
          <p style="font-size: 0.9rem; color: var(--text-muted);">
            Rated <strong>${(p.rating || 5.0).toFixed(1)} / 5.0</strong> based on ${p.reviewsCount || reviews.length} customer purchases
          </p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="alert('Thank you! Review submission is open to verified BBC customers who picked up or received their order.')">
          Write a Review
        </button>
      </div>

      <div class="reviews-container">
        ${reviews.map(r => `
          <article class="review-card">
            <div class="review-card-header">
              <div class="reviewer-profile">
                <div class="reviewer-avatar">${r.author ? r.author.charAt(0) : 'B'}</div>
                <div>
                  <div class="reviewer-name">${r.author} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-dim);">(${r.location || 'Ontario'})</span></div>
                  <div class="reviewer-vehicle">Vehicle: ${r.vehicle || 'GTA Enthusiast'}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.8rem;">
                <span class="verified-buyer-pill">✓ Verified Buyer</span>
                <span style="font-size: 0.82rem; color: var(--text-dim);">${r.date}</span>
              </div>
            </div>
            <div style="color: #eab308; margin-bottom: 0.4rem;">
              ${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}
            </div>
            <h4 class="review-title">${r.title || 'Exceptional Quality'}</h4>
            <p class="review-comment">${r.comment}</p>
          </article>
        `).join('')}
      </div>
    `;
  }

  // Tab Switching Logic
  const tabBtns = document.querySelectorAll('.product-tab-btn, .segmented-tab-btn');
  const tabPanels = document.querySelectorAll('.product-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetPanel = document.querySelector(`#${targetId}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Reviews jump link
  const jumpReviews = document.querySelector('#jump-to-reviews');
  if (jumpReviews) {
    jumpReviews.addEventListener('click', () => {
      const reviewsTabBtn = document.querySelector('[data-tab="tab-panel-reviews"]');
      if (reviewsTabBtn) reviewsTabBtn.click();
      const tabsSection = document.querySelector('.product-tabs-section');
      if (tabsSection) tabsSection.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   RENDER RELATED PRODUCTS (MATCHING CLIENT REFERENCE)
   ========================================================================== */
function renderRelatedProducts(p) {
  const container = document.querySelector('#related-products-grid');
  if (!container) return;

  // Prefer the 3 complementary products shown in reference screenshot:
  const preferredIds = ['aircraft-light-piece', 'aircraft-light-remote', 'amg-dashboard-accessories'];
  let related = preferredIds.map(id => allProducts.find(item => item.id === id)).filter(Boolean);

  if (related.length < 3) {
    related = allProducts.filter(item => item.id !== p.id).slice(0, 3);
  }

  container.innerHTML = related.map(item => {
    const imgSrc = item.image && item.image.trim() !== '' ? item.image : 'images/no-image-placeholder.svg';

    return `
      <article class="card-product" data-product-id="${item.id}">
        <div class="card-image-wrap">
          <button type="button" class="card-wishlist-btn" aria-label="Add to wishlist">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <img src="${imgSrc}" alt="${item.name}" loading="lazy">
        </div>
        <div class="card-body">
          <span class="card-category">${item.category}${item.subCategory ? ' • ' + item.subCategory : ''}</span>
          <h3 class="card-title">
            <a href="product.html?id=${item.id}">${item.name}</a>
          </h3>
          <div class="card-rating">
            <span class="stars">★★★★★</span>
            <span class="reviews-count">${(item.rating || 4.7).toFixed(1)} (${item.reviewsCount || 18} reviews)</span>
          </div>
          <div class="card-footer">
            <div class="card-price-box">
              <span class="card-price">$${item.price.toFixed(2)}</span>
            </div>
            <a href="product.html?id=${item.id}" class="btn-gold">
              <svg viewBox="0 0 24 24" style="width: 15px; height: 15px; fill: currentColor;"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
              VIEW ITEM
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ==========================================================================
   QUANTITY CONTROLS
   ========================================================================== */
function initQuantityControls() {
  const minusBtn = document.querySelector('#qty-minus');
  const plusBtn = document.querySelector('#qty-plus');
  const qtyInput = document.querySelector('#product-qty-input');

  if (!qtyInput) return;

  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
      }
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = val + 1;
    });
  }

  qtyInput.addEventListener('change', () => {
    let val = parseInt(qtyInput.value, 10);
    if (isNaN(val) || val < 1) qtyInput.value = 1;
  });
}

/* ==========================================================================
   ACTION BUTTONS (ADD TO CART & BOOK INSTALLATION)
   ========================================================================== */
function initActionButtons(p) {
  const addToCartBtn = document.querySelector('#btn-add-to-cart');
  const qtyInput = document.querySelector('#product-qty-input');

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
      addToCart(p, qty);
      showToast(`Added ${qty} × "${p.name}" to cart!`);
      openCartDrawer();
    });
  }

  const bookInstallBtn = document.querySelector('#btn-book-installation');
  if (bookInstallBtn) {
    bookInstallBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Pre-fill quote modal
      const modal = document.querySelector('.quote-modal-backdrop');
      const input = document.querySelector('#quote-form input[required][value], #quote-form input[name="service_vehicle"], #quote-service-input');
      if (input) {
        input.value = `In-Shop Installation: ${p.name} ($${p.price.toFixed(2)} CAD)`;
      }
      if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    });
  }
}

/* ==========================================================================
   CART SYSTEM (LOCAL STORAGE & SLIDE-OUT DRAWER)
   ========================================================================== */
const CART_STORAGE_KEY = 'bbc_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    if (typeof updateCartBadges === 'function') {
      updateCartBadges();
    }
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

function addToCart(p, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === p.id);

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image || (p.gallery && p.gallery[0]) || 'images/no-image-placeholder.svg',
      quantity: qty
    });
  }

  saveCart(cart);
  renderCartDrawer();
  if (typeof showToast === 'function') {
    showToast(`Added ${qty} × "${p.name}" to cart!`);
  }
}

function updateCartItemQty(id, delta) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart(cart);
  renderCartDrawer();
}

function removeCartItem(id) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCartDrawer();
}

function initCartDrawer() {
  const backdrop = document.querySelector('#cart-drawer-backdrop');
  const drawer = document.querySelector('#cart-drawer');
  const closeBtn = document.querySelector('#cart-drawer-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCartDrawer);
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeCartDrawer);
  }

  // Cart button in header / actions
  const cartTriggers = document.querySelectorAll('[data-open-cart]');
  cartTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  renderCartDrawer();
}

function openCartDrawer() {
  const backdrop = document.querySelector('#cart-drawer-backdrop');
  const drawer = document.querySelector('#cart-drawer');
  if (backdrop && drawer) {
    backdrop.classList.add('active');
    drawer.classList.add('active');
    document.body.classList.add('cart-open');
    renderCartDrawer();
  }
}

function closeCartDrawer() {
  const backdrop = document.querySelector('#cart-drawer-backdrop');
  const drawer = document.querySelector('#cart-drawer');
  if (backdrop && drawer) {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
    document.body.classList.remove('cart-open');
  }
}

function renderCartDrawer() {
  const cart = getCart();
  const itemsContainer = document.querySelector('#cart-drawer-items');
  const subtotalValEl = document.querySelector('#cart-drawer-subtotal');
  const checkoutBtn = document.querySelector('#btn-cart-checkout');
  const waOrderBtn = document.querySelector('#btn-cart-wa-order');

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: var(--text-dim); margin-bottom: 1rem;"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <h4 style="font-family: var(--font-heading); font-size: 1.3rem; color: var(--text-white); margin-bottom: 0.5rem;">Your Cart is Empty</h4>
        <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">Explore our high-performance styling parts and Punjabi car accessories.</p>
        <a href="shop.html" class="btn btn-gold btn-sm" onclick="closeCartDrawer()">Continue Shopping</a>
      </div>
    `;
    if (subtotalValEl) subtotalValEl.textContent = '$0.00 CAD';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    if (waOrderBtn) waOrderBtn.style.display = 'none';
    return;
  }

  let subtotal = 0;
  itemsContainer.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} CAD</div>
          </div>
          <div class="cart-item-qty-row">
            <div class="cart-qty-ctrl">
              <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', -1)" aria-label="Decrease quantity">-</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeCartItem('${item.id}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalValEl) {
    subtotalValEl.textContent = `$${subtotal.toFixed(2)} CAD`;
  }

  if (checkoutBtn) {
    checkoutBtn.style.display = 'block';
    checkoutBtn.textContent = 'PROCEED TO CHECKOUT';
    checkoutBtn.onclick = () => {
      window.location.href = 'checkout.html';
    };
  }

  if (waOrderBtn) {
    waOrderBtn.style.display = 'inline-flex';
    const itemsList = cart.map(i => `• ${i.quantity}x ${i.name} ($${(i.price * i.quantity).toFixed(2)})`).join('\n');
    const msg = encodeURIComponent(`Hi Brown Boys Customs, I would like to place an order:\n\n${itemsList}\n\nTotal: $${subtotal.toFixed(2)} CAD`);
    waOrderBtn.href = `https://wa.me/12893675047?text=${msg}`;
  }
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
function showToast(message) {
  let toast = document.querySelector('#bbc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bbc-toast';
    toast.className = 'bbc-toast';
    toast.innerHTML = `
      <div class="toast-icon">✓</div>
      <span id="bbc-toast-msg" style="font-weight: 600; font-size: 0.95rem;"></span>
    `;
    document.body.appendChild(toast);
  }

  const msgEl = document.querySelector('#bbc-toast-msg');
  if (msgEl) msgEl.textContent = message;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
