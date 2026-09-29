/**
 * BROWN BOYS CUSTOMS (BBC) — SHOP CONTROLLER
 * Phase 5: Shop / Product Listing Page
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#shop-products-grid')) {
    initShop();
  }
});

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 6;

let currentCategory = 'all';
let currentSubCategory = null;
let currentSort = 'default';
let minPrice = 0;
let maxPrice = 1500;

async function initShop() {
  try {
    const res = await fetch('data/products.json');
    if (res.ok) {
      allProducts = await res.json();
    }
  } catch (err) {
    console.error('Failed to load data/products.json:', err);
    return;
  }

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('cat')) currentCategory = urlParams.get('cat');
  if (urlParams.get('sub')) currentSubCategory = urlParams.get('sub');
  if (urlParams.get('sort')) currentSort = urlParams.get('sort');
  if (urlParams.get('page')) currentPage = parseInt(urlParams.get('page'), 10) || 1;
  if (urlParams.get('min')) minPrice = parseFloat(urlParams.get('min')) || 0;
  if (urlParams.get('max')) maxPrice = parseFloat(urlParams.get('max')) || 1500;

  initPriceFilterControls();
  initCategoryFilterEvents();
  initSortSelectEvents();

  applyFilters();
}

/* --- CATEGORY FILTER EVENTS --- */
function initCategoryFilterEvents() {
  const categoryLinks = document.querySelectorAll('[data-shop-cat]');
  categoryLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.getAttribute('data-shop-cat');
      const sub = link.getAttribute('data-shop-sub');

      currentCategory = cat || 'all';
      currentSubCategory = sub || null;
      currentPage = 1;

      // Update URL without reload
      updateUrl();
      highlightActiveCategory();
      applyFilters();
    });
  });

  highlightActiveCategory();
}

function highlightActiveCategory() {
  const categoryLinks = document.querySelectorAll('[data-shop-cat]');
  categoryLinks.forEach((link) => {
    const cat = link.getAttribute('data-shop-cat');
    const sub = link.getAttribute('data-shop-sub');

    if (currentSubCategory && sub === currentSubCategory) {
      link.classList.add('active');
    } else if (!currentSubCategory && cat === currentCategory) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* --- SORT CONTROLS --- */
function initSortSelectEvents() {
  const sortSelect = document.querySelector('#shop-sort-select');
  if (!sortSelect) return;

  sortSelect.value = currentSort;
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    updateUrl();
    applyFilters();
  });
}

/* --- PRICE SLIDER CONTROLS --- */
function initPriceFilterControls() {
  const minSlider = document.querySelector('#price-slider-min');
  const maxSlider = document.querySelector('#price-slider-max');
  const minInput = document.querySelector('#price-input-min');
  const maxInput = document.querySelector('#price-input-max');
  const highlight = document.querySelector('.range-slider-highlight');
  const applyBtn = document.querySelector('#apply-price-filter');

  if (!minSlider || !maxSlider || !minInput || !maxInput || !highlight) return;

  const updateHighlight = () => {
    const minVal = parseFloat(minSlider.value);
    const maxVal = parseFloat(maxSlider.value);
    const minPercent = (minVal / 1500) * 100;
    const maxPercent = 100 - (maxVal / 1500) * 100;

    highlight.style.left = `${minPercent}%`;
    highlight.style.right = `${maxPercent}%`;
  };

  minSlider.value = minPrice;
  maxSlider.value = maxPrice;
  minInput.value = minPrice;
  maxInput.value = maxPrice;
  updateHighlight();

  minSlider.addEventListener('input', () => {
    if (parseFloat(minSlider.value) > parseFloat(maxSlider.value) - 20) {
      minSlider.value = parseFloat(maxSlider.value) - 20;
    }
    minInput.value = minSlider.value;
    updateHighlight();
  });

  maxSlider.addEventListener('input', () => {
    if (parseFloat(maxSlider.value) < parseFloat(minSlider.value) + 20) {
      maxSlider.value = parseFloat(minSlider.value) + 20;
    }
    maxInput.value = maxSlider.value;
    updateHighlight();
  });

  minInput.addEventListener('change', () => {
    let val = Math.max(0, Math.min(parseFloat(minInput.value) || 0, parseFloat(maxInput.value) - 20));
    minInput.value = val;
    minSlider.value = val;
    updateHighlight();
  });

  maxInput.addEventListener('change', () => {
    let val = Math.min(1500, Math.max(parseFloat(maxInput.value) || 1500, parseFloat(minInput.value) + 20));
    maxInput.value = val;
    maxSlider.value = val;
    updateHighlight();
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      minPrice = parseFloat(minInput.value) || 0;
      maxPrice = parseFloat(maxInput.value) || 1500;
      currentPage = 1;
      updateUrl();
      applyFilters();
    });
  }
}

