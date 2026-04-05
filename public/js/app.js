document.addEventListener('DOMContentLoaded', () => {
  // --- LOGIN FLOW ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = '/dashboard.html';
        } else {
          alert('Login failed');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // --- PORTAL FLOW ---
  if (window.location.pathname.includes('portal')) {
    const vmForm = document.getElementById('vmProvisionForm');
    const storageForm = document.getElementById('storageProvisionForm');
    const portalLog = document.getElementById('portalLog');

    const addPortalLog = (msg, typeClass='log-sys') => {
      const div = document.createElement('div');
      div.className = `log-line ${typeClass}`;
      div.textContent = msg;
      portalLog.appendChild(div);
      portalLog.scrollTop = portalLog.scrollHeight;
    };

    if (vmForm) {
      vmForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('vmInstanceType').value;
        const os = document.getElementById('vmOs').value;
        const region = document.getElementById('vmRegion').value;
        
        const btn = vmForm.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Provisioning...';

        addPortalLog(`[${new Date().toLocaleTimeString()}] [REQ] VM Provisioning: ${type} (${os}) in ${region}`, 'log-info');
        
        setTimeout(() => addPortalLog("> Requesting compute nodes...", "log-sys"), 500);
        setTimeout(() => addPortalLog("> Preparing OS image from registry...", "log-sys"), 1200);
        
        setTimeout(async () => {
          const res = await triggerTest(); // simulate backend operation affecting metrics
          if (res && res.success) {
             addPortalLog(`[SUCCESS] Virtual machine deployed successfully.`, 'log-success');
          } else {
             addPortalLog(`[ERROR] Provisioning failed due to lack of available instances in ${region}.`, 'log-error');
          }
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Provision VM';
        }, 2500);
      });
    }

    if (storageForm) {
      storageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('storageType').value;
        const size = document.getElementById('storageSize').value;
        const enc = document.getElementById('storageEncryption').value;

        const btn = document.getElementById('btnStorage');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Allocating...';

        addPortalLog(`[${new Date().toLocaleTimeString()}] [REQ] Storage Allocation: ${size}GB ${type} (Enc: ${enc})`, 'log-info');
        
        setTimeout(() => addPortalLog("> Requesting block storage...", "log-sys"), 400);
        setTimeout(() => addPortalLog("> Formatting and attaching volume...", "log-sys"), 1000);
        
        setTimeout(async () => {
          const res = await triggerTest(); // simulate backend operation affecting metrics
          if (res && res.success) {
             addPortalLog(`[SUCCESS] ${size}GB Storage Volume allocated and ready.`, 'log-success');
          } else {
             addPortalLog(`[ERROR] Failed to allocate storage volume.`, 'log-error');
          }
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-plus"></i> Allocate Storage';
        }, 2000);
      });
    }
  }

  // --- DASHBOARD FLOW ---
  if (window.location.pathname.includes('dashboard')) {
    fetchMetrics();
    fetchRecentTests();
    initChart();

    const triggerBtn = document.getElementById('triggerTestBtn');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', async () => {
        triggerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
        triggerBtn.disabled = true;
        
        await triggerTest();
        await fetchMetrics();
        await fetchRecentTests();
        
        triggerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Trigger Tests';
        triggerBtn.disabled = false;
      });
    }
  }

  // --- REPORTS / EXECUTOR FLOW ---
  if (window.location.pathname.includes('reports')) {
    fetchMetricsGlobal();
    
    const runBtn = document.getElementById('runDiagnosticBtn');
    if (runBtn) {
      runBtn.addEventListener('click', async () => {
        const term = document.getElementById('terminalOutput');
        
        const addLog = (msg, typeClass='log-sys') => {
          const div = document.createElement('div');
          div.className = `log-line ${typeClass}`;
          div.textContent = msg;
          term.appendChild(div);
          term.scrollTop = term.scrollHeight;
        };

        addLog(`[${new Date().toLocaleTimeString()}] [EXEC] Starting remote validation suite...`, 'log-info');
        runBtn.disabled = true;
        
        setTimeout(() => addLog("> Fetching VM definitions...", "log-sys"), 500);
        setTimeout(() => addLog("> Allocating storage nodes...", "log-sys"), 1000);
        setTimeout(() => addLog("> Applying firewall rules...", "log-sys"), 1500);
        
        setTimeout(async () => {
            const res = await triggerTest();
            if (res && res.success) {
              const t = res.data;
              if (t.status === 'PASSED') {
                addLog(`[PASS] Environment validation successful. Coverage: ${t.coverage}`, 'log-success');
              } else {
                addLog(`[FAIL] Environment validation failed across 3 nodes.`, 'log-error');
              }
              addLog(`[SYS] Test completed in ${t.duration}.`, 'log-sys');
            }
            fetchMetricsGlobal();
            runBtn.disabled = false;
        }, 3000);
      });
    }
  }
});

let chartInstance = null;
let passFailChartInstance = null;

