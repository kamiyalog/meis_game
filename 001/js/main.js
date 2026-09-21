(function () {
  'use strict';

  const core = window.EternalARG;
  if (!core) return;
  if (core.resetIfRequested()) return;
  if (core.shouldRedirectToEnding('01')) {
    location.replace(core.urlFor('24'));
    return;
  }
  core.visit('01');

  const searchInput = document.querySelector('#searchInput');
  const searchForm = document.querySelector('#searchForm');
  const searchResults = document.querySelector('#searchResults');
  const searchHint = document.querySelector('#searchHint');
  const menuToggle = document.querySelector('#menuToggle');
  const mobileNav = document.querySelector('#mobileNav');
  const historyDialog = document.querySelector('#historyDialog');
  const historyList = document.querySelector('#historyList');
  const historyOpen = document.querySelector('#historyOpen');
  const historyFooterOpen = document.querySelector('#historyFooterOpen');
  const historyClose = document.querySelector('#historyClose');
  const historyAccept = document.querySelector('#historyAccept');

  function renderResults(query) {
    const matches = core.search(query);
    searchResults.replaceChildren();
    if (!query.trim()) {
      searchHint.textContent = '識別コードを知っていれば、未閲覧の記録も検索できます。';
      return;
    }

    searchHint.textContent = matches.length ? `${matches.length}件見つかりました。` : '一致するページはありません。';
    matches.forEach(({ id, page }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const label = document.createElement('strong');
      const description = document.createElement('span');
      label.textContent = `${id}｜${page.title}`;
      description.textContent = page.short;
      link.href = core.urlFor(id);
      link.append(label, description);
      link.addEventListener('click', () => core.unlock(id));
      item.append(link);
      searchResults.append(item);
    });
  }

  searchInput.addEventListener('input', (event) => renderResults(event.currentTarget.value));
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    renderResults(searchInput.value);
  });
  menuToggle.addEventListener('click', () => {
    const shouldOpen = mobileNav.hidden;
    mobileNav.hidden = !shouldOpen;
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
  });
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  function renderHistory() {
    historyList.replaceChildren();
    core.visitedPages().forEach((page) => {
      const link = document.createElement('a');
      const number = document.createElement('span');
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      const short = document.createElement('small');
      const status = document.createElement('b');
      link.className = 'history-entry';
      link.href = core.urlFor(page.id);
      number.textContent = page.id;
      title.textContent = page.title;
      short.textContent = page.short;
      status.textContent = '閲覧済み';
      copy.append(title, short);
      link.append(number, copy, status);
      link.addEventListener('click', () => core.unlock(page.id));
      historyList.append(link);
    });
  }

  function openHistory() {
    renderHistory();
    if (typeof historyDialog.showModal === 'function') historyDialog.showModal();
    else historyDialog.setAttribute('open', '');
  }

  function closeHistory() {
    core.acknowledgeHistory();
    if (typeof historyDialog.close === 'function') historyDialog.close();
    else historyDialog.removeAttribute('open');
  }

  [historyOpen, historyFooterOpen].forEach((button) => button.addEventListener('click', openHistory));
  [historyClose, historyAccept].forEach((button) => button.addEventListener('click', closeHistory));
  historyDialog.addEventListener('click', (event) => {
    if (event.target === historyDialog) closeHistory();
  });

})();
