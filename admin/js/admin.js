/**
 * Brown Boys Customs (BBC) — Admin Dashboard JavaScript
 * Handles AJAX CRUD, image uploads, tab routing, modals, and notifications.
 */

let allProducts = [];
let allBlogs = [];
let allOrders = [];
let allInquiries = [];
let currentSettings = {};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSearchFilters();
  loadAllData();
});

// Toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('admin-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.style.borderLeftColor = isError ? 'var(--admin-danger)' : 'var(--admin-gold)';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Tab navigation
function initTabs() {
  const tabItems = document.querySelectorAll('.admin-nav-item');
  tabItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');

  const activeNavItem = document.querySelector(`.admin-nav-item[data-tab="${tabId}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.style.display = 'block';

  // Lazy refresh if specific tab opened
  if (tabId === 'tab-products') renderProductsTable();
  if (tabId === 'tab-blogs') renderBlogsTable();
  if (tabId === 'tab-orders') renderOrdersTable();
  if (tabId === 'tab-inquiries') renderInquiriesTable();
  if (tabId === 'tab-settings') populateSettingsForm();
}

// Search and filter listeners
function initSearchFilters() {
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterProducts());
  }

  const catFilter = document.getElementById('product-category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', () => filterProducts());
  }
}

// Initial Data Fetch
async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadProducts(),
    loadBlogs(),
    loadOrders(),
    loadInquiries(),
    loadSettings()
  ]);
}

// ================= STATS & OVERVIEW =================
async function loadStats() {
  try {
    const res = await fetch('api.php?action=get_stats');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stats) {
        document.getElementById('stat-products').textContent = data.stats.total_products || 0;
        document.getElementById('stat-orders').textContent = data.stats.total_orders || 0;
        document.getElementById('stat-inquiries').textContent = data.stats.total_inquiries || 0;
        document.getElementById('stat-blogs').textContent = data.stats.total_blogs || 0;
        return;
      }
    }
  } catch (err) {
    // Fallback for local preview mode
  }

  // Local fallback calculations
  document.getElementById('stat-products').textContent = allProducts.length || 0;
  document.getElementById('stat-orders').textContent = allOrders.length || 0;
  document.getElementById('stat-inquiries').textContent = allInquiries.length || 0;
  document.getElementById('stat-blogs').textContent = allBlogs.length || 0;
}

function renderOverviewSummaries() {
  // Recent Orders (last 5)
  const ordersTbody = document.getElementById('overview-orders-tbody');
  if (ordersTbody) {
    if (!allOrders.length) {
      ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">No orders recorded yet. Place a test order in shop checkout!</td></tr>`;
    } else {
      const recents = allOrders.slice(0, 5);
      ordersTbody.innerHTML = recents.map(order => {
        const orderId = order.orderNumber || order.order_id || 'N/A';
        const dateStr = order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A');
        const fName = order.billing?.firstName || order.billing?.first_name || '';
        const lName = order.billing?.lastName || order.billing?.last_name || '';
        const name = `${fName} ${lName}`.trim() || 'Guest';
        const itemCount = Array.isArray(order.items) ? order.items.length : 0;
        const totalVal = order.total !== undefined ? order.total : (order.pricing?.total !== undefined ? order.pricing.total : 0);
        const total = `$${parseFloat(totalVal || 0).toFixed(2)}`;
        return `
          <tr>
            <td><strong style="color:var(--admin-gold);">${escapeHtml(orderId)}</strong></td>
            <td>${dateStr}</td>
            <td>${escapeHtml(name)}</td>
            <td>${itemCount} item(s)</td>
            <td><strong>${total}</strong></td>
            <td>${getStatusBadge(order.status)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Recent Inquiries (last 5)
  const inqTbody = document.getElementById('overview-inquiries-tbody');
  if (inqTbody) {
    if (!allInquiries.length) {
      inqTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">No inquiries recorded yet.</td></tr>`;
    } else {
      const recents = allInquiries.slice(0, 5);
      inqTbody.innerHTML = recents.map(inq => {
        const dateStr = inq.date ? new Date(inq.date).toLocaleDateString() : 'N/A';
        return `
          <tr>
            <td>${dateStr}</td>
            <td><strong>${escapeHtml(inq.name || 'Anonymous')}</strong></td>
            <td><a href="mailto:${escapeHtml(inq.email || '')}" style="color:var(--admin-gold);">${escapeHtml(inq.email || '')}</a></td>
            <td>${escapeHtml(inq.subject || 'General Inquiry')}</td>
            <td>
              <button class="btn-action-icon" title="View Message" onclick="viewInquiryDetails('${inq.id}')">
                <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

// ================= PRODUCTS CRUD =================
async function loadProducts() {
  try {
    const res = await fetch('api.php?action=get_products');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        allProducts = data.products;
        populateCategoryFilter();
        renderProductsTable();
        return;
      }
    }
  } catch (err) {
    // API call failed, try direct JSON fallback for local preview
  }

  try {
    const fallbackRes = await fetch('../data/products.json');
    if (fallbackRes.ok) {
      allProducts = await fallbackRes.json();
      populateCategoryFilter();
      renderProductsTable();
    }
  } catch (e) {
    console.error('Failed to load products from JSON:', e);
  }
}

function populateCategoryFilter() {
  const catFilter = document.getElementById('product-category-filter');
  if (!catFilter) return;

  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
  catFilter.innerHTML = '<option value="">All Categories</option>' +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function filterProducts() {
  const q = (document.getElementById('product-search-input')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('product-category-filter')?.value || '';

  const filtered = allProducts.filter(p => {
    const matchesQ = !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.id && String(p.id).toLowerCase().includes(q));
    const matchesCat = !cat || p.category === cat;
    return matchesQ && matchesCat;
  });

  renderProductsTable(filtered);
}

function renderProductsTable(productsToRender = allProducts) {
  const tbody = document.getElementById('products-table-tbody');
  if (!tbody) return;

  if (!productsToRender.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">No products match your criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = productsToRender.map(p => {
    const imgPath = p.image ? (p.image.startsWith('http') || p.image.startsWith('../') ? p.image : `../${p.image}`) : '../images/no-image-placeholder.svg';
    const saleVal = (p.comparePrice !== undefined && p.comparePrice !== null && p.comparePrice !== '') ? parseFloat(p.comparePrice) : (p.sale_price ? parseFloat(p.sale_price) : null);
    const regularPrice = parseFloat(p.price || 0);
    const priceDisplay = (saleVal && saleVal > regularPrice) ? `<span style="text-decoration:line-through;color:var(--admin-text-dim);font-size:0.85rem;margin-right:6px;">$${saleVal.toFixed(2)}</span><strong style="color:var(--admin-gold);">$${regularPrice.toFixed(2)}</strong>` : `<strong>$${regularPrice.toFixed(2)}</strong>`;
    const stockPill = (p.inStock !== false && p.in_stock !== false) ? `<span class="badge-pill pill-success">In Stock</span>` : `<span class="badge-pill pill-danger">Out of Stock</span>`;
    const featuredPill = p.featured ? `<span class="badge-pill pill-gold" style="margin-left:4px;">Featured</span>` : '';

    return `
      <tr>
        <td>
          <img src="${escapeHtml(imgPath)}" class="product-thumb" alt="Product" onerror="this.src='../images/no-image-placeholder.svg'">
        </td>
        <td>
          <div style="font-weight:700;color:#fff;">${escapeHtml(p.name || 'Untitled')}</div>
          <div style="font-size:0.78rem;color:var(--admin-text-dim);">SKU: ${escapeHtml(p.sku || 'N/A')} | ID: ${escapeHtml(p.id)}</div>
        </td>
        <td>
          <span style="color:var(--admin-text-muted);font-size:0.88rem;">${escapeHtml(p.category || 'General')}</span>
        </td>
        <td>${priceDisplay}</td>
        <td>${stockPill} ${featuredPill}</td>
        <td style="text-align:right;">
          <button class="btn-action-icon" title="Edit Product" onclick="openProductModal('${p.id}')">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="btn-action-icon btn-delete" title="Delete Product" onclick="deleteProduct('${p.id}')" style="margin-left:6px;">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  form.reset();

  if (productId) {
    const p = allProducts.find(item => String(item.id) === String(productId));
    if (p) {
      title.textContent = `Edit Product: ${p.name}`;
      document.getElementById('prod-id').value = p.id;
      document.getElementById('prod-name').value = p.name || '';
      document.getElementById('prod-category').value = p.category || '';
      document.getElementById('prod-subcategory').value = p.subCategory || p.subcategory || '';
      document.getElementById('prod-price').value = p.price || '';
      document.getElementById('prod-sale-price').value = p.comparePrice || p.sale_price || '';
      document.getElementById('prod-sku').value = p.sku || '';
      document.getElementById('prod-stock').value = (p.inStock !== false && p.in_stock !== false) ? 'true' : 'false';
      document.getElementById('prod-featured').checked = !!p.featured;
      document.getElementById('prod-image-url').value = p.image || '';
      document.getElementById('prod-description').value = p.shortDescription || p.fullDescription || p.description || '';

      const preview = document.getElementById('prod-image-preview');
      const imgPath = p.image ? (p.image.startsWith('http') || p.image.startsWith('../') ? p.image : `../${p.image}`) : '../images/no-image-placeholder.svg';
      preview.src = imgPath;
    }
  } else {
    title.textContent = 'Add New Product';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-image-preview').src = '../images/no-image-placeholder.svg';
  }

  modal.classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

async function handleProductImageUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    showToast('Uploading product image...');
    const res = await fetch('api.php?action=upload_image', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success && data.path) {
      document.getElementById('prod-image-url').value = data.path;
      document.getElementById('prod-image-preview').src = `../${data.path}`;
      showToast('Image uploaded successfully!');
    } else {
      showToast(data.message || 'Image upload failed', true);
    }
  } catch (err) {
    showToast('Error uploading image', true);
  }
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const salePriceVal = document.getElementById('prod-sale-price').value ? parseFloat(document.getElementById('prod-sale-price').value) : null;
  const regularPriceVal = parseFloat(document.getElementById('prod-price').value) || 0;
  const descVal = document.getElementById('prod-description').value.trim();
  const subcatVal = document.getElementById('prod-subcategory').value.trim();

  const productData = {
    id: id || undefined,
    name: document.getElementById('prod-name').value.trim(),
    category: document.getElementById('prod-category').value.trim(),
    subCategory: subcatVal,
    subcategory: subcatVal,
    price: regularPriceVal,
    comparePrice: salePriceVal,
    sale_price: salePriceVal,
    onSale: !!salePriceVal,
    sku: document.getElementById('prod-sku').value.trim(),
    inStock: document.getElementById('prod-stock').value === 'true',
    in_stock: document.getElementById('prod-stock').value === 'true',
    featured: document.getElementById('prod-featured').checked,
    image: document.getElementById('prod-image-url').value.trim() || 'images/no-image-placeholder.svg',
    shortDescription: descVal,
    fullDescription: descVal,
    description: descVal
  };

  try {
    const btn = document.getElementById('btn-save-product');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const res = await fetch('api.php?action=save_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();

    btn.disabled = false;
    btn.textContent = 'Save Product';

    if (data.success) {
      showToast('Product saved successfully!');
      closeProductModal();
      await loadProducts();
      await loadStats();
    } else {
      showToast(data.message || 'Error saving product', true);
    }
  } catch (err) {
    showToast('Network error while saving product', true);
  }
}

async function deleteProduct(productId) {
  if (!confirm(`Are you sure you want to delete this product? (ID: ${productId})`)) return;

  try {
    const res = await fetch(`api.php?action=delete_product&id=${encodeURIComponent(productId)}`);
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted.');
      await loadProducts();
      await loadStats();
    } else {
      showToast(data.message || 'Failed to delete product', true);
    }
  } catch (err) {
    showToast('Error deleting product', true);
  }
}

// ================= BLOGS CRUD =================
async function loadBlogs() {
  try {
    const res = await fetch('api.php?action=get_blogs');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.blogs)) {
        allBlogs = data.blogs;
        renderBlogsTable();
        return;
      }
    }
  } catch (err) {
    // Try fallback
  }

  try {
    const fallbackRes = await fetch('../data/blog.json');
    if (fallbackRes.ok) {
      allBlogs = await fallbackRes.json();
      renderBlogsTable();
    }
  } catch (e) {
    console.error('Failed to load blogs from JSON:', e);
  }
}

function renderBlogsTable() {
  const tbody = document.getElementById('blogs-table-tbody');
  if (!tbody) return;

  if (!allBlogs.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">No blog articles found.</td></tr>`;
    return;
  }

  tbody.innerHTML = allBlogs.map(b => {
    const imgPath = b.image ? (b.image.startsWith('http') || b.image.startsWith('../') ? b.image : `../${b.image}`) : '../images/hero/hero-bg.webp';
    return `
      <tr>
        <td>
          <img src="${escapeHtml(imgPath)}" class="product-thumb" alt="Cover" onerror="this.src='../images/logo/bbc-logo.png'">
        </td>
        <td>
          <div style="font-weight:700;color:#fff;">${escapeHtml(b.title || 'Untitled Article')}</div>
          <div style="font-size:0.8rem;color:var(--admin-text-dim);">${escapeHtml(b.excerpt ? b.excerpt.slice(0, 80) + '...' : '')}</div>
        </td>
        <td><span class="badge-pill pill-gold">${escapeHtml(b.category || 'General')}</span></td>
        <td>${escapeHtml(b.author || 'BBC')}</td>
        <td>${escapeHtml(b.date || 'N/A')}</td>
        <td style="text-align:right;">
          <button class="btn-action-icon" title="Edit Article" onclick="openBlogModal('${b.id}')">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="btn-action-icon btn-delete" title="Delete Article" onclick="deleteBlog('${b.id}')" style="margin-left:6px;">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openBlogModal(blogId = null) {
  const modal = document.getElementById('blog-modal');
  const title = document.getElementById('blog-modal-title');
  const form = document.getElementById('blog-form');
  form.reset();

  if (blogId) {
    const b = allBlogs.find(item => String(item.id) === String(blogId));
    if (b) {
      title.textContent = `Edit Article: ${b.title}`;
      document.getElementById('blog-id').value = b.id;
      document.getElementById('blog-title').value = b.title || '';
      document.getElementById('blog-category').value = b.category || '';
      document.getElementById('blog-author').value = b.author || '';
      document.getElementById('blog-date').value = b.date || '';
      document.getElementById('blog-image-url').value = b.image || '';
      document.getElementById('blog-excerpt').value = b.excerpt || '';
      document.getElementById('blog-content').value = b.content || '';

      const preview = document.getElementById('blog-image-preview');
      const imgPath = b.image ? (b.image.startsWith('http') || b.image.startsWith('../') ? b.image : `../${b.image}`) : '../images/hero/hero-bg.webp';
      preview.src = imgPath;
    }
  } else {
    title.textContent = 'Add New Article';
    document.getElementById('blog-id').value = '';
    document.getElementById('blog-date').value = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('blog-image-preview').src = '../images/hero/hero-bg.webp';
  }

  modal.classList.add('open');
}

function closeBlogModal() {
  document.getElementById('blog-modal').classList.remove('open');
}

async function handleBlogImageUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    showToast('Uploading blog cover image...');
    const res = await fetch('api.php?action=upload_image', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success && data.path) {
      document.getElementById('blog-image-url').value = data.path;
      document.getElementById('blog-image-preview').src = `../${data.path}`;
      showToast('Cover image uploaded!');
    } else {
      showToast(data.message || 'Image upload failed', true);
    }
  } catch (err) {
    showToast('Error uploading image', true);
  }
}

async function handleSaveBlog(e) {
  e.preventDefault();
  const id = document.getElementById('blog-id').value;
  const blogData = {
    id: id || undefined,
    title: document.getElementById('blog-title').value.trim(),
    category: document.getElementById('blog-category').value.trim(),
    author: document.getElementById('blog-author').value.trim(),
    date: document.getElementById('blog-date').value.trim(),
    image: document.getElementById('blog-image-url').value.trim() || 'images/hero/hero-bg.webp',
    excerpt: document.getElementById('blog-excerpt').value.trim(),
    content: document.getElementById('blog-content').value.trim()
  };

  try {
    const btn = document.getElementById('btn-save-blog');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const res = await fetch('api.php?action=save_blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogData)
    });
    const data = await res.json();

    btn.disabled = false;
    btn.textContent = 'Save Article';

    if (data.success) {
      showToast('Article saved successfully!');
      closeBlogModal();
      await loadBlogs();
      await loadStats();
    } else {
      showToast(data.message || 'Error saving article', true);
    }
  } catch (err) {
    showToast('Network error while saving article', true);
  }
}

async function deleteBlog(blogId) {
  if (!confirm(`Are you sure you want to delete this article?`)) return;

  try {
    const res = await fetch(`api.php?action=delete_blog&id=${encodeURIComponent(blogId)}`);
    const data = await res.json();
    if (data.success) {
      showToast('Article deleted.');
      await loadBlogs();
      await loadStats();
    } else {
      showToast(data.message || 'Failed to delete article', true);
    }
  } catch (err) {
    showToast('Error deleting article', true);
  }
}

// ================= ORDERS MANAGEMENT =================
async function loadOrders() {
  try {
    const res = await fetch('api.php?action=get_orders');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        allOrders = data.orders;
        renderOrdersTable();
        renderOverviewSummaries();
        return;
      }
    }
  } catch (err) {
    // Try fallback
  }

  try {
    const fallbackRes = await fetch('../data/orders.json');
    if (fallbackRes.ok) {
      allOrders = await fallbackRes.json();
      if (Array.isArray(allOrders)) {
        renderOrdersTable();
        renderOverviewSummaries();
      }
    }
  } catch (e) {
    console.error('Failed to load orders from JSON:', e);
  }
}

function filterOrders(status) {
  if (!status) {
    renderOrdersTable(allOrders);
  } else {
    const filtered = allOrders.filter(o => o.status === status);
    renderOrdersTable(filtered);
  }
}

function renderOrdersTable(ordersToRender = allOrders) {
  const tbody = document.getElementById('orders-table-tbody');
  if (!tbody) return;

  if (!ordersToRender.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = ordersToRender.map(order => {
    const orderId = order.orderNumber || order.order_id || 'N/A';
    const dateStr = order.date || (order.created_at ? new Date(order.created_at).toLocaleString() : (order.timestamp || 'N/A'));
    const fName = order.billing?.firstName || order.billing?.first_name || '';
    const lName = order.billing?.lastName || order.billing?.last_name || '';
    const name = `${fName} ${lName}`.trim() || 'Guest Customer';
    const email = order.billing?.email || '';
    const phone = order.billing?.phone || '';
    const contact = `<div style="font-weight:600;color:#fff;">${escapeHtml(name)}</div><div style="font-size:0.8rem;color:var(--admin-text-dim);">${escapeHtml(email)} | ${escapeHtml(phone)}</div>`;
    const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
    const totalVal = order.total !== undefined ? order.total : (order.pricing?.total !== undefined ? order.pricing.total : 0);
    const total = `$${parseFloat(totalVal || 0).toFixed(2)}`;

    return `
      <tr>
        <td><strong style="color:var(--admin-gold);">${escapeHtml(orderId)}</strong></td>
        <td style="font-size:0.85rem;color:var(--admin-text-muted);">${dateStr}</td>
        <td>${contact}</td>
        <td>${itemsCount} item(s)</td>
        <td><strong style="font-size:1.05rem;">${total}</strong></td>
        <td>
          <select class="admin-select" style="padding:0.35rem 0.6rem;font-size:0.82rem;" onchange="updateOrderStatus('${orderId}', this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-secondary" style="font-size:0.82rem;padding:0.4rem 0.8rem;" onclick="viewOrderDetails('${orderId}')">
            View Details
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch('api.php?action=update_order_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, orderNumber: orderId, status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order ${orderId} marked as ${newStatus}`);
      await loadOrders();
    } else {
      showToast(data.message || 'Failed to update order status', true);
    }
  } catch (err) {
    showToast('Network error updating order status', true);
  }
}

function viewOrderDetails(orderId) {
  const order = allOrders.find(o => (o.orderNumber === orderId || o.order_id === orderId));
  if (!order) return;

  const modalBody = document.getElementById('order-modal-body');
  const b = order.billing || {};
  const fName = b.firstName || b.first_name || '';
  const lName = b.lastName || b.last_name || '';
  const customerName = `${fName} ${lName}`.trim() || 'Guest Customer';
  const address = b.address1 ? `${b.address1} ${b.address2 || ''}`.trim() : (b.address || '');
  const city = b.city || '';
  const state = b.state || b.province || 'ON';
  const postcode = b.postcode || '';

  const subtotal = order.subtotal !== undefined ? order.subtotal : (order.pricing?.subtotal || 0);
  const discount = order.discount !== undefined ? order.discount : (order.pricing?.discount || 0);
  const shipping = order.shippingFee !== undefined ? order.shippingFee : (order.pricing?.shipping || 0);
  const tax = order.tax !== undefined ? order.tax : (order.pricing?.tax || 0);
  const total = order.total !== undefined ? order.total : (order.pricing?.total || 0);

  let itemsHtml = (order.items || []).map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--admin-border);">
      <div>
        <div style="font-weight:700;color:#fff;">${escapeHtml(item.name || 'Product')} × ${item.quantity || 1}</div>
        <div style="font-size:0.8rem;color:var(--admin-text-dim);">Item ID: ${escapeHtml(item.id || '')}</div>
      </div>
      <div style="font-weight:700;color:var(--admin-gold);">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
    </div>
  `).join('');

  modalBody.innerHTML = `
    <div style="margin-bottom:1.5rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;background:rgba(255,255,255,0.03);padding:1.25rem;border-radius:8px;">
      <div>
        <div style="font-size:0.8rem;color:var(--admin-text-dim);text-transform:uppercase;">Order ID</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--admin-gold);">${escapeHtml(order.orderNumber || order.order_id || '')}</div>
        <div style="font-size:0.85rem;color:var(--admin-text-muted);">${order.date || order.created_at || order.timestamp || ''}</div>
      </div>
      <div>
        <div style="font-size:0.8rem;color:var(--admin-text-dim);text-transform:uppercase;">Current Status</div>
        <div>${getStatusBadge(order.status)}</div>
      </div>
    </div>

    <div class="admin-form-row" style="margin-bottom:1.5rem;">
      <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:8px;border:1px solid var(--admin-border);">
        <h4 style="margin:0 0 0.5rem 0;color:var(--admin-gold);font-size:0.95rem;">Customer Billing</h4>
        <div style="font-weight:700;color:#fff;">${escapeHtml(customerName)}</div>
        <div style="font-size:0.88rem;color:var(--admin-text-muted);margin-top:0.25rem;">
          Email: <a href="mailto:${escapeHtml(b.email || '')}" style="color:var(--admin-gold);">${escapeHtml(b.email || '')}</a><br>
          Phone: ${escapeHtml(b.phone || 'N/A')}<br>
          Address: ${escapeHtml(address)}, ${escapeHtml(city)}, ${escapeHtml(state)} ${escapeHtml(postcode)}
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:8px;border:1px solid var(--admin-border);">
        <h4 style="margin:0 0 0.5rem 0;color:var(--admin-gold);font-size:0.95rem;">Payment & Notes</h4>
        <div style="font-size:0.88rem;color:var(--admin-text-muted);">
          Method: <strong style="color:#fff;">${escapeHtml(order.paymentMethod || order.payment_method || 'Standard Checkout')}</strong><br>
          Customer Notes: <em>${escapeHtml(order.orderNotes || order.notes || 'None provided')}</em>
        </div>
      </div>
    </div>

    <h4 style="margin:0 0 0.75rem 0;color:#fff;font-size:1.1rem;">Purchased Items</h4>
    <div style="margin-bottom:1.5rem;">${itemsHtml}</div>

    <div style="background:rgba(201,161,61,0.08);padding:1rem 1.25rem;border-radius:8px;border:1px solid rgba(201,161,61,0.25);">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.9rem;color:var(--admin-text-muted);">
        <span>Subtotal:</span><span>$${parseFloat(subtotal).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.9rem;color:var(--admin-text-muted);">
        <span>Discount:</span><span>-$${parseFloat(discount).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.9rem;color:var(--admin-text-muted);">
        <span>Shipping:</span><span>$${parseFloat(shipping).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.9rem;color:var(--admin-text-muted);">
        <span>Tax (HST 13%):</span><span>$${parseFloat(tax).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1.25rem;font-weight:800;color:#fff;border-top:1px solid var(--admin-border);padding-top:0.6rem;margin-top:0.6rem;">
        <span>Total Paid / Due:</span><span style="color:var(--admin-gold);">$${parseFloat(total).toFixed(2)}</span>
      </div>
    </div>
  `;

  document.getElementById('order-modal').classList.add('open');
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('open');
}

function getStatusBadge(status) {
  switch (status) {
    case 'completed':
      return '<span class="badge-pill pill-success">Completed</span>';
    case 'processing':
      return '<span class="badge-pill pill-gold">Processing</span>';
    case 'cancelled':
      return '<span class="badge-pill pill-danger">Cancelled</span>';
    case 'pending':
    default:
      return '<span class="badge-pill pill-warning">Pending</span>';
  }
}

// ================= INQUIRIES MANAGEMENT =================
async function loadInquiries() {
  try {
    const res = await fetch('api.php?action=get_inquiries');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.inquiries)) {
        allInquiries = data.inquiries;
        renderInquiriesTable();
        renderOverviewSummaries();
        return;
      }
    }
  } catch (err) {
    // Try fallback
  }

  try {
    const fallbackRes = await fetch('../data/inquiries.json');
    if (fallbackRes.ok) {
      allInquiries = await fallbackRes.json();
      if (Array.isArray(allInquiries)) {
        renderInquiriesTable();
        renderOverviewSummaries();
      }
    }
  } catch (e) {
    console.error('Failed to load inquiries from JSON:', e);
  }
}

function renderInquiriesTable() {
  const tbody = document.getElementById('inquiries-table-tbody');
  if (!tbody) return;

  if (!allInquiries.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">No customer inquiries received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = allInquiries.map(inq => {
    const dateStr = inq.date ? new Date(inq.date).toLocaleString() : 'N/A';
    const preview = inq.message ? inq.message.slice(0, 90) + (inq.message.length > 90 ? '...' : '') : '';
    return `
      <tr>
        <td style="font-size:0.85rem;color:var(--admin-text-muted);">${dateStr}</td>
        <td><strong>${escapeHtml(inq.name || 'Anonymous')}</strong></td>
        <td><a href="mailto:${escapeHtml(inq.email || '')}" style="color:var(--admin-gold);">${escapeHtml(inq.email || '')}</a></td>
        <td>${escapeHtml(inq.subject || 'General Inquiry')}</td>
        <td style="font-size:0.85rem;color:var(--admin-text-dim);">${escapeHtml(preview)}</td>
        <td style="text-align:right;">
          <button class="btn-action-icon" title="View Full Message" onclick="viewInquiryDetails('${inq.id}')">
            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          </button>
          <button class="btn-action-icon btn-delete" title="Delete Inquiry" onclick="deleteInquiry('${inq.id}')" style="margin-left:6px;">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function viewInquiryDetails(inquiryId) {
  const inq = allInquiries.find(i => String(i.id) === String(inquiryId));
  if (!inq) return;

  const modalBody = document.getElementById('inquiry-modal-body');
  modalBody.innerHTML = `
    <div style="margin-bottom:1.25rem;">
      <div style="font-size:0.8rem;color:var(--admin-text-dim);text-transform:uppercase;">From</div>
      <div style="font-size:1.2rem;font-weight:700;color:#fff;">${escapeHtml(inq.name || 'Anonymous')}</div>
      <div style="font-size:0.9rem;color:var(--admin-gold);margin-top:2px;">
        <a href="mailto:${escapeHtml(inq.email || '')}" style="color:inherit;text-decoration:underline;">${escapeHtml(inq.email || '')}</a>
        ${inq.phone ? ` &bull; Tel: <a href="tel:${escapeHtml(inq.phone)}" style="color:inherit;">${escapeHtml(inq.phone)}</a>` : ''}
      </div>
      <div style="font-size:0.8rem;color:var(--admin-text-dim);margin-top:4px;">Date: ${inq.date || 'N/A'}</div>
    </div>

    <div style="margin-bottom:1rem;">
      <div style="font-size:0.8rem;color:var(--admin-text-dim);text-transform:uppercase;">Subject</div>
      <div style="font-weight:700;color:#fff;font-size:1.05rem;">${escapeHtml(inq.subject || 'General Message')}</div>
    </div>

    <div style="background:rgba(255,255,255,0.03);padding:1.25rem;border-radius:8px;border:1px solid var(--admin-border);white-space:pre-wrap;color:#e2e8f0;line-height:1.6;">
${escapeHtml(inq.message || 'No content')}
    </div>

    <div style="margin-top:1.5rem;">
      <a href="mailto:${escapeHtml(inq.email || '')}?subject=Re: ${encodeURIComponent(inq.subject || 'Brown Boys Customs Inquiry')}" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;">
        <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        Reply via Email
      </a>
    </div>
  `;

  document.getElementById('inquiry-modal').classList.add('open');
}

function closeInquiryModal() {
  document.getElementById('inquiry-modal').classList.remove('open');
}

async function deleteInquiry(inquiryId) {
  if (!confirm('Are you sure you want to delete this inquiry?')) return;

  try {
    const res = await fetch(`api.php?action=delete_inquiry&id=${encodeURIComponent(inquiryId)}`);
    const data = await res.json();
    if (data.success) {
      showToast('Inquiry removed.');
      await loadInquiries();
      await loadStats();
    } else {
      showToast(data.message || 'Failed to remove inquiry', true);
    }
  } catch (err) {
    showToast('Error removing inquiry', true);
  }
}

// ================= SETTINGS & EMAIL =================
async function loadSettings() {
  try {
    const res = await fetch('api.php?action=get_settings');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        currentSettings = data.settings;
        populateSettingsForm();
        const bannerEmail = document.getElementById('overview-notification-email');
        if (bannerEmail) {
          bannerEmail.textContent = currentSettings.notification_email || 'brownboyscustoms@gmail.com';
        }
        return;
      }
    }
  } catch (err) {
    // Try fallback
  }

  try {
    const fallbackRes = await fetch('../data/settings.json');
    if (fallbackRes.ok) {
      currentSettings = await fallbackRes.json();
      populateSettingsForm();
      const bannerEmail = document.getElementById('overview-notification-email');
      if (bannerEmail) {
        bannerEmail.textContent = currentSettings.notification_email || 'brownboyscustoms@gmail.com';
      }
    }
  } catch (e) {
    console.error('Failed to load settings from JSON:', e);
  }
}

function populateSettingsForm() {
  if (!currentSettings) return;
  const notifInput = document.getElementById('setting-notification-email');
  const prodInput = document.getElementById('setting-production-email');
  const currInput = document.getElementById('setting-currency');
  const phoneInput = document.getElementById('setting-store-phone');
  const addrInput = document.getElementById('setting-store-address');

  if (notifInput) notifInput.value = currentSettings.notification_email || 'brownboyscustoms@gmail.com';
  if (prodInput) prodInput.value = currentSettings.production_email || 'brownboyscustoms@gmail.com';
  if (currInput) currInput.value = currentSettings.currency || '$';
  if (phoneInput) phoneInput.value = currentSettings.store_phone || '289-367-5047';
  if (addrInput) addrInput.value = currentSettings.store_address || 'Unit 20, 180 Wilkinson Road, Brampton, ON L6T 4W8 & Unit 1C30, 7215 Goreway Dr, Mississauga, ON L4T 2T9';

  const smtpUserInput = document.getElementById('setting-smtp-user');
  const smtpPassInput = document.getElementById('setting-smtp-pass');
  if (smtpUserInput) smtpUserInput.value = currentSettings.smtp_user || currentSettings.notification_email || 'brownboyscustoms@gmail.com';
  if (smtpPassInput) smtpPassInput.value = currentSettings.smtp_pass || '';
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const settingsData = {
    notification_email: document.getElementById('setting-notification-email').value.trim(),
    production_email: document.getElementById('setting-production-email').value.trim(),
    currency: document.getElementById('setting-currency').value.trim(),
    store_phone: document.getElementById('setting-store-phone').value.trim(),
    store_address: document.getElementById('setting-store-address').value.trim(),
    smtp_user: (document.getElementById('setting-smtp-user') ? document.getElementById('setting-smtp-user').value.trim() : 'brownboyscustoms@gmail.com'),
    smtp_pass: (document.getElementById('setting-smtp-pass') ? document.getElementById('setting-smtp-pass').value.trim() : '')
  };

  try {
    const res = await fetch('api.php?action=save_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Settings saved successfully!');
      currentSettings = { ...currentSettings, ...settingsData };
      const bannerEmail = document.getElementById('overview-notification-email');
      if (bannerEmail) bannerEmail.textContent = settingsData.notification_email;
    } else {
      showToast(data.message || 'Error saving settings', true);
    }
  } catch (err) {
    showToast('Network error saving settings', true);
  }
}

async function handleTestSmtp() {
  const statusEl = document.getElementById('smtp-test-status');
  if (statusEl) {
    statusEl.innerHTML = '<span style="color:var(--admin-gold);">Connecting & sending test email...</span>';
  }

  try {
    const res = await fetch('api.php?action=test_smtp');
    const data = await res.json();
    if (data.success) {
      if (statusEl) statusEl.innerHTML = `<span style="color:#22c55e;">✓ ${escapeHtml(data.message)}</span>`;
      showToast(data.message);
    } else {
      if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444;">✗ ${escapeHtml(data.error || 'Test failed')}</span>`;
      showToast(data.error || 'Failed to send test email', true);
    }
  } catch (e) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444;">✗ Network error testing SMTP</span>';
    showToast('Network error testing SMTP', true);
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const curr = document.getElementById('pwd-current').value;
  const newPwd = document.getElementById('pwd-new').value;
  const confirmPwd = document.getElementById('pwd-confirm').value;

  if (newPwd !== confirmPwd) {
    showToast('New passwords do not match!', true);
    return;
  }

  try {
    const res = await fetch('api.php?action=change_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: curr,
        new_password: newPwd
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Password updated successfully!');
      document.getElementById('password-form').reset();
    } else {
      showToast(data.message || 'Error updating password', true);
    }
  } catch (err) {
    showToast('Network error updating password', true);
  }
}

// Utility HTML escape
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
