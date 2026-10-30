/* Lease Coach: Home view. */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;
  const fmt = ui.fmt;
  const data = LC.data;

  function daysLeftInMonth(now) {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((end - today) / 86400000);
  }

  function timingBanners() {
    const out = [];
    const now = new Date();
    const left = daysLeftInMonth(now);
    const ends = new Date(data.programEnds + 'T23:59:59');
    const progDays = Math.ceil((ends - now) / 86400000);
    if (progDays >= 0 && progDays <= 14) {
      out.push(ui.banner('warn', 'clock', [h('b', null, 'October offers reportedly end Nov 2. '), 'A quote today may be re-priced when new programs start. Ask which program month a quote uses and get it in writing.']));
    }
    if (left <= 3) {
      out.push(ui.banner('good', 'cal', [h('b', null, 'Month-end is ' + (left === 0 ? 'today' : left === 1 ? 'tomorrow' : 'in ' + left + ' days') + '. '), 'Dealers are chasing volume bonuses, so leverage is at its peak. Have written quotes ready and be prepared to decide.']));
    } else {
      out.push(ui.banner('info', 'cal', [h('b', null, 'Best leverage: the last 3 days of the month '), '(' + left + ' days away). Use the time to collect written quotes.']));
    }
    return out;
  }

  function targetCard(v) {
    const st = store.state;
    const tid = st.target.trims[v.id];
    const trim = store.trim(v.id, tid);
    const tg = store.targetsFor(v.id, tid);
    const great = tg.tiers.great.result, good = tg.tiers.good.result, walk = tg.tiers.walk.result;
    return h('section', { class: 'card' },
      h('div', { class: 'row top between' },
        h('div', { class: 'grow' }, h('h2', { style: { marginBottom: '2px', fontSize: '18px' } }, v.name), h('div', { class: 'muted small' }, v.year + ' ' + trim.name + ' \u00b7 ' + fmt.usd(tg.ref.msrp) + ' MSRP')),
        ui.pill(tg.ref.term + ' mo / ' + fmt.num(tg.ref.miles) + ' mi', 'info')),
      h('div', { class: 'stats mt' },
        h('div', { class: 'stat' }, h('div', { class: 'v', style: { color: 'var(--good)' } }, fmt.usd(great.monthly)), h('div', { class: 'l' }, 'Great')),
        h('div', { class: 'stat' }, h('div', { class: 'v', style: { color: 'var(--info)' } }, fmt.usd(good.monthly)), h('div', { class: 'l' }, 'Good')),
        h('div', { class: 'stat' }, h('div', { class: 'v', style: { color: 'var(--warn)' } }, fmt.usd(walk.monthly)), h('div', { class: 'l' }, 'Walk-away'))),
      h('div', { class: 'muted small center mt-s' }, 'Per month with tax \u00b7 ' + fmt.usd(good.das) + ' due at signing at Good (' + (st.target.struct === 'sd' ? 'fees rolled in' : 'fees at signing') + ')'),
      h('div', { class: 'btn-row mt' },
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => { st.target.vehicleId = v.id; store.save(); LC.app.go('target'); } }, 'Targets & details'),
        h('button', { class: 'btn small', type: 'button', onclick: () => {
          st.target.vehicleId = v.id; store.save();
          LC.app.newCheck((c) => { c.vehicleId = v.id; c.trimId = st.target.trims[v.id]; });
        } }, 'Check a ' + v.name.split(' ')[1] + ' quote')));
  }

  function headToHead() {
    const tel = store.targetsFor('telluride').tiers.good.result.monthly;
    const pal = store.targetsFor('palisade').tiers.good.result.monthly;
    const diff = tel - pal;
    const msg = Math.abs(diff) < 10
      ? 'At Good targets the two are within $10 a month, so choose on how they drive and feel, and on which dealer gives the better numbers.'
      : 'At Good targets the ' + (diff > 0 ? 'Palisade' : 'Telluride') + ' comes out about ' + fmt.usd(Math.abs(diff)) + ' a month cheaper with these assumptions. Real quotes can flip it, so quote both.';
    return h('p', { class: 'muted small mb0' }, msg);
  }

  function prepProgress() {
    const checks = store.state.checks;
    const all = [];
    LC.content.prepare.forEach((p) => p.items.forEach((i) => all.push(i)));
    const done = all.filter((i) => checks[i.id]).length;
    const next = all.filter((i) => !checks[i.id]).slice(0, 4);
    const list = h('div');
    next.forEach((i) => {
      const cb = h('input', { type: 'checkbox', id: 'hc-' + i.id, 'aria-label': i.t });
      cb.addEventListener('change', () => { store.state.checks[i.id] = cb.checked; store.save(); LC.app.render(); });
      list.appendChild(h('label', { class: 'check', for: 'hc-' + i.id }, cb, h('div', { class: 'grow' }, h('div', { class: 't' }, i.t))));
    });
    return h('section', { class: 'card' },
      h('h2', null, 'Next steps', h('span', { class: 'sub' }, done + ' of ' + all.length + ' done')),
      ui.progress(done / all.length),
      next.length ? list : h('p', { class: 'mt' }, 'Everything is checked off. Nice work.'),
      h('button', { class: 'btn ghost block mt', type: 'button', onclick: () => LC.app.go('playbook', 'prepare') }, 'Open the full checklist'));
  }

  function toolsGrid() {
    const tools = [
      ['calc', 'Check an offer', 'Grade any quote', () => LC.app.go('check', 'offer')],
      ['clip', 'Compare offers', 'Side by side', () => LC.app.go('offers')],
      ['msg', 'Email scripts', 'Copy and send', () => LC.app.go('playbook', 'scripts')],
      ['search', 'Questions to ask', 'At the dealership', () => LC.app.go('playbook', 'ask')],
      ['mile', 'Miles planner', 'Pick 10k, 12k or 15k', () => LC.app.go('check', 'miles')],
      ['bolt', 'Decode a payment', 'See the hidden MF', () => LC.app.go('check', 'decode')]
    ];
    const g = h('div', { class: 'grid2' });
    tools.forEach((t) => g.appendChild(h('button', { type: 'button', class: 'card', style: { textAlign: 'left', margin: '0', cursor: 'pointer', color: 'inherit', font: 'inherit' }, onclick: t[3] },
      h('div', { style: { color: 'var(--primary)', marginBottom: '6px' } }, ui.icon(t[0], 24)), h('div', { style: { fontWeight: '800' } }, t[1]), h('div', { class: 'muted small' }, t[2]))));
    return g;
  }

  function rules() {
    return h('section', { class: 'card' },
      h('h2', null, 'Five rules that save the most'),
      h('ol', null,
        h('li', null, h('b', null, 'Price first. '), 'Settle the selling price, then the money factor, then fees. Payment comes last.'),
        h('li', null, h('b', null, 'Written quotes from 5+ dealers. '), 'Competition beats haggling.'),
        h('li', null, h('b', null, 'Compare true monthly cost, '), 'not the payment alone.'),
        h('li', null, h('b', null, 'Never pay over MSRP '), 'or for add-ons, and ask for the base money factor.'),
        h('li', null, h('b', null, 'Sign and drive. '), 'Skip big down payments: they are lost if the car is totaled.')));
  }

  function installCard() {
    if (LC.app.isStandalone()) return null;
    const body = [
      h('p', { class: 'muted' }, 'Add it to your home screen so it opens like an app and works with no signal at the dealership.'),
      h('ol', { class: 'install-steps' },
        h('li', null, h('b', null, 'iPhone (Safari): '), 'tap Share, then Add to Home Screen.'),
        h('li', null, h('b', null, 'Android (Chrome): '), 'tap the menu, then Install app.'))
    ];
    if (LC.app.installPrompt) {
      body.push(h('button', { class: 'btn block', type: 'button', onclick: () => {
        const p = LC.app.installPrompt; p.prompt(); p.userChoice.finally(() => { LC.app.installPrompt = null; LC.app.render(); });
      } }, 'Install now'));
    }
    return h('section', { class: 'card' }, h('h2', null, ui.icon('download', 20), 'Install on your phone'), body);
  }

  LC.views.home = {
    render(root) {
      root.appendChild(h('section', { class: 'card hero' },
        h('h2', { style: { fontSize: '22px' } }, 'Your lease game plan'),
        h('p', { class: 'muted', style: { margin: '6px 0 12px' } }, 'Top-trim Telluride vs Palisade, tuned for Deerfield Beach. Numbers as of ' + data.asOfLabel + '.'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', style: { background: '#fff', color: '#0b3c49' }, type: 'button', onclick: () => LC.app.go('target') }, 'See my targets'),
          h('button', { class: 'btn', style: { background: 'rgba(255,255,255,.18)', color: '#fff' }, type: 'button', onclick: () => LC.app.go('check', 'offer') }, 'Check a quote'))));
      timingBanners().forEach((b) => root.appendChild(b));
      root.appendChild(h('div', { class: 'section-title' }, 'Your targets at a glance'));
      data.vehicles.forEach((v) => root.appendChild(targetCard(v)));
      root.appendChild(h('div', { class: 'card flat' }, headToHead()));
      root.appendChild(h('div', { class: 'section-title' }, 'Your prep'));
      root.appendChild(prepProgress());
      root.appendChild(h('div', { class: 'section-title' }, 'Tools'));
      root.appendChild(toolsGrid());
      root.appendChild(h('div', { class: 'section-title' }, 'The short version'));
      root.appendChild(rules());
      const inst = installCard();
      if (inst) root.appendChild(inst);
      root.appendChild(h('p', { class: 'muted small center' }, 'Estimates for planning only. Verify every figure against your dealer worksheet and lender contract.'));
    }
  };
})();
