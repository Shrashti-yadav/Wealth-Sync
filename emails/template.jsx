import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  // ---------------- MONTHLY REPORT ----------------
  if (type === "monthly-report") {
    const totalIncome = Number(data?.stats?.totalIncome ?? 0);
    const totalExpenses = Number(data?.stats?.totalExpenses ?? 0);
    const net = totalIncome - totalExpenses;
    const byCategory = data?.stats?.byCategory ?? {};
    const insights = data?.insights ?? [];

    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report – {data?.month ?? "This Month"}</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>

            {/* Header */}
            <Section style={styles.header}>
              <Text style={styles.headerIcon}>💰</Text>
              <Heading style={styles.headerTitle}>Monthly Financial Report</Heading>
              <Text style={styles.headerSubtitle}>{data?.month ?? "This Month"}</Text>
            </Section>

            {/* Greeting */}
            <Section style={styles.greetingSection}>
              <Text style={styles.greeting}>Hello {userName},</Text>
              <Text style={styles.subText}>
                Here's your financial summary for the month. Here's how you did:
              </Text>
            </Section>

            {/* Stats — stacked rows for clarity */}
            <Section style={styles.statsSection}>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td style={styles.statCell}>
                    <div style={{ ...styles.statBox, borderTop: "3px solid #10b981" }}>
                      <Text style={styles.statLabel}>Total Income</Text>
                      <Text style={{ ...styles.statValue, color: "#10b981" }}>
                        ${totalIncome.toLocaleString()}
                      </Text>
                    </div>
                  </td>
                  <td style={{ width: "10px" }} />
                  <td style={styles.statCell}>
                    <div style={{ ...styles.statBox, borderTop: "3px solid #ef4444" }}>
                      <Text style={styles.statLabel}>Total Expenses</Text>
                      <Text style={{ ...styles.statValue, color: "#ef4444" }}>
                        ${totalExpenses.toLocaleString()}
                      </Text>
                    </div>
                  </td>
                  <td style={{ width: "10px" }} />
                  <td style={styles.statCell}>
                    <div style={{
                      ...styles.statBox,
                      borderTop: `3px solid ${net >= 0 ? "#6366f1" : "#f59e0b"}`,
                    }}>
                      <Text style={styles.statLabel}>Net Savings</Text>
                      <Text style={{
                        ...styles.statValue,
                        color: net >= 0 ? "#6366f1" : "#f59e0b",
                      }}>
                        {net >= 0 ? "+" : ""}${net.toLocaleString()}
                      </Text>
                    </div>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Category Breakdown */}
            {Object.keys(byCategory).length > 0 && (
              <Section style={styles.section}>
                <Heading style={styles.sectionTitle}>📂 Spending by Category</Heading>
                <Hr style={styles.divider} />
                {Object.entries(byCategory).map(([cat, amt], i) => {
                  const pct = totalExpenses > 0
                    ? Math.min(Math.round((Number(amt) / totalExpenses) * 100), 100)
                    : 0;
                  return (
                    <div key={i} style={styles.categoryRow}>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td>
                            <Text style={styles.categoryName}>{cat}</Text>
                          </td>
                          <td align="right">
                            <Text style={styles.categoryAmt}>
                              ${Number(amt).toLocaleString()}
                              <span style={styles.categoryPct}> · {pct}%</span>
                            </Text>
                          </td>
                        </tr>
                      </table>
                      <div style={styles.barTrack}>
                        <div style={{
                          ...styles.barFill,
                          width: `${pct}%`,
                          backgroundColor: categoryColors[i % categoryColors.length],
                        }} />
                      </div>
                    </div>
                  );
                })}
              </Section>
            )}

            {/* AI Insights */}
            {insights.length > 0 && (
              <Section style={styles.section}>
                <Heading style={styles.sectionTitle}>✨ AI-Powered Insights</Heading>
                <Hr style={styles.divider} />
                <div style={styles.insightsBox}>
                  {insights.map((insight, i) => (
                    <div key={i} style={styles.insightItem}>
                      <Text style={styles.insightBullet}>→</Text>
                      <Text style={styles.insightText}>{insight}</Text>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                This report was generated automatically by WealthSync.
              </Text>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} WealthSync · All rights reserved
              </Text>
            </Section>

          </Container>
        </Body>
      </Html>
    );
  }

  // ---------------- BUDGET ALERT ----------------
  if (type === "budget-alert") {
    const budgetAmount = Number(data?.budgetAmount ?? 0);
    const totalExpenses = Number(data?.totalExpenses ?? 0);
    const percentageUsed = Number(data?.percentageUsed ?? 0);
    const remaining = budgetAmount - totalExpenses;

    const alertLevel =
      percentageUsed >= 100
        ? { label: "🔴 Critical", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" }
        : percentageUsed >= 80
        ? { label: "🟠 High",     color: "#f97316", bg: "#fff7ed", border: "#fed7aa" }
        : { label: "🟡 Medium",   color: "#eab308", bg: "#fefce8", border: "#fde68a" };

    const barColor =
      percentageUsed >= 100 ? "#ef4444" : percentageUsed >= 80 ? "#f97316" : "#eab308";

    return (
      <Html>
        <Head />
        <Preview>⚠️ Budget Alert — {percentageUsed.toFixed(1)}% of your budget used</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>

            {/* Header */}
            <Section style={{
              ...styles.header,
              background: "linear-gradient(135deg, #1e293b 0%, #7c3aed 100%)",
            }}>
              <Text style={styles.headerIcon}>🚨</Text>
              <Heading style={styles.headerTitle}>Budget Alert</Heading>
              <Text style={styles.headerSubtitle}>
                You've used {percentageUsed.toFixed(1)}% of your monthly budget
              </Text>
            </Section>

            {/* Greeting */}
            <Section style={styles.greetingSection}>
              <Text style={styles.greeting}>Hello {userName},</Text>
              <Text style={styles.subText}>
                Your spending on <strong>{data?.accountName ?? "your account"}</strong> has
                reached the alert threshold. Here's a quick breakdown:
              </Text>
            </Section>

            {/* Alert Badge */}
            <Section style={{ padding: "0 28px 16px" }}>
              <div style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: alertLevel.bg,
                border: `1px solid ${alertLevel.border}`,
              }}>
                <Text style={{
                  margin: 0,
                  color: alertLevel.color,
                  fontWeight: "700",
                  fontSize: "13px",
                  letterSpacing: "0.3px",
                }}>
                  Alert Level: {alertLevel.label}
                </Text>
              </div>
            </Section>

            {/* Progress Bar */}
            <Section style={{ padding: "0 28px 20px" }}>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td>
                    <Text style={{ ...styles.statLabel, marginBottom: "6px" }}>
                      Budget Usage
                    </Text>
                  </td>
                  <td align="right">
                    <Text style={{
                      ...styles.statLabel,
                      marginBottom: "6px",
                      color: barColor,
                      fontWeight: "700",
                    }}>
                      {percentageUsed.toFixed(1)}%
                    </Text>
                  </td>
                </tr>
              </table>
              <div style={{ ...styles.barTrack, height: "10px" }}>
                <div style={{
                  ...styles.barFill,
                  width: `${Math.min(percentageUsed, 100)}%`,
                  backgroundColor: barColor,
                  height: "10px",
                  borderRadius: "5px",
                }} />
              </div>
            </Section>

            {/* Stats */}
            <Section style={styles.statsSection}>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td style={styles.statCell}>
                    <div style={{ ...styles.statBox, borderTop: "3px solid #6366f1" }}>
                      <Text style={styles.statLabel}>Budget Amount</Text>
                      <Text style={{ ...styles.statValue, color: "#6366f1" }}>
                        ${budgetAmount.toLocaleString()}
                      </Text>
                    </div>
                  </td>
                  <td style={{ width: "10px" }} />
                  <td style={styles.statCell}>
                    <div style={{ ...styles.statBox, borderTop: "3px solid #ef4444" }}>
                      <Text style={styles.statLabel}>Spent So Far</Text>
                      <Text style={{ ...styles.statValue, color: "#ef4444" }}>
                        ${totalExpenses.toLocaleString()}
                      </Text>
                    </div>
                  </td>
                  <td style={{ width: "10px" }} />
                  <td style={styles.statCell}>
                    <div style={{
                      ...styles.statBox,
                      borderTop: `3px solid ${remaining >= 0 ? "#10b981" : "#ef4444"}`,
                    }}>
                      <Text style={styles.statLabel}>Remaining</Text>
                      <Text style={{
                        ...styles.statValue,
                        color: remaining >= 0 ? "#10b981" : "#ef4444",
                      }}>
                        {remaining >= 0 ? "" : "-"}$
                        {Math.abs(remaining).toLocaleString()}
                      </Text>
                    </div>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Tips */}
            <Section style={styles.section}>
              <Heading style={styles.sectionTitle}>💡 Actionable Tips</Heading>
              <Hr style={styles.divider} />
              <div style={styles.insightsBox}>
                {[
                  "Review your discretionary spending for quick wins.",
                  "Consider pausing non-essential subscriptions this month.",
                  "Set a daily spending limit for the rest of the month.",
                ].map((tip, i) => (
                  <div key={i} style={styles.insightItem}>
                    <Text style={styles.insightBullet}>→</Text>
                    <Text style={styles.insightText}>{tip}</Text>
                  </div>
                ))}
              </div>
            </Section>

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                This alert was sent automatically by WealthSync.
              </Text>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} WealthSync · All rights reserved
              </Text>
            </Section>

          </Container>
        </Body>
      </Html>
    );
  }

  return null;
}

