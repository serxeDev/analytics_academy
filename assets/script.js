/* Analytics Learning Lab — Combined Logic */
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('analytics-theme');
const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';

document.body.setAttribute('data-theme', initialTheme);
document.documentElement.style.colorScheme = initialTheme;

function updateThemeToggle(theme) {
  if (!themeToggle) return;
  const icon = themeToggle.querySelector('.theme-icon');
  const label = themeToggle.querySelector('.theme-label');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
  }
  if (label) {
    label.textContent = theme === 'dark' ? 'Light mode' : 'Night mode';
  }
}

function toggleTheme() {
  const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', nextTheme);
  document.documentElement.style.colorScheme = nextTheme;
  localStorage.setItem('analytics-theme', nextTheme);
  updateThemeToggle(nextTheme);
}

if (themeToggle) {
  updateThemeToggle(initialTheme);
  themeToggle.addEventListener('click', toggleTheme);
}

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function activateTab(tabId) {
  tabButtons.forEach(function (b) { b.classList.toggle('tab-active', b.dataset.tabTarget === tabId); });
  tabPanels.forEach(function (p) { p.classList.toggle('hidden', p.id !== tabId); });
  if (tabId === 'descriptive')  { recomputeDescriptive();  renderDescriptiveChart();  }
  if (tabId === 'diagnostic')   { recomputeDiagnostic();   renderDiagnosticChart();   }
  if (tabId === 'predictive')   { runPrediction();         renderPredictiveChart();   }
  if (tabId === 'prescriptive') { runPrescriptiveEngine(); renderPrescriptiveChart(); }
}
tabButtons.forEach(function (b) { b.addEventListener('click', function () { activateTab(b.dataset.tabTarget); }); });

/* ---------- Editable cell utilities ---------- */
function makeCell(v, cb, type) {
  if (type === undefined) type = 'text';
  const s = document.createElement('span');
  s.className = 'editable-cell';
  s.contentEditable = 'true';
  s.textContent = v;
  s.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); s.blur(); } });
  s.addEventListener('blur', function () {
    const n = type === 'number' ? (parseFloat(s.textContent) || 0) : s.textContent.trim();
    s.textContent = n;
    cb(n);
  });
  return s;
}
function makeDeleteButton(cb) {
  const b = document.createElement('button');
  b.className = 'delete-row-btn';
  b.innerHTML = '<i class="fas fa-trash-can"></i> Delete';
  b.addEventListener('click', cb);
  return b;
}

/* ---------- Threshold helper (defaults to 100 if empty/invalid) ---------- */
function getThreshold() {
  const el = document.getElementById('anomaly-threshold');
  const v = parseFloat(el && el.value);
  return (isFinite(v) && v > 0) ? v : 100;
}

/* ---------- Chart.js helper ---------- */
function getOrCreateChart(id, config) {
  const cv = document.getElementById(id);
  if (window.Chart && cv) {
    if (cv._chart) cv._chart.destroy();
    cv._chart = new Chart(cv.getContext('2d'), config);
  }
}

/* ============================================================
   1. DESCRIPTIVE ANALYTICS
   ============================================================ */
const defaultSalesData = [
  { date: '2025-01-15', product: 'Product X', quantity: 15, revenue: 300 },
  { date: '2025-03-22', product: 'Product X', quantity: 40, revenue: 800 },
  { date: '2025-06-10', product: 'Product X', quantity: 25, revenue: 500 },
  { date: '2025-09-05', product: 'Product X', quantity: 10, revenue: 200 },
  { date: '2025-11-30', product: 'Product X', quantity: 60, revenue: 1200 }
];
let salesData = JSON.parse(JSON.stringify(defaultSalesData));

function renderDescriptiveTable() {
  const tb = document.getElementById('raw-data-table');
  tb.innerHTML = '';
  salesData.forEach(function (r, i) {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';

    const tdD = document.createElement('td');
    tdD.appendChild(makeCell(r.date, function (v) { salesData[i].date = v; recomputeDescriptive(); renderDescriptiveChart(); }));
    tr.appendChild(tdD);

    const tdP = document.createElement('td');
    tdP.appendChild(makeCell(r.product, function (v) { salesData[i].product = v; recomputeDescriptive(); }));
    tr.appendChild(tdP);

    const tdQ = document.createElement('td');
    tdQ.appendChild(makeCell(r.quantity, function (v) { salesData[i].quantity = v; recomputeDescriptive(); renderDescriptiveChart(); }, 'number'));
    tr.appendChild(tdQ);

    const tdR = document.createElement('td');
    tdR.appendChild(makeCell(r.revenue, function (v) { salesData[i].revenue = v; recomputeDescriptive(); renderDescriptiveChart(); }, 'number'));
    tr.appendChild(tdR);

    const tdA = document.createElement('td');
    tdA.className = 'text-right';
    tdA.appendChild(makeDeleteButton(function () {
      salesData.splice(i, 1); renderDescriptiveTable(); recomputeDescriptive(); renderDescriptiveChart();
    }));
    tr.appendChild(tdA);

    tb.appendChild(tr);
  });
}

