/**
 * BROWN BOYS CUSTOMS (BBC) — BLOG LISTING CONTROLLER
 * Redesigned for Pixel-Perfect Reference UI
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#blog-stacked-container')) {
    initBlogPage();
  }
});

let allBlogPosts = [];
let filteredBlogPosts = [];
let blogCurrentPage = 1;
const blogPostsPerPage = 6;
let blogSearchQuery = '';
let blogCategoryFilter = '';

async function initBlogPage() {
  try {
    const res = await fetch('data/blog.json');
    if (res.ok) {
      allBlogPosts = await res.json();
    }
  } catch (err) {
    console.warn('Could not load data/blog.json (using existing static cards):', err);
  }

  // Handle URL query parameters (e.g. ?s=decal or ?cat=Car%20Accessories)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('s')) {
    blogSearchQuery = urlParams.get('s').trim();
    const searchInput = document.querySelector('#blog-search-input');
    if (searchInput) searchInput.value = blogSearchQuery;
  }
  if (urlParams.get('cat')) {
    blogCategoryFilter = urlParams.get('cat').trim();
  }
  if (urlParams.get('page')) {
    blogCurrentPage = parseInt(urlParams.get('page'), 10) || 1;
  }

  initBlogSearch();
  initSidebarRecentPosts();
  initCategoryFilters();
  filterAndRenderBlogPosts();
}

/* ==========================================================================
   BLOG SEARCH & FILTERING
   ========================================================================== */
function initBlogSearch() {
  const searchForm = document.querySelector('#blog-search-form');
  const searchInput = document.querySelector('#blog-search-input');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      blogSearchQuery = searchInput.value.trim().toLowerCase();
      blogCurrentPage = 1;
      updateBlogUrl();
      filterAndRenderBlogPosts();
    });

    // Real-time search as user types
    searchInput.addEventListener('input', () => {
      blogSearchQuery = searchInput.value.trim().toLowerCase();
      blogCurrentPage = 1;
      filterAndRenderBlogPosts();
    });
  }
}

function initCategoryFilters() {
  document.querySelectorAll('[data-blog-filter]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = item.getAttribute('data-blog-filter');
      blogCategoryFilter = (cat === 'all' || blogCategoryFilter === cat) ? '' : cat;
      blogCurrentPage = 1;
      updateBlogUrl();
      filterAndRenderBlogPosts();
    });
  });
}

function updateBlogUrl() {
  const params = new URLSearchParams();
  if (blogSearchQuery) params.set('s', blogSearchQuery);
  if (blogCategoryFilter) params.set('cat', blogCategoryFilter);
  if (blogCurrentPage > 1) params.set('page', blogCurrentPage);

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

function filterAndRenderBlogPosts() {
  if (!allBlogPosts || !allBlogPosts.length) return;

  filteredBlogPosts = allBlogPosts.filter(post => {
    let matchesSearch = true;
    if (blogSearchQuery) {
      const q = blogSearchQuery.toLowerCase();
      matchesSearch = (
        post.title.toLowerCase().includes(q) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(q)) ||
        (post.author && post.author.toLowerCase().includes(q)) ||
        (post.category && post.category.toLowerCase().includes(q))
      );
    }

    let matchesCategory = true;
    if (blogCategoryFilter) {
      matchesCategory = (post.category && post.category.toLowerCase().includes(blogCategoryFilter.toLowerCase()));
    }

    return matchesSearch && matchesCategory;
  });

  renderStackedCards();
  renderBlogPagination();
}

/* ==========================================================================
   RENDER MAIN COLUMN STACKED POST CARDS (Pixel-Perfect Reference Match)
   ========================================================================== */
