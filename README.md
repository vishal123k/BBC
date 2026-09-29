# Brown Boys Customs (BBC) — Website

> Custom Car Accessories & Modifications  
> 7215 Goreway Dr, Unit 1C30, Westwood Mall, Mississauga, ON  
> 🌐 [brownboyscustoms.ca](https://brownboyscustoms.ca) | 📧 info@brownboyscustoms.ca | 📞 +1 647 966 0047

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | PHP 8.x |
| Database | JSON flat-file (`data/*.json`) |
| Hosting | Apache server (Hostinger / InfinityFree) |
| Auth | PHP Sessions + bcrypt password hashing |

---

## 📁 Project Structure

```
BBC/
├── index.html              ← Homepage
├── shop.html               ← All Products
├── product.html            ← Single Product
├── cart.html               ← Shopping Cart
├── checkout.html           ← Checkout Form
├── checkout.php            ← Order Processing + Email
├── order-received.html     ← Order Confirmation
├── contact.html            ← Contact / Get a Quote
├── contact.php             ← Quote Form Handler + Email
├── about.html              ← About Page
├── blog.html               ← Blog Listing
├── post.html               ← Single Blog Post
├── privacy.html            ← Privacy Policy
├── terms.html              ← Terms & Conditions
├── shipping.html           ← Shipping Policy
├── returns.html            ← Returns Policy
├── mobile-watch-accessories.html
│
├── admin/                  ← Admin Dashboard (PHP protected)
│   ├── login.php           ← Admin Login (brute-force protected)
│   ├── logout.php
│   ├── index.php           ← Dashboard (requires auth)
│   ├── api.php             ← REST API (products, orders, blogs)
│   ├── auth.php            ← Authentication + Security
│   ├── .htaccess           ← Admin directory protection
│   ├── css/admin.css
│   └── js/admin.js
│
├── css/style.css           ← Main stylesheet
│
├── js/
│   ├── cart-core.js        ← Cart engine (localStorage)
│   ├── cart.js             ← Cart page logic
│   ├── checkout.js         ← Checkout form + order submission
│   ├── contact.js          ← Quote form logic
│   ├── product.js          ← Product page logic
│   ├── shop.js             ← Shop filtering + sorting
│   ├── main.js             ← Global scripts
│   ├── blog.js             ← Blog listing
│   └── post.js             ← Blog post
│
├── data/                   ← JSON Database
│   ├── products.json       ← Product catalogue
│   ├── blog.json           ← Blog posts
│   ├── settings.json       ← Store configuration
│   ├── orders.json         ← Customer orders [gitignored]
│   ├── inquiries.json      ← Contact inquiries [gitignored]
│   └── admin_credentials.json ← Admin login [gitignored]
│
├── images/                 ← All media assets
│   ├── products/
│   ├── blog/
│   ├── categories/
│   └── gallery/
│
└── .htaccess               ← Apache config (HTTPS, security)
```

---

## ⚙️ Features

- 🛒 **Cart** — localStorage-based, cross-tab sync, toast notifications
- 💳 **Checkout** — Province-aware taxes, 4 payment methods, coupon codes
- 📧 **Emails** — HTML order confirmations + admin alerts via PHP mail()
- 📝 **Get a Quote** — Contact form with anti-spam honeypot
- 🔒 **Admin Dashboard** — Product/Order/Blog/Inquiry management
- 🛡️ **Security** — Brute-force lockout, session fixation prevention, bcrypt passwords

---

## 🔐 Admin Access

```
URL      : https://brownboyscustoms.ca/admin/login.php
Username : admin
Password : (set by developer — change on first login)
```

---

## 🚀 Deployment

1. Upload all files to `public_html/` on your PHP host (Hostinger / InfinityFree)
2. Ensure `data/` folder has write permissions (`chmod 755`)
3. Enable free SSL from hosting panel
4. Point `brownboyscustoms.ca` A Record → your host's IP
5. Do NOT change MX records (email will break)

---

## 💳 Payment Methods

| Method | Works Now |
|--------|----------|
| Interac e-Transfer | ✅ |
| Pay In-Store | ✅ |
| Cash on Pickup | ✅ |
| Credit/Debit Card | ⚠️ UI only (needs Stripe) |

---

## 📞 Store Info

- **Location:** Westwood Mall / Westwood Square, Mississauga ON
- **Hours:** Mon–Fri 10AM–9PM · Sat 10AM–6PM · Sun 12PM–5PM
