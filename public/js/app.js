// =============================
// UI UTILITIES
// =============================
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let icon = 'info-circle';
  if (type === 'success') icon = 'circle-check';
  if (type === 'error') icon = 'circle-xmark';
  toast.innerHTML = `<i class="fa-solid fa-${icon} toast-icon"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(r => observer.observe(r));
}

// =============================
// GLOBAL STATE & DATA
// =============================
let perfChart = null;
let coveragePieChart = null;

// =============================
// CORE ACTIONS
// =============================
async function triggerTest() {
  try {
    const res = await fetch("/api/tests/trigger", { method: "POST" });
    const result = await res.json();
    if (result.success) {
      showToast(`Test ${result.data.runId} initiated successfully.`, "success");
      return result.data;
    }
  } catch (err) {
    showToast("Failed to trigger test suite.", "error");
  }
}

async function fetchMetrics() {
  try {
    const res = await fetch("/api/metrics");
    const result = await res.json();
    if (result.success && result.data) {
      const d = result.data;
      updateDOM("val-requests", d.totalRequests);
      updateDOM("val-vms", Math.floor(d.totalRequests * 0.45)); // Simulated breakdown
      updateDOM("val-storage", Math.floor(d.totalRequests * 0.3)); // Simulated breakdown
      updateDOM("val-passrate", d.testPassRate + "%");
      updateCoveragePieChart(d.testPassRate);
      
      // Reports page metrics
      updateDOM("rep-runs", d.totalRequests);
      updateDOM("rep-cov", "88%"); // Mock static coverage
      updateDOM("rep-passed", Math.floor(d.totalRequests * (d.testPassRate/100)));
      updateDOM("rep-failed", Math.floor(d.totalRequests * (1 - d.testPassRate/100)));
    }
  } catch (err) { console.error("Metrics fetch failed", err); }
}

async function fetchRecentTests() {
  try {
    const res = await fetch("/api/tests/recent");
    const result = await res.json();
    if (result.success && result.data) {
      updateRecentTestsTable(result.data);
      updatePerformanceChart(result.data);
      
      if (document.getElementById('val-avglatency')) {
        const avg = result.data.length > 0 ? 
          Math.floor(result.data.reduce((sum, t) => sum + parseInt(t.duration), 0) / result.data.length) : 0;
        updateDOM("val-avglatency", avg + "ms");
      }
    }
  } catch (err) { console.error("Recent tests fetch failed", err); }
}

function updateDOM(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateRecentTestsTable(tests) {
  const tbody = document.getElementById("recentTests");
  if (!tbody) return;
  tbody.innerHTML = tests.map(t => `
    <tr>
      <td>${t.runId}</td>
      <td>${t.runner}</td>
      <td>${t.environmentOs}</td>
      <td><span class="status-badge ${t.status === 'PASSED' ? 'status-passed' : 'status-failed'}">${t.status}</span></td>
      <td>${t.duration}</td>
      <td>${t.coverage}</td>
      <td>${new Date(t.completedAt).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

function updatePerformanceChart(tests) {
  const ctx = document.getElementById("performanceChart");
  if (!ctx) return;
  const sorted = [...tests].reverse();
  const labels = sorted.map(t => new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const data = sorted.map(t => parseInt(t.duration));
  const colors = sorted.map(t => t.status === 'PASSED' ? '#10b981' : '#f87171');

  if (perfChart) perfChart.destroy();
  perfChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Latency (ms)',
        data,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: colors,
        pointRadius: 6,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      },
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function updateCoveragePieChart(passRate) {
  const ctx = document.getElementById("coveragePieChart");
  if (!ctx) return;
  const failRate = Math.max(0, 100 - passRate);

  if (coveragePieChart) coveragePieChart.destroy();
  coveragePieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed'],
      datasets: [{
        data: [passRate, failRate],
        backgroundColor: ['#0ea5e9', '#ef4444'],
        hoverBackgroundColor: ['#38bdf8', '#f87171'],
        borderWidth: 0,
        borderRadius: 5,
        cutout: '80%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 2000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => ` ${context.label}: ${context.raw}%`
          }
        }
      }
    }
  });
}

