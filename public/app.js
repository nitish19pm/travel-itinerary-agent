// =============================================================================
// app.js — Frontend: form handling, fetch, replan feature, itinerary rendering
// =============================================================================

// ---- DOM references --------------------------------------------------------
const form          = document.getElementById("travel-form");
const submitBtn     = document.getElementById("submit-btn");
const formPanel     = document.getElementById("form-panel");
const progressPanel = document.getElementById("progress-panel");
const resultPanel   = document.getElementById("result-panel");
const editPanel     = document.getElementById("edit-panel");
const editForm      = document.getElementById("edit-form");

// Stores the last used preferences so the edit panel can pre-fill them
let lastPreferences = null;

// ---- Set default dates (trip starting in 30 days, 7-day duration) ----------
(function setDefaultDates() {
  const dep = new Date();
  dep.setDate(dep.getDate() + 30);
  const ret = new Date(dep);
  ret.setDate(dep.getDate() + 7);
  const fmt = (d) => d.toISOString().split("T")[0];
  document.getElementById("departureDate").value = fmt(dep);
  document.getElementById("returnDate").value     = fmt(ret);
})();

// ---- Main form submission --------------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const preferences = collectFormData(form, "interests");
  if (!validateForm(preferences, form)) return;

  lastPreferences = preferences;
  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-text").textContent = "Generating...";
  showPanel("progress");

  try {
    const { itinerary } = await fetchItinerary(preferences);
    renderItinerary(itinerary, preferences);
    showPanel("result");
    attachResultButtons();
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.", form);
    showPanel("form");
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-text").textContent = "Generate My Itinerary";
  }
});

// ---- Edit form (replan) submission ----------------------------------------
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const preferences = collectEditFormData();
  if (!validateForm(preferences, editForm)) return;

  lastPreferences = preferences;

  const regenBtn = document.getElementById("regenerate-btn");
  regenBtn.disabled = true;
  regenBtn.querySelector(".btn-text").textContent = "Regenerating...";

  // Hide edit panel, show spinner
  editPanel.classList.add("hidden");
  showPanel("progress");

  try {
    const { itinerary } = await fetchItinerary(preferences);
    renderItinerary(itinerary, preferences);
    showPanel("result");
    attachResultButtons();
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.", editForm);
    editPanel.classList.remove("hidden");
    showPanel("result"); // keep result visible behind the edit panel
  } finally {
    regenBtn.disabled = false;
    regenBtn.querySelector(".btn-text").textContent = "Regenerate Itinerary";
  }
});

