// =====================================================================
//  STEP 3: Fix — emulator + verified Actions checks (clean two-pane)
// =====================================================================
import { CheckIcon } from "@phosphor-icons/react"
import { Term } from "@/components/Term"
import { Logo } from "@/lib/logo"
import styles from "./fix-mockup.module.css"

export const FixMockup = () => (
  <div className="mockup-chrome" style={{ width: "100%" }}>
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderBottom: "1px solid var(--hairline)",
        background: "var(--surface-elevated)",
      }}
    >
      <Logo name="github" size={14} />
      <span
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--ink)",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        <Term term="pr" /> #1847
      </span>
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
        waiting for review
      </span>
    </div>

    {/* Two panes with a slight diagonal seam between them */}
    <div className={styles["fix-stage"]}>
      {/* Pane 1: Emulator */}
      <div className={styles["fix-pane-1"]}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            alignSelf: "stretch",
          }}
        >
          <Logo name="android" size={11} />
          <span
            className="mono"
            style={{
              fontSize: 9.5,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Pixel 10 · Emulator
          </span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 9.5,
              color: "var(--error)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--error)",
                boxShadow: "0 0 0 3px rgba(225, 95, 107, 0.18)",
              }}
            />
            REC
          </span>
        </div>
        <div
          style={{
            background: "#0a0a0e",
            border: "1px solid #2a2a32",
            borderRadius: 22,
            width: 156,
            height: 300,
            padding: 4,
            position: "relative",
            boxShadow:
              "0 18px 40px -12px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          {/* Screen */}
          <div
            style={{
              position: "absolute",
              inset: 4,
              borderRadius: 20,
              background: "#111116",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Punch-hole camera */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 7,
                left: "50%",
                transform: "translateX(-50%)",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#000",
                border: "1px solid #1a1a20",
                zIndex: 2,
              }}
            />
            {/* Status bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 14px 6px",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 8.5,
                  color: "var(--ink)",
                  letterSpacing: 0.3,
                }}
              >
                9:41
              </span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
                aria-hidden="true"
              >
                <span
                  style={{
                    width: 8,
                    height: 6,
                    background: "var(--ink)",
                    borderRadius: 1,
                  }}
                />
                <span
                  style={{
                    width: 8,
                    height: 6,
                    background: "var(--ink)",
                    borderRadius: 1,
                    opacity: 0.7,
                  }}
                />
                <span
                  style={{
                    width: 12,
                    height: 6,
                    background: "var(--ink)",
                    borderRadius: 1,
                    opacity: 0.85,
                  }}
                />
              </span>
            </div>
            {/* App content */}
            <div
              style={{
                padding: "4px 12px 12px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: "var(--ink)",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                My Recipes
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 7px",
                    background: "rgba(255,255,255,0.03)",
                    border:
                      "var(--translucent-border-width) solid rgba(255,255,255,0.04)",
                    borderRadius: 7,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background:
                        "linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)",
                      opacity: 0.75,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,0.18)",
                        borderRadius: 2,
                        width: i === 2 ? "85%" : "60%",
                      }}
                    />
                    <span
                      style={{
                        height: 3,
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 2,
                        width: "40%",
                      }}
                    />
                  </div>
                </div>
              ))}
              <span style={{ flex: 1 }} />
              {/* Repro banner */}
              <div
                style={{
                  background: "rgba(225, 95, 107, 0.15)",
                  border:
                    "var(--translucent-border-width) solid rgba(225, 95, 107, 0.35)",
                  borderRadius: 6,
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--error)",
                    boxShadow: "0 0 0 3px rgba(225, 95, 107, 0.18)",
                  }}
                />
                <span
                  className="mono"
                  style={{ fontSize: 8, color: "var(--error)" }}
                >
                  reproducing crash…
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pane 2: Actions / verified checks — mirrors the hero check list */}
      <div className={styles["fix-pane-2"]}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <Logo name="githubActions" size={13} />
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            GitHub Actions
          </span>
          <span style={{ flex: 1 }} />
          <span className="pill pill-success">
            <CheckIcon size={9} aria-hidden="true" />
            VERIFIED
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(59, 182, 122, 0.15)",
              border:
                "var(--translucent-border-width) solid rgba(59, 182, 122, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckIcon size={11} color="var(--success)" aria-hidden="true" />
          </span>
          <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
            All checks have passed
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}
          >
            12/12
          </span>
        </div>

        <div
          style={{ marginTop: 16, display: "flex", flexDirection: "column" }}
        >
          {[
            { name: "reproduce-in-emulator", time: "1m 12s" },
            { name: "verify-fix-in-emulator", time: "1m 38s", emphasis: true },
            { name: "replay-user-session", time: "0m 47s" },
            { name: "regression-suite (247)", time: "4m 02s" },
          ].map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop:
                  i > 0
                    ? "1px solid var(--hairline-soft)"
                    : "1px solid var(--hairline-soft)",
              }}
            >
              <Logo name="githubActions" size={13} />
              <span
                className="mono"
                style={{
                  fontSize: 11.5,
                  color: c.emphasis ? "var(--ink)" : "var(--body)",
                }}
              >
                {c.name}
              </span>
              <span style={{ flex: 1 }} />
              <span
                className="mono"
                style={{ fontSize: 10.5, color: "var(--muted)" }}
              >
                {c.time}
              </span>
              <CheckIcon size={11} color="var(--success)" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
