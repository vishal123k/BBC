<?php
require_once __DIR__ . '/auth.php';
require_admin_login();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — Brown Boys Customs</title>
  <link rel="icon" type="image/png" href="../images/logo/bbc-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/admin.css">
</head>
<body class="admin-body">

  <!-- Admin Navbar -->
  <header class="admin-navbar">
    <div class="admin-nav-brand">
      <a href="index.php" class="admin-brand-logo">
        <img src="../images/logo.png" alt="BBC Admin Logo" style="height: 42px; width: auto; object-fit: contain; display: block;">
      </a>
      <span class="admin-nav-badge">Admin Panel</span>
    </div>
    <div class="admin-nav-actions">
      <a href="../index.html" target="_blank" class="btn btn-secondary">
        <svg style="width:14px;height:14px;fill:currentColor;vertical-align:-2px;margin-right:4px;" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
        View Live Website
      </a>
      <div class="admin-user-pill">
        <span>Logged in as</span> <strong><?php echo htmlspecialchars($_SESSION['bbc_admin_user'] ?? 'Admin'); ?></strong>
      </div>
      <a href="logout.php" class="btn btn-logout">
        Logout
      </a>
    </div>
  </header>

  <!-- Admin Layout -->
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="admin-nav-item active" data-tab="tab-overview">
        <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        <span>Overview</span>
      </div>
      <div class="admin-nav-item" data-tab="tab-products">
        <svg viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/></svg>
        <span>Products Catalog</span>
      </div>
      <div class="admin-nav-item" data-tab="tab-blogs">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        <span>Blog Articles</span>
      </div>
      <div class="admin-nav-item" data-tab="tab-orders">
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <span>Orders</span>
      </div>
      <div class="admin-nav-item" data-tab="tab-inquiries">
        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <span>Contact Inquiries</span>
      </div>
      <div class="admin-nav-item" data-tab="tab-settings">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        <span>Settings & Email</span>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="admin-main">

      <!-- ================= TAB: OVERVIEW ================= -->
      <section id="tab-overview" class="tab-pane active">
        <!-- Stats Row -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrap">
              <svg viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Active Products</span>
              <span class="stat-val" id="stat-products">0</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap" style="color:#60a5fa;background:rgba(96,165,250,0.12);">
              <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Orders</span>
              <span class="stat-val" id="stat-orders">0</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap" style="color:#34d399;background:rgba(52,211,153,0.12);">
              <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Inquiries Received</span>
              <span class="stat-val" id="stat-inquiries">0</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap" style="color:#f472b6;background:rgba(244,114,182,0.12);">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Published Articles</span>
              <span class="stat-val" id="stat-blogs">0</span>
            </div>
          </div>
        </div>

        <!-- Testing Email Notice Banner -->
        <div style="background:rgba(201,161,61,0.08);border:1px solid rgba(201,161,61,0.3);border-radius:10px;padding:1.25rem 1.5rem;margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="font-weight:700;color:var(--admin-gold);font-size:0.95rem;margin-bottom:0.25rem;">
              <svg style="width:16px;height:16px;fill:currentColor;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              Testing Mode Active
            </div>
            <div style="color:var(--admin-text-muted);font-size:0.88rem;">
              Customer inquiries and orders are routed to: <strong style="color:#fff;" id="overview-notification-email">info@brownboyscustoms.ca</strong>.
            </div>
          </div>
          <button class="btn btn-primary" onclick="switchTab('tab-settings')" style="font-size:0.85rem;padding:0.5rem 1rem;">
            Configure Email Settings
          </button>
        </div>

        <!-- Quick Summary Grids -->
        <div class="admin-card-container">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Recent Orders</h2>
            <button class="btn btn-secondary" onclick="switchTab('tab-orders')" style="font-size:0.82rem;padding:0.4rem 0.8rem;">View All Orders →</button>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="overview-orders-tbody">
                <tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Loading recent orders...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="admin-card-container">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Recent Contact Inquiries</h2>
            <button class="btn btn-secondary" onclick="switchTab('tab-inquiries')" style="font-size:0.82rem;padding:0.4rem 0.8rem;">View All Inquiries →</button>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="overview-inquiries-tbody">
                <tr><td colspan="5" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Loading recent inquiries...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB: PRODUCTS ================= -->
      <section id="tab-products" class="tab-pane" style="display:none;">
        <div class="admin-card-container">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Products Catalog</h2>
            <div class="admin-toolbar">
              <input type="text" id="product-search-input" class="admin-search-input" placeholder="Search by name or SKU...">
              <select id="product-category-filter" class="admin-select">
                <option value="">All Categories</option>
              </select>
              <button class="btn btn-primary" onclick="openProductModal()">
                <svg style="width:16px;height:16px;fill:currentColor;vertical-align:-2px;margin-right:4px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add Product
              </button>
            </div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Product Name / SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="products-table-tbody">
                <tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Loading catalog...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB: BLOGS ================= -->
      <section id="tab-blogs" class="tab-pane" style="display:none;">
        <div class="admin-card-container">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Blog Articles</h2>
            <div class="admin-toolbar">
              <button class="btn btn-primary" onclick="openBlogModal()">
                <svg style="width:16px;height:16px;fill:currentColor;vertical-align:-2px;margin-right:4px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add New Article
              </button>
            </div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Publish Date</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="blogs-table-tbody">
                <tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Loading articles...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB: ORDERS ================= -->
      <section id="tab-orders" class="tab-pane" style="display:none;">
        <div class="admin-card-container">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Customer Orders</h2>
            <div class="admin-toolbar">
              <select id="order-status-filter" class="admin-select" onchange="filterOrders(this.value)">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer Info</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="orders-table-tbody">
                <tr><td colspan="7" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Loading orders...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB: INQUIRIES ================= -->
      <section id="tab-inquiries" class="tab-pane" style="display:none;">
        <div class="admin-card-container">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Contact Inquiries</h2>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="inquiries-table-tbody">
                <tr><td colspan="6" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Loading inquiries...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB: SETTINGS & EMAIL ================= -->
      <section id="tab-settings" class="tab-pane" style="display:none;">
        <div class="admin-card-container" style="max-width:800px;">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Notification & Store Settings</h2>
          </div>
          <form id="settings-form" onsubmit="handleSaveSettings(event)">
            <div class="admin-form-group">
              <label class="admin-form-label">Active Notification Email (Receives Orders & Inquiries)</label>
              <input type="email" id="setting-notification-email" class="admin-form-control" required>
              <div style="font-size:0.8rem;color:var(--admin-gold);margin-top:0.35rem;">
                The notification email receives all new orders and inquiries. Currently set to <code>info@brownboyscustoms.ca</code>.
              </div>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Production Email (Brand)</label>
                <input type="email" id="setting-production-email" class="admin-form-control" value="info@brownboyscustoms.ca">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Currency Symbol</label>
                <input type="text" id="setting-currency" class="admin-form-control" value="$">
              </div>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Store Phone Number</label>
                <input type="text" id="setting-store-phone" class="admin-form-control" value="+1 (416) 825-9000">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Store Address</label>
                <input type="text" id="setting-store-address" class="admin-form-control" value="7215 Goreway Dr, Unit 1C30, Mississauga, ON L4T 2T9">
              </div>
            </div>

            <div style="margin-top:1.5rem;">
              <button type="submit" class="btn btn-primary">Save Settings</button>
            </div>
          </form>
        </div>

        <!-- Security / Password Card -->
        <div class="admin-card-container" style="max-width:800px;">
          <div class="admin-card-header">
            <h2 class="admin-card-title">Change Admin Password</h2>
          </div>
          <form id="password-form" onsubmit="handleChangePassword(event)">
            <div class="admin-form-group">
              <label class="admin-form-label">Current Password</label>
              <input type="password" id="pwd-current" class="admin-form-control" required placeholder="Enter current password (default: bbcadmin2026)">
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">New Password</label>
                <input type="password" id="pwd-new" class="admin-form-control" required minlength="6" placeholder="At least 6 characters">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Confirm New Password</label>
                <input type="password" id="pwd-confirm" class="admin-form-control" required minlength="6" placeholder="Repeat new password">
              </div>
            </div>
            <div style="margin-top:1.5rem;">
              <button type="submit" class="btn btn-primary">Update Password</button>
            </div>
          </form>
        </div>
      </section>

    </main>
  </div>

  <!-- ================= MODAL: ADD / EDIT PRODUCT ================= -->
  <div id="product-modal" class="admin-modal-backdrop">
    <div class="admin-modal-card">
      <div class="admin-modal-header">
        <h3 id="product-modal-title">Add / Edit Product</h3>
        <button type="button" class="admin-modal-close" onclick="closeProductModal()">&times;</button>
      </div>
      <form id="product-form" onsubmit="handleSaveProduct(event)">
        <div class="admin-modal-body">
          <input type="hidden" id="prod-id">

          <div class="admin-form-group">
            <label class="admin-form-label">Product Name *</label>
            <input type="text" id="prod-name" class="admin-form-control" required placeholder="e.g. Punjabi Car Hanging Parandi">
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Category *</label>
              <input type="text" id="prod-category" class="admin-form-control" required placeholder="e.g. Car Accessories, Decals">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Subcategory / Tag</label>
              <input type="text" id="prod-subcategory" class="admin-form-control" placeholder="e.g. Punjabi & Truck Accessories">
            </div>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Regular Price ($) *</label>
              <input type="number" step="0.01" id="prod-price" class="admin-form-control" required placeholder="25.00">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Sale Price ($) (Optional)</label>
              <input type="number" step="0.01" id="prod-sale-price" class="admin-form-control" placeholder="15.00">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">SKU</label>
              <input type="text" id="prod-sku" class="admin-form-control" placeholder="BBC-091">
            </div>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Stock Status</label>
              <select id="prod-stock" class="admin-form-control">
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
            <div class="admin-form-group" style="display:flex;align-items:center;padding-top:1.6rem;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:#fff;">
                <input type="checkbox" id="prod-featured" style="width:18px;height:18px;accent-color:var(--admin-gold);">
                Featured Product (Show on Homepage)
              </label>
            </div>
          </div>

          <!-- Image Upload / Preview Box -->
          <div class="admin-form-group">
            <label class="admin-form-label">Product Image</label>
            <div class="image-upload-box" onclick="document.getElementById('prod-image-file').click()">
              <img id="prod-image-preview" src="../images/logo/bbc-logo.png" class="image-preview-img" alt="Preview">
              <div style="font-size:0.85rem;color:var(--admin-text-muted);">
                Click to browse or upload a new image (.jpg, .png, .webp)
              </div>
              <input type="file" id="prod-image-file" accept="image/*" style="display:none;" onchange="handleProductImageUpload(this)">
            </div>
            <div style="margin-top:0.5rem;">
              <input type="text" id="prod-image-url" class="admin-form-control" placeholder="Or enter relative image path (e.g. images/products/item.webp)">
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Description</label>
            <textarea id="prod-description" class="admin-form-control" rows="4" placeholder="Detailed product specifications, features, materials..."></textarea>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeProductModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-product">Save Product</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ================= MODAL: ADD / EDIT BLOG ================= -->
  <div id="blog-modal" class="admin-modal-backdrop">
    <div class="admin-modal-card">
      <div class="admin-modal-header">
        <h3 id="blog-modal-title">Add / Edit Blog Article</h3>
        <button type="button" class="admin-modal-close" onclick="closeBlogModal()">&times;</button>
      </div>
      <form id="blog-form" onsubmit="handleSaveBlog(event)">
        <div class="admin-modal-body">
          <input type="hidden" id="blog-id">

          <div class="admin-form-group">
            <label class="admin-form-label">Article Title *</label>
            <input type="text" id="blog-title" class="admin-form-control" required placeholder="e.g. Unique Ways to Use Car Decals">
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Category</label>
              <input type="text" id="blog-category" class="admin-form-control" value="Car Decals">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Author</label>
              <input type="text" id="blog-author" class="admin-form-control" value="Brown Boys Customs">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Date</label>
              <input type="text" id="blog-date" class="admin-form-control" placeholder="July 25, 2023">
            </div>
          </div>

          <!-- Image Upload / Preview Box -->
          <div class="admin-form-group">
            <label class="admin-form-label">Featured Image</label>
            <div class="image-upload-box" onclick="document.getElementById('blog-image-file').click()">
              <img id="blog-image-preview" src="../images/hero/hero-bg.webp" class="image-preview-img" alt="Preview">
              <div style="font-size:0.85rem;color:var(--admin-text-muted);">
                Click to browse or upload blog cover (.jpg, .png, .webp)
              </div>
              <input type="file" id="blog-image-file" accept="image/*" style="display:none;" onchange="handleBlogImageUpload(this)">
            </div>
            <div style="margin-top:0.5rem;">
              <input type="text" id="blog-image-url" class="admin-form-control" placeholder="Or enter image path (e.g. images/blog/post1.webp)">
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Short Excerpt *</label>
            <textarea id="blog-excerpt" class="admin-form-control" rows="2" required placeholder="Brief introductory summary for listing cards..."></textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Full Article Body</label>
            <textarea id="blog-content" class="admin-form-control" rows="8" placeholder="Complete article content (paragraphs, headings)..."></textarea>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeBlogModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-blog">Save Article</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ================= MODAL: ORDER DETAILS ================= -->
  <div id="order-modal" class="admin-modal-backdrop">
    <div class="admin-modal-card">
      <div class="admin-modal-header">
        <h3 id="order-modal-title">Order Details</h3>
        <button type="button" class="admin-modal-close" onclick="closeOrderModal()">&times;</button>
      </div>
      <div class="admin-modal-body" id="order-modal-body">
        <!-- Rendered via JS -->
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">Close</button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL: INQUIRY DETAILS ================= -->
  <div id="inquiry-modal" class="admin-modal-backdrop">
    <div class="admin-modal-card">
      <div class="admin-modal-header">
        <h3 id="inquiry-modal-title">Inquiry Details</h3>
        <button type="button" class="admin-modal-close" onclick="closeInquiryModal()">&times;</button>
      </div>
      <div class="admin-modal-body" id="inquiry-modal-body">
        <!-- Rendered via JS -->
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeInquiryModal()">Close</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="admin-toast" class="admin-toast">
    <span id="toast-message">Notification message</span>
  </div>

  <script src="js/admin.js"></script>
</body>
</html>
