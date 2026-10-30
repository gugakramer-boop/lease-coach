/* Lease Coach: supporting tools (decode a quote, miles planner, lease vs buy, lease end). */
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

  // Shared car selection (same as the Targets tab).
  function picker(onChange, opts) {
    opts = opts || {};
    const st = store.state;
    const t = st.target;
    const box = h('section', { class: 'card' });
    function build() {
      ui.clear(box);
      const v = store.vehicle(t.vehicleId);
      const seg = ui.seg(data.vehicles.map((x) => ({ v: x.id, label: x.name })), t.vehicleId, (id) => { t.vehicleId = id; store.save(); build(); onChange(); });
      const sel = ui.selectField({ label: 'Trim', options: v.trims.map((x) => ({ v: x.id, label: x.name })), value: t.trims[v.id], onChange: (id) => { t.trims[v.id] = id; store.save(); onChange(); } });
      box.append(seg, h('div', { class: 'mt' }, sel.el));
      if (opts.term !== false) box.append(h('div', { class: 'lbl' }, 'Term'), ui.chips(data.terms.map((n) => ({ v: n, label: n + ' mo' })), t.term, (n) => { t.term = n; store.save(); onChange(); }));
      if (opts.miles) box.append(h('div', { class: 'lbl mt-s' }, 'Miles per year'), ui.chips(data.miles.map((m) => ({ v: m, label: fmt.num(m) + ' mi' })), t.miles, (m) => { t.miles = m; store.save(); onChange(); }));
    }
    build();
    return box;
  }
  const cur = () => {
    const t = store.state.target;
    const v = store.vehicle(t.vehicleId);
    return { t, v, trim: store.trim(v.id, t.trims[v.id]), make: store.make(v.id) };
  };

  // ------------------------------------------------------------------ decode
  function decode(root) {
    const st = store.state;
    const d = st.ui.decode = Object.assign({ mode: 'mf', payment: null, taxIncluded: true, capRed: 0, capFees: null, msrp: null, rv: null, mf: null, price: null }, st.ui.decode || {});
    const out = h('div');
    const ctl = {};

    function refNow() { const c = cur(); return store.refFor(c.v.id, c.trim.id, c.t.term, c.t.miles); }

    function result() {
      ui.clear(out);
      const ref = refNow();
      const c = cur();
      const term = c.t.term;
      const msrp = d.msrp == null ? ref.msrp : d.msrp;
      const rvPct = d.rv == null ? ref.rvPct : d.rv;
      const residual = msrp * rvPct / 100;
      const taxRate = st.settings.taxRate / 100;
      const pay = calc.num(d.payment);
      const capRed = calc.num(d.capRed);
      const capFees = d.capFees == null ? ref.acqFee : d.capFees;
      if (!pay) { out.appendChild(ui.banner('info', 'info', 'Enter their monthly payment to decode it.')); return; }
      const base = d.taxIncluded ? pay / (1 + taxRate) : pay;
      const goodPrice = Math.round(msrp * (1 - ref.tiers.good.discPct / 100));
      const greatPrice = Math.round(msrp * (1 - ref.tiers.great.discPct / 100));

      if (d.mode === 'mf') {
        const mf = d.mf == null ? ref.baseMf : d.mf;
        const adjCap = calc.solveAdjCap({ base, residual, mf, term });
        const price = adjCap + capRed - capFees;
        const pctOff = (msrp - price) / msrp * 100;
        const altAdj = goodPrice + capFees - capRed;
        const altPay = ((altAdj - residual) / term + (altAdj + residual) * ref.baseMf) * (1 + taxRate);
        const tone = pctOff < 0 ? 'bad' : pctOff < ref.tiers.good.discPct ? 'warn' : 'good';
        out.appendChild(h('section', { class: 'card tone-' + tone },
          h('h2', null, 'What their payment implies'),
          h('div', { class: 'big' }, usd(price)),
          h('div', { class: 'muted' }, 'implied selling price, ' + (pctOff >= 0 ? fmt.pct(pctOff) + ' off MSRP' : fmt.pct(-pctOff) + ' ABOVE MSRP')),
          h('hr'),
          ui.kv('Good target price', usd(goodPrice) + ' (' + ref.tiers.good.discPct + '% off)'),
          ui.kv('Great target price', usd(greatPrice) + ' (' + ref.tiers.great.discPct + '% off)'),
          ui.kv('Payment at Good price and base MF', usd(altPay)),
          ui.kv('You would save', usd(Math.max(0, pay - altPay)) + '/mo'),
          h('p', { class: 'hint mt-s' }, pctOff < 0
            ? 'The payment only works with a price above MSRP, so either a higher money factor, a lower residual, or add-ons are hiding in it. Try the other mode, and ask for the itemized worksheet.'
            : 'This assumes the money factor, residual and rolled-in fees you entered are what the dealer used. If the real money factor is higher, the true price is lower than this.')));
      } else {
        const price = calc.num(d.price);
        if (!price) { out.appendChild(ui.banner('info', 'info', 'Enter the selling price they quoted.')); return; }
        const adjCap = price + capFees - capRed;
        const mf = calc.solveMf({ base, adjCap, residual, term });
        const extra = mf - ref.baseMf;
        const perMonth = (adjCap + residual) * extra * (1 + taxRate);
        const tone = extra > 0.0003 ? 'bad' : extra > 0.0001 ? 'warn' : 'good';
        out.appendChild(h('section', { class: 'card tone-' + tone },
          h('h2', null, 'What their payment implies'),
          h('div', { class: 'big' }, mf.toFixed(5)),
          h('div', { class: 'muted' }, 'implied money factor (' + (mf * 2400).toFixed(2) + '% APR)'),
          h('hr'),
          ui.kv('Lender base (estimate)', fmt.mf(ref.baseMf) + ' (' + (ref.baseMf * 2400).toFixed(2) + '%)'),
          ui.kv('Difference', (extra >= 0 ? '+' : '') + extra.toFixed(5)),
          ui.kv('Cost of that difference', extra > 0 ? usd(perMonth) + '/mo, ' + usd(perMonth * term) + ' total' : 'None'),
          h('p', { class: 'hint mt-s' }, extra > 0.0001
            ? 'This looks like a marked-up money factor, or a lower residual than the program. Ask for the lender buy rate and the residual they used.'
            : 'The implied rate is at or near the lender base rate. If it looks too good, check the residual and fees you entered.')));
      }
    }

    const picked = picker(() => { refreshAuto(); result(); }, { miles: true });
    root.appendChild(picked);

    ctl.pay = ui.numInput({ label: 'Their monthly payment', prefix: '$', value: d.payment, auto: null, onChange: (x) => { d.payment = x; store.save(); result(); } });
    ctl.capRed = ui.numInput({ label: 'Cash down + incentives applied', prefix: '$', value: d.capRed, auto: null, onChange: (x) => { d.capRed = x || 0; store.save(); result(); }, hint: 'Anything that lowered the cap cost.' });
    ctl.capFees = ui.numInput({ label: 'Fees rolled into the lease', prefix: '$', value: d.capFees, auto: refNow().acqFee, onChange: (x) => { d.capFees = x; store.save(); result(); }, hint: 'Acquisition fee and any other fee added to the cap cost. $0 if all paid at signing.' });
    ctl.msrp = ui.numInput({ label: 'MSRP', prefix: '$', value: d.msrp, auto: refNow().msrp, onChange: (x) => { d.msrp = x; store.save(); result(); } });
    ctl.rv = ui.numInput({ label: 'Residual', suffix: '%', decimals: 1, value: d.rv, auto: refNow().rvPct, onChange: (x) => { d.rv = x; store.save(); result(); } });
    const mfSlot = h('div');
    function buildMode() {
      ui.clear(mfSlot);
      if (d.mode === 'mf') {
        ctl.mf = ui.numInput({ label: 'Money factor they used', decimals: 5, group: false, value: d.mf, auto: refNow().baseMf, onChange: (x) => { d.mf = x; store.save(); result(); }, hint: 'If you do not know it, the lender base rate is assumed.' });
        mfSlot.appendChild(ctl.mf.el);
      } else {
        ctl.price = ui.numInput({ label: 'Selling price they quoted', prefix: '$', value: d.price, auto: null, onChange: (x) => { d.price = x; store.save(); result(); } });
        mfSlot.appendChild(ctl.price.el);
      }
    }
    function refreshAuto() {
      const ref = refNow();
      ctl.msrp.set(d.msrp, ref.msrp); ctl.rv.set(d.rv, ref.rvPct); ctl.capFees.set(d.capFees, ref.acqFee);
      if (ctl.mf && d.mode === 'mf') ctl.mf.set(d.mf, ref.baseMf);
    }
    const modeSeg = ui.seg([{ v: 'mf', label: 'I know the money factor' }, { v: 'price', label: 'I know the price' }], d.mode, (m) => { d.mode = m; store.save(); buildMode(); result(); });
    root.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Decode a payment'),
      h('p', { class: 'hint' }, 'Dealers often quote only a payment. Enter it with what you know and this works backwards to the number they may be hiding.'),
      ctl.pay.el, ui.toggle('Payment includes tax', d.taxIncluded !== false, (on) => { d.taxIncluded = on; store.save(); result(); }),
      ctl.capRed.el, ctl.capFees.el, ctl.msrp.el, ctl.rv.el, modeSeg, h('div', { class: 'mt-s' }), mfSlot));
    buildMode();
    root.appendChild(out);
    result();
    return {};
  }

  // ------------------------------------------------------------------ miles planner
  function miles(root) {
    const st = store.state;
    const m = st.ui.miles = Object.assign({ commute: 15, days: 230, weekly: 60, trips: 2, tripMiles: 600, buffer: 10 }, st.ui.miles || {});
    const out = h('div');

    function result() {
      ui.clear(out);
      const c = cur();
      const annual = m.commute * 2 * m.days + m.weekly * 52 + m.trips * m.tripMiles;
      const planned = Math.round(annual * (1 + m.buffer / 100));
      const plan = Math.round(planned / 500) * 500;
      const rows = [10000, 12000, 15000].map((mi) => {
        const tg = store.targetsFor(c.v.id, c.trim.id, { miles: mi });
        const g = tg.tiers.good.result;
        const over = Math.max(0, planned - mi) * (c.t.term / 12) * tg.ref.overMile;
        return { mi, monthly: g.monthly, net: g.netCost, over, total: g.netCost + over, rate: tg.ref.overMile, rv: tg.ref.rvPct };
      });
      const best = rows.reduce((a, b) => (b.total < a.total ? b : a));
      out.appendChild(h('section', { class: 'card' },
        h('h2', null, 'Your driving'),
        ui.kv('Commute + errands + trips', fmt.num(annual) + ' mi/yr'),
        ui.kv('With ' + m.buffer + '% safety buffer', fmt.num(planned) + ' mi/yr'),
        planned > 15000 ? ui.banner('warn', 'alert', 'You may outgrow 15,000 miles a year. Ask for an 18k or 20k plan, or consider buying instead.') : null,
        h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, h('th', null, 'Plan'), h('th', null, 'Monthly'), h('th', null, 'Lease cost'), h('th', null, 'Overage'), h('th', null, 'Total'))),
          h('tbody', null, rows.map((r) => h('tr', { class: r === best ? 'em' : '' },
            h('td', null, fmt.num(r.mi) + ' mi' + (r === best ? ' \u2713' : '')), h('td', null, usd(r.monthly)), h('td', null, usd(r.net)), h('td', null, usd(r.over)), h('td', { class: r === best ? 'best' : '' }, usd(r.total))))))),
        h('p', { class: 'hint mt-s' }, 'Uses your Good-target numbers for ' + c.trim.name + ', ' + c.t.term + ' months. Overage is ' + Math.round(rows[0].rate * 100) + ' cents a mile (typical). Best value for your driving: ',
          h('b', null, fmt.num(best.mi) + ' miles a year'), '.'),
        h('p', { class: 'hint' }, st.profile.plannedMiles ? 'Your saved plan is ' + fmt.num(st.profile.plannedMiles) + ' mi/yr. Check warns you when a quote allows less.' : 'Save this as your plan and Check will warn you when a quote allows fewer miles.'),
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => { st.profile.plannedMiles = plan; store.save(); ui.toast('Saved ' + fmt.num(plan) + ' mi/yr as your plan'); result(); } }, 'Use ' + fmt.num(plan) + ' mi/yr as my plan')));
    }

    const f = (key, label, hint, suffix) => ui.numInput({ label, value: m[key], auto: null, suffix, onChange: (x) => { m[key] = x || 0; store.save(); result(); }, hint });
    root.appendChild(picker(result, { miles: false }));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Plan your miles'),
      h('div', { class: 'grid2' }, f('commute', 'Commute, one way', null, 'mi').el, f('days', 'Work days / year', null, 'days').el),
      f('weekly', 'Other driving per week', 'Errands, school runs, nights out.', 'mi').el,
      h('div', { class: 'grid2' }, f('trips', 'Long trips per year').el, f('tripMiles', 'Round-trip miles each', 'e.g. Orlando about 440, Keys about 330.', 'mi').el),
      f('buffer', 'Safety buffer', 'Life changes. 10% is sensible.', '%').el));
    root.appendChild(out);
    result();
    return {};
  }

  // ------------------------------------------------------------------ lease vs buy
  function buy(root) {
    const st = store.state;
    const b = st.ui.buy = Object.assign({ down: 5000, apr: 6.5, loanTerm: 60, resale: null, price: null }, st.ui.buy || {});
    const out = h('div');
    const ctl = {};

    function result() {
      ui.clear(out);
      const c = cur();
      const tg = store.targetsFor(c.v.id, c.trim.id);
      const ref = tg.ref;
      const lease = tg.tiers.good.result;
      const goodPrice = tg.tiers.good.inputs.sellingPrice;
      const price = b.price == null ? goodPrice : b.price;
      const feesBuy = tg.tiers.good.inputs.dealerFee + ref.regFee;
      const taxBuy = calc.flPurchaseTax(price + tg.tiers.good.inputs.dealerFee, 0.06, Math.max(0, st.settings.taxRate - 6) / 100, 5000);
      const financed = Math.max(0, price + feesBuy + taxBuy - b.down);
      const pmt = calc.loanPayment(financed, b.apr, b.loanTerm);
      const hold = Math.min(c.t.term, b.loanTerm);
      const balance = calc.loanBalance(financed, b.apr, b.loanTerm, hold);
      const resaleAuto = Math.round(lease.residual);
      const resale = b.resale == null ? resaleAuto : b.resale;
      const paid = b.down + pmt * hold;
      const buyNet = paid - (resale - balance);
      const leaseNet = lease.netCost;
      const diff = buyNet - leaseNet;
      const tone = diff > 0 ? 'good' : 'warn';
      const breakEven = paid + balance - leaseNet;
      out.appendChild(h('section', { class: 'card tone-' + tone },
        h('h2', null, 'Over ' + hold + ' months'),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(leaseNet / hold)), h('div', { class: 'l' }, 'Lease / month')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, usd(buyNet / hold)), h('div', { class: 'l' }, 'Buy / month (net of resale)'))),
        h('hr'),
        h('p', { class: 'mb0' }, diff > 0
          ? h('span', null, h('b', null, 'Leasing is cheaper by about ' + usd(diff / hold) + ' a month'), ' (' + usd(diff) + ' total), assuming you could sell the car for ' + usd(resale) + ' at the end.')
          : h('span', null, h('b', null, 'Buying comes out ahead by about ' + usd(-diff / hold) + ' a month'), ' (' + usd(-diff) + ' total), if the car is worth ' + usd(resale) + ' after ' + hold + ' months.'))));
      out.appendChild(h('section', { class: 'card' },
        h('h2', null, 'The details'),
        h('div', { class: 'section-title', style: { margin: '0 0 4px' } }, 'Lease (Good target)'),
        ui.kv('Monthly with tax', usd(lease.monthly)), ui.kv('Due at signing', usd(lease.das)), ui.kv('Total cash out', usd(leaseNet), 'total'),
        h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'Buy'),
        ui.kv('Price + fees + tax', usd(price + feesBuy + taxBuy)), ui.kv('Tax (6% + county on the first $5,000)', usd(taxBuy)),
        ui.kv('Down payment', usd(b.down)), ui.kv('Loan payment', usd(pmt) + ' x ' + b.loanTerm),
        ui.kv('Paid in ' + hold + ' months', usd(paid)), ui.kv('Loan balance then', usd(balance)),
        ui.kv('Estimated car value then', usd(resale)), ui.kv('Net cost of owning', usd(buyNet), 'total'),
        h('p', { class: 'hint mt-s' }, 'Buying breaks even with leasing if the car is worth about ' + usd(breakEven) + ' at ' + hold + ' months. Excludes insurance and maintenance. Buying also removes the mileage limit and builds equity, and leasing means no resale risk.')));
    }

    root.appendChild(picker(() => { ctl.price.set(b.price, null); result(); }));
    ctl.price = ui.numInput({ label: 'Purchase price (before tax and fees)', prefix: '$', value: b.price, auto: null, placeholder: 'Defaults to the Good lease price', onChange: (x) => { b.price = x; store.save(); result(); } });
    ctl.down = ui.numInput({ label: 'Down payment', prefix: '$', value: b.down, auto: null, onChange: (x) => { b.down = x || 0; store.save(); result(); } });
    ctl.apr = ui.numInput({ label: 'Loan APR', suffix: '%', decimals: 2, value: b.apr, auto: null, onChange: (x) => { b.apr = x || 0; store.save(); result(); }, hint: 'Check your bank or credit union for a real rate.' });
    ctl.resale = ui.numInput({ label: 'Car value at the end of the lease', prefix: '$', value: b.resale, auto: null, placeholder: 'Defaults to the residual', onChange: (x) => { b.resale = x; store.save(); result(); }, hint: 'What you could sell it for. The lender residual is a reasonable guess.' });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'If you bought it'),
      ctl.price.el, ctl.down.el, ctl.apr.el,
      h('div', { class: 'lbl' }, 'Loan term'), ui.chips([48, 60, 72].map((n) => ({ v: n, label: n + ' mo' })), b.loanTerm, (n) => { b.loanTerm = n; store.save(); result(); }),
      h('div', { class: 'mt' }), ctl.resale.el));
    root.appendChild(out);
    result();
    return {};
  }

  // ------------------------------------------------------------------ lease end
  function end(root) {
    const st = store.state;
    const e = st.ui.end = Object.assign({ market: null, actual: null, wear: 0, rereLease: true, taxOn: true }, st.ui.end || {});
    const out = h('div');
    const ctl = {};

    function result() {
      ui.clear(out);
      const c = cur();
      const ref = store.refFor(c.v.id, c.trim.id, c.t.term, c.t.miles);
      const residual = ref.msrp * ref.rvPct / 100;
      const fee = ref.purchaseFee;
      const tax = e.taxOn ? calc.flPurchaseTax(residual, 0.06, Math.max(0, st.settings.taxRate - 6) / 100, 5000) : 0;
      const buyout = residual + fee + tax;
      const market = calc.num(e.market);
      const allowed = c.t.miles * c.t.term / 12;
      const actual = e.actual == null ? allowed : e.actual;
      const overMiles = Math.max(0, actual - allowed);
      const overCost = overMiles * ref.overMile;
      const dispo = e.rereLease ? 0 : ref.dispoFee;
      const returnCost = overCost + dispo + calc.num(e.wear);
      const equity = market ? market - (residual + fee) : null;
      out.appendChild(h('section', { class: 'card' },
        h('h2', null, 'Your options'),
        h('div', { class: 'section-title', style: { margin: '0 0 4px' } }, 'Buy it'),
        ui.kv('Residual', usd(residual)), ui.kv('Purchase-option fee', usd(fee)), e.taxOn ? ui.kv('Estimated sales tax', usd(tax)) : null,
        ui.kv('Buy-out total', usd(buyout), 'total'),
        equity !== null ? ui.kv('Equity (market - buy-out before tax)', (equity >= 0 ? '+' : '') + usd(equity)) : null,
        h('div', { class: 'section-title', style: { margin: '10px 0 4px' } }, 'Return it'),
        ui.kv('Miles over (' + fmt.num(actual) + ' vs ' + fmt.num(allowed) + ')', usd(overCost)),
        ui.kv('Disposition fee', usd(dispo)), ui.kv('Excess wear (your estimate)', usd(calc.num(e.wear))),
        ui.kv('Cost to return', usd(returnCost), 'total'),
        h('p', { class: 'hint mt-s' }, equity !== null && equity > 0
          ? 'The car is worth more than the buy-out, so buying (and keeping or selling it) beats handing it back. A dealer may also pay you for the equity.'
          : 'If the car is worth about the buy-out or less, returning it is usually simpler. Compare against the cost to return.')));
    }

    root.appendChild(picker(result, { miles: true }));
    ctl.market = ui.numInput({ label: 'What the car is worth today', prefix: '$', value: e.market, auto: null, placeholder: 'Get offers from CarMax, Carvana, dealers', onChange: (x) => { e.market = x; store.save(); result(); } });
    ctl.actual = ui.numInput({ label: 'Total miles driven at lease-end', value: e.actual, auto: null, placeholder: 'Defaults to the allowance', onChange: (x) => { e.actual = x; store.save(); result(); } });
    ctl.wear = ui.numInput({ label: 'Estimated excess wear charges', prefix: '$', value: e.wear, auto: null, onChange: (x) => { e.wear = x || 0; store.save(); result(); } });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'At lease-end'), ctl.market.el, ctl.actual.el, ctl.wear.el,
      ui.toggle('I will lease or buy another from the same brand', e.rereLease, (on) => { e.rereLease = on; store.save(); result(); }, 'The disposition fee is usually waived.'),
      ui.toggle('Include sales tax on a buy-out', e.taxOn, (on) => { e.taxOn = on; store.save(); result(); }, 'Florida generally taxes the sale. Confirm with your lessor.')));
    root.appendChild(out);
    result();
    return {};
  }

  LC.views.tools = { decode, miles, buy, end };
})();
