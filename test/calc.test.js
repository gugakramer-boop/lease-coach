'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../js/calc.js');
const advisor = require('../js/advisor.js');
const data = require('../js/data.js');

const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `expected ${a} to be within ${tol} of ${b}`);

const BASE = {
  msrp: 30000, sellingPrice: 28000, residualPct: 60, mf: 0.0025, term: 36,
  taxRate: 0, acqFee: 0, dealerFee: 0, regFee: 0, otherFee: 0, rebates: 0, cashDown: 0, addOns: 0
};

test('classic lease payment: depreciation + rent charge', () => {
  const r = calc.compute(BASE);
  close(r.depreciation, 277.78);
  close(r.rentCharge, 115);
  close(r.base, 392.78);
  close(r.monthly, 392.78);
  close(r.das, 392.78);
  close(r.apr, 6.0, 1e-9);
});

test('Florida-style tax is applied to each payment', () => {
  const r = calc.compute(Object.assign({}, BASE, { taxRate: 0.07 }));
  close(r.monthly, 392.78 * 1.07);
  close(r.monthlyTax, 392.78 * 0.07);
});

test('fees paid up front add to due at signing (taxable ones are taxed)', () => {
  const r = calc.compute(Object.assign({}, BASE, { taxRate: 0.07, acqFee: 650, acqCap: false, dealerFee: 1000, dealerCap: false, regFee: 400, regCap: false }));
  close(r.upFees, 2050);
  close(r.upTax, (650 + 1000) * 0.07);
  close(r.das, r.monthly + 2050 + (650 + 1000) * 0.07);
});

test('capitalized fees raise the monthly instead of due at signing', () => {
  const up = calc.compute(Object.assign({}, BASE, { acqFee: 650, acqCap: false }));
  const cap = calc.compute(Object.assign({}, BASE, { acqFee: 650, acqCap: true }));
  assert.ok(cap.monthly > up.monthly);
  close(cap.das, cap.monthly);
  close(cap.grossCap, 28650);
  // Rolling a fee in costs a little extra rent charge but not much.
  assert.ok(cap.netCost - up.netCost < 100);
});

test('rebates and cash down reduce the adjusted cap cost', () => {
  const r = calc.compute(Object.assign({}, BASE, { rebates: 1000, cashDown: 2000, taxRate: 0.07 }));
  close(r.adjCap, 25000);
  close(r.das, r.monthly + 2000 + 2000 * 0.07);
});

test('true monthly cost includes everything and refunds the deposit', () => {
  const r = calc.compute(Object.assign({}, BASE, { taxRate: 0.07, acqFee: 650, acqCap: false, deposit: 500 }));
  const expected = (r.monthly * 36 + (r.das - r.monthly) - 500) / 36;
  close(r.trueMonthly, expected);
});

test('reverse solves round-trip', () => {
  const r = calc.compute(BASE);
  close(calc.solveAdjCap({ base: r.base, residual: r.residual, mf: 0.0025, term: 36 }), 28000, 0.01);
  close(calc.solveMf({ base: r.base, adjCap: r.adjCap, residual: r.residual, term: 36 }), 0.0025, 1e-8);
});

test('loan and Florida purchase tax helpers', () => {
  close(calc.loanPayment(30000, 6, 60), 579.98, 0.01);
  close(calc.loanBalance(30000, 6, 60, 36), 13086, 5);
  close(calc.loanBalance(30000, 6, 60, 60), 0, 0.5);
  close(calc.flPurchaseTax(50000), 3050, 1e-9);
  close(calc.flPurchaseTax(3000), 180 + 30, 1e-9);
});

test('normalize tolerates strings and blanks', () => {
  const n = calc.normalize({ msrp: '$58,335', sellingPrice: '', term: '36', acqCap: 1 });
  assert.equal(n.msrp, 58335);
  assert.equal(n.sellingPrice, 0);
  assert.equal(n.term, 36);
  assert.equal(n.acqCap, true);
});

function refFor(vehicleId, trimId, term = 36, miles = 10000, extra = {}) {
  const v = data.vehicles.find((x) => x.id === vehicleId);
  const t = v.trims.find((x) => x.id === trimId);
  return advisor.reference(t, data.makes[v.make], v, Object.assign({ term, miles }, extra), data);
}

