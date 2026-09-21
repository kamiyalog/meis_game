(function () {
  'use strict';

  const core = window.EternalARG;
  const bodies = window.EternalPageBodies || {};
  if (!core) return;
  if (core.resetIfRequested()) return;

  const pageId = core.pageIdFromLocation();
  if (!pageId) {
    renderMissing();
    return;
  }
  if (core.shouldRedirectToEnding(pageId)) {
    location.replace(core.urlFor('24'));
    return;
  }
  if (pageId === '24') {
    if (!core.canAccess('24')) renderMissing();
    else renderEnding();
    return;
  }
  if (!core.canAccess(pageId)) {
    renderMissing();
    return;
  }

  core.visit(pageId);
  renderPage();

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function navItems(theme) {
    const map = {
      product: [['01', 'ホーム'], ['02', '商品について'], ['03', '皆様の声'], ['04', 'モニター'], ['05', 'FAQ'], ['06', 'お知らせ']],
      company: [['07', '会社概要'], ['10', '関連企業']],
      kuon: [['11', '企業情報'], ['12', 'グループ企業']],
      lab: [['13', 'トップ'], ['14', '技術概要'], ['15', '調達方針'], ['16', '研究開発史']],
      blog: [['17', '記事一覧']],
      museum: [['21', '収蔵記録']],
      archive: [['22', '公文書記録']],
      internal: [['23', '受入記録']],
    };
    return map[theme] || [];
  }

  function renderPage() {
    const meta = core.pages[pageId];
    const data = bodies[pageId];
    if (!meta || !data) {
      renderMissing();
      return;
    }

    document.title = `${meta.title}｜${data.site}`;
    document.body.className = `arg-page-body theme-${meta.theme}`;
    document.body.dataset.pageId = pageId;

    const nav = navItems(meta.theme).map(([id, label]) => {
      const current = id === pageId ? ' aria-current="page"' : '';
      return `<a href="${core.urlFor(id)}" data-page-link="${id}"${current}>${escapeHtml(label)}</a>`;
    }).join('');

    const app = document.querySelector('#app');
    app.innerHTML = `
      <a class="arg-skip" href="#arg-main">本文へ移動</a>
      <header class="arg-header">
        <a class="arg-brand" href="${core.urlFor(pageId === '01' ? '01' : navItems(meta.theme)[0]?.[0] || '01')}" data-page-link="${navItems(meta.theme)[0]?.[0] || '01'}">
          <span class="arg-brand-mark" aria-hidden="true"></span>
          <span><strong>${escapeHtml(data.site)}</strong><small>${escapeHtml(data.siteSub)}</small></span>
        </a>
        <nav class="arg-nav" aria-label="サイト内メニュー">${nav}</nav>
        <div class="arg-tools">
          <button class="arg-tool" id="argHistoryOpen" type="button">閲覧履歴</button>
          <button class="arg-menu" id="argMenu" type="button" aria-expanded="false" aria-label="メニューを開く"><i></i><i></i></button>
        </div>
      </header>
      <section class="arg-search" id="argSearch" aria-label="サイト内検索">
        <form id="argSearchForm" role="search">
          <label for="argSearchInput">サイト内検索</label>
          <div><input id="argSearchInput" type="search" autocomplete="off" placeholder="識別コード・キーワードを入力"><button type="submit">検索</button></div>
          <p id="argSearchMessage">識別コードを知っていれば、未閲覧の記録も検索できます。</p>
          <ol id="argSearchResults" aria-live="polite"></ol>
        </form>
      </section>
      <main id="arg-main">
        <header class="arg-page-title">
          <div class="arg-title-inner">
            <p>${escapeHtml(data.kicker)}</p>
            <h1>${escapeHtml(meta.title)}</h1>
            <div class="arg-lead">${escapeHtml(data.lead)}</div>
          </div>
        </header>
        <div class="arg-content">${data.body}</div>
      </main>
      <footer class="arg-footer">
        <div class="arg-footer-brand"><strong>${escapeHtml(data.site)}</strong><span>${escapeHtml(data.siteSub)}</span></div>
        <nav><a href="${core.urlFor('01')}" data-page-link="01">ETERNAL SLEEP</a><button id="argHistoryFooter" type="button">閲覧済みページ</button></nav>
        <div class="arg-page-count" aria-label="全24ページ中${Number(pageId)}ページ目"><span>PAGE</span><strong>${pageId}</strong><i></i><small>24</small></div>
        <p>このWebサイトの内容はフィクションであり、実在の人物・団体とは一切関係がありません。</p>
      </footer>
      <dialog class="arg-dialog" id="argHistory" aria-labelledby="argHistoryTitle">
        <button class="arg-dialog-close" id="argHistoryClose" type="button" aria-label="閉じる">×</button>
        <p class="arg-dialog-kicker">BROWSING RECORD</p>
        <h2 id="argHistoryTitle">閲覧済みページ</h2>
        <p>この端末で確認したページが記録されています。</p>
        <div class="arg-history-list" id="argHistoryList"></div>
        <button class="arg-dialog-accept" id="argHistoryAccept" type="button">確認しました</button>
      </dialog>`;

    bindLinks();
    bindSearch();
    bindHistory();
    bindMenu();
    applyAssets();
    bindCloseRecord();
  }

  function bindLinks() {
    document.querySelectorAll('[data-page-link]').forEach((link) => {
      const target = link.dataset.pageLink;
      link.href = core.urlFor(target);
      link.addEventListener('click', (event) => {
        if (!core.canAccess(target)) {
          event.preventDefault();
          return;
        }
        core.unlock(target);
      });
    });
  }

  function bindSearch() {
    const form = document.querySelector('#argSearchForm');
    const input = document.querySelector('#argSearchInput');
    const results = document.querySelector('#argSearchResults');
    const message = document.querySelector('#argSearchMessage');
    if (!form || !input || !results || !message) return;

    const render = () => {
      const matches = core.search(input.value);
      results.replaceChildren();
      if (!input.value.trim()) {
        message.textContent = '識別コードを知っていれば、未閲覧の記録も検索できます。';
        return;
      }
      message.textContent = matches.length ? `${matches.length}件の記録が見つかりました。` : '一致するページはありません。';
      matches.forEach(({ id, page }) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        const number = document.createElement('span');
        const copy = document.createElement('span');
        const title = document.createElement('strong');
        const short = document.createElement('small');
        number.textContent = id;
        title.textContent = page.title;
        short.textContent = page.short;
        copy.append(title, short);
        link.append(number, copy);
        link.href = core.urlFor(id);
        link.addEventListener('click', () => core.unlock(id));
        item.append(link);
        results.append(item);
      });
    };

    form.addEventListener('submit', (event) => { event.preventDefault(); render(); });
    input.addEventListener('input', render);
  }

  function bindHistory() {
    const dialog = document.querySelector('#argHistory');
    const list = document.querySelector('#argHistoryList');
    const openers = [document.querySelector('#argHistoryOpen'), document.querySelector('#argHistoryFooter')].filter(Boolean);
    const closers = [document.querySelector('#argHistoryClose'), document.querySelector('#argHistoryAccept')].filter(Boolean);
    if (!dialog || !list) return;

    const render = () => {
      list.replaceChildren();
      core.visitedPages().forEach((page) => {
        const link = document.createElement('a');
        const number = document.createElement('span');
        const copy = document.createElement('span');
        const title = document.createElement('strong');
        const short = document.createElement('small');
        number.textContent = page.id;
        title.textContent = page.title;
        short.textContent = page.short;
        copy.append(title, short);
        link.append(number, copy);
        link.href = core.urlFor(page.id);
        link.addEventListener('click', () => core.unlock(page.id));
        list.append(link);
      });
    };
    const open = () => {
      render();
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    };
    const close = () => {
      core.acknowledgeHistory();
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };
    openers.forEach((button) => button.addEventListener('click', open));
    closers.forEach((button) => button.addEventListener('click', close));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  }

  function bindMenu() {
    const button = document.querySelector('#argMenu');
    const nav = document.querySelector('.arg-nav');
    if (!button || !nav) return;
    button.addEventListener('click', () => {
      const active = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(active));
    });
  }

  function applyAssets() {
    document.querySelectorAll('[data-asset="hero"]').forEach((element) => {
      element.style.backgroundImage = `linear-gradient(110deg, rgba(5, 35, 67, .15), rgba(255,255,255,.05)), url("${core.rootPrefix()}/assets/eternal-sleep-hero.png")`;
    });
    document.querySelectorAll('[data-asset-src]').forEach((image) => {
      image.src = `${core.rootPrefix()}/assets/${image.dataset.assetSrc}`;
    });
    document.querySelectorAll('[data-asset-bg]').forEach((element) => {
      const imageUrl = `${core.rootPrefix()}/assets/${element.dataset.assetBg}`;
      const overlay = element.dataset.assetOverlay === 'dark'
        ? 'linear-gradient(90deg, rgba(10,19,25,.88), rgba(10,19,25,.28))'
        : 'linear-gradient(90deg, rgba(238,247,245,.94), rgba(238,247,245,.2))';
      element.style.backgroundImage = `${overlay}, url("${imageUrl}")`;
    });
  }

  function bindCloseRecord() {
    const button = document.querySelector('#closeRecord');
    if (!button) return;
    button.addEventListener('click', () => {
      const delaySeconds = 4;
      core.solve();
      button.disabled = true;
      button.textContent = '記録を閉じています';
      document.body.classList.add('record-closed');
      const notice = document.createElement('div');
      notice.className = 'record-closed-notice';
      notice.setAttribute('role', 'alert');
      notice.setAttribute('aria-live', 'assertive');
      notice.innerHTML = `<span>SESSION CLOSING</span><strong>この記録を閉じています。</strong><small>次のページへ自動で移動中です。<b id="recordCountdown">${delaySeconds}</b>秒後に切り替わります。</small><i class="record-progress" aria-hidden="true"></i>`;
      document.body.append(notice);

      const countdown = notice.querySelector('#recordCountdown');
      let remaining = delaySeconds;
      const interval = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0 && countdown) countdown.textContent = String(remaining);
      }, 1000);
      window.setTimeout(() => {
        window.clearInterval(interval);
        location.replace(core.urlFor('24'));
      }, delaySeconds * 1000);
    }, { once: true });
  }

  function renderMissing() {
    document.title = '404 Not Found';
    document.body.className = 'missing-body';
    const app = document.querySelector('#app') || document.body;
    app.innerHTML = `
      <main class="missing-page">
        <span>404 / DOCUMENT NOT FOUND</span>
        <h1>ページが見つかりません</h1>
        <p>指定された記録は公開されていないか、URLが変更されています。</p>
        <a href="${core.urlFor('01')}">サイトのトップへ</a>
      </main>`;
  }

  function renderEnding() {
    core.markEndingSeen();
    const topUrl = core.urlFor('01');
    const shareText = `「お届け物です」\nhttps://note.com/mei_takanashi/n/nac75a8b7f0a2\n#ARG #奇跡の枕エターナルスリープ`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    document.title = 'お届け物です｜ETERNAL SLEEP';
    document.body.className = 'ending-body';
    document.body.dataset.pageId = '24';
    const app = document.querySelector('#app');
    app.innerHTML = `
      <main class="ending-page">
        <div class="ending-index"><span>ENDING</span></div>
        <section class="ending-story" aria-labelledby="ending-title">
          <p class="ending-label">AFTER THE RECORDS VANISHED</p>
          <h1 id="ending-title">お届け物です</h1>
          <p>後日、サイトを訪ねたが、エターナルスリープのサイトはなくなっており、親会社やブログ記事なども全てなくなっていた。</p>
          <p>事件は解決したと思ったある日、一つの荷物が届いた。</p>
        </section>
        <figure class="ending-package-image"><img src="${core.rootPrefix()}/assets/ending-package.webp" alt="暗い玄関に置かれたETERNAL SLEEP印字の配送箱"></figure>
        <p class="ending-last">箱の中から、かすかに誰かの寝息が聞こえる。</p>
        <div class="ending-actions">
          <a class="ending-top" href="${topUrl}">TOPへ戻る</a>
          <a class="ending-share" href="${shareUrl}" target="_blank" rel="noopener noreferrer"><span>𝕏</span><b>Xでシェア</b></a>
        </div>
        <footer class="ending-footer">
          <p class="ending-fiction">このWebサイトの内容はフィクションであり、実在の人物・団体とは一切関係がありません。</p>
          <div class="ending-page-count" aria-label="全24ページ中24ページ目"><span>PAGE</span><strong>24</strong><small>/ 24</small></div>
        </footer>
      </main>`;
  }
})();
