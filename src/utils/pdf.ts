import { AccountConfig, CalculationResults } from '../types';
import { formatCurrency, formatNumber, formatPct } from './calculations';

export async function exportToPDF(
  config: AccountConfig,
  results: CalculationResults
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const MARGIN = 20;
  const COL_W = (PAGE_W - MARGIN * 2) / 2;
  let y = 20;

  // ── Header ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_W, 36, 'F');

  doc.setTextColor(99, 102, 241);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PropFirm Risk Calculator', MARGIN, 14);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account: ${config.name}`, MARGIN, 22);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, MARGIN, 28);
  y = 46;

  // ── Account Configuration ────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Account Configuration', MARGIN, y);
  y += 6;

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const modeLabel = config.mode === 'custom'
    ? `Custom ($${config.customRiskPerTrade.toFixed(0)}/trade)`
    : config.mode.charAt(0).toUpperCase() + config.mode.slice(1);

  const configRows = [
    ['Account Balance', formatCurrency(config.accountBalance), 'Risk Mode', modeLabel],
    ['Daily Drawdown', formatPct(config.dailyDrawdownPct), 'Max Drawdown', formatPct(config.maxDrawdownPct)],
    ['Profit Target', formatPct(config.profitTargetPct), 'Consistency Rule', formatPct(config.consistencyRulePct)],
    ['Win Rate', formatPct(config.winRate), 'Risk:Reward', `1:${config.riskRewardRatio}`],
    ['Trades/Day', String(config.tradesPerDay), '', ''],
  ];

  for (const [k1, v1, k2, v2] of configRows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k1}:`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v1, MARGIN + 35, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${k2}:`, MARGIN + COL_W, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v2, MARGIN + COL_W + 35, y);
    y += 7;
  }
  y += 4;

  // ── Key Metrics ──────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Calculated Risk Metrics', MARGIN, y);
  y += 6;
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  const metricRows: [string, string, string, string][] = [
    ['Daily Drawdown ($)', formatCurrency(results.dailyDD), 'Max Drawdown ($)', formatCurrency(results.maxDD)],
    ['Profit Target ($)', formatCurrency(results.profitTarget), 'Max Daily Profit', formatCurrency(results.maxDailyProfit)],
    ['Base Risk/Trade', formatCurrency(results.baseRisk), 'Adjusted Risk/Trade', formatCurrency(results.safeRiskPerTrade)],
    ['Reward/Trade', formatCurrency(results.rewardPerTrade), 'Risk % of Account', formatPct(results.riskPct)],
    ['Expectancy', formatCurrency(results.expectancy), 'Risk of Ruin', formatPct(results.riskOfRuin)],
    ['Est. Trades to Target', formatNumber(results.estimatedTradesToTarget), 'Est. Days to Target', formatNumber(results.estimatedDaysToTarget)],
  ];

  doc.setFontSize(9);
  for (const [k1, v1, k2, v2] of metricRows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(`${k1}:`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v1, MARGIN + 40, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${k2}:`, MARGIN + COL_W, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v2, MARGIN + COL_W + 40, y);
    y += 7;
  }
  y += 4;

  // ── Warnings ──────────────────────────────────────────────────────────
  if (results.warnings.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Risk Warnings', MARGIN, y);
    y += 6;
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;

    doc.setFontSize(9);
    for (const w of results.warnings) {
      const color = w.type === 'danger' ? [239, 68, 68] : w.type === 'warning' ? [245, 158, 11] : [99, 102, 241];
      doc.setTextColor(...(color as [number, number, number]));
      doc.setFont('helvetica', 'bold');
      const label = w.type === 'danger' ? '⚠ DANGER' : w.type === 'warning' ? '⚠ WARNING' : 'ℹ INFO';
      doc.text(label, MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(w.message, PAGE_W - MARGIN * 2 - 20);
      doc.text(lines, MARGIN + 20, y);
      y += 6 * lines.length + 2;
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Generated by PropFirm Risk Calculator — For educational purposes only. Not financial advice.',
    MARGIN,
    285
  );

  doc.save(`risk-analysis-${config.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
