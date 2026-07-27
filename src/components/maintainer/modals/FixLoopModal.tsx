// =====================================================================
//  Fix Loop Modal — sealed sandbox where two agents review each other
// =====================================================================

import { Term } from "@/components/Term"
import { integrationLogos } from "@/lib/integration-logos"
import { Modal } from "@/lib/modal"
import styles from "./fix-loop-modal.module.css"

type FixLoopModalProps = { open: boolean; onClose: () => void }

export const FixLoopModal = ({ open, onClose }: FixLoopModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal-backdrop"
      panelClassName={`modal-panel ${styles["fl-panel"]}`}
      labelledBy="fl-title"
    >
      <div className={styles["fl-header"]}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          SOFTWARE FACTORY
        </div>
        <h3
          id="fl-title"
          className="t-display-md"
          style={{ margin: 0, marginBottom: 8, lineHeight: 1.15 }}
        >
          All code changes are handled by our agents.
        </h3>
        <p className="t-body-md body" style={{ margin: 0 }}>
          Ube can run and debug your app just like a human would.
        </p>
      </div>

      {/* ───── Sandbox container ───── */}
      <div className={styles["fl-sandbox"]}>
        <div className={styles["fl-sandbox-chrome"]}>
          <span className={`${styles["fl-chrome-tag"]} mono`}>
            <img
              src={integrationLogos.docker.src}
              alt=""
              className={styles["fl-chrome-logo"]}
            />{" "}
            DOCKER SANDBOX
          </span>
          <span className={`${styles["fl-chrome-image"]} mono`}>
            ube/install-analytics-sdk:1.4.2
          </span>
        </div>

        <div className={styles["fl-arena"]} aria-hidden="true">
          {/* Generator */}
          <div className={styles["fl-agent"]}>
            <img
              src={integrationLogos.claudeCode.src}
              alt=""
              className={styles["fl-agent-logo"]}
            />
            <div className={`${styles["fl-agent-role"]} mono`}>GENERATOR</div>
            <div className={styles["fl-agent-name"]}>Claude Code</div>
            <div className={`${styles["fl-agent-act"]} mono`}>
              writes the patch<span className={styles["fl-cursor"]}>▍</span>
            </div>
          </div>

          {/* Duel pipe */}
          <div className={styles["fl-duel"]}>
            <div className={styles["fl-duel-rail"]} />
            <div
              className={`${styles["fl-tok"]} ${styles["fl-tok-patch"]} mono`}
            >
              +patch
            </div>
            <div className={`${styles["fl-tok"]} ${styles["fl-tok-nit"]} mono`}>
              nit ✕
            </div>
          </div>

          {/* Reviewer */}
          <div className={`${styles["fl-agent"]} ${styles["fl-agent-rev"]}`}>
            <img
              src={integrationLogos.codex.src}
              alt=""
              className={styles["fl-agent-logo"]}
            />
            <div className={`${styles["fl-agent-role"]} mono`}>REVIEWER</div>
            <div className={styles["fl-agent-name"]}>Codex</div>
            <div className={`${styles["fl-agent-act"]} mono`}>
              reviews it<span className={styles["fl-cursor"]}>▍</span>
            </div>
          </div>
        </div>

        <div className={`${styles["fl-sandbox-foot"]} mono`}>
          <span>adversarial · agents loop until they agree</span>
        </div>
      </div>

      {/* ───── Curated I/O ───── */}
      <div className={styles["fl-rails"]}>
        <div className={styles["fl-rail"]} style={{ animationDelay: "60ms" }}>
          <div className={styles["fl-rail-head"]}>
            <span className={styles["fl-rail-name"]}>
              <Term term="adb" />
            </span>
          </div>
          <div className={styles["fl-phone"]}>
            <div className={styles["fl-phone-screen"]}>
              <div className={styles["fl-phone-pixels"]} />
              <div className={styles["fl-phone-bug"]} />
            </div>
            <div className={styles["fl-phone-tree"]}>
              <span className="mono">View</span>
              <span className="mono"> ├ Header</span>
              <span className="mono">
                {" "}
                ├ List<i>·tap</i>
              </span>
              <span className="mono"> └ CTA</span>
            </div>
          </div>
          <div className={`${styles["fl-rail-cap"]} mono`}>
            <em>eyes</em> and <em>hands</em>
          </div>
        </div>

        <div className={styles["fl-rail"]} style={{ animationDelay: "180ms" }}>
          <div className={styles["fl-rail-head"]}>
            <span className={styles["fl-rail-name"]}>Mock backend</span>
          </div>
          <div className={styles["fl-mock"]}>
            <svg
              className={styles["fl-mock-db"]}
              viewBox="0 0 64 64"
              width="60"
              height="60"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="flMockFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--accent-soft)"
                    stopOpacity="0.95"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--accent-soft)"
                    stopOpacity="0.55"
                  />
                </linearGradient>
              </defs>
              {/* body fill */}
              <path
                d="M 8 12 A 24 6 0 0 1 56 12 L 56 52 A 24 6 0 0 1 8 52 Z"
                fill="url(#flMockFill)"
              />
              {/* top rim */}
              <ellipse
                cx="32"
                cy="12"
                rx="24"
                ry="6"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.4"
              />
              {/* sides */}
              <line
                x1="8"
                y1="12"
                x2="8"
                y2="52"
                stroke="var(--accent)"
                strokeWidth="1.4"
              />
              <line
                x1="56"
                y1="12"
                x2="56"
                y2="52"
                stroke="var(--accent)"
                strokeWidth="1.4"
              />
              {/* bottom curve (visible front) */}
              <path
                d="M 8 52 A 24 6 0 0 0 56 52"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.4"
              />
              {/* band dividers — only the visible front arc, classic DB look */}
              <path
                className={styles["fl-mock-band"]}
                d="M 8 25.3 A 24 6 0 0 0 56 25.3"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.2"
                opacity="0.7"
              />
              <path
                className={styles["fl-mock-band"]}
                d="M 8 38.7 A 24 6 0 0 0 56 38.7"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.2"
                opacity="0.7"
              />
              {/* write pulse — dot that drops into the top */}
              <circle
                className={styles["fl-mock-write"]}
                cx="32"
                cy="6"
                r="2.2"
                fill="var(--accent)"
              />
            </svg>
            <div className={styles["fl-mock-flow"]}>
              <span className={`${styles["fl-mock-pkt"]} mono`}>
                GET /orders
              </span>
              <span className={`${styles["fl-mock-pkt"]} mono`}>→ 200</span>
            </div>
          </div>
          <div className={`${styles["fl-rail-cap"]} mono`}>
            stand up local DB
          </div>
        </div>

        <div className={styles["fl-rail"]} style={{ animationDelay: "300ms" }}>
          <div className={styles["fl-rail-head"]}>
            <span className={styles["fl-rail-name"]}>OneCLI Agent Vault</span>
          </div>
          <div className={styles["fl-vault"]}>
            <div className={styles["fl-vault-key"]}>
              <span className={`${styles["fl-vault-label"]} mono`}>
                STRIPE_SK
              </span>
              <span className={`${styles["fl-vault-mask"]} mono`}>
                ●●●●●●●●●●●●
              </span>
            </div>
            <div className={styles["fl-vault-key"]}>
              <span className={`${styles["fl-vault-label"]} mono`}>
                OPENAI_KEY
              </span>
              <span className={`${styles["fl-vault-mask"]} mono`}>
                ●●●●●●●●●●●●
              </span>
            </div>
            <div className={styles["fl-vault-shield"]} aria-hidden="true" />
          </div>
          <div className={`${styles["fl-rail-cap"]} mono`}>
            agent cannot see private keys
          </div>
        </div>
      </div>
    </Modal>
  )
}
