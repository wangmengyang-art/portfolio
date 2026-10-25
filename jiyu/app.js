/* 技遇 · 技能互换平台
 * 一个不依赖框架的前端原型。数据与交互仅保存在本机浏览器。
 */
(function () {
  'use strict';

  const DATA = window.SWAP_DATA;
  const LOGIC = window.SWAP_LOGIC;
  const ICONS = window.SWAP_ICONS;

  const app = document.getElementById('app');
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  const mobileNav = document.getElementById('mobile-nav');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  const DEFAULT_UI = {
    query: '',
    category: 'all',
    format: 'all',
    sort: 'match',
    onlyDouble: false
  };

  let ui = Object.assign({}, DEFAULT_UI);
  let state = loadState();
  let lastFocused = null;
  let pendingScroll = null;
  let pendingConfirm = null;
  let proposalDraft = null;
  let editDraft = null;
  let sessionDraft = null;

  init();

  /* ---------------------------------------------------------------------------
   * Boot & persistence
   * ------------------------------------------------------------------------- */

  function init() {
    renderChrome();
    bindEvents();

    if (!location.hash) {
      history.replaceState(null, '', location.pathname + location.search + '#/');
    }

    renderRoute({ scroll: false });
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function seedState() {
    return {
      version: 1,
      me: deepClone(DATA.me),
      exchanges: deepClone(DATA.exchanges)
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(DATA.storageKey);
      if (!raw) return seedState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.me || !Array.isArray(parsed.exchanges)) {
        return seedState();
      }
      return {
        version: 1,
        me: Object.assign(deepClone(DATA.me), parsed.me),
        exchanges: parsed.exchanges
      };
    } catch (error) {
      return seedState();
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(DATA.storageKey, JSON.stringify(state));
    } catch (error) {
      // 本地存储被浏览器禁用时，页面仍可正常演示，只是不会记住操作。
    }
  }

  function resetDemo() {
    state = seedState();
    saveState();
    closeModal(true);
    toast('演示数据已恢复为初始状态。');
    navigate('#/');
  }

  /* ---------------------------------------------------------------------------
   * Small utilities
   * ------------------------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function icon(name) {
    return ICONS[name] || '';
  }

  function formatCoins(value) {
    return Number.isInteger(Number(value)) ? String(Number(value)) : Number(value).toFixed(1);
  }

  function formatNumber(value) {
    return Number(value || 0).toFixed(1).replace('.0', '');
  }

  function skillLabel(id) {
    return LOGIC.skillLabel(id);
  }

  function labelsForTeach(person) {
    return person.teaches.map(function (item) { return LOGIC.skillLabel(item.skill); });
  }

  function labelsForWants(person) {
    return person.wants.map(function (item) {
      return typeof item === 'string' ? LOGIC.skillLabel(item) : LOGIC.skillLabel(item.skill);
    });
  }

  function formatLine(person) {
    return (person.formats || []).map(function (value) {
      return value === '线下' ? person.city + '线下' : value;
    }).join(' / ');
  }

  function avatarMarkup(person, size) {
    const cls = 'avatar' + (size ? ' avatar--' + size : '');
    return '<span class="' + cls + '" style="--avatar-bg:' + escapeHtml(person.avatarBg) + ';--avatar-color:' + escapeHtml(person.avatarColor) + '" aria-hidden="true">' +
      escapeHtml(person.initials || person.name.slice(0, 1)) + '</span>';
  }

  function findPeer(peerId) {
    return DATA.peers.filter(function (peer) { return peer.id === peerId; })[0] || null;
  }

  function findExchange(id) {
    return state.exchanges.filter(function (exchange) { return exchange.id === id; })[0] || null;
  }

  function exchangeForPeer(peerId) {
    const order = { active: 0, review: 1, incoming: 2, pending: 3, completed: 4 };
    return state.exchanges
      .filter(function (exchange) {
        return exchange.peerId === peerId && exchange.status !== 'declined';
      })
      .sort(function (a, b) { return (order[a.status] || 9) - (order[b.status] || 9); })[0] || null;
  }

  function actionCount() {
    return state.exchanges.filter(function (exchange) {
      return exchange.status === 'incoming' || exchange.status === 'review';
    }).length;
  }

  function statusMeta(status) {
    return LOGIC.statusMeta(status);
  }

  function statusPill(status, extraClass) {
    const meta = statusMeta(status);
    return '<span class="status-pill status-pill--' + meta.tone + (extraClass ? ' ' + extraClass : '') + '"><i></i>' + meta.label + '</span>';
  }

  function statusTextForExchange(exchange) {
    if (exchange.status === 'review') return '等待互评';
    return statusMeta(exchange.status).label;
  }

  function contractNumber(exchange) {
    let numeric = String(exchange.id || '').replace(/[^0-9]/g, '').slice(-4);
    if (!numeric) {
      let hash = 17;
      const source = String(exchange.id || 'jiyu');
      for (let index = 0; index < source.length; index += 1) {
        hash = (hash * 31 + source.charCodeAt(index)) % 10000;
      }
      numeric = String(hash || 117).padStart(4, '0');
    }
    return 'JY · ' + numeric.slice(-4).padStart(4, '0');
  }

  function myGoalTitle(exchange) {
    return '我的目标 · ' + skillLabel(exchange.theirSkill);
  }

  function theirGoalTitle(exchange) {
    const peer = findPeer(exchange.peerId);
    return (peer ? peer.name : 'TA') + '的目标 · ' + skillLabel(exchange.mySkill);
  }

  function totalHours(exchange) {
    return LOGIC.totalHours(exchange);
  }

  function sessionTimeLabel(exchange) {
    return exchange.sessionMinutes + ' 分钟 / 节';
  }

  function progress(exchange) {
    const done = LOGIC.completedSessions(exchange);
    const total = exchange.sessionsTotal || (exchange.sessions || []).length || 1;
    return { done: done, total: total, percent: Math.round(done / total * 100) };
  }

  function myWantsForSkill(skillId) {
    const found = (state.me.wants || []).filter(function (item) { return item.skill === skillId; })[0];
    return found ? found.note : '';
  }

  function exchangeCoinText(exchange) {
    if (exchange.mode === 'swap' || !exchange.coinHours) return '';
    const hours = formatCoins(exchange.coinHours);
    if (exchange.mode === 'teach') return '存入 +' + hours + ' 时间币';
    return '支出 −' + hours + ' 时间币';
  }

  function reviewStars(stars, size) {
    let output = '<span class="star-row' + (size ? ' star-row--' + size : '') + '" aria-label="' + Number(stars).toFixed(1) + ' 分">';
    for (let index = 0; index < 5; index += 1) {
      output += '<span class="' + (index < Math.round(stars) ? 'is-filled' : 'is-empty') + '">' + icon('star') + '</span>';
    }
    output += '</span>';
    return output;
  }

  function todayStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '.' + month + '.' + day;
  }

  function messageStamp() {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  function toast(message, tone) {
    const node = document.createElement('div');
    node.className = 'toast' + (tone ? ' toast--' + tone : '');
    node.innerHTML = '<span class="toast__mark">' + icon(tone === 'accent' ? 'sparkle' : 'check') + '</span><span>' + escapeHtml(message) + '</span>';
    toastRoot.appendChild(node);
    window.setTimeout(function () {
      node.classList.add('is-leaving');
      window.setTimeout(function () { node.remove(); }, 260);
    }, 3400);
  }

  /* ---------------------------------------------------------------------------
   * Chrome: header, footer, mobile nav
   * ------------------------------------------------------------------------- */

  function currentRoute() {
    const raw = (location.hash || '#/').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    if (!parts.length) return { name: 'home' };
    if (parts[0] === 'exchanges') return { name: 'exchanges', tab: parts[1] || 'all' };
    if (parts[0] === 'exchange') return { name: 'exchange', id: parts[1] || '' };
    if (parts[0] === 'me') return { name: 'me' };
    if (parts[0] === 'notes') return { name: 'notes' };
    return { name: 'notfound' };
  }

  function renderChrome() {
    renderHeader();
    renderFooter();
    renderMobileNav();
  }

  function renderHeader() {
    const route = currentRoute();
    const count = actionCount();
    const activeWorkbench = route.name === 'exchanges' || route.name === 'exchange';

    headerEl.innerHTML =
      '<div class="header-inner wrap">' +
        '<a class="brand" href="#/" data-action="go-home-top" aria-label="技遇首页">' +
          '<span class="brand-mark" aria-hidden="true">' + brandMark() + '</span>' +
          '<span class="brand-word">技遇<small>SKILL SWAP</small></span>' +
        '</a>' +
        '<nav class="main-nav" aria-label="主导航">' +
          '<a href="#/" data-action="nav-discover" ' + (route.name === 'home' ? 'aria-current="page"' : '') + '>发现交换</a>' +
          '<a href="#/exchanges" ' + (activeWorkbench ? 'aria-current="page"' : '') + '>交换工作台' +
            (count ? '<span class="nav-count" aria-label="' + count + ' 项待处理">' + count + '</span>' : '') +
          '</a>' +
          '<a href="#/me" ' + (route.name === 'me' ? 'aria-current="page"' : '') + '>技能名片</a>' +
          '<a href="#/notes" ' + (route.name === 'notes' ? 'aria-current="page"' : '') + '>产品手记</a>' +
        '</nav>' +
        '<div class="header-tools">' +
          '<button type="button" class="coin-pill" data-action="open-timecoin" aria-label="你有 ' + formatCoins(state.me.coins) + ' 个时间币，查看规则">' +
            icon('coin') + '<span><b>' + formatCoins(state.me.coins) + '</b> h</span><em>时间币</em>' +
          '</button>' +
          '<a class="header-avatar" href="#/me" aria-label="查看我的技能名片">' +
            avatarMarkup(state.me, 'sm') +
          '</a>' +
        '</div>' +
      '</div>';
  }

  function brandMark() {
    return '<svg viewBox="0 0 36 36" fill="none" aria-hidden="true">' +
      '<rect x="2" y="4" width="19" height="19" rx="9.5" fill="#E85B2A" stroke="#1F1B14" stroke-width="1.8"/>' +
      '<rect x="15" y="14" width="19" height="19" rx="9.5" fill="#2D4B8E" stroke="#1F1B14" stroke-width="1.8"/>' +
      '<path d="M11 22.5c0 3 2.4 5 5.5 5" stroke="#F4EFE4" stroke-width="2.1" stroke-linecap="round"/>' +
      '<path d="M25 13.5c0-3-2.4-5-5.5-5" stroke="#F4EFE4" stroke-width="2.1" stroke-linecap="round"/>' +
    '</svg>';
  }

  function renderFooter() {
    footerEl.innerHTML =
      '<div class="wrap footer-main">' +
        '<div class="footer-brand">' +
          '<a class="brand brand--footer" href="#/" data-action="go-home-top">' +
            '<span class="brand-mark" aria-hidden="true">' + brandMark() + '</span>' +
            '<span class="brand-word">技遇<small>SKILL SWAP</small></span>' +
          '</a>' +
          '<p class="footer-tagline">用你会的，<br />换你想学的。</p>' +
          '<p class="footer-note">一份可以点击的产品概念。<br />不卖课，不向交换抽佣。</p>' +
        '</div>' +
        '<div class="footer-col">' +
          '<p class="footer-col__title">去交换</p>' +
          '<a href="#/" data-action="nav-discover">发现互补的人</a>' +
          '<a href="#/exchanges">我的交换工作台</a>' +
          '<a href="#/me">我的技能名片</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<p class="footer-col__title">了解它</p>' +
          '<a href="#/notes">产品手记</a>' +
          '<button type="button" data-action="open-timecoin">时间币是什么</button>' +
          '<button type="button" data-action="open-salon">交换局怎么玩</button>' +
        '</div>' +
        '<div class="footer-col">' +
          '<p class="footer-col__title">演示说明</p>' +
          '<p>人物、评价与交换均为虚构；你的名片与操作只保存在本机浏览器。</p>' +
          '<button type="button" class="footer-reset" data-action="reset-demo">重置演示数据</button>' +
        '</div>' +
      '</div>' +
      '<div class="wrap footer-bottom">' +
        '<span>© 2026 技遇 JIYU · 技能互换产品概念</span>' +
        '<span>1 小时 = 1 小时</span>' +
        '<span>Made for a slower kind of learning.</span>' +
      '</div>';
  }

  function renderMobileNav() {
    const route = currentRoute();
    const count = actionCount();
    const isHome = route.name === 'home';
    const isWorkbench = route.name === 'exchanges' || route.name === 'exchange';
    mobileNav.innerHTML =
      '<a href="#/" data-action="nav-discover" class="' + (isHome ? 'is-active' : '') + '">' + icon('search') + '<span>发现</span></a>' +
      '<a href="#/exchanges" class="' + (isWorkbench ? 'is-active' : '') + '">' + icon('ticket') + '<span>工作台</span>' + (count ? '<i class="mobile-badge">' + count + '</i>' : '') + '</a>' +
      '<a href="#/me" class="' + (route.name === 'me' ? 'is-active' : '') + '">' + icon('users') + '<span>名片</span></a>' +
      '<a href="#/notes" class="' + (route.name === 'notes' ? 'is-active' : '') + '">' + icon('edit') + '<span>手记</span></a>';
  }

  /* ---------------------------------------------------------------------------
   * Routing
   * ------------------------------------------------------------------------- */

  function navigate(hash, options) {
    const opts = options || {};
    if (location.hash === hash) {
      renderRoute({ scroll: !opts.keepScroll, target: opts.target });
    } else {
      pendingScroll = opts.target || null;
      location.hash = hash;
    }
  }

  function renderRoute(options) {
    const opts = options || {};
    const route = currentRoute();
    closeModal(true);
    headerEl.classList.remove('is-menu-open');

    if (route.name === 'home') {
      document.title = '技遇 · 用你会的，换你想学的';
      renderHome();
    } else if (route.name === 'exchanges') {
      document.title = '交换工作台 · 技遇';
      renderExchanges(route.tab);
    } else if (route.name === 'exchange') {
      const exchange = findExchange(route.id);
      if (exchange) {
        const peer = findPeer(exchange.peerId);
        document.title = (peer ? peer.name : '交换') + ' · ' + LOGIC.exchangeTitle(exchange) + ' · 技遇';
        renderExchangeDetail(exchange);
      } else {
        document.title = '找不到这段交换 · 技遇';
        renderNotFound('这段交换好像已经结束，或者链接不完整。');
      }
    } else if (route.name === 'me') {
      document.title = '我的技能名片 · 技遇';
      renderProfile();
    } else if (route.name === 'notes') {
      document.title = '产品手记 · 技遇';
      renderNotesPage();
    } else {
      document.title = '找不到页面 · 技遇';
      renderNotFound('这个页面不存在，回到匹配广场看看谁刚好在等你。');
    }

    renderChrome();
    updateDocumentCounts();

    const scrollTarget = pendingScroll || opts.target;
    pendingScroll = null;
    if (scrollTarget) {
      window.requestAnimationFrame(function () {
        const node = document.getElementById(scrollTarget);
        if (node) {
          node.scrollIntoView({ behavior: opts.scroll === false ? 'auto' : 'smooth', block: 'start' });
        }
      });
    } else if (opts.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      app.focus({ preventScroll: true });
    }
  }

  function updateDocumentCounts() {
    renderHeader();
    renderMobileNav();
  }

  function goDiscover() {
    if (currentRoute().name === 'home') {
      const node = document.getElementById('discover');
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('#/', { target: 'discover' });
    }
  }

  function renderNotFound(message) {
    app.innerHTML =
      '<div class="wrap page page--notfound">' +
        '<p class="kicker">404 / NOT FOUND</p>' +
        '<h1 class="display display--lg">这里没有交换。</h1>' +
        '<p class="page-lede">' + escapeHtml(message) + '</p>' +
        '<div class="button-row">' +
          '<button type="button" class="btn btn--primary" data-action="go-home-discover">回到匹配广场' + icon('arrowRight') + '</button>' +
          '<a class="btn btn--ghost" href="#/notes">看看产品手记</a>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------------
   * Home
   * ------------------------------------------------------------------------- */

  function renderHome() {
    const matches = LOGIC.sortedMatches(state.me, DATA.peers);
    const swaps = matches.filter(function (item) { return item.match.mode === 'swap'; });
    const top = swaps[0] || null;
    const stats = LOGIC.matchingStats(state.me, DATA.peers);
    const teachLabels = labelsForTeach(state.me);
    const wantLabels = labelsForWants(state.me);

    app.innerHTML =
      '<div class="page page--home">' +
        '<section class="hero wrap">' +
          '<div class="hero-copy">' +
            '<p class="kicker"><span class="kicker__dot"></span>SKILL SWAP PLATFORM / 技能互换</p>' +
            '<h1 class="display display--hero">用你会的，<br /><em>换</em>你想学的。</h1>' +
            '<p class="hero-lede">你教我一小时吉他，我教你一小时摄影。没有课程包，没有预付费，只有一份把兴趣认真学完的小契约。</p>' +
            '<div class="button-row hero-actions">' +
              '<button type="button" class="btn btn--primary btn--lg" data-action="scroll-to" data-target="discover">找一个刚好互补的人' + icon('arrowRight') + '</button>' +
              '<button type="button" class="btn btn--ghost" data-action="scroll-to" data-target="how">先看看怎么换</button>' +
            '</div>' +
            '<p class="hero-footnote">不需要先成为老师。带上你会的，就够了。<button type="button" class="inline-link" data-action="open-edit-profile">换成我的技能 ↗</button></p>' +
            '<div class="hero-facts">' +
              '<div><span>01</span><p><strong>1 小时 = 1 小时</strong><small>不按市场价给技能分高低</small></p></div>' +
              '<div><span>02</span><p><strong>先互补，再匹配</strong><small>不做漫无目的的海投</small></p></div>' +
              '<div><span>03</span><p><strong>契约式交付</strong><small>把「学会」写清楚</small></p></div>' +
            '</div>' +
          '</div>' +
          '<div class="hero-visual">' +
            '<div class="hero-art">' +
              '<img src="assets/hero-swap.jpg" width="960" height="1280" alt="两个年轻人坐在桌边，一人拿着相机，一人抱着吉他，正在交换彼此擅长的技能。插画风格。" />' +
              '<span class="hero-art__caption">交换现场 / 杭州 · 插画示意</span>' +
            '</div>' +
            (top ?
              '<div class="hero-stamp" aria-label="当前最高匹配 ' + top.match.score + '%，与 ' + escapeHtml(top.peer.name) + '">' +
                '<span>TOP MATCH</span><strong>' + top.match.score + '<small>%</small></strong><em>与 ' + escapeHtml(top.peer.name) + ' · 双向</em>' +
              '</div>' : '') +
            '<article class="exchange-pass" aria-label="我的技能交换凭证">' +
              '<div class="pass-top"><span>SKILL SWAP PASS</span><span>NO. 0117</span></div>' +
              '<div class="pass-person">' +
                avatarMarkup(state.me, 'md') +
                '<div><h2>' + escapeHtml(state.me.name) + '</h2><p>' + escapeHtml(state.me.role) + ' · ' + escapeHtml(state.me.city) + '</p></div>' +
                '<span class="pass-verified">' + icon('verified') + '</span>' +
              '</div>' +
              '<div class="pass-divider"></div>' +
              '<div class="pass-skills">' +
                '<div><span>我能教</span><p>' + escapeHtml(teachLabels.slice(0, 3).join(' · ') || '还没填写') + '</p></div>' +
                '<div><span>我想学</span><p>' + escapeHtml(wantLabels.slice(0, 3).join(' · ') || '还没填写') + '</p></div>' +
              '</div>' +
              '<div class="pass-bottom">' +
                '<span>1 HOUR = 1 HOUR</span>' +
                '<button type="button" class="pass-edit" data-action="open-edit-profile">换一换 ' + icon('arrowUpRight') + '</button>' +
              '</div>' +
              '<div class="pass-barcode" aria-hidden="true"></div>' +
            '</article>' +
          '</div>' +
        '</section>' +

        '<div class="skill-ticker" aria-label="可以交换的技能类型">' +
          '<div class="ticker-track">' + tickerMarkup() + tickerMarkup() + '</div>' +
        '</div>' +

        '<section class="discover wrap" id="discover">' +
          '<header class="section-head">' +
            '<div>' +
              '<p class="kicker">01 / MATCHED FOR YOU</p>' +
              '<h2 class="display display--lg">刚好互补的人。</h2>' +
            '</div>' +
            '<p class="section-desc">不从「谁最火」开始，从你们能不能彼此教会一件事开始。匹配分只衡量这次相遇的可行性，不是人的排名。</p>' +
          '</header>' +
          '<div class="criteria-card">' +
            '<div class="criteria-copy">' +
              '<p class="mini-label">YOUR MATCH CONDITIONS / 你的匹配条件</p>' +
              '<div class="criteria-row"><span>能教</span><p>' + chipList(teachLabels, 'chip chip--quiet') + '</p></div>' +
              '<div class="criteria-row"><span>想学</span><p>' + chipList(wantLabels, 'chip chip--quiet') + '</p></div>' +
            '</div>' +
            '<div class="criteria-side">' +
              '<p><b>' + stats.swap + '</b> 个双向互补</p>' +
              '<p><b>' + (stats.teach + stats.learn) + '</b> 个时间币可能</p>' +
              '<button type="button" class="btn btn--small btn--ink" data-action="open-edit-profile">' + icon('edit') + '改名片</button>' +
            '</div>' +
          '</div>' +
          '<div class="filter-panel">' +
            '<div class="filter-search">' +
              icon('search') +
              '<input id="peer-search" type="search" placeholder="搜技能或名字，比如「吉他」" value="' + escapeHtml(ui.query) + '" autocomplete="off" aria-label="搜索技能或交换者" />' +
              '<kbd>/</kbd>' +
            '</div>' +
            '<div class="filter-selects">' +
              '<label class="select-wrap"><span class="sr-only">交换形式</span>' +
                '<select id="peer-format">' +
                  '<option value="all"' + (ui.format === 'all' ? ' selected' : '') + '>全部形式</option>' +
                  '<option value="online"' + (ui.format === 'online' ? ' selected' : '') + '>只看线上</option>' +
                  '<option value="offline"' + (ui.format === 'offline' ? ' selected' : '') + '>只看同城线下</option>' +
                '</select>' + icon('chevronDown') +
              '</label>' +
              '<label class="select-wrap"><span class="sr-only">排序方式</span>' +
                '<select id="peer-sort">' +
                  '<option value="match"' + (ui.sort === 'match' ? ' selected' : '') + '>匹配优先</option>' +
                  '<option value="active"' + (ui.sort === 'active' ? ' selected' : '') + '>最近活跃</option>' +
                  '<option value="swaps"' + (ui.sort === 'swaps' ? ' selected' : '') + '>交换最多</option>' +
                  '<option value="rating"' + (ui.sort === 'rating' ? ' selected' : '') + '>评价最高</option>' +
                '</select>' + icon('chevronDown') +
              '</label>' +
            '</div>' +
          '</div>' +
          '<div class="filter-bottom">' +
            '<div class="category-tabs" role="group" aria-label="按技能分类筛选">' + categoryTabs() + '</div>' +
            '<label class="check-chip"><input type="checkbox" id="only-double"' + (ui.onlyDouble ? ' checked' : '') + ' /><span>只看双向互换</span></label>' +
          '</div>' +
          '<div class="result-strip" aria-live="polite">' +
            '<p id="result-count"></p>' +
            '<span class="result-note">按你的「能教 / 想学」实时计算</span>' +
          '</div>' +
          '<div id="peer-grid" class="peer-grid"></div>' +
        '</section>' +

        renderHowSection() +
        renderContractSection() +
        renderSalonSection() +
        renderVoicesSection() +
        renderClosingSection() +
      '</div>';

    refreshDiscoveryGrid();
    restoreChatScroll();
  }

  function tickerMarkup() {
    const items = ['人像摄影', '指弹吉他', 'Python 入门', '视频剪辑', '咖啡拉花', '西班牙语', '手绘插画', '瑜伽', '版式设计', '英语口语'];
    return '<div class="ticker-item">' + items.map(function (label) {
      return '<span>' + label + '</span><i aria-hidden="true">' + icon('sparkle') + '</i>';
    }).join('') + '</div>';
  }

  function chipList(labels, className) {
    if (!labels.length) return '<span class="empty-inline">还没填写</span>';
    return labels.map(function (label) {
      return '<span class="' + className + '">' + escapeHtml(label) + '</span>';
    }).join('');
  }

  function categoryTabs() {
    return DATA.categories.map(function (category) {
      const active = ui.category === category.id;
      return '<button type="button" class="category-tab' + (active ? ' is-active' : '') + '" data-action="filter-category" data-category="' + category.id + '" aria-pressed="' + active + '">' +
        '<i style="--dot:' + category.color + '"></i>' + escapeHtml(category.label) +
      '</button>';
    }).join('');
  }

  function currentPeerList() {
    return LOGIC.discover(state.me, DATA.peers, ui);
  }

  function refreshDiscoveryGrid() {
    const grid = document.getElementById('peer-grid');
    if (!grid) return;
    const list = currentPeerList();
    const resultCount = document.getElementById('result-count');
    const filtersActive = ui.query || ui.category !== 'all' || ui.format !== 'all' || ui.onlyDouble;

    if (resultCount) {
      resultCount.innerHTML = '找到 <b>' + list.length + '</b> 位交换者' +
        (filtersActive ? ' <button type="button" class="inline-link" data-action="clear-filters">清除筛选</button>' : '');
    }

    if (!list.length) {
      grid.innerHTML = renderEmptyPeers(filtersActive);
      return;
    }

    let featuredUsed = false;
    grid.innerHTML = list.map(function (item) {
      let featured = false;
      if (!featuredUsed && item.match.mode === 'swap' && ui.sort === 'match' && !ui.query && ui.category === 'all' && ui.format === 'all') {
        featured = true;
        featuredUsed = true;
      }
      return peerCard(item, featured);
    }).join('');

    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(function (tab) {
      const active = tab.getAttribute('data-category') === ui.category;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
  }

  function renderEmptyPeers(filtersActive) {
    return '<div class="empty-state empty-state--wide">' +
      '<span class="empty-state__mark">' + icon('search') + '</span>' +
      '<h3>' + (filtersActive ? '这次筛选没有结果。' : '名单里暂时没有刚好互补的人。') + '</h3>' +
      '<p>' + (filtersActive ? '放宽一点条件，或者换回自己的技能名片。匹配本来就不该是无限滑动的列表。' : '把「我想学」再写具体一点，或者看看时间币能换到什么。') + '</p>' +
      '<div class="button-row">' +
        '<button type="button" class="btn btn--primary btn--small" data-action="open-edit-profile">改我的名片</button>' +
        (filtersActive ? '<button type="button" class="btn btn--ghost btn--small" data-action="clear-filters">清除筛选</button>' : '') +
      '</div>' +
    '</div>';
  }

  function peerCard(item, featured) {
    const peer = item.peer;
    const match = item.match;
    const existing = exchangeForPeer(peer.id);
    const stamp = match.mode === 'swap'
      ? '<span class="match-stamp match-stamp--card"><strong>' + match.score + '<small>%</small></strong><em>双向匹配</em></span>'
      : (match.mode === 'teach'
        ? '<span class="match-stamp match-stamp--coin"><strong>+1<small>h</small></strong><em>可教 / 存币</em></span>'
        : '<span class="match-stamp match-stamp--coin"><strong>−1<small>h</small></strong><em>可学 / 换币</em></span>');

    const reason = match.mode === 'swap'
      ? '你教 <b>' + escapeHtml(match.iTeachLabels[0]) + '</b>，TA 教你 <b>' + escapeHtml(match.theyTeachLabels[0]) + '</b>'
      : (match.mode === 'teach'
        ? 'TA 正在学 <b>' + escapeHtml(match.iTeachLabels[0]) + '</b>，你可以教；存下 1 小时时间币'
        : 'TA 能教 <b>' + escapeHtml(match.theyTeachLabels[0]) + '</b>；用 1 小时时间币兑换');

    const cta = existing
      ? (existing.status === 'active' ? '继续这段交换' : (existing.status === 'review' ? '去完成互评' : (existing.status === 'incoming' ? '去回应提案' : '查看已发出的提案')))
      : (match.mode === 'swap' ? '看看怎么换' : (match.mode === 'teach' ? '去教一小时' : '用时间币兑换'));

    const flag = existing
      ? '<span class="peer-flag peer-flag--' + statusMeta(existing.status).tone + '">' + statusMeta(existing.status).label + '</span>'
      : (featured ? '<span class="peer-flag peer-flag--best">' + icon('sparkle') + '最合拍</span>' : '');

    return '<article class="peer-card' + (featured ? ' is-featured' : '') + '" data-action="open-peer" data-peer-id="' + escapeHtml(peer.id) + '" tabindex="0" role="button" aria-label="查看 ' + escapeHtml(peer.name) + ' 的技能名片">' +
      '<div class="peer-card__top">' +
        avatarMarkup(peer, 'md') +
        '<div class="peer-card__identity">' +
          '<h3>' + escapeHtml(peer.name) + '<span class="active-dot" title="' + escapeHtml(peer.active) + '"></span></h3>' +
          '<p>' + escapeHtml(peer.role) + ' · ' + escapeHtml(peer.city) + '</p>' +
        '</div>' +
        stamp +
      '</div>' +
      '<div class="peer-card__subline">' +
        '<span class="verified-line">' + icon('verified') + escapeHtml(peer.verified[0] || '实名认证') + '</span>' +
        '<span class="meta-dot"></span>' +
        '<span>' + escapeHtml(peer.active) + '</span>' +
        flag +
      '</div>' +
      '<div class="peer-card__skills">' +
        '<div><span>能教</span><p>' + escapeHtml(labelsForTeach(peer).join(' · ')) + '</p></div>' +
        '<div><span>想学</span><p>' + escapeHtml(labelsForWants(peer).join(' · ')) + '</p></div>' +
      '</div>' +
      '<p class="peer-card__reason">' + reason + '</p>' +
      '<div class="peer-card__meta">' +
        '<span class="rating-inline">' + icon('star') + peer.rating.toFixed(1) + '</span>' +
        '<span>已完成 ' + peer.swaps + ' 次</span>' +
        '<span>' + escapeHtml(formatLine(peer) || '线上') + '</span>' +
      '</div>' +
      '<div class="peer-card__foot">' +
        '<span class="peer-card__note">' + escapeHtml(peer.response) + '</span>' +
        '<span class="card-cta">' + cta + icon('arrowUpRight') + '</span>' +
      '</div>' +
    '</article>';
  }

  function renderHowSection() {
    const steps = [
      { num: '01', title: '写一张技能名片', body: '别只写「会一点」。写清你能带 TA 做到什么，以及你真正想学什么。', note: '可教 1–5 项 / 想学 1–5 项' },
      { num: '02', title: '看谁刚好互补', body: '匹配先看两张名片的交集：你教 TA、TA 教你，缺一边都不算合拍。', note: '双向互补 + 时间 + 信用' },
      { num: '03', title: '签一份交换契约', body: '课时、目标、验收、改期和退出先写清楚，不靠「回头再说」。', note: '默认 4 次 × 1.5 小时' },
      { num: '04', title: '上完课，互相盖章', body: '每节留一个作业和下次时间；完成一节记一节，结束后双向评价。', note: '下一次时间当场约定' }
    ];
    return '<section class="how-section" id="how">' +
      '<div class="wrap">' +
        '<header class="section-head">' +
          '<div><p class="kicker">02 / HOW IT WORKS</p><h2 class="display display--lg">换，不用等到<br class="desktop-only" />有钱有闲。</h2></div>' +
          '<p class="section-desc">你不需要先准备好一整套课程。只需要诚实地写下「我能带你在一个晚上做到什么」，就够了。</p>' +
        '</header>' +
        '<ol class="steps-grid">' + steps.map(function (step) {
          return '<li class="step-card">' +
            '<span class="step-num">' + step.num + '</span>' +
            '<h3>' + step.title + '</h3>' +
            '<p>' + step.body + '</p>' +
            '<span class="step-note">' + icon('ticket') + step.note + '</span>' +
          '</li>';
        }).join('') + '</ol>' +
        '<div class="how-footnote"><span>' + icon('leaf') + '</span><p>平台不向双向交换抽佣。你的技能不是库存，时间也不是价格战里的筹码。</p></div>' +
      '</div>' +
    '</section>';
  }

  function renderContractSection() {
    return '<section class="contract-band" id="contract">' +
      '<div class="wrap contract-layout">' +
        '<div class="contract-copy">' +
          '<p class="kicker kicker--light">03 / THE AGREEMENT</p>' +
          '<h2 class="display display--lg">别只约一杯咖啡，<br />约一份能学完的契约。</h2>' +
          '<p>技能交换最常失败的地方，不是谁教得不好，而是双方对「换什么、做到什么程度、什么时候结束」没有共识。</p>' +
          '<ul class="check-list check-list--light">' +
            '<li><span>' + icon('check') + '</span><b>把目标写成作品。</b>不是「学一点吉他」，而是「完整弹唱一首歌」。</li>' +
            '<li><span>' + icon('check') + '</span><b>把节奏写成约定。</b>几次、多长、在哪、什么时候开始。</li>' +
            '<li><span>' + icon('check') + '</span><b>把退出写进契约。</b>允许体面结束，反而更容易开始。</li>' +
          '</ul>' +
          '<div class="contract-quote"><span>“</span><p>好的契约不是不信任，是把彼此的认真保护起来。</p></div>' +
        '</div>' +
        '<article class="contract-paper" aria-label="交换契约示例">' +
          '<div class="contract-paper__head"><span>EXCHANGE AGREEMENT</span><span>NO. 0117</span></div>' +
          '<div class="contract-paper__parties">' +
            '<div>' + avatarMarkup(state.me, 'sm') + '<span><b>' + escapeHtml(state.me.name) + '</b><small>发起人</small></span></div>' +
            '<span class="contract-swap">' + icon('swap') + '</span>' +
            '<div>' + avatarMarkup(findPeer('azhe'), 'sm') + '<span><b>阿哲</b><small>交换伙伴</small></span></div>' +
          '</div>' +
          '<p class="contract-paper__title">人像摄影 <span>⇄</span> 指弹吉他</p>' +
          '<div class="contract-paper__grid">' +
            '<div><span>课时</span><b>4 次</b></div>' +
            '<div><span>单节</span><b>1.5 小时</b></div>' +
            '<div><span>形式</span><b>线上</b></div>' +
            '<div><span>周期</span><b>10.26–11.23</b></div>' +
          '</div>' +
          '<div class="contract-paper__goals">' +
            '<div><span>我要学会</span><p>完整弹唱《晴天》的指弹版本。</p></div>' +
            '<div><span>TA 要学会</span><p>独立完成一组窗光人像并完成调色。</p></div>' +
          '</div>' +
          '<div class="contract-paper__acceptance"><span>验收方式</span><p>各自提交一份可展示的成果，并完成一次 10 分钟复盘。</p></div>' +
          '<div class="contract-paper__signs"><span>小满 <i></i></span><span>阿哲 <i></i></span><em>已签署</em></div>' +
          '<p class="contract-paper__fine">平台提供默认契约模板；改期需提前 24 小时；两次无故爽约暂停匹配。</p>' +
        '</article>' +
      '</div>' +
    '</section>';
  }

  function renderSalonSection() {
    return '<section class="salon-section">' +
      '<div class="wrap salon-layout">' +
        '<figure class="salon-figure">' +
          '<div class="salon-image-wrap">' +
            '<img src="assets/salon-swap.jpg" width="1200" height="800" loading="lazy" alt="俯视视角下，几双手围坐在木桌旁交换相机、咖啡、笔记本和票根。插画风格。" />' +
            '<div class="salon-ticket"><span>NEXT GATHER</span><strong>十一月 · 杭州</strong><small>交换局 / 筹备中</small></div>' +
          '</div>' +
          '<figcaption><span>04 / GATHER</span><p>把一对一的交换，放进一张桌子。</p></figcaption>' +
        '</figure>' +
        '<div class="salon-copy">' +
          '<p class="kicker">ONE TO ONE, THEN ONE TO MANY</p>' +
          '<h2 class="display display--md">一个人换不到，<br />就一群人一起换。</h2>' +
          '<p class="salon-lede">每两周一次的主题交换局，把想学摄影、咖啡、尤克里里和版式的人放到同一张桌子上。带一项能教的技能来，带走一个想学的开始。</p>' +
          '<div class="salon-points">' +
            '<div><span>01</span><p><b>20 分钟</b>交换名片，讲清你最近在学什么</p></div>' +
            '<div><span>02</span><p><b>两轮</b>十五分钟迷你教学，现场就能学到第一件事</p></div>' +
            '<div><span>03</span><p><b>散场前</b>把下一次一对一的交换约出来</p></div>' +
          '</div>' +
          '<div class="salon-actions">' +
            '<button type="button" class="btn btn--outline" data-action="open-salon">交换局怎么玩' + icon('arrowRight') + '</button>' +
            '<span>概念中的社区玩法 · 不开放报名</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderVoicesSection() {
    return '<section class="voices-section">' +
      '<div class="wrap">' +
        '<header class="section-head section-head--voices">' +
          '<div><p class="kicker">05 / AFTER THE SWAP</p><h2 class="display display--lg">交换之后，<br />留下的是作品和朋友。</h2></div>' +
          '<span class="demo-label">演示评价 · 人物为虚构</span>' +
        '</header>' +
        '<div class="voice-grid">' + DATA.stories.map(function (story, index) {
          return '<blockquote class="voice-card voice-card--' + story.tone + '" style="--rot:' + ((index - 1) * 0.8) + 'deg">' +
            '<span class="voice-mark">' + icon('quote') + '</span>' +
            '<p>' + escapeHtml(story.quote) + '</p>' +
            '<footer><div><strong>' + escapeHtml(story.name) + '</strong><span>' + escapeHtml(story.meta) + '</span></div>' + reviewStars(5, 'sm') + '</footer>' +
          '</blockquote>';
        }).join('') + '</div>' +
      '</div>' +
    '</section>';
  }

  function renderClosingSection() {
    return '<section class="closing-section">' +
      '<div class="closing-inner wrap">' +
        '<div>' +
          '<p class="kicker">READY WHEN YOU ARE</p>' +
          '<h2 class="display display--lg">下一个想学的，<br />不用再等「有空」。</h2>' +
          '<p>先把你会的那一小时放上来。合适的人，可能也在等这一小时。</p>' +
          '<div class="button-row">' +
            '<button type="button" class="btn btn--ink btn--lg" data-action="open-edit-profile">整理我的技能名片' + icon('arrowRight') + '</button>' +
            '<a class="btn btn--link btn--lg" href="#/notes">读产品手记</a>' +
          '</div>' +
        '</div>' +
        '<div class="closing-stamp" aria-hidden="true">' +
          '<span>OPEN SWAP</span><strong>1<span>h</span> = 1<span>h</span></strong><em>学习不必单向</em>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  /* ---------------------------------------------------------------------------
   * My profile
   * ------------------------------------------------------------------------- */

  function categoryTag(skillId) {
    const category = LOGIC.category(LOGIC.skillCategory(skillId));
    return '<span class="skill-cat" style="--cat:' + category.color + ';--cat-bg:' + category.tint + '">' +
      escapeHtml(category.label) + '</span>';
  }

  function renderProfile() {
    const me = state.me;
    const teachLabels = labelsForTeach(me);
    const wantLabels = labelsForWants(me);
    const done = state.exchanges.filter(function (exchange) {
      return exchange.status === 'completed' || exchange.status === 'review';
    }).length;

    app.innerHTML =
      '<div class="wrap page page--profile">' +
        '<header class="page-head page-head--split">' +
          '<div>' +
            '<p class="kicker">02 / MY SKILL CARD</p>' +
            '<h1 class="display display--lg">一张能换到课的<br class="desktop-only" />名片。</h1>' +
            '<p class="page-lede">它不罗列履历，只回答两个问题：你能带别人做到什么，以及你最近想学什么。</p>' +
          '</div>' +
          '<div class="page-head__actions">' +
            '<button type="button" class="btn btn--primary" data-action="open-edit-profile">' + icon('edit') + '编辑名片</button>' +
            '<button type="button" class="btn btn--ghost" data-action="nav-discover">去看匹配' + icon('arrowRight') + '</button>' +
          '</div>' +
        '</header>' +

        '<div class="profile-grid">' +
          '<article class="profile-card">' +
            '<div class="profile-cover">' +
              '<span class="profile-cover__label">MY SKILL PASS / NO. 0117</span>' +
              '<div class="profile-cover__shapes" aria-hidden="true"><i></i><i></i><i></i></div>' +
              '<span class="profile-cover__stamp">' + icon('verified') + '实名与作品已验证</span>' +
            '</div>' +
            '<div class="profile-main">' +
              '<div class="profile-identity">' +
                avatarMarkup(me, 'xl') +
                '<div class="profile-identity__copy">' +
                  '<p class="mini-label">A SWAP CARD BY</p>' +
                  '<h2>' + escapeHtml(me.name) + '</h2>' +
                  '<p>' + escapeHtml(me.role) + ' · 坐标 ' + escapeHtml(me.city) + '</p>' +
                  '<div class="verified-row">' + me.verified.map(function (item) {
                    return '<span>' + icon('verified') + escapeHtml(item) + '</span>';
                  }).join('') + '</div>' +
                '</div>' +
                '<span class="profile-seal" aria-hidden="true">可交换</span>' +
              '</div>' +
              '<p class="profile-bio">' + escapeHtml(me.bio) + '</p>' +
              '<div class="profile-meta-strip">' +
                '<div><span>回复</span><p>' + escapeHtml(me.response) + '</p></div>' +
                '<div><span>可用</span><p>' + escapeHtml(me.slots.join(' / ')) + '</p></div>' +
                '<div><span>形式</span><p>' + escapeHtml(me.formats.join(' / ')) + '</p></div>' +
                '<div><span>入伙</span><p>' + escapeHtml(me.joined) + '</p></div>' +
              '</div>' +

              '<section class="profile-section">' +
                '<div class="profile-section__head">' +
                  '<h3><span>我能教</span><small>WHAT I CAN SHARE</small></h3>' +
                  '<span class="section-count">' + me.teaches.length + ' 项技能</span>' +
                '</div>' +
                '<div class="teach-list">' + me.teaches.map(function (item, index) {
                  return '<div class="teach-row">' +
                    '<span class="teach-index">0' + (index + 1) + '</span>' +
                    '<div class="teach-row__body">' +
                      '<div class="teach-row__title"><h4>' + escapeHtml(LOGIC.skillLabel(item.skill)) + '</h4>' + categoryTag(item.skill) + '</div>' +
                      '<p>可以带你到：' + escapeHtml(item.outcome) + '</p>' +
                    '</div>' +
                  '</div>';
                }).join('') + '</div>' +
              '</section>' +

              '<section class="profile-section profile-section--wants">' +
                '<div class="profile-section__head">' +
                  '<h3><span>我想学</span><small>WHAT I AM CURIOUS ABOUT</small></h3>' +
                  '<span class="section-count">' + me.wants.length + ' 个目标</span>' +
                '</div>' +
                '<div class="want-list">' + me.wants.map(function (item, index) {
                  return '<div class="want-row">' +
                    '<span class="want-index">0' + (index + 1) + '</span>' +
                    '<div><h4>' + escapeHtml(LOGIC.skillLabel(item.skill)) + '</h4><p>' + escapeHtml(item.note) + '</p></div>' +
                    categoryTag(item.skill) +
                  '</div>';
                }).join('') + '</div>' +
              '</section>' +

              '<p class="profile-fineprint">' + icon('ticket') + '这张名片会出现在你发出的每一份提案里。修改「能教 / 想学」后，广场上的匹配会即时重算。</p>' +
            '</div>' +
          '</article>' +

          '<aside class="profile-aside">' +
            '<section class="aside-card aside-card--stats">' +
              '<p class="mini-label">EXCHANGE CREDIT / 交换信用</p>' +
              '<div class="big-rating"><strong>' + me.rating.toFixed(1) + '</strong><span>' + reviewStars(me.rating) + '<em>' + done + ' 次交换 · ' + (me.rating >= 4.8 ? '好评如常' : '继续积累') + '</em></span></div>' +
              '<div class="stat-pairs">' +
                '<div><span>完成交换</span><b>' + me.swaps + ' 次</b></div>' +
                '<div><span>守约记录</span><b>100%</b></div>' +
                '<div><span>收到评价</span><b>' + me.receivedReviews.length + ' 条</b></div>' +
                '<div><span>时间币</span><b>' + formatCoins(me.coins) + ' h</b></div>' +
              '</div>' +
              '<button type="button" class="text-link" data-action="open-timecoin">时间币怎么用 ' + icon('arrowUpRight') + '</button>' +
            '</section>' +

            '<section class="aside-card aside-card--availability">' +
              '<p class="mini-label">OPEN HOURS / 可约时段</p>' +
              '<h3>把时间先留给<br />值得学的事。</h3>' +
              '<div class="slot-row">' + me.slots.map(function (slot) {
                return '<span class="chip">' + escapeHtml(slot) + '</span>';
              }).join('') + '</div>' +
              '<p>交换默认每次 1–2 小时。具体时间在契约里约定，不靠「有空再说」。</p>' +
              '<button type="button" class="text-link" data-action="open-edit-profile">调整可约时段 ' + icon('arrowUpRight') + '</button>' +
            '</section>' +

            '<section class="aside-card aside-card--reviews">' +
              '<div class="aside-card__head"><p class="mini-label">KIND WORDS / 收到的评价</p><span class="demo-label">演示评价</span></div>' +
              '<div class="review-list">' + me.receivedReviews.map(function (review) {
                return '<article class="mini-review">' +
                  '<div class="mini-review__top"><div><strong>' + escapeHtml(review.by) + '</strong><span>' + escapeHtml(review.role) + '</span></div>' + reviewStars(review.stars, 'xs') + '</div>' +
                  '<p>' + escapeHtml(review.text) + '</p>' +
                '</article>';
              }).join('') + '</div>' +
            '</section>' +

            '<p class="aside-disclaimer">这张名片与操作仅保存在你的浏览器。人物与评价为虚构的演示内容。</p>' +
          '</aside>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------------
   * Workbench
   * ------------------------------------------------------------------------- */

  function renderExchanges(tab) {
    const groups = LOGIC.exchangeGroups(state.exchanges);
    const allowed = ['all', 'confirm', 'active', 'done'];
    const activeTab = allowed.indexOf(tab) === -1 ? 'all' : tab;
    const list = groups[activeTab] || [];
    const received = state.exchanges.filter(function (exchange) { return exchange.status === 'incoming'; }).length;
    const reviews = state.exchanges.filter(function (exchange) { return exchange.status === 'review'; }).length;

    app.innerHTML =
      '<div class="wrap page page--workbench">' +
        '<header class="page-head page-head--split">' +
          '<div>' +
            '<p class="kicker">02 / WORKBENCH</p>' +
            '<h1 class="display display--lg">把交换，<br class="desktop-only" />进行到底。</h1>' +
            '<p class="page-lede">工作台不展示聊天总数，只提醒下一件要做的事：接受、赴约、打卡、互评。' +
              (received || reviews ? '你有 <b>' + (received + reviews) + '</b> 件待处理的小事。' : '现在没有待处理的事项。') +
            '</p>' +
          '</div>' +
          '<div class="page-head__actions">' +
            '<button type="button" class="btn btn--primary" data-action="nav-discover">找一段新交换' + icon('arrowRight') + '</button>' +
            '<button type="button" class="btn btn--ghost" data-action="open-edit-profile">改名片</button>' +
          '</div>' +
        '</header>' +

        '<div class="workbench-grid">' +
          '<div class="workbench-main">' +
            '<div class="exchange-tabs" role="tablist" aria-label="交换状态筛选">' + exchangeTabs(activeTab, groups) + '</div>' +
            '<div class="exchange-list" role="tabpanel" aria-label="交换列表">' +
              (list.length ? list.map(exchangeListCard).join('') : renderEmptyExchanges(activeTab)) +
            '</div>' +
          '</div>' +
          '<aside class="workbench-aside">' +
            '<section class="coin-card">' +
              '<div class="coin-card__top"><span class="mini-label">TIME BANK / 时间银行</span><span class="coin-stamp">' + icon('coin') + '</span></div>' +
              '<p class="coin-balance">' + formatCoins(state.me.coins) + '<span>h</span></p>' +
              '<p class="coin-label">可支配时间币</p>' +
              '<div class="coin-rule"><span>+1h</span><p>教一小时，存入</p><span>−1h</span><p>学一小时，支出</p></div>' +
              '<p class="coin-note">没有刚好互补的人时，先用你会的一小时，换将来想学的任何一小时。不可购买、提现或转让。</p>' +
              '<button type="button" class="text-link" data-action="open-timecoin">查看时间币规则 ' + icon('arrowUpRight') + '</button>' +
            '</section>' +
            '<section class="aside-card aside-card--trust">' +
              '<div class="aside-card__head"><p class="mini-label">CREDIT / 交换信用</p><span class="seal-mini">' + icon('shield') + '</span></div>' +
              '<p class="trust-number">' + state.me.rating.toFixed(1) + '<span>/ 5</span></p>' +
              '<div class="trust-lines">' +
                '<div><span>已完成交换</span><b>' + state.me.swaps + ' 次</b></div>' +
                '<div><span>守约印章</span><b>' + (state.me.verified.indexOf('守约印章') !== -1 ? '已获得' : '未获得') + '</b></div>' +
                '<div><span>双向互评率</span><b>100%</b></div>' +
              '</div>' +
              '<p class="aside-fine">「守约印章」来自每一次按时赴约，不来自付费。</p>' +
            '</section>' +
            '<section class="safety-note">' +
              '<span>' + icon('lock') + '</span>' +
              '<div><strong>线下见面，安全优先</strong><p>首次建议在咖啡馆或工作室等公共空间；平台内保留完整沟通记录，可随时举报或拉黑。</p></div>' +
            '</section>' +
          '</aside>' +
        '</div>' +
      '</div>';
  }

  function exchangeTabs(active, groups) {
    const tabs = [
      { id: 'all', label: '全部', count: groups.all.length },
      { id: 'confirm', label: '待确认', count: groups.confirm.length },
      { id: 'active', label: '进行中', count: groups.active.length },
      { id: 'done', label: '已完成', count: groups.done.length }
    ];
    return tabs.map(function (tab) {
      return '<a href="#/exchanges/' + tab.id + '" role="tab" aria-selected="' + (active === tab.id) + '" class="exchange-tab' + (active === tab.id ? ' is-active' : '') + '">' +
        tab.label + '<span>' + tab.count + '</span>' +
      '</a>';
    }).join('');
  }

  function exchangeListCard(exchange) {
    const peer = findPeer(exchange.peerId);
    if (!peer) return '';
    const meta = statusMeta(exchange.status);
    const prog = progress(exchange);
    const next = LOGIC.nextSession(exchange);
    const isPending = exchange.status === 'incoming' || exchange.status === 'pending';
    const title = LOGIC.exchangeTitle(exchange);
    const peerMsg = (exchange.messages || []).filter(function (message) { return message.from !== 'system'; }).slice(-1)[0];

    let detailLine = '';
    if (exchange.status === 'incoming') {
      detailLine = '<p class="exchange-quote">“' + escapeHtml(peerMsg ? peerMsg.text : '想和你交换一项技能。') + '”</p>';
    } else if (exchange.status === 'pending') {
      detailLine = '<p class="exchange-quote exchange-quote--mine">提案已送达。对方通常在自己的回复时间内处理，等待也是一种礼貌。</p>';
    } else if (exchange.status === 'active') {
      detailLine = '<p class="exchange-next">' + icon('calendar') + '下一节 · <b>' + escapeHtml(next ? next.date + ' · ' + next.topics : '等你们约定') + '</b></p>';
    } else if (exchange.status === 'review') {
      detailLine = '<p class="exchange-next exchange-next--review">' + icon('starOutline') + '所有课程已完成，<b>等待你的评价</b>。给对方盖一个真实的章。</p>';
    } else if (exchange.status === 'completed') {
      detailLine = '<p class="exchange-next exchange-next--done">' + icon('check') + '交换已完成' + (exchange.completedAt ? ' · ' + escapeHtml(exchange.completedAt.replace(/-/g, '.')) : '') + '</p>';
    }

    const action = exchange.status === 'incoming' ? '回应提案'
      : exchange.status === 'pending' ? '查看提案'
      : exchange.status === 'active' ? '进入工作台'
      : exchange.status === 'review' ? '去互评'
      : '查看记录';

    return '<a class="exchange-card exchange-card--' + meta.tone + '" href="#/exchange/' + escapeHtml(exchange.id) + '">' +
      '<div class="exchange-card__head">' +
        statusPill(exchange.status) +
        '<span class="exchange-card__num">' + contractNumber(exchange) + '</span>' +
        '<span class="exchange-card__date">' + escapeHtml(exchange.createdAt ? exchange.createdAt.replace(/-/g, '.') : '') + '</span>' +
      '</div>' +
      '<div class="exchange-card__body">' +
        '<div class="exchange-card__title-row">' +
          '<h2><span>' + escapeHtml(skillLabel(exchange.mySkill)) + '</span><em>⇄</em><span>' + escapeHtml(skillLabel(exchange.theirSkill)) + '</span></h2>' +
          '<div class="exchange-peer">' + avatarMarkup(peer, 'xs') + '<span>与 <b>' + escapeHtml(peer.name) + '</b> 的交换</span></div>' +
        '</div>' +
        '<div class="exchange-card__meta">' +
          '<span>' + exchange.sessionsTotal + ' 次 × ' + exchange.sessionMinutes + ' 分钟</span><i></i>' +
          '<span>' + escapeHtml(exchange.format) + '</span><i></i>' +
          '<span>' + escapeHtml(exchange.window) + '</span>' +
        '</div>' +
        detailLine +
        (!isPending ? '<div class="mini-progress"><span class="mini-progress__bar"><i style="width:' + prog.percent + '%"></i></span><span>' + prog.done + ' / ' + prog.total + ' 节</span></div>' : '') +
      '</div>' +
      '<div class="exchange-card__foot">' +
        '<span class="exchange-card__next">' + exchangeGoalSnippet(exchange) + '</span>' +
        '<span class="card-cta">' + action + icon('arrowUpRight') + '</span>' +
      '</div>' +
    '</a>';
  }

  function exchangeGoalSnippet(exchange) {
    if (exchange.mode === 'swap') return '双方各教一项 · 1 小时 = 1 小时';
    return exchange.mode === 'teach' ? '我教 TA / 收获时间币' : 'TA 教我 / 支付时间币';
  }

  function renderEmptyExchanges(tab) {
    const messages = {
      all: '你的交换台还很安静。先去找一个刚好互补的人，发出第一份提案。',
      confirm: '没有等待确认的提案。发出去的每一份提案，接受与否都会留下回应。',
      active: '暂时没有进行中的交换。一次只推进一段，也是一种认真。',
      done: '还没有完成记录。完成第一节，就会在这里留下第一枚印章。'
    };
    return '<div class="empty-state">' +
      '<span class="empty-state__mark">' + icon('ticket') + '</span>' +
      '<h3>这里暂时没有交换。</h3>' +
      '<p>' + messages[tab] + '</p>' +
      '<button type="button" class="btn btn--primary btn--small" data-action="nav-discover">去匹配广场' + icon('arrowRight') + '</button>' +
    '</div>';
  }

  /* ---------------------------------------------------------------------------
   * Exchange detail
   * ------------------------------------------------------------------------- */

  function renderExchangeDetail(exchange) {
    const peer = findPeer(exchange.peerId);
    if (!peer) {
      renderNotFound('与这段交换相关的人已经离开。');
      return;
    }

    const match = LOGIC.computeMatch(state.me, peer);
    const prog = progress(exchange);
    const next = LOGIC.nextSession(exchange);
    const isLocked = exchange.status === 'incoming' || exchange.status === 'pending';
    const canChat = !isLocked;

    app.innerHTML =
      '<div class="wrap page page--exchange">' +
        '<a class="back-link" href="#/exchanges">' + icon('arrowLeft') + '返回交换工作台</a>' +
        '<header class="exchange-head">' +
          '<div>' +
            '<div class="exchange-head__eyebrow">' +
              statusPill(exchange.status) +
              '<span class="exchange-no">契约 ' + contractNumber(exchange) + '</span>' +
              '<span class="demo-label">演示交换</span>' +
            '</div>' +
            '<h1 class="display display--md">' +
              (exchange.mode === 'swap'
                ? '<span>' + escapeHtml(skillLabel(exchange.mySkill)) + '</span><em>⇄</em><span>' + escapeHtml(skillLabel(exchange.theirSkill)) + '</span>'
                : (exchange.mode === 'teach'
                  ? '<span>' + escapeHtml(skillLabel(exchange.mySkill)) + '</span><em>→</em><span>时间币</span>'
                  : '<span>时间币</span><em>→</em><span>' + escapeHtml(skillLabel(exchange.theirSkill)) + '</span>')) +
            '</h1>' +
            '<p class="exchange-head__meta">与 <b>' + escapeHtml(peer.name) + '</b> · ' + exchange.sessionsTotal + ' 次 × ' + exchange.sessionMinutes + ' 分钟 · ' + escapeHtml(exchange.format) + '</p>' +
          '</div>' +
          '<div class="exchange-head__side">' +
            '<span class="exchange-progress-label">完成进度</span>' +
            '<strong>' + prog.done + '<span> / ' + prog.total + ' 节</span></strong>' +
            '<span class="mini-progress mini-progress--head"><i style="width:' + prog.percent + '%"></i></span>' +
          '</div>' +
        '</header>' +

        statusBanner(exchange, peer) +

        '<div class="detail-grid">' +
          '<div class="detail-main">' +
            '<section class="panel party-panel">' +
              '<div class="party-main">' +
                avatarMarkup(peer, 'lg') +
                '<div>' +
                  '<p class="mini-label">SWAP PARTNER / 交换伙伴</p>' +
                  '<h2>' + escapeHtml(peer.name) + '</h2>' +
                  '<p>' + escapeHtml(peer.role) + ' · ' + escapeHtml(peer.city) + '</p>' +
                  '<div class="party-meta">' +
                    '<span>' + icon('star') + peer.rating.toFixed(1) + '</span>' +
                    '<span>已完成 ' + peer.swaps + ' 次交换</span>' +
                    '<span>' + icon('shield') + escapeHtml(peer.verified[0]) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="party-actions">' +
                '<button type="button" class="btn btn--ghost btn--small" data-action="open-peer" data-peer-id="' + escapeHtml(peer.id) + '">查看完整名片</button>' +
                '<span class="party-response">' + escapeHtml(peer.response) + '</span>' +
              '</div>' +
            '</section>' +

            '<section class="panel contract-overview">' +
              '<div class="panel-head">' +
                '<div><p class="kicker">THE CONTRACT</p><h2 class="panel-title">这段交换，具体换什么</h2></div>' +
                '<span class="contract-no">NO. ' + contractNumber(exchange).replace('JY · ', '') + '</span>' +
              '</div>' +
              '<div class="facts-grid">' +
                '<div><span>交换方式</span><b>' + exchangeModeLabel(exchange) + '</b></div>' +
                '<div><span>课时</span><b>' + exchange.sessionsTotal + ' 次 · 共 ' + formatNumber(totalHours(exchange)) + ' 小时</b></div>' +
                '<div><span>单节时长</span><b>' + exchange.sessionMinutes + ' 分钟</b></div>' +
                '<div><span>形式</span><b>' + escapeHtml(exchange.format) + '</b></div>' +
                '<div><span>周期</span><b>' + escapeHtml(exchange.window) + '</b></div>' +
                '<div><span>契约状态</span><b>' + statusTextForExchange(exchange) + '</b></div>' +
              '</div>' +
              (exchange.coinHours ? '<div class="coin-inline">' + icon('coin') + '<p><b>' + escapeHtml(exchangeCoinText(exchange)) + '</b><span>待对方接受后结算 · 时间币不可购买或提现</span></p></div>' : '') +
            '</section>' +

            renderGoalsPanel(exchange, peer) +

            (isLocked ? '' :
              '<section class="panel session-panel">' +
                '<div class="panel-head">' +
                  '<div><p class="kicker">SESSIONS</p><h2 class="panel-title">一节一节，把它学完</h2></div>' +
                  '<span class="section-count">' + prog.done + ' / ' + prog.total + ' 已完成</span>' +
                '</div>' +
                '<div class="session-progress"><span><i style="width:' + prog.percent + '%"></i></span><p>' + prog.percent + '%</p></div>' +
                '<div class="session-list">' + (exchange.sessions || []).map(function (session, index) {
                  const isDone = !!session.done;
                  const isCurrent = !isDone && next && next.label === session.label;
                  return '<div class="session-row' + (isDone ? ' is-done' : '') + (isCurrent ? ' is-current' : '') + '">' +
                    '<span class="session-marker">' + (isDone ? icon('check') : String(index + 1).padStart(2, '0')) + '</span>' +
                    '<div class="session-body">' +
                      '<div class="session-title"><span>' + escapeHtml(session.label) + '</span><h3>' + escapeHtml(session.topics) + '</h3></div>' +
                      '<p>' + icon('calendar') + escapeHtml(session.date || '待约定') + (session.note ? ' · ' + escapeHtml(session.note) : '') + '</p>' +
                    '</div>' +
                    '<span class="session-state">' +
                      (isDone ? '已完成' : (isCurrent && exchange.status === 'active' ?
                        '<button type="button" class="btn btn--small btn--ink" data-action="open-session" data-exchange-id="' + escapeHtml(exchange.id) + '">记录本节</button>' :
                        '待开始')) +
                    '</span>' +
                  '</div>';
                }).join('') + '</div>' +
                (exchange.status === 'active' && next ?
                  '<div class="session-footnote">' + icon('clock') + '<p>下一次：<b>' + escapeHtml(next.date) + '</b> · ' + escapeHtml(next.topics) + '。完成本节后，记得当场约下一次。</p></div>' : '') +
              '</section>'
            ) +

            (exchange.status === 'review' ? renderReviewPrompt(exchange, peer) : '') +
            (exchange.status === 'completed' && exchange.reviewByMe ? renderMyReview(exchange) : '') +
            (exchange.status === 'pending' ? renderPendingPanel(exchange, peer) : '') +
          '</div>' +

          '<aside class="detail-aside">' +
            renderChatPanel(exchange, peer, canChat) +
            '<section class="safe-card">' +
              '<span>' + icon('shield') + '</span>' +
              '<div><strong>边界先于热情</strong><p>只通过平台约定时间和地点；首次线下见面建议在公共场所。你可以随时结束一段不再合适的交换。</p></div>' +
            '</section>' +
          '</aside>' +
        '</div>' +
      '</div>';

    restoreChatScroll();
  }

  function exchangeModeLabel(exchange) {
    if (exchange.mode === 'swap') return '双向互换 · 不扣时间币';
    if (exchange.mode === 'teach') return '我教 TA · 对方支付时间币';
    return 'TA 教我 · 我支付时间币';
  }

  function statusBanner(exchange, peer) {
    if (exchange.status === 'incoming') {
      const firstMessage = (exchange.messages || []).filter(function (message) { return message.from === 'them'; }).slice(-1)[0];
      return '<section class="decision-banner">' +
        '<div class="decision-banner__mark">' + icon('sparkle') + '</div>' +
        '<div class="decision-banner__copy">' +
          '<p class="kicker">A CONTRACT IS WAITING</p>' +
          '<h2>' + escapeHtml(peer.name) + '想用「' + escapeHtml(skillLabel(exchange.theirSkill)) + '」换你的「' + escapeHtml(skillLabel(exchange.mySkill)) + '」。</h2>' +
          '<p>' + (firstMessage ? '“' + escapeHtml(firstMessage.text) + '”' : 'TA 发来了一份交换提案。') + '</p>' +
        '</div>' +
        '<div class="decision-banner__actions">' +
          '<button type="button" class="btn btn--primary" data-action="accept-proposal" data-exchange-id="' + escapeHtml(exchange.id) + '">阅读并接受</button>' +
          '<button type="button" class="btn btn--ghost btn--small" data-action="decline-proposal" data-exchange-id="' + escapeHtml(exchange.id) + '">婉拒</button>' +
        '</div>' +
      '</section>';
    }
    if (exchange.status === 'review') {
      return '<section class="status-banner status-banner--gold">' +
        '<span class="status-banner__mark">' + icon('starOutline') + '</span>' +
        '<div><strong>所有课程已经完成。</strong><p>给 ' + escapeHtml(peer.name) + ' 和这段交换各一个真实的评价，信用会留在下一次相遇里。</p></div>' +
        '<button type="button" class="btn btn--ink btn--small" data-action="open-review" data-exchange-id="' + escapeHtml(exchange.id) + '">去盖章评价</button>' +
      '</section>';
    }
    if (exchange.status === 'pending') {
      return '<section class="status-banner status-banner--muted">' +
        '<span class="status-banner__mark">' + icon('clock') + '</span>' +
        '<div><strong>提案已送达，等 ' + escapeHtml(peer.name) + ' 回应。</strong><p>' + escapeHtml(peer.response) + '。在接受之前，双方的聊天和课程都还没有开始。</p></div>' +
        '<button type="button" class="btn btn--ghost btn--small" data-action="withdraw-proposal" data-exchange-id="' + escapeHtml(exchange.id) + '">撤回提案</button>' +
      '</section>';
    }
    return '';
  }

  function renderGoalsPanel(exchange, peer) {
    const goals = [];
    if (exchange.myGoal) {
      goals.push('<article class="goal-card">' +
        '<div class="goal-card__head"><span class="goal-who">' + avatarMarkup(state.me, 'xs') + '我要学会</span><span class="goal-skill">' + escapeHtml(skillLabel(exchange.theirSkill)) + '</span></div>' +
        '<p>' + escapeHtml(exchange.myGoal) + '</p>' +
        '<span class="goal-foot">验收：一份可以展示的成果</span>' +
      '</article>');
    }
    if (exchange.theirGoal) {
      goals.push('<article class="goal-card goal-card--peer">' +
        '<div class="goal-card__head"><span class="goal-who">' + avatarMarkup(peer, 'xs') + 'TA 要学会</span><span class="goal-skill">' + escapeHtml(skillLabel(exchange.mySkill)) + '</span></div>' +
        '<p>' + escapeHtml(exchange.theirGoal) + '</p>' +
        '<span class="goal-foot">验收：一份可以展示的成果</span>' +
      '</article>');
    }
    if (!goals.length) return '';
    return '<section class="panel goals-panel">' +
      '<div class="panel-head"><div><p class="kicker">TWO GOALS, ONE DEAL</p><h2 class="panel-title">双方都要带走点什么</h2></div></div>' +
      '<div class="goal-grid">' + goals.join('') + '</div>' +
    '</section>';
  }

  function renderPendingPanel(exchange, peer) {
    return '<section class="panel pending-panel">' +
      '<div class="pending-icon">' + icon('clock') + '</div>' +
      '<h2>把「等回应」当作契约的一部分。</h2>' +
      '<p>提案里已经写清了交换内容、时间安排和双方目标。' + escapeHtml(peer.name) + '回应后，聊天和课程安排会自动开启。</p>' +
      '<button type="button" class="btn btn--ghost btn--small" data-action="withdraw-proposal" data-exchange-id="' + escapeHtml(exchange.id) + '">撤回这份提案</button>' +
    '</section>';
  }

  function renderReviewPrompt(exchange, peer) {
    return '<section class="panel review-prompt">' +
      '<div class="review-prompt__mark">' + icon('starOutline') + '</div>' +
      '<div><p class="kicker">CLOSE THE LOOP</p><h2>给 ' + escapeHtml(peer.name) + ' 盖个章。</h2><p>评价不会影响分数排序之外的东西。请只说具体的：守约、讲得清楚、有作品，或者哪一步下次可以更好。</p></div>' +
      '<button type="button" class="btn btn--primary" data-action="open-review" data-exchange-id="' + escapeHtml(exchange.id) + '">写评价</button>' +
    '</section>';
  }

  function renderMyReview(exchange) {
    const review = exchange.reviewByMe;
    return '<section class="panel finished-review">' +
      '<div class="panel-head"><div><p class="kicker">MY STAMP</p><h2 class="panel-title">你留下的评价</h2></div><span class="review-date">' + escapeHtml(review.at || '') + '</span></div>' +
      '<div class="review-summary">' + reviewStars(review.stars) +
        '<div class="review-tags">' + (review.tags || []).map(function (tag) { return '<span class="chip">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>' +
      '</div>' +
      (review.note ? '<p class="review-note">“' + escapeHtml(review.note) + '”</p>' : '') +
      '<p class="review-fine">双方评价都提交后才会公开展示。演示版本仅记录你的评价。</p>' +
    '</section>';
  }

  function renderChatPanel(exchange, peer, canChat) {
    const messages = exchange.messages || [];
    return '<section class="chat-panel" aria-label="与 ' + escapeHtml(peer.name) + ' 的交换消息">' +
      '<header class="chat-head">' +
        '<div class="chat-person">' + avatarMarkup(peer, 'xs') + '<div><strong>' + escapeHtml(peer.name) + '</strong><span>' + escapeHtml(peer.active) + '</span></div></div>' +
        '<span class="chat-lock">' + icon(canChat ? 'message' : 'lock') + (canChat ? '交换内消息' : '接受后开启') + '</span>' +
      '</header>' +
      '<div class="chat-log" id="chat-log">' +
        messages.map(function (message) {
          if (message.from === 'system') {
            return '<div class="chat-system"><span>' + escapeHtml(message.text) + '</span></div>';
          }
          const mine = message.from === 'me';
          return '<div class="chat-message' + (mine ? ' is-mine' : '') + '">' +
            '<div class="chat-bubble">' + escapeHtml(message.text) + '</div>' +
            '<span class="chat-time">' + escapeHtml(message.at || '') + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      (canChat ?
        '<form class="chat-form" data-form="chat" data-exchange-id="' + escapeHtml(exchange.id) + '">' +
          '<input type="text" name="message" maxlength="300" placeholder="说清下一件事，比说很多更有用…" aria-label="输入消息" autocomplete="off" />' +
          '<button type="submit" class="chat-send" aria-label="发送消息">' + icon('arrowRight') + '</button>' +
        '</form>' +
        '<p class="chat-fine">' + icon('lock') + '消息仅保留在这个演示浏览器里</p>'
        :
        '<div class="chat-locked-note">' + icon('lock') + '<p>' + (exchange.status === 'incoming' ? '阅读并接受契约后，才能给 ' + escapeHtml(peer.name) + ' 发消息。' : '对方回应后，聊天会自动开启。') + '</p></div>'
      ) +
    '</section>';
  }

  function restoreChatScroll() {
    const log = document.getElementById('chat-log');
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }

  /* ---------------------------------------------------------------------------
   * Product notes
   * ------------------------------------------------------------------------- */

  function renderNotesPage() {
    const swaps = LOGIC.sortedMatches(state.me, DATA.peers).filter(function (item) {
      return item.match.mode === 'swap';
    });
    let sample = swaps[0];
    if (!sample) {
      const fallbackPeer = findPeer('azhe');
      sample = { peer: fallbackPeer, match: LOGIC.computeMatch(DATA.me, fallbackPeer) };
    }
    const stats = LOGIC.matchingStats(state.me, DATA.peers);
    app.innerHTML = window.renderNotes({
      me: state.me,
      samplePeer: sample.peer,
      sampleMatch: sample.match,
      stats: stats
    });
  }

  /* ---------------------------------------------------------------------------
   * Modal system
   * ------------------------------------------------------------------------- */

  function modalCloseButton() {
    return '<button type="button" class="modal-close" data-action="close-modal" aria-label="关闭弹窗">' + icon('close') + '</button>';
  }

  function openModal(content, className) {
    const wasOpen = modalRoot.querySelector('.modal-layer');
    if (!wasOpen) {
      lastFocused = document.activeElement;
    }
    const previousScroll = wasOpen ? (modalRoot.querySelector('.modal') || {}).scrollTop || 0 : 0;
    modalRoot.innerHTML =
      '<div class="modal-layer">' +
        '<div class="modal-backdrop" data-action="close-modal"></div>' +
        '<section class="modal ' + (className || '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">' + content + '</section>' +
      '</div>';
    document.body.classList.add('has-modal');
    const modal = modalRoot.querySelector('.modal');
    const focusTarget = modal.querySelector('[data-autofocus]') || modal.querySelector('.modal-close') || modal;
    window.requestAnimationFrame(function () {
      if (modal) modal.scrollTop = previousScroll ? previousScroll : 0;
      focusTarget.focus({ preventScroll: true });
    });
  }

  function closeModal(silent) {
    const hadModal = !!modalRoot.querySelector('.modal-layer');
    modalRoot.innerHTML = '';
    document.body.classList.remove('has-modal');
    if (hadModal && !silent && lastFocused && document.contains(lastFocused)) {
      lastFocused.focus({ preventScroll: true });
    }
    if (!silent) lastFocused = null;
  }

  function modalOpen() {
    return !!modalRoot.querySelector('.modal-layer');
  }

  function focusTrap(event) {
    if (!modalOpen() || event.key !== 'Tab') return;
    const modal = modalRoot.querySelector('.modal');
    if (!modal) return;
    const focusable = Array.prototype.slice.call(modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (element) {
      return element.offsetParent !== null;
    });
    if (!focusable.length) {
      event.preventDefault();
      modal.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------------------------
   * Peer profile modal
   * ------------------------------------------------------------------------- */

  function openPeerModal(peerId) {
    const peer = findPeer(peerId);
    if (!peer) return;
    const match = LOGIC.computeMatch(state.me, peer);
    const existing = exchangeForPeer(peer.id);

    let cta = '';
    let ctaNote = '';
    if (existing && existing.status !== 'completed') {
      const label = existing.status === 'active' ? '进入这段交换'
        : existing.status === 'review' ? '去完成互评'
        : existing.status === 'incoming' ? '去回应这份提案'
        : '查看已发出的提案';
      cta = '<button type="button" class="btn btn--primary btn--full" data-action="go-exchange" data-exchange-id="' + escapeHtml(existing.id) + '">' + label + icon('arrowRight') + '</button>';
      ctaNote = '你们已经有一段' + statusMeta(existing.status).label + '的交换。';
    } else if (match.mode) {
      const label = match.mode === 'swap' ? '发起一次技能互换'
        : match.mode === 'teach' ? '去教 TA 一小时'
        : '用时间币兑换一节课';
      cta = '<button type="button" class="btn btn--primary btn--full" data-action="open-proposal" data-peer-id="' + escapeHtml(peer.id) + '">' + label + icon('arrowRight') + '</button>';
      ctaNote = match.mode === 'swap' ? '你们俩刚好能彼此教会对方点什么。' : '这不是双向互换，但时间币可以补上错位。';
    } else {
      cta = '<button type="button" class="btn btn--ghost btn--full" disabled>暂时没有互补关系</button>';
    }

    let matchBlock = '';
    if (match.mode === 'swap') {
      matchBlock =
        '<div class="peer-match peer-match--swap">' +
          '<div class="peer-match__top">' +
            '<div><p class="mini-label">WHY YOU TWO</p><h3>你们刚好能交换</h3></div>' +
            '<span class="match-stamp match-stamp--modal"><strong>' + match.score + '<small>%</small></strong><em>双向匹配</em></span>' +
          '</div>' +
          '<div class="peer-route">' +
            '<div><span>你教 TA</span><b>' + escapeHtml(match.iTeachLabels.join(' / ')) + '</b><small>TA 正在学</small></div>' +
            '<span class="peer-route__icon">' + icon('swap') + '</span>' +
            '<div><span>TA 教你</span><b>' + escapeHtml(match.theyTeachLabels.join(' / ')) + '</b><small>你正在学</small></div>' +
          '</div>' +
          '<div class="score-bars">' + match.breakdown.map(function (item) {
            return '<div class="score-row"><span class="score-label">' + item.label + '</span><span class="score-track"><i style="width:' + Math.round(item.value / item.max * 100) + '%"></i></span><span class="score-value">' + item.value + '<small>/' + item.max + '</small></span></div>';
          }).join('') + '</div>' +
          '<p class="peer-match__note">分数只说明这次交换是否容易发生。它不评价人的价值，也不该替代你自己的判断。</p>' +
        '</div>';
    } else {
      matchBlock =
        '<div class="peer-match peer-match--coin">' +
          '<div class="peer-match__top"><div><p class="mini-label">A DIFFERENT ROUTE</p><h3>' + (match.mode === 'teach' ? '你可以教 TA' : 'TA 可以教你') + '</h3></div><span class="coin-stamp coin-stamp--lg">' + icon('coin') + '</span></div>' +
          '<div class="coin-ledger">' +
            '<div><span>' + (match.mode === 'teach' ? '你教出 1 小时' : 'TA 教出 1 小时') + '</span><b>' + (match.mode === 'teach' ? '+1' : '−1') + ' h 时间币</b></div>' +
            '<p>' + (match.mode === 'teach' ? 'TA 正在学 ' + escapeHtml(match.iTeachLabels[0]) + '，但暂时没有你想学的回礼。' : 'TA 能教 ' + escapeHtml(match.theyTeachLabels[0]) + '，但没有需要你教的东西。') + '</p>' +
          '</div>' +
          '<p class="peer-match__note">这就是时间银行存在的意义：善意可以晚一点兑现，不必刚好在同一分钟遇到彼此。</p>' +
        '</div>';
    }

    openModal(
      modalCloseButton() +
      '<div class="peer-modal">' +
        '<div class="peer-modal__main">' +
          '<header class="peer-profile-head">' +
            avatarMarkup(peer, 'xl') +
            '<div class="peer-profile-head__copy">' +
              '<p class="mini-label">SKILL CARD / 编号 ' + contractNumber({ id: peer.id }) + '</p>' +
              '<h2 id="modal-title">' + escapeHtml(peer.name) + '</h2>' +
              '<p>' + escapeHtml(peer.role) + ' · ' + escapeHtml(peer.city) + '</p>' +
              '<div class="verified-row">' + peer.verified.map(function (item) {
                return '<span>' + icon('verified') + escapeHtml(item) + '</span>';
              }).join('') + '</div>' +
            '</div>' +
            '<span class="peer-profile-head__stamp">' + icon('star') + '<b>' + peer.rating.toFixed(1) + '</b><small>' + peer.swaps + ' 次交换</small></span>' +
          '</header>' +
          '<p class="peer-bio">' + escapeHtml(peer.bio) + '</p>' +
          '<div class="peer-facts">' +
            '<div><span>' + icon('pin') + '坐标</span><b>' + escapeHtml(peer.city) + '</b></div>' +
            '<div><span>' + icon('video') + '形式</span><b>' + escapeHtml(formatLine(peer)) + '</b></div>' +
            '<div><span>' + icon('clock') + '可约</span><b>' + escapeHtml(peer.slots.join(' / ')) + '</b></div>' +
            '<div><span>' + icon('message') + '回复</span><b>' + escapeHtml(peer.response) + '</b></div>' +
          '</div>' +
          '<section class="peer-section">' +
            '<div class="peer-section__head"><h3>TA 能教</h3><span>WHAT THEY CAN SHARE</span></div>' +
            '<div class="peer-teach-list">' + peer.teaches.map(function (item, index) {
              return '<div class="peer-teach-row"><span>0' + (index + 1) + '</span><div><h4>' + escapeHtml(LOGIC.skillLabel(item.skill)) + '</h4><p>可以带你到：' + escapeHtml(item.outcome) + '</p></div></div>';
            }).join('') + '</div>' +
          '</section>' +
          '<section class="peer-section">' +
            '<div class="peer-section__head"><h3>TA 想学</h3><span>WHAT THEY ARE LOOKING FOR</span></div>' +
            '<div class="want-chips">' + labelsForWants(peer).map(function (label) {
              return '<span class="chip">' + escapeHtml(label) + '</span>';
            }).join('') + '</div>' +
            (peer.goal ? '<p class="peer-goal">“' + escapeHtml(peer.goal) + '”</p>' : '') +
          '</section>' +
          '<section class="peer-section">' +
            '<div class="peer-section__head"><h3>别人怎么说</h3><span>KIND WORDS / 演示评价</span></div>' +
            '<div class="peer-review-grid">' + peer.reviews.map(function (review) {
              return '<blockquote class="peer-review"><p>“' + escapeHtml(review.text) + '”</p><footer><strong>' + escapeHtml(review.by) + '</strong>' + reviewStars(review.stars, 'xs') + '</footer></blockquote>';
            }).join('') + '</div>' +
          '</section>' +
          '<p class="peer-disclaimer">这张名片与评价为虚构演示内容。平台内的实际交换以契约与双方确认为准。</p>' +
        '</div>' +
        '<aside class="peer-modal__aside">' +
          matchBlock +
          '<div class="peer-cta-block">' +
            (existing ? '<div class="peer-existing">' + statusPill(existing.status) + '<span>' + escapeHtml(LOGIC.exchangeTitle(existing)) + '</span></div>' : '') +
            cta +
            '<p>' + escapeHtml(ctaNote) + '</p>' +
          '</div>' +
          '<p class="peer-safety">' + icon('shield') + '开始前请确认时间、边界与验收方式。接受提案后才会开启聊天。</p>' +
        '</aside>' +
      '</div>',
      'modal--peer'
    );
  }

  /* ---------------------------------------------------------------------------
   * Edit profile
   * ------------------------------------------------------------------------- */

  function openEditModal() {
    editDraft = deepClone(state.me);
    editDraft.error = '';
    renderEditModal();
  }

  function collectEditForm() {
    const form = modalRoot.querySelector('[data-form="profile-edit"]');
    if (!form) return;
    editDraft.name = form.elements.name ? form.elements.name.value.trim() : editDraft.name;
    editDraft.role = form.elements.role ? form.elements.role.value.trim() : editDraft.role;
    editDraft.city = form.elements.city ? form.elements.city.value : editDraft.city;
    editDraft.bio = form.elements.bio ? form.elements.bio.value.trim() : editDraft.bio;
    editDraft.formats = Array.prototype.slice.call(form.querySelectorAll('input[name="formats"]:checked')).map(function (input) { return input.value; });
    editDraft.slots = Array.prototype.slice.call(form.querySelectorAll('input[name="slots"]:checked')).map(function (input) { return input.value; });
  }

  function renderEditModal() {
    const draft = editDraft;
    const availableTeach = DATA.skills.filter(function (skill) {
      return !draft.teaches.some(function (item) { return item.skill === skill.id; });
    });
    const availableWant = DATA.skills.filter(function (skill) {
      return !draft.wants.some(function (item) { return item.skill === skill.id; });
    });

    openModal(
      modalCloseButton() +
      '<header class="modal-head">' +
        '<p class="kicker">EDIT YOUR CARD</p>' +
        '<h2 id="modal-title">换一张名片，换一批相遇。</h2>' +
        '<p>写具体一点。你不需要证明自己很厉害，只需要让别人知道：和你学一小时，能做到什么。</p>' +
      '</header>' +
      '<form class="profile-form" data-form="profile-edit" novalidate>' +
        (draft.error ? '<div class="form-error" role="alert">' + escapeHtml(draft.error) + '</div>' : '') +
        '<section class="form-section">' +
          '<div class="form-section__head"><span class="form-index">01</span><h3>先认识你</h3></div>' +
          '<div class="field-grid">' +
            '<label class="field"><span>怎么称呼你</span><input name="name" type="text" maxlength="20" value="' + escapeHtml(draft.name) + '" data-autofocus required /></label>' +
            '<label class="field"><span>你的身份 / 工作</span><input name="role" type="text" maxlength="30" value="' + escapeHtml(draft.role) + '" /></label>' +
            '<label class="field field--select"><span>所在城市</span><select name="city">' + DATA.cities.map(function (city) {
              return '<option value="' + escapeHtml(city) + '"' + (draft.city === city ? ' selected' : '') + '>' + escapeHtml(city) + '</option>';
            }).join('') + '</select>' + icon('chevronDown') + '</label>' +
          '</div>' +
          '<label class="field field--wide"><span>一句话介绍自己 <small>' + escapeHtml(draft.bio).length + ' / 80</small></span><textarea name="bio" rows="2" maxlength="80">' + escapeHtml(draft.bio) + '</textarea></label>' +
        '</section>' +

        '<section class="form-section">' +
          '<div class="form-section__head"><span class="form-index">02</span><h3>我能教</h3><small>最多 5 项，先写最有把握的</small></div>' +
          '<div class="edit-skill-list">' + (draft.teaches.length ? draft.teaches.map(function (item, index) {
            return '<span class="edit-skill">' + escapeHtml(LOGIC.skillLabel(item.skill)) + '<button type="button" data-action="edit-remove-skill" data-list="teaches" data-index="' + index + '" aria-label="移除 ' + escapeHtml(LOGIC.skillLabel(item.skill)) + '">' + icon('close') + '</button></span>';
          }).join('') : '<span class="empty-inline">至少写一项你能教的技能。</span>') + '</div>' +
          (draft.teaches.length < 5 ?
            '<div class="add-skill-row">' +
              '<label class="select-wrap select-wrap--wide"><span class="sr-only">添加能教的技能</span><select data-skill-select="teaches">' +
                '<option value="">从技能库添加一项…</option>' + skillOptions(availableTeach) +
              '</select>' + icon('chevronDown') + '</label>' +
              '<button type="button" class="btn btn--ghost btn--small" data-action="edit-add-skill" data-list="teaches">' + icon('plus') + '添加</button>' +
            '</div>' : '<p class="form-hint">已达上限 5 项。</p>') +
        '</section>' +

        '<section class="form-section">' +
          '<div class="form-section__head"><span class="form-index">03</span><h3>我想学</h3><small>它们决定谁会被推荐给你</small></div>' +
          '<div class="edit-skill-list">' + (draft.wants.length ? draft.wants.map(function (item, index) {
            return '<span class="edit-skill edit-skill--want">' + escapeHtml(LOGIC.skillLabel(item.skill)) + '<button type="button" data-action="edit-remove-skill" data-list="wants" data-index="' + index + '" aria-label="移除 ' + escapeHtml(LOGIC.skillLabel(item.skill)) + '">' + icon('close') + '</button></span>';
          }).join('') : '<span class="empty-inline">至少写一项你想学的技能。</span>') + '</div>' +
          (draft.wants.length < 5 ?
            '<div class="add-skill-row">' +
              '<label class="select-wrap select-wrap--wide"><span class="sr-only">添加想学的技能</span><select data-skill-select="wants">' +
                '<option value="">从技能库添加一项…</option>' + skillOptions(availableWant) +
              '</select>' + icon('chevronDown') + '</label>' +
              '<button type="button" class="btn btn--ghost btn--small" data-action="edit-add-skill" data-list="wants">' + icon('plus') + '添加</button>' +
            '</div>' : '<p class="form-hint">已达上限 5 项。</p>') +
          '<p class="form-hint">想学不是许愿池。写下一件你真的愿意为它空出晚上时间的事。</p>' +
        '</section>' +

        '<section class="form-section">' +
          '<div class="form-section__head"><span class="form-index">04</span><h3>时间与形式</h3><small>匹配时也会参考这些</small></div>' +
          '<div class="choice-row">' +
            '<div class="choice-group"><span>我能接受</span><div class="choice-chips">' + DATA.formats.map(function (format) {
              return '<label class="choice-chip"><input type="checkbox" name="formats" value="' + format + '"' + (draft.formats.indexOf(format) !== -1 ? ' checked' : '') + ' /><span>' + format + '</span></label>';
            }).join('') + '</div></div>' +
            '<div class="choice-group"><span>通常有空</span><div class="choice-chips">' + DATA.slots.map(function (slot) {
              return '<label class="choice-chip"><input type="checkbox" name="slots" value="' + slot + '"' + (draft.slots.indexOf(slot) !== -1 ? ' checked' : '') + ' /><span>' + slot + '</span></label>';
            }).join('') + '</div></div>' +
          '</div>' +
        '</section>' +

        '<div class="modal-actions">' +
          '<p class="modal-actions__note">修改后会立即重算匹配。数据只保存在本机浏览器。</p>' +
          '<div class="button-row">' +
            '<button type="button" class="btn btn--ghost" data-action="close-modal">取消</button>' +
            '<button type="submit" class="btn btn--primary">保存名片' + icon('arrowRight') + '</button>' +
          '</div>' +
        '</div>' +
      '</form>',
      'modal--edit'
    );
  }

  function skillOptions(skills) {
    return DATA.categories.filter(function (category) { return category.id !== 'all'; }).map(function (category) {
      const group = skills.filter(function (skill) { return skill.category === category.id; });
      if (!group.length) return '';
      return '<optgroup label="' + escapeHtml(category.label) + '">' + group.map(function (skill) {
        return '<option value="' + escapeHtml(skill.id) + '">' + escapeHtml(skill.label) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }

  function saveProfile() {
    const name = (editDraft.name || '').trim();
    if (name.length < 2) {
      editDraft.error = '名片上至少需要一个称呼，两个字以上。';
      renderEditModal();
      return;
    }
    if (!editDraft.teaches.length) {
      editDraft.error = '写下一项你能教的技能，哪怕只是「能带你入门」。';
      renderEditModal();
      return;
    }
    if (!editDraft.wants.length) {
      editDraft.error = '再写下一项你真正想学的技能。';
      renderEditModal();
      return;
    }
    if (!editDraft.formats.length) {
      editDraft.error = '至少选择一种能接受的交换形式。';
      renderEditModal();
      return;
    }
    if (!editDraft.slots.length) {
      editDraft.error = '至少选择一个通常有空的时段。';
      renderEditModal();
      return;
    }

    const merged = Object.assign({}, state.me, editDraft);
    delete merged.error;
    state.me = merged;
    saveState();
    closeModal(true);
    toast('名片已更新，匹配已经重新计算。');
    renderChrome();
    renderRoute({ scroll: false });
  }

  /* ---------------------------------------------------------------------------
   * Proposal flow
   * ------------------------------------------------------------------------- */

  function openProposalModal(peerId) {
    const peer = findPeer(peerId);
    if (!peer) return;
    const match = LOGIC.computeMatch(state.me, peer);
    if (!match.mode) {
      toast('你们暂时没有互补关系。先回名片里加一项想学或能教的技能。');
      return;
    }

    const formatOverlap = state.me.formats.filter(function (format) {
      return peer.formats.indexOf(format) !== -1;
    })[0] || peer.formats[0] || '线上';

    proposalDraft = {
      peerId: peer.id,
      mode: match.mode,
      step: 0,
      error: '',
      mySkill: match.iTeach[0] || '',
      theirSkill: match.theyTeach[0] || '',
      myGoal: match.theyTeach[0] ? (myWantsForSkill(match.theyTeach[0]) || '完成一个可以展示的小作品') : '',
      theirGoal: (peer.goal || '把这项技能学到可以独立完成一次小作品').replace(/^想(学会|学)?/, ''),
      sessions: match.mode === 'swap' ? 4 : 2,
      duration: match.mode === 'swap' ? 1.5 : 1,
      format: formatOverlap,
      window: '下个月开始',
      agreed: false
    };
    renderProposalModal();
  }

  function proposalTotalHours(draft) {
    return draft.sessions * draft.duration;
  }

  function renderProposalModal() {
    const draft = proposalDraft;
    const peer = findPeer(draft.peerId);
    const match = LOGIC.computeMatch(state.me, peer);
    const total = proposalTotalHours(draft);
    const isSwap = draft.mode === 'swap';

    const stepBar = '<div class="proposal-steps" aria-label="提案进度">' +
      [0, 1, 2].map(function (value) {
        return '<span class="' + (draft.step === value ? 'is-active' : '') + (draft.step > value ? ' is-done' : '') + '"><i>' + (draft.step > value ? icon('check') : '0' + (value + 1)) + '</i><b>' + ['交换内容', '时间安排', '确认契约'][value] + '</b></span>';
      }).join('') +
    '</div>';

    let body = '';
    if (draft.step === 0) {
      const mySkillChoices = match.iTeach.length > 1
        ? '<label class="field field--select"><span>你教</span><select name="my-skill">' + match.iTeach.map(function (id) {
            return '<option value="' + escapeHtml(id) + '"' + (draft.mySkill === id ? ' selected' : '') + '>' + escapeHtml(LOGIC.skillLabel(id)) + '</option>';
          }).join('') + '</select>' + icon('chevronDown') + '</label>'
        : '<div class="fixed-skill"><span>你教</span><b>' + escapeHtml(match.iTeachLabels[0] || '—') + '</b></div>';
      const theirSkillChoices = match.theyTeach.length > 1
        ? '<label class="field field--select"><span>TA 教</span><select name="their-skill">' + match.theyTeach.map(function (id) {
            return '<option value="' + escapeHtml(id) + '"' + (draft.theirSkill === id ? ' selected' : '') + '>' + escapeHtml(LOGIC.skillLabel(id)) + '</option>';
          }).join('') + '</select>' + icon('chevronDown') + '</label>'
        : '<div class="fixed-skill"><span>TA 教</span><b>' + escapeHtml(match.theyTeachLabels[0] || '—') + '</b></div>';

      const routeBlock = isSwap
        ? (mySkillChoices + '<span class="proposal-route__arrow">' + icon('swap') + '</span>' + theirSkillChoices)
        : (draft.mode === 'teach'
          ? (mySkillChoices + '<span class="proposal-route__arrow proposal-route__arrow--coin">' + icon('coin') + '</span>' +
            '<div class="fixed-skill fixed-skill--coin"><span>结算</span><b>TA 支付时间币</b><small>你教一小时，存下一小时</small></div>')
          : (theirSkillChoices + '<span class="proposal-route__arrow proposal-route__arrow--coin">' + icon('coin') + '</span>' +
            '<div class="fixed-skill fixed-skill--coin"><span>结算</span><b>你支付时间币</b><small>用存下的小时兑换这节课</small></div>'));

      body =
        '<section class="proposal-section">' +
          '<div class="proposal-route' + (isSwap ? '' : ' proposal-route--oneway') + '">' +
            routeBlock +
          '</div>' +
          (isSwap ?
            '<div class="field-grid field-grid--proposal">' +
              '<label class="field field--wide"><span>我想学到什么程度 <small>会被写进契约，越具体越好</small></span><textarea name="my-goal" rows="3" data-autofocus required>' + escapeHtml(draft.myGoal) + '</textarea></label>' +
              '<label class="field field--wide"><span>' + escapeHtml(peer.name) + '想学到什么程度</span><textarea name="their-goal" rows="3" required>' + escapeHtml(draft.theirGoal) + '</textarea></label>' +
            '</div>'
            :
            '<div class="field-grid field-grid--proposal">' +
              (draft.mode === 'learn'
                ? '<label class="field field--wide"><span>我想学到什么程度 <small>会被写进契约</small></span><textarea name="my-goal" rows="3" data-autofocus required>' + escapeHtml(draft.myGoal) + '</textarea></label>'
                : '<label class="field field--wide"><span>' + escapeHtml(peer.name) + '想学到什么程度 <small>你负责把 TA 带到这里</small></span><textarea name="their-goal" rows="3" data-autofocus required>' + escapeHtml(draft.theirGoal) + '</textarea></label>') +
            '</div>') +
          '<div class="proposal-tip">' + icon('sparkle') + '<p>一个好的学习目标，能在结束时被拿出来展示：一组照片、一首弹唱、一段对话、一个小工具。</p></div>' +
        '</section>';
    } else if (draft.step === 1) {
      body =
        '<section class="proposal-section">' +
          '<div class="proposal-summary-line"><span>这次交换</span><b>' + escapeHtml(draft.mode === 'swap' ? '你教 ' + LOGIC.skillLabel(draft.mySkill) + ' · TA 教 ' + LOGIC.skillLabel(draft.theirSkill) : (draft.mode === 'teach' ? '你教 ' + LOGIC.skillLabel(draft.mySkill) : 'TA 教 ' + LOGIC.skillLabel(draft.theirSkill))) + '</b></div>' +
          '<div class="field-grid">' +
            '<label class="field field--select"><span>总次数</span><select name="sessions">' + [2, 3, 4, 6].map(function (count) {
              return '<option value="' + count + '"' + (draft.sessions === count ? ' selected' : '') + '>' + count + ' 次</option>';
            }).join('') + '</select>' + icon('chevronDown') + '</label>' +
            '<label class="field field--select"><span>每次时长</span><select name="duration">' + [1, 1.5, 2].map(function (value) {
              return '<option value="' + value + '"' + (draft.duration === value ? ' selected' : '') + '>' + value + ' 小时</option>';
            }).join('') + '</select>' + icon('chevronDown') + '</label>' +
            '<label class="field field--select"><span>交换形式</span><select name="format">' + DATA.formats.filter(function (format) {
              return peer.formats.indexOf(format) !== -1;
            }).map(function (format) {
              return '<option value="' + escapeHtml(format) + '"' + (draft.format === format ? ' selected' : '') + '>' + (format === '线下' ? peer.city + '线下' : '线上') + '</option>';
            }).join('') + '</select>' + icon('chevronDown') + '</label>' +
            '<label class="field field--select"><span>开始时间</span><select name="window">' + ['下周开始', '下个月开始', '时间灵活'].map(function (value) {
              return '<option value="' + escapeHtml(value) + '"' + (draft.window === value ? ' selected' : '') + '>' + escapeHtml(value) + '</option>';
            }).join('') + '</select>' + icon('chevronDown') + '</label>' +
          '</div>' +
          '<div class="duration-display">' +
            '<div><span>合计</span><strong>' + formatNumber(total) + '<small> 小时</small></strong></div>' +
            '<p>' + (isSwap ? '双向互换，不扣时间币。你们各自教，也各自学。' : (draft.mode === 'learn' ? '将从你的时间银行支出 <b>' + formatNumber(total) + ' h</b>，余额 ' + formatCoins(state.me.coins) + ' h。' : '对方接受后，你将存入 <b>' + formatNumber(total) + ' h</b> 时间币。')) + '</p>' +
          '</div>' +
          '<div class="proposal-tip">' + icon('clock') + '<p>时间安排只是意向。接受提案后，双方再一起定下第一节课的具体日期。</p></div>' +
        '</section>';
    } else {
      body =
        '<section class="proposal-section">' +
          renderProposalContract(draft, peer, total) +
          '<label class="agreement"><input type="checkbox" name="agreed"' + (draft.agreed ? ' checked' : '') + ' /><span>我理解这是一段双向承诺：会按时赴约，也会在时间不合适时提前说清楚。</span></label>' +
          '<div class="proposal-tip proposal-tip--quiet">' + icon('shield') + '<p>发出后，对方可以在工作台接受或婉拒。接受之前，你可以随时撤回。</p></div>' +
        '</section>';
    }

    openModal(
      modalCloseButton() +
      '<header class="modal-head modal-head--proposal">' +
        '<div class="proposal-peer">' + avatarMarkup(peer, 'sm') + '<span>与 <b>' + escapeHtml(peer.name) + '</b> 的交换提案</span></div>' +
        '<h2 id="modal-title">' + (draft.step === 0 ? '先说清楚，要换什么。' : draft.step === 1 ? '给这段交换一个节奏。' : '最后，看一眼你们的约定。') + '</h2>' +
        '<p>' + (draft.step === 0 ? '把模糊的兴趣写成一件能验收的小事。' : draft.step === 1 ? '不需要一次规划完所有细节，但要把节奏说出来。' : '契约不是法律文件，是双方都愿意认真对待的证据。') + '</p>' +
      '</header>' +
      stepBar +
      (draft.error ? '<div class="form-error" role="alert">' + escapeHtml(draft.error) + '</div>' : '') +
      body +
      '<div class="proposal-actions">' +
        '<button type="button" class="btn btn--ghost" data-action="' + (draft.step === 0 ? 'close-modal' : 'proposal-back') + '">' + (draft.step === 0 ? '取消' : '上一步') + '</button>' +
        '<button type="button" class="btn btn--primary" data-action="' + (draft.step === 2 ? 'proposal-submit' : 'proposal-next') + '">' +
          (draft.step === 2 ? '发出这份提案' : '下一步') + icon('arrowRight') +
        '</button>' +
      '</div>',
      'modal--proposal'
    );
  }

  function renderProposalContract(draft, peer, total) {
    const isSwap = draft.mode === 'swap';
    return '<div class="proposal-contract">' +
      '<div class="proposal-contract__head"><span>EXCHANGE AGREEMENT / 提案</span><span>DRAFT</span></div>' +
      '<div class="proposal-contract__parties">' + avatarMarkup(state.me, 'sm') + '<b>' + escapeHtml(state.me.name) + '</b><span>×</span>' + avatarMarkup(peer, 'sm') + '<b>' + escapeHtml(peer.name) + '</b></div>' +
      '<h3>' + (isSwap
        ? escapeHtml(LOGIC.skillLabel(draft.mySkill)) + ' <span>⇄</span> ' + escapeHtml(LOGIC.skillLabel(draft.theirSkill))
        : (draft.mode === 'teach'
          ? escapeHtml(LOGIC.skillLabel(draft.mySkill)) + ' <span>→</span> 时间币'
          : '时间币 <span>→</span> ' + escapeHtml(LOGIC.skillLabel(draft.theirSkill)))) + '</h3>' +
      '<div class="proposal-contract__facts">' +
        '<div><span>课时</span><b>' + draft.sessions + ' 次 × ' + draft.duration + ' 小时</b></div>' +
        '<div><span>形式</span><b>' + escapeHtml(draft.format === '线下' ? peer.city + '线下' : '线上') + '</b></div>' +
        '<div><span>开始</span><b>' + escapeHtml(draft.window) + '</b></div>' +
        '<div><span>结算</span><b>' + (isSwap ? '双向互换' : (draft.mode === 'teach' ? '+' + formatNumber(total) + 'h 时间币' : '−' + formatNumber(total) + 'h 时间币')) + '</b></div>' +
      '</div>' +
      '<div class="proposal-contract__goals">' +
        (draft.myGoal ? '<p><span>我想学会</span>' + escapeHtml(draft.myGoal) + '</p>' : '') +
        (draft.theirGoal ? '<p><span>' + escapeHtml(peer.name) + '要学会</span>' + escapeHtml(draft.theirGoal) + '</p>' : '') +
      '</div>' +
      '<p class="proposal-contract__fine">改期提前 24 小时说明 · 两次无故爽约暂停匹配 · 任何时候都可以体面结束</p>' +
    '</div>';
  }

  function collectProposalStep() {
    const draft = proposalDraft;
    const mySkillField = modalRoot.querySelector('[name="my-skill"]');
    if (mySkillField) draft.mySkill = mySkillField.value;
    const theirSkillField = modalRoot.querySelector('[name="their-skill"]');
    if (theirSkillField) draft.theirSkill = theirSkillField.value;
    const myGoalField = modalRoot.querySelector('[name="my-goal"]');
    if (myGoalField) draft.myGoal = myGoalField.value.trim();
    const theirGoalField = modalRoot.querySelector('[name="their-goal"]');
    if (theirGoalField) draft.theirGoal = theirGoalField.value.trim();
    const sessionsField = modalRoot.querySelector('[name="sessions"]');
    if (sessionsField) draft.sessions = Number(sessionsField.value);
    const durationField = modalRoot.querySelector('[name="duration"]');
    if (durationField) draft.duration = Number(durationField.value);
    const formatField = modalRoot.querySelector('[name="format"]');
    if (formatField) draft.format = formatField.value;
    const windowField = modalRoot.querySelector('[name="window"]');
    if (windowField) draft.window = windowField.value;
    const agreedField = modalRoot.querySelector('[name="agreed"]');
    draft.agreed = !!agreedField && agreedField.checked;
  }

  function nextProposalStep() {
    collectProposalStep();
    const draft = proposalDraft;
    draft.error = '';
    if (draft.step === 0) {
      if (!draft.mySkill && draft.mode !== 'learn') {
        draft.error = '先选择一项你能教的技能。';
      } else if (!draft.theirSkill && draft.mode !== 'teach') {
        draft.error = '先选择一项要向对方学的技能。';
      } else if (draft.mode !== 'teach' && draft.myGoal.length < 5) {
        draft.error = '把你想学到的程度写具体一点，至少 5 个字。';
      } else if (draft.mode !== 'learn' && draft.theirGoal.length < 5) {
        draft.error = '也请把对方想学到的程度写清楚。';
      } else {
        draft.step = 1;
      }
    } else if (draft.step === 1) {
      if (!draft.sessions || !draft.duration) {
        draft.error = '先选择课时与每次时长。';
      } else if (draft.mode === 'learn' && proposalTotalHours(draft) > Number(state.me.coins)) {
        draft.error = '你的时间币余额不足，先减少课时或把时长缩短一点。';
      } else {
        draft.step = 2;
      }
    }
    renderProposalModal();
  }

  function backProposalStep() {
    collectProposalStep();
    proposalDraft.error = '';
    proposalDraft.step = Math.max(0, proposalDraft.step - 1);
    renderProposalModal();
  }

  function submitProposal() {
    collectProposalStep();
    const draft = proposalDraft;
    if (!draft.agreed) {
      draft.error = '勾选最后一项，确认你理解这是一段双向承诺。';
      renderProposalModal();
      return;
    }
    if (draft.mode === 'learn' && proposalTotalHours(draft) > Number(state.me.coins)) {
      draft.error = '时间币余额不足。';
      renderProposalModal();
      return;
    }

    const peer = findPeer(draft.peerId);
    const total = proposalTotalHours(draft);
    const now = new Date();
    const id = 'ex-' + now.getTime().toString(36);
    const sessions = [];
    for (let index = 0; index < draft.sessions; index += 1) {
      sessions.push({
        label: '第 ' + (index + 1) + ' 节',
        topics: '待双方一起定内容',
        date: '接受提案后约定',
        done: false
      });
    }

    const exchange = {
      id: id,
      peerId: peer.id,
      status: 'pending',
      mode: draft.mode,
      mySkill: draft.mySkill,
      theirSkill: draft.theirSkill,
      myGoal: draft.mode === 'teach' ? '' : draft.myGoal,
      theirGoal: draft.mode === 'learn' ? '' : draft.theirGoal,
      sessionsTotal: draft.sessions,
      sessionMinutes: draft.duration * 60,
      format: draft.format === '线下' ? '线下' : '线上',
      window: draft.window,
      place: draft.format === '线下' ? peer.city + ' · 具体地点待定' : '线上会议',
      createdAt: todayStamp().replace(/\./g, '-'),
      coinHours: draft.mode === 'swap' ? 0 : total,
      sessions: sessions,
      messages: [
        {
          from: 'me',
          text: '我写了一份交换提案：' + (draft.mode === 'teach' ? '我来教 ' + LOGIC.skillLabel(draft.mySkill) : '想向你学 ' + LOGIC.skillLabel(draft.theirSkill)) + '。你看看这样的目标和节奏合适吗？',
          at: messageStamp()
        },
        { from: 'system', text: '提案已送达，等待 ' + peer.name + ' 回应', at: '' }
      ],
      reviewByMe: null
    };

    state.exchanges.unshift(exchange);
    saveState();
    renderHeader();
    renderMobileNav();
    renderProposalSuccess(exchange, peer, total);
  }

  function renderProposalSuccess(exchange, peer, total) {
    openModal(
      modalCloseButton() +
      '<div class="proposal-success">' +
        '<div class="success-stamp">' + icon('check') + '<span>提案已发出</span></div>' +
        '<p class="kicker">SENT / WAITING FOR A REPLY</p>' +
        '<h2 id="modal-title">做得不错。<br />现在把「等回应」也当作交换的一部分。</h2>' +
        '<p class="success-lede">' + escapeHtml(peer.name) + '的回复通常在自己的时间内发生。提案接受后，你会在工作台看到下一节课的入口。</p>' +
        '<div class="success-receipt">' +
          '<div><span>交换</span><b>' + escapeHtml(exchange.mode === 'swap'
            ? LOGIC.skillLabel(exchange.mySkill) + ' ⇄ ' + LOGIC.skillLabel(exchange.theirSkill)
            : (exchange.mode === 'teach'
              ? LOGIC.skillLabel(exchange.mySkill) + ' → 时间币'
              : '时间币 → ' + LOGIC.skillLabel(exchange.theirSkill))) + '</b></div>' +
          '<div><span>安排</span><b>' + exchange.sessionsTotal + ' 次 · 共 ' + formatNumber(total) + ' 小时 · ' + escapeHtml(exchange.format) + '</b></div>' +
          '<div><span>结算</span><b>' + (exchange.mode === 'swap' ? '双向互换 · 0 时间币' : (exchange.mode === 'teach' ? '对方支付 ' + formatNumber(total) + 'h' : '你支付 ' + formatNumber(total) + 'h')) + '</b></div>' +
          '<div><span>契约号</span><b>' + contractNumber(exchange) + '</b></div>' +
        '</div>' +
        '<div class="button-row">' +
          '<button type="button" class="btn btn--primary" data-action="go-workbench" data-tab="confirm">查看我的工作台' + icon('arrowRight') + '</button>' +
          '<button type="button" class="btn btn--ghost" data-action="close-modal">再逛逛</button>' +
        '</div>' +
        '<p class="success-fine">' + icon('lock') + '演示环境不会真的通知对方；你可以随时在工作台撤回这份提案。</p>' +
      '</div>',
      'modal--success'
    );
  }

  /* ---------------------------------------------------------------------------
   * Accept, decline & confirmations
   * ------------------------------------------------------------------------- */

  function openAcceptModal(exchangeId) {
    const exchange = findExchange(exchangeId);
    if (!exchange) return;
    const peer = findPeer(exchange.peerId);
    const total = totalHours(exchange);
    openModal(
      modalCloseButton() +
      '<header class="modal-head">' +
        '<p class="kicker">REVIEW THE CONTRACT</p>' +
        '<h2 id="modal-title">接受之前，再看一眼。</h2>' +
        '<p>接受后，这段交换会进入工作台，聊天也会开启。没有自动续费，也没有违约金。</p>' +
      '</header>' +
      '<div class="accept-contract">' +
        '<div class="accept-route">' +
          (exchange.mode === 'swap'
            ? '<div>' + avatarMarkup(state.me, 'sm') + '<span><b>' + escapeHtml(state.me.name) + '</b><small>你教 ' + escapeHtml(skillLabel(exchange.mySkill)) + '</small></span></div>' +
              '<span class="accept-swap">' + icon('swap') + '</span>' +
              '<div>' + avatarMarkup(peer, 'sm') + '<span><b>' + escapeHtml(peer.name) + '</b><small>TA 教 ' + escapeHtml(skillLabel(exchange.theirSkill)) + '</small></span></div>'
            : (exchange.mode === 'teach'
              ? '<div>' + avatarMarkup(state.me, 'sm') + '<span><b>' + escapeHtml(state.me.name) + '</b><small>你教 ' + escapeHtml(skillLabel(exchange.mySkill)) + '</small></span></div>' +
                '<span class="accept-swap">' + icon('coin') + '</span>' +
                '<div>' + avatarMarkup(peer, 'sm') + '<span><b>' + escapeHtml(peer.name) + '</b><small>支付 ' + formatNumber(total) + 'h 时间币</small></span></div>'
              : '<div>' + avatarMarkup(state.me, 'sm') + '<span><b>' + escapeHtml(state.me.name) + '</b><small>支付 ' + formatNumber(total) + 'h 时间币</small></span></div>' +
                '<span class="accept-swap">' + icon('coin') + '</span>' +
                '<div>' + avatarMarkup(peer, 'sm') + '<span><b>' + escapeHtml(peer.name) + '</b><small>TA 教 ' + escapeHtml(skillLabel(exchange.theirSkill)) + '</small></span></div>')) +
        '</div>' +
        '<div class="facts-grid">' +
          '<div><span>课时</span><b>' + exchange.sessionsTotal + ' 次 × ' + exchange.sessionMinutes + ' 分钟</b></div>' +
          '<div><span>总时长</span><b>' + formatNumber(total) + ' 小时</b></div>' +
          '<div><span>形式</span><b>' + escapeHtml(exchange.format) + '</b></div>' +
          '<div><span>周期</span><b>' + escapeHtml(exchange.window) + '</b></div>' +
        '</div>' +
        '<div class="accept-goals">' +
          '<div><span>你要学到</span><p>' + escapeHtml(exchange.myGoal || '按双方目标完成这次交换') + '</p></div>' +
          '<div><span>' + escapeHtml(peer.name) + '要学会</span><p>' + escapeHtml(exchange.theirGoal || '按双方目标完成这次交换') + '</p></div>' +
        '</div>' +
        '<p class="accept-fine">' + icon('shield') + '如果时间不合适，可以随时提出改期或结束。好的交换不需要硬撑。</p>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn--ghost" data-action="close-modal">再想想</button>' +
        '<button type="button" class="btn btn--primary" data-action="confirm-accept" data-exchange-id="' + escapeHtml(exchange.id) + '">确认接受这段交换' + icon('check') + '</button>' +
      '</div>',
      'modal--accept'
    );
  }

  function acceptExchange(exchangeId) {
    const exchange = findExchange(exchangeId);
    if (!exchange) return;
    const peer = findPeer(exchange.peerId);
    exchange.status = 'active';
    if (exchange.coinHours) {
      if (exchange.mode === 'learn') {
        state.me.coins = Math.max(0, Number(state.me.coins) - Number(exchange.coinHours));
      } else if (exchange.mode === 'teach') {
        state.me.coins = Number(state.me.coins) + Number(exchange.coinHours);
      }
      exchange.coinSettled = true;
    }
    const dates = ['11.01 周日 · 20:00', '11.08 周日 · 20:00', '11.15 周日 · 20:00', '11.22 周日 · 20:00', '11.29 周日 · 20:00', '12.06 周日 · 20:00'];
    exchange.sessions = (exchange.sessions || []).map(function (session, index) {
      return Object.assign({}, session, { date: session.done ? session.date : (dates[index] || '待约定') });
    });
    exchange.messages = (exchange.messages || []).concat([{
      from: 'system',
      text: '交换已确认 · 第一节课 ' + (exchange.sessions[0] ? exchange.sessions[0].date : '待约定') + ' · 聊天已开启',
      at: ''
    }]);
    saveState();
    closeModal(true);
    toast('交换已确认。先去和 ' + (peer ? peer.name : '对方') + ' 约好第一节的具体安排。');
    renderChrome();
    renderRoute({ scroll: false });
  }

  function openConfirmModal(options) {
    pendingConfirm = options.onConfirm || null;
    openModal(
      modalCloseButton() +
      '<header class="modal-head modal-head--confirm">' +
        '<p class="kicker">ONE MORE LOOK</p>' +
        '<h2 id="modal-title">' + escapeHtml(options.title) + '</h2>' +
        '<p>' + escapeHtml(options.body) + '</p>' +
      '</header>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn--ghost" data-action="close-modal">先不要</button>' +
        '<button type="button" class="btn ' + (options.danger ? 'btn--danger' : 'btn--primary') + '" data-action="confirm-modal">' + escapeHtml(options.confirmLabel || '确认') + '</button>' +
      '</div>',
      'modal--confirm'
    );
  }

  function runConfirmedAction() {
    const callback = pendingConfirm;
    pendingConfirm = null;
    closeModal(true);
    if (typeof callback === 'function') callback();
  }

  function declineExchange(exchangeId) {
    const exchange = findExchange(exchangeId);
    if (!exchange) return;
    openConfirmModal({
      title: '婉拒这份提案？',
      body: '它会从你的待确认列表里移除。演示环境不会向对方发送通知；真实产品里，婉拒会保留一句体面的系统回应。',
      confirmLabel: '确认婉拒',
      danger: true,
      onConfirm: function () {
        state.exchanges = state.exchanges.filter(function (item) { return item.id !== exchangeId; });
        saveState();
        toast('已婉拒这份提案。');
        renderChrome();
        if (currentRoute().name === 'exchange') {
          navigate('#/exchanges/confirm');
        } else {
          renderRoute({ scroll: false });
        }
      }
    });
  }

  function withdrawProposal(exchangeId) {
    openConfirmModal({
      title: '撤回这份提案？',
      body: '它还没有被对方接受，撤回后不会留下未完成的交换。你随时可以重新发起。',
      confirmLabel: '撤回提案',
      danger: true,
      onConfirm: function () {
        state.exchanges = state.exchanges.filter(function (item) { return item.id !== exchangeId; });
        saveState();
        toast('提案已撤回。');
        renderChrome();
        if (currentRoute().name === 'exchange') {
          navigate('#/exchanges');
        } else {
          renderRoute({ scroll: false });
        }
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * Review flow
   * ------------------------------------------------------------------------- */

  let reviewDraft = null;

  function openReviewModal(exchangeId) {
    const exchange = findExchange(exchangeId);
    if (!exchange) return;
    reviewDraft = {
      exchangeId: exchangeId,
      stars: exchange.reviewByMe ? exchange.reviewByMe.stars : 0,
      tags: exchange.reviewByMe ? exchange.reviewByMe.tags.slice() : [],
      error: ''
    };
    renderReviewModal();
  }

  function renderReviewModal() {
    const exchange = findExchange(reviewDraft.exchangeId);
    if (!exchange) return;
    const peer = findPeer(exchange.peerId);
    const tags = ['守约', '讲得清楚', '有耐心', '有作品', '节奏合适'];

    openModal(
      modalCloseButton() +
      '<header class="modal-head">' +
        '<p class="kicker">A STAMP FOR THE SWAP</p>' +
        '<h2 id="modal-title">给这次交换盖个章。</h2>' +
        '<p>和 ' + escapeHtml(peer.name) + ' 的「' + escapeHtml(LOGIC.exchangeTitle(exchange)) + '」。只说具体的感受，不用写得漂亮。</p>' +
      '</header>' +
      '<form data-form="review" data-exchange-id="' + escapeHtml(exchange.id) + '">' +
        '<div class="form-error' + (reviewDraft.error ? '' : ' is-hidden') + '" role="alert">' + escapeHtml(reviewDraft.error) + '</div>' +
        '<div class="rating-field">' +
          '<span class="mini-label">1. 这几次课值得吗？</span>' +
          '<div class="star-buttons" role="group" aria-label="评分">' +
            [1, 2, 3, 4, 5].map(function (value) {
              return '<button type="button" class="star-button' + (reviewDraft.stars >= value ? ' is-active' : '') + '" data-action="set-rating" data-value="' + value + '" aria-label="' + value + ' 星" aria-pressed="' + (reviewDraft.stars === value) + '">' + icon('star') + '</button>';
            }).join('') +
          '</div>' +
          '<p class="rating-hint">' + (['还没有选择评分', '有点可惜', '一般', '不错', '很好', '非常值得'][reviewDraft.stars] || '') + '</p>' +
        '</div>' +
        '<div class="tag-field">' +
          '<span class="mini-label">2. 给 TA 留下几个章</span>' +
          '<div class="review-tag-list">' + tags.map(function (tag) {
            return '<button type="button" class="review-tag' + (reviewDraft.tags.indexOf(tag) !== -1 ? ' is-active' : '') + '" data-action="toggle-review-tag" data-tag="' + escapeHtml(tag) + '" aria-pressed="' + (reviewDraft.tags.indexOf(tag) !== -1) + '">' + escapeHtml(tag) + '</button>';
          }).join('') + '</div>' +
        '</div>' +
        '<label class="field field--wide"><span>3. 想留下一句话吗？<small>选填</small></span><textarea name="review-note" rows="3" maxlength="140" placeholder="例如：把复杂的东西讲得很轻，作业也改得很细。"></textarea></label>' +
        '<div class="modal-actions">' +
          '<p class="modal-actions__note">' + icon('lock') + '演示环境只保存你填写的评价，不会公开发布。</p>' +
          '<div class="button-row">' +
            '<button type="button" class="btn btn--ghost" data-action="close-modal">稍后再说</button>' +
            '<button type="submit" class="btn btn--primary">提交评价' + icon('check') + '</button>' +
          '</div>' +
        '</div>' +
      '</form>',
      'modal--review'
    );
    const note = modalRoot.querySelector('[name="review-note"]');
    if (note && exchange.reviewByMe) note.value = exchange.reviewByMe.note || '';
  }

  function setRating(value) {
    reviewDraft.stars = value;
    const buttons = modalRoot.querySelectorAll('.star-button');
    buttons.forEach(function (button) {
      const buttonValue = Number(button.getAttribute('data-value'));
      button.classList.toggle('is-active', buttonValue <= value);
      button.setAttribute('aria-pressed', String(buttonValue === value));
    });
    const hint = modalRoot.querySelector('.rating-hint');
    if (hint) hint.textContent = ['', '有点可惜', '一般', '不错', '很好', '非常值得'][value] || '';
    const error = modalRoot.querySelector('.form-error');
    if (error) error.classList.add('is-hidden');
  }

  function toggleReviewTag(tag) {
    const index = reviewDraft.tags.indexOf(tag);
    if (index === -1) reviewDraft.tags.push(tag);
    else reviewDraft.tags.splice(index, 1);
    const button = modalRoot.querySelector('.review-tag[data-tag="' + tag + '"]');
    if (button) {
      button.classList.toggle('is-active', reviewDraft.tags.indexOf(tag) !== -1);
      button.setAttribute('aria-pressed', String(reviewDraft.tags.indexOf(tag) !== -1));
    }
  }

  function submitReview() {
    const exchange = findExchange(reviewDraft.exchangeId);
    if (!exchange) return;
    if (!reviewDraft.stars) {
      reviewDraft.error = '至少选择一颗星，再给这次交换盖章。';
      const error = modalRoot.querySelector('.form-error');
      if (error) {
        error.textContent = reviewDraft.error;
        error.classList.remove('is-hidden');
      }
      return;
    }
    const noteField = modalRoot.querySelector('[name="review-note"]');
    exchange.reviewByMe = {
      stars: reviewDraft.stars,
      tags: reviewDraft.tags.slice(),
      note: noteField ? noteField.value.trim() : '',
      at: todayStamp().replace(/\./g, '.')
    };
    const wasReview = exchange.status === 'review';
    exchange.status = 'completed';
    if (wasReview) {
      state.me.swaps = Number(state.me.swaps || 0) + 1;
    }
    if (!exchange.completedAt) exchange.completedAt = todayStamp().replace(/\./g, '-');
    saveState();
    closeModal(true);
    toast('评价已盖章。谢谢你认真对待这段交换。');
    renderChrome();
    renderRoute({ scroll: false });
  }

  /* ---------------------------------------------------------------------------
   * Session completion
   * ------------------------------------------------------------------------- */

  function openSessionModal(exchangeId) {
    const exchange = findExchange(exchangeId);
    if (!exchange) return;
    const session = LOGIC.nextSession(exchange);
    if (!session) {
      toast('这段交换的课程已经全部完成了。');
      return;
    }
    sessionDraft = { exchangeId: exchangeId, error: '' };
    openModal(
      modalCloseButton() +
      '<header class="modal-head">' +
        '<p class="kicker">LOG A SESSION</p>' +
        '<h2 id="modal-title">记录这一节，就算真的发生了。</h2>' +
        '<p>' + escapeHtml(session.label) + ' · ' + escapeHtml(session.topics) + '</p>' +
      '</header>' +
      '<form data-form="session" data-exchange-id="' + escapeHtml(exchange.id) + '">' +
        '<div class="session-log-head">' +
          '<span>' + icon('calendar') + escapeHtml(session.date) + '</span>' +
          '<span>' + escapeHtml(exchange.format) + '</span>' +
          '<span>' + exchange.sessionMinutes + ' 分钟</span>' +
        '</div>' +
        '<label class="field field--wide"><span>本节收获或留给对方的作业 <small>选填</small></span><textarea name="session-note" rows="3" maxlength="120" placeholder="例如：拍了一组窗光人像，下周交 3 张自选照片。"></textarea></label>' +
        '<label class="session-confirm"><input type="checkbox" name="confirmed" /><span>我们双方都完成了本节课约定的内容，并约好了下一次时间。</span></label>' +
        '<div class="form-error is-hidden" role="alert"></div>' +
        '<div class="modal-actions">' +
          '<p class="modal-actions__note">' + icon('shield') + '完成记录只用于这段交换，不会生成公开打卡。</p>' +
          '<div class="button-row">' +
            '<button type="button" class="btn btn--ghost" data-action="close-modal">取消</button>' +
            '<button type="submit" class="btn btn--primary">确认完成本节' + icon('check') + '</button>' +
          '</div>' +
        '</div>' +
      '</form>',
      'modal--session'
    );
  }

  function submitSession() {
    const exchange = findExchange(sessionDraft.exchangeId);
    if (!exchange) return;
    const form = modalRoot.querySelector('[data-form="session"]');
    const confirmed = form.querySelector('[name="confirmed"]').checked;
    const noteField = form.querySelector('[name="session-note"]');
    const error = form.querySelector('.form-error');
    if (!confirmed) {
      error.textContent = '勾选确认后，才能记录这一节完成。';
      error.classList.remove('is-hidden');
      return;
    }
    const session = LOGIC.nextSession(exchange);
    if (!session) return;
    session.done = true;
    session.note = noteField ? noteField.value.trim() : '';
    const remaining = LOGIC.nextSession(exchange);
    if (!remaining) {
      exchange.status = 'review';
      exchange.messages = (exchange.messages || []).concat([{ from: 'system', text: '全部课程已完成 · 下一步：互相评价', at: '' }]);
      toast('所有课时都完成了。现在，给彼此盖个章。');
    } else {
      exchange.messages = (exchange.messages || []).concat([{ from: 'system', text: '已完成一节 · 下一节 ' + remaining.date, at: '' }]);
      toast('本节已记录。下一节见。');
    }
    saveState();
    closeModal(true);
    renderChrome();
    renderRoute({ scroll: false });
  }

  /* ---------------------------------------------------------------------------
   * Information modals
   * ------------------------------------------------------------------------- */

  function openTimecoinModal() {
    openModal(
      modalCloseButton() +
      '<header class="modal-head">' +
        '<p class="kicker">TIME BANK / 时间银行</p>' +
        '<h2 id="modal-title">时间币，让错位的交换继续发生。</h2>' +
        '<p>如果没有刚好互补的人，不代表你学不到。先把愿意分享的一小时存起来，未来再花在想学的事情上。</p>' +
      '</header>' +
      '<div class="timecoin-modal">' +
        '<div class="timecoin-balance"><span class="coin-stamp coin-stamp--xl">' + icon('coin') + '</span><div><span>你当前的时间币</span><strong>' + formatCoins(state.me.coins) + '<small> h</small></strong></div></div>' +
        '<div class="timecoin-rules">' +
          '<div><span>+1 h</span><p>教别人 1 小时，存入 1 时间币</p></div>' +
          '<div><span>−1 h</span><p>向别人学 1 小时，支出 1 时间币</p></div>' +
          '<div><span>1 = 1</span><p>所有技能等值。摄影不会比瑜伽更贵。</p></div>' +
          '<div><span>不可购</span><p>时间币不能购买、提现或转让，只来自真实的教与学。</p></div>' +
        '</div>' +
        '<div class="timecoin-example">' +
          '<p class="mini-label">EXAMPLE / 一个错位的例子</p>' +
          '<p>橙子想学咖啡拉花，但没有你想学的技能；她会西语，而你想学西语。你先教她一小时拉花，存下 1 时间币，再用它向橙子学一小时西语。一次不完美的互补，也能变成两小时的交换。</p>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn--ghost" data-action="go-notes-coins">看完整的商业思考</button>' +
        '<button type="button" class="btn btn--primary" data-action="open-peer" data-peer-id="chengzi">去橙子那里换一节课' + icon('arrowRight') + '</button>' +
      '</div>',
      'modal--timecoin'
    );
  }

  function openSalonModal() {
    openModal(
      modalCloseButton() +
      '<header class="modal-head">' +
        '<p class="kicker">SWAP SALON / 交换局</p>' +
        '<h2 id="modal-title">把两个人换，变成一张桌子的人一起换。</h2>' +
        '<p>交换局是一对一之外的社区层。适合刚入门、还没找到特定搭子，或者想一次见到更多技能的人。</p>' +
      '</header>' +
      '<div class="salon-modal-grid">' +
        '<div class="salon-agenda">' +
          '<h3>一场交换局的样子</h3>' +
          '<div><span>01</span><p><b>交换名片 · 20 分钟</b>每人用 30 秒说清：我能教什么、最近想学什么。</p></div>' +
          '<div><span>02</span><p><b>两轮迷你交换 · 各 15 分钟</b>轮桌进行，对方现场教你一件能马上上手的小事。</p></div>' +
          '<div><span>03</span><p><b>约下一次 · 10 分钟</b>散场前，把想继续的一对一交换约进工作台。</p></div>' +
        '</div>' +
        '<div class="salon-side">' +
          '<p class="mini-label">WHY IT MATTERS / 为什么需要</p>' +
          '<p>冷门技能往往不是没人会，而是没有被看见。交换局用线下密度降低发现成本，也让「教」这件事第一次变得不那么正式。</p>' +
          '<div class="salon-status"><span class="status-pill status-pill--muted"><i></i>概念中</span><p>页面里的场次与地点仅为示意，不开放报名。真实上线前还需要场地合作、活动安全与审核机制。</p></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn--primary" data-action="close-modal">知道了</button>' +
      '</div>',
      'modal--salon'
    );
  }

  /* ---------------------------------------------------------------------------
   * Skill editing helpers
   * ------------------------------------------------------------------------- */

  function addSkillFromSelect(list) {
    collectEditForm();
    const select = modalRoot.querySelector('[data-skill-select="' + list + '"]');
    const skillId = select ? select.value : '';
    if (!skillId) {
      toast('先在技能库里选一项，再点添加。');
      return;
    }
    const target = list === 'teaches' ? editDraft.teaches : editDraft.wants;
    if (target.length >= 5) {
      toast('每一边最多 5 项，先删掉一项再加。');
      return;
    }
    if (target.some(function (item) { return item.skill === skillId; })) {
      toast('这项技能已经在名单里了。');
      return;
    }
    const skill = DATA.skills.filter(function (item) { return item.id === skillId; })[0];
    if (list === 'teaches') {
      target.push({
        skill: skillId,
        outcome: '带你完成一件可以展示的小作品'
      });
    } else {
      target.push({
        skill: skillId,
        note: '希望能稳定入门，并有人陪着练'
      });
    }
    editDraft.error = '';
    renderEditModal();
    toast((skill ? skill.label : '技能') + '已加入「' + (list === 'teaches' ? '我能教' : '我想学') + '」。');
  }

  function removeSkillFromList(list, index) {
    collectEditForm();
    const target = list === 'teaches' ? editDraft.teaches : editDraft.wants;
    if (index >= 0 && index < target.length) {
      target.splice(index, 1);
      editDraft.error = '';
      renderEditModal();
    }
  }

  /* ---------------------------------------------------------------------------
   * Discovery controls & chat
   * ------------------------------------------------------------------------- */

  function syncDiscoveryControls() {
    const search = document.getElementById('peer-search');
    if (search) search.value = ui.query;
    const format = document.getElementById('peer-format');
    if (format) format.value = ui.format;
    const sort = document.getElementById('peer-sort');
    if (sort) sort.value = ui.sort;
    const onlyDouble = document.getElementById('only-double');
    if (onlyDouble) onlyDouble.checked = ui.onlyDouble;
  }

  function clearFilters() {
    ui = Object.assign({}, DEFAULT_UI);
    syncDiscoveryControls();
    refreshDiscoveryGrid();
  }

  function submitChat(form) {
    const exchangeId = form.getAttribute('data-exchange-id');
    const exchange = findExchange(exchangeId);
    if (!exchange) return;
    const input = form.querySelector('[name="message"]');
    const text = input ? input.value.trim() : '';
    if (!text) {
      if (input) input.focus();
      return;
    }
    exchange.messages = exchange.messages || [];
    exchange.messages.push({ from: 'me', text: text, at: messageStamp() });
    saveState();
    renderRoute({ scroll: false });
    const nextInput = document.querySelector('.chat-form [name="message"]');
    if (nextInput) nextInput.focus({ preventScroll: true });
    restoreChatScroll();
  }

  /* ---------------------------------------------------------------------------
   * Events
   * ------------------------------------------------------------------------- */

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;
      const action = trigger.getAttribute('data-action');
      const peerId = trigger.getAttribute('data-peer-id');
      const exchangeId = trigger.getAttribute('data-exchange-id');

      if (trigger.tagName === 'A' && action !== 'open-peer') {
        event.preventDefault();
      }

      switch (action) {
        case 'close-modal':
          closeModal();
          break;
        case 'go-home-top':
          navigate('#/');
          window.scrollTo({ top: 0, behavior: 'auto' });
          break;
        case 'nav-discover':
        case 'go-home-discover':
          closeModal(true);
          goDiscover();
          break;
        case 'go-workbench':
          closeModal(true);
          navigate('#/exchanges/' + (trigger.getAttribute('data-tab') || 'all'));
          break;
        case 'go-exchange':
          if (!exchangeId) break;
          closeModal(true);
          navigate('#/exchange/' + exchangeId);
          break;
        case 'scroll-to': {
          const targetId = trigger.getAttribute('data-target');
          const node = targetId ? document.getElementById(targetId) : null;
          if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
        case 'open-peer':
          if (peerId) openPeerModal(peerId);
          break;
        case 'open-edit-profile':
          openEditModal();
          break;
        case 'open-proposal':
          if (peerId) openProposalModal(peerId);
          break;
        case 'open-timecoin':
          openTimecoinModal();
          break;
        case 'open-salon':
          openSalonModal();
          break;
        case 'go-notes-coins':
          closeModal(true);
          navigate('#/notes', { target: 'note-coins' });
          break;
        case 'accept-proposal':
          if (exchangeId) openAcceptModal(exchangeId);
          break;
        case 'decline-proposal':
          if (exchangeId) declineExchange(exchangeId);
          break;
        case 'withdraw-proposal':
          if (exchangeId) withdrawProposal(exchangeId);
          break;
        case 'confirm-accept':
          if (exchangeId) acceptExchange(exchangeId);
          break;
        case 'confirm-modal':
          runConfirmedAction();
          break;
        case 'open-session':
          if (exchangeId) openSessionModal(exchangeId);
          break;
        case 'open-review':
          if (exchangeId) openReviewModal(exchangeId);
          break;
        case 'set-rating':
          setRating(Number(trigger.getAttribute('data-value')));
          break;
        case 'toggle-review-tag':
          toggleReviewTag(trigger.getAttribute('data-tag'));
          break;
        case 'filter-category':
          ui.category = trigger.getAttribute('data-category') || 'all';
          refreshDiscoveryGrid();
          break;
        case 'clear-filters':
          clearFilters();
          break;
        case 'edit-add-skill':
          addSkillFromSelect(trigger.getAttribute('data-list'));
          break;
        case 'edit-remove-skill':
          removeSkillFromList(trigger.getAttribute('data-list'), Number(trigger.getAttribute('data-index')));
          break;
        case 'proposal-next':
          nextProposalStep();
          break;
        case 'proposal-back':
          backProposalStep();
          break;
        case 'proposal-submit':
          submitProposal();
          break;
        case 'reset-demo':
          openConfirmModal({
            title: '恢复初始演示数据？',
            body: '你改过的名片、发出的提案、聊天和评价都会被清除，回到最初可评审的状态。',
            confirmLabel: '恢复初始状态',
            onConfirm: resetDemo
          });
          break;
        default:
          break;
      }
    });

    document.addEventListener('submit', function (event) {
      const form = event.target;
      const kind = form.getAttribute('data-form');
      if (!kind) return;
      event.preventDefault();
      if (kind === 'chat') submitChat(form);
      else if (kind === 'profile-edit') {
        collectEditForm();
        saveProfile();
      } else if (kind === 'review') submitReview();
      else if (kind === 'session') submitSession();
    });

    document.addEventListener('input', function (event) {
      if (event.target.id === 'peer-search') {
        ui.query = event.target.value.trim();
        refreshDiscoveryGrid();
      }
    });

    document.addEventListener('change', function (event) {
      if (event.target.id === 'peer-format') {
        ui.format = event.target.value;
        refreshDiscoveryGrid();
      } else if (event.target.id === 'peer-sort') {
        ui.sort = event.target.value;
        refreshDiscoveryGrid();
      } else if (event.target.id === 'only-double') {
        ui.onlyDouble = event.target.checked;
        refreshDiscoveryGrid();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalOpen()) {
        event.preventDefault();
        closeModal();
        return;
      }
      focusTrap(event);

      if (event.key === '/' && !modalOpen()) {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          const search = document.getElementById('peer-search');
          if (search) {
            event.preventDefault();
            search.focus();
            if (currentRoute().name !== 'home') search.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }

      const active = document.activeElement;
      if (active && active.classList && active.classList.contains('peer-card') && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        active.click();
      }
    });

    window.addEventListener('hashchange', function () {
      renderRoute();
    });
  }

})();

