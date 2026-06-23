const siteData = window.__MACRO_WEEKLY_SITE__;

const state = {
  activeIssueId: null,
  activeFilter: "all",
  activeSummary: "weekly",
  sortMode: "impact",
  activeMobileSection: "dashboard",
  activePortfolioFilter: "all"
};

const filterLabels = {
  all: "全部",
  international: "国际快讯",
  china: "国内快讯",
  official: "官方数据",
  institution: "机构报告"
};

const portfolioFilters = {
  all: "全部",
  reduce: "需降权",
  add: "可增配",
  overseas: "海外",
  consumption: "消费",
  newEnergy: "新能源"
};

function initializeDashboard() {
  if (!siteData || !Array.isArray(siteData.snapshots) || siteData.snapshots.length === 0) {
    document.body.innerHTML = "<p style='padding:24px;font-family:sans-serif;'>站点数据未生成，请先运行 scripts/publish-weekly.ps1。</p>";
    return;
  }

  state.activeIssueId = siteData.meta.currentIssue || siteData.snapshots[0].issueId;

  document.getElementById("siteTitle").textContent = siteData.meta.siteTitle;
  document.getElementById("siteTagline").textContent = siteData.meta.tagline;
  document.getElementById("siteCadence").textContent = siteData.meta.cadence;
  document.getElementById("lastUpdated").textContent = `站点生成 ${siteData.meta.generatedAt}`;
  document.getElementById("allocationNote").textContent = siteData.meta.allocationDisclaimer;
  document.getElementById("disclaimerText").textContent = siteData.meta.disclaimer;

  renderMethodology();
  renderWorkflow();
  renderSummaryTabs();
  renderFilters();
  renderMobileNav();
  renderPortfolioFilters();
  renderAll();

  document.getElementById("sortButton").addEventListener("click", toggleSortMode);
}

function renderAll() {
  const snapshot = getActiveSnapshot();
  document.getElementById("currentIssueMeta").textContent = `${snapshot.issueLabel} / ${snapshot.period}`;
  renderIssuePicker();
  renderHero(snapshot);
  renderMetrics(snapshot);
  renderPulse(snapshot);
  renderFeed(snapshot);
  renderWatchList(snapshot);
  renderCalendar(snapshot);
  renderSummary(snapshot);
  renderAllocations(snapshot);
  renderPortfolio(snapshot);
  renderMobileDashboard(snapshot);
  renderSources(snapshot);
  renderArchive(snapshot.issueId);
  applyMobileSection();
}

function getActiveSnapshot() {
  return siteData.snapshots.find((snapshot) => snapshot.issueId === state.activeIssueId) || siteData.snapshots[0];
}

function renderIssuePicker() {
  const picker = document.getElementById("issuePicker");
  picker.innerHTML = "";

  siteData.snapshots.forEach((snapshot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `issue-button ${snapshot.issueId === state.activeIssueId ? "active" : ""}`;
    button.textContent = snapshot.issueLabel;
    button.addEventListener("click", () => {
      state.activeIssueId = snapshot.issueId;
      renderAll();
    });
    picker.appendChild(button);
  });
}

function renderHero(snapshot) {
  document.getElementById("heroTitle").textContent = snapshot.title;
  document.getElementById("heroSummary").textContent = snapshot.summary;
  document.getElementById("heroPublishedAt").textContent = snapshot.publishedAt;
  document.getElementById("heroPeriod").textContent = snapshot.period;
  document.getElementById("heroNextUpdate").textContent = snapshot.nextUpdate;
  document.getElementById("heroQuestion").textContent = snapshot.keyQuestion;

  const tagContainer = document.getElementById("heroTags");
  tagContainer.innerHTML = snapshot.heroTags.map((tag) => `<span class="hero-tag">${tag}</span>`).join("");
}

function renderMetrics(snapshot) {
  const container = document.getElementById("metricGrid");
  container.innerHTML = snapshot.metrics.map((metric) => `
    <article class="metric-card">
      <p>${metric.label}</p>
      <strong>${metric.value}</strong>
      <span class="metric-note">${metric.note}</span>
    </article>
  `).join("");
}

function renderPulse(snapshot) {
  const pulseGrid = document.getElementById("pulseGrid");
  pulseGrid.innerHTML = snapshot.pulse.map((item) => `
    <article class="pulse-card">
      <p>${item.label}</p>
      <div class="pulse-score-row">
        <span class="pulse-score">${item.score}</span>
        <span class="pulse-trend">${item.trend}</span>
      </div>
      <div class="score-bar">
        <div class="score-fill" style="width:${item.score}%"></div>
      </div>
      <p>${item.description}</p>
    </article>
  `).join("");
}

