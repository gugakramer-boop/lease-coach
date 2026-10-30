/* Lease Coach: UI helpers (DOM builder, icons, form controls, toasts, sheets). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  const calc = LC.calc;

  // ---------- DOM builder ----------
  function append(el, kids) {
    kids.forEach((k) => {
      if (k === null || k === undefined || k === false) return;
      if (Array.isArray(k)) append(el, k);
      else if (k instanceof Node) el.appendChild(k);
      else el.appendChild(document.createTextNode(String(k)));
    });
  }
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
    }
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  // ---------- icons (stroke style) ----------
  const P = {
    home: '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>',
    trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><path d="M7 7h.01"/>',
    dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    car: '<path d="M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6M3 13v4a1 1 0 0 0 1 1h1.5M21 13v4a1 1 0 0 1-1 1h-1.5M3 13h18M8 18h8"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    cols: '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>',
    mile: '<path d="M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 13l4-4M7.5 16.5h.01M12 7h.01M16.5 16.5h.01M6 12h.01M18 12h.01"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>'
  };
  function icon(name, size) {
    const s = size || 20;
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
    return wrap.firstChild;
  }

  // ---------- formatting ----------
  const nf = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmt = {
    usd(n, d) { if (n === null || n === undefined || !Number.isFinite(n)) return '\u2014'; const x = Math.abs(n); const s = nf(x, d || 0); return (n < 0 && Math.round(x * Math.pow(10, d || 0)) !== 0 ? '-$' : '$') + s; },
    num(n, d) { return Number.isFinite(n) ? nf(n, d || 0) : '\u2014'; },
    pct(n, d) { return Number.isFinite(n) ? nf(n, d == null ? 1 : d) + '%' : '\u2014'; },
    mf(n) { return Number.isFinite(n) ? n.toFixed(5) : '\u2014'; },
    date(ts) { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); },
    delta(n) { return (n > 0 ? '+' : n < 0 ? '-' : '') + fmt.usd(Math.abs(n)); }
  };
  const toneOf = (score) => (score >= 80 ? 'good' : score >= 68 ? 'warn' : 'bad');

  // Minimal rich text: escapes HTML, then **bold**, [text](url) and newlines.
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function rich(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  }
  const richEl = (tag, cls, s) => h(tag, { class: cls, html: rich(s) });

  // ---------- toast / clipboard / share ----------
  let toastTimer = null;
  function toast(msg, ms) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2000);
  }
  function copyText(text, okMsg) {
    const done = () => toast(okMsg || 'Copied');
    const fallback = () => {
      const ta = h('textarea', { style: { position: 'fixed', opacity: '0', top: '0' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed. Select the text and copy it manually.', 3000); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function shareText(title, text) {
    if (navigator.share) navigator.share({ title, text }).catch(() => {});
    else copyText(text, 'Copied (sharing is not available here)');
  }
  function downloadFile(name, text, type) {
    const blob = new Blob([text], { type: type || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  // ---------- form controls ----------
  let uidN = 0;
  const nextId = () => 'f' + (++uidN);

  /* Numeric input. value === null means "auto": the field shows `auto` with an "est." badge. */
  function numInput(o) {
    const id = nextId();
    const dec = o.decimals || 0;
    const grouping = o.group !== false;
    const text = (n) => { const x = o.toInput ? o.toInput(n) : n; return grouping ? nf(x, dec) : Number(x).toFixed(dec); };
    const input = h('input', {
      class: 'input' + (o.prefix ? ' has-pre' : '') + (o.suffix ? ' has-suf' : ''),
      id, type: 'text', inputmode: o.inputmode || 'decimal', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      placeholder: o.placeholder || '', enterkeyhint: 'done'
    });
    const badge = h('span', { class: 'est', title: 'Estimated value. Type to replace it.' }, 'est.');
    badge.hidden = true;
    const hint = h('div', { class: 'hint' });
    let value = o.value;
    let auto = o.auto;

    function show() {
      const isAuto = value === null || value === undefined || value === '';
      input.value = isAuto ? (auto !== null && auto !== undefined ? text(auto) : '') : text(value);
      badge.hidden = !(isAuto && auto !== null && auto !== undefined && o.showEst !== false);
    }
    input.addEventListener('focus', () => { setTimeout(() => { try { input.select(); } catch (e) { /* ignore */ } }, 0); });
    input.addEventListener('input', () => {
      const raw = input.value.trim();
      if (raw === '') { value = null; badge.hidden = !(auto !== null && auto !== undefined && o.showEst !== false); o.onChange && o.onChange(null); return; }
      const n = calc.num(raw, NaN);
      if (Number.isNaN(n)) return;
      value = o.fromInput ? o.fromInput(n) : n;
      badge.hidden = true;
      o.onChange && o.onChange(value);
    });
    input.addEventListener('blur', show);
    show();

    const box = h('div', { class: 'input-wrap' },
      o.prefix ? h('span', { class: 'adorn pre' }, o.prefix) : null, input, o.suffix ? h('span', { class: 'adorn suf' }, o.suffix) : null);
    const el = h('div', { class: 'field' }, h('label', { for: id }, o.label, badge), box, hint);
    if (o.hint) hint.innerHTML = rich(o.hint);
    return {
      el, input,
      set(v, a) { value = v; auto = a; show(); },
      setHint(t) { hint.innerHTML = t ? rich(t) : ''; },
      setHintNode(n) { clear(hint); hint.appendChild(n); }
    };
  }

  function seg(options, value, onChange) {
    const el = h('div', { class: 'seg', role: 'tablist' });
    const btns = options.map((o) => h('button', { type: 'button', role: 'tab', class: o.v === value ? 'on' : '', onclick: () => { set(o.v); onChange(o.v); } }, o.label));
    btns.forEach((b) => el.appendChild(b));
    function set(v) { options.forEach((o, i) => btns[i].classList.toggle('on', o.v === v)); }
    el.set = set;
    return el;
  }
  function chips(options, value, onChange) {
    const el = h('div', { class: 'chips' });
    const btns = options.map((o) => h('button', { type: 'button', class: 'chip' + (o.v === value ? ' on' : ''), onclick: () => { set(o.v); onChange(o.v); } }, o.label));
    btns.forEach((b) => el.appendChild(b));
    function set(v) { options.forEach((o, i) => btns[i].classList.toggle('on', o.v === v)); }
    el.set = set;
    return el;
  }
  function selectField(o) {
    const id = nextId();
    const sel = h('select', { class: 'input', id, onchange: () => o.onChange(sel.value) },
      o.options.map((op) => h('option', { value: op.v, selected: op.v === o.value }, op.label)));
    return { el: h('div', { class: 'field' }, o.label ? h('label', { for: id }, o.label) : null, sel), select: sel };
  }
  function textField(o) {
    const id = nextId();
    const input = o.multiline
      ? h('textarea', { class: 'input', id, rows: o.rows || 3, placeholder: o.placeholder || '' })
      : h('input', { class: 'input', id, type: o.type || 'text', placeholder: o.placeholder || '', autocomplete: o.autocomplete || 'off', inputmode: o.inputmode });
    input.value = o.value || '';
    input.addEventListener('input', () => o.onChange && o.onChange(input.value));
    return { el: h('div', { class: 'field' }, o.label ? h('label', { for: id }, o.label) : null, input), input };
  }
  function toggle(label, value, onChange, sub) {
    const btn = h('button', { type: 'button', class: value ? 'on' : '', role: 'switch', 'aria-checked': String(!!value), 'aria-label': label });
    btn.addEventListener('click', () => {
      const on = !btn.classList.contains('on');
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-checked', String(on));
      onChange(on);
    });
    return h('div', { class: 'switch' }, h('div', null, h('div', { style: { fontWeight: '600' } }, label), sub ? h('div', { class: 'hint' }, sub) : null), btn);
  }

  // ---------- containers ----------
  const card = (title, kids, cls) => h('section', { class: 'card' + (cls ? ' ' + cls : '') }, title ? h('h2', null, title) : null, kids);
  function accordion(title, body, o) {
    o = o || {};
    return h('details', { class: 'acc', open: !!o.open, id: o.id },
      h('summary', null, o.icon ? icon(o.icon, 20) : null, h('div', { class: 'grow' }, h('div', null, title), o.sub ? h('div', { class: 'acc-sub' }, o.sub) : null), h('span', { class: 'chev' }, icon('chev', 20))),
      h('div', { class: 'acc-b' }, body));
  }
  function banner(tone, iconName, kids) {
    return h('div', { class: 'banner ' + tone }, icon(iconName, 20), h('div', null, kids));
  }
  const pill = (text, tone) => h('span', { class: 'pill' + (tone ? ' ' + tone : '') }, text);
  const kv = (k, v, cls) => h('div', { class: 'kv' + (cls ? ' ' + cls : '') }, h('span', null, k), h('span', null, v));
  const progress = (frac) => h('div', { class: 'progress' }, h('i', { style: { width: Math.round(clampN(frac, 0, 1) * 100) + '%' } }));
  const clampN = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  function grade(g, tone, score, small) {
    return h('div', { class: 'grade ' + tone + (small ? ' sm' : ''), 'aria-label': 'Grade ' + g }, g, score == null ? null : h('small', null, score + '/100'));
  }
  function empty(iconName, text) { return h('div', { class: 'empty' }, icon(iconName, 40), h('div', null, text)); }

  // ---------- bottom sheet ----------
  function openSheet(o) {
    const root = document.getElementById('modal-root');
    const body = h('div', { class: 'sheet-b' }, o.body);
    const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) close(); } },
      h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title },
        h('div', { class: 'sheet-h' }, h('h3', null, o.title), h('button', { class: 'x-btn', type: 'button', 'aria-label': 'Close', onclick: () => close() }, icon('x', 18))), body));
    function onKey(e) { if (e.key === 'Escape') close(); }
    function close() { document.removeEventListener('keydown', onKey); if (back.parentNode) back.parentNode.removeChild(back); o.onClose && o.onClose(); }
    document.addEventListener('keydown', onKey);
    root.appendChild(back);
    return { close, body };
  }
  function confirmSheet(title, message, okLabel, onOk, danger) {
    const s = openSheet({
      title,
      body: [h('p', null, message), h('div', { class: 'btn-row' },
        h('button', { class: 'btn secondary', type: 'button', onclick: () => s.close() }, 'Cancel'),
        h('button', { class: 'btn' + (danger ? ' danger' : ''), type: 'button', onclick: () => { s.close(); onOk(); } }, okLabel))]
    });
    return s;
  }

  LC.ui = {
    h, $, $$, clear, icon, fmt, toneOf, esc, rich, richEl, toast, copyText, shareText, downloadFile,
    numInput, seg, chips, selectField, textField, toggle, card, accordion, banner, pill, kv, progress, grade, empty,
    openSheet, confirmSheet
  };
})();
