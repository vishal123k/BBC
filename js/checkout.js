/**
 * BROWN BOYS CUSTOMS (BBC) — CHECKOUT CONTROLLER
 * Phase 11: Checkout Page (checkout.html)
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

let checkoutShippingMethod = 'pickup'; // 'pickup', 'standard', 'express', 'us_standard'
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

function initCheckoutPage() {
  const cart = getCart();
  const emptyNotice = document.querySelector('#checkout-empty-notice');
  const contentWrap = document.querySelector('#checkout-content-wrap');

  if (!cart || cart.length === 0) {
    if (emptyNotice) emptyNotice.style.display = 'block';
    if (contentWrap) contentWrap.style.display = 'none';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';
  if (contentWrap) contentWrap.style.display = 'block';

  loadSessionPreferences();
  initAccordions();
  initAddressToggles();
  initPaymentMethodSelector();
  initCardFormatters();
  renderOrderReview();
  initFormValidationAndSubmit();

  // Listen for Province/Country changes to recalculate live taxes & shipping
  const billingState = document.querySelector('#billing_state');
  const billingCountry = document.querySelector('#billing_country');
  const shippingState = document.querySelector('#shipping_state');
  const shippingCountry = document.querySelector('#shipping_country');

  if (billingState) billingState.addEventListener('change', renderOrderReview);
  if (billingCountry) billingCountry.addEventListener('change', renderOrderReview);
  if (shippingState) shippingState.addEventListener('change', renderOrderReview);
  if (shippingCountry) shippingCountry.addEventListener('change', renderOrderReview);
}

function loadSessionPreferences() {
  try {
    const raw = sessionStorage.getItem('bbc_cart_session');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.shippingMethod) checkoutShippingMethod = data.shippingMethod;
      if (data.shippingAddress) {
        const countryEl = document.querySelector('#billing_country');
        const stateEl = document.querySelector('#billing_state');
        const cityEl = document.querySelector('#billing_city');
        const postEl = document.querySelector('#billing_postcode');
        if (countryEl && data.shippingAddress.country) countryEl.value = data.shippingAddress.country;
        if (stateEl && data.shippingAddress.province) stateEl.value = data.shippingAddress.province;
        if (cityEl && data.shippingAddress.city) cityEl.value = data.shippingAddress.city;
        if (postEl && data.shippingAddress.postalCode) postEl.value = data.shippingAddress.postalCode;
      }
    }
  } catch (e) {
    console.warn('Could not read session preferences:', e);
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
   TOP ACCORDIONS & COUPONS
   ========================================================================== */
function initAccordions() {
  const loginToggle = document.querySelector('#toggle-login-accordion');
  const loginContent = document.querySelector('#login-accordion-content');
  const couponToggle = document.querySelector('#toggle-coupon-accordion');
  const couponContent = document.querySelector('#coupon-accordion-content');
  const applyBtn = document.querySelector('#btn-checkout-apply-coupon');
  const couponInput = document.querySelector('#checkout-coupon-input');
  const statusEl = document.querySelector('#checkout-coupon-status');

  if (loginToggle && loginContent) {
    loginToggle.addEventListener('click', () => {
      loginContent.classList.toggle('open');
    });
  }

  if (couponToggle && couponContent) {
    couponToggle.addEventListener('click', () => {
      couponContent.classList.toggle('open');
    });
  }

  if (applyBtn && couponInput) {
    const handleApply = () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        if (statusEl) statusEl.innerHTML = '<span style="color: #ef4444; font-size: 0.85rem;">Please enter a coupon code.</span>';
        return;
      }

      const match = VALID_COUPONS[code];
      if (!match) {
        if (statusEl) statusEl.innerHTML = `<span style="color: #ef4444; font-size: 0.85rem;">Coupon "${code}" does not exist! Try BBC10 or WESTWOOD.</span>`;
        return;
      }

      const cart = getCart();
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (match.minSubtotal && subtotal < match.minSubtotal) {
        if (statusEl) statusEl.innerHTML = `<span style="color: #ef4444; font-size: 0.85rem;">Coupon "${code}" requires minimum spend of $${match.minSubtotal.toFixed(2)}.</span>`;
        return;
      }

      setAppliedCoupon({ code, ...match });
      couponInput.value = '';
      if (statusEl) statusEl.innerHTML = `<span style="color: #22c55e; font-size: 0.85rem;">✓ Coupon code "${code}" applied successfully!</span>`;
      renderOrderReview();
    };

    applyBtn.addEventListener('click', handleApply);
    couponInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    });
  }
}