function renderStackedCards() {
  const container = document.querySelector('#blog-stacked-container');
  if (!container) return;

  if (filteredBlogPosts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; background: #0c1222; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 12px;">
        <h3 style="font-family: var(--font-heading, 'Montserrat', sans-serif); font-size: 1.6rem; color: #d9a044; margin-bottom: 0.6rem;">No Articles Found</h3>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">We couldn't find any articles matching your search criteria.</p>
        <button class="blog-readmore-btn" onclick="clearBlogSearch()" style="border: none; cursor: pointer;">View All Articles</button>
      </div>
    `;
    return;
  }

  const startIndex = (blogCurrentPage - 1) * blogPostsPerPage;
  const pagePosts = filteredBlogPosts.slice(startIndex, startIndex + blogPostsPerPage);

  container.innerHTML = pagePosts.map(post => {
    const postSlug = post.slug || `post.html?id=${post.id}`;
    const authorDisplay = post.authorLabel || (post.author ? `By ${post.author}` : 'By Admin');
    const postDate = post.date || 'July 20, 2023';
    const postCategory = post.category || 'CAR CULTURE';
    const commentsCount = post.comments || '0 Comments';

    return `
      <article class="blog-post-card" data-post-id="${post.id}">
        <div class="blog-post-media">
          <a href="${postSlug}" aria-label="${post.title}">
            <img src="${post.image}" alt="${post.title}" loading="lazy">
          </a>
          <span class="blog-cat-badge">${postCategory}</span>
        </div>
        <div class="blog-post-body">
          <div class="blog-post-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" class="meta-icon"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
              <span>${postDate}</span>
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" class="meta-icon"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span>${authorDisplay}</span>
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" class="meta-icon"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
              <span>${commentsCount}</span>
            </span>
          </div>

          <h2 class="blog-post-title">
            <a href="${postSlug}">${post.title}</a>
          </h2>

          <p class="blog-post-excerpt">
            ${post.excerpt}
          </p>

          <div>
            <a href="${postSlug}" class="blog-readmore-btn">
              READ MORE ➔
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ==========================================================================
   RENDER PAGINATION AT BOTTOM
   ========================================================================== */
function renderBlogPagination() {
  const paginationContainer = document.querySelector('#blog-pagination');
  if (!paginationContainer) return;

  const totalPages = Math.ceil(filteredBlogPosts.length / blogPostsPerPage);

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    paginationContainer.style.display = 'none';
    return;
  }

  paginationContainer.style.display = 'flex';
  let html = '';

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button type="button" class="page-btn ${i === blogCurrentPage ? 'active' : ''}" onclick="goToBlogPage(${i})">
        ${i}
      </button>
    `;
  }

  if (blogCurrentPage < totalPages) {
    html += `
      <button type="button" class="page-btn" onclick="goToBlogPage(${blogCurrentPage + 1})" aria-label="Next Page">
        ➔
      </button>
    `;
  }

  paginationContainer.innerHTML = html;
}

window.goToBlogPage = function(page) {
  blogCurrentPage = page;
  updateBlogUrl();
  filterAndRenderBlogPosts();
  const main = document.querySelector('#blog-stacked-container');
  if (main) {
    main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.clearBlogSearch = function() {
  blogSearchQuery = '';
  blogCategoryFilter = '';
  const searchInput = document.querySelector('#blog-search-input');
  if (searchInput) searchInput.value = '';
  blogCurrentPage = 1;
  updateBlogUrl();
  filterAndRenderBlogPosts();
};

/* ==========================================================================
   RENDER SIDEBAR RECENT POSTS (Thumbnail + Title + Date)
   ========================================================================== */
function initSidebarRecentPosts() {
  const recentListContainer = document.querySelector('#sidebar-recent-posts');
  if (!recentListContainer || !allBlogPosts.length) return;

  recentListContainer.innerHTML = allBlogPosts.slice(0, 3).map(post => {
    const postSlug = post.slug || `post.html?id=${post.id}`;
    return `
      <div class="sidebar-recent-item">
        <a href="${postSlug}" class="sidebar-recent-thumb" aria-label="${post.title}">
          <img src="${post.image}" alt="${post.title}">
        </a>
        <div class="sidebar-recent-info">
          <a href="${postSlug}" class="sidebar-recent-title">${post.title}</a>
          <span class="sidebar-recent-date">${post.date || 'July 20, 2023'}</span>
        </div>
      </div>
    `;
  }).join('');
}
