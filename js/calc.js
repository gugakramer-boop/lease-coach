/* Lease Coach: pure lease math (no DOM).
   Browser: window.LC.calc   Node: require('./calc.js') */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.LC = root.LC || {}; root.LC.calc = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function num(v, fallback) {
    const fb = fallback === undefined ? 0 : fallback;
    if (typeof v === 'number') return Number.isFinite(v) ? v : fb;
    if (typeof v === 'string') {
      const x = parseFloat(v.replace(/[^0-9.\-]/g, ''));
      return Number.isFinite(x) ? x : fb;
    }
    return fb;
  }
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // Defaults mirror a typical Florida (Broward) captive-lender lease.
  const DEFAULTS = {
    msrp: 0, sellingPrice: 0, addOns: 0, rebates: 0, cashDown: 0, tradeEquity: 0,
    term: 36, milesPerYear: 10000, residualPct: 65, mf: 0.0023,
    taxRate: 0.07, taxCashDown: true,
    acqFee: 650, acqCap: true,
    dealerFee: 0, dealerCap: false,
    regFee: 0, regCap: false,
    otherFee: 0, otherCap: false,
    deposit: 0, overMile: 0.20, dispoFee: 400
  };

  const NUM_KEYS = ['msrp', 'sellingPrice', 'addOns', 'rebates', 'cashDown', 'tradeEquity', 'residualPct', 'mf',
    'taxRate', 'acqFee', 'dealerFee', 'regFee', 'otherFee', 'deposit', 'overMile', 'dispoFee', 'milesPerYear'];
  const BOOL_KEYS = ['taxCashDown', 'acqCap', 'dealerCap', 'regCap', 'otherCap'];

  function normalize(raw) {
    const r = Object.assign({}, DEFAULTS, raw || {});
    const out = {};
    NUM_KEYS.forEach((k) => { out[k] = num(r[k]); });
    out.term = Math.max(1, Math.round(num(r.term, 36)) || 36);
    BOOL_KEYS.forEach((k) => { out[k] = !!r[k]; });
    return out;
  }

  /* Full lease computation.
     Cap cost  = price + add-ons + capitalized fees (+ negative equity)
     Adj. cap  = cap cost - (cash down + positive equity + rebates)
     Payment   = (adjCap - residual)/term + (adjCap + residual) * MF   [pre-tax]
     Florida taxes each payment, the cash down and the taxable up-front fees. */
  function compute(raw) {
    const i = normalize(raw);
    const term = i.term;
    const residual = i.msrp * i.residualPct / 100;

    const feeDefs = [
      { key: 'acq', label: 'Acquisition fee', amt: i.acqFee, cap: i.acqCap, taxable: true },
      { key: 'dealer', label: 'Dealer / doc fees', amt: i.dealerFee, cap: i.dealerCap, taxable: true },
      { key: 'reg', label: 'Title, tag & registration', amt: i.regFee, cap: i.regCap, taxable: false },
      { key: 'other', label: 'Other fees', amt: i.otherFee, cap: i.otherCap, taxable: true }
    ];
    const capFees = sum(feeDefs.filter((f) => f.cap).map((f) => f.amt));
    const upFees = sum(feeDefs.filter((f) => !f.cap).map((f) => f.amt));
    const upTaxableFees = sum(feeDefs.filter((f) => !f.cap && f.taxable).map((f) => f.amt));

    const negEquity = Math.max(0, -i.tradeEquity);
    const posEquity = Math.max(0, i.tradeEquity);

    const grossCap = i.sellingPrice + i.addOns + capFees + negEquity;
    const capReduction = i.cashDown + posEquity + i.rebates;
    const adjCap = grossCap - capReduction;

    const depreciation = (adjCap - residual) / term;
    const rentCharge = (adjCap + residual) * i.mf;
    const base = depreciation + rentCharge;
    const monthlyTax = base * i.taxRate;
    const monthly = base + monthlyTax;

    const upTax = ((i.taxCashDown ? i.cashDown : 0) + upTaxableFees) * i.taxRate;
    const das = monthly + upFees + upTax + i.cashDown + i.deposit;

    const totalPayments = monthly * term;
    const totalOutlay = totalPayments + (das - monthly);
    const netCost = totalOutlay - i.deposit; // deposit is refundable
    const trueMonthly = netCost / term;
    const totalMiles = (term / 12) * i.milesPerYear;
    const costPerMile = totalMiles > 0 ? netCost / totalMiles : 0;

    const discountAmt = i.msrp - i.sellingPrice;
    const discountPct = i.msrp > 0 ? (discountAmt / i.msrp) * 100 : 0;
    const onePct = i.msrp > 0 ? ((base + (i.cashDown + posEquity) / term) / i.msrp) * 100 : 0;

    const warnings = [];
    if (i.msrp <= 0) warnings.push('Enter the MSRP.');
    if (i.sellingPrice <= 0) warnings.push('Enter the selling price.');
    if (i.msrp > 0 && i.sellingPrice > 0 && adjCap <= residual) warnings.push('Net cap cost is at or below the residual. Double-check the numbers.');

    return {
      inputs: i, term, residual,
      fees: feeDefs.map((f) => Object.assign({}, f, { taxAmt: f.cap || !f.taxable ? 0 : f.amt * i.taxRate })),
      capFees, upFees, upTaxableFees, grossCap, capReduction, adjCap,
      depreciation, rentCharge, base, monthlyTax, monthly,
      upTax, das, dueParts: { firstPayment: monthly, fees: upFees, tax: upTax, cashDown: i.cashDown, deposit: i.deposit },
      totalPayments, totalOutlay, netCost, trueMonthly, totalMiles, costPerMile,
      totalDepreciation: depreciation * term, totalRent: rentCharge * term,
      apr: i.mf * 2400, discountAmt, discountPct, onePct,
      valid: i.msrp > 0 && i.sellingPrice > 0,
      warnings
    };
  }

  // Reverse math: what net cap cost produces this pre-tax payment?
  function solveAdjCap(p) {
    return (p.base + p.residual * (1 / p.term - p.mf)) / (1 / p.term + p.mf);
  }
  // Reverse math: what money factor produces this pre-tax payment?
  function solveMf(p) {
    return (p.base - (p.adjCap - p.residual) / p.term) / (p.adjCap + p.residual);
  }

  const mfToApr = (mf) => mf * 2400;
  const aprToMf = (apr) => apr / 2400;

  function loanPayment(principal, aprPct, months) {
    if (months <= 0) return 0;
    const r = aprPct / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }
  function loanBalance(principal, aprPct, months, paid) {
    const r = aprPct / 100 / 12;
    const pmt = loanPayment(principal, aprPct, months);
    if (r === 0) return Math.max(0, principal - pmt * paid);
    const g = Math.pow(1 + r, paid);
    return Math.max(0, principal * g - pmt * (g - 1) / r);
  }
  // Florida purchase tax: 6% state on the full price + county surtax on the first $5,000.
  function flPurchaseTax(price, stateRate, surtaxRate, surtaxCap) {
    const s = stateRate == null ? 0.06 : stateRate;
    const t = surtaxRate == null ? 0.01 : surtaxRate;
    const c = surtaxCap == null ? 5000 : surtaxCap;
    return price * s + Math.min(price, c) * t;
  }

  return {
    num, clamp, sum, DEFAULTS, normalize, compute, solveAdjCap, solveMf,
    mfToApr, aprToMf, loanPayment, loanBalance, flPurchaseTax
  };
});
