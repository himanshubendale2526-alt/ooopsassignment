'use strict';

/* ============ Q1: Higher-order array methods ============ */
const sensorData = [
  { id: 'S1', type: 'Temperature', value: 92, threshold: 80, unit: 'C' },
  { id: 'S2', type: 'Pressure',    value: 30, threshold: 50, unit: 'psi' },
  { id: 'S3', type: 'Vibration',   value: 9.5, threshold: 6, unit: 'mm/s' },
  { id: 'S4', type: 'Temperature', value: 105, threshold: 80, unit: 'C' },
  { id: 'S5', type: 'Humidity',    value: 40, threshold: 70, unit: '%' },
  { id: 'S6', type: 'Pressure',    value: 58, threshold: 50, unit: 'psi' }
];

function processSensorData(data) {
  const breaches = data
    .filter(s => s.value > s.threshold)
    .map(s => {
      const excessPct = ((s.value - s.threshold) / s.threshold) * 100;
      return { ...s, excessPct: +excessPct.toFixed(1), severity: excessPct > 25 ? 'critical' : 'warning' };
    });
  const summary = breaches.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});
  return { breaches, summary };
}

function renderAlertTable(breaches, container) {
  container.innerHTML = '';
  if (breaches.length === 0) { container.textContent = 'No breaches found.'; return; }
  const table = document.createElement('table');
  const thead = table.createTHead();
  const hr = thead.insertRow();
  ['ID', 'Type', 'Value', 'Threshold', 'Excess %', 'Severity'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    hr.appendChild(th);
  });
  const tbody = table.createTBody();
  breaches.forEach(b => {
    const tr = tbody.insertRow();
    tr.className = b.severity;
    [b.id, b.type, `${b.value} ${b.unit}`, `${b.threshold} ${b.unit}`, b.excessPct + '%', b.severity.toUpperCase()]
      .forEach(v => tr.insertCell().textContent = v);
  });
  container.appendChild(table);
}

document.getElementById('btnProcess').addEventListener('click', () => {
  const { breaches, summary } = processSensorData(sensorData);
  renderAlertTable(breaches, document.getElementById('alertsContainer'));
  document.getElementById('alertSummary').textContent =
    'Breaches by type: ' + JSON.stringify(summary);
});

/* ============ Q2: NodeIterator + TreeWalker ============ */
function scanDashboard() {
  const root = document.getElementById('dashboard');
  const log = document.getElementById('scanLog');
  const lines = [];

  // NodeIterator: flat inventory of all AI nodes
  const iterator = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => n.hasAttribute('data-node') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  });
  let total = 0, n;
  while ((n = iterator.nextNode())) total++;
  lines.push(`NodeIterator: found ${total} intelligent nodes.`);

  // TreeWalker: walk the tree and style the offline ones
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: node => node.dataset && node.dataset.status === 'offline'
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  });
  let offline = 0;
  while (walker.nextNode()) {
    const el = walker.currentNode;
    el.style.backgroundColor = '#fecaca';
    el.style.border = '2px solid #dc2626';
    el.style.color = '#7f1d1d';
    el.classList.add('node-warning');
    el.setAttribute('title', 'Node offline!');
    el.textContent = el.dataset.node + ' - OFFLINE';
    offline++;
    lines.push(`TreeWalker: ${el.dataset.node} marked as warning.`);
  }
  lines.push(`Total offline: ${offline}`);
  log.textContent = lines.join('\n');
}
document.getElementById('btnScan').addEventListener('click', scanDashboard);

/* ============ Q3: Event flow (cross-browser) ============ */
function addEvent(el, type, handler, useCapture) {
  if (el.addEventListener) el.addEventListener(type, handler, !!useCapture);
  else if (el.attachEvent) el.attachEvent('on' + type, handler); // old IE fallback
}

(function setupEventFlow() {
  const chart = document.getElementById('chart');
  const log = document.getElementById('eventLog');
  const stopBox = document.getElementById('chkStop');
  const phaseName = { 1: 'CAPTURING', 2: 'AT TARGET', 3: 'BUBBLING' };
  const label = el => el.id || el.dataset.series || el.className || el.tagName;

  function write(msg) { log.textContent += msg + '\n'; log.scrollTop = log.scrollHeight; }

  function handler(e) {
    e = e || window.event;
    const target = e.target || e.srcElement;
    const current = e.currentTarget || this;
    write(`[${phaseName[e.eventPhase] || 'N/A'}] currentTarget=${label(current)} | target=${label(target)}`);
  }

  // Capturing and bubbling listeners on the chart container
  addEvent(chart, 'click', handler, true);
  addEvent(chart, 'click', handler, false);

  // Listeners on each bar
  chart.querySelectorAll('.bar').forEach(bar => {
    addEvent(bar, 'click', function (e) {
      e = e || window.event;
      if (e.preventDefault) e.preventDefault(); else e.returnValue = false; // block link navigation
      const target = e.target || e.srcElement;
      write(`  -> Bar clicked: series=${bar.dataset.series}, value=${bar.dataset.value}, ` +
            `clientX=${e.clientX}, clientY=${e.clientY}, ` +
            `target tag=${target.tagName}, defaultPrevented=${e.defaultPrevented}`);
      if (stopBox.checked) {
        if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
        write('  -> Propagation stopped at bar.');
      }
    }, false);
  });

  addEvent(document.getElementById('eventLog'), 'dblclick', () => { log.textContent = ''; });
})();

