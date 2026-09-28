(() => {
  'use strict';

  const STORAGE_KEY = 'salary-job-offer-planner:v1';
  const EXAMPLE = window.SALARY_PLANNER_EXAMPLE;
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  let state = copyData(EXAMPLE);
  let previousTakeHome = null;
  let storageAvailable = true;

  const elements = {
    basicSlider: document.getElementById('basic-slider'),
    loadExample: document.getElementById('load-example'),
    storageNotice: document.getElementById('storage-notice'),
    statusText: document.getElementById('status-text'),
    heroTakeHome: document.getElementById('hero-take-home'),
    heroGross: document.getElementById('hero-gross'),
    heroDeduction: document.getElementById('hero-deduction'),
    sliderBadge: document.getElementById('slider-badge'),
    deltaText: document.getElementById('delta-text'),
    subjectOne: document.getElementById('subject1'),
    deductionOne: document.getElementById('deduction1'),
    deductionRateLabel: document.getElementById('deduction-rate-label1'),
    grossOne: document.getElementById('gross1'),
    takeHomeOne: document.getElementById('take-home1'),
    remainingMoney: document.getElementById('remaining-money'),
    savingsTimeline: document.getElementById('savings-timeline'),
    savingsCapacity: document.getElementById('savings-capacity'),
    savingsCapacityValue: document.getElementById('savings-capacity-value'),
    savingsCapacityMeter: document.getElementById('savings-capacity-meter'),
    savingsCapacityDescription: document.getElementById('savings-capacity-description'),
    compareTakeHomeA: document.getElementById('compare-take-home-a'),
    compareGrossA: document.getElementById('compare-gross-a'),
    compareRetentionA: document.getElementById('compare-retention-a'),
    compareTakeHomeB: document.getElementById('compare-take-home-b'),
    verdict: document.getElementById('comparison-verdict')
  };

  function copyData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function safeAmount(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function safeRate(value) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(100, Math.max(0, parsed));
  }

  function formatSAR(amount) {
    return `${currencyFormatter.format(amount)} SAR`;
  }

  function formatRate(rate) {
    return Number(rate).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function calculateOffer(offer) {
    const basic = safeAmount(offer.basic);
    const housing = safeAmount(offer.housing);
    const transport = safeAmount(offer.transport);
    const deductionRate = safeRate(offer.deductionRate);
    const subject = basic + housing;
    const deduction = subject * (deductionRate / 100);
    const gross = subject + transport;
    const takeHome = Math.max(0, gross - deduction);
    const retention = gross > 0 ? (takeHome / gross) * 100 : 0;

    return { basic, housing, transport, deductionRate, subject, deduction, gross, takeHome, retention };
  }

  function setText(id, text) {
    const node = typeof id === 'string' ? document.getElementById(id) : id;
    if (node) node.textContent = text;
  }

  function setWidth(id, percentage) {
    const node = document.getElementById(id);
    const validPercentage = Math.min(100, Math.max(0, percentage));
    node.style.width = `${validPercentage}%`;
    node.setAttribute('aria-valuenow', validPercentage.toFixed(1));
  }

  function updateInputValues() {
    const inputMap = [
      ['basic1', state.offerA.basic],
      ['housing1', state.offerA.housing],
      ['transport1', state.offerA.transport],
      ['deduction-rate1', state.offerA.deductionRate],
      ['bills', state.budget.bills],
      ['savings-goal', state.budget.savingsGoal],
      ['basic2', state.offerB.basic],
      ['housing2', state.offerB.housing],
      ['transport2', state.offerB.transport],
      ['deduction-rate2', state.offerB.deductionRate]
    ];

    inputMap.forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input && document.activeElement !== input) input.value = value;
    });
    elements.basicSlider.value = Math.min(30000, safeAmount(state.offerA.basic));
  }

  function renderOfferACalculation(offer) {
    setText(elements.heroTakeHome, currencyFormatter.format(offer.takeHome));
    setText(elements.heroGross, formatSAR(offer.gross));
    setText(elements.heroDeduction, `${formatSAR(offer.deduction)} deductions`);
    setText(elements.sliderBadge, `Basic: ${formatSAR(offer.basic)}`);
    setText(elements.subjectOne, formatSAR(offer.subject));
    setText(elements.deductionOne, `−${formatSAR(offer.deduction)}`);
    setText(elements.deductionRateLabel, formatRate(offer.deductionRate));
    setText(elements.grossOne, formatSAR(offer.gross));
    setText(elements.takeHomeOne, formatSAR(offer.takeHome));
  }

  function renderBreakdown(offer) {
    const gross = offer.gross || 1;
    const data = [
      ['basic', offer.basic / gross * 100],
      ['housing', offer.housing / gross * 100],
      ['transport', offer.transport / gross * 100],
      ['deduction', offer.deduction / gross * 100]
    ];

    data.forEach(([name, percentage]) => {
      const safePercentage = gross === 1 && offer.gross === 0 ? 0 : percentage;
      setWidth(`bar-${name}`, safePercentage);
      setText(`bar-${name}-value`, `${safePercentage.toFixed(1)}%`);
    });
    setText(document.getElementById('retention-rate'), `${offer.retention.toFixed(1)}% of gross retained`);
  }

  function renderBudget(takeHome) {
    const bills = safeAmount(state.budget.bills);
    const savingsGoal = safeAmount(state.budget.savingsGoal);
    const remaining = takeHome - bills;
    setText(elements.remainingMoney, formatSAR(remaining));

    if (savingsGoal === 0) {
      setText(elements.savingsTimeline, 'No goal set');
    } else if (remaining <= 0) {
      setText(elements.savingsTimeline, 'Not reachable yet');
    } else {
      const months = Math.ceil(savingsGoal / remaining);
      setText(elements.savingsTimeline, `${months} ${months === 1 ? 'month' : 'months'}`);
    }

    let capacity = 0;
    let stateName = 'empty';
    let description = 'Enter an offer to see how much of your take-home remains after bills.';

    if (takeHome > 0 && remaining > 0) {
      capacity = Math.min(100, remaining / takeHome * 100);
      stateName = 'positive';
      description = `${capacity.toFixed(1)}% of your take-home remains: ${formatSAR(remaining)} for savings or other priorities.`;
    } else if (takeHome > 0 && remaining === 0) {
      stateName = 'zero';
      description = 'Your bills use all of your estimated take-home, leaving 0.0% for savings.';
    } else if (takeHome > 0 && remaining < 0) {
      stateName = 'over-budget';
      const shortfall = Math.abs(remaining);
      const shortfallRate = shortfall / takeHome * 100;
      description = `Your bills are ${formatSAR(shortfall)} over your estimated take-home (${shortfallRate.toFixed(1)}% shortfall).`;
    }

    elements.savingsCapacity.dataset.state = stateName;
    setText(elements.savingsCapacityValue, `${capacity.toFixed(1)}%`);
    setText(elements.savingsCapacityDescription, description);
    elements.savingsCapacityMeter.style.width = `${capacity}%`;
    elements.savingsCapacityMeter.setAttribute('aria-valuenow', capacity.toFixed(1));
    elements.savingsCapacityMeter.setAttribute('aria-valuetext', description);
  }

  function renderComparison(offerA, offerB) {
    setText(elements.compareTakeHomeA, formatSAR(offerA.takeHome));
    setText(elements.compareGrossA, formatSAR(offerA.gross));
    setText(elements.compareRetentionA, `${offerA.retention.toFixed(1)}%`);
    setText(elements.compareTakeHomeB, formatSAR(offerB.takeHome));

    const offerBIsEmpty = offerB.gross === 0;
    if (offerBIsEmpty) {
      elements.verdict.dataset.result = 'none';
      setText(elements.verdict, 'Enter Offer B to compare it with Offer A.');
      return;
    }

    const difference = offerB.takeHome - offerA.takeHome;
    const monthly = formatSAR(Math.abs(difference));
    const annual = formatSAR(Math.abs(difference) * 12);

    if (Math.abs(difference) < 0.005) {
      elements.verdict.dataset.result = 'tie';
      setText(elements.verdict, `Both offers estimate the same monthly take-home: ${formatSAR(offerA.takeHome)}.`);
    } else if (difference > 0) {
      elements.verdict.dataset.result = 'b';
      setText(elements.verdict, `Offer B estimates ${monthly} more each month (${annual} more per year).`);
    } else {
      elements.verdict.dataset.result = 'a';
      setText(elements.verdict, `Offer A estimates ${monthly} more each month (${annual} more per year).`);
    }
  }

  function renderStatus(offer, announceChange) {
    if (announceChange && previousTakeHome !== null && Math.abs(offer.takeHome - previousTakeHome) >= 0.005) {
      const difference = offer.takeHome - previousTakeHome;
      const direction = difference > 0 ? 'went up' : 'dropped';
      setText(elements.statusText, `Your take-home ${direction} by ${formatSAR(Math.abs(difference))}.`);
    } else if (offer.gross === 0) {
      setText(elements.statusText, 'Your estimates will update as you enter an offer.');
    } else {
      setText(elements.statusText, `Estimated take-home: ${formatSAR(offer.takeHome)} per month.`);
    }
    previousTakeHome = offer.takeHome;
  }

  function render(announceChange = false) {
    const offerA = calculateOffer(state.offerA);
    const offerB = calculateOffer(state.offerB);
    updateInputValues();
    renderOfferACalculation(offerA);
    renderBreakdown(offerA);
    renderBudget(offerA.takeHome);
    renderComparison(offerA, offerB);
    renderStatus(offerA, announceChange);
  }

  function saveState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      storageAvailable = false;
      showStorageNotice('Browser storage is unavailable. Your values will work for this visit but will not be saved.');
    }
  }

  function showStorageNotice(message) {
    elements.storageNotice.textContent = message;
    elements.storageNotice.hidden = false;
  }

  function loadState() {
    if (!EXAMPLE || typeof EXAMPLE !== 'object') {
      showStorageNotice('Built-in example data could not be found. The planner will start with empty values.');
      return;
    }

    try {
      const savedState = window.localStorage.getItem(STORAGE_KEY);
      if (!savedState) return;
      const parsed = JSON.parse(savedState);
      if (isValidState(parsed)) state = parsed;
      else showStorageNotice('Saved data was not usable, so the built-in example was loaded instead.');
    } catch (error) {
      storageAvailable = false;
      showStorageNotice('Browser storage is unavailable. The built-in example is shown for this visit only.');
    }
  }

  function isValidState(candidate) {
    return candidate && typeof candidate === 'object' && candidate.offerA && candidate.offerB && candidate.budget;
  }

  function getOfferForInput(input) {
    return input.dataset.offer === 'a' ? state.offerA : state.offerB;
  }

  function handleNumberInput(event) {
    const input = event.target;
    const offer = getOfferForInput(input);
    const field = input.dataset.field;
    offer[field] = field === 'deductionRate' ? safeRate(input.value) : safeAmount(input.value);
    saveState();
    render(true);
  }

  function handleBudgetInput(event) {
    const input = event.target;
    state.budget[input.dataset.budgetField] = safeAmount(input.value);
    saveState();
    render(false);
  }

  function handleSliderInput() {
    const oldBasic = safeAmount(state.offerA.basic);
    const newBasic = safeAmount(elements.basicSlider.value);
    const difference = newBasic - oldBasic;
    const deductionRate = safeRate(state.offerA.deductionRate);
    const takeHomeDifference = difference * (1 - deductionRate / 100);

    state.offerA.basic = newBasic;
    if (Math.abs(difference) < 0.005) {
      setText(elements.deltaText, 'Adjust the slider to compare.');
    } else {
      const action = difference > 0 ? 'Raise' : 'Lower';
      const signedDifference = `${takeHomeDifference >= 0 ? '+' : '−'}${formatSAR(Math.abs(takeHomeDifference))}`;
      setText(elements.deltaText, `${action} basic by ${formatSAR(Math.abs(difference))} → take home ${signedDifference}.`);
    }
    saveState();
    render(true);
  }

  function handleLoadExample() {
    const hasSavedValues = previousTakeHome !== null && JSON.stringify(state) !== JSON.stringify(EXAMPLE);
    if (hasSavedValues && !window.confirm('Load the built-in example? This will replace the values saved in this browser.')) return;

    state = copyData(EXAMPLE);
    previousTakeHome = null;
    setText(elements.deltaText, 'Example loaded. Move the slider to test the impact.');
    saveState();
    render(false);
    elements.loadExample.focus();
  }

  document.querySelectorAll('[data-offer]').forEach((input) => {
    input.addEventListener('input', handleNumberInput);
    input.addEventListener('change', handleNumberInput);
  });
  document.querySelectorAll('[data-budget-field]').forEach((input) => {
    input.addEventListener('input', handleBudgetInput);
    input.addEventListener('change', handleBudgetInput);
  });
  elements.basicSlider.addEventListener('input', handleSliderInput);
  elements.loadExample.addEventListener('click', handleLoadExample);

  loadState();
  render(false);
})();