function initChart(dataArray = [], labelsArray = [], statusArray = []) {
  const ctx = document.getElementById('performanceChart');
  if(!ctx) return;
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Color each point green for PASSED, red for FAILED
  const pointColors = statusArray.map(s => s === 'PASSED' ? '#10b981' : '#ef4444');
  const pointBorderColors = statusArray.map(s => s === 'PASSED' ? '#34d399' : '#f87171');
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsArray,
      datasets: [{
        label: 'Latency (ms)',
        data: dataArray,
        fill: true,
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        borderColor: '#0ea5e9',
        tension: 0.4,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointBorderColors,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            afterLabel: function(context) {
              const status = statusArray[context.dataIndex];
              return 'Status: ' + (status || 'N/A');
            }
          }
        }
      },
      scales: {
        y: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { size: 11 } },
          title: { display: true, text: 'Latency (ms)', color: '#64748b' }
        },
        x: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }
        }
      }
    }
  });
}

function initPassFailChart(passed, failed) {
  const ctx = document.getElementById('passFailChart');
  if (!ctx) return;

  if (passFailChartInstance) {
    passFailChartInstance.destroy();
  }

  passFailChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed'],
      datasets: [{
        data: [passed, failed],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', padding: 15, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } }
        }
      }
    }
  });
}

// Global API calls
async function fetchMetrics() {
  try {
    const res = await fetch('/api/metrics');
    const d = await res.json();
    if(d.success && d.data) {
      document.getElementById('val-requests').innerText = d.data.totalRequests;
      document.getElementById('val-vms').innerText = d.data.vmDeployments;
      document.getElementById('val-storage').innerText = d.data.storageAllocations;
      document.getElementById('val-passrate').innerText = d.data.testPassRate + '%';
    }
  } catch(e) { console.error(e) }
}

async function fetchRecentTests() {
  try {
    const res = await fetch('/api/tests/recent');
    const d = await res.json();
    if(d.success && d.data) {
      if (document.getElementById('performanceChart')) {
        const tests = d.data.slice().reverse();
        const latencies = tests.map(t => parseInt(t.duration.replace('ms','')) || 0);
        const labels = tests.map(t => t.runId);
        const statuses = tests.map(t => t.status);
        
        let sum = 0;
        latencies.forEach(l => sum += l);
        let avg = latencies.length ? Math.round(sum / latencies.length) : 0;
        
        const avgEl = document.getElementById('val-avglatency');
        if (avgEl) avgEl.innerText = avg + 'ms';

        // Count pass/fail
        let passed = 0, failed = 0;
        statuses.forEach(s => { if (s === 'PASSED') passed++; else failed++; });
        
        const passedEl = document.getElementById('val-passed-count');
        if (passedEl) passedEl.innerText = passed;
        const failedEl = document.getElementById('val-failed-count');
        if (failedEl) failedEl.innerText = failed;
        
        if (latencies.length > 0) {
           initChart(latencies, labels, statuses);
           initPassFailChart(passed, failed);
        }
      }

      const tbody = document.getElementById('recentTestsTable');
      if (tbody) {
        tbody.innerHTML = '';
        d.data.forEach(t => {
          const date = new Date(t.completedAt).toLocaleString();
          const tr = document.createElement('tr');
          const isPass = t.status === 'PASSED';
          tr.innerHTML = `
            <td>${t.runId}</td>
            <td>${t.runner}</td>
            <td>${t.environmentOs}</td>
            <td><span class="status-badge ${isPass ? 'status-passed' : 'status-failed'}">${t.status}</span></td>
            <td>${t.duration}</td>
            <td>${t.coverage}</td>
            <td>${date}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  } catch(e) { console.error(e) }
}

async function triggerTest() {
  try {
    const res = await fetch('/api/tests/trigger', { method: 'POST' });
    const d = await res.json();
    return d;
  } catch(e) { console.error(e); return null; }
}

async function fetchMetricsGlobal() {
  try {
    let passed = 0;
    let failed = 0;
    let totalRuns = 0;
    
    // get recent tests to count passed/failed (quick hack for demo, normally backend aggregation)
    const tRes = await fetch('/api/tests/recent');
    const tData = await tRes.json();
    if (tData.success) {
       tData.data.forEach(t => {
           if(t.status === 'PASSED') passed++;
           else failed++;
       });
    }

    const mRes = await fetch('/api/metrics');
    const mData = await mRes.json();
    if (mData.success && mData.data) {
       totalRuns = mData.data.totalRequests; // approx
    }
    
    const runEl = document.getElementById('rep-runs');
    if(runEl) runEl.innerText = totalRuns;
    
    const covEl = document.getElementById('rep-cov');
    if(covEl) covEl.innerText = mData.data ? mData.data.testPassRate + '%' : '0%';
    
    const passEl = document.getElementById('rep-passed');
    if(passEl) passEl.innerText = passed;
    
    const failEl = document.getElementById('rep-failed');
    if(failEl) failEl.innerText = failed;

  } catch(e) { console.error(e) }
}