test('reference applies residual/MF adjustments and honors overrides', () => {
  const ref = refFor('telluride', 'tel-xpro-sxp', 36, 10000);
  close(ref.rvPct, 68);
  close(ref.baseMf, 0.00241, 1e-9);
  const ref24 = refFor('telluride', 'tel-xpro-sxp', 24, 15000);
  close(ref24.rvPct, 67 + 6 - 2.5);
  close(ref24.baseMf, 0.00241 - 0.00028, 1e-9);
  const hy24 = refFor('palisade', 'pal-hcal', 24, 12000);
  close(hy24.rvPct, 68 + 10);
  close(hy24.baseMf, 0.00239 - 0.00025, 1e-9);
  assert.equal(hy24.leaseCash, 250);
  const ov = refFor('telluride', 'tel-xpro-sxp', 36, 10000, { override: { rv: 71, mf: 0.00248, leaseCash: 500 }, incentives: 750 });
  close(ov.rvPct, 71);
  close(ov.baseMf, 0.00248, 1e-9);
  close(ov.rebateAvail, 1250);
  assert.equal(ov.customRv, true);
});

test('every vehicle, trim, term and mileage gives finite, ordered targets', () => {
  data.vehicles.forEach((v) => {
    v.trims.forEach((t) => {
      data.terms.forEach((term) => {
        data.miles.forEach((miles) => {
          ['up', 'sd'].forEach((struct) => {
            const ref = refFor(v.id, t.id, term, miles);
            const tg = advisor.targets(ref, { struct });
            const g = tg.tiers.great.result, d = tg.tiers.good.result, w = tg.tiers.walk.result;
            [g, d, w].forEach((r) => assert.ok(Number.isFinite(r.monthly) && r.monthly > 0 && Number.isFinite(r.das) && Number.isFinite(r.trueMonthly), `${t.id} ${term}/${miles}`));
            assert.ok(g.trueMonthly < d.trueMonthly && d.trueMonthly < w.trueMonthly, `${t.id} ${term}/${miles}/${struct} true monthly ordering`);
            assert.ok(ref.rvPct > 40 && ref.rvPct < 85 && ref.baseMf > 0.0005 && ref.baseMf < 0.005, `${t.id} ${term}/${miles} reference sanity`);
          });
        });
      });
    });
  });
});

test('target tiers are ordered great < good < walk-away', () => {
  ['up', 'sd'].forEach((struct) => {
    data.vehicles.forEach((v) => {
      v.trims.forEach((t) => {
        const ref = refFor(v.id, t.id);
        const tg = advisor.targets(ref, { struct });
        const g = tg.tiers.great.result, d = tg.tiers.good.result, w = tg.tiers.walk.result;
        assert.ok(g.monthly < d.monthly && d.monthly < w.monthly, `${t.id} ${struct} monthly ordering`);
        assert.ok(g.trueMonthly < d.trueMonthly && d.trueMonthly < w.trueMonthly, `${t.id} ${struct} true monthly ordering`);
      });
    });
  });
});

test('sample targets are in a sane range for the top trims', () => {
  const tel = advisor.targets(refFor('telluride', 'tel-xpro-sxp'), { struct: 'up' }).tiers;
  const pal = advisor.targets(refFor('palisade', 'pal-cal'), { struct: 'up' }).tiers;
  // Advertised South Florida deals are ~ $690 / ~$650 pre-tax at 36/10k; Good should be in that neighbourhood.
  assert.ok(tel.good.result.base > 600 && tel.good.result.base < 760, 'telluride good base ' + tel.good.result.base);
  assert.ok(pal.good.result.base > 600 && pal.good.result.base < 760, 'palisade good base ' + pal.good.result.base);
});

test('scoring: evaluating a tier against itself returns the anchor score', () => {
  const ref = refFor('telluride', 'tel-xpro-sxp');
  const tg = advisor.targets(ref, { struct: 'up' });
  assert.equal(advisor.evaluate(tg.tiers.great.inputs, ref).score, 93);
  assert.equal(advisor.evaluate(tg.tiers.good.inputs, ref).score, 84);
  assert.equal(advisor.evaluate(tg.tiers.walk.inputs, ref).score, 68);
});

