/**
 * BROWN BOYS CUSTOMS (BBC) — CORE CART ENGINE
 * Phase 11: Cart, Checkout & Payment
 * Key: bbc_cart
 */

const CART_KEY = 'bbc_cart';
const OLD_CART_KEY = 'bbc_cart_items';

/**
 * Global HTML Escaper to prevent XSS and template literal errors
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

/**
 * Retrieve current cart array from localStorage
 * Returns: Array of { id, name, price, image, quantity }
 */
function getCart() {
  try {
    // Migration check: if old key exists and new key doesn't, migrate it
    if (!localStorage.getItem(CART_KEY) && localStorage.getItem(OLD_CART_KEY)) {
      const oldData = localStorage.getItem(OLD_CART_KEY);
      localStorage.setItem(CART_KEY, oldData);
      localStorage.removeItem(OLD_CART_KEY);
    }

    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter and normalize each item so it NEVER breaks the UI
    const validCart = [];
    for (let i = 0; i < parsed.length; i++) {
      let rawItem = parsed[i];
      if (!rawItem || typeof rawItem !== 'object') continue;

      // Handle nested product object if present
      if (rawItem.product && typeof rawItem.product === 'object') {
        rawItem = {
          ...rawItem.product,
          quantity: rawItem.quantity || rawItem.qty || 1
        };
      }

      const id = String(rawItem.id || rawItem.productId || ('item_' + i));
      const name = String(rawItem.name || rawItem.title || 'BBC Custom Product');
      
      // Handle price cleanly (whether number or string with '$')
      let price = 0;
      if (typeof rawItem.price === 'number') {
        price = isNaN(rawItem.price) ? 0 : rawItem.price;
      } else if (typeof rawItem.price === 'string') {
        price = parseFloat(rawItem.price.replace(/[^0-9.]/g, '')) || 0;
      }

      // Handle image cleanly
      let image = 'images/no-image-placeholder.svg';
      if (typeof rawItem.image === 'string' && rawItem.image.trim()) {
        image = rawItem.image.trim();
      } else if (Array.isArray(rawItem.image) && rawItem.image[0]) {
        image = String(rawItem.image[0]);
      } else if (rawItem.gallery && Array.isArray(rawItem.gallery) && rawItem.gallery[0]) {
        image = String(rawItem.gallery[0]);
      }

      const quantity = Math.max(1, parseInt(rawItem.quantity || rawItem.qty, 10) || 1);

      validCart.push({
        id,
        name,
        price,
        image,
        quantity
      });
    }

    return validCart;
  } catch (err) {
    console.error('Error reading bbc_cart:', err);
    return [];
  }
}

/**
 * Persist cart array to localStorage and notify UI
 */
function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Trigger custom event for same-tab reactive updates
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    updateCartBadges();
  } catch (err) {
    console.error('Error saving bbc_cart:', err);
  }
}

/**
 * Add product to cart with specified quantity
 */
function addToCart(product, quantity = 1) {
  if (!product || !product.id) return;
  const qty = parseInt(quantity, 10) || 1;
  if (qty <= 0) return;

  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === product.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      image: product.image || 'images/no-image-placeholder.svg',
      quantity: qty
    });
  }

  saveCart(cart);
  showToast(`Added ${qty} × "${product.name}" to your cart!`);
}

/**
 * Update quantity of a single item
 */
function updateCartItemQty(id, newQty) {
  let cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;

  const qty = parseInt(newQty, 10);
  if (qty <= 0) {
    cart = cart.filter(i => String(i.id) !== String(id));
  } else {
    item.quantity = qty;
  }

  saveCart(cart);
}

/**
 * Remove an item completely
 */
function removeCartItem(id) {
  let cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  const itemName = item ? item.name : 'Item';
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart(cart);
  showToast(`Removed "${itemName}" from cart.`);
}

/**
 * Empty the cart
 */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: [] } }));
  updateCartBadges();
}

/**
 * Total quantity count
 */
function getCartTotalQty() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
}

/**
 * Subtotal dollar amount
 */
function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1), 0);
}

/**
 * Updates all cart badges across headers and drawers
 */
function updateCartBadges() {
  const totalQty = getCartTotalQty();
  const badges = document.querySelectorAll('.header-cart-badge, [data-cart-badge]');
  
  badges.forEach(badge => {
    badge.textContent = totalQty;
    if (totalQty > 0) {
      badge.classList.add('has-items');
    } else {
      badge.classList.remove('has-items');
    }
  });
}

/**
 * Global Toast Notification
 */
function showToast(message) {
  let toast = document.querySelector('#bbc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bbc-toast';
    toast.className = 'bbc-toast';
    toast.innerHTML = `
      <div class="toast-icon">✓</div>
      <div class="toast-body">
        <span id="bbc-toast-msg" style="font-weight: 600; font-size: 0.95rem; color: #fff;"></span>
        <a href="cart.html" class="toast-action-link">View Cart &rarr;</a>
      </div>
    `;
    document.body.appendChild(toast);
  }

  const msgEl = toast.querySelector('#bbc-toast-msg');
  if (msgEl) msgEl.textContent = message;

  toast.classList.add('show');
  if (window.toastTimer) clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3800);
}

// Auto-initialize badges and listen for updates
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadges();
  
  // Listen for storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY || e.key === OLD_CART_KEY) {
      updateCartBadges();
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: getCart() } }));
    }
  });
});
