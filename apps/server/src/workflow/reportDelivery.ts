import nodemailer from "nodemailer";
import { prisma } from "../services/prisma";
import { logger } from "../services/logger";
import { BIState } from "../graphs/state";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface WorkflowRecord {
  name: string;
  output_config: unknown;
}

interface OutputConfig {
  subject?: string;
}

export async function sendWorkflowReport(
  workflow: WorkflowRecord,
  result: BIState
): Promise<void> {
  // Get all admin users with notify_email = true
  const admins = await prisma.users.findMany({
    where: { role: "admin", notify_email: true, is_active: true },
    select: { email: true, name: true },
  });

  if (!admins.length) {
    logger.warn("No admin users to notify");
    return;
  }

  const outputConfig = (workflow.output_config ?? {}) as OutputConfig;
  const report = result.report;
  if (!report) return;

  const html = buildReportHtml(workflow.name, result);
  const recipients = admins.map((a: any) => a.email).join(", ");

  await transporter.sendMail({
    from: `"BI Platform" <${process.env.SMTP_USER}>`,
    to: recipients,
    subject: outputConfig.subject ?? `[BI Report] ${workflow.name}`,
    html,
  });

  logger.info({ to: recipients, workflow: workflow.name }, "Report email sent");
}

function buildReportHtml(workflowName: string, state: BIState): string {
  const report = state.report!;
  const findings = state.findings;

  return `
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
    <h1 style="color: #1a1a2e;">${workflowName}</h1>
    <p style="color: #666;">Generated: ${new Date().toLocaleString()}</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2>Executive Summary</h2>
      <p>${report.executive_summary}</p>
    </div>

    <div style="margin: 20px 0;">
      <h2>Risk Level: <span style="color: ${riskColor(report.risk_level)}">${report.risk_level.toUpperCase()}</span></h2>
      <p>Confidence Score: ${(report.confidence_score * 100).toFixed(0)}%</p>
    </div>

    <h2>Root Causes</h2>
    <ul>${report.root_causes.map((c) => `<li>${c}</li>`).join("")}</ul>

    <h2>Key Findings</h2>
    <ul>${report.key_findings.map((f) => `<li>${f}</li>`).join("")}</ul>

    <h2>Recommendations</h2>
    <ul>${report.recommendations.map((r) => `<li>${r}</li>`).join("")}</ul>

    <h2>Next Actions</h2>
    <table style="width:100%; border-collapse: collapse;">
      <tr style="background: #1a1a2e; color: white;">
        <th style="padding: 8px;">Action</th>
        <th style="padding: 8px;">Owner</th>
        <th style="padding: 8px;">Priority</th>
        <th style="padding: 8px;">Deadline</th>
      </tr>
      ${report.next_actions
        .map(
          (a) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">${a.action}</td>
          <td style="padding: 8px;">${a.owner}</td>
          <td style="padding: 8px; color: ${riskColor(a.priority)}">${a.priority}</td>
          <td style="padding: 8px;">${a.deadline}</td>
        </tr>`
        )
        .join("")}
    </table>

    ${
      findings?.anomalies?.length
        ? `<h2>Anomalies Detected (${findings.anomalies.length})</h2>
           <ul>${findings.anomalies.map((a) => `<li>${a.description}</li>`).join("")}</ul>`
        : ""
    }
  </div>`;
}

function riskColor(level: string): string {
  return { critical: "#dc2626", high: "#ea580c", medium: "#d97706", low: "#16a34a" }[level] ?? "#666";
}