// =============================
// INITIALIZATION
// =============================
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();

  // --- AUTH TABS & FORMS ---
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener("click", () => {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    });
    tabRegister.addEventListener("click", () => {
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const btn = document.getElementById("loginBtn");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("token", data.token);
          window.location.href = "/dashboard.html";
        } else {
          showToast(data.message || "Invalid credentials.", "error");
        }
      } catch (err) { showToast("Authentication server unreachable.", "error"); }
      btn.disabled = false;
      btn.innerHTML = 'Verify Identity';
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("regUsername").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const btn = document.getElementById("registerBtn");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Account created! Please login.", "success");
          tabLogin.click(); // Switch back to login
        } else {
          showToast(data.message || "Registration failed.", "error");
        }
      } catch (err) { showToast("Network error during registration.", "error"); }
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    });
  }

  // --- DASHBOARD & REPORTS AUTO-REFRESH ---
  if (window.location.pathname.includes("dashboard") || window.location.pathname.includes("reports")) {
    fetchMetrics();
    fetchRecentTests();
    setInterval(() => {
      fetchMetrics();
      fetchRecentTests();
    }, 5000);
  }

  // --- TRIGGER BUTTONS ---
  const dTrigger = document.getElementById("triggerTestBtn");
  if (dTrigger) {
    dTrigger.addEventListener("click", async () => {
      dTrigger.disabled = true;
      dTrigger.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
      await triggerTest();
      await fetchMetrics();
      await fetchRecentTests();
      dTrigger.disabled = false;
      dTrigger.innerHTML = '<i class="fa-solid fa-play"></i> Trigger Tests';
    });
  }

  const rTrigger = document.getElementById("runDiagnosticBtn");
  if (rTrigger) {
    rTrigger.addEventListener("click", async () => {
      const term = document.getElementById("terminalOutput");
      const addLog = (msg, type = 'sys') => {
        const div = document.createElement("div");
        div.className = `log-line log-${type}`;
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
      };

      rTrigger.disabled = true;
      addLog("Initializing diagnostic suite...", "info");
      setTimeout(() => addLog("Connecting to cluster nodes...", "info"), 600);
      setTimeout(async () => {
        const test = await triggerTest();
        if (test) {
          addLog(`Test executed: ${test.runId}`, "success");
          addLog(`Status: ${test.status}`, test.status === 'PASSED' ? 'success' : 'error');
          addLog(`Coverage: ${test.coverage}`, "info");
        }
        addLog("Diagnostic suite complete.", "sys");
        rTrigger.disabled = false;
      }, 1500);
    });
  }

  // --- PORTAL FORMS ---
  const addPortalLog = (msg, type = 'sys') => {
    const el = document.getElementById("portalLogs");
    if (!el) return;
    const div = document.createElement("div");
    div.className = `log-line log-${type}`;
    div.textContent = `[PORTAL] ${msg}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  };

  const vmForm = document.getElementById("vmForm");
  if (vmForm) {
    vmForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const type = document.getElementById("vmType").value;
      addPortalLog(`Requesting instance: ${type}...`, 'info');
      setTimeout(() => {
        addPortalLog(`Provisioning successful. Host assigned.`, 'success');
        showToast(`VM ${type} deployed.`, "success");
        triggerTest(); // Link to metrics
      }, 1000);
    });
  }

  const storageForm = document.getElementById("storageForm");
  if (storageForm) {
    storageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const size = document.getElementById("storageSize").value;
      addPortalLog(`Allocating ${size}GB volume...`, 'info');
      setTimeout(() => {
        addPortalLog(`Volume attached and encrypted.`, 'success');
        showToast(`${size}GB Volume created.`, "success");
        triggerTest(); // Link to metrics
      }, 800);
    });
  }
});