function recomputeDescriptive() {
  const tu = salesData.reduce(function (s, r) { return s + (parseFloat(r.quantity) || 0); }, 0);
  const tr = salesData.reduce(function (s, r) { return s + (parseFloat(r.revenue) || 0); }, 0);
  document.getElementById('total-units').textContent = tu.toLocaleString();
  document.getElementById('total-revenue').textContent = '$' + tr.toLocaleString();
  document.getElementById('total-transactions').textContent = salesData.length.toLocaleString();

  const ins = document.getElementById('descriptive-insight');
  if (salesData.length === 0) { ins.textContent = 'No data yet. Add a row to generate insights.'; return; }
  const avgRev = tr / Math.max(1, salesData.length);
  const top = salesData.reduce(function (a, b) { return (+b.revenue > +a.revenue) ? b : a; });
  const low = salesData.reduce(function (a, b) { return (+b.revenue < +a.revenue) ? b : a; });
  ins.innerHTML = 'Across <strong>' + salesData.length + '</strong> transaction' + (salesData.length > 1 ? 's' : '') +
    ', you generated <strong>$' + tr.toLocaleString() + '</strong> total revenue (≈ <strong>$' + avgRev.toFixed(0) +
    '</strong> avg / transaction). The strongest day was <strong>' + top.date + '</strong> ($' + (+top.revenue) +
    '), and the weakest was <strong>' + low.date + '</strong> ($' + (+low.revenue) + '). Total units moved: <strong>' + tu.toLocaleString() + '</strong>.';
}

function renderDescriptiveChart() {
  const labels = salesData.map(function (r) { return r.date; });
  const values = salesData.map(function (r) { return +r.revenue; });
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue ($)',
        data: values,
        backgroundColor: 'rgba(37,99,235,0.7)',
        borderColor: '#1d4ed8',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function (c) { return '$' + c.parsed.y.toLocaleString(); } } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: function (v) { return '$' + v; } } },
        x: { grid: { display: false } }
      }
    }
  };
  getOrCreateChart('descriptive-chart', config);
}

document.getElementById('descriptive-add-row').addEventListener('click', function () {
  salesData.push({ date: '2025-12-01', product: 'Product X', quantity: 0, revenue: 0 });
  renderDescriptiveTable(); recomputeDescriptive(); renderDescriptiveChart();
});
document.getElementById('descriptive-reset').addEventListener('click', function () {
  salesData = JSON.parse(JSON.stringify(defaultSalesData));
  renderDescriptiveTable(); recomputeDescriptive(); renderDescriptiveChart();
});

renderDescriptiveTable();
recomputeDescriptive();
renderDescriptiveChart();

/* ============================================================
   2. DIAGNOSTIC ANALYTICS
   ============================================================ */
const defaultRegionalData = [
  { region: 'North America', status: 'OK (-2%)' },
  { region: 'Europe',         status: 'OK (+1%)' },
  { region: 'Asia-Pacific',   status: 'CRITICAL (-80%)' }
];

function renderDrillTable() {
  const tb = document.getElementById('drill-table');
  tb.innerHTML = '';
  defaultRegionalData.forEach(function (r, i) {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    const tdR = document.createElement('td');
    tdR.appendChild(makeCell(r.region, function (v) { defaultRegionalData[i].region = v; runDrillDown(); }));
    tr.appendChild(tdR);
    const tdS = document.createElement('td');
    tdS.appendChild(makeCell(r.status, function (v) { defaultRegionalData[i].status = v; runDrillDown(); }));
    tr.appendChild(tdS);
    tb.appendChild(tr);
  });
}

