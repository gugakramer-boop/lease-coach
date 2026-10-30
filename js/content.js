/* Lease Coach: playbook content (checklists, questions, tactics, scripts, traps, explainers). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});

  const prepare = [
    {
      id: 'ph1', title: '1. Know your numbers', sub: '1-2 weeks before', items: [
        { id: 'p-credit', t: 'Check your credit reports and FICO Auto score', why: 'The best lease rates (top tier) usually need roughly a 720+ score. Pull free reports at AnnualCreditReport.com and dispute errors before a dealer pulls your credit.' },
        { id: 'p-budget', t: 'Set your all-in monthly budget and a maximum due at signing', why: 'Include insurance and fuel. Decide this before anyone asks so you negotiate from your number, not theirs.' },
        { id: 'p-miles', t: 'Work out your real yearly mileage', why: 'Use Check > Miles. Overage is typically $0.20 a mile, so 3,000 extra miles is about $600 at lease-end. Buying miles you never drive is wasted money too.' },
        { id: 'p-term', t: 'Decide your term (36 months is usually the sweet spot)', why: 'Residuals and rates are usually strongest at 24-36 months. Ask for 24, 36 and 39 and compare the true monthly cost.' },
        { id: 'p-insurance', t: 'Get an insurance quote for the exact trim', why: 'Lessors require higher limits (often 100/300/50) and a low deductible. Premiums in South Florida can change which model is really cheaper.' },
        { id: 'p-trade', t: 'If you have a trade-in, get written offers first', why: 'CarMax, Carvana and others quote in minutes. Keep the trade separate so the dealer cannot hide a discount inside the trade value.' },
        { id: 'p-docs', t: 'Gather your documents', why: "Driver's license, proof of insurance, recent pay stubs, proof of address, and a payoff letter if you owe on a trade. Being ready speeds everything up." }
      ]
    },
    {
      id: 'ph2', title: '2. Research the market', sub: 'This week', items: [
        { id: 'r-trim', t: 'Pick the exact trim, colors and must-have options', why: 'The more specific your request, the easier quotes are to compare. Collect VINs of matching cars in stock.' },
        { id: 'r-test', t: 'Test-drive both the Telluride and the Palisade', why: 'Do it before the money talk so "which one do I like" is separate from "which one is the better deal".' },
        { id: 'r-programs', t: 'Find the lender base money factor and residual for ZIP 33441', why: 'Post your ZIP, trim, term and miles in the Edmunds lease-deals forum thread for the model. Moderators usually reply with money factor, residual and lease cash. Enter them in Target > Edit program numbers.' },
        { id: 'r-incentives', t: 'List the incentives you qualify for', why: 'Loyalty, conquest, military, first responder, college grad, Costco Auto Program, employer or alumni perks. Tick them in Target so the targets include them.' },
        { id: 'r-ym', t: 'Ask about leftover 2026 models and any outgoing-year incentives', why: 'Outgoing model years can carry larger incentives, especially the Palisade. Never pay over MSRP on any of them.' },
        { id: 'r-reviews', t: 'Read recent dealer reviews for fee and add-on complaints', why: 'Look for "added fees at signing", "market adjustment" and "bait and switch".' },
        { id: 'r-timing', t: 'Plan your timing around month-end and the lender program calendar', why: 'Programs usually change on the 1st-3rd. See Playbook > Learn > Timing.' }
      ]
    },
    {
      id: 'ph3', title: '3. Collect written quotes', sub: 'Remote first', items: [
        { id: 'q-list', t: 'List 6-10 dealers across Palm Beach, Broward and Miami-Dade', why: 'Your registration address sets the tax rate, so a dealer 40 miles away should not cost you more tax (confirm on the quote). Get the Internet or fleet manager email.' },
        { id: 'q-email', t: 'Send the same itemized quote request to all of them', why: 'Playbook > Scripts has a ready email. Same day and same specs make the quotes comparable.' },
        { id: 'q-itemized', t: 'Insist on an itemized worksheet, not just "a payment"', why: 'You need the VIN, MSRP, selling price, money factor, residual, term and miles, every fee, incentives and the due at signing.' },
        { id: 'q-log', t: 'Log every quote in the Offers tab', why: 'The app compares them on true monthly cost and grades each one.' },
        { id: 'q-counter', t: 'Send the best written numbers to the others and ask them to beat it', why: 'Do not name the competitor, just the numbers. One round is usually enough.' },
        { id: 'q-broker', t: 'Optional: get one broker quote and compare the all-in cost', why: 'Brokers charge a fee (some listings show about $699). It is only worth it if the total beats your best direct quote.' }
      ]
    },
    {
      id: 'ph4', title: '4. At the dealership', sub: 'Day of', items: [
        { id: 'd-vin', t: 'Confirm the exact car is on the lot and the VIN matches your quote', why: 'If it is "on the way", get the arrival date in writing and hold your position.' },
        { id: 'd-sticker', t: 'Read the window sticker and any second "dealer add-on" sticker', why: 'Add-on stickers are where protection packages and market adjustments hide.' },
        { id: 'd-worksheet', t: 'Get the written worksheet and check it in the Check tab', why: 'Every number should match your emailed quote. Enter their numbers and look for red flags before you sit in the finance office.' },
        { id: 'd-order', t: 'Negotiate in order: price, then money factor, then fees, then structure', why: 'Settle one variable at a time. Payments come last.' },
        { id: 'd-separate', t: 'Keep trade-in, financing pitches and add-ons out of the price talk', why: 'Mixing them is how profit gets hidden.' },
        { id: 'd-walk', t: 'Be ready to walk', why: 'You have other written quotes. Leaving politely often produces a better number by phone that evening.' }
      ]
    },
    {
      id: 'ph5', title: '5. Finance office', sub: 'Before you sign', items: [
        { id: 'f-read', t: 'Compare the contract line by line to the worksheet', why: 'Check cap cost, money factor (often shown as a rent charge or APR), residual, term, miles, due at signing, fees, taxes and the VIN.' },
        { id: 'f-addons', t: 'Decline add-ons you did not agree to', why: 'Extended warranty, tire and wheel, paint or fabric protection, VIN etch, nitrogen, key replacement, prepaid maintenance. The factory warranty covers a 3-year lease and GAP is built into the lease.' },
        { id: 'f-final', t: 'Make sure the deal is final before you leave', why: 'No "we need to re-sign" calls later. Get copies of everything you signed.' },
        { id: 'f-ins', t: 'Have proof of insurance ready', why: 'The lessor will need to be listed as required. The dealer can tell you the exact wording.' }
      ]
    },
    {
      id: 'ph6', title: '6. Delivery and after', sub: 'Keep it clean', items: [
        { id: 'x-inspect', t: 'Inspect the car in daylight before you drive away', why: 'Paint, glass, wheels and interior. Photograph anything you find and have it noted in writing.' },
        { id: 'x-extras', t: 'Verify keys, manuals, floor mats and accessories listed on the order', why: 'Two keys, the cargo cover and mats you were promised.' },
        { id: 'x-connect', t: 'Activate Kia Connect or Hyundai Bluelink and check what is included', why: 'Free-trial terms vary by model year. Confirm what is complimentary.' },
        { id: 'x-save', t: 'Save the contract and set reminders', why: 'Calendar: 6 months before the end (pre-inspection) and 90 days before (decide: return, buy or re-lease).' }
      ]
    }
  ];

  const questions = [
    {
      id: 'qa-car', title: 'The car and availability', items: [
        { id: 'a1', q: 'Is this exact car (VIN) on your lot today, or in transit?', good: 'On the lot with a VIN, or a firm arrival date in writing.', flag: '"We can get you one" with no VIN.' },
        { id: 'a2', q: 'What is the MSRP on the window sticker, and is there any dealer add-on or market adjustment?', good: 'Sticker MSRP only, no second sticker, no adjustment.', flag: 'A second sticker with "protection packages" or any price above MSRP.' },
        { id: 'a3', q: 'Is it a 2026 or 2027 model year, and are there outgoing-year incentives?', good: 'A clear answer and the incentive applied on the worksheet.', flag: 'Vague answers about which program month the quote uses.' }
      ]
    },
    {
      id: 'qa-price', title: 'Price and incentives', items: [
        { id: 'b1', q: 'What is your best selling price (capitalized cost), before fees and incentives?', good: 'A specific number and the discount off MSRP.', flag: 'Only a monthly payment.' },
        { id: 'b2', q: 'How does that price compare with invoice?', good: 'They engage with it. Invoice is about 95.5% of base MSRP.', flag: 'Refusal to discuss price until you "pick a payment".' },
        { id: 'b3', q: 'Which manufacturer incentives are included, and do my loyalty, conquest, military or college-grad offers stack?', good: 'Each incentive listed as its own line.', flag: '"Those are already built in", with no itemization.' },
        { id: 'b4', q: 'Is any discount tied to financing through the dealer?', good: 'No strings, or they show it does not raise the money factor.', flag: 'A discount that only exists if you accept a higher rate.' }
      ]
    },
    {
      id: 'qa-terms', title: 'Lease terms', items: [
        { id: 'c1', q: 'What money factor are you using, and is it the lender base rate with no markup?', good: 'They state the number and confirm base rate.', flag: 'Refusal to say the money factor, or only an APR.' },
        { id: 'c2', q: 'What residual value (% and $) are you using for this exact term and mileage?', good: 'A percentage that matches the lender program for your term and miles.', flag: 'A residual lower than the program, or the wrong mileage tier.' },
        { id: 'c3', q: 'What credit tier did you run me at?', good: 'Top tier for a 720+ score.', flag: 'A lower tier you cannot explain.' },
        { id: 'c4', q: 'What is the acquisition fee, and is it paid up front or rolled in?', good: 'About $650 (Kia) or $650-$700 (Hyundai).', flag: 'Anything noticeably above that.' },
        { id: 'c5', q: 'What mileage allowance is in the quote and what is the overage charge?', good: 'The tier you asked for, about $0.20 a mile over.', flag: 'A lower allowance than requested, which makes the payment look smaller.' },
        { id: 'c6', q: 'Can I see the lender program numbers (base MF, residual, lease cash) for this model?', good: 'They show or confirm them.', flag: 'Defensiveness. It signals a markup.' }
      ]
    },
    {
      id: 'qa-fees', title: 'Fees and due at signing', items: [
        { id: 'd1', q: 'Please itemize every fee: doc fee, electronic filing, tag/title/registration, anything else.', good: 'A short list. Government fees near $363-$400 total.', flag: 'Vague "dealer service" or "admin" lines, or a second filing fee.' },
        { id: 'd2', q: 'What exactly is in "due at signing"? Can I do sign-and-drive with nothing down?', good: 'An itemized breakdown. Sign-and-drive is available.', flag: 'A large "required" down payment.' },
        { id: 'd3', q: 'Is the security deposit waived?', good: 'Yes. Kia and Hyundai usually waive it for good credit.', flag: 'A deposit requested without a reason.' },
        { id: 'd4', q: 'Which tax rate are you applying?', good: 'Broward County: 7% (6% state + 1% surtax).', flag: 'A higher rate or tax on items that are not taxable.' }
      ]
    },
    {
      id: 'qa-end', title: 'Lease-end and flexibility', items: [
        { id: 'e1', q: 'What is the disposition fee, and when is it waived?', good: 'About $400, waived if I lease or buy another from the same brand lender.', flag: 'A higher fee or no waiver.' },
        { id: 'e2', q: 'What is the purchase option price and fee at lease-end?', good: 'Residual plus a fee of about $400.', flag: 'A buyout number that does not match the residual.' },
        { id: 'e3', q: 'Can the lease be transferred, and how is early termination calculated?', good: 'A straight answer. Both lenders are reported not to allow transfers.', flag: 'Promises that conflict with the contract.' },
        { id: 'e4', q: 'What is the wear-and-tear standard, and is GAP included?', good: 'A written wear guide, and GAP built into the lease.', flag: 'Selling GAP as a separate product.' }
      ]
    },
    {
      id: 'qa-deliv', title: 'Delivery', items: [
        { id: 'f1', q: 'Is the deal final once I sign, with no re-written paperwork afterward?', good: 'Yes, in writing.', flag: 'Conditional delivery or "financing may change".' },
        { id: 'f2', q: 'Are there any dealer prep, delivery or detail fees?', good: 'None beyond the itemized fees.', flag: 'New charges appearing on the final contract.' },
        { id: 'f3', q: 'Which accessories are included (mats, cargo cover, wheel locks)?', good: 'Listed on the order.', flag: 'Accessories that are "extra".' }
      ]
    }
  ];

  const tactics = [
    { id: 't1', title: 'Negotiate the price, not the payment', move: 'Agree on the selling price (capitalized cost) first, as if you were buying the car. Only then talk lease terms.', say: 'Let us settle the selling price first, then we can structure the lease.', why: 'A payment can hide price, money factor, fees and down payment in one number. A price cannot.' },
    { id: 't2', title: 'Make dealers compete in writing', move: 'Email 6-10 dealers the same request. Compare itemized replies in the Offers tab, then send the best numbers to the others.', say: 'I have a written offer at [numbers]. If you can beat it, I will come in and sign.', why: 'Competition between dealers does more than any in-person haggling.' },
    { id: 't3', title: 'Anchor with the lender numbers', move: 'Know the lender base money factor and residual for your trim, term and miles. Quote them back.', say: 'I understand the lender base rate is about {{baseMf}} and the residual is about {{rv}}% for {{term}}/{{miles}}. Please quote at those.', why: 'It shows you know where profit can hide and shrinks the room for markup.' },
    { id: 't4', title: 'Ask for the buy rate', move: 'Request the money factor with no dealer reserve. About 0.0001 of money factor is roughly $10 a month on a $58k lease.', say: 'I qualify for top-tier credit. Please quote the lender buy rate with no markup.', why: 'Markup on the money factor is pure dealer profit and is invisible unless you ask.' },
    { id: 't5', title: 'Hold your max payment and down payment back', move: 'Do not volunteer a target payment or how much you can put down.', say: 'I am comparing total cost, not a payment. Please show me the itemized worksheet.', why: 'Whatever number you give becomes the number you get.' },
    { id: 't6', title: 'Use true monthly cost', move: 'Compare offers by total cash out divided by months, including everything due at signing.', say: 'What is the total due at signing, and the monthly with tax?', why: 'A low payment with a large down payment is often a worse deal. The app does this math for you.' },
    { id: 't7', title: 'Go sign-and-drive; avoid cash down', move: 'Roll fees in or pay only the first payment and mandatory fees.', say: 'I do not put money down on a lease. Please structure it sign-and-drive.', why: 'Cash down is gone if the car is totaled or stolen, and it does not lower your true cost.' },
    { id: 't8', title: 'Time it', move: 'Aim for the last days of the month or quarter and weekdays. Ask which program month the quote uses and when it expires.', say: 'Which program month is this quote from, and when does it expire?', why: 'Dealers chase volume targets, and lender programs reset monthly.' },
    { id: 't9', title: 'Be willing to walk (and mean it)', move: 'Give them your number, thank them and leave. Follow up by email.', say: 'Thank you for your time. My number is [price] and [money factor]. Call me if you can get there.', why: 'Most of the best deals come after you stand up.' },
    { id: 't10', title: 'Use silence', move: 'After you counter, stop talking and wait.', say: '(Say nothing.)', why: 'People fill silence with concessions. Let them.' },
    { id: 't11', title: 'Counter one lever at a time', move: 'Use the "levers" list in Check. Pick the biggest saving first: usually price, then money factor, then add-ons.', say: 'If you can do [price], I can move forward today.', why: 'A clear, single ask is easier to say yes to than a long list.' },
    { id: 't12', title: 'Stack every incentive', move: 'Ask about loyalty, conquest, military, first responder, college grad, Costco Auto, employer or alumni offers. Confirm which can stack.', say: 'Which programs do I qualify for, and can they all be combined?', why: 'Even $500-$750 each lowers the capitalized cost. Programs change monthly.' },
    { id: 't13', title: 'Compare structures, not just one quote', move: 'Ask for 24, 36 and 39 months and 10k and 12k miles. Compare the true monthly cost for each.', say: 'Please quote 36 months at 10k and 12k miles, and 39 months at 12k.', why: 'Residual and rate differences by term can make a "worse" term the best deal.' },
    { id: 't14', title: 'Handle the manager shuffle', move: 'Stay calm when the salesperson "checks with the manager". Repeat your numbers.', say: 'I appreciate you checking. I am deciding today at [numbers].', why: 'The routine is designed to wear you down. A fixed, written number defeats it.' },
    { id: 't15', title: 'Offset the doc fee with price', move: 'In Florida the doc fee has no cap and is usually "non-negotiable". Ask for the same amount off the selling price.', say: 'I understand the fee is fixed. Then I need the price lowered by the same amount.', why: 'Total cost is what matters, not which line it comes off.' },
    { id: 't16', title: 'Win in the finance office by saying "no thank you"', move: 'Repeat it politely for each extra. Sign only what matches the worksheet.', say: 'No, thank you. I will sign what we agreed on the worksheet.', why: 'This is where add-ons are sold with the highest margin.' }
  ];

  const scripts = [
    {
      id: 's1', title: 'Email to several dealers: quote request', kind: 'Email',
      subject: 'Lease quote request: {{car}} ({{term}} mo / {{miles}} mi)',
      body: 'Hello [Name],\n\nI am leasing a new {{car}} and plan to sign this week with the dealer that gives me the best total deal. I am collecting written, itemized quotes from several South Florida dealers.\n\nPlease reply with a lease quote on a specific car in stock (VIN):\n- VIN / stock number and the MSRP on the window sticker\n- Selling price (capitalized cost) and the discount off MSRP\n- Money factor, and confirmation that it is the lender base rate with no dealer markup\n- Residual value (% and $) for {{term}} months / {{miles}} miles per year\n- Every fee itemized: acquisition, dealer/doc, electronic filing, tag/title/registration, anything else\n- All manufacturer incentives applied\n- Monthly payment with tax, and the exact amount due at signing\n- Confirmation that there are no dealer add-ons or market adjustment\n\nI live in Broward County (ZIP {{zip}}), so please use {{taxRate}}% sales tax. I compare quotes on total cost, so a "payment only" reply will not help. If you can also quote 12,000 miles per year, please include it.\n\nThank you,\n{{name}}\n{{contact}}'
    },
    {
      id: 's2', title: 'Text message: quick quote request', kind: 'Text',
      body: 'Hi [Name], this is {{name}}. I am ready to lease a {{car}} ({{term}} mo / {{miles}} mi) this week and I am comparing written quotes. Could you text or email an itemized quote on a car in stock? I need: VIN, MSRP, selling price, money factor (base rate, no markup), residual, all fees, incentives, and total due at signing. No add-ons or market adjustment please. Thanks!'
    },
    {
      id: 's3', title: 'Email: counter with a competing quote', kind: 'Email',
      subject: 'Re: {{car}} lease quote',
      body: 'Hi [Name],\n\nThank you for the quote. I have a written offer on a comparable {{car}} at [$___ per month with $___ due at signing, selling price $___, money factor ___].\n\nIf you can beat it, I will come in on [day/time] and sign. To get there I need:\n- A selling price of {{goodPrice}} or less\n- The lender base money factor (about {{baseMf}}) with no markup\n- No dealer add-ons or market adjustment\n- Dealer fees no higher than {{docFee}}\n\nPlease send an updated itemized worksheet. I am deciding today.\n\n{{name}}\n{{contact}}'
    },
    { id: 's4', title: 'First 60 seconds at the dealership', kind: 'In person', body: 'Thanks for meeting me. I am here for [VIN]. I already have written quotes, so I am focused on three numbers: the selling price, the money factor and the total due at signing. If the worksheet matches what we discussed, I am ready to sign today.' },
    { id: 's5', title: 'Ask for the buy rate', kind: 'In person or phone', body: 'What money factor are you using, and is it the lender base rate? I qualify for top-tier credit. Please quote the buy rate with no markup.' },
    { id: 's6', title: 'Ask to see the lender program numbers', kind: 'In person or phone', body: 'Can you show me the lender lease program for this model: the base money factor, the residual for {{term}} months and {{miles}} miles, and any lease cash? That is what I am basing my offer on.' },
    { id: 's7', title: 'Remove add-ons', kind: 'In person', body: 'I do not want any dealer-installed add-ons. Please remove them from the worksheet, or take that amount off the selling price.' },
    { id: 's8', title: 'Offset the doc fee', kind: 'In person', body: 'I understand the doc fee is fixed. Then I need the selling price lowered by the same amount so my total is unchanged.' },
    { id: 's9', title: 'Finance office: decline extras', kind: 'In person', body: 'No, thank you, to all of the extras. I will sign what is on the worksheet we agreed: [price], [money factor], and [amount] due at signing. If anything is different, I would like to pause and review it.' },
    { id: 's10', title: 'Polite walk-away', kind: 'In person', body: 'Thank you for your time. My number is [price] with the base money factor and [amount] due at signing. If you can get there, call me. Otherwise I will go with my other offer.' }
  ];

  const traps = [
    { id: 'x1', title: 'The "what payment are you looking for?" question', what: 'It invites you to name a payment, then the dealer builds the deal to hit it while keeping the profit.', counter: 'Say you are comparing total cost. Ask for the itemized worksheet.' },
    { id: 'x2', title: 'The four-square worksheet', what: 'Price, trade-in, down payment and monthly payment shown together so you cannot tell which one moved.', counter: 'Negotiate one variable at a time: price first. Ignore the squares.' },
    { id: 'x3', title: 'Money factor markup', what: 'The dealer adds to the lender base rate. 0.0001 of money factor is about $10 a month, and 0.0004 is about $40 a month, or roughly $1,400 over 36 months.', counter: 'Ask for the buy rate. Use Check > Decode to see the money factor hidden inside any payment.' },
    { id: 'x4', title: 'Market adjustment or "required" add-ons', what: 'A second sticker or a fee that lifts the price above MSRP, often called an additional dealer markup.', counter: 'Never pay over MSRP. Market adjustments on the Telluride are largely gone in Oct 2026, so go to another dealer.' },
    { id: 'x5', title: 'Pre-installed protection packages', what: 'Nitrogen, VIN etching, paint or fabric protection, tint and "appearance" packages added to the car and priced at hundreds or thousands of dollars.', counter: 'Ask for them to be removed, or for an equal price reduction. A car without them is available elsewhere.' },
    { id: 'x6', title: 'The wrong term or mileage in the quote', what: 'A quote at 10,000 miles when you asked for 12,000, or 39 months instead of 36, to make the payment look better.', counter: 'Check every line against your request. Mileage and term are in the first lines of the worksheet.' },
    { id: 'x7', title: 'A lower residual than the program', what: 'A lower residual raises your payment without changing the visible price.', counter: 'Know the lender residual for your trim, term and mileage. Ask them to re-run it.' },
    { id: 'x8', title: 'The incentive that disappears', what: 'A rebate that is "already built in" or "expired", with no line on the worksheet.', counter: 'Ask for each incentive as its own line, and ask which program month the quote uses.' },
    { id: 'x9', title: 'Bait and switch on the car', what: 'The advertised car is "just sold", and a different one costs more.', counter: 'Get the VIN on the written quote. Do not drive across town without it.' },
    { id: 'x10', title: 'Fees that appear at signing', what: 'Electronic filing, "dealer service" or "tag agency" fees stacked on top of the doc fee. One South Florida Kia dealer site lists a $1,199 doc fee plus a $439 electronic filing fee.', counter: 'Ask for every fee in writing before you visit. Offset any fee you cannot remove with a lower price.' },
    { id: 'x11', title: 'Conditional delivery and "re-signing"', what: 'You drive home, then get a call that the financing "did not clear" and need to sign a worse contract.', counter: 'Insist the deal is final and in writing before you leave. Keep your trade until it is.' },
    { id: 'x12', title: 'Pressure for a big down payment', what: 'A large cash down lowers the payment but is lost if the car is totaled or stolen, and does not lower your total cost.', counter: 'Ask for sign-and-drive.' },
    { id: 'x13', title: 'GAP and extended warranty upsells', what: 'GAP is built into captive-lender leases, and the factory 5 yr / 60k warranty covers a 36-month lease.', counter: 'Decline separate GAP, extended warranty, tire and wheel, and paint protection.' },
    { id: 'x14', title: '"Today only" and the manager shuffle', what: 'Manufactured urgency and repeated trips to "the manager".', counter: 'If it is a real price, it will be there tomorrow. Ask for it in writing.' }
  ];

  const learn = {
    howItWorks: [
      '**Capitalized cost** is the price you are financing: selling price + fees you roll in, minus incentives and cash down.',
      '**Residual** is what the lender says the car will be worth at lease-end, set as a % of MSRP. You do not negotiate it, but you can make sure it is quoted correctly.',
      '**Depreciation** = (adjusted cap cost - residual) / months. This is what you pay for the car losing value.',
      '**Rent charge** = (adjusted cap cost + residual) x money factor. This is the interest, and money factor x 2400 is the APR.',
      '**Monthly payment** = depreciation + rent charge, plus Florida sales tax.',
      'The things you can change: price, money factor, fees, incentives and structure. The residual and base money factor come from the lender.'
    ],
    florida: [
      '**Sales tax: 7% in Broward.** 6% state + 1% county surtax (Florida DOR, 2026). It is charged on each monthly payment, and generally on any cash down and taxable up-front fees (acquisition and dealer fees).',
      '**Tag, title and registration: about $363 in official fees.** $225 initial registration, $32.50 annual registration for 3,500+ lb vehicles, $77.25 title and $28 plate. Dealers usually collect around $400 with small county fees.',
      '**Dealer/doc fee: no state cap.** Dealers must disclose it, and the Florida average is about $990 (the highest in the US). $999-$1,299 is common in South Florida, and some stores add a separate electronic-filing fee. Ask for an equal price reduction.',
      '**Lemon Law covers leases.** Florida Chapter 681 protects lessees on leases of a year or more.',
      '**Insurance.** The legal minimum is $10,000 PIP and $10,000 property damage, but lessors typically require much more: commonly 100/300/50 liability and a deductible of $1,000 or less. Confirm in your contract and get a quote before you choose the car.',
      '**Where tax is set.** Tax follows where the car is registered (your address). A dealer in another county should not change your tax rate. Verify it on the worksheet.'
    ],
    timing: [
      '**Lender programs are monthly.** The numbers on the 30th may be gone on the 2nd. Kia and Hyundai October offers were reported to end Nov 2, 2026. Ask which program month your quote uses.',
      '**Month-end and quarter-end** are when dealers chase volume bonuses. The quarter ends Dec 31.',
      '**Weekdays beat weekends.** Saturday afternoon is the busiest and you get the least attention.',
      '**South Florida seasons.** Winter (snowbird) demand tends to firm up prices. Late summer and fall are usually softer.',
      '**Holiday events.** Black Friday (Nov 27, 2026) and the last week of December often bring promotions, but the trim and color you want may be gone.'
    ],
    leaseEnd: [
      '**Return it.** Pay the disposition fee (about $400, usually waived if you lease or buy another from the same brand lender), plus any overage (about $0.20 a mile) and excess wear. Book a pre-inspection 60-90 days before.',
      '**Buy it.** Pay the residual plus a purchase-option fee (about $400) and applicable tax. If the car is worth more than the buyout, you have equity.',
      '**Trade or re-lease.** The dealer may waive the disposition fee and may use your equity toward the next car.',
      '**Leave early.** It is expensive, and both Kia and Hyundai lenders are reported not to allow lease transfers. Choose a term and mileage you can finish.'
    ],
    glossary: [
      ['Capitalized cost (cap cost)', 'The price the lease is based on: selling price plus any fees rolled in.'],
      ['Adjusted cap cost', 'Cap cost after cash down and incentives. This is what you actually finance.'],
      ['Residual value', 'The lender estimate of the car value at lease-end, as a % of MSRP.'],
      ['Money factor (MF)', 'The lease interest rate. Multiply by 2400 to get an APR.'],
      ['Buy rate', 'The lender base money factor, before any dealer markup.'],
      ['Reserve / markup', 'Extra money factor the dealer adds as profit.'],
      ['Acquisition fee', 'A lender fee to start the lease, about $650 for Kia and Hyundai.'],
      ['Disposition fee', 'A lender fee at lease-end if you return the car, about $400.'],
      ['Due at signing', 'Everything you pay on day one: first payment, fees, taxes and any cash down.'],
      ['Sign-and-drive', 'A structure where nothing beyond the first payment is due up front.'],
      ['Cap cost reduction', 'Cash down, trade equity and incentives that reduce the cap cost.'],
      ['Lease cash', 'A manufacturer incentive that lowers the cap cost on a lease.'],
      ['Loyalty / conquest', 'Incentives for current owners of the brand / owners of competing brands.'],
      ['MSRP', 'The sticker price, including destination.'],
      ['Invoice', 'What the dealer is billed, roughly 95.5% of base MSRP. Holdback and incentives can put the true dealer cost lower.'],
      ['ADM / market adjustment', 'Additional dealer markup above MSRP.'],
      ['GAP', 'Covers the gap between the car value and your lease balance if it is totaled. Built into captive leases.'],
      ['Wear and tear', 'Damage beyond the lender standard, billed at lease-end.'],
      ['True monthly cost', 'Total cash paid over the term (payments + due at signing + fees) divided by the months.']
    ]
  };

  LC.content = { prepare, questions, tactics, scripts, traps, learn };
})();