/* ─────────────── STYLES ─────────────── */

const categoryColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const styles = {
  body: {
    backgroundColor: "#f1f5f9",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "32px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    maxWidth: "580px",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
  },

  /* Header */
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)",
    padding: "36px 28px",
    textAlign: "center",
  },
  headerIcon: {
    fontSize: "36px",
    margin: "0 0 10px",
    lineHeight: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "22px",          // ← reduced from 28px
    fontWeight: "800",
    margin: "0 0 6px",
    letterSpacing: "-0.3px",
  },
  headerSubtitle: {
    color: "#c7d2fe",
    fontSize: "13px",           // ← reduced from 15px
    margin: 0,
  },

  /* Greeting */
  greetingSection: {
    padding: "24px 28px 8px",
  },
  greeting: {
    color: "#0f172a",
    fontSize: "15px",           // ← reduced from 18px
    fontWeight: "700",
    marginBottom: "4px",
  },
  subText: {
    color: "#64748b",
    fontSize: "13px",           // ← reduced from 15px
    lineHeight: "1.6",
    marginBottom: 0,
  },

  /* Stats */
  statsSection: {
    padding: "16px 28px",
  },
  statCell: {
    verticalAlign: "top",
  },
  statBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "12px 10px",
    textAlign: "center",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "10px",           // ← reduced from 11px
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    margin: "0 0 4px",
  },
  statValue: {
    fontSize: "17px",           // ← KEY FIX: reduced from 22px — this is what you asked for
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.3px",
  },

  /* Section */
  section: {
    padding: "4px 28px 18px",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: "14px",           // ← reduced from 16px
    fontWeight: "700",
    margin: "0 0 10px",
  },
  divider: {
    borderColor: "#e2e8f0",
    margin: "0 0 14px",
  },

  /* Category */
  categoryRow: {
    marginBottom: "12px",
  },
  categoryName: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
  },
  categoryAmt: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    margin: 0,
  },
  categoryPct: {
    color: "#94a3b8",
    fontWeight: "400",
    fontSize: "12px",
  },

  /* Bar */
  barTrack: {
    backgroundColor: "#f1f5f9",
    borderRadius: "4px",
    height: "6px",
    marginTop: "5px",
    overflow: "hidden",
  },
  barFill: {
    height: "6px",
    borderRadius: "4px",
  },

  /* Insights */
  insightsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "14px 16px",
    borderLeft: "3px solid #6366f1",
  },
  insightItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  insightBullet: {
    color: "#6366f1",
    fontWeight: "800",
    fontSize: "13px",
    margin: "0 8px 0 0",
    minWidth: "14px",
    lineHeight: "1.5",
  },
  insightText: {
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: 0,
  },

  /* Footer */
  footer: {
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "16px 28px",
    textAlign: "center",
    marginTop: "8px",
  },
  footerText: {
    color: "#94a3b8",
    fontSize: "11px",
    margin: "0 0 3px",
    lineHeight: "1.5",
  },
};