function runDrillDown() {
  renderDrillTable();
  const critical = defaultRegionalData.filter(function (r) {
    return /critical|drop|warn|-[5-9]\d%|-[1-9]\d\d%/i.test(r.status);
  });
  let f;
  if (critical.length === 0) f = 'No critical regions found. The 20% drop seems distributed evenly.';
  else if (critical.length === 1) f = 'The 20% drop is entirely caused by a collapse in <strong>' + critical[0].region + '</strong>.';
  else f = 'Drop caused by multiple weak regions: <strong>' + critical.map(function (c) { return c.region; }).join(', ') + '</strong>.';
  document.getElementById('drill-output').innerHTML = '<div class="result-box"><i class="fas fa-magnifying-glass"></i> <strong>Finding:</strong> ' + f + '</div>';
}

const defaultLogs = [
  { day: 'Mon', errors: 12 }, { day: 'Tue', errors: 15 }, { day: 'Wed', errors: 480 },
  { day: 'Thu', errors: 14 }, { day: 'Fri', errors: 11 }
];
let logsData = JSON.parse(JSON.stringify(defaultLogs));

function renderDiscoveryTable() {
  const tb = document.getElementById('discovery-table');
  tb.innerHTML = '';
  const th = getThreshold();
  logsData.forEach(function (r, i) {
    const isA = (parseFloat(r.errors) || 0) > th;
    const tr = document.createElement('tr');
    tr.className = (i % 2 === 0 ? 'bg-white' : 'bg-slate-50') + (isA ? ' anomaly-row' : '');
    const tdD = document.createElement('td');
    tdD.appendChild(makeCell(r.day, function (v) { logsData[i].day = v; renderDiscoveryTable(); renderDiagnosticChart(); }));
    tr.appendChild(tdD);
    const tdE = document.createElement('td');
    tdE.appendChild(makeCell(r.errors, function (v) { logsData[i].errors = v; renderDiscoveryTable(); renderDiagnosticChart(); }, 'number'));
    tr.appendChild(tdE);
    const tdS = document.createElement('td');
    tdS.innerHTML = isA ? '<span class="text-red-600 font-semibold"><i class="fas fa-triangle-exclamation"></i> ANOMALY</span>' : '<span class="text-emerald-600"><i class="fas fa-circle-check"></i> Normal</span>';
    tr.appendChild(tdS);
    const tdA = document.createElement('td');
    tdA.className = 'text-right';
    tdA.appendChild(makeDeleteButton(function () {
      logsData.splice(i, 1); renderDiscoveryTable(); runDataDiscovery(); renderDiagnosticChart();
    }));
    tr.appendChild(tdA);
    tb.appendChild(tr);
  });
}

function runDataDiscovery() {
  renderDiscoveryTable();
  const th = getThreshold();
  const an = logsData.filter(function (l) { return (parseFloat(l.errors) || 0) > th; });
  const msg = an.length === 0
    ? 'No anomalies above threshold of <strong>' + th + '</strong>.'
    : '<strong>' + an.length + '</strong> anomaly(ies): ' + an.map(function (a) { return a.day + ' (' + a.errors + ' errors)'; }).join(', ') + '.';
  document.getElementById('discovery-output').innerHTML = '<div class="result-box"><i class="fas fa-chart-line"></i> ' + msg + '</div>';
}

document.getElementById('discovery-add-row').addEventListener('click', function () {
  // Use a unique day name based on existing days so multiple adds don't collide.
  const used = logsData.map(function (l) { return (l.day || '').toLowerCase(); });
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let next = 'D' + (logsData.length + 1);
  for (let i = 0; i < days.length; i++) {
    if (used.indexOf(days[i].toLowerCase()) === -1) { next = days[i]; break; }
  }
  logsData.push({ day: next, errors: 0 });
  renderDiscoveryTable(); runDataDiscovery(); renderDiagnosticChart();
});
document.getElementById('discovery-reset').addEventListener('click', function () {
  logsData = JSON.parse(JSON.stringify(defaultLogs));
  renderDiscoveryTable(); runDataDiscovery(); renderDiagnosticChart();
});

const defaultCorrelation = [
  { deliveryDays: '1-2 Days', rating: 4.8 },
  { deliveryDays: '3-4 Days', rating: 4.2 },
  { deliveryDays: '5+ Days',  rating: 1.5 }
];
let correlationData = JSON.parse(JSON.stringify(defaultCorrelation));

