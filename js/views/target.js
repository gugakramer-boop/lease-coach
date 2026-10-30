/* Lease Coach: Targets view (what a great / good / walk-away lease looks like). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  LC.views = LC.views || {};
  const ui = LC.ui;
  const store = LC.store;
  const h = ui.h;
  const fmt = ui.fmt;
  const data = LC.data;
  const usd = fmt.usd;

  function cheatSheet(tg, v, trim) {
    const r = tg.ref;
    const g = tg.tiers.good, gr = tg.tiers.great, w = tg.tiers.walk;
    const struct = store.state.target.struct === 'sd' ? 'sign & drive (fees rolled in)' : 'fees paid at signing';
    return [
      'LEASE TARGETS: ' + v.year + ' ' + v.name + ' ' + trim.name,
      r.term + ' mo / ' + fmt.num(r.miles) + ' mi / ' + struct,
      'MSRP ' + usd(r.msrp) + ' (est. invoice about ' + usd(r.invoice) + '), tax ' + store.state.settings.taxRate + '%',
      '',
      'AIM TO CLOSE (Good)',
      '- Selling price ' + usd(g.inputs.sellingPrice) + ' or less (' + r.tiers.good.discPct + '% off MSRP)',
      '- Money factor ' + fmt.mf(g.inputs.mf) + ' or less (lender base ' + fmt.mf(r.baseMf) + ')',
      '- Residual ' + r.rvPct.toFixed(1) + '% or better',
      '- Dealer fees ' + usd(g.inputs.dealerFee) + ' or less, no add-ons, no market adjustment',
      '- About ' + usd(g.result.monthly) + '/mo with tax and ' + usd(g.result.das) + ' due at signing',
      '',
      'OPEN AT (Great)',
      '- Price ' + usd(gr.inputs.sellingPrice) + ' (' + r.tiers.great.discPct + '% off), base money factor ' + fmt.mf(gr.inputs.mf),
      '- About ' + usd(gr.result.monthly) + '/mo with ' + usd(gr.result.das) + ' due at signing',
      '',
      'WALK AWAY ABOVE',
      '- ' + usd(w.result.monthly) + '/mo with ' + usd(w.result.das) + ' due at signing',
      '- Any add-ons, market adjustment, or money factor above ' + fmt.mf(w.inputs.mf)
    ].join('\n');
  }

  LC.views.target = {
    render(root) {
      const st = store.state;
      const t = st.target;
      const controls = h('div');
      const dyn = h('div');
      const rest = h('div');
      root.append(controls, dyn, rest);

      function current() {
        const v = store.vehicle(t.vehicleId);
        const trim = store.trim(v.id, t.trims[v.id]);
        return { v, trim, make: store.make(v.id) };
      }

      // ---------- dynamic: targets table, plan, head-to-head ----------
      function targetsCard(tg) {
        const r = tg.ref;
        const T = tg.tiers;
        const keys = ['great', 'good', 'walk'];
        const row = (label, fn, cls) => h('tr', { class: cls || '' }, h('td', null, label), keys.map((k) => h('td', null, fn(T[k], k))));
        const tbl = h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, h('th', null, ''), h('th', { class: 'th-great' }, 'Great'), h('th', { class: 'th-good' }, 'Good'), h('th', { class: 'th-walk' }, 'Walk-away'))),
          h('tbody', null,
            row('Selling price', (x) => usd(x.inputs.sellingPrice)),
            row('Off MSRP', (x, k) => r.tiers[k].discPct + '%'),
            row('Incentives', (x) => (x.inputs.rebates ? '-' + usd(x.inputs.rebates) : '$0')),
            row('Money factor', (x) => fmt.mf(x.inputs.mf)),
            row('APR equiv.', (x) => (x.inputs.mf * 2400).toFixed(2) + '%'),
            row('Residual', () => r.rvPct.toFixed(1) + '%'),
            row('Dealer fees', (x) => usd(x.inputs.dealerFee)),
            row('Monthly w/ tax', (x) => usd(x.result.monthly), 'em'),
            row('Due at signing', (x) => usd(x.result.das), 'em'),
            row('True monthly', (x) => usd(x.result.trueMonthly)),
            row('Total cost', (x) => usd(x.result.netCost))));
        return h('section', { class: 'card' },
          h('h2', null, 'Your targets', h('span', { class: 'sub' }, r.term + ' mo \u00b7 ' + fmt.num(r.miles) + ' mi')),
          h('div', { class: 'tbl-wrap' }, tbl),
          h('p', { class: 'hint mt-s' }, 'Tax ' + st.settings.taxRate + '% (Broward). Monthly includes tax. True monthly = everything you pay over the lease divided by the months. Money factors assume top-tier credit (about 720+).'),
          r.customRv || r.customMf ? h('div', { class: 'tag-row' }, ui.pill('Using your program numbers', 'good')) : h('div', { class: 'tag-row' }, ui.pill('Lender numbers reported Oct 2026: verify for 33441', 'info')));
      }

      function planCard(tg, v, trim) {
        const r = tg.ref;
        const g = tg.tiers.good;
        const steps = [
          ['Open at Great.', 'Ask for ' + usd(tg.tiers.great.inputs.sellingPrice) + ' and the base money factor.'],
          ['Aim to close at Good.', 'Selling price near ' + usd(g.inputs.sellingPrice) + ' (' + r.tiers.good.discPct + '% off), money factor at or under ' + fmt.mf(g.inputs.mf) + '.'],
          ['Walk away above Walk-away,', 'or if there is any market adjustment, add-on, or money factor over ' + fmt.mf(tg.tiers.walk.inputs.mf) + '.']
        ];
        return h('section', { class: 'card' },
          h('h2', null, 'Your negotiation plan'),
          h('ol', null, steps.map((s) => h('li', null, h('b', null, s[0] + ' '), s[1]))),
          h('p', { class: 'hint' }, 'Estimated dealer invoice about ' + usd(r.invoice) + ' (about 95.5% of base MSRP plus destination). Holdback and incentives mean dealers can go below it.'),
          h('div', { class: 'btn-row mt' },
            h('button', { class: 'btn', type: 'button', onclick: () => {
              LC.app.newCheck((c) => { c.price = g.inputs.sellingPrice; c.dealerFee = g.inputs.dealerFee; });
            } }, ui.icon('calc', 18), 'Test the Good numbers'),
            h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.copyText(cheatSheet(tg, v, trim), 'Cheat sheet copied') }, ui.icon('copy', 18), 'Copy cheat sheet'),
            h('button', { class: 'btn secondary', type: 'button', onclick: () => ui.shareText('Lease targets', cheatSheet(tg, v, trim)) }, ui.icon('share', 18), 'Share')));
      }

      function headToHeadCard() {
        const items = data.vehicles.map((v) => {
          const tid = t.trims[v.id];
          return { v, trim: store.trim(v.id, tid), make: store.make(v.id), tg: store.targetsFor(v.id, tid) };
        });
        const rowf = (label, fn, cls) => h('tr', { class: cls || '' }, h('td', null, label), items.map((x) => h('td', null, fn(x))));
        return h('section', { class: 'card' },
          h('h2', null, 'Head to head', h('span', { class: 'sub' }, 'your selected trims')),
          h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
            h('thead', null, h('tr', null, h('th', null, ''), items.map((x) => h('th', null, x.v.name.split(' ')[1])))),
            h('tbody', null,
              rowf('Trim', (x) => x.trim.name),
              rowf('Engine', (x) => x.trim.engine || '-'),
              rowf('MSRP', (x) => usd(x.tg.ref.msrp)),
              rowf('Great / mo', (x) => usd(x.tg.tiers.great.result.monthly)),
              rowf('Good / mo', (x) => usd(x.tg.tiers.good.result.monthly), 'em'),
              rowf('Walk-away / mo', (x) => usd(x.tg.tiers.walk.result.monthly)),
              rowf('Good: due at signing', (x) => usd(x.tg.tiers.good.result.das)),
              rowf('Residual', (x) => x.tg.ref.rvPct.toFixed(1) + '%'),
              rowf('Warranty', (x) => '5 yr/60k, 10 yr/100k pwrtrain'),
              rowf('Roadside', (x) => x.make.roadside)))),
          h('p', { class: 'hint mt-s' }, 'Same term, miles and structure for both. Neither brand includes free scheduled maintenance on 2026+ models (Hyundai ended its program with MY2026, reported). Quote both: the cheaper one on paper can flip once real dealer numbers arrive.'));
      }

      function buildDynamic() {
        ui.clear(dyn);
        const { v, trim } = current();
        const tg = store.targetsFor(v.id, trim.id);
        dyn.append(targetsCard(tg), planCard(tg, v, trim), headToHeadCard());
      }

      // ---------- controls ----------
      function buildControls() {
        ui.clear(controls);
        const { v, trim } = current();
        const vehSeg = ui.seg(data.vehicles.map((x) => ({ v: x.id, label: x.name })), t.vehicleId, (id) => { t.vehicleId = id; store.save(); rebuildAll(); });
        const trimSel = ui.selectField({
          label: 'Trim',
          options: v.trims.map((x) => ({ v: x.id, label: x.name + (x.custom ? '' : ' \u00b7 ' + usd(x.msrp)) })),
          value: trim.id,
          onChange: (id) => { t.trims[v.id] = id; store.save(); rebuildAll(); }
        });
        const termChips = ui.chips(data.terms.map((n) => ({ v: n, label: n + ' mo' })), t.term, (n) => { t.term = n; store.save(); rebuildLower(); });
        const milesChips = ui.chips(data.miles.map((m) => ({ v: m, label: fmt.num(m) + ' mi' })), t.miles, (m) => { t.miles = m; store.save(); rebuildLower(); });
        const structSeg = ui.seg([{ v: 'up', label: 'Fees at signing' }, { v: 'sd', label: 'Sign & drive' }], t.struct, (s) => { t.struct = s; store.save(); buildDynamic(); });
        const down = ui.numInput({ label: 'Cash down (optional)', prefix: '$', value: t.cashDown || 0, onChange: (x) => { t.cashDown = x || 0; store.save(); buildDynamic(); }, hint: 'Lowers the monthly but not your true cost, and is lost if the car is totaled. Keep it at $0 if you can.' });
        controls.append(h('section', { class: 'card' },
          vehSeg,
          h('div', { class: 'mt' }, trimSel.el),
          h('div', { class: 'hint', style: { marginTop: '-6px', marginBottom: '10px' } }, trim.note),
          h('div', { class: 'lbl' }, 'Term'), termChips,
          h('div', { class: 'lbl mt-s' }, 'Miles per year'), milesChips,
          h('div', { class: 'lbl mt-s' }, 'Structure'), structSeg,
          h('div', { class: 'hint mb0', style: { margin: '6px 0 12px' } }, t.struct === 'sd' ? 'Sign & drive rolls fees into the lease: a higher payment with only the first payment due.' : 'Fees paid at signing: the typical advertised structure.'),
          down.el));
      }

      // ---------- lower accordions ----------
      function incentivesBlock() {
        const { make } = current();
        const sel = t.incentives[make.id] || (t.incentives[make.id] = {});
        const total = h('b', null, usd(store.incentivesTotal(make.id)));
        const box = h('div');
        make.incentives.forEach((inc) => {
          const cb = h('input', { type: 'checkbox', id: 'inc-' + make.id + '-' + inc.id, 'aria-label': inc.label });
          cb.checked = !!sel[inc.id];
          cb.addEventListener('change', () => { sel[inc.id] = cb.checked; store.save(); total.textContent = usd(store.incentivesTotal(make.id)); buildDynamic(); });
          box.appendChild(h('label', { class: 'check', for: cb.id }, cb,
            h('div', { class: 'grow' }, h('div', { class: 't' }, inc.label + ' (' + usd(inc.amt) + ')'), inc.note ? h('div', { class: 'why' }, inc.note) : null)));
        });
        return ui.accordion('Incentives I qualify for', [
          h('p', { class: 'hint' }, 'Reported ' + make.name + ' amounts for Oct 2026. They change monthly, so confirm each one on the worksheet. Costco Auto, employer and alumni programs vary: ask.'),
          box,
          h('div', { class: 'kv total' }, h('span', null, 'Applied in your targets'), total)
        ], { icon: 'tag', sub: 'Loyalty, conquest, military and more' });
      }

      function editorBlock() {
        const { v, trim, make } = current();
        const o = store.overridesFor(trim.id);
        const scen = store.scenKey(t.term, t.miles);
        const ref = store.refFor(v.id, trim.id, t.term, t.miles);
        const f = [];
        const msrp = ui.numInput({ label: 'MSRP incl. destination & options', prefix: '$', value: o.msrp == null ? null : o.msrp, auto: trim.msrp, onChange: (x) => { store.setOverride(trim.id, 'msrp', x); buildDynamic(); }, hint: 'Use the window sticker. It often runs $1,000-$2,500 above base plus destination (paint, mats, accessories).' });
        const rv = ui.numInput({ label: 'Residual % for ' + t.term + ' mo / ' + fmt.num(t.miles) + ' mi', suffix: '%', decimals: 1, value: o.rv[scen] == null ? null : o.rv[scen], auto: ref.rvDefault, onChange: (x) => { store.setOverride(trim.id, 'rv', x, t.term, t.miles); buildDynamic(); }, hint: 'From the lender program (Edmunds forum or dealer).' });
        const mf = ui.numInput({ label: 'Base money factor (buy rate) for ' + t.term + ' mo', decimals: 5, group: false, value: o.mf[t.term] == null ? null : o.mf[t.term], auto: ref.mfDefault, onChange: (x) => { store.setOverride(trim.id, 'mf', x, t.term, t.miles); buildDynamic(); }, hint: 'APR is the money factor x 2400. It changes with the term.' });
        const lc = ui.numInput({ label: 'Program lease cash', prefix: '$', value: o.leaseCash == null ? null : o.leaseCash, auto: ref.leaseCashDefault, showEst: ref.leaseCashDefault > 0, onChange: (x) => { store.setOverride(trim.id, 'leaseCash', x); buildDynamic(); }, hint: 'Manufacturer cash that lowers the cap cost, when the program has any for this trim.' });
        const acq = ui.numInput({ label: 'Acquisition fee', prefix: '$', value: o.acq == null ? null : o.acq, auto: make.acqFee, onChange: (x) => { store.setOverride(trim.id, 'acq', x); buildDynamic(); } });
        f.push(msrp.el, rv.el, mf.el, lc.el, acq.el);
        const links = h('div', { class: 'btn-row' },
          h('a', { class: 'btn ghost small', href: v.id === 'telluride' ? data.links.edmundsTelluride : data.links.edmundsPalisade, target: '_blank', rel: 'noopener noreferrer' }, ui.icon('ext', 16), 'Edmunds lease thread'),
          h('a', { class: 'btn ghost small', href: data.links.leasehackr, target: '_blank', rel: 'noopener noreferrer' }, ui.icon('ext', 16), 'Leasehackr'));
        return ui.accordion('Edit program numbers', [
          ui.banner('info', 'info', [h('b', null, 'This is the most valuable step. '), 'Post ZIP 33441, your trim, term, miles and credit tier in the Edmunds lease thread for the model. Moderators reply with the money factor, residual and lease cash. Enter them here and every target sharpens.']),
          f, links,
          h('button', { class: 'btn danger small mt', type: 'button', onclick: () => { store.clearOverrides(trim.id); rebuildLower(); buildDynamic(); ui.toast('Reset to estimates'); } }, 'Reset this trim to estimates')
        ], { icon: 'edit', sub: store.hasOverrides(trim.id) ? 'You have custom numbers for this trim' : 'Estimates are in use' , open: false });
      }

      function realityBlock() {
        const m = data.market;
        return ui.accordion('Reality check: what the market is doing', [
          h('p', { class: 'hint' }, m.note),
          h('div', { class: 'section-title', style: { margin: '6px 0 6px' } }, 'Lender buy rates (Edmunds forum, Oct 2026)'),
          m.lender.map((a) => h('div', { class: 'kv', style: { display: 'block' } }, h('b', null, a.car), h('div', { class: 'why' }, a.terms + ': MF ' + a.mf + ', residual ' + a.rv + ', lease cash ' + a.cash))),
          h('p', { class: 'hint mt-s' }, 'Posted by forum moderators for other ZIP codes (a Tampa ZIP matched). Southeast rates should be close but confirm for 33441.'),
          h('p', null, h('b', null, 'Telluride market: '), m.telluride),
          h('div', { class: 'section-title', style: { margin: '10px 0 6px' } }, 'Advertised South Florida deals (reported)'),
          m.ads.map((a) => h('div', { class: 'kv' }, h('span', null, a.car), h('span', null, a.pay + '/mo \u00b7 ' + a.das + ' due'))),
          h('p', { class: 'hint mt-s' }, 'Reported via listing aggregators in late Oct 2026, so treat them as a rough guide and verify. ' + m.ads[0].detail),
          h('p', null, h('b', null, 'Markup example: '), m.markupExample),
          h('p', null, h('b', null, 'Circle A: '), m.circleA),
          h('p', null, h('b', null, 'A real deal: '), m.realDeal),
          h('p', { class: 'hint' }, 'Rule of thumb: pre-tax monthly of about 1% of MSRP (with little down) is considered good, 0.75% great. Strong-demand 3-row SUVs like these usually land a bit above 1%.')
        ], { icon: 'flag', sub: 'Lender numbers, averages and ads' });
      }

      function sourcesBlock() {
        return ui.accordion('Sources and confidence', [
          h('p', null, h('b', null, 'Verified: '), 'MSRPs and destination from Kia and Hyundai press releases, Florida tax rate (DOR) and registration fees (FLHSMV).'),
          h('p', null, h('b', null, 'Reported by forum moderators: '), 'lender base money factors and residuals for 36 months (Edmunds, Oct 2026). Other terms and mileage tiers are estimated from the same pattern.'),
          h('p', null, h('b', null, 'Estimated: '), 'discount tiers (Great, Good, Walk-away), typical dealer fees, and your exact ZIP rates.'),
          h('p', null, h('b', null, 'Reported: '), 'advertised deals, incentives and the Nov 2 program end date.'),
          h('ul', null, data.sources.map((s) => h('li', null, h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.label))))
        ], { icon: 'shield', sub: 'What is verified and what is estimated' });
      }

      function buildLower() {
        ui.clear(rest);
        rest.append(incentivesBlock(), editorBlock(), realityBlock(), sourcesBlock());
      }
      function rebuildLower() { buildLower(); buildDynamic(); }
      function rebuildAll() { buildControls(); buildLower(); buildDynamic(); }

      buildControls();
      buildDynamic();
      buildLower();
    }
  };
})();