function renderFilters() {
  const container = document.getElementById("feedFilters");
  container.innerHTML = "";

  Object.entries(filterLabels).forEach(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip-button ${state.activeFilter === key ? "active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.activeFilter = key;
      renderFilters();
      renderFeed(getActiveSnapshot());
    });
    container.appendChild(button);
  });
}

function renderFeed(snapshot) {
  const feedList = document.getElementById("feedList");
  let items = [...snapshot.feed];

  if (state.activeFilter !== "all") {
    items = items.filter((item) => item.lane === state.activeFilter);
  }

  items.sort((left, right) => {
    if (state.sortMode === "impact") {
      return right.impact - left.impact;
    }
    return left.id - right.id;
  });

  if (items.length === 0) {
    feedList.innerHTML = "<div class='empty-state'>当前筛选条件下没有信号条目。</div>";
    return;
  }

  feedList.innerHTML = items.map((item) => `
    <article>
      <div class="feed-card-top">
        <div class="feed-source">
          <span class="badge ${item.level}">${levelLabel(item.level)}</span>
          <h3>${item.source}</h3>
        </div>
        <span class="source-meta">${item.freshness}</span>
      </div>
      <h4 class="feed-title">${item.title}</h4>
      <p class="feed-desc">${item.description}</p>
      <div class="feed-tags">
        ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
      ${renderFeedAdvice(item)}
      <div class="feed-card-bottom">
        <span class="source-meta">通道：${filterLabels[item.lane]}</span>
        <span class="impact">影响力 ${item.impact}/100</span>
      </div>
    </article>
  `).join("");
}

function renderWatchList(snapshot) {
  document.getElementById("watchList").innerHTML = snapshot.watchList.map((item) => `<li>${item}</li>`).join("");
}

function renderCalendar(snapshot) {
  const container = document.getElementById("calendarList");
  container.innerHTML = snapshot.officialCalendar.map((item) => `
    <div class="calendar-item">
      <span>${item.due}</span>
      <strong>${item.label}</strong>
      <p>${item.meaning}</p>
    </div>
  `).join("");
}

