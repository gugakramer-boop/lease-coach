/* Lease Coach: deal advisor (targets, grading, negotiation levers). Pure logic, no DOM.
   Browser: window.LC.advisor   Node: require('./advisor.js') */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./calc.js'));
  else { root.LC = root.LC || {}; root.LC.advisor = factory(root.LC.calc); }
})(typeof self !== 'undefined' ? self : this, function (calc) {
  'use strict';

  const num = calc.num;
  const clamp = calc.clamp;
  const TIER_KEYS = ['great', 'good', 'walk'];
  const has = (v) => v !== undefined && v !== null && v !== '';
  const usd = (x) => (x < 0 ? '-$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-US');
  const pct = (x, d) => (Math.round(x * Math.pow(10, d == null ? 1 : d)) / Math.pow(10, d == null ? 1 : d)) + '%';

  /* Reference numbers (residual, base money factor, incentives, fee norms) for one scenario.
     ctx.override holds numbers the user typed in from a real quote or the Edmunds forum. */
  function reference(trim, make, vehicle, ctx, data) {
    ctx = ctx || {};
    const ov = ctx.override || {};
    const term = ctx.term || 36;
    const miles = ctx.miles || 10000;
    const termRv = (data.rvAdj.term[make.id] || {})[term] || 0;
    const termMf = ((data.mfAdj && data.mfAdj.term[make.id]) || {})[term] || 0;
    const rvDefault = clamp(trim.rv + termRv + (data.rvAdj.miles[miles] || 0), 35, 85);
    const mfDefault = Math.max(0.0005, trim.mf + termMf);
    const msrp = has(ov.msrp) ? num(ov.msrp) : trim.msrp;
    const leaseCashDefault = trim.leaseCash || 0;
    const leaseCash = has(ov.leaseCash) ? num(ov.leaseCash) : leaseCashDefault;
    const incentives = num(ctx.incentives);
    return {
      trimId: trim.id, term, miles, msrp,
      rvPct: has(ov.rv) ? num(ov.rv) : rvDefault, rvDefault,
      baseMf: has(ov.mf) ? num(ov.mf) : mfDefault, mfDefault,
      leaseCash, leaseCashDefault, incentives, rebateAvail: leaseCash + incentives,
      acqFee: has(ov.acq) ? num(ov.acq) : make.acqFee,
      regFee: data.fl.regFee, regOfficial: data.fl.regOfficial,
      overMile: make.overMile, dispoFee: make.dispoFee, purchaseFee: make.purchaseFee,
      tiers: vehicle.tiers,
      invoice: Math.round((msrp - make.destination) * data.invoicePct + make.destination),
      customRv: has(ov.rv), customMf: has(ov.mf), customMsrp: has(ov.msrp)
    };
  }

  /* Calc inputs for a target tier. struct 'sd' = fees rolled into the lease (sign & drive); 'up' = fees paid at signing. */
  function tierInputs(ref, tierKey, opts) {
    opts = opts || {};
    const t = ref.tiers[tierKey];
    const cap = opts.struct === 'sd';
    return {
      msrp: ref.msrp,
      sellingPrice: Math.round(ref.msrp * (1 - t.discPct / 100)),
      addOns: t.addOns || 0,
      rebates: ref.rebateAvail,
      cashDown: num(opts.cashDown), tradeEquity: 0,
      term: ref.term, milesPerYear: ref.miles,
      residualPct: ref.rvPct, mf: ref.baseMf + t.mfAdd,
      taxRate: opts.taxRate != null ? opts.taxRate : 0.07, taxCashDown: true,
      acqFee: ref.acqFee, acqCap: cap,
      dealerFee: t.dealerFee, dealerCap: cap,
      regFee: ref.regFee, regCap: cap,
      otherFee: 0, otherCap: false, deposit: 0,
      overMile: ref.overMile, dispoFee: ref.dispoFee
    };
  }

  function targets(ref, opts) {
    const out = {};
    TIER_KEYS.forEach((k) => {
      const inputs = tierInputs(ref, k, opts);
      out[k] = { inputs, result: calc.compute(inputs) };
    });
    return { ref, tiers: out };
  }

  // The same offer, but with each tier's price / MF / fee levels, keeping the offer's structure.
  // Fees come from the reference (not the quote), so a genuinely lower fee earns credit and an inflated one is penalized.
  // Residual and incentives follow the better of quote and reference because the dealer does not control them.
  function benchInputs(i, ref, tierKey) {
    const t = ref.tiers[tierKey];
    return Object.assign({}, i, {
      sellingPrice: Math.round(i.msrp * (1 - t.discPct / 100)),
      addOns: t.addOns || 0,
      mf: ref.baseMf + t.mfAdd,
      residualPct: Math.max(i.residualPct, ref.rvPct),
      rebates: Math.max(i.rebates, ref.rebateAvail),
      acqFee: ref.acqFee,
      dealerFee: t.dealerFee,
      regFee: ref.regFee,
      otherFee: 0
    });
  }

  // Piecewise-linear score on true monthly cost: Great = 93, Good = 84, Walk-away = 68.
  function scoreFrom(actual, great, good, walk) {
    const eps = 1;
    const g = great;
    const d = Math.max(good, g + eps);
    const w = Math.max(walk, d + eps);
    let s;
    if (actual <= g) s = 93 + 7 * Math.min(1, (g - actual) / (0.06 * Math.max(g, 1)));
    else if (actual <= d) s = 93 - 9 * (actual - g) / (d - g);
    else if (actual <= w) s = 84 - 16 * (actual - d) / (w - d);
    else s = 68 - 28 * (actual - w) / (w - d);
    return clamp(Math.round(s), 0, 100);
  }

  const GRADES = [[97, 'A+'], [93, 'A'], [90, 'A-'], [87, 'B+'], [83, 'B'], [80, 'B-'], [76, 'C+'], [72, 'C'], [68, 'C-'], [60, 'D'], [0, 'F']];
  function gradeFor(score) {
    for (let k = 0; k < GRADES.length; k++) if (score >= GRADES[k][0]) return GRADES[k][1];
    return 'F';
  }
  function verdictFor(score) {
    if (score >= 90) return { tone: 'good', title: 'Excellent deal', text: 'This is at or near the best realistic outcome. Verify the contract matches line by line, then sign.' };
    if (score >= 80) return { tone: 'good', title: 'Good deal', text: 'Solid. One more push on the biggest lever below could make it great.' };
    if (score >= 68) return { tone: 'warn', title: 'Fair deal', text: 'Workable but not great. Counter on the levers below, and get at least one competing quote.' };
    if (score >= 50) return { tone: 'bad', title: 'Below market', text: 'You are overpaying. Counter hard on the levers below, or walk and get other quotes.' };
    return { tone: 'bad', title: 'Poor deal', text: 'Walk away from these numbers. Request a fresh itemized quote from other dealers.' };
  }

  function buildFlags(own, ref, opts) {
    const i = own.inputs;
    const flags = [];
    const push = (level, key, title, detail) => flags.push({ level, key, title, detail });
    const g = ref.tiers.great, d = ref.tiers.good, w = ref.tiers.walk;

    if (i.msrp > 0 && i.sellingPrice > 0) {
      const dp = own.discountPct;
      if (dp <= 0) push('bad', 'price', 'Price is at or above MSRP', 'Never pay over sticker. Ask for the market adjustment / add-ons to be removed, or go to another dealer.');
      else if (dp < w.discPct) push('bad', 'price', 'Only ' + pct(dp) + ' off MSRP', 'Walk-away line is ' + pct(w.discPct) + '. Good is ' + pct(d.discPct) + ', Great ' + pct(g.discPct) + '.');
      else if (dp < d.discPct) push('warn', 'price', pct(dp) + ' off MSRP', 'Good is ' + pct(d.discPct) + ' (' + usd(i.msrp * d.discPct / 100) + ' off). Great is ' + pct(g.discPct) + '.');
      else if (dp < g.discPct) push('good', 'price', pct(dp) + ' off MSRP', 'Meets the Good target. Great would be ' + pct(g.discPct) + '.');
      else push('good', 'price', pct(dp) + ' off MSRP', 'At or beyond the Great target.');
    }

    if (i.mf > 0) {
      const extra = i.mf - ref.baseMf;
      const perMonth = (own.adjCap + own.residual) * extra * (1 + i.taxRate);
      if (extra > w.mfAdd + 1e-9) push('bad', 'mf', 'Money factor looks marked up', usd(perMonth) + '/mo (' + usd(perMonth * own.term) + ' over the lease) above the base ' + ref.baseMf.toFixed(5) + '. Ask for the lender buy rate.');
      else if (extra > d.mfAdd + 1e-9) push('warn', 'mf', 'Money factor above base', usd(perMonth) + '/mo above the base ' + ref.baseMf.toFixed(5) + '. Ask them to remove the markup.');
      else if (extra > 1e-9) push('info', 'mf', 'Small money factor markup', 'About ' + usd(perMonth) + '/mo above base. Still worth asking for the buy rate.');
      else push('good', 'mf', 'Money factor at or below base', 'APR equivalent: ' + (i.mf * 2400).toFixed(2) + '%.');
    }

    const rvGap = ref.rvPct - i.residualPct;
    if (i.residualPct > 0) {
      if (rvGap > 0.4) push(rvGap > 3 ? 'bad' : 'warn', 'rv', 'Residual ' + pct(i.residualPct) + ' vs program ~' + pct(ref.rvPct), 'A lower residual raises your payment. Confirm it is for the right trim, term and mileage and ask them to re-run it.');
      else push('good', 'rv', 'Residual matches the program', pct(i.residualPct) + ' of MSRP.');
    }

    if (i.addOns > 0) push(i.addOns > 500 ? 'bad' : 'warn', 'addons', 'Dealer add-ons / markup ' + usd(i.addOns), 'Pure dealer profit. Ask for them to be removed, or take the same amount off the price.');

    if (i.dealerFee > w.dealerFee) push('bad', 'dealerfee', 'Dealer fees are high: ' + usd(i.dealerFee), 'Florida has no cap, but South Florida norms are about $800-$1,200 total. Offset any excess with a lower price.');
    else if (i.dealerFee > d.dealerFee) push('warn', 'dealerfee', 'Dealer fees ' + usd(i.dealerFee), 'Above the typical ' + usd(d.dealerFee) + '. Ask for an equal price reduction.');

    if (i.acqFee > ref.acqFee + 150) push('warn', 'acq', 'Acquisition fee ' + usd(i.acqFee), 'Kia and Hyundai lenders charge about ' + usd(ref.acqFee) + '. Ask whether it has been marked up.');
    else if (i.acqFee <= 0) push('info', 'acq0', 'No acquisition fee entered', 'Kia and Hyundai lenders charge about ' + usd(ref.acqFee) + '. If none is listed, ask whether it is rolled into the price.');
    if (i.dealerFee <= 0) push('info', 'dealer0', 'No dealer fee entered', 'Confirm there is truly no doc or filing fee. Many Florida dealers add one at signing.');
    if (i.regFee > ref.regFee * 1.35 + 40) push('warn', 'reg', 'Tag/title/registration ' + usd(i.regFee), 'Florida base fees come to about ' + usd(ref.regOfficial) + '. Ask for the breakdown.');
    else if (i.regFee <= 0) push('info', 'reg0', 'Tag, title and registration not included', 'Florida state fees are about ' + usd(ref.regOfficial) + ' and are due at signing. Add them for a fair comparison.');
    if (i.otherFee > 0) push('warn', 'other', 'Other fees ' + usd(i.otherFee), 'Ask exactly what these are. Anything not government- or lender-mandated is negotiable.');

    const down = i.cashDown + Math.max(0, i.tradeEquity);
    if (down > 0) push(i.cashDown > 2000 ? 'warn' : 'info', 'down', 'Cash down ' + usd(down), 'A down payment is lost if the car is totaled or stolen, and it does not lower your true cost. Prefer sign-and-drive.');

    if (opts.plannedMiles && i.milesPerYear < opts.plannedMiles) {
      const over = (opts.plannedMiles - i.milesPerYear) * (own.term / 12) * i.overMile;
      push('bad', 'miles', 'Allowance below your driving plan', 'You expect ' + opts.plannedMiles.toLocaleString('en-US') + ' mi/yr but this lease allows ' + i.milesPerYear.toLocaleString('en-US') + '. Expect about ' + usd(over) + ' in overage at $' + i.overMile.toFixed(2) + '/mi.');
    }

    if (opts.quotedMonthly > 0) {
      const mine = opts.quotedTaxIncluded === false ? own.base : own.monthly;
      const diff = opts.quotedMonthly - mine;
      if (diff > 3) push('bad', 'quote', 'Their payment is ' + usd(diff) + '/mo above the math', 'Something is not in the numbers you entered: a hidden fee, markup, lower residual or missing rebate. Ask for the full worksheet.');
      else if (diff < -3) push('info', 'quote', 'Their payment is ' + usd(-diff) + '/mo below the math', 'They may be applying a rebate or discount you did not enter. Add it to see the full picture.');
      else push('good', 'quote', 'Their payment matches the math', 'The numbers you entered explain the quoted payment.');
    }
    if (opts.quotedDas > 0) {
      const diff = opts.quotedDas - own.das;
      if (diff > 75) push('bad', 'dasq', 'Due at signing is ' + usd(diff) + ' higher than the math', 'Ask for an itemized list of what is due at signing.');
      else if (diff < -75) push('info', 'dasq', 'Due at signing is ' + usd(-diff) + ' lower than the math', 'Some fees may be rolled into the lease, which raises the monthly.');
    }

    const order = { bad: 0, warn: 1, info: 2, good: 3 };
    return flags.sort((a, b) => order[a.level] - order[b.level]);
  }

  function buildLevers(own, ref) {
    const i = own.inputs;
    const levers = [];
    const good = ref.tiers.good;
    function add(key, title, mod, ask) {
      const alt = calc.compute(Object.assign({}, i, mod));
      const saveTotal = own.netCost - alt.netCost;
      const saveMonthly = own.monthly - alt.monthly;
      if (saveTotal > 1) levers.push({ key, title, ask, saveMonthly, saveTotal, mod });
    }
    const goodPrice = Math.round(i.msrp * (1 - good.discPct / 100));
    if (i.sellingPrice > goodPrice) add('price', 'Selling price to ' + usd(goodPrice) + ' (' + pct(good.discPct) + ' off MSRP)', { sellingPrice: goodPrice },
      'Selling price of ' + usd(goodPrice) + ' or less. That is ' + pct(good.discPct) + ' off MSRP.');
    if (i.mf > ref.baseMf + 1e-9) add('mf', 'Money factor to base ' + ref.baseMf.toFixed(5), { mf: ref.baseMf },
      'The lender buy-rate money factor of ' + ref.baseMf.toFixed(5) + ' (about ' + (ref.baseMf * 2400).toFixed(2) + '% APR), with no dealer markup.');
    if (i.addOns > 0) add('addons', 'Remove add-ons / markup (' + usd(i.addOns) + ')', { addOns: 0 },
      'No dealer add-ons or market adjustment. Remove ' + usd(i.addOns) + ' from the capitalized cost.');
    if (ref.rebateAvail > i.rebates) add('rebates', 'Apply all incentives (' + usd(ref.rebateAvail) + ')', { rebates: ref.rebateAvail },
      'Apply every incentive I qualify for (' + usd(ref.rebateAvail) + ' total) to the capitalized cost.');
    if (i.residualPct < ref.rvPct - 0.4) add('rv', 'Residual to ' + pct(ref.rvPct), { residualPct: ref.rvPct },
      'Re-run the quote with the lender residual of about ' + pct(ref.rvPct) + ' for this trim, term and mileage.');
    if (i.dealerFee > good.dealerFee) add('dealerfee', 'Dealer fees to ' + usd(good.dealerFee), { dealerFee: good.dealerFee },
      'Reduce dealer fees to ' + usd(good.dealerFee) + ', or lower the price by the difference.');
    if (i.acqFee > ref.acqFee + 1) add('acq', 'Acquisition fee to ' + usd(ref.acqFee), { acqFee: ref.acqFee },
      'Acquisition fee at the lender amount (' + usd(ref.acqFee) + ') with no markup.');
    if (i.regFee > ref.regFee * 1.35 + 40) add('reg', 'Registration to ' + usd(ref.regFee), { regFee: ref.regFee },
      'An itemized tag, title and registration breakdown at the state amounts.');
    if (i.otherFee > 0) add('other', 'Drop other fees (' + usd(i.otherFee) + ')', { otherFee: 0 },
      'Remove the "other" fees, or explain exactly what they are.');
    return levers.sort((a, b) => b.saveTotal - a.saveTotal);
  }

  function evaluate(raw, ref, opts) {
    opts = opts || {};
    const own = calc.compute(raw);
    const bench = {};
    TIER_KEYS.forEach((k) => { bench[k] = calc.compute(benchInputs(own.inputs, ref, k)); });
    const score = scoreFrom(own.trueMonthly, bench.great.trueMonthly, bench.good.trueMonthly, bench.walk.trueMonthly);
    return {
      own, bench, score, grade: gradeFor(score), verdict: verdictFor(score),
      flags: buildFlags(own, ref, opts),
      levers: buildLevers(own, ref)
    };
  }

  // Score a quote that only has payment + due at signing (no line items).
  function quickScore(monthly, das, term, bench) {
    const trueMonthly = (das + monthly * (term - 1)) / term;
    return {
      trueMonthly,
      score: scoreFrom(trueMonthly, bench.great.trueMonthly, bench.good.trueMonthly, bench.walk.trueMonthly)
    };
  }

  return {
    TIER_KEYS, reference, tierInputs, targets, benchInputs, scoreFrom, gradeFor, verdictFor,
    buildFlags, buildLevers, evaluate, quickScore, usd, pct
  };
});
