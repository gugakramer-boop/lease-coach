/* Lease Coach: Check view (offer calculator with grade, red flags and negotiation levers). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;
  const fmt = ui.fmt;
  const data = LC.data;
  const calc = LC.calc;
  const usd = fmt.usd;

  const AUTO_LABELS = { msrp: 'MSRP', rv: 'residual', mf: 'money factor', acqFee: 'acquisition fee', dealerFee: 'dealer fees', regFee: 'registration', taxRate: 'tax rate' };

  function vehicleLabel(c) {
    const v = store.vehicle(c.vehicleId);
    return v.year + ' ' + v.name + ' ' + store.trim(c.vehicleId, c.trimId).name;
  }

  function summaryText(c, ev, ref) {
    const o = ev.own, i = o.inputs;
    const lines = [
      'Lease quote check: ' + vehicleLabel(c),
      o.term + ' mo / ' + fmt.num(i.milesPerYear) + ' mi | MSRP ' + usd(i.msrp) + ' | price ' + usd(i.sellingPrice) + ' (' + fmt.pct(o.discountPct) + ' off)',
      'MF ' + fmt.mf(i.mf) + ' (' + (i.mf * 2400).toFixed(2) + '% APR) | residual ' + i.residualPct.toFixed(1) + '% | rebates ' + usd(i.rebates) + ' | add-ons ' + usd(i.addOns),
      'Fees: acq ' + usd(i.acqFee) + ', dealer ' + usd(i.dealerFee) + ', reg ' + usd(i.regFee) + (i.otherFee ? ', other ' + usd(i.otherFee) : ''),
      'Monthly ' + usd(o.monthly) + ' with tax | Due at signing ' + usd(o.das) + ' | True monthly ' + usd(o.trueMonthly),
      'Grade ' + ev.grade + ' (' + ev.score + '/100): ' + ev.verdict.title,
      'Benchmarks (same structure): Great ' + usd(ev.bench.great.monthly) + ', Good ' + usd(ev.bench.good.monthly) + ', Walk-away ' + usd(ev.bench.walk.monthly) + ' per month'
    ];
    if (ev.levers.length) {
      lines.push('Push on:');
      ev.levers.slice(0, 5).forEach((l) => lines.push('- ' + l.title + ' (saves ' + (l.saveMonthly >= 1 ? usd(l.saveMonthly) + '/mo' : usd(l.saveTotal) + ' at signing') + ')'));
    }
    void ref;
    return lines.join('\n');
  }

  function counterText(c, ev) {
    const name = store.state.profile.name || '[Your name]';
    const top = ev.levers.slice(0, 5);
    const asks = top.map((l) => '- ' + l.ask);
    // Payment with exactly the listed asks applied to this quote.
    const mods = Object.assign.apply(null, [{}].concat(top.map((l) => l.mod)));
    const withAsks = top.length ? calc.compute(Object.assign({}, ev.own.inputs, mods)) : ev.bench.good;
    return [
      'Hi [Name],',
      '',
      'Thank you for the quote on the ' + vehicleLabel(c) + '. I am ready to move forward at the right numbers. Based on my research I need:',
      asks.length ? asks.join('\n') : '- The numbers I listed in my last email',
      '',
      'With those, I calculate about ' + usd(withAsks.monthly) + '/month with tax. If you can get there, I will sign.',
      '',
      name
    ].join('\n');
  }

  function offerView(root) {
    const st = store.state;
    const c = store.getCalc();
    const ctl = {};
    let mathOpen = false;
    const results = h('div', { id: 'results' });

    const refNow = () => store.refFor(c.vehicleId, c.trimId, c.term, c.miles);

    function refreshAuto() {
      const ref = refNow();
      ctl.msrp.set(c.msrp, ref.msrp);
      ctl.rv.set(c.rv, ref.rvPct);
      ctl.acq.set(c.acqFee, ref.acqFee);
      ctl.dealer.set(c.dealerFee, store.AUTO_DEALER_FEE);
      ctl.reg.set(c.regFee, ref.regFee);
      ctl.tax.set(c.taxRate, st.settings.taxRate);
      buildMf();
    }

    function changed() { store.save(); update(); }

    // ----- car selection -----
    const vehSeg = ui.seg(data.vehicles.map((v) => ({ v: v.id, label: v.name })), c.vehicleId, (id) => {
      c.vehicleId = id; c.trimId = st.target.trims[id]; c.msrp = null; c.rv = null; c.mf = null;
      buildTrim(); refreshAuto(); changed();
    });
    const trimBox = h('div');
    function buildTrim() {
      ui.clear(trimBox);
      const v = store.vehicle(c.vehicleId);
      const sel = ui.selectField({
        label: 'Trim', options: v.trims.map((x) => ({ v: x.id, label: x.name })), value: c.trimId,
        onChange: (id) => { c.trimId = id; st.target.trims[c.vehicleId] = id; c.msrp = null; c.rv = null; c.mf = null; refreshAuto(); changed(); }
      });
      trimBox.appendChild(sel.el);
    }
    const termChips = ui.chips(data.terms.map((n) => ({ v: n, label: n + ' mo' })), c.term, (n) => { c.term = n; c.rv = null; c.mf = null; refreshAuto(); changed(); });
    const milesChips = ui.chips(data.miles.map((m) => ({ v: m, label: fmt.num(m) + ' mi' })), c.miles, (m) => { c.miles = m; c.rv = null; refreshAuto(); changed(); });

    function goodPrice() {
      const ref = refNow();
      const msrp = c.msrp == null ? ref.msrp : c.msrp;
      return Math.round(msrp * (1 - ref.tiers.good.discPct / 100));
    }
    function fillGood() {
      c.price = goodPrice();
      ctl.price.set(c.price, null);
      changed();
      ui.toast('Filled with the Good target price');
    }
    function resetAll() {
      st.calc = store.freshCalc();
      store.save();
      LC.app.render();
    }

    root.appendChild(h('section', { class: 'card' },
      vehSeg, h('div', { class: 'mt' }, trimBox),
      h('div', { class: 'lbl' }, 'Term'), termChips,
      h('div', { class: 'lbl mt-s' }, 'Miles per year'), milesChips));
    buildTrim();

    // ----- their price -----
    ctl.msrp = ui.numInput({ label: 'MSRP (window sticker, incl. destination)', prefix: '$', value: c.msrp, auto: refNow().msrp, onChange: (x) => { c.msrp = x; changed(); }, hint: 'Use the sticker number. Options and accessories make it higher than base + destination.' });
    ctl.price = ui.numInput({ label: 'Selling price (before fees & incentives)', prefix: '$', value: c.price, auto: null, placeholder: "Dealer's price", onChange: (x) => { c.price = x; changed(); } });
    const pctChips = h('div', { class: 'chips' }, [2, 3, 4, 5, 6, 8].map((p) => h('button', { type: 'button', class: 'chip', onclick: () => {
      const ref = refNow(); const msrp = c.msrp == null ? ref.msrp : c.msrp;
      c.price = Math.round(msrp * (1 - p / 100)); ctl.price.set(c.price, null); changed();
    } }, p + '% off')));
    ctl.addOns = ui.numInput({ label: 'Dealer add-ons / market adjustment', prefix: '$', value: c.addOns, auto: null, onChange: (x) => { c.addOns = x || 0; changed(); }, hint: 'Anything added on top of the sticker price. Should be $0.' });
    ctl.rebates = ui.numInput({ label: 'Incentives applied (lease cash, loyalty...)', prefix: '$', value: c.rebates, auto: null, onChange: (x) => { c.rebates = x || 0; changed(); } });
    ctl.down = ui.numInput({ label: 'Cash down / cap cost reduction', prefix: '$', value: c.cashDown, auto: null, onChange: (x) => { c.cashDown = x || 0; changed(); } });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'The price'),
      ctl.msrp.el, ctl.price.el, pctChips, h('div', { class: 'mt-s' }), ctl.addOns.el, ctl.rebates.el, ctl.down.el));

    // ----- lease rates -----
    ctl.rv = ui.numInput({ label: 'Residual value', suffix: '%', decimals: 1, value: c.rv, auto: refNow().rvPct, onChange: (x) => { c.rv = x; changed(); } });
    const mfBox = h('div');
    function buildMf() {
      ui.clear(mfBox);
      const apr = c.mfMode === 'apr';
      const ref = refNow();
      ctl.mf = ui.numInput({
        label: apr ? 'APR equivalent' : 'Money factor', decimals: apr ? 2 : 5, group: false, suffix: apr ? '%' : null,
        value: c.mf, auto: ref.baseMf, toInput: apr ? (m) => m * 2400 : null, fromInput: apr ? (n) => n / 2400 : null,
        onChange: (x) => { c.mf = x; changed(); }
      });
      mfBox.appendChild(ctl.mf.el);
    }
    const mfSeg = ui.seg([{ v: 'mf', label: 'Money factor' }, { v: 'apr', label: 'APR' }], c.mfMode || 'mf', (m) => { c.mfMode = m; buildMf(); update(); store.save(); });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Lease rates'), ctl.rv.el, mfSeg, h('div', { class: 'mt-s' }), mfBox));
    buildMf();

    // ----- fees & tax -----
    function roll(key) {
      const mk = (label, val) => h('button', { type: 'button', class: !!c[key] === val ? 'on' : '', onclick: () => {
        c[key] = val; ui.$$('button', wrap).forEach((b, k) => b.classList.toggle('on', (k === 1) === val)); changed();
      } }, label);
      const wrap = h('div', { class: 'roll' }, h('span', null, 'Paid:'), mk('At signing', false), mk('Rolled into lease', true));
      return wrap;
    }
    ctl.acq = ui.numInput({ label: 'Acquisition fee', prefix: '$', value: c.acqFee, auto: refNow().acqFee, onChange: (x) => { c.acqFee = x; changed(); } });
    ctl.dealer = ui.numInput({ label: 'Dealer / doc / e-filing fees', prefix: '$', value: c.dealerFee, auto: store.AUTO_DEALER_FEE, onChange: (x) => { c.dealerFee = x; changed(); } });
    ctl.reg = ui.numInput({ label: 'Title, tag & registration', prefix: '$', value: c.regFee, auto: refNow().regFee, onChange: (x) => { c.regFee = x; changed(); } });
    ctl.other = ui.numInput({ label: 'Other fees', prefix: '$', value: c.otherFee, auto: null, onChange: (x) => { c.otherFee = x || 0; changed(); } });
    ctl.tax = ui.numInput({ label: 'Sales tax rate', suffix: '%', decimals: 2, value: c.taxRate, auto: st.settings.taxRate, onChange: (x) => { c.taxRate = x; changed(); } });
    ctl.dep = ui.numInput({ label: 'Security deposit (refundable)', prefix: '$', value: c.deposit, auto: null, onChange: (x) => { c.deposit = x || 0; changed(); } });
    const feeCard = h('section', { class: 'card' }, h('h2', null, 'Fees & tax'),
      ctl.acq.el, roll('acqCap'), h('div', { class: 'mt' }), ctl.dealer.el, roll('dealerCap'), h('div', { class: 'mt' }), ctl.reg.el, roll('regCap'),
      h('div', { class: 'mt' }), ctl.other.el, ctl.tax.el, ctl.dep.el);
    root.appendChild(feeCard);

    // ----- what they quoted -----
    ctl.qpay = ui.numInput({ label: 'Their quoted monthly payment', prefix: '$', decimals: 0, value: c.quotedMonthly, auto: null, onChange: (x) => { c.quotedMonthly = x; changed(); } });
    ctl.qdas = ui.numInput({ label: 'Their quoted due at signing', prefix: '$', value: c.quotedDas, auto: null, onChange: (x) => { c.quotedDas = x; changed(); } });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'What they told you', h('span', { class: 'sub' }, 'optional')),
      h('p', { class: 'hint' }, 'Enter their payment to see if the numbers above explain it. A gap means something is hidden.'),
      ctl.qpay.el, ui.toggle('Their payment includes tax', c.quotedTaxIncluded !== false, (on) => { c.quotedTaxIncluded = on; changed(); }), ctl.qdas.el));

    root.appendChild(results);

    // ----- hints -----
    function updateHints(ev, ref) {
      const o = ev.own, i = o.inputs;
      if (!i.sellingPrice) ctl.price.setHint('Enter the dealer price. Good is about **' + usd(Math.round(i.msrp * (1 - ref.tiers.good.discPct / 100))) + '** (' + ref.tiers.good.discPct + '% off).');
      else ctl.price.setHint('**' + fmt.pct(o.discountPct) + ' off MSRP** (' + usd(o.discountAmt) + '). Good is **' + usd(Math.round(i.msrp * (1 - ref.tiers.good.discPct / 100))) + '**, Great **' + usd(Math.round(i.msrp * (1 - ref.tiers.great.discPct / 100))) + '**.');
      ctl.rv.setHint('= **' + usd(o.residual) + '**. Program estimate ' + ref.rvPct.toFixed(1) + '%.');
      const extra = i.mf - ref.baseMf;
      ctl.mf.setHint('**' + (i.mf * 2400).toFixed(2) + '% APR**. Base ' + fmt.mf(ref.baseMf) + (Math.abs(extra) < 1e-9 ? ' (matches)' : extra > 0 ? ': **+' + extra.toFixed(5) + ' above base**' : ': below base'));
      ctl.dealer.setHint('Typical Florida fee is about ' + usd(store.AUTO_DEALER_FEE) + '. Aim for ' + usd(ref.tiers.good.dealerFee) + ' or less.');
      ctl.reg.setHint('Official Florida fees come to about ' + usd(ref.regOfficial) + '.');
      ctl.acq.setHint('Lender fee is about ' + usd(ref.acqFee) + '.');
      ctl.rebates.setHint(ref.rebateAvail ? 'You qualify for about **' + usd(ref.rebateAvail) + '** (set in Targets).' : 'Tick the incentives you qualify for in Targets.');
    }

    // ----- results -----
    function levers(ev) {
      if (!ev.levers.length) return h('p', { class: 'muted mb0' }, 'No obvious levers. This quote is at or near the targets for price, money factor and fees.');
      const box = h('div');
      ev.levers.forEach((l) => box.appendChild(h('div', { class: 'lever' },
        h('div', { class: 'row between top' }, h('b', null, l.title), h('span', { class: 'save' }, l.saveMonthly >= 1 ? 'saves ' + usd(l.saveMonthly) + '/mo' : 'saves ' + usd(l.saveTotal))),
        h('div', { class: 'why' }, (l.saveMonthly >= 1 ? 'About ' + usd(l.saveTotal) + ' over the lease.' : 'Paid at signing, so it does not change the monthly.')),
        h('div', { class: 'say' }, h('span', { class: 'who' }, 'Ask'), l.ask))));
      return box;
    }

    function flagsCard(ev) {
      const box = h('div');
      ev.flags.forEach((f) => box.appendChild(h('div', { class: 'flag ' + f.level },
        h('div', { class: 'ic' }, ui.icon(f.level === 'good' ? 'check' : f.level === 'info' ? 'info' : 'alert', 14)),
        h('div', null, h('b', null, f.title), h('span', null, f.detail)))));
      return box;
    }

    function breakdown(ev, ref) {
      const o = ev.own, i = o.inputs;
      const k = ui.kv;
      const capFeeList = o.fees.filter((f) => f.cap && f.amt > 0);
      const upFeeList = o.fees.filter((f) => !f.cap && f.amt > 0);
      return [
        h('div', { class: 'section-title', style: { margin: '4px 0' } }, 'Capitalized cost'),
        k('Selling price', usd(i.sellingPrice)),
        i.addOns ? k('+ Add-ons / markup', usd(i.addOns), 'sub') : null,
        capFeeList.map((f) => k('+ ' + f.label + ' (rolled in)', usd(f.amt), 'sub')),
        k('Gross cap cost', usd(o.grossCap), 'total'),
        i.cashDown ? k('- Cash down', usd(i.cashDown), 'sub') : null,
        i.rebates ? k('- Incentives', usd(i.rebates), 'sub') : null,
        k('Adjusted cap cost', usd(o.adjCap), 'total'),
        h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'Monthly payment'),
        k('Residual (' + i.residualPct.toFixed(1) + '% of MSRP)', usd(o.residual)),
        k('Depreciation / month', usd(o.depreciation, 2)),
        k('Rent charge / month', usd(o.rentCharge, 2)),
        k('Base payment (pre-tax)', usd(o.base, 2), 'total'),
        k('Sales tax (' + (i.taxRate * 100).toFixed(2) + '%)', usd(o.monthlyTax, 2)),
        k('Monthly payment', usd(o.monthly, 2), 'total'),
        h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'Due at signing'),
        k('First payment', usd(o.monthly, 2)),
        upFeeList.map((f) => k(f.label, usd(f.amt), 'sub')),
        o.upTax ? k('Tax on up-front items', usd(o.upTax, 2), 'sub') : null,
        i.cashDown ? k('Cash down', usd(i.cashDown), 'sub') : null,
        i.deposit ? k('Security deposit', usd(i.deposit), 'sub') : null,
        k('Total due at signing', usd(o.das), 'total'),
        h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'Over the whole lease'),
        k('Payments (' + o.term + ' x ' + usd(o.monthly) + ')', usd(o.totalPayments)),
        k('Total cash out', usd(o.netCost), 'total'),
        k('True monthly cost', usd(o.trueMonthly), 'total'),
        k('Cost per mile', '$' + o.costPerMile.toFixed(2)),
        k('Interest (rent charge) total', usd(o.totalRent)),
        k('Pre-tax payment as % of MSRP', o.onePct.toFixed(2) + '%'),
        h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'At lease-end'),
        k('Buy-out price', usd(o.residual + ref.purchaseFee) + ' (residual + ~' + usd(ref.purchaseFee) + ' fee)'),
        k('Return fees', '~' + usd(ref.dispoFee) + ' disposition (often waived on re-lease) + $' + ref.overMile.toFixed(2) + '/mi over')
      ];
    }

    function openSave(ev) {
      const existing = c.offerId ? store.getOffer(c.offerId) : null;
      const f = { dealer: existing ? existing.dealer : '', contact: existing ? existing.contact || '' : '', vin: existing ? existing.vin || '' : '', notes: existing ? existing.notes || '' : '', status: existing ? existing.status : 'quoted' };
      const dealer = ui.textField({ label: 'Dealer', value: f.dealer, placeholder: 'e.g. Sunrise Kia', onChange: (x) => { f.dealer = x; } });
      const contact = ui.textField({ label: 'Salesperson / phone / email', value: f.contact, onChange: (x) => { f.contact = x; } });
      const vin = ui.textField({ label: 'VIN or stock #', value: f.vin, onChange: (x) => { f.vin = x; } });
      const notes = ui.textField({ label: 'Notes', value: f.notes, multiline: true, onChange: (x) => { f.notes = x; } });
      const status = ui.selectField({ label: 'Status', options: STATUSES.map((s) => ({ v: s.v, label: s.label })), value: f.status, onChange: (x) => { f.status = x; } });
      const sheet = ui.openSheet({
        title: existing ? 'Update offer' : 'Save this offer',
        body: [dealer.el, contact.el, vin.el, status.el, notes.el,
          h('button', { class: 'btn block', type: 'button', onclick: () => {
            // Save resolved numbers so later changes to program estimates never shift a saved quote.
            const snap = JSON.parse(JSON.stringify(c));
            const inp = store.calcInputs(c);
            snap.msrp = inp.msrp; snap.rv = inp.residualPct; snap.mf = inp.mf; snap.acqFee = inp.acqFee;
            snap.dealerFee = inp.dealerFee; snap.regFee = inp.regFee; snap.taxRate = inp.taxRate * 100;
            const base = { kind: 'full', dealer: f.dealer.trim() || 'Dealer', contact: f.contact, vin: f.vin, notes: f.notes, status: f.status, vehicleId: c.vehicleId, trimId: c.trimId, calc: snap };
            if (existing) { store.updateOffer(existing.id, base); ui.toast('Offer updated'); }
            else { const rec = store.addOffer(base); c.offerId = rec.id; store.save(); ui.toast('Saved to Offers'); }
            sheet.close(); update();
          } }, existing ? 'Update offer' : 'Save offer')]
      });
      void ev;
    }

    function renderResults(ev, ref) {
      ui.clear(results);
      const o = ev.own;
      if (!o.valid) {
        results.append(
          ui.banner('info', 'info', [h('b', null, 'Enter the selling price '), 'to see the monthly payment, a grade, and exactly what to push back on.']),
          h('button', { class: 'btn secondary block', type: 'button', onclick: fillGood }, 'Try it with the Good target price'));
        return;
      }
      const estimates = Object.keys(AUTO_LABELS).filter((k) => c[k] === null || c[k] === undefined || c[k] === '').map((k) => AUTO_LABELS[k]);
      results.appendChild(h('div', { class: 'section-title' }, 'Results'));
      results.appendChild(h('section', { class: 'card tone-' + ev.verdict.tone },
        h('div', { class: 'row' },
          ui.grade(ev.grade, ev.verdict.tone, ev.score),
          h('div', { class: 'grow' }, h('div', { class: 'mid' }, ev.verdict.title), h('div', { class: 'muted small' }, ev.verdict.text))),
        h('div', { class: 'stats mt' },
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(o.monthly)), h('div', { class: 'l' }, 'per month')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(o.das)), h('div', { class: 'l' }, 'due at signing')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(o.trueMonthly)), h('div', { class: 'l' }, 'true monthly'))),
        h('hr'),
        h('div', { class: 'muted small' }, 'Same structure at the targets: ',
          h('b', { style: { color: 'var(--good)' } }, 'Great ' + usd(ev.bench.great.monthly)), ' \u00b7 ',
          h('b', { style: { color: 'var(--info)' } }, 'Good ' + usd(ev.bench.good.monthly)), ' \u00b7 ',
          h('b', { style: { color: 'var(--warn)' } }, 'Walk-away ' + usd(ev.bench.walk.monthly)))));
      if (estimates.length) results.appendChild(ui.banner('info', 'info', [h('b', null, 'Using estimates for: '), estimates.join(', ') + '. Replace them with the numbers on the dealer worksheet for an accurate grade.']));
      if (o.warnings.length) results.appendChild(ui.banner('warn', 'alert', o.warnings.join(' ')));

      results.appendChild(ui.card('Where to push', [levers(ev),
        ev.levers.length ? h('div', { class: 'btn-row mt' },
          h('button', { class: 'btn', type: 'button', onclick: () => ui.copyText(counterText(c, ev), 'Counter-offer copied') }, ui.icon('copy', 18), 'Copy counter-offer'),
          h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.shareText('Counter-offer', counterText(c, ev)) }, ui.icon('share', 18), 'Share')) : null]));
      results.appendChild(ui.card('Red flags & checks', flagsCard(ev)));
      const math = ui.accordion('See the full math', breakdown(ev, ref), { icon: 'list', open: mathOpen });
      math.addEventListener('toggle', () => { mathOpen = math.open; });
      results.appendChild(math);
      results.appendChild(h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: () => openSave(ev) }, ui.icon('plus', 18), c.offerId && store.getOffer(c.offerId) ? 'Update saved offer' : 'Save offer'),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.copyText(summaryText(c, ev, ref), 'Summary copied') }, ui.icon('copy', 18), 'Copy summary'),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.shareText('Lease quote check', summaryText(c, ev, ref)) }, ui.icon('share', 18), 'Share')));
      results.appendChild(h('button', { class: 'btn ghost block mt', type: 'button', onclick: () => ui.confirmSheet('Start over?', 'This clears the numbers in the calculator. Saved offers are not affected.', 'Clear', resetAll, true) }, 'Start a new check'));
    }

    // ----- sticky bar -----
    function renderSticky(ev) {
      const o = ev.own;
      if (!o.valid) { LC.app.clearSticky(); return; }
      const bar = h('div', { class: 'sticky-result', role: 'button', tabindex: '0', onclick: () => results.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
        h('div', { class: 's' }, h('div', { class: 'v' }, usd(o.monthly)), h('div', { class: 'l' }, 'per month w/ tax')),
        h('div', { class: 's' }, h('div', { class: 'v' }, usd(o.das)), h('div', { class: 'l' }, 'due at signing')),
        ui.grade(ev.grade, ev.verdict.tone, null, true));
      LC.app.setSticky(bar);
    }

    function update() {
      const { ev, ref } = store.evaluateCalc(c);
      updateHints(ev, ref);
      renderResults(ev, ref);
      renderSticky(ev);
    }
    update();
    return { cleanup() { LC.app.clearSticky(); } };
  }

  const STATUSES = [
    { v: 'requested', label: 'Quote requested' }, { v: 'quoted', label: 'Quote received' }, { v: 'countered', label: 'Countered' },
    { v: 'visit', label: 'Visit scheduled' }, { v: 'final', label: 'Final offer' }, { v: 'declined', label: 'Declined' }, { v: 'signed', label: 'Signed' }
  ];

  LC.views.check = {
    STATUSES,
    render(root, param) {
      const tabs = [{ v: 'offer', label: 'Check offer' }, { v: 'decode', label: 'Decode quote' }, { v: 'miles', label: 'Miles' }, { v: 'buy', label: 'Lease vs buy' }, { v: 'end', label: 'Lease end' }];
      const active = tabs.some((t) => t.v === param) ? param : (store.state.ui.check || 'offer');
      store.state.ui.check = active;
      const bar = ui.chips(tabs, active, (v) => { LC.app.go('check', v); });
      const body = h('div');
      root.append(bar, body);
      if (active === 'offer') return offerView(body);
      return LC.views.tools[active](body) || {};
    }
  };
})();
