/* Lease Coach: reference data (editable estimates, clearly labelled in the UI).
   Browser: window.LC.data   Node: require('./data.js') */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.LC = root.LC || {}; root.LC.data = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Price tiers are % off the TOTAL MSRP (incl. destination). mfAdd is added to the lender's base money factor.
  const TIERS_TELLURIDE = {
    great: { discPct: 5, mfAdd: 0, dealerFee: 999, addOns: 0 },
    good: { discPct: 3, mfAdd: 0.0001, dealerFee: 1199, addOns: 0 },
    walk: { discPct: 1, mfAdd: 0.0003, dealerFee: 1499, addOns: 0 }
  };
  const TIERS_PALISADE = {
    great: { discPct: 6, mfAdd: 0, dealerFee: 999, addOns: 0 },
    good: { discPct: 4, mfAdd: 0.0001, dealerFee: 1199, addOns: 0 },
    walk: { discPct: 1.5, mfAdd: 0.0003, dealerFee: 1499, addOns: 0 }
  };

  return {
    version: 1,
    asOf: '2026-10-30',
    asOfLabel: 'Oct 30, 2026',
    // Kia/Hyundai October programs were reported to end Nov 2, 2026 (new programs usually start the 1st-3rd).
    programEnds: '2026-11-02',

    location: { label: 'Deerfield Beach, FL (Broward County)', zip: '33441' },

    // Florida: 6% state + 1% Broward surtax (DOR DR-15DSS, 2026).
    fl: {
      stateTax: 6, surtax: 1, taxRate: 7,
      // FLHSMV base schedule: $225 initial registration + $32.50 annual (3,500+ lb) + $77.25 title + $28 plate = $362.75
      regFee: 400,
      regOfficial: 362.75,
      docFeeAvg: 990, docFeeRange: [799, 1099]
    },

    makes: {
      kia: {
        id: 'kia', name: 'Kia', lender: 'Kia Finance America',
        acqFee: 650, dispoFee: 400, purchaseFee: 400, overMile: 0.20, destination: 1545,
        warranty: '5 yr / 60k basic, 10 yr / 100k powertrain (original owner)',
        roadside: '5 yr / 60,000 mi',
        incentives: [
          { id: 'loyalty', label: 'Loyalty: current Kia owner / lessee', amt: 750 },
          { id: 'conquest', label: 'Conquest: switching from another brand', amt: 750, note: 'Select regions. Confirm it applies to leases.' },
          { id: 'military', label: 'Military', amt: 500 }
        ]
      },
      hyundai: {
        id: 'hyundai', name: 'Hyundai', lender: 'Hyundai Capital America (Hyundai Motor Finance)',
        acqFee: 650, dispoFee: 400, purchaseFee: 400, overMile: 0.20, destination: 1650,
        warranty: '5 yr / 60k basic, 10 yr / 100k powertrain (original owner)',
        roadside: '5 yr / unlimited mi',
        incentives: [
          { id: 'military', label: 'Military', amt: 500 },
          { id: 'responder', label: 'First responder', amt: 500 },
          { id: 'college', label: 'College graduate', amt: 500, note: 'Often finance-only. Confirm it applies to leases.' }
        ]
      }
    },

    // Shifts vs. the 36 mo / 12k anchor, fitted to Oct 2026 Edmunds-forum lender quotes (Kia 24/12: +6 RV, -0.00028 MF;
    // Hyundai 24/12: +10 RV, -0.00025 MF; 15k miles about -2 to -3 points). Terms in between are interpolated estimates.
    rvAdj: {
      term: {
        kia: { 24: 6, 27: 4.5, 30: 3, 33: 1.5, 36: 0, 39: -2, 42: -4 },
        hyundai: { 24: 10, 27: 7.5, 30: 5, 33: 2.5, 36: 0, 39: -2, 42: -4 }
      },
      miles: { 7500: 3, 10000: 1, 12000: 0, 15000: -2.5 }
    },
    mfAdj: {
      term: {
        kia: { 24: -0.00028, 27: -0.00021, 30: -0.00014, 33: -0.00007, 36: 0, 39: 0.00005, 42: 0.0001 },
        hyundai: { 24: -0.00025, 27: -0.00019, 30: -0.00013, 33: -0.00006, 36: 0, 39: 0.00005, 42: 0.0001 }
      }
    },
    terms: [24, 27, 30, 33, 36, 39, 42],
    miles: [7500, 10000, 12000, 15000],

    vehicles: [
      {
        id: 'telluride', make: 'kia', name: 'Kia Telluride', year: 2027,
        blurb: 'All-new 2nd generation for 2027: 2.5L turbo gas, plus a first-ever hybrid.',
        tiers: TIERS_TELLURIDE,
        defaultTrim: 'tel-xpro-sxp',
        trims: [
          { id: 'tel-xpro-sxp', name: 'X-Pro SX-Prestige AWD', engine: '2.5T gas', baseMsrp: 56790, msrp: 58335, rv: 67, mf: 0.00241,
            note: 'Top gas trim. Off-road suspension, all-terrain tires, 9.1 in. ground clearance.' },
          { id: 'tel-hxl-sxp', name: 'Hybrid X-Line SX-Prestige AWD', engine: '2.5T hybrid', baseMsrp: 57590, msrp: 59135, rv: 68, mf: 0.00241,
            note: 'Most expensive Telluride. 329 hp hybrid.' },
          { id: 'tel-hsxp', name: 'Hybrid SX-Prestige AWD', engine: '2.5T hybrid', baseMsrp: 56590, msrp: 58135, rv: 68, mf: 0.00239,
            note: '329 hp hybrid, SX-Prestige equipment.' },
          { id: 'tel-xl-sxp', name: 'X-Line SX-Prestige AWD', engine: '2.5T gas', baseMsrp: 54890, msrp: 56435, rv: 67, mf: 0.00243,
            note: 'Gas, X-Line styling.' },
          { id: 'tel-sxp', name: 'SX-Prestige AWD', engine: '2.5T gas', baseMsrp: 53890, msrp: 55435, rv: 67, mf: 0.00241,
            note: 'Fully loaded gas trim without the off-road gear.' },
          { id: 'tel-custom', name: 'Other trim (enter MSRP)', engine: '', baseMsrp: 0, msrp: 50000, rv: 68, mf: 0.00241, custom: true,
            note: 'Use "Edit program numbers" to enter the sticker MSRP.' }
        ]
      },
      {
        id: 'palisade', make: 'hyundai', name: 'Hyundai Palisade', year: 2027,
        blurb: '2nd generation (redesigned for 2026): 3.5L V6 gas or 2.5T hybrid. Calligraphy is the top trim.',
        tiers: TIERS_PALISADE,
        defaultTrim: 'pal-cal',
        trims: [
          { id: 'pal-cal', name: 'Calligraphy AWD (V6)', engine: '3.5L V6 gas', baseMsrp: 56860, msrp: 58510, rv: 69, mf: 0.00237, leaseCash: 0,
            note: 'Top gas trim. Nappa leather, massaging driver seat.' },
          { id: 'pal-hcal', name: 'Hybrid Calligraphy AWD', engine: '2.5T hybrid', baseMsrp: 59180, msrp: 60830, rv: 68, mf: 0.00239, leaseCash: 250,
            note: 'Hybrid Calligraphy, 329 hp.' },
          { id: 'pal-hbi', name: 'Hybrid Calligraphy Black Ink AWD', engine: '2.5T hybrid', baseMsrp: 59680, msrp: 61330, rv: 68, mf: 0.00239, leaseCash: 250,
            note: 'New range-topper for 2027. Blacked-out styling.' },
          { id: 'pal-custom', name: 'Other trim (enter MSRP)', engine: '', baseMsrp: 0, msrp: 52000, rv: 68, mf: 0.00237, custom: true,
            note: 'Use "Edit program numbers" to enter the sticker MSRP.' }
        ]
      }
    ],

    // Invoice is roughly 95.5% of base MSRP (Edmunds-reported ratio for the Palisade); destination passes through at cost.
    invoicePct: 0.955,

    market: {
      note: 'Oct 2026 snapshot. Always verify against live numbers for ZIP 33441.',
      telluride: 'Verified-sales average around 1.4% below MSRP (61 sales, all trims). About $1,200 off sticker reported for the X-Pro SX-Prestige. Market adjustments are largely gone, and there is no 36-month lease cash.',
      // Lender buy rates posted by Edmunds forum moderators, Oct 9-29, 2026 (other ZIPs; Florida ZIP 33559 matched).
      lender: [
        { car: 'Telluride X-Pro SX-Prestige AWD', terms: '36 mo / 10k', mf: '0.00241', rv: '68%', cash: 'none' },
        { car: 'Telluride Hybrid X-Line SX-Prestige AWD', terms: '36 mo / 12k (Tampa ZIP)', mf: '0.00241', rv: '68%', cash: 'none' },
        { car: 'Palisade Calligraphy AWD (V6)', terms: '36 mo / 10k', mf: '0.00237', rv: '70%', cash: 'none' },
        { car: 'Palisade Hybrid Calligraphy AWD', terms: '36 mo / 12k', mf: '0.00239', rv: '68%', cash: '$250' }
      ],
      ads: [
        { car: '2027 Telluride X-Pro SX-Prestige AWD', pay: '$689-$692', das: '~$3,420', detail: '36 mo / 10k mi. Pre-tax. Some listings add a $699 service fee.' },
        { car: '2027 Palisade Calligraphy AWD', pay: '$644-$655', das: '~$3,390-$3,400', detail: '36 mo / 10k mi. Pre-tax. Some listings add a $699 service fee.' }
      ],
      markupExample: 'One forum member was quoted 0.00275 on a Palisade Hybrid Calligraphy (36/12) when the lender base rate is 0.00239. That is +0.00036, about $35 a month, or roughly $1,300 over the lease.',
      circleA: 'Hyundai "Circle A" (employee-style) pricing: a forum member was told the lower money factor could not be combined with it. Compare the money factor with and without it.',
      realDeal: '2026 Telluride SX (GA, Nov 2025): 36/10k, residual 66%, money factor 0.00221, about 9.6% off MSRP, $650 acquisition fee.'
    },

    sources: [
      { label: 'Kia: 2027 Telluride ICE pricing (press release)', url: 'https://www.prnewswire.com/news-releases/kia-america-announces-pricing-for-the-upcoming-all-new-2027-kia-telluride-302656112.html' },
      { label: 'Kia: 2027 Telluride Hybrid pricing (press release)', url: 'https://www.prnewswire.com/news-releases/kia-america-announces-pricing-for-first-ever-2027-kia-telluride-hev-302698023.html' },
      { label: 'Hyundai: 2027 Palisade Hybrid Calligraphy Black Ink (press release)', url: 'https://www.prnewswire.com/news-releases/hyundai-introduces-new-2027-palisade-hybrid-calligraphy-black-ink-edition-for-flagship-suv-range-302819603.html' },
      { label: 'Florida DOR: 2026 discretionary sales surtax rates (DR-15DSS)', url: 'https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf' },
      { label: 'FLHSMV: motorist services fee schedule', url: 'https://www.flhsmv.gov/fees/' },
      { label: 'Edmunds forum: 2027 Telluride lease deals (lender MF and residual quotes)', url: 'https://forums.edmunds.com/discussion/74298/kia/telluride/2027-kia-telluride-lease-deals-incentives-rebates-and-prices' },
      { label: 'Edmunds forum: 2027 Palisade lease deals (lender MF and residual quotes)', url: 'https://forums.edmunds.com/discussion/74607/hyundai/palisade/2027-hyundai-palisade-lease-deals-incentives-rebates-and-prices' },
      { label: 'Leasehackr: real Telluride lease deal check (Nov 2025)', url: 'https://forum.leasehackr.com/t/deal-check-2026-kia-sx-telluride/726811' }
    ],

    links: {
      edmundsTelluride: 'https://forums.edmunds.com/discussion/74298/kia/telluride/2027-kia-telluride-lease-deals-incentives-rebates-and-prices',
      edmundsPalisade: 'https://forums.edmunds.com/discussion/74607/hyundai/palisade/2027-hyundai-palisade-lease-deals-incentives-rebates-and-prices',
      leasehackr: 'https://forum.leasehackr.com/',
      creditReport: 'https://www.annualcreditreport.com/'
    }
  };
});
