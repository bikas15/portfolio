'use strict';

const root = document.documentElement;
let theme = 'dark';
try {
  theme = localStorage.getItem('bikas-projects-theme') || 'dark';
} catch {
  theme = 'dark';
}
root.dataset.theme = theme;

if (new URLSearchParams(location.search).has('desk')) {
  const backLink = document.querySelector('main a[href="../index.html"]');
  if (backLink) {
    backLink.href = '../desk.html';
    backLink.textContent = '← All apps';
  }
}

const themeButton = document.createElement('button');
themeButton.type = 'button';
themeButton.className = 'theme-toggle';
themeButton.setAttribute('aria-label', 'Switch color theme');
function drawThemeButton() {
  themeButton.textContent = root.dataset.theme === 'dark' ? 'Light theme' : 'Dark theme';
}
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('bikas-projects-theme', root.dataset.theme);
  } catch {
    // Theme changes still apply for the current page when storage is unavailable.
  }
  drawThemeButton();
});
drawThemeButton();
(document.getElementById('theme-control') || document.body).append(themeButton);

const search = document.getElementById('project-search');
const category = document.getElementById('category-filter');
if (search && category) {
  const cards = [...document.querySelectorAll('.project-card')];
  const favoritesFilter = document.getElementById('favorites-filter');
  const favorites = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem('bikas-toolkit-favorites'));
    if (Array.isArray(saved)) saved.forEach(id => favorites.add(id));
  } catch {
    // Favorites remain available for this visit when storage is unavailable.
  }
  favoritesFilter.hidden = false;
  favoritesFilter.addEventListener('click', () => {
    const active = favoritesFilter.getAttribute('aria-pressed') === 'true';
    favoritesFilter.setAttribute('aria-pressed', String(!active));
    filterProjects();
  });
  for (const card of cards) {
    const link = card.querySelector('h2 a');
    const id = link.getAttribute('href');
    card.dataset.toolId = id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'favorite-tool';
    button.setAttribute('aria-label', `Favorite ${link.textContent}`);
    function renderFavorite() {
      const saved = favorites.has(id);
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? '★' : '☆';
    }
    button.addEventListener('click', () => {
      if (!favorites.delete(id)) favorites.add(id);
      try {
        localStorage.setItem('bikas-toolkit-favorites', JSON.stringify([...favorites]));
      } catch {
        // The change still applies for this visit.
      }
      renderFavorite();
      const willHide = !favorites.has(id) && favoritesFilter.getAttribute('aria-pressed') === 'true';
      filterProjects();
      if (willHide) favoritesFilter.focus();
    });
    renderFavorite();
    card.append(button);
  }
  const categories = [...new Set(cards.map(card => card.dataset.category))].sort();
  for (const name of categories) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    category.append(option);
  }
  function filterProjects() {
    const terms = search.value.trim().toLowerCase().split(/\s+/);
    const favoritesOnly = favoritesFilter.getAttribute('aria-pressed') === 'true';
    let visible = 0;
    for (const card of cards) {
      const searchable = card.querySelector('.project-card-content').textContent;
      const matches = terms.every(term => searchable.toLowerCase().includes(term))
        && (!favoritesOnly || favorites.has(card.dataset.toolId))
        && (!category.value || card.dataset.category === category.value);
      card.hidden = !matches;
      if (matches) visible++;
    }
    document.getElementById('project-count').textContent = `${visible} of ${cards.length} tools`;
    document.getElementById('no-results').hidden = visible !== 0;
    document.getElementById('empty-message').textContent = favoritesOnly && !favorites.size
      ? 'Select the star on any tool to save it here.'
      : 'No tools match your filters.';
  }
  search.addEventListener('input', filterProjects);
  category.addEventListener('change', filterProjects);
  document.getElementById('reset-filters').addEventListener('click', () => {
    search.value = '';
    category.value = '';
    favoritesFilter.setAttribute('aria-pressed', 'false');
    filterProjects();
    search.focus();
  });
  filterProjects();
}
