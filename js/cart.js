/**
 * BROWN BOYS CUSTOMS (BBC) — SHOPPING CART CONTROLLER
 * Phase 11: Cart Page (cart.html)
 */

window.escapeHtml = window.escapeHtml || function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
var escapeHtml = window.escapeHtml;

let pendingQtyChanges = {}; // Map of id -> newQty
let activeShippingMethod = 'pickup'; // Default: pickup ($0)
let activeShippingAddress = {
  country: 'CA',
  province: 'ON',
  city: 'Mississauga',
  postalCode: 'L4T 2T9',
  hasCalculated: false
};

const PROVINCE_TAX_RATES = {
  'ON': { rate: 0.13, label: 'HST 13%' },
  'BC': { rate: 0.12, label: 'PST+GST 12%' },
  'AB': { rate: 0.05, label: 'GST 5%' },
  'SK': { rate: 0.11, label: 'PST+GST 11%' },
  'MB': { rate: 0.12, label: 'PST+GST 12%' },
  'QC': { rate: 0.14975, label: 'QST+GST 14.975%' },
  'NB': { rate: 0.15, label: 'HST 15%' },
  'NL': { rate: 0.15, label: 'HST 15%' },
  'NS': { rate: 0.15, label: 'HST 15%' },
  'PE': { rate: 0.15, label: 'HST 15%' },
  'NT': { rate: 0.05, label: 'GST 5%' },
  'NU': { rate: 0.05, label: 'GST 5%' },
  'YT': { rate: 0.05, label: 'GST 5%' }
};

const VALID_COUPONS = {
  'BBC10': { type: 'percent', value: 10, label: 'BBC10 (-10%)' },
  'WESTWOOD': { type: 'fixed', value: 20, minSubtotal: 50, label: 'WESTWOOD (-$20.00)' },
  'BBC50': { type: 'fixed', value: 50, minSubtotal: 200, label: 'BBC50 (-$50.00)' },
  'FREESHIP': { type: 'shipping', value: 0, label: 'FREESHIP (Free Shipping)' }
};

function initCartPage() {
  loadSavedState();
  renderCartView();
  initCartEventListeners();

  // Listen for storage changes from other tabs
  window.addEventListener('cart:updated', () => {
    pendingQtyChanges = {};
    renderCartView();
  });
}
window.initCartPage = initCartPage;
window.renderCartView = renderCartView;

function loadSavedState() {
  try {
    const raw = sessionStorage.getItem('bbc_cart_session');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.shippingMethod) activeShippingMethod = data.shippingMethod;
      if (data.shippingAddress) activeShippingAddress = data.shippingAddress;
    }
  } catch (e) {
    console.warn('Could not read cart session:', e);
  }
}

function saveCartSession() {
  try {
    sessionStorage.setItem('bbc_cart_session', JSON.stringify({
      shippingMethod: activeShippingMethod,
      shippingAddress: activeShippingAddress
    }));
  } catch (e) {
    console.warn('Could not save cart session:', e);
  }
}

