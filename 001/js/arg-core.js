(function () {
  'use strict';

  const STORAGE_KEY = 'eternalSleep.arg.v1';

  const pages = {
    '01': { path: 'index.html', title: 'ホーム', short: '奇跡のマクラ【エターナルスリープ】', theme: 'product', public: true, aliases: ['エターナルスリープ'] },
    '02': { path: 'product/about.html', title: 'エターナルスリープとは', short: '特殊素材と眠りの技術', theme: 'product', public: true, aliases: ['商品説明'] },
    '03': { path: 'product/voices.html', title: '皆様の声', short: '体験者から届いたレビュー', theme: 'product', public: true, aliases: ['口コミ'] },
    '04': { path: 'product/monitor.html', title: 'モニター募集', short: '現在、募集を休止しています', theme: 'product', public: true, aliases: ['モニター'] },
    '05': { path: 'product/faq.html', title: 'よくあるご質問', short: '使用方法・共用・返品について', theme: 'product', public: true, aliases: ['共用'] },
    '06': { path: 'product/news.html', title: 'お知らせ', short: '商品と運営に関するお知らせ', theme: 'product', public: true, aliases: ['お知らせ'] },
    '07': { path: 'company/index.html', title: '会社概要', short: '株式会社エターナルスリープ研究所', theme: 'company', public: true, aliases: ['会社概要'] },
    '08': { path: 'product/safety.html', title: '製品安全・使用上の注意', short: '安全にお使いいただくために', theme: 'product', public: true, aliases: ['使用上の注意'] },
    '09': { path: 'product/monitor-report.html', title: '体験モニター実施報告', short: '累計25,002名の調査記録', theme: 'product', public: true, aliases: ['25002'] },
    '10': { path: 'company/partners.html', title: 'お取引先・関連企業', short: '製造・研究・回収体制', theme: 'company', public: true, aliases: ['関連企業'] },
    '11': { path: 'kuon/index.html', title: '久遠ホールディングス', short: 'KUON HOLDINGS', theme: 'kuon', aliases: ['KUON-2024'], requireAll: ['07'] },
    '12': { path: 'kuon/group.html', title: 'グループ企業一覧', short: '久遠グループの事業会社', theme: 'kuon', aliases: ['KUON-GROUP'], requireAll: ['11'] },
    '13': { path: 'rem-lab/index.html', title: 'レム技研株式会社', short: 'REM MATERIAL RESEARCH', theme: 'lab', aliases: ['REM-0918'], requireAll: ['12'] },
    '14': { path: 'rem-lab/es-core.html', title: 'E.S. CORE 技術概要', short: '生体反応型多孔質複合材', theme: 'lab', aliases: ['ES-CORE-R06'], requireAll: ['13'] },
    '15': { path: 'rem-lab/procurement.html', title: '海外調達方針', short: 'VNR-18 調達・保全情報', theme: 'lab', aliases: ['VNR-18'], requireAll: ['14'] },
    '16': { path: 'rem-lab/history.html', title: '研究開発史', short: '2018–2024', theme: 'lab', aliases: ['MIZUKI-2018'], requireAll: ['13'] },
    '17': { path: 'touichi-blog/index.html', title: '水城冬一の睡眠紀行', short: '眠りを探して歩いた記録', theme: 'blog', aliases: ['水城冬一の睡眠紀行'], requireAll: ['16'] },
    '18': { path: 'touichi-blog/20180412.html', title: 'ヴェルナへ', short: '2018年4月12日', theme: 'blog', aliases: ['VNR-SEREN'], requireAll: ['17'] },
    '19': { path: 'touichi-blog/20180416.html', title: '眠りの村', short: '2018年4月16日', theme: 'blog', aliases: ['ラグナ村'], requireAll: ['18'] },
    '20': { path: 'touichi-blog/20180418.html', title: '灰の工房', short: '2018年4月18日', theme: 'blog', aliases: ['送り灰'], requireAll: ['19'] },
    '21': { path: 'verna-museum/okuribai.html', title: '送り灰', short: 'ヴェルナ民俗資料館・収蔵記録', theme: 'museum', aliases: ['OKURIBAI-25'], requireAny: ['19', '20'] },
    '22': { path: 'verna-archive/seren-2002.html', title: 'セレン鉱山事故追悼記録', short: 'SEREN-25-2002', theme: 'archive', aliases: ['SEREN-25-2002'], requireAll: ['20'] },
    '23': { path: 'records/es-core-intake.html', title: '非公開資料｜E.S. CORE原料受入記録', short: 'MATERIAL INTAKE / RESTRICTED', theme: 'internal', aliases: ['RM-VNR18-25002'], requireAll: ['22'] },
    '24': { path: 'ending.html', title: 'お届け物です', short: 'ENDING', theme: 'ending', aliases: [] },
  };

  function defaultState() {
    return {
      visitedPages: [],
      unlockedPages: [],
      historyAcknowledged: false,
      solved: false,
      endingSeen: false,
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Object.assign(defaultState(), parsed || {});
    } catch (_) {
      return defaultState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      window.__eternalSleepSessionState = state;
    }
  }

  function getState() {
    if (window.__eternalSleepSessionState) return window.__eternalSleepSessionState;
    return loadState();
  }

  function updateState(mutator) {
    const state = getState();
    mutator(state);
    window.__eternalSleepSessionState = state;
    saveState(state);
    return state;
  }

  function resetIfRequested() {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') !== '1') return false;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* no-op */ }
    window.__eternalSleepSessionState = defaultState();
    params.delete('reset');
    const clean = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`;
    location.replace(clean);
    return true;
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFKC')
      .toLocaleLowerCase('ja')
      .replace(/[ぁ-ゖ]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60))
      .replace(/[\s　・･,，、。._＿\-‐‑–—:：/／【】\[\]()（）]/g, '')
      .trim();
  }

  function rootPrefix() {
    return document.body?.dataset.root || '.';
  }

  function urlFor(id, root = rootPrefix()) {
    const page = pages[id];
    if (!page) return '#';
    return `${root}/${page.path}`.replace('/./', '/');
  }

  function pageIdFromLocation() {
    const current = decodeURIComponent(location.pathname.replace(/\\/g, '/'));
    const match = Object.entries(pages)
      .sort((a, b) => b[1].path.length - a[1].path.length)
      .find(([, page]) => current.endsWith(`/${page.path}`));
    if (match) return match[0];
    if (current.endsWith('/') || current.endsWith('/index.html')) return '01';
    return null;
  }

  function requirementsMet(page, state = getState()) {
    if (!page) return false;
    if (page.public) return true;
    if (page.path === 'ending.html') return Boolean(state.solved);
    if (state.unlockedPages.includes(pageIdFor(page))) return true;
    const allMet = !page.requireAll || page.requireAll.every((id) => state.visitedPages.includes(id));
    const anyMet = !page.requireAny || page.requireAny.some((id) => state.visitedPages.includes(id));
    return allMet && anyMet;
  }

  function pageIdFor(target) {
    const match = Object.entries(pages).find(([, page]) => page === target);
    return match ? match[0] : null;
  }

  function unlock(id) {
    if (!pages[id]) return;
    updateState((state) => {
      if (!state.unlockedPages.includes(id)) state.unlockedPages.push(id);
    });
  }

  function visit(id) {
    if (!pages[id]) return;
    updateState((state) => {
      if (!state.visitedPages.includes(id)) state.visitedPages.push(id);
      if (!state.unlockedPages.includes(id)) state.unlockedPages.push(id);
    });
  }

  function canAccess(id) {
    const page = pages[id];
    return requirementsMet(page);
  }

  function search(query) {
    const key = normalize(query);
    if (!key) return [];
    const results = [];

    Object.entries(pages).forEach(([id, page]) => {
      if (id === '24') return;
      const aliases = page.aliases.map(normalize);
      if (page.public) {
        const haystack = normalize([page.title, page.short, ...page.aliases].join(' '));
        if (haystack.includes(key)) results.push({ id, page });
        return;
      }
      if (aliases.includes(key)) results.push({ id, page });
    });

    return results.sort((a, b) => Number(a.id) - Number(b.id));
  }

  function visitedPages() {
    const state = getState();
    return state.visitedPages
      .filter((id) => pages[id])
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => ({ id, ...pages[id] }));
  }

  function acknowledgeHistory() {
    updateState((state) => { state.historyAcknowledged = true; });
  }

  function solve() {
    updateState((state) => { state.solved = true; });
  }

  function markEndingSeen() {
    updateState((state) => {
      state.endingSeen = true;
      if (!state.visitedPages.includes('24')) state.visitedPages.push('24');
      if (!state.unlockedPages.includes('24')) state.unlockedPages.push('24');
    });
  }

  function shouldRedirectToEnding(currentId) {
    const state = getState();
    return state.solved && !state.endingSeen && currentId !== '24';
  }

  function siteRootUrl(root = rootPrefix()) {
    try {
      return new URL(`${root}/index.html`, location.href).href;
    } catch (_) {
      return location.href;
    }
  }

  window.EternalARG = {
    STORAGE_KEY,
    pages,
    getState,
    updateState,
    resetIfRequested,
    normalize,
    rootPrefix,
    urlFor,
    pageIdFromLocation,
    canAccess,
    unlock,
    visit,
    search,
    visitedPages,
    acknowledgeHistory,
    solve,
    markEndingSeen,
    shouldRedirectToEnding,
    siteRootUrl,
  };
})();