/* --- FILTER & SORT EXECUTION --- */
function applyFilters() {
  filteredProducts = allProducts.filter((product) => {
    // Category & subcategory filter
    if (currentCategory && currentCategory !== 'all') {
      const prodCatSlug = slugify(product.category);
      const targetCatSlug = slugify(currentCategory);
      if (prodCatSlug !== targetCatSlug && !prodCatSlug.includes(targetCatSlug)) {
        return false;
      }
    }

    if (currentSubCategory) {
      if (!product.subCategory || slugify(product.subCategory) !== slugify(currentSubCategory)) {
        return false;
      }
    }

    // Price filter
    if (product.price < minPrice || product.price > maxPrice) {
      return false;
    }

    return true;
  });

  // Sort
  if (currentSort === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'popularity') {
    filteredProducts.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  } else if (currentSort === 'newest') {
    filteredProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    // Default sorting: featured first, then name
    filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  renderResultsBar();
  renderProductsGrid();
  renderPagination();
}

/* --- RENDER RESULTS BAR --- */
function renderResultsBar() {
  const countEl = document.querySelector('#shop-results-count');
  if (!countEl) return;

  const total = filteredProducts.length;
  if (total === 0) {
    countEl.innerHTML = 'Showing <strong>0</strong> results';
    return;
  }

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, total);
  countEl.innerHTML = `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> results`;
}

/* --- RENDER PRODUCT GRID --- */
function renderProductsGrid() {
  const grid = document.querySelector('#shop-products-grid');
  if (!grid) return;

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <h3 style="font-size: 1.6rem; color: var(--accent-gold); margin-bottom: 0.6rem;">No Products Found</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">No items match your active category or price filters.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  grid.innerHTML = pageProducts.map((item, idx) => {
    const isSale = item.onSale || (item.comparePrice && item.comparePrice > item.price);
    const imageSrc = item.image && item.image.trim() !== '' ? item.image : 'images/no-image-placeholder.svg';
    const numTag = String(startIndex + idx + 1).padStart(2, '0');

    return `
      <article class="product-luxury-card" data-product-id="${item.id}">
        <div class="card-thumb-frame">
          ${isSale ? '<span class="tag-sale-pill">SALE</span>' : ''}
          <span class="tag-index-num">${numTag}</span>
          <img src="${imageSrc}" alt="${item.name}" loading="lazy">
        </div>
        <div class="card-content-body">
          <span class="card-category-kicker">${item.category.toUpperCase()}${isSale ? ' · SALE' : ''}</span>
          <h3 class="card-product-heading">
            <a href="product.html?id=${item.id}">${item.name.toUpperCase()}</a>
          </h3>
          <p class="card-product-snippet">${item.shortDescription || ''}</p>
          <div class="card-reviews-stars">
            <span class="stars-icon">★★★★★</span>
            <span class="reviews-label">${item.reviewsCount || 10} reviews</span>
          </div>
          <div class="card-pricing-footer">
            <div class="price-value-box">
              <span class="price-current">$${item.price.toFixed(2)}</span>
              ${isSale && item.comparePrice ? `<span class="price-old">$${item.comparePrice.toFixed(2)}</span>` : ''}
            </div>
            <a href="product.html?id=${item.id}" class="btn-view-item">
              <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              VIEW ITEM
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

window.adjustCardQty = function(id, delta) {
  const input = document.querySelector(`#card-qty-${id}`);
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
};

window.addCardItemToCart = function(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  const input = document.querySelector(`#card-qty-${id}`);
  const qty = input ? parseInt(input.value, 10) || 1 : 1;
  if (typeof addToCart === 'function') {
    addToCart(product, qty);
  }
};

/* --- RENDER PAGINATION --- */
function renderPagination() {
  const paginationContainer = document.querySelector('#shop-pagination');
  if (!paginationContainer) return;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';

  // Previous Arrow
  if (currentPage > 1) {
    html += `<a href="javascript:void(0)" class="page-box" onclick="goToPage(${currentPage - 1})" aria-label="Previous Page">&lt;</a>`;
  }

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <a href="javascript:void(0)" class="page-box ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </a>
    `;
  }

  // Next Arrow
  if (currentPage < totalPages) {
    html += `<a href="javascript:void(0)" class="page-box" onclick="goToPage(${currentPage + 1})" aria-label="Next Page">&gt;</a>`;
  }

  paginationContainer.innerHTML = html;
}

window.goToPage = function(page) {
  currentPage = page;
  updateUrl();
  applyFilters();
  window.scrollTo({ top: 380, behavior: 'smooth' });
};

window.resetFilters = function() {
  currentCategory = 'all';
  currentSubCategory = null;
  minPrice = 0;
  maxPrice = 1500;
  currentPage = 1;
  updateUrl();
  highlightActiveCategory();
  applyFilters();
};

function updateUrl() {
  const params = new URLSearchParams();
  if (currentCategory && currentCategory !== 'all') params.set('cat', currentCategory);
  if (currentSubCategory) params.set('sub', currentSubCategory);
  if (currentSort && currentSort !== 'default') params.set('sort', currentSort);
  if (currentPage > 1) params.set('page', currentPage);
  if (minPrice > 0) params.set('min', minPrice);
  if (maxPrice < 1500) params.set('max', maxPrice);

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

