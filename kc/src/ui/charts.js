/**
 * Gráficos da turma (Chart.js — carregado via CDN).
 *
 *   - Gráfico 1: Distribuição por status (donut)
 *   - Gráfico 2: Médias da turma em KC, Lab e Total (barras)
 *
 * Ambos respeitam o tema claro/escuro: as cores dos eixos, gridlines e
 * bordas são recalculadas a cada `renderGraficos()`.
 */

import { byId, setHidden } from "../utils/dom.js";
import { state } from "../state.js";
import { getStatus } from "../core/status.js";
import { isDarkMode } from "./theme.js";

/** Mostra/esconde a seção de gráficos. */
export function toggleGraficos() {
  const container = byId("graficos-container");
  const btn = byId("btnGraficos");
  if (!container || !btn) return;

  if (container.hidden) {
    setHidden(container, false);
    btn.innerText = "📊 Ocultar gráficos";
    renderGraficos();
  } else {
    setHidden(container, true);
    btn.innerText = "📊 Mostrar gráficos";
  }
}

/**
 * Re-renderiza os dois gráficos com os dados atuais.
 * Destrói as instâncias anteriores antes de criar novas (evita leaks).
 */
export function renderGraficos() {
  if (!state.globalData.length || typeof window.Chart === "undefined") return;

  // Agrega métricas em uma única passada.
  let red = 0,
    yellow = 0,
    green = 0,
    graduated = 0;
  let kcSum = 0,
    labSum = 0,
    totalSum = 0,
    count = 0;

  state.globalData.forEach((row) => {
    const s = getStatus(row);
    if (s === "red") red++;
    else if (s === "yellow") yellow++;
    else if (s === "green") green++;
    else if (s === "graduated") graduated++;
    kcSum += parseFloat(row.kc);
    labSum += parseFloat(row.lab);
    totalSum += parseFloat(row.total);
    count++;
  });

  const dark = isDarkMode();
  const textColor = dark ? "#e2e8f0" : "#1f2937";
  const gridColor = dark ? "#334155" : "#e5e7eb";

  renderChartStatus({ red, yellow, green, graduated }, { dark, textColor });
  renderChartMedia(
    {
      kc: count ? (kcSum / count).toFixed(2) : 0,
      lab: count ? (labSum / count).toFixed(2) : 0,
      total: count ? (totalSum / count).toFixed(2) : 0,
    },
    { textColor, gridColor }
  );
}

function renderChartStatus({ red, yellow, green, graduated }, { dark, textColor }) {
  const ctx = byId("grafico-status").getContext("2d");
  if (state.chartStatus) state.chartStatus.destroy();

  state.chartStatus = new window.Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Críticos 🔴", "Atenção 🟡", "OK 🟢", "Graduados 🎓"],
      datasets: [
        {
          data: [red, yellow, green, graduated],
          backgroundColor: ["#dc2626", "#f59e0b", "#16a34a", "#2563eb"],
          borderColor: dark ? "#1e293b" : "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, font: { size: 12 }, padding: 12 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderChartMedia({ kc, lab, total }, { textColor, gridColor }) {
  const ctx = byId("grafico-media").getContext("2d");
  if (state.chartMedia) state.chartMedia.destroy();

  state.chartMedia = new window.Chart(ctx, {
    type: "bar",
    data: {
      labels: ["KCs", "Labs", "Total"],
      datasets: [
        {
          label: "Média da turma (%)",
          data: [kc, lab, total],
          backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: textColor, callback: (v) => v + "%" },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
      },
    },
  });
}
