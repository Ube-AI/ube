// =====================================================================
//  STEP 5: Report (failure) — internal issue + upstream link
// =====================================================================
import { LinkIcon } from "@phosphor-icons/react"
import { Logo } from "@/lib/logo"

// Mimics a GitHub "Open" state dot + label
const GhOpenBadge = ({
  color = "var(--warning)",
  label = "Open",
}: {
  color?: string
  label?: string
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 9px 2px 8px",
      borderRadius: 9999,
      background: `color-mix(in oklab, ${color} 14%, transparent)`,
      border: `var(--translucent-border-width) solid color-mix(in oklab, ${color} 35%, transparent)`,
      color: color,
      fontSize: 10.5,
      fontWeight: 600,
      fontFamily: "var(--font-mono)",
      letterSpacing: 0.2,
    }}
  >
    <span
      style={{ width: 6, height: 6, borderRadius: "50%", background: color }}
    />
    {label}
  </span>
)

export const ReportFailureMockup = () => (
  <div className="mockup-chrome" style={{ width: "100%" }}>
    {/* Header — GitHub-like repo + issue number */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 16px",
        borderBottom: "1px solid var(--hairline)",
        background: "var(--surface-elevated)",
      }}
    >
      <Logo name="github" size={14} />
      <span className="mono" style={{ fontSize: 11.5, color: "var(--ink)" }}>
        chunkytofu/cookcam
      </span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
        #312
      </span>
      <span style={{ flex: 1 }} />
      <GhOpenBadge color="var(--warning)" label="Blocked" />
    </div>

    <div style={{ padding: "22px 26px" }}>
      {/* Issue title */}
      <div
        className="t-title-sm ink"
        style={{ margin: 0, marginBottom: 6, lineHeight: 1.35 }}
      >
        Race in{" "}
        <span className="mono" style={{ color: "var(--accent)" }}>
          expo-av
        </span>{" "}
        session unmount
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
        opened by <span style={{ color: "var(--body)" }}>ube[bot]</span> · 3
        days ago
      </div>

      {/* Body preview — wireframe placeholder bars hinting at repro steps */}
      <div
        style={{
          marginTop: 16,
          padding: "14px 14px",
          background: "var(--canvas-soft)",
          border: "1px solid var(--hairline)",
          borderRadius: 8,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 9.5,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.7,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Reproduction steps
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              height: 6,
              width: "88%",
              borderRadius: 3,
              background: "var(--hairline-strong)",
            }}
          />
          <div
            style={{
              height: 6,
              width: "72%",
              borderRadius: 3,
              background: "var(--hairline-strong)",
            }}
          />
          <div
            style={{
              height: 6,
              width: "94%",
              borderRadius: 3,
              background: "var(--hairline-strong)",
            }}
          />
          <div
            style={{
              height: 6,
              width: "46%",
              borderRadius: 3,
              background: "var(--hairline-strong)",
            }}
          />
        </div>
      </div>

      {/* Linked-issue section */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <LinkIcon size={12} aria-hidden="true" />
          <span
            className="mono"
            style={{
              fontSize: 9.5,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontWeight: 600,
            }}
          >
            Blocked by
          </span>
        </div>

        {/* Nested upstream issue card (decorative — non-interactive in mockup) */}
        <div
          className="rf-link-card"
          style={{
            display: "block",
            background: "var(--canvas-soft)",
            border: "1px solid var(--hairline)",
            borderLeft: "3px solid var(--accent)",
            borderRadius: 8,
            padding: "12px 14px",
            transition: "background .15s ease, border-color .15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo name="expo" size={13} />
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--ink)" }}
            >
              expo/expo
            </span>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--muted)" }}
            >
              #29104
            </span>
            <span style={{ flex: 1 }} />
            <GhOpenBadge color="var(--muted)" label="Open" />
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12.5,
              color: "var(--ink)",
              lineHeight: 1.45,
            }}
          >
            Race in{" "}
            <span className="mono" style={{ color: "var(--accent)" }}>
              expo-av
            </span>{" "}
            when backgrounded mid-record
          </div>
          <div
            className="mono"
            style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}
          >
            filed by ube[bot] · 3 days ago · awaiting response
          </div>
        </div>
      </div>
    </div>

    {/* `dangerouslySetInnerHTML` avoids React encoding `>` selectors and
        triggering an SSR/CSR hydration mismatch. */}
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: see comment above
      dangerouslySetInnerHTML={{
        __html: `
      .rf-link-card:hover {
        background: var(--canvas) !important;
        border-color: var(--hairline-strong) !important;
      }
    `,
      }}
    />
  </div>
)