function renderSummaryTabs() {
  const summaryTabs = document.getElementById("summaryTabs");
  const summaryLabels = {
    daily: "日内框架",
    weekly: "周报",
    monthly: "月报",
    yearly: "年报"
  };

  summaryTabs.innerHTML = "";
  Object.entries(summaryLabels).forEach(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `summary-tab ${state.activeSummary === key ? "active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.activeSummary = key;
      renderSummaryTabs();
      renderSummary(getActiveSnapshot());
    });
    summaryTabs.appendChild(button);
  });
}

function renderSummary(snapshot) {
  const current = snapshot.summaries[state.activeSummary];
  document.getElementById("summaryLabel").textContent = current.label;
  document.getElementById("summaryTitle").textContent = current.title;
  document.getElementById("summaryTone").textContent = current.tone;
  document.getElementById("summaryNarrative").textContent = current.narrative;
  document.getElementById("summaryRecommendations").innerHTML = renderSummaryRecommendations(current.recommendations);
  document.getElementById("summaryBullets").innerHTML = current.bullets.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("summaryRisks").innerHTML = current.risks.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("followUps").innerHTML = current.followUps.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("scoreBoard").innerHTML = current.scores.map(([label, value]) => `
    <div class="score-row">
      <div class="score-row-top">
        <span>${label}</span>
        <span>${value}</span>
      </div>
      <div class="score-bar">
        <div class="score-fill" style="width:${value}%"></div>
      </div>
    </div>
  `).join("");
}

function renderAllocations(snapshot) {
  const grid = document.getElementById("allocationGrid");
  grid.innerHTML = snapshot.allocations.map((item) => `
    <article class="allocation-card">
      <div class="allocation-card-top">
        <div>
          <h3>${item.title}</h3>
          <p class="allocation-meta">${item.meta}</p>
        </div>
        <span class="stance-pill ${item.className}">${item.stance}</span>
      </div>
      <p>${item.description}</p>
      <ul>
        ${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function renderPortfolio(snapshot) {
  const stats = document.getElementById("portfolioStats");
  const grid = document.getElementById("portfolioGrid");
  const note = document.getElementById("portfolioNote");

  if (!snapshot.myPortfolio || !Array.isArray(snapshot.myPortfolio.holdings)) {
    note.textContent = "当前周刊还没有录入个人基金组合。后续把持仓写入 myPortfolio 后，这里会自动生成调仓建议。";
    stats.innerHTML = "";
    grid.innerHTML = "";
    return;
  }

  const portfolio = snapshot.myPortfolio;
  note.textContent = portfolio.note || "以下是基于本周宏观信号、行业趋势和截图持仓估算生成的方向建议，不等同于保证收益。";

  stats.innerHTML = (portfolio.stats || []).map((item) => `
    <article class="portfolio-stat-card">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.note}</p>
    </article>
  `).join("");

  const holdings = portfolio.holdings.filter((item) => matchesPortfolioFilter(item, state.activePortfolioFilter));

  if (holdings.length === 0) {
    grid.innerHTML = "<div class='empty-state'>当前筛选条件下没有持仓。</div>";
    return;
  }

  grid.innerHTML = holdings.map((item) => `
    <article class="portfolio-card">
      <div class="portfolio-card-head">
        <div>
          <p class="portfolio-theme">${item.theme}</p>
          <h3>${item.name}</h3>
        </div>
        <span class="stance-pill ${item.className}">${item.action}</span>
      </div>
      <div class="holding-metrics">
        <div>
          <span>持有金额</span>
          <strong>${formatCurrency(item.amount)}</strong>
        </div>
        <div>
          <span>组合权重</span>
          <strong>${formatPercent(item.weight)}</strong>
        </div>
        <div>
          <span>持有收益率</span>
          <strong class="${item.currentReturn >= 0 ? "return-up" : "return-down"}">${formatSignedPercent(item.currentReturn)}</strong>
        </div>
      </div>
      <p class="portfolio-reason"><strong>原因：</strong>${item.reason}</p>
      <p class="portfolio-plan"><strong>调整：</strong>${item.adjustment}</p>
      <div class="scenario-grid">
        <div>
          <span>保守情景</span>
          <strong>${item.scenarios.conservative}</strong>
        </div>
        <div>
          <span>中性情景</span>
          <strong>${item.scenarios.base}</strong>
        </div>
        <div>
          <span>乐观情景</span>
          <strong>${item.scenarios.bull}</strong>
        </div>
      </div>
      <p class="portfolio-risk"><strong>风险：</strong>${item.risk}</p>
    </article>
  `).join("");
}

function renderMobileNav() {
  Array.from(document.querySelectorAll(".mobile-nav-button, .mobile-icon-card")).forEach((button) => {
    button.classList.toggle("active", button.dataset.target === state.activeMobileSection);
    button.addEventListener("click", () => {
      state.activeMobileSection = button.dataset.target;
      applyMobileSection();
      renderMobileNav();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderMobileDashboard(snapshot) {
  const title = document.getElementById("mobileDashboardTitle");
  const summary = document.getElementById("mobileDashboardSummary");
  const stats = document.getElementById("mobileDashboardStats");
  if (!title || !summary || !stats) {
    return;
  }

  title.textContent = snapshot.title;
  summary.textContent = snapshot.summary;
  stats.innerHTML = [
    ["组合收益", snapshot.myPortfolio?.stats?.[2]?.value || "--"],
    ["本周风格", snapshot.tone],
    ["基金动作", snapshot.metrics?.[3]?.value || "--"],
    ["更新时间", snapshot.publishedAt]
  ].map(([label, value]) => `
    <div class="mobile-stat-pill">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function applyMobileSection() {
  Array.from(document.querySelectorAll("[data-mobile-section]")).forEach((section) => {
    section.classList.toggle("mobile-section-active", section.dataset.mobileSection === state.activeMobileSection);
  });
}

function renderPortfolioFilters() {
  const container = document.getElementById("portfolioFilters");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  Object.entries(portfolioFilters).forEach(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip-button ${state.activePortfolioFilter === key ? "active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.activePortfolioFilter = key;
      renderPortfolioFilters();
      renderPortfolio(getActiveSnapshot());
    });
    container.appendChild(button);
  });
}

function matchesPortfolioFilter(item, filter) {
  const text = `${item.name} ${item.theme} ${item.action} ${item.reason}`.toLowerCase();
  if (filter === "all") return true;
  if (filter === "reduce") return /降权|减仓|不加仓|观察|低配/.test(text);
  if (filter === "add") return /增配|新增|提高|对冲/.test(text);
  if (filter === "overseas") return /qdii|纳斯达克|日本|港股|海外|全球/.test(text);
  if (filter === "consumption") return /消费|养老|内需|必选/.test(text);
  if (filter === "newEnergy") return /新能源|储能|电池|光伏|锂电|材料/.test(text);
  return true;
}

function renderSources(snapshot) {
  const grid = document.getElementById("sourceGrid");
  grid.innerHTML = snapshot.sources.map((source) => `
    <article class="source-card">
      <div class="source-card-top">
        <div>
          <p class="eyebrow">${source.category}</p>
          <h3>${source.title}</h3>
        </div>
        <span class="source-meta">${source.cadence}</span>
      </div>
      <p>${source.description}</p>
      <div class="source-access">${source.access}</div>
    </article>
  `).join("");
}

function renderArchive(activeIssueId) {
  const archiveSnapshots = siteData.snapshots.filter((snapshot) => snapshot.issueId !== activeIssueId);
  const grid = document.getElementById("archiveGrid");

  if (archiveSnapshots.length === 0) {
    grid.innerHTML = "<div class='empty-state'>目前只有一期周刊，后续每周发布后会自动积累到这里。</div>";
    return;
  }

  grid.innerHTML = archiveSnapshots.map((snapshot) => `
    <article class="archive-card">
      <div class="archive-card-top">
        <div>
          <p class="eyebrow">${snapshot.issueLabel}</p>
          <h3>${snapshot.title}</h3>
        </div>
        <span class="archive-meta">${snapshot.publishedAt}</span>
      </div>
      <p>${snapshot.summary}</p>
      <div class="archive-actions">
        <button class="archive-button" type="button" data-issue="${snapshot.issueId}">查看本期</button>
      </div>
    </article>
  `).join("");

  Array.from(document.querySelectorAll(".archive-button")).forEach((button) => {
    button.addEventListener("click", () => {
      state.activeIssueId = button.getAttribute("data-issue");
      renderAll();
    });
  });
}

function renderMethodology() {
  document.getElementById("methodologyList").innerHTML = siteData.meta.methodology.map((item) => `<li>${item}</li>`).join("");
}

function renderWorkflow() {
  document.getElementById("workflowList").innerHTML = siteData.meta.workflow.map((item) => `<li>${item}</li>`).join("");
}

function renderFeedAdvice(item) {
  const suggestion = item.suggestion || "等待更高质量验证后再扩大仓位。";
  const verification = Array.isArray(item.verification) && item.verification.length > 0
    ? item.verification
    : ["补充该信号对应的验证数据、发布时间和资产映射。"];
  const invalidation = item.invalidation || "若后续官方数据与快讯方向不一致，则撤回该判断。";

  return `
    <div class="feed-advice-grid">
      <div class="advice-block">
        <span class="advice-label">动作建议</span>
        <p>${suggestion}</p>
      </div>
      <div class="advice-block">
        <span class="advice-label">验证要点</span>
        <ul class="advice-list">
          ${verification.map((point) => `<li>${point}</li>`).join("")}
        </ul>
      </div>
      <div class="advice-block">
        <span class="advice-label">撤回条件</span>
        <p>${invalidation}</p>
      </div>
    </div>
  `;
}

function renderSummaryRecommendations(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return "<div class='empty-state'>当前周期还没有补充关键建议，请在周刊数据里加入 recommendations。</div>";
  }

  return recommendations.map((item) => `
    <article class="recommendation-card">
      <span>${item.type || "关键建议"}</span>
      <h4>${item.title}</h4>
      <p class="recommendation-line"><strong>动作：</strong>${item.action}</p>
      <p class="recommendation-line"><strong>触发：</strong>${item.trigger}</p>
      <p class="recommendation-line"><strong>失效：</strong>${item.invalidation}</p>
    </article>
  `).join("");
}

function toggleSortMode() {
  state.sortMode = state.sortMode === "impact" ? "timeline" : "impact";
  document.getElementById("sortButton").textContent = state.sortMode === "impact" ? "按影响力排序" : "按发布时间排序";
  renderFeed(getActiveSnapshot());
}

function levelLabel(level) {
  if (level === "live") {
    return "一级快讯";
  }
  if (level === "official") {
    return "官方验证";
  }
  return "机构报告";
}

function formatCurrency(value) {
  return Number(value).toLocaleString("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 });
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function formatSignedPercent(value) {
  const number = Number(value);
  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

initializeDashboard();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The site still works without offline caching, so fail silently.
    });
  });
}