// ---- Attach result panel button listeners ----------------------------------
// Called after every render so fresh DOM elements get listeners
function attachResultButtons() {
  const replanBtn   = document.getElementById("replan-btn");
  const planAgainBtn = document.getElementById("plan-again-btn");

  if (replanBtn) {
    replanBtn.addEventListener("click", () => {
      prefillEditForm(lastPreferences);
      editPanel.classList.remove("hidden");
      editPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (planAgainBtn) {
    planAgainBtn.addEventListener("click", () => {
      editPanel.classList.add("hidden");
      showPanel("form");
    });
  }

  const cancelBtn = document.getElementById("cancel-edit-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      editPanel.classList.add("hidden");
    });
  }
}

// ---- Collect data from the main form ---------------------------------------
function collectFormData(formEl, interestsName) {
  const fd = new FormData(formEl);
  const interests = Array.from(
    formEl.querySelectorAll(`input[name="${interestsName}"]:checked`)
  ).map((cb) => cb.value);

  return {
    destination:         fd.get("destination")?.trim(),
    departureDate:       fd.get("departureDate"),
    returnDate:          fd.get("returnDate"),
    travelers:           fd.get("travelers"),
    totalBudget:         Number(fd.get("totalBudget")),
    budgetStyle:         fd.get("budgetStyle"),
    interests,
    groupType:           fd.get("groupType"),
    specialRequirements: fd.get("specialRequirements")?.trim(),
  };
}

// ---- Collect data from the edit form (different field/radio names) ---------
function collectEditFormData() {
  const fd = new FormData(editForm);
  const interests = Array.from(
    editForm.querySelectorAll('input[name="edit-interests"]:checked')
  ).map((cb) => cb.value);

  return {
    destination:         fd.get("destination")?.trim(),
    departureDate:       fd.get("departureDate"),
    returnDate:          fd.get("returnDate"),
    travelers:           fd.get("travelers"),
    totalBudget:         Number(fd.get("totalBudget")),
    budgetStyle:         fd.get("edit-budgetStyle"),
    interests,
    groupType:           fd.get("groupType"),
    specialRequirements: fd.get("specialRequirements")?.trim(),
  };
}

// ---- Pre-fill the edit form with last preferences --------------------------
function prefillEditForm(prefs) {
  if (!prefs) return;

  document.getElementById("edit-destination").value       = prefs.destination || "";
  document.getElementById("edit-departureDate").value     = prefs.departureDate || "";
  document.getElementById("edit-returnDate").value        = prefs.returnDate || "";
  document.getElementById("edit-totalBudget").value       = prefs.totalBudget || "";
  document.getElementById("edit-specialRequirements").value = prefs.specialRequirements || "";

  // Select travelers
  const travelersEl = document.getElementById("edit-travelers");
  if (travelersEl) travelersEl.value = prefs.travelers || "2";

  // Select groupType
  const groupTypeEl = document.getElementById("edit-groupType");
  if (groupTypeEl) groupTypeEl.value = prefs.groupType || "couple";

  // Set budget style radio
  editForm.querySelectorAll('input[name="edit-budgetStyle"]').forEach((radio) => {
    radio.checked = radio.value === prefs.budgetStyle;
  });

  // Set interests checkboxes
  editForm.querySelectorAll('input[name="edit-interests"]').forEach((cb) => {
    cb.checked = (prefs.interests || []).includes(cb.value);
  });
}

// ---- Validation ------------------------------------------------------------
function validateForm(prefs, formEl) {
  formEl.querySelectorAll(".error-message").forEach(el => el.remove());

  if (!prefs.destination) {
    showError("Please enter a destination.", formEl); return false;
  }
  if (!prefs.departureDate || !prefs.returnDate) {
    showError("Please select travel dates.", formEl); return false;
  }
  if (new Date(prefs.returnDate) <= new Date(prefs.departureDate)) {
    showError("Return date must be after departure date.", formEl); return false;
  }
  if (!prefs.totalBudget || prefs.totalBudget < 200) {
    showError("Please enter a budget of at least $200.", formEl); return false;
  }
  return true;
}

// ---- Fetch itinerary from backend ------------------------------------------
async function fetchItinerary(preferences) {
  const res = await fetch("/api/itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
  return data;
}

// ---- Panel switching -------------------------------------------------------
function showPanel(which) {
  formPanel.classList.toggle("hidden",     which !== "form");
  progressPanel.classList.toggle("hidden", which !== "progress");
  resultPanel.classList.toggle("hidden",   which !== "result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =============================================================================
// ITINERARY RENDERING
// =============================================================================

function renderItinerary(data, preferences) {
  renderHeader(data, preferences);
  renderInfoCards(data);
  renderDays(data.days);
  renderExtras(data);
}

function renderHeader(data, preferences) {
  const days = Math.ceil(
    (new Date(preferences.returnDate) - new Date(preferences.departureDate)) / 86400000
  );
  document.getElementById("itinerary-header").innerHTML = `
    <h1>${escapeHtml(data.destination)}</h1>
    <div class="itinerary-meta">
      <span class="meta-badge">📅 ${days} days</span>
      <span class="meta-badge">👥 ${escapeHtml(preferences.travelers)} ${escapeHtml(preferences.groupType || "")}</span>
      <span class="meta-badge">💰 $${preferences.totalBudget} budget</span>
      <span class="meta-badge">✈ ${formatShortDate(preferences.departureDate)} – ${formatShortDate(preferences.returnDate)}</span>
    </div>
    ${data.summary ? `<p class="itinerary-summary">${escapeHtml(data.summary)}</p>` : ""}
    ${data.highlights?.length ? `
      <div class="highlights-list">
        ${data.highlights.map(h => `<span class="highlight-tag">⭐ ${escapeHtml(h)}</span>`).join("")}
      </div>` : ""}
  `;
}

function renderInfoCards(data) {
  const weatherCard = `
    <div class="info-card">
      <div class="info-card-title">🌤 Weather</div>
      <div class="weather-desc">${escapeHtml(data.weather_advisory || "Check local forecasts before traveling.")}</div>
    </div>`;

  let budgetCard = `<div class="info-card"><div class="info-card-title">💵 Budget</div>`;
  if (data.budget_summary) {
    const bs = data.budget_summary;
    const breakdown = bs.breakdown || {};
    const total = bs.estimated_trip_cost || bs.total_budget || 0;
    const daily = bs.daily_average || 0;

    budgetCard += `
      <div class="budget-total">$${total.toLocaleString()}</div>
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:.75rem">est. total · $${daily}/day</div>`;

    if (Object.keys(breakdown).length) {
      const maxVal = Math.max(...Object.values(breakdown).filter(v => typeof v === "number"));
      budgetCard += `<div class="budget-bars">`;
      for (const [label, amount] of Object.entries(breakdown)) {
        if (typeof amount !== "number") continue;
        const pct = maxVal > 0 ? Math.round((amount / maxVal) * 100) : 0;
        budgetCard += `
          <div class="budget-bar-row">
            <span class="budget-bar-label">${capitalize(label)}</span>
            <div class="budget-bar-track"><div class="budget-bar-fill" style="width:${pct}%"></div></div>
            <span class="budget-bar-amount">$${amount}</span>
          </div>`;
      }
      budgetCard += `</div>`;
    }
    if (bs.notes) budgetCard += `<p style="font-size:.8rem;color:var(--text-muted);margin-top:.75rem">${escapeHtml(bs.notes)}</p>`;
  }
  budgetCard += `</div>`;
  document.getElementById("info-cards").innerHTML = weatherCard + budgetCard;
}

function renderDays(days) {
  const container = document.getElementById("days-container");
  if (!days?.length) { container.innerHTML = "<p>No days data available.</p>"; return; }
  container.innerHTML = days.map(renderDayCard).join("");
}

function renderDayCard(day) {
  const slots = [
    { key: "morning",   label: "Morning",   icon: "☀" },
    { key: "afternoon", label: "Afternoon", icon: "⛅" },
    { key: "evening",   label: "Evening",   icon: "🌙" },
  ];
  const slotsHtml = slots.filter(s => day[s.key]).map(s => renderTimeSlot(day[s.key], s.label, s.icon)).join("");
  const tipsHtml = day.daily_tips?.length ? `
    <div class="day-tips">
      <div class="day-tips-title">💡 Today's Tips</div>
      <ul>${day.daily_tips.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    </div>` : "";

  return `
    <div class="day-card">
      <div class="day-header">
        <div>
          <div class="day-title">Day ${day.day} · ${escapeHtml(day.date || "")}</div>
          <div class="day-theme">${escapeHtml(day.theme || "")}</div>
        </div>
        ${day.estimated_daily_cost ? `<span class="day-cost">~$${day.estimated_daily_cost}</span>` : ""}
      </div>
      <div class="day-body">${slotsHtml}${tipsHtml}</div>
    </div>`;
}

function renderTimeSlot(slot, label, icon) {
  if (!slot?.activity) return "";
  return `
    <div class="time-slot">
      <div class="time-label"><span class="time-icon">${icon}</span>${label}</div>
      <div>
        <div class="slot-activity">${escapeHtml(slot.activity)}</div>
        ${slot.location ? `<div class="slot-location">📍 ${escapeHtml(slot.location)}</div>` : ""}
        <div class="slot-meta">
          ${slot.duration ? `<span>⏱ ${escapeHtml(slot.duration)}</span>` : ""}
          ${slot.cost    ? `<span>💰 ${escapeHtml(slot.cost)}</span>`    : ""}
        </div>
        ${slot.notes ? `<div class="slot-notes">${escapeHtml(slot.notes)}</div>` : ""}
      </div>
    </div>`;
}

function renderExtras(data) {
  const container = document.getElementById("extras-container");
  const cards = [];

  if (data.packing_suggestions?.length) {
    cards.push(`
      <div class="extras-card">
        <h3>🎒 Packing List</h3>
        <ul>${data.packing_suggestions.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </div>`);
  }
  if (data.booking_priorities?.length) {
    cards.push(`
      <div class="extras-card">
        <h3>📋 Book in Advance</h3>
        <ul>${data.booking_priorities.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </div>`);
  }
  if (data.local_phrases?.length) {
    const rows = data.local_phrases.map(p => `
      <tr>
        <td class="phrase-text">${escapeHtml(p.phrase)}</td>
        <td class="phrase-pronunciation">${escapeHtml(p.pronunciation || "")}</td>
        <td class="phrase-meaning">${escapeHtml(p.meaning || "")}</td>
      </tr>`).join("");
    cards.push(`
      <div class="extras-card">
        <h3>💬 Useful Phrases</h3>
        <table class="phrases-table">
          <thead><tr><th>Phrase</th><th>Sounds like</th><th>Meaning</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`);
  }
  container.innerHTML = cards.join("");
}

// ---- Error display ---------------------------------------------------------
function showError(message, formEl) {
  formEl.querySelectorAll(".error-message").forEach(el => el.remove());
  const err = document.createElement("div");
  err.className = "error-message";
  err.textContent = message;
  formEl.appendChild(err);
}

// ---- Utilities -------------------------------------------------------------
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }
function formatShortDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
