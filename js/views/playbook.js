/* Lease Coach: Playbook view (prepare, ask, tactics, scripts, traps, learn). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;
  const fmt = ui.fmt;
  const content = LC.content;
  const usd = fmt.usd;

  // Fill {{placeholders}} with the user's profile and selected car.
  function vars() {
    const st = store.state;
    const t = st.target;
    const v = store.vehicle(t.vehicleId);
    const trim = store.trim(v.id, t.trims[v.id]);
    const tg = store.targetsFor(v.id, trim.id);
    const p = st.profile;
    const contact = [p.phone, p.email].filter(Boolean).join(' | ');
    return {
      car: v.year + ' ' + v.name + ' ' + trim.name, term: t.term, miles: fmt.num(t.miles), zip: data().location.zip, taxRate: st.settings.taxRate,
      name: p.name || '[Your name]', contact: contact || '[Your phone / email]',
      goodPrice: usd(tg.tiers.good.inputs.sellingPrice), baseMf: tg.ref.baseMf.toFixed(5), docFee: usd(tg.tiers.good.inputs.dealerFee), rv: tg.ref.rvPct.toFixed(1)
    };
  }
  const data = () => LC.data;
  function fill(tpl) {
    const v = vars();
    return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
  }

  // ---------------------------------------------------------------- prepare
  function prepare(body) {
    const checks = store.state.checks;
    const all = [];
    content.prepare.forEach((p) => p.items.forEach((i) => all.push(i)));
    const overallText = h('span', { class: 'sub' });
    const overallBar = h('div');
    const overall = h('section', { class: 'card' }, h('h2', null, 'Your prep checklist', overallText), overallBar);
    const phaseCounters = [];

    function refreshCounts() {
      const done = all.filter((i) => checks[i.id]).length;
      overallText.textContent = done + ' of ' + all.length;
      ui.clear(overallBar);
      overallBar.appendChild(ui.progress(done / all.length));
      phaseCounters.forEach((pc) => {
        const d = pc.phase.items.filter((i) => checks[i.id]).length;
        pc.el.textContent = pc.phase.sub + ' \u00b7 ' + d + '/' + pc.phase.items.length;
      });
    }
    body.appendChild(overall);

    let opened = false;
    content.prepare.forEach((phase) => {
      const list = h('div');
      phase.items.forEach((i) => {
        const cb = h('input', { type: 'checkbox', id: 'c-' + i.id, 'aria-label': i.t });
        cb.checked = !!checks[i.id];
        const row = h('label', { class: 'check' + (cb.checked ? ' done' : ''), for: cb.id }, cb, h('div', { class: 'grow' }, h('div', { class: 't' }, i.t), h('div', { class: 'why' }, i.why)));
        cb.addEventListener('change', () => { checks[i.id] = cb.checked; row.classList.toggle('done', cb.checked); store.save(); refreshCounts(); });
        list.appendChild(row);
      });
      const undone = phase.items.some((i) => !checks[i.id]);
      const open = !opened && undone;
      if (open) opened = true;
      const acc = ui.accordion(phase.title, list, { open, sub: phase.sub });
      phaseCounters.push({ phase, el: acc.querySelector('.acc-sub') });
      body.appendChild(acc);
    });
    refreshCounts();
  }

  // ---------------------------------------------------------------- ask
  function ask(body) {
    const asked = store.state.asked;
    const flat = [];
    content.questions.forEach((g) => g.items.forEach((q) => flat.push(q.q)));
    body.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Questions to ask'),
      h('p', { class: 'muted' }, 'Tap a group, and tick each question as you ask it. The "good answer" tells you what to listen for.'),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => ui.copyText(flat.map((q, k) => (k + 1) + '. ' + q).join('\n'), 'Questions copied') }, ui.icon('copy', 16), 'Copy all questions')));
    content.questions.forEach((g, gi) => {
      const list = h('div');
      g.items.forEach((q) => {
        const cb = h('input', { type: 'checkbox', id: 'q-' + q.id, 'aria-label': q.q });
        cb.checked = !!asked[q.id];
        const row = h('label', { class: 'check' + (cb.checked ? ' done' : ''), for: cb.id }, cb,
          h('div', { class: 'grow' }, h('div', { class: 't' }, q.q),
            h('div', { class: 'why' }, h('b', { style: { color: 'var(--good)' } }, 'Good: '), q.good),
            h('div', { class: 'why' }, h('b', { style: { color: 'var(--bad)' } }, 'Red flag: '), q.flag)));
        cb.addEventListener('change', () => { asked[q.id] = cb.checked; row.classList.toggle('done', cb.checked); store.save(); });
        list.appendChild(row);
      });
      body.appendChild(ui.accordion(g.title, list, { open: gi === 0, sub: g.items.length + ' questions' }));
    });
  }

  // ---------------------------------------------------------------- tactics
  function tactics(body) {
    body.appendChild(h('section', { class: 'card' }, h('h2', null, 'Negotiation tactics'),
      h('p', { class: 'muted mb0' }, 'Sixteen moves that work on lease deals. Each one has the words to use.')));
    content.tactics.forEach((t, k) => {
      body.appendChild(ui.accordion((k + 1) + '. ' + t.title, [
        h('p', null, h('b', null, 'The move: '), t.move),
        h('div', { class: 'say' }, h('span', { class: 'who' }, 'Say'), fill(t.say)),
        h('p', { class: 'why mb0' }, h('b', null, 'Why it works: '), t.why)
      ]));
    });
  }

  // ---------------------------------------------------------------- scripts
  function scripts(body) {
    const st = store.state;
    const p = st.profile;
    const pres = [];

    function update() { pres.forEach((x) => { x.pre.textContent = x.text(); }); }

    const vehSeg = ui.seg(LC.data.vehicles.map((v) => ({ v: v.id, label: v.name })), st.target.vehicleId, (id) => { st.target.vehicleId = id; store.save(); update(); });
    const name = ui.textField({ label: 'Your name', value: p.name, autocomplete: 'name', onChange: (x) => { p.name = x; store.save(); update(); } });
    const phone = ui.textField({ label: 'Phone', value: p.phone, type: 'tel', autocomplete: 'tel', onChange: (x) => { p.phone = x; store.save(); update(); } });
    const email = ui.textField({ label: 'Email', value: p.email, type: 'email', autocomplete: 'email', onChange: (x) => { p.email = x; store.save(); update(); } });
    body.appendChild(h('section', { class: 'card' }, h('h2', null, 'Copy-ready scripts'),
      h('p', { class: 'muted' }, 'Pick the car and add your details once. Every script fills itself in. Bracketed [text] is for you to complete.'),
      vehSeg, h('div', { class: 'mt' }), name.el, h('div', { class: 'grid2' }, phone.el, email.el)));

    content.scripts.forEach((s, k) => {
      const text = () => fill(s.body);
      const subject = () => (s.subject ? fill(s.subject) : '');
      const full = () => (s.subject ? 'Subject: ' + subject() + '\n\n' : '') + text();
      const pre = h('pre', { class: 'script' });
      pres.push({ pre, text: full });
      const actions = [
        h('button', { class: 'btn small', type: 'button', onclick: () => ui.copyText(s.subject ? text() : text(), s.subject ? 'Message copied' : 'Copied') }, ui.icon('copy', 16), s.subject ? 'Copy message' : 'Copy')
      ];
      if (s.subject) actions.push(h('button', { class: 'btn secondary small', type: 'button', onclick: () => ui.copyText(subject(), 'Subject copied') }, 'Copy subject'));
      if (s.kind === 'Email') actions.push(h('a', { class: 'btn secondary small', href: 'mailto:?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(text()) }, ui.icon('msg', 16), 'Open in Mail'));
      actions.push(h('button', { class: 'btn secondary small', type: 'button', onclick: () => ui.shareText(s.title, full()) }, ui.icon('share', 16), 'Share'));
      body.appendChild(ui.accordion(s.title, [h('div', { class: 'tag-row' }, ui.pill(s.kind, 'info')), pre, h('div', { class: 'btn-row' }, actions)], { open: k === 0 }));
    });
    update();
  }

  // ---------------------------------------------------------------- traps
  function traps(body) {
    body.appendChild(h('section', { class: 'card' }, h('h2', null, 'Know their tricks'),
      h('p', { class: 'muted mb0' }, 'The common ways a good-looking quote turns bad, and the simple response to each.')));
    content.traps.forEach((t) => {
      body.appendChild(ui.accordion(t.title, [
        h('p', null, h('b', { style: { color: 'var(--bad)' } }, 'What they do: '), t.what),
        h('p', { class: 'mb0' }, h('b', { style: { color: 'var(--good)' } }, 'Your move: '), t.counter)
      ]));
    });
  }

  // ---------------------------------------------------------------- learn
  function learn(body) {
    const L = content.learn;
    const list = (arr) => h('ul', null, arr.map((x) => ui.richEl('li', '', x)));
    const t = store.state.target;
    const v = store.vehicle(t.vehicleId);
    const trim = store.trim(v.id, t.trims[v.id]);
    const tg = store.targetsFor(v.id, trim.id);
    const g = tg.tiers.good.result;
    const k = ui.kv;

    body.appendChild(h('section', { class: 'card' }, h('h2', null, 'How a lease payment is built'), list(L.howItWorks),
      h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'Example: your Good target'),
      h('p', { class: 'hint' }, v.year + ' ' + v.name + ' ' + trim.name + ', ' + t.term + ' mo / ' + fmt.num(t.miles) + ' mi'),
      k('Gross cap cost', usd(g.grossCap)), k('Incentives', '-' + usd(g.inputs.rebates)), k('Adjusted cap cost', usd(g.adjCap), 'total'),
      k('Residual (' + g.inputs.residualPct.toFixed(1) + '%)', usd(g.residual)),
      k('Depreciation / month', usd(g.depreciation, 2)), k('Rent charge / month', usd(g.rentCharge, 2)),
      k('Pre-tax payment', usd(g.base, 2), 'total'), k('Tax', usd(g.monthlyTax, 2)), k('Monthly payment', usd(g.monthly, 2), 'total')));
    body.appendChild(ui.accordion('Florida lease essentials', list(L.florida), { icon: 'flag', open: true }));
    body.appendChild(ui.accordion('Timing: when to lease', list(L.timing), { icon: 'cal' }));
    body.appendChild(ui.accordion('Lease-end options', list(L.leaseEnd), { icon: 'refresh' }));
    body.appendChild(ui.accordion('Glossary', L.glossary.map((x) => h('div', { class: 'kv', style: { display: 'block' } }, h('b', null, x[0]), h('div', { class: 'why' }, x[1]))), { icon: 'book' }));
  }

  const SECTIONS = { prepare, ask, tactics, scripts, traps, learn };

  LC.views.playbook = {
    render(root, param) {
      const tabs = [{ v: 'prepare', label: 'Prepare' }, { v: 'ask', label: 'Ask' }, { v: 'tactics', label: 'Tactics' }, { v: 'scripts', label: 'Scripts' }, { v: 'traps', label: 'Traps' }, { v: 'learn', label: 'Learn' }];
      const active = SECTIONS[param] ? param : (store.state.ui.playbook || 'prepare');
      store.state.ui.playbook = active;
      store.save();
      const bar = ui.chips(tabs, active, (v) => LC.app.go('playbook', v));
      const body = h('div');
      root.append(bar, body);
      SECTIONS[active](body);
    }
  };
})();