test('a marked-up, add-on-laden quote scores poorly and surfaces the right levers', () => {
  const ref = refFor('telluride', 'tel-xpro-sxp');
  const bad = Object.assign({}, advisor.targets(ref, { struct: 'up' }).tiers.good.inputs, {
    sellingPrice: ref.msrp + 500, addOns: 1295, mf: ref.baseMf + 0.0004, dealerFee: 1799, residualPct: ref.rvPct - 4
  });
  const own = advisor.evaluate(bad, ref).own;
  const ev = advisor.evaluate(bad, ref, { quotedMonthly: own.monthly + 60 });
  assert.ok(ev.score < 50, 'score ' + ev.score);
  const keys = ev.levers.map((l) => l.key);
  ['price', 'mf', 'addons', 'rv', 'dealerfee'].forEach((k) => assert.ok(keys.includes(k), 'missing lever ' + k));
  for (let k = 1; k < ev.levers.length; k++) assert.ok(ev.levers[k - 1].saveTotal >= ev.levers[k].saveTotal);
  assert.equal(ev.flags[0].level, 'bad');
  assert.ok(ev.flags.some((f) => f.key === 'quote' && f.level === 'bad'));
});

test('a deal better than Great scores 93+', () => {
  const ref = refFor('palisade', 'pal-cal');
  const best = Object.assign({}, advisor.targets(ref, { struct: 'up' }).tiers.great.inputs, { sellingPrice: Math.round(ref.msrp * 0.9) });
  const ev = advisor.evaluate(best, ref);
  assert.ok(ev.score >= 97, 'score ' + ev.score);
  assert.equal(ev.grade, 'A+');
});

test('grades map from score', () => {
  assert.equal(advisor.gradeFor(98), 'A+');
  assert.equal(advisor.gradeFor(84), 'B');
  assert.equal(advisor.gradeFor(68), 'C-');
  assert.equal(advisor.gradeFor(10), 'F');
});

test('a genuinely lower dealer fee earns credit and zero fees are flagged for confirmation', () => {
  const ref = refFor('telluride', 'tel-xpro-sxp');
  const good = advisor.targets(ref, { struct: 'up' }).tiers.good.inputs;
  const withFee = advisor.evaluate(good, ref);
  const noFee = advisor.evaluate(Object.assign({}, good, { dealerFee: 0 }), ref);
  assert.ok(noFee.score > withFee.score, 'score with $0 dealer fee ' + noFee.score + ' vs ' + withFee.score);
  assert.ok(noFee.flags.some((f) => f.key === 'dealer0' && f.level === 'info'));
  const noReg = advisor.evaluate(Object.assign({}, good, { regFee: 0 }), ref);
  assert.ok(noReg.flags.some((f) => f.key === 'reg0'));
});

test('levers carry their modification so asks can be combined into one payment', () => {
  const ref = refFor('palisade', 'pal-cal');
  const bad = Object.assign({}, advisor.targets(ref, { struct: 'up' }).tiers.good.inputs, { sellingPrice: ref.msrp, mf: ref.baseMf + 0.0004, addOns: 800 });
  const ev = advisor.evaluate(bad, ref);
  const mods = Object.assign.apply(null, [{}].concat(ev.levers.map((l) => l.mod)));
  const combined = calc.compute(Object.assign({}, ev.own.inputs, mods));
  assert.ok(combined.monthly < ev.own.monthly);
  assert.ok(combined.monthly <= ev.bench.good.monthly + 1, 'combined asks should reach the Good benchmark');
});

test('num keeps an explicit NaN fallback (used to reject invalid typing)', () => {
  assert.ok(Number.isNaN(calc.num('abc', NaN)));
  assert.equal(calc.num('abc'), 0);
  assert.equal(calc.num('1,234.5'), 1234.5);
  assert.equal(calc.num('0.00241'), 0.00241);
  assert.equal(calc.num(undefined), 0);
});
