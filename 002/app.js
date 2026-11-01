(function () {
  'use strict';
  const C = window.FLORIST_CONTENT;
  const KEY = 'sunshineFlorist.arg.v1';
  const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s/g, '');
  const aliases = [
    ['黒いユリのキーホルダー', '黒いユリ', '黒百合', '黒ユリ', 'キーホルダー'],
    ['死者', '恨みを持った人', '殺された人', '殺害された人', '被害者'],
    ['佐野航', 'さのわたる', 'サノワタル', '佐野', 'さの', 'サノ']
  ];
  const searchIndex = new Map();
  C.search.forEach(item => {
    const key = normalize(item.word);
    if (!key || searchIndex.has(key)) throw new Error('検索ワードの登録が重複しています。');
    searchIndex.set(key, item);
  });
  const search = query => searchIndex.get(normalize(query)) || null;
  const judge = answers => {
    const values = answers.map(normalize);
    if (values.length !== 3 || values.some(value => !value)) return null;
    return values.every((value, i) => aliases[i].some(alias => normalize(alias) === value)) ? 39 : 40;
  };
  // Small pure API for local verification. Nothing here adds search aliases or visible hints.
  window.FloristRules = Object.freeze({ normalize, search, judge });
  const blank = () => ({ visitedPages: [], authView: false, answerDraft: ['', '', ''], lastOutcome: null, seenEnds: [] });
  let state = blank();
  let storageAvailable = true;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (stored && typeof stored === 'object') {
      state.visitedPages = Array.isArray(stored.visitedPages) ? stored.visitedPages.filter(n => Number.isInteger(n) && n >= 1 && n <= 40) : [];
      state.authView = stored.authView === true;
      state.answerDraft = Array.isArray(stored.answerDraft) ? [0, 1, 2].map(i => String(stored.answerDraft[i] || '')) : ['', '', ''];
      state.lastOutcome = [39, 40].includes(stored.lastOutcome) ? stored.lastOutcome : null;
      state.seenEnds = Array.isArray(stored.seenEnds) ? stored.seenEnds.filter(n => [39, 40].includes(n)) : [];
    }
  } catch (_) { storageAvailable = false; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { storageAvailable = false; } };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const route = n => n === 14 ? '#/sh-view' : '#/page/' + n;
  const link = (n, text, className = '') => `<a href="${route(n)}"${className ? ` class="${className}"` : ''}>${esc(text || C.pages[n].title)}</a>`;
  const paras = text => String(text).split(/\n\s*\n/).map(t => `<p class="paragraph">${esc(t)}</p>`).join('');
  const bodyText = n => C.pages[n].body;
  const title = n => C.pages[n].title;
  const links = items => `<nav class="section-links" aria-label="関連ページ">${items.map(([n, t]) => link(n, t)).join('')}</nav>`;
  const trimFirst = (text, first) => text.startsWith(first + '\n') ? text.slice(first.length).replace(/^\n+/, '') : text;
  const publicNav = [[2, '店舗案内'], [3, '商品一覧'], [4, 'ご注文について'], [5, '配達のご案内'], [6, 'お知らせ']];
  const protectedPages = new Set([15, 16, 17, 18, 24, 29]);
  const newsPages = new Set([19, 20, 25, 26, 30, 31]);
  const blogPages = new Set([7, 8, 11, 21, 27, 32, 33, 34, 35, 36]);
  const documentPages = new Set([10, 22, 23, 28]);
  let currentPage = 1;
  let pendingPage = 15;
  let photos = [];
  let photoPosition = 0;
  let previousFocus = null;
  let utilityRestore = null;
  const A = name => C.assets[name];
  function photo(name, alt, caption = '', metadata = '', extra = '') {
    const index = photos.length;
    photos.push({ src: A(name), alt, metadata });
    return `<figure class="photo ${extra}"><button type="button" data-photo="${index}" aria-label="写真を拡大：${esc(alt)}"><img src="${A(name)}" alt="${esc(alt)}" loading="lazy" decoding="async"></button>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
  }
  const shell = (n, html, extra = '') => `<div class="page-shell ${extra}"><div class="crumb">${link(1, 'ホーム')} <span aria-hidden="true"> / </span>${esc(title(n))}</div><h1 class="page-title">${esc(title(n))}</h1>${html}</div>`;
  function home() {
    const t = bodyText(1).split('\n\n');
    return `<div class="home"><section class="home-hero"><div class="hero-copy"><p class="eyebrow">SUNSHINE FLOWER SHOP</p><h1>${esc(t[0]).replace('、', '、\n')}</h1><p class="paragraph">${esc(t[1])}</p>${link(3, '商品を見る　→', 'button-link')}</div><img class="hero-photo" src="${A('shop')}" alt="サンシャイン生花店の外観" fetchpriority="high"></section><div class="hero-bottom"><section class="home-season"><img src="${A('seasonal')}" alt="季節のお花"><div><h2>季節のお花が入荷しています。</h2><p class="paragraph">${esc(t[2].split('\n').slice(1).join('\n'))}</p>${link(4, 'ご注文について')}　${link(5, '配達のご案内')}</div></section><nav class="home-mini-links" aria-label="店舗メニュー">${[[2, '店舗案内'], [6, 'お知らせ'], [7, '店長日記'], [9, 'スタッフ募集'], [12, '花のコラム']].map(([n, label]) => link(n, label)).join('')}</nav></div><section class="home-news"><h2>お知らせ</h2><p><time>2026/01/26</time>${link(6, '配達へのご協力ありがとうございました')}</p></section></div>`;
  }
  function products() {
    const parts = bodyText(3).split('\n\n');
    const images = ['bouquet', 'cut-flowers', 'seasonal', 'pots'];
    return shell(3, `<div class="product-grid">${parts.slice(0, 4).map((part, i) => {
      const [h, ...lines] = part.split('\n');
      return `<section class="product-card">${photo(images[i], h + 'の商品写真')}<h2>${esc(h)}</h2>${paras(lines.join('\n'))}</section>`;
    }).join('')}</div>${paras(parts[4])}${links([[4, 'ご注文について'], [12, '花のコラム']])}`);
  }
  function announcements() {
    const sections = bodyText(6).split('\n\n');
    return shell(6, `<div class="notice-list">${sections.map(t => { const [h, ...rest] = t.split('\n'); return `<section><h2>${esc(h)}</h2>${paras(rest.join('\n'))}</section>`; }).join('')}</div>${links([[9, 'スタッフ募集のご案内']])}`);
  }
  function recruitment() {
    let html = paras(bodyText(9));
    html = html.replace('<p class="paragraph">研修資料・業務マニュアル</p>', `<p><s>${link(10, '研修資料・業務マニュアル')}</s></p>`);
    html = html.replace('はるの花屋日記', link(11, 'はるの花屋日記'));
    html = html.replace('<p class="paragraph">10/21 更新\nこの募集は終了しました。</p>', '<div class="recruit-ended"><p class="update">10/21 更新</p><p>この募集は終了しました。</p></div>');
    return shell(9, `<div class="prose">${html}</div>`);
  }
  function loginPage() {
    return shell(14, `<form id="login-form" class="login-box"><label for="view-id">閲覧ID</label><input id="view-id" name="view-id" autocomplete="off" autocapitalize="none" spellcheck="false" required><label for="view-password">パスワード</label><input id="view-password" name="view-password" type="password" inputmode="numeric" autocomplete="off" required><p id="login-error" class="form-error" role="alert"></p><button class="primary-button" type="submit">ログイン</button><p class="small-muted" style="margin:22px 0 0">Web受付分の受注記録と配達履歴を確認できます。</p></form>`);
  }
  const date = raw => String(raw).slice(0, 10).replace(/-/g, '/');
  const time = raw => String(raw).slice(0, 5);
  const specialPage = { 'SH-250820-014': 18, 'SH-250924-006': 24, 'SH-260122-011': 29 };
  function orderButton(order) { return `<button type="button" class="table-link" data-order="${order.number}">${order.number}</button>`; }
  function recordTable(n) {
    const isDelivery = n === 16;
    const rows = C.orders.filter(r => isDelivery ? r.inHistory : r.inOrders);
    const head = isDelivery ? ['注文番号', '完了日時', '商品', '数量', '依頼主', 'お届け先', '端末'] : ['注文番号', '受付日', '商品', '数量', '依頼主', 'お届け先', '状態'];
    const html = `<div class="record-meta"><span>受付経路：Web</span><span>対象期間：2025/08/01〜2026/01/31</span><span>表示対象：${isDelivery ? '配達完了' : '配達済みを含む全件'}</span></div><div class="table-scroll" tabindex="0" role="region" aria-label="${title(n)}"><table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td>${orderButton(r)}</td><td>${date(isDelivery ? r.delivered : r.received)}${isDelivery ? ' ' + time(r.time) : ''}</td><td>${esc(r.product)}</td><td>${r.quantity}${r.unit}</td><td>${esc(r.sender)}</td><td>${esc(r.recipient)}</td><td>${isDelivery ? esc(r.device) : '配達済み'}</td></tr>`).join('')}</tbody></table></div>`;
    return shell(n, html + links(isDelivery ? [[15, '注文一覧を見る'], [17, '配達端末の貸出記録']] : [[16, '配達履歴を見る']]));
  }
  function ledger() {
    const lines = bodyText(17).split('\n');
    const rows = lines.filter(l => /^\d{4}\//.test(l)).map(l => l.split('／'));
    return shell(17, `<div class="record-meta"><span>資料番号：SH-TERM-D01</span><span>対象端末：D-01</span></div><div class="table-scroll"><table><thead><tr><th scope="col">貸出日</th><th scope="col">使用者</th><th scope="col">返却確認</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small-muted" style="margin-top:20px">端末を別の担当者へ渡した場合は、台帳への追記をお願いします。</p>${links([[16, '配達履歴へ戻る']])}`);
  }
  function receiptHTML(order, fullPage) {
    const number = specialPage[order.number];
    if (number && fullPage) return `<article class="receipt">${paras(bodyText(number))}</article>`;
    return `<article class="receipt"><h1>配達完了記録</h1><dl>${[
      ['注文番号', order.number], ['受付日', date(order.received)], ['配達日', date(order.delivered)], ['完了時刻', time(order.time)], ['使用端末', order.device], ['依頼主', order.sender], ['お届け先', order.recipient], ['商品', order.product], ['数量', order.quantity + order.unit]
    ].map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><h2>ご依頼内容</h2>${paras(order.request)}</article>`;
  }
  function specialReceipt(n) {
    // The full approved receipt text includes the location; the other controls use the same record presentation.
    const lines = bodyText(n).split('\n');
    const cut = lines.indexOf('ご依頼内容');
    const fields = lines.slice(1, cut).filter(Boolean).map(l => { const i = l.indexOf('：'); return [l.slice(0, i), l.slice(i + 1)]; });
    return shell(n, `<article class="receipt"><h2>配達完了記録</h2><dl>${fields.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><h2>ご依頼内容</h2>${paras(lines.slice(cut + 1).join('\n'))}</article>${links([[16, '配達履歴へ戻る']])}`);
  }
  const newsImages = { 19: ['news-apartment', '現場となった集合住宅'], 20: ['news-company', '東央設備株式会社'], 25: ['news-house-fire', '火災があった住宅'], 26: ['news-wakaba', '火災があった共同住宅'], 30: ['news-river', '白瀬町を流れる小羽川'], 31: ['news-bridge', '小羽川と秋見橋'] };
  function news(n) {
    let text = trimFirst(bodyText(n), title(n));
    let comment = '';
    if (n === 31) {
      const parts = text.split('\n\nコメント\n\n');
      text = parts[0];
      comment = `<section class="comments"><h2>コメント</h2><p>一緒にいた人ってこいつ？　なんかそんなことかいてんだけど<br>→ ${link(32, 'かずやのぼちぼち日記')}</p></section>`;
    }
    const [stamp, ...rest] = text.split('\n\n');
    const [image, caption] = newsImages[n];
    return `<div class="page-shell"><div class="news-masthead"><strong>白瀬地域ニュース</strong><span>地域 / 社会</span></div><article class="news-article"><h1>${esc(title(n))}</h1><p class="article-date">${esc(stamp)}</p>${photo(image, caption, caption)}${paras(rest.join('\n\n'))}${comment}</article></div>`;
  }
  function blogFrame(n, name, html, profile = '') {
    return `<div class="page-shell"><header class="blog-head"><h1>${esc(name)}</h1></header><div class="blog-layout"><div>${html}</div><aside class="blog-aside"><h2>プロフィール</h2><p>${esc(profile || name)}</p></aside></div></div>`;
  }
  function posts(n) {
    const text = bodyText(n);
    const chunks = text.split(/(?=^\d{4}年\d{1,2}月\d{1,2}日)/m).filter(Boolean);
    const names = {32: 'かずやのぼちぼち日記', 34: '藤崎亮の記録', 35: '片桐千尋の日々', 36: '佐野航の記録'};
    const profile = {32: '投稿者：成瀬和也',34:'藤崎亮',35:'片桐千尋',36:'佐野航'};
    const html = chunks.map(chunk => {
      const [dateTitle, ...rest] = chunk.trim().split('\n');
      let content = rest.join('\n').replace(/\n投稿者：成瀬和也$/, '');
      let media = '';
      if(n===32 && dateTitle.startsWith('2021年1月23日')) media = photo('naruse','出かける前の写真');
      if(n===34 && dateTitle==='2025年8月15日') media = photo('fujisaki-keys','鍵束の写真');
      if(n===34 && dateTitle==='2025年8月22日') media = photo('fujisaki-after','鍵束の写真');
      if(n===35 && dateTitle==='2025年9月18日') media = photo('katagiri-bag','バッグの写真');
      if(n===36 && dateTitle==='2026年1月15日') media = photo('sano-keys','玄関に置いた鍵の写真');
      if(n===36 && dateTitle==='2026年1月23日') media = photo('return-slip','端末返却控えの写真');
      let p = paras(content);
      if(n===34) p = p.replace('画面の件',link(37,'画面の件'));
      return `<article class="post"><h2>${esc(dateTitle)}</h2>${p}${media}</article>`;
    }).join('');
    return blogFrame(n, names[n], html, profile[n]);
  }
  function personalBlog(n) {
    if ([32, 34, 35, 36].includes(n)) return posts(n);
    if(n===11) {
      let t = trimFirst(bodyText(n),'はるの花屋日記');
      const html = t.split(/(?=^\d{4}年\d{1,2}月\d{1,2}日)/m).filter(Boolean).map(chunk=>{
        const [heading,...rest]=chunk.trim().split('\n');
        let content = paras(rest.join('\n').trim());
        if(heading==='2025年7月5日　花屋の初日') {
          const anchor = 'せっかくなので、帰る前に一枚。</p>';
          content = content.replace(anchor,anchor+photo('training','作業台に置いた花束と研修資料'));
        }
        return `<article class="post"><h2>${esc(heading)}</h2>${content}</article>`;
      }).join('');
      return blogFrame(n,'はるの花屋日記',html+links([[9,'スタッフ募集へ戻る']]),'はる');
    }
    if(n===33) {
      const parts=bodyText(n).split('\n\n');
      let gallery=photo('river-view','川辺の風景');
      ['river-01','river-02','river-03'].forEach((img,i)=>gallery+=photo(img,'秋見橋からの風景','','撮影日時：2021/01/23 14:32:'+String(10+i)));
      const coffee=photo('coffee','喫茶店のコーヒー');
      return blogFrame(n,'川と橋の旅行記',`<article class="post"><h2>${esc(parts[0])}</h2><p class="small-muted">${esc(parts[1])}</p>${paras(parts[2])}<div class="travel-gallery">${gallery}</div>${paras(parts[3])}${coffee}</article>`,'旅先で撮った写真を残しています。');
    }
    if(n===7) {
      const chunks=trimFirst(bodyText(n),title(n)).split(/(?=^\d{4}年\d{1,2}月\d{1,2}日)/m);
      const [intro,entry]=chunks.shift().trim().split('\n\n閉店後の外出\n');
      const lead=`<div class="blog-intro">${paras(intro)}</div><article class="post"><h2>${link(8,'閉店後の外出')}</h2>${paras(entry)}</article>`;
      const html=chunks.filter(Boolean).map(chunk=>{
        const [heading,...rest]=chunk.trim().split('\n');
        return `<article class="post"><h2>${esc(heading)}</h2>${paras(rest.join('\n').trim())}</article>`;
      }).join('');
      return blogFrame(n,title(n),lead+html,'田辺浩一');
    }
    if(n===8) return blogFrame(n,'田辺浩一の店長日記',`<article class="post"><h2>閉店後の外出</h2>${paras(bodyText(n))}</article>${links([[7,'店長日記へ戻る']])}`,'田辺浩一');
    if(n===21) {
      let html=paras(bodyText(n));
      html=html.replace('通報の受付控え',link(22,'通報の受付控え')).replace('会社が公表した調査概要',link(23,'会社が公表した調査概要'));
      return blogFrame(n,title(n),`<article class="post">${html}</article>`,'直人のことを、記録しています。');
    }
    if(n===27) {
      let html=paras(bodyText(n)).replace('火災事故報告書',link(28,'火災事故報告書'));
      return blogFrame(n,title(n),`<article class="post">${html}</article>`,'紗季のことを、記録しています。');
    }
    return '';
  }
  function documentPage(n) {
    let html=paras(trimFirst(bodyText(n),title(n)));
    if(n===10) html=html.replace('スタッフログイン',link(14,'スタッフログイン'));
    return shell(n,`<article class="document-card">${html}</article>${links(n===10?[[9,'スタッフ募集へ戻る']]:[[n===28?27:21,'遺族の記録へ戻る']])}`);
  }
  function forum() {
    const sections=bodyText(37).split('\n\n');
    const invitation=sections.pop().replace(/\n［報告する］$/, '');
    const text=sections.join('\n\n');
    const chunks=text.split(/\n\n(?=返信\n|相談者\n|2025年8月22日)/);
    return shell(37,chunks.map(chunk=>{const [h,...rest]=chunk.split('\n');return `<section class="thread"><h2>${esc(h)}</h2>${paras(rest.join('\n'))}</section>`;}).join('')+`<section class="report-invite" aria-label="教授への報告">${paras(invitation)}${link(38,'報告する','report-invite-button')}</section>`);
  }
  function reportPage() {
    const intro=bodyText(38).split('\n\n1　')[0];
    const questions=bodyText(38).match(/^[123]　.+$/gm);
    return shell(38,`<div class="report-box"><div class="report-intro">${paras(intro)}</div><form id="report-form" class="report-form" novalidate>${questions.map((q,i)=>`<label for="answer-${i}">${esc(q)}</label><input id="answer-${i}" name="answer-${i}" value="${esc(state.answerDraft[i])}" autocomplete="off">`).join('')}<p id="report-error" class="form-error" role="alert"></p><button class="primary-button" type="submit">この内容で報告する</button></form></div>`);
  }
  function ending(n) {
    const parts=bodyText(n).split(/\n\n\n/);
    const tweet='https://twitter.com/intent/tweet?'+new URLSearchParams({text:C.share[n]}).toString();
    return `<div class="end-shell"><h1 class="end-title">${esc(title(n))}</h1><div class="end-prose">${paras(parts[0])}</div><img class="end-photo" src="${A('end-'+n)}" alt="${n===39?'机の上のキーホルダー':'インターフォンの画面'}"><div class="end-prose">${paras(parts.slice(1).join('\n\n\n'))}</div><nav class="end-actions" aria-label="結末の操作"><a href="${esc(tweet)}" target="_blank" rel="noopener noreferrer">Xで報告</a>${link(38,'もう一度報告する')}${link(1,'TOPへ戻る')}</nav></div>`;
  }
  function regular(n) {
    let html=paras(bodyText(n));
    if(n===2) return shell(n,`<div class="shop-image">${photo('shop','サンシャイン生花店の外観')}</div><div class="prose">${html}</div>${links([[5,'配達のご案内'],[7,'店長日記']])}`);
    if(n===12) html=html.replace('花の名前と贈り方',link(13,'花の名前と贈り方'));
    const related={4:[[5,'配達のご案内']],5:[[2,'店舗案内'],[4,'ご注文について']],13:[[12,'花のコラムへ戻る']]};
    return shell(n,`<div class="prose">${html}</div>`+(related[n]?links(related[n]):''));
  }
  function modeFor(n) {
    if(n>=39)return 'ending';
    if(n===38)return 'report';
    if(n===37)return 'forum';
    if(protectedPages.has(n)||n===14)return 'management';
    if(newsPages.has(n))return 'news';
    if(blogPages.has(n))return 'blog';
    if(documentPages.has(n))return 'document';
    return 'storefront';
  }
  function render(n, focus=true) {
    if(!C.pages[n]) { navigate(1,true); return; }
    if(protectedPages.has(n)&&!state.authView){pendingPage=n;navigate(14,true);return;}
    if(n>=39&&!state.seenEnds.includes(n)){navigate(38,true);return;}
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    photos=[];
    currentPage=n;
    state.visitedPages=state.visitedPages.filter(v=>v!==n);state.visitedPages.push(n);save();
    document.title=title(n)+'｜サンシャイン生花店';
    document.body.className=modeFor(n);
    const bar=document.getElementById('page-nav');
    bar.innerHTML=protectedPages.has(n)?`<nav class="admin-bar"><div class="admin-bar-inner"><span>サンシャイン生花店 / 閲覧用管理画面</span>${link(15,'注文一覧')}${link(16,'配達履歴')}<button type="button" id="logout">ログアウト</button></div></nav>`:(n<=13?`<nav class="public-nav" aria-label="店舗のご案内"><div class="public-nav-inner">${publicNav.map(([id,label])=>link(id,label)).join('')}</div></nav>`:'');
    let html='';
    if(n===1)html=home();
    else if(n===3)html=products();
    else if(n===6)html=announcements();
    else if(n===9)html=recruitment();
    else if(n===14)html=loginPage();
    else if(n===15||n===16)html=recordTable(n);
    else if(n===17)html=ledger();
    else if([18,24,29].includes(n))html=specialReceipt(n);
    else if(newsPages.has(n))html=news(n);
    else if(blogPages.has(n))html=personalBlog(n);
    else if(documentPages.has(n))html=documentPage(n);
    else if(n===37)html=forum();
    else if(n===38)html=reportPage();
    else if(n>=39)html=ending(n);
    else html=regular(n);
    document.getElementById('main').innerHTML=html;
    document.getElementById('page-number').textContent=String(n).padStart(2,'0')+' / 40';
    window.scrollTo(0,0);
    if(focus)document.getElementById('main').focus({preventScroll:true});
    wirePage();
  }
  function navigate(n,replace=false) {
    const hash=route(n);
    if(replace){history.replaceState(null,'',hash);render(n);}
    else if(location.hash===hash)render(n);
    else location.hash=hash;
  }
  function openUtility(heading,html) {
    utilityRestore=document.activeElement;
    document.getElementById('utility-title').textContent=heading;
    document.getElementById('utility-body').innerHTML=html;
    document.getElementById('utility-dialog').showModal();
  }
  function showPhoto(index) {
    photoPosition=(index+photos.length)%photos.length;
    const p=photos[photoPosition];
    const img=document.getElementById('photo-large');img.src=p.src;img.alt=p.alt;
    document.getElementById('photo-info').textContent=p.metadata;
    document.getElementById('photo-index').textContent=`${photoPosition+1} / ${photos.length}`;
    document.getElementById('photo-prev').disabled=photos.length<2;
    document.getElementById('photo-next').disabled=photos.length<2;
    document.getElementById('photo-scroll').classList.remove('original');
    document.getElementById('photo-size').textContent='原寸表示';
    const d=document.getElementById('photo-dialog');
    if(!d.open){previousFocus=document.activeElement;d.showModal();}
  }
  function wirePage() {
    const invite=document.querySelector('.report-invite');
    if(invite) {
      if('IntersectionObserver' in window) {
        const observer=new IntersectionObserver(entries=>{
          if(entries.some(entry=>entry.isIntersecting)){invite.classList.add('is-visible');observer.disconnect();}
        },{threshold:0.15});
        observer.observe(invite);
      } else invite.classList.add('is-visible');
    }
    document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>showPhoto(Number(button.dataset.photo))));
    document.querySelectorAll('[data-order]').forEach(button=>button.addEventListener('click',()=>{
      const record=C.orders.find(r=>r.number===button.dataset.order);
      if(specialPage[record.number])navigate(specialPage[record.number]);
      else openUtility('配達完了記録',receiptHTML(record,false));
    }));
    document.getElementById('logout')?.addEventListener('click',()=>{state.authView=false;save();pendingPage=15;navigate(14);});
    document.getElementById('login-form')?.addEventListener('submit',event=>{
      event.preventDefault();
      const id=document.getElementById('view-id').value;
      const password=document.getElementById('view-password').value;
      if(normalize(id)==='sh-view'&&normalize(password)==='102589'){state.authView=true;save();navigate(pendingPage);pendingPage=15;}
      else document.getElementById('login-error').textContent='閲覧IDまたはパスワードが違います。';
    });
    const form=document.getElementById('report-form');
    form?.addEventListener('input',()=>{state.answerDraft=[0,1,2].map(i=>document.getElementById('answer-'+i).value);save();});
    form?.addEventListener('submit',event=>{
      event.preventDefault();
      state.answerDraft=[0,1,2].map(i=>document.getElementById('answer-'+i).value);save();
      const outcome=judge(state.answerDraft);
      if(!outcome){document.getElementById('report-error').textContent='未入力の項目があります。';return;}
      state.lastOutcome=outcome;if(!state.seenEnds.includes(outcome))state.seenEnds.push(outcome);save();navigate(outcome);
    });
  }
  document.getElementById('search-form').addEventListener('submit',event=>{
    event.preventDefault();
    const query=document.getElementById('site-search').value;
    const result=search(query);
    const html=`<p class="search-result-count">「${esc(query)}」の検索結果：${result?1:0}件</p>`+(result?`<div class="search-result"><a href="${route(result.page)}">${esc(result.title)}</a></div>`:'<p>該当するページが見つかりませんでした。</p>');
    openUtility('検索結果',html);
  });
  document.getElementById('history-button').addEventListener('click',()=>{
    const seen=state.visitedPages.filter(n=>n<39||state.seenEnds.includes(n)).slice().sort((a,b)=>a-b);
    openUtility('ページ履歴',`<ol class="history-list">${seen.map(n=>`<li><a href="${route(n)}"><span>${String(n).padStart(2,'0')}</span>${esc(title(n))}</a></li>`).join('')}</ol>`);
  });
  function settings(resetConfirm=false){
    openUtility('保存設定',`<div class="settings-copy"><p>${storageAvailable?'閲覧履歴と回答の入力内容は、このブラウザーに保存されます。':'ブラウザーへの保存が利用できません。この画面を開いている間は遊べますが、閉じると履歴が失われる場合があります。'}</p>${resetConfirm?'<p>閲覧履歴、ログイン状態、回答と結末の記録を消去します。よろしいですか？</p><button type="button" class="danger-button" id="reset-confirm">消去する</button> <button type="button" class="button-link" id="reset-cancel">キャンセル</button>':'<button type="button" class="danger-button" id="reset-data">調査データをリセット</button>'}</div>`);
    document.getElementById('reset-data')?.addEventListener('click',()=>{document.getElementById('utility-dialog').close();settings(true);});
    document.getElementById('reset-cancel')?.addEventListener('click',()=>document.getElementById('utility-dialog').close());
    document.getElementById('reset-confirm')?.addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch(_){}state=blank();pendingPage=15;document.getElementById('utility-dialog').close();navigate(1);});
  }
  document.getElementById('settings-button').addEventListener('click',()=>settings());
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.close).close()));
  document.getElementById('utility-dialog').addEventListener('close',()=>utilityRestore?.focus?.());
  document.getElementById('photo-dialog').addEventListener('close',()=>previousFocus?.focus?.());
  document.getElementById('utility-dialog').addEventListener('click',event=>{if(event.target.closest('a[href^="#/"]'))document.getElementById('utility-dialog').close();});
  document.getElementById('photo-prev').addEventListener('click',()=>showPhoto(photoPosition-1));
  document.getElementById('photo-next').addEventListener('click',()=>showPhoto(photoPosition+1));
  document.getElementById('photo-size').addEventListener('click',()=>{
    const full=document.getElementById('photo-scroll').classList.toggle('original');
    document.getElementById('photo-size').textContent=full?'全体表示':'原寸表示';
  });
  document.getElementById('photo-dialog').addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(photoPosition-1);}
    if(event.key==='ArrowRight'){event.preventDefault();showPhoto(photoPosition+1);}
  });
  document.querySelector('.skip-link').addEventListener('click',event=>{
    event.preventDefault();
    document.getElementById('main').focus();
  });
  window.addEventListener('hashchange',()=>startRoute());
  function startRoute(){
    if(location.hash==='#/sh-view'){render(14);return;}
    const m=location.hash.match(/^#\/page\/(\d+)$/);
    if(m&&C.pages[Number(m[1])])render(Number(m[1]));
    else navigate(1,true);
  }
  startRoute();
})();
