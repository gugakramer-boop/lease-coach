/* Lease Coach: settings sheet (profile, tax, theme, backup, about). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;

  const VERSION = '1.0.0';

  function open() {
    const st = store.state;
    const p = st.profile;
    const body = [];

    const name = ui.textField({ label: 'Your name (used in scripts)', value: p.name, autocomplete: 'name', onChange: (x) => { p.name = x; store.save(); } });
    const phone = ui.textField({ label: 'Phone', value: p.phone, type: 'tel', autocomplete: 'tel', onChange: (x) => { p.phone = x; store.save(); } });
    const email = ui.textField({ label: 'Email', value: p.email, type: 'email', autocomplete: 'email', onChange: (x) => { p.email = x; store.save(); } });
    const planned = ui.numInput({ label: 'Planned miles per year', value: p.plannedMiles || null, auto: null, placeholder: 'Not set', onChange: (x) => { p.plannedMiles = x || 0; store.save(); }, hint: 'Check warns you when a quote allows fewer miles than this. The Miles planner can set it for you.' });
    const tax = ui.numInput({ label: 'Sales tax rate', suffix: '%', decimals: 2, value: st.settings.taxRate, auto: null, onChange: (x) => { st.settings.taxRate = x == null ? LC.data.fl.taxRate : x; store.save(); }, hint: 'Broward County: 6% state + 1% surtax = 7%.' });
    const theme = ui.seg([{ v: 'auto', label: 'Auto' }, { v: 'light', label: 'Light' }, { v: 'dark', label: 'Dark' }], st.settings.theme || 'auto', (v) => { st.settings.theme = v; store.save(); LC.app.applyTheme(); });

    body.push(h('div', { class: 'section-title', style: { margin: '4px 0 8px' } }, 'You'), name.el, h('div', { class: 'grid2' }, phone.el, email.el), planned.el, tax.el,
      h('div', { class: 'lbl' }, 'Appearance'), theme);

    // Backup and restore
    const pasted = ui.textField({ label: 'Or paste a backup here', value: '', multiline: true, rows: 3, onChange: () => {} });
    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr', id: 'import-file' });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => doImport(String(rd.result));
      rd.readAsText(f);
    });
    function doImport(text) {
      try {
        store.importJSON(text);
        ui.toast('Backup restored');
        LC.app.applyTheme();
        sheet.close();
        LC.app.refreshTabs();
        LC.app.render();
      } catch (e) {
        ui.toast(e.message || 'Could not read that backup', 3500);
      }
    }
    const stamp = new Date().toISOString().slice(0, 10);
    body.push(
      h('div', { class: 'section-title' }, 'Backup'),
      h('p', { class: 'muted small' }, 'Your quotes and checklists live only on this device. Back them up before clearing your browser or changing phones.'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.downloadFile('lease-coach-backup-' + stamp + '.json', store.exportJSON()) }, ui.icon('download', 18), 'Download'),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.copyText(store.exportJSON(), 'Backup copied') }, ui.icon('copy', 18), 'Copy'),
        h('label', { class: 'btn secondary', for: 'import-file', style: { cursor: 'pointer' } }, ui.icon('upload', 18), 'Import'), fileInput),
      h('div', { class: 'mt' }), pasted.el,
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (!pasted.input.value.trim()) { ui.toast('Paste a backup first'); return; } doImport(pasted.input.value); } }, 'Restore from pasted text'));

    body.push(
      h('div', { class: 'section-title' }, 'About'),
      h('p', { class: 'small' }, 'Lease Coach v' + VERSION + '. Reference data as of ' + LC.data.asOfLabel + '. Everything runs on this device and nothing is sent anywhere.'),
      h('p', { class: 'small muted' }, 'This app gives estimates for planning and negotiating. It is not financial or legal advice. Residuals, money factors, incentives and fees change monthly and vary by dealer and credit. Always verify against the dealer worksheet and your lease contract.'),
      h('button', { class: 'btn danger block mt', type: 'button', onclick: () => ui.confirmSheet('Erase everything?', 'This deletes your offers, checklists, settings and custom program numbers from this device.', 'Erase', () => { store.reset(); LC.app.applyTheme(); sheet.close(); LC.app.refreshTabs(); LC.app.go('home'); ui.toast('All data erased'); }, true) }, ui.icon('trash', 18), 'Erase all data'));

    const sheet = ui.openSheet({ title: 'Settings & backup', body });
  }

  LC.views.settings = { open };
})();