/* ==========================================================================
   ADDRESS & ACCOUNT TOGGLES
   ========================================================================== */
function initAddressToggles() {
  const shipDiffCheckbox = document.querySelector('#ship_to_different_address');
  const shipFieldsWrap = document.querySelector('#shipping_fields_wrap');
  const createAccCheckbox = document.querySelector('#create_account_toggle');
  const passWrap = document.querySelector('#account_password_field');

  if (shipDiffCheckbox && shipFieldsWrap) {
    shipDiffCheckbox.addEventListener('change', () => {
      shipFieldsWrap.style.display = shipDiffCheckbox.checked ? 'block' : 'none';
      renderOrderReview();
    });
  }

  if (createAccCheckbox && passWrap) {
    createAccCheckbox.addEventListener('change', () => {
      passWrap.style.display = createAccCheckbox.checked ? 'block' : 'none';
    });
  }
}

/* ==========================================================================
   PAYMENT METHOD SELECTOR
   ========================================================================== */
function initPaymentMethodSelector() {
  const methodRadios = document.querySelectorAll('input[name="payment_method"]');
  const methodRows = document.querySelectorAll('.payment-method-row');

  methodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      methodRows.forEach(row => row.classList.remove('selected'));
      const activeRow = radio.closest('.payment-method-row');
      if (activeRow) activeRow.classList.add('selected');
    });
  });
}

function initCardFormatters() {
  const cardNum = document.querySelector('#stripe_card_num');
  const cardExp = document.querySelector('#stripe_card_exp');
  const cardCvc = document.querySelector('#stripe_card_cvc');

  if (cardNum) {
    cardNum.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.replace(/(.{4})/g, '$1 ').trim();
      e.target.value = val;
    });
  }

  if (cardExp) {
    cardExp.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) {
        val = val.substring(0, 2) + ' / ' + val.substring(2);
      }
      e.target.value = val;
    });
  }

  if (cardCvc) {
    cardCvc.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }
}

/* ==========================================================================
   RENDER "YOUR ORDER" REVIEW TABLE
   ========================================================================== */
