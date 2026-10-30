/* Lease Coach: Offers view (log dealer quotes, grade them, compare side by side). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;
  const fmt = ui.fmt;
  const data = LC.data;
  const adv = LC.advisor;
  const usd = fmt.usd;

  const statusLabel = (v) => (LC.views.check.STATUSES.find((s) => s.v === v) || { label: v }).label;
  const statusTone = (v) => (v === 'signed' ? 'good' : v === 'declined' ? 'bad' : v === 'final' || v === 'visit' ? 'warn' : 'info');

  function infoFor(o) {
    const v = store.vehicle(o.vehicleId);
    const trim = store.trim(o.vehicleId, o.trimId);
    const base = { short: v.name.split(' ')[1] + ' ' + trim.name.replace(' AWD', '').replace(' (V6)', ''), car: v.year + ' ' + v.name + ' ' + trim.name };
    if (o.kind === 'full' && o.calc) {
      const { ev } = store.evaluateCalc(o.calc);
      const i = ev.own.inputs;
      return Object.assign(base, {
        valid: ev.own.valid, monthly: ev.own.monthly, das: ev.own.das, trueMonthly: ev.own.trueMonthly, total: ev.own.netCost,
        score: ev.score, grade: ev.grade, tone: ui.toneOf(ev.score), term: o.calc.term, miles: o.calc.miles,
        price: i.sellingPrice, pctOff: ev.own.discountPct, mf: i.mf, residual: i.residualPct, ev
      });
    }
    const q = o.quick || { term: 36, miles: 10000, monthly: 0, das: 0 };
    const tg = store.targetsFor(o.vehicleId, o.trimId, { term: q.term, miles: q.miles, struct: 'up', cashDown: 0 });
    const bench = { great: tg.tiers.great.result, good: tg.tiers.good.result, walk: tg.tiers.walk.result };
    const valid = q.monthly > 0;
    const qs = valid ? adv.quickScore(q.monthly, q.das, q.term, bench) : { trueMonthly: 0, score: 0 };
    return Object.assign(base, {
      valid, monthly: q.monthly, das: q.das, trueMonthly: qs.trueMonthly, total: q.das + q.monthly * (q.term - 1),
      score: qs.score, grade: adv.gradeFor(qs.score), tone: ui.toneOf(qs.score), term: q.term, miles: q.miles,
      price: null, pctOff: null, mf: null, residual: null
    });
  }

  function offerSummary(o, i) {
    return [
      (o.dealer || 'Dealer') + ': ' + i.car,
      i.term + ' mo / ' + fmt.num(i.miles) + ' mi',
      'Monthly ' + usd(i.monthly) + ' with tax, ' + usd(i.das) + ' due at signing, true monthly ' + usd(i.trueMonthly),
      'Grade ' + i.grade + ' (' + i.score + '/100)',
      o.notes ? 'Notes: ' + o.notes : ''
    ].filter(Boolean).join('\n');
  }

  function openDetail(o, onDone) {
    const i = infoFor(o);
    const f = { dealer: o.dealer || '', contact: o.contact || '', vin: o.vin || '', notes: o.notes || '', status: o.status || 'quoted' };
    const dealer = ui.textField({ label: 'Dealer', value: f.dealer, onChange: (x) => { f.dealer = x; } });
    const contact = ui.textField({ label: 'Salesperson / phone / email', value: f.contact, onChange: (x) => { f.contact = x; } });
    const vin = ui.textField({ label: 'VIN or stock #', value: f.vin, onChange: (x) => { f.vin = x; } });
    const status = ui.selectField({ label: 'Status', options: LC.views.check.STATUSES.map((s) => ({ v: s.v, label: s.label })), value: f.status, onChange: (x) => { f.status = x; } });
    const notes = ui.textField({ label: 'Notes', value: f.notes, multiline: true, onChange: (x) => { f.notes = x; } });
    const sheet = ui.openSheet({
      title: o.dealer || 'Offer',
      body: [
        h('div', { class: 'row' }, ui.grade(i.grade, i.tone, i.score), h('div', { class: 'grow' }, h('div', { class: 'mid' }, usd(i.monthly) + '/mo'), h('div', { class: 'muted small' }, i.car + ' \u00b7 ' + i.term + ' mo / ' + fmt.num(i.miles) + ' mi'))),
        h('div', { class: 'stats mt' },
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(i.das)), h('div', { class: 'l' }, 'due at signing')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(i.trueMonthly)), h('div', { class: 'l' }, 'true monthly')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(i.total)), h('div', { class: 'l' }, 'total cost'))),
        i.ev && i.ev.levers.length ? h('div', { class: 'card flat mt' }, h('b', null, 'Still to push on'), h('ul', { class: 'mb0' }, i.ev.levers.slice(0, 3).map((l) => h('li', null, l.title + ' (saves ' + (l.saveMonthly >= 1 ? usd(l.saveMonthly) + '/mo' : usd(l.saveTotal)) + ')')))) : null,
        h('div', { class: 'mt' }), dealer.el, contact.el, vin.el, status.el, notes.el,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', onclick: () => {
            store.updateOffer(o.id, { dealer: f.dealer.trim() || 'Dealer', contact: f.contact, vin: f.vin, notes: f.notes, status: f.status });
            sheet.close(); onDone(); ui.toast('Saved');
          } }, 'Save changes'),
          o.kind === 'full' ? h('button', { class: 'btn secondary', type: 'button', onclick: () => {
            const edit = () => { const c = JSON.parse(JSON.stringify(o.calc)); c.offerId = o.id; store.state.calc = c; store.save(); LC.app.go('check', 'offer'); };
            const cur = store.state.calc;
            if (store.calcHasData(cur) && cur.offerId !== o.id) { sheet.close(); ui.confirmSheet('Replace your current check?', 'The numbers in your current check will be replaced by this offer. Saved offers are not affected.', 'Open offer', edit); }
            else { sheet.close(); edit(); }
          } }, ui.icon('edit', 16), 'Edit in calculator') : null),
        h('div', { class: 'btn-row mt' },
          h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.copyText(offerSummary(o, i), 'Summary copied') }, ui.icon('copy', 16), 'Copy'),
          h('button', { class: 'btn danger', type: 'button', onclick: () => { sheet.close(); ui.confirmSheet('Delete this offer?', 'This cannot be undone.', 'Delete', () => { store.removeOffer(o.id); if (store.state.calc && store.state.calc.offerId === o.id) delete store.state.calc.offerId; onDone(); ui.toast('Deleted'); }, true); } }, ui.icon('trash', 16), 'Delete'))
      ]
    });
  }

  function openQuickAdd(onDone) {
    const st = store.state;
    const f = { dealer: '', contact: '', vehicleId: st.target.vehicleId, trimId: st.target.trims[st.target.vehicleId], term: st.target.term, miles: st.target.miles, monthly: null, das: null, notes: '' };
    const dealer = ui.textField({ label: 'Dealer', value: '', placeholder: 'e.g. Pompano Hyundai', onChange: (x) => { f.dealer = x; } });
    const contact = ui.textField({ label: 'Salesperson / phone / email', value: '', onChange: (x) => { f.contact = x; } });
    const carBox = h('div');
    function buildCar() {
      ui.clear(carBox);
      const v = store.vehicle(f.vehicleId);
      const seg = ui.seg(data.vehicles.map((x) => ({ v: x.id, label: x.name })), f.vehicleId, (id) => { f.vehicleId = id; f.trimId = st.target.trims[id]; buildCar(); });
      const sel = ui.selectField({ label: 'Trim', options: v.trims.map((x) => ({ v: x.id, label: x.name })), value: f.trimId, onChange: (id) => { f.trimId = id; } });
      carBox.append(seg, h('div', { class: 'mt' }, sel.el),
        h('div', { class: 'lbl' }, 'Term'), ui.chips(data.terms.map((n) => ({ v: n, label: n + ' mo' })), f.term, (n) => { f.term = n; }),
        h('div', { class: 'lbl mt-s' }, 'Miles per year'), ui.chips(data.miles.map((m) => ({ v: m, label: fmt.num(m) })), f.miles, (m) => { f.miles = m; }));
    }
    buildCar();
    const monthly = ui.numInput({ label: 'Monthly payment (with tax)', prefix: '$', value: null, auto: null, onChange: (x) => { f.monthly = x; } });
    const das = ui.numInput({ label: 'Total due at signing', prefix: '$', value: null, auto: null, onChange: (x) => { f.das = x; } });
    const notes = ui.textField({ label: 'Notes', value: '', multiline: true, onChange: (x) => { f.notes = x; } });
    const sheet = ui.openSheet({
      title: 'Add a quote',
      body: [h('p', { class: 'muted small' }, 'For a quote you only have the headline numbers for. Use Check for a full itemized grade.'),
        dealer.el, contact.el, carBox, monthly.el, das.el, notes.el,
        h('button', { class: 'btn block', type: 'button', onclick: () => {
          if (!f.monthly) { ui.toast('Enter the monthly payment'); return; }
          store.addOffer({ kind: 'quick', dealer: f.dealer.trim() || 'Dealer', contact: f.contact, notes: f.notes, vehicleId: f.vehicleId, trimId: f.trimId, quick: { term: f.term, miles: f.miles, monthly: f.monthly, das: f.das || 0 } });
          sheet.close(); onDone(); ui.toast('Quote added');
        } }, 'Save quote')]
    });
  }

  function openCompare(offers) {
    const infos = offers.map((o) => ({ o, i: infoFor(o) }));
    const lowest = (key) => { const vals = infos.map((x) => x.i[key]).filter((x) => typeof x === 'number' && x > 0); return vals.length ? Math.min.apply(null, vals) : null; };
    const best = { monthly: lowest('monthly'), das: lowest('das'), trueMonthly: lowest('trueMonthly'), total: lowest('total') };
    const row = (label, fn, key) => h('tr', null, h('td', null, label), infos.map((x) => {
      const val = fn(x.i, x.o);
      const isBest = key && best[key] !== null && x.i[key] === best[key] && infos.length > 1;
      return h('td', { class: isBest ? 'best' : '' }, val);
    }));
    ui.openSheet({
      title: 'Compare offers',
      body: [h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl compare' },
        h('thead', null, h('tr', null, h('th', null, ''), infos.map((x) => h('th', null, x.o.dealer || 'Dealer')))),
        h('tbody', null,
          row('Car', (i) => i.short),
          row('Term / miles', (i) => i.term + ' / ' + fmt.num(i.miles / 1000) + 'k'),
          row('Selling price', (i) => (i.price ? usd(i.price) : '-')),
          row('Off MSRP', (i) => (i.pctOff != null ? fmt.pct(i.pctOff) : '-')),
          row('Money factor', (i) => (i.mf ? fmt.mf(i.mf) : '-')),
          row('Residual', (i) => (i.residual ? i.residual.toFixed(1) + '%' : '-')),
          row('Monthly w/ tax', (i) => usd(i.monthly), 'monthly'),
          row('Due at signing', (i) => usd(i.das), 'das'),
          row('True monthly', (i) => usd(i.trueMonthly), 'trueMonthly'),
          row('Total cost', (i) => usd(i.total), 'total'),
          row('Grade', (i) => i.grade + ' (' + i.score + ')')))),
        h('p', { class: 'hint mt-s' }, 'Green marks the lowest. True monthly counts everything you pay over the lease, including what is due at signing.')]
    });
  }

  LC.views.offers = {
    render(root) {
      const st = store.state;
      let compareMode = false;
      const selected = new Set();
      const listBox = h('div');
      const topBox = h('div');
      const bar = h('div');

      function refresh() { buildTop(); buildList(); }

      function buildTop() {
        ui.clear(topBox);
        const n = st.offers.length;
        const infos = st.offers.map((o) => infoFor(o)).filter((i) => i.valid);
        const actions = h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', onclick: () => LC.app.newCheck() }, ui.icon('calc', 18), 'Check a quote'),
          h('button', { class: 'btn secondary', type: 'button', onclick: () => openQuickAdd(refresh) }, ui.icon('plus', 18), 'Quick add'),
          n >= 2 ? h('button', { class: 'btn ' + (compareMode ? '' : 'secondary'), type: 'button', onclick: () => { compareMode = !compareMode; selected.clear(); refresh(); updateBar(); } }, ui.icon('cols', 18), compareMode ? 'Done' : 'Compare') : null);
        topBox.appendChild(h('section', { class: 'card' }, h('h2', null, 'Your quotes', h('span', { class: 'sub' }, n + ' saved')), actions));
        if (infos.length >= 2) {
          const sorted = infos.slice().sort((a, b) => a.trueMonthly - b.trueMonthly);
          const worst = sorted[sorted.length - 1];
          const spread = worst.trueMonthly - sorted[0].trueMonthly;
          const sameTerm = sorted.every((x) => x.term === sorted[0].term);
          topBox.appendChild(ui.banner('good', 'check', [h('b', null, 'Lowest true monthly so far: ' + usd(sorted[0].trueMonthly) + '. '), 'The spread between your cheapest and priciest quote is ' + usd(spread) + ' a month' + (sameTerm ? ' (' + usd(spread * sorted[0].term) + ' over the lease)' : '') + '. Grades show how each compares with its own targets.']));
        }
      }

      function buildList() {
        ui.clear(listBox);
        if (!st.offers.length) {
          listBox.appendChild(h('section', { class: 'card' }, ui.empty('clip', 'No quotes yet.'),
            h('p', { class: 'muted center' }, 'Email 6-10 dealers for itemized quotes, then log each one here. The app grades them and finds the cheapest by true monthly cost.'),
            h('button', { class: 'btn secondary block', type: 'button', onclick: () => LC.app.go('playbook', 'scripts') }, ui.icon('msg', 18), 'Get the quote-request email')));
          return;
        }
        const rows = st.offers.map((o) => ({ o, i: infoFor(o) }));
        const validRows = rows.filter((r) => r.i.valid).sort((a, b) => a.i.trueMonthly - b.i.trueMonthly);
        const invalid = rows.filter((r) => !r.i.valid);
        const bestId = validRows.length >= 2 ? validRows[0].o.id : null;
        validRows.concat(invalid).forEach(({ o, i }) => {
          const isSel = selected.has(o.id);
          const el = h('div', { class: 'offer' + (o.id === bestId ? ' best' : ''), role: 'button', tabindex: '0', style: isSel ? { outline: '2px solid var(--primary)' } : null,
            onclick: () => {
              if (compareMode) { if (isSel) selected.delete(o.id); else if (selected.size < 3) selected.add(o.id); else ui.toast('Compare up to 3'); buildList(); updateBar(); return; }
              openDetail(o, refresh);
            } },
            i.valid ? ui.grade(i.grade, i.tone, null, true) : h('div', { class: 'grade sm' }, '?'),
            h('div', { class: 'grow' },
              h('div', { class: 'nm' }, (o.dealer || 'Dealer'), o.id === bestId ? ' ' : '', o.id === bestId ? ui.pill('Lowest cost', 'good') : null),
              h('div', { class: 'meta' }, i.short + ' \u00b7 ' + i.term + ' mo / ' + fmt.num(i.miles / 1000) + 'k'),
              h('div', { class: 'tag-row' }, ui.pill(statusLabel(o.status), statusTone(o.status)), o.kind === 'quick' ? ui.pill('Headline only') : null)),
            h('div', { class: 'pay' }, h('b', null, i.valid ? usd(i.monthly) : '-'), h('div', { class: 'meta' }, i.valid ? usd(i.das) + ' due' : 'Incomplete'), i.valid ? h('div', { class: 'meta' }, usd(i.trueMonthly) + ' true') : null));
          listBox.appendChild(el);
        });
      }

      function updateBar() {
        if (!compareMode || selected.size < 2) { LC.app.clearSticky(); return; }
        const b = h('div', { class: 'sticky-result' }, h('div', { class: 's' }, h('div', { class: 'v' }, selected.size + ' selected'), h('div', { class: 'l' }, 'tap to compare')),
          h('button', { class: 'btn', type: 'button', onclick: () => openCompare(st.offers.filter((o) => selected.has(o.id))) }, 'Compare'));
        LC.app.setSticky(b);
      }

      root.append(topBox, listBox, bar);
      refresh();
      root.appendChild(h('p', { class: 'muted small center mt' }, 'Quotes are saved on this phone only.'));
      return { cleanup() { LC.app.clearSticky(); } };
    }
  };
})();