function renderCorrelationTable() {
  const tb = document.getElementById('correlation-table');
  tb.innerHTML = '';
  correlationData.forEach(function (r, i) {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    const tdD = document.createElement('td');
    tdD.appendChild(makeCell(r.deliveryDays, function (v) { correlationData[i].deliveryDays = v; runCorrelation(); }));
    tr.appendChild(tdD);
    const tdR = document.createElement('td');
    tdR.appendChild(makeCell(r.rating, function (v) { correlationData[i].rating = v; runCorrelation(); }, 'number'));
    tr.appendChild(tdR);
    const tdA = document.createElement('td');
    tdA.className = 'text-right';
    tdA.appendChild(makeDeleteButton(function () {
      correlationData.splice(i, 1); renderCorrelationTable(); runCorrelation();
    }));
    tr.appendChild(tdA);
    tb.appendChild(tr);
  });
}

function runCorrelation() {
  renderCorrelationTable();
  if (correlationData.length === 0) {
    document.getElementById('correlation-output').innerHTML = '<div class="result-box">No data. Add a row.</div>';
    return;
  }
  const xs = correlationData.map(function (_, i) { return i; });
  const ys = correlationData.map(function (r) { return parseFloat(r.rating) || 0; });
  const mx = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
  const my = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length;
  const num = xs.reduce(function (s, x, i) { return s + (x - mx) * (ys[i] - my); }, 0);
  const den = Math.sqrt(
    xs.reduce(function (s, x) { return s + (x - mx) * (x - mx); }, 0) *
    ys.reduce(function (s, y) { return s + (y - my) * (y - my); }, 0)
  );
  const corr = den === 0 ? 0 : num / den;
  const label = corr < -0.7 ? 'Strong Negative'
              : corr < -0.3 ? 'Moderate Negative'
              : corr >  0.7 ? 'Strong Positive'
              : corr >  0.3 ? 'Moderate Positive'
              : 'Weak / No Linear Correlation';
  document.getElementById('correlation-output').innerHTML =
    '<div class="result-box"><i class="fas fa-link"></i> <strong>Pearson correlation (delivery time vs rating):</strong> ' + corr.toFixed(3) +
    '\n<strong>Interpretation:</strong> ' + label + '</div>';
}

document.getElementById('correlation-add-row').addEventListener('click', function () {
  correlationData.push({ deliveryDays: 'New Tier', rating: 3.0 });
  renderCorrelationTable(); runCorrelation();
});
document.getElementById('correlation-reset').addEventListener('click', function () {
  correlationData = JSON.parse(JSON.stringify(defaultCorrelation));
  renderCorrelationTable(); runCorrelation();
});

function runRootCause() {
  const steps = [
    '1. Symptom: Users cannot complete checkout.',
    '2. Direct Cause: Payment Gateway API returning Error 500.',
    '3. Deeper Cause: Database connection pool was exhausted.',
    '4. ROOT CAUSE: Unoptimized SQL query deployed in version 1.0.4 patch.'
  ];
  document.getElementById('rootcause-output').innerHTML = '<div class="result-box"><i class="fas fa-diagram-project"></i> ' + steps.join('\n') + '</div>';
}

function renderDiagnosticChart() {
  const th = getThreshold();
  const labels = logsData.map(function (l) { return l.day; });
  const errs   = logsData.map(function (l) { return +l.errors; });
  const colors = logsData.map(function (l) { return (+l.errors > th) ? '#dc2626' : '#ea580c'; });
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Errors',
          data: errs,
          borderColor: '#ea580c',
          backgroundColor: 'rgba(234,88,12,0.15)',
          tension: 0.3,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: colors
        },
        {
          label: 'Threshold',
          data: logsData.map(function () { return th; }),
          borderColor: '#dc2626',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    }
  };
  getOrCreateChart('diagnostic-chart', config);
}

function recomputeDiagnostic() {
  runDrillDown();
  runDataDiscovery();
  runCorrelation();
  renderDiagnosticChart();
}

renderDiscoveryTable(); runDataDiscovery();
renderCorrelationTable(); runCorrelation();
runRootCause(); runDrillDown();

/* ============================================================
   3. PREDICTIVE ANALYTICS
   ============================================================ */
const defaultPredictive = [
  { year: 2024, product: 'Product X', units: 100, revenue: 2000 },
  { year: 2025, product: 'Product X', units: 150, revenue: 3000 }
];
let predictiveData = JSON.parse(JSON.stringify(defaultPredictive));

