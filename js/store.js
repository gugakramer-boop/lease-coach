/* Lease Coach: state, persistence (localStorage) and scenario helpers. */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  const data = LC.data;
  const advisor = LC.advisor;
  const calc = LC.calc;
  const KEY = 'leasecoach.v1';
  const AUTO_DEALER_FEE = data.fl.docFeeAvg;

  function defaults() {
    return {
      v: 1,
      profile: { name: '', phone: '', email: '', plannedMiles: 0 },
      settings: { theme: 'auto', taxRate: data.fl.taxRate },
      target: {
        vehicleId: 'telluride',
        trims: { telluride: 'tel-xpro-sxp', palisade: 'pal-cal' },
        term: 36, miles: 10000, struct: 'up', cashDown: 0,
        incentives: {}
      },
      program: { overrides: {} },
      calc: null,
      offers: [],
      checks: {}, asked: {},
      ui: { playbook: 'prepare', check: 'offer', welcomed: false }
    };
  }

  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const oneOf = (v, list, fb) => (list.indexOf(v) >= 0 ? v : fb);

  // Deep-merge saved data over the defaults, ignoring saved values whose type does not match.
  function merge(base, saved) {
    if (!isObj(saved)) return base;
    const out = Object.assign({}, base);
    Object.keys(saved).forEach((k) => {
      const b = base[k];
      const s = saved[k];
      if (!(k in base)) out[k] = s;
      else if (isObj(b)) out[k] = isObj(s) ? merge(b, s) : b;
      else if (Array.isArray(b)) out[k] = Array.isArray(s) ? s : b;
      else if (b === null) out[k] = s === null || isObj(s) ? s : b;
      else out[k] = typeof s === typeof b ? s : b;
    });
    return out;
  }

  // Make sure restored or imported state can never crash a view (bad ids, wrong shapes, unknown terms).
  function fixCalc(c, fallbackVehicleId) {
    if (!data.vehicles.some((v) => v.id === c.vehicleId)) c.vehicleId = fallbackVehicleId;
    const v = data.vehicles.find((x) => x.id === c.vehicleId);
    if (!v.trims.some((x) => x.id === c.trimId)) c.trimId = v.defaultTrim;
    c.term = oneOf(c.term, data.terms, 36);
    c.miles = oneOf(c.miles, data.miles, 10000);
    return c;
  }
  function sanitize(s) {
    const d = defaults();
    ['profile', 'settings', 'target', 'program', 'checks', 'asked', 'ui'].forEach((k) => { if (!isObj(s[k])) s[k] = d[k]; });
    const t = s.target;
    if (!data.vehicles.some((v) => v.id === t.vehicleId)) t.vehicleId = d.target.vehicleId;
    if (!isObj(t.trims)) t.trims = {};
    data.vehicles.forEach((v) => { if (!v.trims.some((x) => x.id === t.trims[v.id])) t.trims[v.id] = v.defaultTrim; });
    t.term = oneOf(t.term, data.terms, 36);
    t.miles = oneOf(t.miles, data.miles, 10000);
    t.struct = oneOf(t.struct, ['up', 'sd'], 'up');
    t.cashDown = calc.num(t.cashDown);
    if (!isObj(t.incentives)) t.incentives = {};
    Object.keys(t.incentives).forEach((k) => { if (!isObj(t.incentives[k])) delete t.incentives[k]; });
    if (!isObj(s.program.overrides)) s.program.overrides = {};
    Object.keys(s.program.overrides).forEach((k) => { if (!isObj(s.program.overrides[k])) delete s.program.overrides[k]; });
    s.settings.theme = oneOf(s.settings.theme, ['auto', 'light', 'dark'], 'auto');
    s.settings.taxRate = Math.max(0, calc.num(s.settings.taxRate, d.settings.taxRate));
    s.profile.plannedMiles = Math.max(0, calc.num(s.profile.plannedMiles));
    if (s.calc !== null && !isObj(s.calc)) s.calc = null;
    if (s.calc) fixCalc(s.calc, t.vehicleId);
    if (!Array.isArray(s.offers)) s.offers = [];
    s.offers = s.offers.filter((o) => isObj(o) && typeof o.id === 'string');
    s.offers.forEach((o) => {
      if (!data.vehicles.some((v) => v.id === o.vehicleId)) o.vehicleId = t.vehicleId;
      if (o.kind === 'full' && isObj(o.calc)) fixCalc(o.calc, o.vehicleId);
      else {
        o.kind = 'quick';
        if (!isObj(o.quick)) o.quick = { term: 36, miles: 10000, monthly: 0, das: 0 };
        o.quick.term = oneOf(o.quick.term, data.terms, 36);
        o.quick.miles = oneOf(o.quick.miles, data.miles, 10000);
        o.quick.monthly = calc.num(o.quick.monthly);
        o.quick.das = calc.num(o.quick.das);
      }
    });
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return sanitize(raw ? merge(defaults(), JSON.parse(raw)) : defaults());
    } catch (e) {
      return defaults();
    }
  }

  const state = load();
  const listeners = [];
  let timer = null;

  function saveNow() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }
  function save() {
    clearTimeout(timer);
    timer = setTimeout(saveNow, 120);
    listeners.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
  }
  function subscribe(fn) { listeners.push(fn); }

  // Flush pending writes when the app is backgrounded or closed.
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    const fresh = defaults();
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, fresh);
    save();
  }
  function exportJSON() {
    return JSON.stringify({ app: 'lease-coach', exportedAt: new Date().toISOString(), state }, null, 2);
  }
  function importJSON(text) {
    const parsed = JSON.parse(text);
    const incoming = parsed && parsed.state ? parsed.state : parsed;
    if (!isObj(incoming) || !isObj(incoming.target)) throw new Error('This file does not look like a Lease Coach backup.');
    const fresh = sanitize(merge(defaults(), incoming));
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, fresh);
    save();
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- reference data lookups ----------
  const vehicle = (id) => data.vehicles.find((v) => v.id === id) || data.vehicles[0];
  const trim = (vid, tid) => { const v = vehicle(vid); return v.trims.find((t) => t.id === tid) || v.trims[0]; };
  const make = (vid) => data.makes[vehicle(vid).make];

  function overridesFor(trimId) {
    const o = state.program.overrides;
    if (!o[trimId]) o[trimId] = {};
    if (!o[trimId].rv) o[trimId].rv = {};
    if (!o[trimId].mf || typeof o[trimId].mf !== 'object') o[trimId].mf = {};
    return o[trimId];
  }
  const scenKey = (term, miles) => term + '|' + miles;

  function incentivesTotal(makeId) {
    const sel = state.target.incentives[makeId] || {};
    return data.makes[makeId].incentives.reduce((a, inc) => a + (sel[inc.id] ? inc.amt : 0), 0);
  }

  function refFor(vid, tid, term, miles) {
    const v = vehicle(vid);
    const t = trim(vid, tid);
    const o = state.program.overrides[t.id] || {};
    const ov = {
      msrp: o.msrp, leaseCash: o.leaseCash, acq: o.acq,
      rv: o.rv ? o.rv[scenKey(term, miles)] : undefined,
      mf: o.mf && typeof o.mf === 'object' ? o.mf[term] : undefined
    };
    return advisor.reference(t, data.makes[v.make], v, { term, miles, override: ov, incentives: incentivesTotal(v.make) }, data);
  }

  function taxDecimal() { return (state.settings.taxRate || 0) / 100; }

  function targetsFor(vid, tid, opts) {
    const tg = state.target;
    const o = Object.assign({ term: tg.term, miles: tg.miles, struct: tg.struct, cashDown: tg.cashDown }, opts || {});
    const ref = refFor(vid, tid || tg.trims[vid], o.term, o.miles);
    return advisor.targets(ref, { struct: o.struct, cashDown: o.cashDown, taxRate: taxDecimal() });
  }

  // Residual overrides are per term and mileage; money factor overrides are per term; the rest are per trim.
  function setOverride(trimId, key, value, term, miles) {
    const o = overridesFor(trimId);
    const blank = value === null || value === undefined || value === '' || Number.isNaN(value);
    if (key === 'rv') {
      const k = scenKey(term, miles);
      if (blank) delete o.rv[k]; else o.rv[k] = value;
    } else if (key === 'mf') {
      if (blank) delete o.mf[term]; else o.mf[term] = value;
    } else if (blank) delete o[key];
    else o[key] = value;
    save();
  }
  function clearOverrides(trimId) { delete state.program.overrides[trimId]; save(); }
  function hasOverrides(trimId) {
    const o = state.program.overrides[trimId];
    return !!o && (Object.keys(o).filter((k) => k !== 'rv' && k !== 'mf').length > 0 || Object.keys(o.rv || {}).length > 0 || Object.keys(o.mf || {}).length > 0);
  }

  // ---------- calculator scenario ----------
  // null means "auto" (use the reference estimate); a number means the user typed it in.
  function freshCalc() {
    const tg = state.target;
    return {
      vehicleId: tg.vehicleId, trimId: tg.trims[tg.vehicleId], term: tg.term, miles: tg.miles,
      msrp: null, price: null, addOns: 0, rebates: 0, cashDown: 0,
      rv: null, mf: null, mfMode: 'mf',
      acqFee: null, acqCap: false, dealerFee: null, dealerCap: false, regFee: null, regCap: false,
      otherFee: 0, otherCap: false, deposit: 0, taxRate: null,
      quotedMonthly: null, quotedTaxIncluded: true, quotedDas: null
    };
  }
  function getCalc() {
    if (!state.calc) state.calc = freshCalc();
    return state.calc;
  }
  function calcHasData(c) {
    if (!c) return false;
    return ['price', 'msrp', 'rv', 'mf', 'acqFee', 'dealerFee', 'regFee', 'taxRate', 'quotedMonthly', 'quotedDas'].some((k) => c[k] !== null && c[k] !== undefined && c[k] !== '') ||
      ['addOns', 'rebates', 'cashDown', 'otherFee', 'deposit'].some((k) => calc.num(c[k]) > 0);
  }
  const pick = (v, auto) => (v === null || v === undefined || v === '' ? auto : v);

  function calcInputs(c) {
    const ref = refFor(c.vehicleId, c.trimId, c.term, c.miles);
    return {
      msrp: pick(c.msrp, ref.msrp), sellingPrice: calc.num(c.price), addOns: calc.num(c.addOns),
      rebates: calc.num(c.rebates), cashDown: calc.num(c.cashDown), tradeEquity: 0,
      term: c.term, milesPerYear: c.miles,
      residualPct: pick(c.rv, ref.rvPct), mf: pick(c.mf, ref.baseMf),
      taxRate: pick(c.taxRate, state.settings.taxRate) / 100, taxCashDown: true,
      acqFee: pick(c.acqFee, ref.acqFee), acqCap: !!c.acqCap,
      dealerFee: pick(c.dealerFee, AUTO_DEALER_FEE), dealerCap: !!c.dealerCap,
      regFee: pick(c.regFee, ref.regFee), regCap: !!c.regCap,
      otherFee: calc.num(c.otherFee), otherCap: !!c.otherCap, deposit: calc.num(c.deposit),
      overMile: ref.overMile, dispoFee: ref.dispoFee
    };
  }
  function evaluateCalc(c) {
    const ref = refFor(c.vehicleId, c.trimId, c.term, c.miles);
    const ev = advisor.evaluate(calcInputs(c), ref, {
      plannedMiles: state.profile.plannedMiles,
      quotedMonthly: calc.num(c.quotedMonthly), quotedTaxIncluded: c.quotedTaxIncluded !== false,
      quotedDas: calc.num(c.quotedDas)
    });
    return { ev, ref };
  }

  // ---------- offers ----------
  const addOffer = (o) => { const rec = Object.assign({ id: uid(), createdAt: Date.now(), status: 'quoted', notes: '' }, o); state.offers.unshift(rec); save(); return rec; };
  const getOffer = (id) => state.offers.find((o) => o.id === id);
  const updateOffer = (id, patch) => { const o = getOffer(id); if (o) { Object.assign(o, patch, { updatedAt: Date.now() }); save(); } return o; };
  const removeOffer = (id) => { state.offers = state.offers.filter((o) => o.id !== id); save(); };

  LC.store = {
    state, save, saveNow, subscribe, reset, exportJSON, importJSON, uid,
    vehicle, trim, make, refFor, targetsFor, incentivesTotal, taxDecimal,
    setOverride, clearOverrides, hasOverrides, overridesFor, scenKey,
    freshCalc, getCalc, calcHasData, calcInputs, evaluateCalc, AUTO_DEALER_FEE,
    addOffer, getOffer, updateOffer, removeOffer
  };

  // Apply the saved theme immediately to avoid a flash.
  document.documentElement.setAttribute('data-theme', state.settings.theme || 'auto');
})();