function getAppliedCoupon() {
  try {
    const raw = sessionStorage.getItem('bbc_applied_coupon');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setAppliedCoupon(coupon) {
  if (coupon) {
    sessionStorage.setItem('bbc_applied_coupon', JSON.stringify(coupon));
  } else {
    sessionStorage.removeItem('bbc_applied_coupon');
  }
}

/* ==========================================================================
   RENDER CART VIEW
   ========================================================================== */
function renderCartView() {
  const cart = getCart();
  const mainLayout = document.querySelector('#cart-main-layout');
  const emptyView = document.querySelector('#cart-empty-view');
  const tbody = document.querySelector('#cart-table-body');
  const updateBtn = document.querySelector('#btn-update-cart');
  const checkoutBtn = document.querySelector('#btn-proceed-checkout');
  const cartCountBadge = document.querySelector('#cart-items-count-badge');
  const summarySubtotalLabel = document.querySelector('#summary-subtotal-label');

  if (!cart || cart.length === 0) {
    if (mainLayout) mainLayout.style.display = 'none';
    if (emptyView) emptyView.style.display = 'block';
    if (checkoutBtn) {
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '0.5';
    }
    if (cartCountBadge) cartCountBadge.textContent = '(0 ITEMS)';
    return;
  }

  if (mainLayout) mainLayout.style.display = 'grid';
  if (emptyView) emptyView.style.display = 'none';
  if (checkoutBtn) {
    checkoutBtn.style.pointerEvents = 'auto';
    checkoutBtn.style.opacity = '1';
  }

  const uniqueCount = cart.length;
  let totalQty = 0;
  cart.forEach(item => {
    const id = String(item.id || '');
    const q = pendingQtyChanges[id] !== undefined ? pendingQtyChanges[id] : (parseInt(item.quantity, 10) || 1);
    totalQty += q;
  });

  if (cartCountBadge) {
    cartCountBadge.textContent = `(${uniqueCount} ITEM${uniqueCount > 1 ? 'S' : ''})`;
  }
  if (summarySubtotalLabel) {
    summarySubtotalLabel.textContent = `Items Subtotal (${totalQty} item${totalQty > 1 ? 's' : ''})`;
  }

  // Populate Table Rows
  try {
    tbody.innerHTML = cart.map(item => {
      const id = String(item.id || '');
      const name = String(item.name || 'BBC Custom Product');
      const effectiveQty = pendingQtyChanges[id] !== undefined ? pendingQtyChanges[id] : (parseInt(item.quantity, 10) || 1);
      const priceNum = typeof item.price === 'number' && !isNaN(item.price) ? item.price : (parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 0);
      const lineSubtotal = priceNum * effectiveQty;
      const imageSrc = (typeof item.image === 'string' && item.image.trim()) ? item.image.trim() : 'images/no-image-placeholder.svg';

      return `
        <tr data-cart-row-id="${escapeHtml(id)}" class="cart-item-row">
          <td style="padding-left: 1.5rem;">
            <button type="button" class="trash-btn" onclick="handleRemoveClick('${escapeHtml(id)}')" title="Remove ${escapeHtml(name)} from cart">
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </td>
          <td>
            <div class="item-col-content">
              <a href="product.html?id=${encodeURIComponent(id)}" class="item-thumb-link">
                <img src="${imageSrc}" alt="${escapeHtml(name)}" class="item-thumb-img" onerror="this.src='images/no-image-placeholder.svg'">
              </a>
              <div class="item-details-box">
                <a href="product.html?id=${encodeURIComponent(id)}" class="item-title-link">${escapeHtml(name)}</a>
                <div class="item-badges-wrap">
                  <span class="stock-badge-green">In Stock</span>
                  <span class="authentic-badge-gold">AUTHENTIC BBC PART</span>
                </div>
              </div>
            </div>
          </td>
          <td style="text-align: center;">
            <span class="unit-price-text">$${priceNum.toFixed(2)} CAD</span>
          </td>
          <td style="text-align: center;">
            <div class="qty-stepper-pill">
              <button type="button" class="qty-stepper-btn" onclick="stepCartItemQty('${escapeHtml(id)}', -1)" aria-label="Decrease quantity">&minus;</button>
              <span class="qty-stepper-val" id="qty-val-${escapeHtml(id)}">${effectiveQty}</span>
              <button type="button" class="qty-stepper-btn" onclick="stepCartItemQty('${escapeHtml(id)}', 1)" aria-label="Increase quantity">+</button>
            </div>
          </td>
          <td style="text-align: right; padding-right: 1.5rem;">
            <span class="total-price-gold" id="line-subtotal-${escapeHtml(id)}">$${lineSubtotal.toFixed(2)} CAD</span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering cart table rows:', err);
  }

  // Update Cart Button State
  const hasChanges = Object.keys(pendingQtyChanges).length > 0;
  if (updateBtn) {
    if (hasChanges) {
      updateBtn.disabled = false;
      updateBtn.classList.remove('disabled');
    } else {
      updateBtn.disabled = true;
      updateBtn.classList.add('disabled');
    }
  }

  renderAppliedCouponBadge();
  renderTotals();
}

/* ==========================================================================
   RENDER TOTALS & SHIPPING CALCULATION
   ========================================================================== */
function calculateLineSubtotalSum() {
  const cart = getCart();
  return cart.reduce((sum, item) => {
    const id = String(item.id || '');
    const qty = pendingQtyChanges[id] !== undefined ? pendingQtyChanges[id] : (parseInt(item.quantity, 10) || 1);
    const priceNum = typeof item.price === 'number' && !isNaN(item.price) ? item.price : (parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 0);
    return sum + (priceNum * qty);
  }, 0);
}

function renderTotals() {
  const subtotal = calculateLineSubtotalSum();
  const subtotalEl = document.querySelector('#cart-totals-subtotal');
  const summarySubtotalLabel = document.querySelector('#summary-subtotal-label');
  const discountRow = document.querySelector('#cart-totals-coupon-row');
  const discountEl = document.querySelector('#cart-totals-discount');
  const taxLabelEl = document.querySelector('#tax-rate-label');
  const taxEl = document.querySelector('#cart-totals-tax');
  const grandEl = document.querySelector('#cart-totals-grand');
  const shippingDisplay = document.querySelector('#shipping-options-display');

  if (summarySubtotalLabel) {
    const cart = getCart();
    let totalQty = 0;
    cart.forEach(item => {
      const id = String(item.id || '');
      const q = pendingQtyChanges[id] !== undefined ? pendingQtyChanges[id] : (parseInt(item.quantity, 10) || 1);
      totalQty += q;
    });
    summarySubtotalLabel.textContent = `Items Subtotal (${totalQty} item${totalQty > 1 ? 's' : ''})`;
  }

  if (subtotalEl) {
    subtotalEl.textContent = `$${subtotal.toFixed(2)} CAD`;
  }

  // Coupon discount calculation
  let discountAmount = 0;
  const coupon = getAppliedCoupon();
  if (coupon) {
    if (coupon.type === 'percent') {
      discountAmount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(subtotal, coupon.value);
    }
    if (discountRow && discountEl) {
      discountRow.style.display = 'table-row';
      discountEl.textContent = `-$${discountAmount.toFixed(2)} CAD (${coupon.code})`;
    }
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);

  // Render Shipping Options
  let shippingCost = 0;
  if (!activeShippingAddress.hasCalculated) {
    shippingDisplay.innerHTML = `
      <span style="color: var(--text-muted); font-size: 0.88rem; display: block;" id="shipping-placeholder-text">
        Enter your address to view shipping options.
      </span>
    `;
    shippingCost = 0; // Default until calculated
  } else {
    const isFreeShippingCoupon = coupon && coupon.type === 'shipping';
    const isCanada = activeShippingAddress.country === 'CA';
    const isFreeCanadaThreshold = subtotal >= 300 || isFreeShippingCoupon;
    const stdCost = isFreeCanadaThreshold ? 0.00 : 15.00;
    const expressCost = 25.00;
    const usCost = 35.00;

    let optionsHtml = '<div class="shipping-options-list">';

    if (isCanada) {
      optionsHtml += `
        <label class="shipping-option-item">
          <input type="radio" name="shipping_method" value="pickup" ${activeShippingMethod === 'pickup' ? 'checked' : ''} onchange="handleShippingMethodChange('pickup')">
          <span>Free In-Store Pickup (Westwood Mall): <strong>Free ($0.00)</strong></span>
        </label>
        <label class="shipping-option-item">
          <input type="radio" name="shipping_method" value="standard" ${activeShippingMethod === 'standard' ? 'checked' : ''} onchange="handleShippingMethodChange('standard')">
          <span>Canada Standard Shipping: <strong>${stdCost === 0 ? 'Free' : '$' + stdCost.toFixed(2)}</strong></span>
        </label>
        <label class="shipping-option-item">
          <input type="radio" name="shipping_method" value="express" ${activeShippingMethod === 'express' ? 'checked' : ''} onchange="handleShippingMethodChange('express')">
          <span>Express Courier Delivery: <strong>$${expressCost.toFixed(2)}</strong></span>
        </label>
      `;

      if (activeShippingMethod === 'standard') shippingCost = stdCost;
      else if (activeShippingMethod === 'express') shippingCost = expressCost;
      else shippingCost = 0.00; // pickup
    } else {
      // US Shipping
      optionsHtml += `
        <label class="shipping-option-item">
          <input type="radio" name="shipping_method" value="us_standard" checked onchange="handleShippingMethodChange('us_standard')">
          <span>USA Tracked Shipping: <strong>$${usCost.toFixed(2)}</strong></span>
        </label>
      `;
      activeShippingMethod = 'us_standard';
      shippingCost = usCost;
    }

    optionsHtml += `
      <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.35rem;">
        Shipping to <strong>${activeShippingAddress.city || 'Mississauga'}, ${activeShippingAddress.province || 'ON'}</strong>
      </div>
    </div>`;

    shippingDisplay.innerHTML = optionsHtml;
  }

  // Tax calculation
  let taxRateInfo = PROVINCE_TAX_RATES[activeShippingAddress.province] || { rate: 0.13, label: 'HST 13%' };
  if (activeShippingAddress.country === 'US') {
    taxRateInfo = { rate: 0.0, label: 'Export (0%)' };
  }
  const taxAmount = taxableBase * taxRateInfo.rate;

  if (taxLabelEl) taxLabelEl.textContent = taxRateInfo.label;
  if (taxEl) taxEl.textContent = `$${taxAmount.toFixed(2)} CAD`;

  // Grand Total
  const grandTotal = taxableBase + shippingCost + taxAmount;
  if (grandEl) grandEl.textContent = `$${grandTotal.toFixed(2)} CAD`;

  saveCartSession();
}

/* ==========================================================================
   EVENT LISTENERS & INTERACTION HANDLERS
   ========================================================================== */
function initCartEventListeners() {
  const tbody = document.querySelector('#cart-table-body');
  const updateBtn = document.querySelector('#btn-update-cart');
  const applyCouponBtn = document.querySelector('#btn-apply-coupon');
  const couponInput = document.querySelector('#coupon-code-input');
  const shippingToggle = document.querySelector('#calc-shipping-toggle');
  const shippingForm = document.querySelector('#calc-shipping-form');
  const btnCalcUpdate = document.querySelector('#btn-calc-update');
  const checkoutBtn = document.querySelector('#btn-proceed-checkout');

  // Live Quantity Change Listener
  if (tbody) {
    tbody.addEventListener('input', (e) => {
      if (e.target.matches('[data-cart-qty-input]')) {
        const id = e.target.getAttribute('data-cart-qty-input');
        let newQty = parseInt(e.target.value, 10);
        if (isNaN(newQty) || newQty < 1) newQty = 1;

        pendingQtyChanges[id] = newQty;

        // Recalculate line subtotal live
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (item) {
          const lineEl = document.querySelector(`#line-subtotal-${id}`);
          if (lineEl) {
            lineEl.textContent = `$${(item.price * newQty).toFixed(2)}`;
          }
        }

        // Enable Update Cart Button
        if (updateBtn) {
          updateBtn.disabled = false;
          updateBtn.classList.remove('disabled');
        }

        // Recalculate totals panel live
        renderTotals();
      }
    });
  }

  // Update Cart Button Click
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      let cart = getCart();
      Object.keys(pendingQtyChanges).forEach(id => {
        const qty = pendingQtyChanges[id];
        const item = cart.find(i => i.id === id);
        if (item) item.quantity = qty;
      });

      saveCart(cart);
      pendingQtyChanges = {};
      renderCartView();
      showCartAlert('Shopping cart updated successfully.', 'success');
    });
  }

  // Apply Coupon Click
  if (applyCouponBtn && couponInput) {
    const handleApply = () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        showCartAlert('Please enter a coupon code.', 'error');
        return;
      }

      const match = VALID_COUPONS[code];
      if (!match) {
        showCartAlert(`Coupon "${code}" does not exist! Try BBC10 or WESTWOOD.`, 'error');
        return;
      }

      const subtotal = calculateLineSubtotalSum();
      if (match.minSubtotal && subtotal < match.minSubtotal) {
        showCartAlert(`Coupon "${code}" requires a minimum spend of $${match.minSubtotal.toFixed(2)}.`, 'error');
        return;
      }

      setAppliedCoupon({ code, ...match });
      couponInput.value = '';
      showCartAlert(`Coupon code applied successfully: ${match.label}`, 'success');
      renderCartView();
    };

    applyCouponBtn.addEventListener('click', handleApply);
    couponInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    });
  }

  // Shipping Form Expander Toggle
  if (shippingToggle && shippingForm) {
    shippingToggle.addEventListener('click', (e) => {
      e.preventDefault();
      shippingForm.classList.toggle('open');
    });
  }

  // Update Shipping Form Submit
  if (btnCalcUpdate) {
    btnCalcUpdate.addEventListener('click', () => {
      const country = document.querySelector('#calc-country').value;
      const province = document.querySelector('#calc-province').value;
      const city = document.querySelector('#calc-city').value.trim() || 'Mississauga';
      const postalCode = document.querySelector('#calc-postal').value.trim() || 'L4T 2T9';

      activeShippingAddress = {
        country,
        province,
        city,
        postalCode,
        hasCalculated: true
      };

      if (shippingForm) shippingForm.classList.remove('open');
      renderTotals();
      showCartAlert(`Shipping calculated for ${city}, ${province} (${country === 'CA' ? 'Canada' : 'USA'}).`, 'success');
    });
  }

  // Proceed to Checkout Button
  window.handleProceedToCheckout = function() {
    const cart = getCart();
    if (!cart || cart.length === 0) {
      if (typeof showToast === 'function') {
        showToast('Your shopping cart is currently empty!');
      } else {
        alert('Your cart is empty. Please add items to proceed.');
      }
      return;
    }

    // Ensure pending quantities are saved
    if (Object.keys(pendingQtyChanges).length > 0) {
      Object.keys(pendingQtyChanges).forEach(id => {
        const qty = pendingQtyChanges[id];
        const item = cart.find(i => String(i.id) === String(id));
        if (item) item.quantity = qty;
      });
      saveCart(cart);
    }

    saveCartSession();
    window.location.href = 'checkout.html';
  };

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.handleProceedToCheckout();
    });
  }
}