function renderPredictiveTable() {
  const tb = document.getElementById('predictive-base-table');
  tb.innerHTML = '';
  predictiveData.forEach(function (r, i) {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    const tdY = document.createElement('td');
    tdY.appendChild(makeCell(r.year, function (v) { predictiveData[i].year = parseInt(v) || 0; runPrediction(); renderPredictiveChart(); }, 'number'));
    tr.appendChild(tdY);
    const tdP = document.createElement('td');
    tdP.appendChild(makeCell(r.product, function (v) { predictiveData[i].product = v; runPrediction(); }));
    tr.appendChild(tdP);
    const tdU = document.createElement('td');
    tdU.appendChild(makeCell(r.units, function (v) { predictiveData[i].units = v; runPrediction(); renderPredictiveChart(); }, 'number'));
    tr.appendChild(tdU);
    const tdR = document.createElement('td');
    tdR.appendChild(makeCell(r.revenue, function (v) { predictiveData[i].revenue = v; runPrediction(); renderPredictiveChart(); }, 'number'));
    tr.appendChild(tdR);
    const tdA = document.createElement('td');
    tdA.className = 'text-right';
    tdA.appendChild(makeDeleteButton(function () {
      predictiveData.splice(i, 1); renderPredictiveTable(); runPrediction(); renderPredictiveChart();
    }));
    tr.appendChild(tdA);
    tb.appendChild(tr);
  });
}

function runPrediction() {
  renderPredictiveTable();
  if (predictiveData.length === 0) {
    document.getElementById('predicted-units').textContent = '0';
    document.getElementById('predicted-revenue').textContent = '$0';
    return;
  }
  const base = predictiveData.reduce(function (a, b) { return (b.year > a.year) ? b : a; });
  const g = parseFloat(document.getElementById('growth-rate').value) || 0;
  document.getElementById('growth-val').textContent = g + '%';
  const f = 1 + (g / 100);
  const pu = Math.round((base.units || 0) * f);
  const pr = Math.round((base.revenue || 0) * f);
  document.getElementById('predicted-units').textContent   = pu.toLocaleString();
  document.getElementById('predicted-revenue').textContent = '$' + pr.toLocaleString();
  const ny = (parseInt(base.year) || 0) + 1;
  document.getElementById('predicted-units-label').textContent   = ny + ' Forecasted Units';
  document.getElementById('predicted-revenue-label').textContent = ny + ' Forecasted Revenue';
}

function renderPredictiveChart() {
  const sorted = predictiveData.slice().sort(function (a, b) { return a.year - b.year; });
  const base = sorted[sorted.length - 1];
  const g = parseFloat(document.getElementById('growth-rate').value) || 0;
  const f = 1 + (g / 100);
  const nextYear = (parseInt(base && base.year) || 0) + 1;
  const labels = sorted.map(function (r) { return r.year; }).concat([nextYear]);
  const histData = sorted.map(function (r) { return +r.revenue; }).concat([null]);
  const forecastData = sorted.map(function () { return null; }).concat([Math.round((base && base.revenue || 0) * f)]);
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Historical Revenue',
          data: histData,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.15)',
          tension: 0.3,
          fill: true,
          pointRadius: 5
        },
        {
          label: 'Forecast',
          data: forecastData,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236,72,153,0.1)',
          borderDash: [6, 4],
          tension: 0.3,
          fill: false,
          pointRadius: 7,
          pointBackgroundColor: '#ec4899'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: function (v) { return '$' + v; } } },
        x: { grid: { display: false } }
      }
    }
  };
  getOrCreateChart('predictive-chart', config);
}

document.getElementById('predictive-add-row').addEventListener('click', function () {
  const ly = predictiveData.reduce(function (m, r) { return Math.max(m, r.year); }, 0);
  predictiveData.push({ year: ly + 1, product: 'Product X', units: 0, revenue: 0 });
  renderPredictiveTable(); runPrediction(); renderPredictiveChart();
});
document.getElementById('predictive-reset').addEventListener('click', function () {
  predictiveData = JSON.parse(JSON.stringify(defaultPredictive));
  renderPredictiveTable(); runPrediction(); renderPredictiveChart();
});

renderPredictiveTable(); runPrediction(); renderPredictiveChart();

/* ============================================================
   4. PRESCRIPTIVE ANALYTICS
   ============================================================ */
const defaultRoutes = [
  { name: 'Route A (Express Highway)', distance: 15, cost: 5, time: 30 },
  { name: 'Route B (Local Roads)',     distance: 12, cost: 0, time: 22 }
];
let routesData = JSON.parse(JSON.stringify(defaultRoutes));

