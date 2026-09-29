/**
 * BROWN BOYS CUSTOMS (BBC) — SINGLE BLOG POST CONTROLLER
 * Phase 8: Single Post Page & Prev/Next Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initSinglePostPage();
});

let allBlogPosts = [];
let currentPost = null;

async function initSinglePostPage() {
  try {
    const res = await fetch('data/blog.json');
    if (res.ok) {
      allBlogPosts = await res.json();
    }
  } catch (err) {
    console.warn('Could not load data/blog.json:', err);
  }

  // Parse ID from URL query param (?id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (postId && allBlogPosts.length) {
    currentPost = allBlogPosts.find(p => p.id === postId || p.id.toLowerCase() === postId.toLowerCase());
  }

  // Default to first post if not found
  if (!currentPost && allBlogPosts.length) {
    currentPost = allBlogPosts[0];
  }

  if (currentPost) {
    renderPost(currentPost);
    renderPrevNextNavigation(currentPost);
    renderSidebarRecentPosts();
  }

  initSidebarSearch();
}

/* ==========================================================================
   RENDER POST DETAILS
   ========================================================================== */
function renderPost(post) {
  // Page Title & Meta
  document.title = `${post.title} — Brown Boys Customs (BBC)`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', post.excerpt || `${post.title} - Custom automotive insights from Brown Boys Customs.`);
  }

  // Breadcrumb
  const breadcrumbCurrent = document.querySelector('#post-breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = post.title;
  }

  // Hero Banner Title
  const heroTitle = document.querySelector('#post-hero-title');
  if (heroTitle) {
    heroTitle.textContent = post.title;
  }

  // Article Title
  const articleTitle = document.querySelector('#post-article-title');
  if (articleTitle) {
    articleTitle.textContent = post.title;
  }

  // Meta Row (Author, Date, Category)
  const metaAuthor = document.querySelector('#post-meta-author');
  const metaDate = document.querySelector('#post-meta-date');
  const metaCat = document.querySelector('#post-meta-category');

  if (metaAuthor) metaAuthor.textContent = post.authorLabel || `By ${post.author || 'bbc'}`;
  if (metaDate) metaDate.textContent = post.date || 'July 25, 2023';
  if (metaCat) {
    metaCat.textContent = post.category || 'Uncategorized';
    metaCat.href = `blog.html?cat=${encodeURIComponent(post.category || 'Uncategorized')}`;
  }

  // Featured Image
  const featuredImg = document.querySelector('#post-featured-image');
  if (featuredImg) {
    featuredImg.src = post.image;
    featuredImg.alt = post.title;
  }

  // Full Editorial Content
  const contentContainer = document.querySelector('#post-editorial-content');
  if (contentContainer) {
    contentContainer.innerHTML = post.contentHtml || `
      <p class="lead" style="font-size: 1.15rem; line-height: 1.8; color: var(--text-white);">${post.excerpt}</p>
      <p>Visit Brown Boys Customs inside Westwood Mall, Unit 1C30, Mississauga for custom automotive styling, decals, and in-shop installations.</p>
    `;
  }
}

/* ==========================================================================
   PREVIOUS / NEXT POST NAVIGATION
   ========================================================================== */
function renderPrevNextNavigation(post) {
  const navContainer = document.querySelector('#post-navigation-bar');
  if (!navContainer || !allBlogPosts.length) return;

  const currentIndex = allBlogPosts.findIndex(p => p.id === post.id);
  const prevPost = currentIndex > 0 ? allBlogPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allBlogPosts.length - 1 ? allBlogPosts[currentIndex + 1] : null;

  let prevHtml = '';
  let nextHtml = '';

  if (prevPost) {
    prevHtml = `
      <a href="post.html?id=${prevPost.id}" class="post-nav-card prev-card">
        <span class="post-nav-label">
          <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Previous Article
        </span>
        <span class="post-nav-title">${prevPost.title}</span>
      </a>
    `;
  } else {
    prevHtml = `
      <div class="post-nav-card" style="opacity: 0.45; cursor: not-allowed;">
        <span class="post-nav-label">First Article</span>
        <span class="post-nav-title">No older posts</span>
      </div>
    `;
  }

  if (nextPost) {
    nextHtml = `
      <a href="post.html?id=${nextPost.id}" class="post-nav-card next-card">
        <span class="post-nav-label">
          Next Article
          <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </span>
        <span class="post-nav-title">${nextPost.title}</span>
      </a>
    `;
  } else {
    nextHtml = `
      <div class="post-nav-card next-card" style="opacity: 0.45; cursor: not-allowed;">
        <span class="post-nav-label">Latest Article</span>
        <span class="post-nav-title">No newer posts</span>
      </div>
    `;
  }

  navContainer.innerHTML = prevHtml + nextHtml;
}

/* ==========================================================================
   SIDEBAR RECENT POSTS (TITLE + LINK, NO DATES, THIN DIVIDER)
   ========================================================================== */
function renderSidebarRecentPosts() {
  const container = document.querySelector('#sidebar-recent-posts');
  if (!container || !allBlogPosts.length) return;

  container.innerHTML = allBlogPosts.map(p => `
    <div class="sidebar-recent-post-item">
      <a href="post.html?id=${p.id}" class="sidebar-recent-post-title">${p.title}</a>
    </div>
  `).join('');
}

/* ==========================================================================
   SIDEBAR SEARCH (REDIRECTS TO BLOG LISTING WITH QUERY)
   ========================================================================== */
function initSidebarSearch() {
  const searchForm = document.querySelector('#blog-search-form');
  const searchInput = document.querySelector('#blog-search-input');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `blog.html?s=${encodeURIComponent(q)}`;
      }
    });
  }
}