function renderOrderReview() {
  const cart = getCart();
  const tbody = document.querySelector('#checkout-order-items-body');
  const subtotalValEl = document.querySelector('#checkout-subtotal-val');
  const discountRow = document.querySelector('#checkout-discount-row');
  const discountValEl = document.querySelector('#checkout-discount-val');
  const shippingOptionsEl = document.querySelector('#checkout-shipping-options');
  const taxLabelEl = document.querySelector('#checkout-tax-label');
  const taxValEl = document.querySelector('#checkout-tax-val');
  const totalValEl = document.querySelector('#checkout-total-val');

  if (!cart || cart.length === 0 || !tbody) return;

  // Render Product Rows: [Product Thumb + Name + Qty] on left, Subtotal on right
  let subtotal = 0;
  tbody.innerHTML = cart.map(item => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    const imageSrc = item.image && item.image.trim() !== '' ? item.image : 'images/no-image-placeholder.svg';

    return `
      <tr class="checkout-item-row" style="border-bottom: 1px solid rgba(255,255,255,0.06);">
        <td style="display:flex;align-items:center;gap:12px;padding:0.85rem 0;">
          <img src="${imageSrc}" alt="${escapeHtml(item.name)}" class="checkout-prod-thumb" style="width:52px;height:52px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:#000;" onerror="this.src='images/no-image-placeholder.svg'">
          <div>
            <div style="font-weight:700;color:#ffffff;line-height:1.3;font-size:0.95rem;">${escapeHtml(item.name)}</div>
            <div style="font-size:0.75rem;color:#c9a13d;font-weight:700;margin-top:2px;">QTY: ${item.quantity} &bull; $${parseFloat(item.price).toFixed(2)} each</div>
          </div>
        </td>
        <td style="text-align: right; color: var(--accent-gold); font-family: var(--font-heading); font-size: 1.2rem; font-weight:800; vertical-align:middle; padding:0.85rem 0;">
          $${lineTotal.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  if (subtotalValEl) subtotalValEl.textContent = `$${subtotal.toFixed(2)} CAD`;

  // Coupon discount
  let discount = 0;
  const coupon = getAppliedCoupon();
  if (coupon) {
    if (coupon.type === 'percent') {
      discount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = Math.min(subtotal, coupon.value);
    }
    if (discountRow && discountValEl) {
      discountRow.style.display = 'table-row';
      discountValEl.textContent = `-$${discount.toFixed(2)} CAD (${coupon.code})`;
    }
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  const taxableBase = Math.max(0, subtotal - discount);

  // Address Resolution (Shipping vs Billing)
  const shipDiffCheckbox = document.querySelector('#ship_to_different_address');
  const isShipDiff = shipDiffCheckbox && shipDiffCheckbox.checked;

  const countryEl = isShipDiff ? document.querySelector('#shipping_country') : document.querySelector('#billing_country');
  const stateEl = isShipDiff ? document.querySelector('#shipping_state') : document.querySelector('#billing_state');

  const country = countryEl ? countryEl.value : 'CA';
  const province = stateEl ? stateEl.value : 'ON';

  // Shipping Calculation
  const isCanada = country === 'CA';
  const isFreeCanadaThreshold = subtotal >= 300 || (coupon && coupon.type === 'shipping');
  const stdCost = isFreeCanadaThreshold ? 0.00 : 15.00;
  const expressCost = 25.00;
  const usCost = 35.00;

  let shippingCost = 0;

  if (shippingOptionsEl) {
    if (isCanada) {
      if (checkoutShippingMethod === 'us_standard') checkoutShippingMethod = 'pickup';

      shippingOptionsEl.innerHTML = `
        <label style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
          <span>Free In-Store Pickup (Westwood Mall): <strong>Free ($0.00)</strong></span>
          <input type="radio" name="checkout_shipping_rate" value="pickup" ${checkoutShippingMethod === 'pickup' ? 'checked' : ''} onchange="handleCheckoutShippingChange('pickup')">
        </label>
        <label style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
          <span>Canada Standard Shipping: <strong>${stdCost === 0 ? 'Free' : '$' + stdCost.toFixed(2)}</strong></span>
          <input type="radio" name="checkout_shipping_rate" value="standard" ${checkoutShippingMethod === 'standard' ? 'checked' : ''} onchange="handleCheckoutShippingChange('standard')">
        </label>
        <label style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
          <span>Express Courier Delivery: <strong>$${expressCost.toFixed(2)}</strong></span>
          <input type="radio" name="checkout_shipping_rate" value="express" ${checkoutShippingMethod === 'express' ? 'checked' : ''} onchange="handleCheckoutShippingChange('express')">
        </label>
      `;

      if (checkoutShippingMethod === 'standard') shippingCost = stdCost;
      else if (checkoutShippingMethod === 'express') shippingCost = expressCost;
      else shippingCost = 0.00;
    } else {
      // US Shipping
      checkoutShippingMethod = 'us_standard';
      shippingCost = usCost;
      shippingOptionsEl.innerHTML = `
        <label style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
          <span>USA Tracked Shipping: <strong>$${usCost.toFixed(2)}</strong></span>
          <input type="radio" name="checkout_shipping_rate" value="us_standard" checked onchange="handleCheckoutShippingChange('us_standard')">
        </label>
      `;
    }
  }

  // Provincial Tax
  let taxInfo = PROVINCE_TAX_RATES[province] || { rate: 0.13, label: 'HST 13%' };
  if (!isCanada) {
    taxInfo = { rate: 0.0, label: 'Export (0%)' };
  }
  const taxAmount = taxableBase * taxInfo.rate;

  if (taxLabelEl) taxLabelEl.textContent = taxInfo.label;
  if (taxValEl) taxValEl.textContent = `$${taxAmount.toFixed(2)} CAD`;

  // Grand Total
  const grandTotal = taxableBase + shippingCost + taxAmount;
  if (totalValEl) totalValEl.textContent = `$${grandTotal.toFixed(2)} CAD`;
}

window.handleCheckoutShippingChange = function(method) {
  checkoutShippingMethod = method;
  renderOrderReview();
};

/* ==========================================================================
   FORM VALIDATION & SUBMISSION HANDLER
   ========================================================================== */
function initFormValidationAndSubmit() {
  const form = document.querySelector('#checkout-form');
  const errorSummaryBox = document.querySelector('#checkout-error-summary');
  const errorSummaryList = document.querySelector('#error-summary-list');
  const submitBtn = document.querySelector('#btn-place-order');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset previous errors
    clearValidationErrors();

    const errors = [];
    const fieldsToValidate = [
      { id: 'billing_first_name', name: 'Billing First name', required: true },
      { id: 'billing_last_name', name: 'Billing Last name', required: true },
      { id: 'billing_country', name: 'Billing Country / Region', required: true },
      { id: 'billing_address_1', name: 'Billing Street address', required: true },
      { id: 'billing_city', name: 'Billing Town / City', required: true },
      { id: 'billing_state', name: 'Billing Province', required: true },
      { id: 'billing_postcode', name: 'Billing Postal code', required: true },
      { id: 'billing_phone', name: 'Billing Phone', required: true },
      { id: 'billing_email', name: 'Billing Email address', required: true, isEmail: true }
    ];

    // Check account password if checked
    const createAcc = document.querySelector('#create_account_toggle');
    if (createAcc && createAcc.checked) {
      fieldsToValidate.push({ id: 'account_password', name: 'Account password', required: true });
    }

    // Check shipping fields if ship to different address checked
    const shipDiff = document.querySelector('#ship_to_different_address');
    if (shipDiff && shipDiff.checked) {
      fieldsToValidate.push(
        { id: 'shipping_first_name', name: 'Shipping First name', required: true },
        { id: 'shipping_last_name', name: 'Shipping Last name', required: true },
        { id: 'shipping_address_1', name: 'Shipping Street address', required: true },
        { id: 'shipping_city', name: 'Shipping Town / City', required: true },
        { id: 'shipping_state', name: 'Shipping Province', required: true },
        { id: 'shipping_postcode', name: 'Shipping Postal code', required: true }
      );
    }

    // Perform checks
    fieldsToValidate.forEach(f => {
      const el = document.querySelector(`#${f.id}`);
      if (!el) return;
      const val = el.value.trim();

      if (f.required && !val) {
        errors.push(`${f.name} is a required field.`);
        markFieldError(f.id, `${f.name} is a required field.`);
      } else if (f.isEmail && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errors.push('Billing Email address is not a valid email address.');
        markFieldError(f.id, 'Please enter a valid email address.');
      }
    });

    // Check shipping method selection
    const activeRadio = document.querySelector('input[name="checkout_shipping_rate"]:checked');
    if (!activeRadio) {
      errors.push('No shipping method has been selected. Please double check your address, or contact us if you need any help.');
    }

    // Check credit card fields if Stripe is selected
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'stripe';
    if (paymentMethod === 'stripe') {
      const cardNum = document.querySelector('#stripe_card_num')?.value.replace(/\s/g, '');
      const cardExp = document.querySelector('#stripe_card_exp')?.value.trim();
      const cardCvc = document.querySelector('#stripe_card_cvc')?.value.trim();

      if (!cardNum || cardNum.length < 13) {
        errors.push('Credit Card Number is invalid or incomplete.');
        markFieldError('stripe_card_num');
      }
      if (!cardExp || !cardExp.includes('/')) {
        errors.push('Card Expiry date is invalid.');
        markFieldError('stripe_card_exp');
      }
      if (!cardCvc || cardCvc.length < 3) {
        errors.push('Card CVC code is invalid.');
        markFieldError('stripe_card_cvc');
      }
    }

    // Check terms agreement
    const termsAgree = document.querySelector('#terms_conditions_agree');
    if (termsAgree && !termsAgree.checked) {
      errors.push('You must read and agree to the website terms and conditions to proceed with your order.');
      const termsErr = document.querySelector('#err-terms_conditions_agree');
      if (termsErr) termsErr.classList.add('visible');
    }

    // If Errors Exist: Show Box and Auto-Scroll!
    if (errors.length > 0) {
      errorSummaryList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
      errorSummaryBox.classList.add('show');
      
      // Auto-scroll smoothly to error summary box
      errorSummaryBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // SUCCESS: Construct Order Payload & Submit
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Secure Order...';

    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const coupon = getAppliedCoupon();
    let discount = 0;
    if (coupon) {
      discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : Math.min(subtotal, coupon.value);
    }
    const taxableBase = Math.max(0, subtotal - discount);

    const shipMethod = document.querySelector('input[name="checkout_shipping_rate"]:checked')?.value || checkoutShippingMethod;
    let shippingFee = 0;
    if (shipMethod === 'standard') shippingFee = (subtotal >= 300 || coupon?.type === 'shipping') ? 0 : 15;
    else if (shipMethod === 'express') shippingFee = 25;
    else if (shipMethod === 'us_standard') shippingFee = 35;

    const country = document.querySelector('#billing_country')?.value || 'CA';
    const state = document.querySelector('#billing_state')?.value || 'ON';
    const taxRate = country === 'CA' ? (PROVINCE_TAX_RATES[state]?.rate || 0.13) : 0;
    const tax = taxableBase * taxRate;
    const total = taxableBase + shippingFee + tax;

    const orderNumber = 'BBC-' + Math.floor(10000 + Math.random() * 90000);
    const orderDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const orderData = {
      orderNumber,
      orderDate,
      items: cart,
      subtotal,
      discount,
      coupon: coupon ? coupon.code : null,
      shippingMethod: shipMethod,
      shippingFee,
      tax,
      total,
      paymentMethod,
      billing: {
        firstName: document.querySelector('#billing_first_name').value.trim(),
        lastName: document.querySelector('#billing_last_name').value.trim(),
        company: document.querySelector('#billing_company')?.value.trim() || '',
        country,
        address1: document.querySelector('#billing_address_1').value.trim(),
        address2: document.querySelector('#billing_address_2')?.value.trim() || '',
        city: document.querySelector('#billing_city').value.trim(),
        state,
        postcode: document.querySelector('#billing_postcode').value.trim(),
        phone: document.querySelector('#billing_phone').value.trim(),
        email: document.querySelector('#billing_email').value.trim()
      },
      shipping: (shipDiff && shipDiff.checked) ? {
        firstName: document.querySelector('#shipping_first_name').value.trim(),
        lastName: document.querySelector('#shipping_last_name').value.trim(),
        address1: document.querySelector('#shipping_address_1').value.trim(),
        address2: document.querySelector('#shipping_address_2')?.value.trim() || '',
        city: document.querySelector('#shipping_city').value.trim(),
        state: document.querySelector('#shipping_state').value,
        postcode: document.querySelector('#shipping_postcode').value.trim()
      } : null,
      orderNotes: document.querySelector('#order_comments')?.value.trim() || ''
    };

    // Save to session for confirmation page
    sessionStorage.setItem('bbc_last_order', JSON.stringify(orderData));

    // Try sending to checkout.php
    try {
      await fetch('checkout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch (e) {
      console.warn('Backend endpoint checkout.php returned status, continuing client redirect:', e);
    }

    // Clear cart and redirect
    clearCart();
    setAppliedCoupon(null);
    sessionStorage.removeItem('bbc_cart_session');

    setTimeout(() => {
      window.location.href = `order-received.html?order_id=${orderNumber}&key=${encodeURIComponent(orderData.billing.email)}`;
    }, 800);
  });
}

function clearValidationErrors() {
  const errorSummaryBox = document.querySelector('#checkout-error-summary');
  if (errorSummaryBox) errorSummaryBox.classList.remove('show');

  document.querySelectorAll('.form-control.input-has-error').forEach(el => {
    el.classList.remove('input-has-error');
  });

  document.querySelectorAll('.field-error-msg.visible').forEach(el => {
    el.classList.remove('visible');
  });
}

function markFieldError(fieldId, customMsg) {
  const el = document.querySelector(`#${fieldId}`);
  if (el) el.classList.add('input-has-error');

  const errEl = document.querySelector(`#err-${fieldId}`);
  if (errEl) {
    if (customMsg) errEl.textContent = customMsg;
    errEl.classList.add('visible');
  }
}

// Auto-run if DOM is already parsed, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#checkout-form')) {
      initCheckoutPage();
    }
  });
} else {
  if (document.querySelector('#checkout-form')) {
    initCheckoutPage();
  }
}
window.initCheckoutPage = initCheckoutPage;