function renderPrescriptiveTable() {
  const tb = document.getElementById('prescriptive-table');
  tb.innerHTML = '';
  routesData.forEach(function (r, i) {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    const tdN = document.createElement('td');
    tdN.appendChild(makeCell(r.name, function (v) { routesData[i].name = v; runPrescriptiveEngine(); renderPrescriptiveChart(); }));
    tr.appendChild(tdN);
    const tdD = document.createElement('td');
    tdD.appendChild(makeCell(r.distance, function (v) { routesData[i].distance = parseFloat(v) || 0; runPrescriptiveEngine(); renderPrescriptiveChart(); }, 'number'));
    tr.appendChild(tdD);
    const tdC = document.createElement('td');
    tdC.appendChild(makeCell(r.cost, function (v) { routesData[i].cost = parseFloat(v) || 0; runPrescriptiveEngine(); renderPrescriptiveChart(); }, 'number'));
    tr.appendChild(tdC);
    const tdT = document.createElement('td');
    tdT.appendChild(makeCell(r.time, function (v) { routesData[i].time = parseFloat(v) || 0; runPrescriptiveEngine(); renderPrescriptiveChart(); }, 'number'));
    tr.appendChild(tdT);
    const tdA = document.createElement('td');
    tdA.className = 'text-right';
    tdA.appendChild(makeDeleteButton(function () {
      routesData.splice(i, 1); renderPrescriptiveTable(); runPrescriptiveEngine(); renderPrescriptiveChart();
    }));
    tr.appendChild(tdA);
    tb.appendChild(tr);
  });
}

/* ---------- Goal button group ---------- */
(function initGoalButtons() {
  const wrap = document.getElementById('user-goal');
  if (!wrap) return;
  const buttons = wrap.querySelectorAll('.goal-btn');
  function setActive(g) {
    buttons.forEach(function (b) { b.classList.toggle('goal-active', b.dataset.goal === g); });
  }
  setActive('time'); // default
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setActive(b.dataset.goal); runPrescriptiveEngine(); });
  });
})();

function runPrescriptiveEngine() {
  renderPrescriptiveTable();
  const activeBtn = document.querySelector('#user-goal .goal-btn.goal-active');
  const goal = activeBtn ? activeBtn.dataset.goal : 'time';
  if (routesData.length === 0) {
    document.getElementById('prescribed-route').textContent = 'No options available';
    document.getElementById('prescribed-reason').textContent = 'Add at least one route option.';
    return;
  }
  let chosen, reason;
  if (goal === 'time') {
    chosen = routesData.reduce(function (m, r) { return (r.time < m.time) ? r : m; }, routesData[0]);
    reason = 'Chosen because it takes the shortest travel time — <strong>' + chosen.time + ' min</strong> over <strong>' +
             chosen.distance + ' km</strong> (toll: $' + chosen.cost + ').';
  } else {
    chosen = routesData.reduce(function (m, r) { return (r.cost < m.cost) ? r : m; }, routesData[0]);
    reason = 'Chosen because it has the lowest direct cost — <strong>$' + chosen.cost.toFixed(2) +
             '</strong> toll, <strong>' + chosen.time + ' min</strong> over ' + chosen.distance + ' km.';
  }
  document.getElementById('prescribed-route').innerHTML  = '<i class="fas fa-circle-check text-emerald-600"></i> Take ' + chosen.name;
  document.getElementById('prescribed-reason').innerHTML   = reason;
}

function renderPrescriptiveChart() {
  const labels = routesData.map(function (r) { return r.name; });
  const times  = routesData.map(function (r) { return +r.time; });
  const costs  = routesData.map(function (r) { return +r.cost; });
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Time (min)', data: times, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
        { label: 'Cost ($)',   data: costs, backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    }
  };
  getOrCreateChart('prescriptive-chart', config);
}

document.getElementById('prescriptive-add-row').addEventListener('click', function () {
  routesData.push({ name: 'New Route', distance: 10, cost: 0, time: 25 });
  renderPrescriptiveTable(); runPrescriptiveEngine(); renderPrescriptiveChart();
});
document.getElementById('prescriptive-reset').addEventListener('click', function () {
  routesData = JSON.parse(JSON.stringify(defaultRoutes));
  renderPrescriptiveTable(); runPrescriptiveEngine(); renderPrescriptiveChart();
});

renderPrescriptiveTable(); runPrescriptiveEngine(); renderPrescriptiveChart();