/* ============ Q4: Collapsible and Tooltip plugin ============ */
function createCollapsible(title, contentNodes, parent, beforeNode) {
  const wrap = document.createElement('div');
  wrap.className = 'collapsible';

  const header = document.createElement('button');
  header.className = 'collapsible-header';
  header.textContent = '+ ' + title;

  const body = document.createElement('div');
  body.className = 'collapsible-body';
  contentNodes.forEach(n => body.appendChild(n));

  header.addEventListener('click', () => {
    const open = wrap.classList.toggle('open');
    header.textContent = (open ? '- ' : '+ ') + title;
  });

  wrap.appendChild(header);
  wrap.appendChild(body);
  parent.insertBefore(wrap, beforeNode || null); // insertBefore (null = append at end)
  return wrap;
}

function makeTipTarget(text, tip) {
  const s = document.createElement('span');
  s.className = 'tip-target';
  s.textContent = text;
  s.setAttribute('data-tooltip', tip);
  return s;
}

function initTooltips() {
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  function position(e) {
    const gap = 15;
    const vw = window.innerWidth, vh = window.innerHeight; // BOM viewport
    let x = e.clientX + gap, y = e.clientY + gap;
    if (x + tip.offsetWidth > vw) x = e.clientX - tip.offsetWidth - gap;
    if (y + tip.offsetHeight > vh) y = e.clientY - tip.offsetHeight - gap;
    tip.style.left = Math.max(0, x) + 'px';
    tip.style.top = Math.max(0, y) + 'px';
  }

  document.addEventListener('mouseover', e => {
    const t = e.target.closest && e.target.closest('[data-tooltip]');
    if (!t) return;
    tip.textContent = t.getAttribute('data-tooltip');
    tip.style.display = 'block';
    position(e);
  });
  document.addEventListener('mousemove', e => {
    if (tip.style.display === 'block') position(e);
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest && e.target.closest('[data-tooltip]');
    if (t) tip.style.display = 'none';
  });
}

(function setupPlugin() {
  const area = document.getElementById('pluginArea');
  const first = createCollapsible('Sensor Info', [
    makeTipTarget('Temp Sensor', 'Measures core temperature in C'),
    makeTipTarget('Pressure Sensor', 'Measures line pressure in psi')
  ], area);
  // Inserted BEFORE the first section using insertBefore
  createCollapsible('Network Info', [
    makeTipTarget('Gateway', 'Edge gateway - 192.168.1.1'),
    makeTipTarget('Latency', 'Average round-trip: 24 ms')
  ], area, first);
  initTooltips();
})();

/* ============ Q5: Simulated async fetch ============ */
function simulateFetch(endpoint) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (endpoint === '/api/ok') {
        const payload = {
          status: 'success',
          timestamp: new Date().toISOString(),
          nodes: [
            { id: 'N1', health: 98, load: 35 },
            { id: 'N2', health: 76, load: 82 },
            { id: 'N3', health: 91, load: 54 }
          ]
        };
        resolve(new Response(JSON.stringify(payload), { status: 200 }));
      } else if (endpoint === '/api/server-error') {
        resolve(new Response('Internal Server Error', { status: 500, statusText: 'Server Error' }));
      } else if (endpoint === '/api/bad-json') {
        resolve(new Response('{ "nodes": [ {id: broken ', { status: 200 }));
      } else {
        reject(new Error('Network unreachable'));
      }
    }, 1000);
  });
}

async function loadData(endpoint) {
  const statusEl = document.getElementById('fetchStatus');
  const resultEl = document.getElementById('fetchResult');
  statusEl.className = 'status-loading';
  statusEl.textContent = 'Loading...';
  resultEl.innerHTML = '';
  try {
    const res = await simulateFetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    const data = await res.json(); // throws SyntaxError on bad JSON
    if (!Array.isArray(data.nodes)) throw new Error('Invalid data structure');

    data.nodes.forEach(n => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<b>${n.id}</b><br>Health: ${n.health}%<br>Load: ${n.load}%`;
      resultEl.appendChild(card);
    });
    statusEl.className = 'status-ok';
    statusEl.textContent = `Success at ${data.timestamp}`;
  } catch (err) {
    statusEl.className = 'status-error';
    statusEl.textContent = err instanceof SyntaxError
      ? 'Error: Malformed JSON received from server.'
      : 'Error: ' + err.message;
  }
}

document.querySelectorAll('[data-endpoint]').forEach(btn =>
  btn.addEventListener('click', () => loadData(btn.dataset.endpoint))
);