/* ==========================================================================
   GLOBAL HANDLERS ATTACHED TO WINDOW
   ========================================================================== */
window.handleRemoveClick = function(id) {
  delete pendingQtyChanges[id];
  removeCartItem(id);
  renderCartView();
};

window.stepCartItemQty = function(id, delta) {
  const cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;
  const current = pendingQtyChanges[id] !== undefined ? pendingQtyChanges[id] : item.quantity;
  const newQty = current + delta;
  if (newQty <= 0) {
    window.handleRemoveClick(id);
    return;
  }
  item.quantity = newQty;
  saveCart(cart);
  delete pendingQtyChanges[id];
  renderCartView();
  if (window.BBC_Cart && typeof window.BBC_Cart.updateBadge === 'function') {
    window.BBC_Cart.updateBadge();
  }
};

window.handleShippingMethodChange = function(method) {
  activeShippingMethod = method;
  renderTotals();
};

window.removeAppliedCoupon = function() {
  const coupon = getAppliedCoupon();
  const name = coupon ? coupon.code : 'Coupon';
  setAppliedCoupon(null);
  showCartAlert(`Removed coupon ${name}.`, 'success');
  renderCartView();
};

function renderAppliedCouponBadge() {
  const container = document.querySelector('#applied-coupon-container');
  if (!container) return;

  const coupon = getAppliedCoupon();
  if (!coupon) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="applied-coupon-row">
      <div>
        <strong>Coupon Applied:</strong> ${coupon.code} &mdash; <span style="color: var(--accent-gold); font-weight: 700;">${coupon.label}</span>
      </div>
      <a href="javascript:void(0)" onclick="removeAppliedCoupon()" class="coupon-remove-link" aria-label="Remove coupon">
        [Remove]
      </a>
    </div>
  `;
}

function showCartAlert(message, type = 'success') {
  const container = document.querySelector('#cart-alert-container');
  if (!container) return;

  const alertClass = type === 'success' ? 'form-alert-success' : 'form-alert-error';
  const iconSvg = type === 'success' 
    ? '<svg viewBox="0 0 24 24" class="form-alert-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
    : '<svg viewBox="0 0 24 24" class="form-alert-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';

  container.innerHTML = `
    <div class="form-alert ${alertClass}">
      ${iconSvg}
      <div>${message}</div>
    </div>
  `;

  // Auto scroll to alert so customer sees it
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Auto-run if DOM is already parsed, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#cart-main-layout')) {
      initCartPage();
    }
  });
} else {
  if (document.querySelector('#cart-main-layout')) {
    initCartPage();
  }
}
