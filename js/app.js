/* Lease Coach: router, tab bar, install prompt, service worker. */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;

  const TABS = [
    { id: 'home', label: 'Home', icon: 'home', title: 'Lease Coach', sub: 'Telluride vs Palisade \u00b7 Deerfield Beach, FL' },
    { id: 'target', label: 'Targets', icon: 'target', title: 'Your target deal', sub: 'What a good lease looks like' },
    { id: 'check', label: 'Check', icon: 'calc', title: 'Check an offer', sub: 'Is this quote any good?' },
    { id: 'playbook', label: 'Playbook', icon: 'book', title: 'Negotiation playbook', sub: 'Prepare, ask, negotiate' },
    { id: 'offers', label: 'Offers', icon: 'clip', title: 'Offers & dealers', sub: 'Compare quotes side by side' }
  ];

  const viewEl = document.getElementById('view');
  const slot = document.getElementById('sticky-slot');
  const tabbar = document.getElementById('tabbar');
  let current = null;

  function parseHash() {
    const parts = (location.hash || '#/home').replace(/^#\/?/, '').split('/');
    return { tab: parts[0] || 'home', param: parts[1] || null };
  }
  function go(tab, param) {
    const target = '#/' + tab + (param ? '/' + param : '');
    if (location.hash === target) render(); else location.hash = target;
  }

  function setSticky(node) {
    ui.clear(slot);
    slot.appendChild(node);
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--sticky-h', (node.offsetHeight + 8) + 'px');
    });
  }
  function clearSticky() {
    ui.clear(slot);
    document.documentElement.style.setProperty('--sticky-h', '0px');
  }

  function buildTabs() {
    ui.clear(tabbar);
    TABS.forEach((t) => {
      const btn = h('button', { class: 'tab', type: 'button', dataset: { tab: t.id }, 'aria-label': t.label, onclick: () => go(t.id) }, ui.icon(t.icon, 24), h('span', null, t.label));
      if (t.id === 'offers' && store.state.offers.length) btn.appendChild(h('span', { class: 'dot' }, String(store.state.offers.length)));
      tabbar.appendChild(btn);
    });
  }
  function markTab(id) {
    ui.$$('.tab', tabbar).forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
  }

  function render() {
    const route = parseHash();
    const def = TABS.find((t) => t.id === route.tab) || TABS[0];
    if (current && typeof current.cleanup === 'function') { try { current.cleanup(); } catch (e) { /* ignore */ } }
    ui.clear(viewEl);
    clearSticky();
    document.getElementById('appbar-title').textContent = def.title;
    document.getElementById('appbar-sub').textContent = def.sub;
    markTab(def.id);
    current = LC.views[def.id].render(viewEl, route.param) || {};
    viewEl.scrollTop = 0;
  }

  function applyTheme() {
    const t = store.state.settings.theme || 'auto';
    document.documentElement.setAttribute('data-theme', t);
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0a2a34' : '#0b3c49');
  }

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function welcome() {
    if (store.state.ui.welcomed) return;
    const s = ui.openSheet({
      title: 'Welcome to Lease Coach',
      onClose: () => { store.state.ui.welcomed = true; store.save(); },
      body: [
        h('p', null, 'Built to help you lease a ', h('b', null, 'Kia Telluride'), ' or ', h('b', null, 'Hyundai Palisade'), ' at a fair price in South Florida.'),
        h('ul', null,
          h('li', null, h('b', null, 'Targets: '), 'what a great, good and walk-away deal looks like for each trim.'),
          h('li', null, h('b', null, 'Check: '), 'enter any quote to get a grade, the red flags and exactly what to push back on.'),
          h('li', null, h('b', null, 'Playbook: '), 'checklists, questions, tactics and copy-ready emails.'),
          h('li', null, h('b', null, 'Offers: '), 'log every dealer quote and compare true monthly cost.')),
        ui.banner('warn', 'alert', [h('b', null, 'Targets are estimates. '), 'They use Oct 2026 market data and typical lender numbers. Verify the real money factor and residual (Playbook > Prepare) and enter them under Targets > Edit program numbers to sharpen every result.']),
        h('p', { class: 'muted small' }, 'Everything you enter stays on this device. Nothing is sent anywhere.'),
        h('button', { class: 'btn block', type: 'button', onclick: () => s.close() }, 'Get started')
      ]
    });
  }

  // Android/Chrome install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    LC.app.installPrompt = e;
    if (parseHash().tab === 'home') render();
  });
  window.addEventListener('appinstalled', () => { LC.app.installPrompt = null; ui.toast('Installed'); });

  // Start a fresh Check. Asks first when the current check has numbers in it.
  function newCheck(mutate) {
    const st = store.state;
    const start = () => {
      st.calc = store.freshCalc();
      if (mutate) mutate(st.calc);
      store.save();
      go('check', 'offer');
    };
    if (store.calcHasData(st.calc)) ui.confirmSheet('Start a new check?', 'This replaces the numbers in your current check. Saved offers are not affected.', 'Start new', start);
    else start();
  }

  LC.app = { TABS, go, render, setSticky, clearSticky, applyTheme, isStandalone, newCheck, installPrompt: null, refreshTabs: buildTabs };

  document.getElementById('btn-settings').appendChild(ui.icon('sliders', 22));
  document.getElementById('btn-settings').addEventListener('click', () => LC.views.settings.open());
  window.addEventListener('hashchange', render);
  store.subscribe(() => {
    const dot = tabbar.querySelector('[data-tab="offers"] .dot');
    const n = store.state.offers.length;
    if ((dot ? Number(dot.textContent) : 0) !== n) { const on = tabbar.querySelector('.tab.on'); buildTabs(); if (on) markTab(on.dataset.tab); }
  });

  applyTheme();
  buildTabs();
  render();
  welcome();

  // Offline support. On localhost the worker is skipped (to avoid stale files while developing) unless ?sw=1 is in the URL.
  const devHost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]sw=1/.test(location.search);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    if (devHost) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      if (window.caches) caches.keys().then((ks) => ks.forEach((k) => { if (k.indexOf('lease-coach-') === 0) caches.delete(k); })).catch(() => {});
    } else {
      window.addEventListener('load', () => {
        const hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.register('sw.js').catch(() => {});
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hadController) ui.toast('Updated. Close and reopen the app for the newest version.', 4500);
        });
      });
    }
  }
})();
