// =====================================================================
//  Request Access Modal
// =====================================================================

import { useStore } from "@nanostores/react"
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react"
import React, { type SubmitEvent } from "react"
import { BASIN_ENDPOINT, GITHUB_URL, RECAPTCHA_SITE_KEY } from "@/constants"
import { track } from "@/lib/analytics"
import { getAttribution } from "@/lib/attribution"
import { newEventId } from "@/lib/conversions"
import { Modal } from "@/lib/modal"
import {
  requestAccessSource,
  requestAccessVariant,
} from "@/stores/request-access"

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, opts: { action: string }) => Promise<string>
    }
  }
}

// reCAPTCHA v3 was previously a render-blocking <script> in index.html that
// fired on every page view (and loaded Google trackers for every visitor).
// We now inject it the first time the modal opens. Returns a promise that
// resolves once `window.grecaptcha.execute` is callable. Idempotent — repeated
// calls reuse the in-flight or completed load.
let recaptchaPromise: Promise<void> | null = null
const loadRecaptcha = (): Promise<void> => {
  if (recaptchaPromise) return recaptchaPromise
  recaptchaPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    s.async = true
    s.onload = () => window.grecaptcha?.ready(() => resolve())
    s.onerror = () => {
      recaptchaPromise = null
      reject(new Error("reCAPTCHA failed to load"))
    }
    document.head.appendChild(s)
  })
  return recaptchaPromise
}

type RequestAccessModalProps = { open: boolean; onClose: () => void }

type NeedOption = {
  id:
    | "lower_cac"
    | "attribution"
    | "retention_monetization"
    | "ua_funding"
    | "creative_sourcing"
    | "experimentation"
  label: string
  sub: string
}

const NEED_OPTIONS: readonly NeedOption[] = [
  {
    id: "lower_cac",
    label: "Lower customer acquisition cost",
    sub: "Run and optimize ad campaigns, shifting budget toward what performs best.",
  },
  {
    id: "attribution",
    label: "Set up attribution",
    sub: "Find your high-value users and the creatives that bring them.",
  },
  {
    id: "retention_monetization",
    label: "Understand retention & monetization",
    sub: "Track retention, revenue, and funnel performance in one clear dashboard.",
  },
  {
    id: "ua_funding",
    label: "Find user-acquisition funding",
    sub: "Find financing to scale campaigns once the unit economics work.",
  },
  {
    id: "creative_sourcing",
    label: "Keep ad creatives flowing",
    sub: "Source fresh ad creatives and maintain a steady testing pipeline.",
  },
  {
    id: "experimentation",
    label: "Decide what to test next",
    sub: "Use industry benchmarks to recommend and execute A/B tests.",
  },
]

const shuffleNeedOptions = (): NeedOption[] => {
  const options = [...NEED_OPTIONS]
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = options[i]
    const replacement = options[j]
    if (!current || !replacement) continue
    options[i] = replacement
    options[j] = current
  }
  return options
}

export const RequestAccessModal = ({
  open,
  onClose,
}: RequestAccessModalProps) => {
  const [step, setStep] = React.useState("form") // form | submitting | success
  const [email, setEmail] = React.useState("")
  const [projectName, setProjectName] = React.useState("")
  const [stack, setStack] = React.useState("")
  const [stackOther, setStackOther] = React.useState("")
  const [needs, setNeeds] = React.useState<NeedOption["id"][]>([])
  const [needOptions, setNeedOptions] = React.useState<NeedOption[]>([
    ...NEED_OPTIONS,
  ])
  const [teamSize, setTeamSize] = React.useState("")
  const [needsError, setNeedsError] = React.useState(false)
  const [submitError, setSubmitError] = React.useState("")
  // One lead id per form-fill, reused across retries (reset on close, below) so
  // a failed-then-resubmitted lead keeps the same id instead of double-counting.
  const eventIdRef = React.useRef<string | null>(null)
  const variant = useStore(requestAccessVariant)
  const source = useStore(requestAccessSource)
  const isEnterprise = variant === "enterprise"

  // Kick off the reCAPTCHA script the first time the modal opens, so the
  // token is usually ready by the time the user hits submit.
  React.useEffect(() => {
    if (open) loadRecaptcha().catch(() => {})
  }, [open])

  const prevOpenRef = React.useRef(open)
  const shuffledForOpenRef = React.useRef(false)
  React.useEffect(() => {
    if (open && !shuffledForOpenRef.current) {
      setNeedOptions(shuffleNeedOptions())
      shuffledForOpenRef.current = true
    }
    if (!open) {
      shuffledForOpenRef.current = false
    }
    if (prevOpenRef.current && !open && step !== "success") {
      track("request_access_modal_closed", {
        source,
        variant,
        fields_filled: {
          email: Boolean(email),
          project_name: Boolean(projectName),
          stack: Boolean(stack),
          needs: needs.length > 0,
          team_size: Boolean(teamSize),
        },
      })
    }
    if (prevOpenRef.current && !open) {
      requestAccessSource.set(null)
    }
    prevOpenRef.current = open
  }, [open, step, source, variant, email, projectName, stack, needs, teamSize])

  // Reset to form when re-opened after success
  React.useEffect(() => {
    if (open && step === "success") {
      // keep showing success until user closes; that's the brief
    }
    if (!open) {
      // small delay to avoid flash mid-close
      const resetTimer = window.setTimeout(() => {
        setStep("form")
        setEmail("")
        setProjectName("")
        setStack("")
        setStackOther("")
        setNeeds([])
        setTeamSize("")
        setNeedsError(false)
        setSubmitError("")
        eventIdRef.current = null
      }, 280)
      return () => window.clearTimeout(resetTimer)
    }
    return
  }, [open, step])
  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (needs.length === 0) {
      setNeedsError(true)
      return
    }
    setNeedsError(false)
    setSubmitError("")
    // One id per form-fill (held in a ref) and reused across retries, so a
    // failed-then-resubmitted lead keeps the SAME id — shared by the Zaraz
    // `generate_lead` event and the Basin record, and deduped by the ad tools
    // instead of counting two leads.
    if (eventIdRef.current === null) eventIdRef.current = newEventId()
    const eventId = eventIdRef.current
    track("request_access_submitted", {
      email,
      project_name: projectName,
      stack,
      stack_other: stackOther,
      needs,
      needs_order: needOptions.map((option) => option.id),
      team_size: teamSize,
      variant,
      event_id: eventId,
    })
    const formEl = e.currentTarget
    setStep("submitting")
    const fail = (
      reason: "recaptcha_failed" | "http_5xx" | "http_4xx" | "network",
    ) => {
      track("request_access_submit_failed", { source, variant, reason })
      setStep("form")
      setSubmitError(
        "Something went wrong submitting your request. Please try again.",
      )
    }
    let token: string
    try {
      await loadRecaptcha()
      // `loadRecaptcha` resolves only after `grecaptcha.ready` fires, so
      // `window.grecaptcha` is always defined here.
      // biome-ignore lint/style/noNonNullAssertion: see comment above
      token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, {
        action: "submit",
      })
    } catch (_err) {
      fail("recaptcha_failed")
      return
    }
    let response: Response
    try {
      const formData = new FormData(formEl)
      formData.append("event_id", eventId)
      // Attribution (UTMs, ad-click IDs, Meta _fbp/_fbc) appended explicitly at
      // submit time rather than via React-rendered hidden inputs — read fresh
      // from storage so delivery never depends on render/effect timing.
      for (const [key, value] of Object.entries(getAttribution())) {
        formData.append(key, value)
      }
      formData.append("g-recaptcha-response", token)
      formData.append("g-recaptcha-version", "v3")
      response = await fetch(BASIN_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
    } catch (_err) {
      fail("network")
      return
    }
    if (response.status >= 500 && response.status < 600) {
      fail("http_5xx")
      return
    }
    if (response.status >= 400 && response.status < 500) {
      fail("http_4xx")
      return
    }
    if (!response.ok) {
      fail("network")
      return
    }
    setStep("success")
  }
  const stacks = [
    "React Native",
    "Expo",
    "Flutter",
    "iOS (Swift / Obj-C)",
    "Android (Kotlin / Java)",
    "Capacitor / Ionic",
    "Unity",
    "Other",
  ]
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal-backdrop"
      panelClassName="modal-panel request-access-panel"
    >
      {step !== "success" ? (
        <>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            {isEnterprise ? "Talk to sales" : "Request access"}
          </div>
          <h3
            className="t-display-sm ink"
            style={{ margin: 0, marginBottom: 6 }}
          >
            {isEnterprise
              ? "Let's talk about your stack."
              : "Join the first cohort."}
          </h3>
          <p
            className="t-body-sm muted"
            style={{ margin: 0, marginBottom: 24, lineHeight: 1.55 }}
          >
            {isEnterprise
              ? "Tell us a bit about your team. We'll reach out to schedule a call."
              : "Tell us what you're shipping. We'll be in touch as we open access."}
          </p>

          <form onSubmit={onSubmit} action={BASIN_ENDPOINT} method="POST">
            <input type="hidden" name="variant" value={variant} />
            <div className="field">
              <label className="field-label" htmlFor="ra-email">
                {isEnterprise ? "Work email" : "Email"}{" "}
                <span className="req-dot" />
              </label>
              <input
                id="ra-email"
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="ra-project-name">
                Project / app name
              </label>
              <input
                id="ra-project-name"
                type="text"
                name="project_name"
                placeholder="Your app or project"
                className="input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="ra-stack">
                What are you building with? <span className="req-dot" />
              </label>
              <select
                id="ra-stack"
                name="stack"
                className="input"
                required
                value={stack}
                onChange={(e) => setStack(e.target.value)}
              >
                <option value="">Select a stack…</option>
                {stacks.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {stack === "Other" && (
                <input
                  style={{ marginTop: 10 }}
                  className="input"
                  name="stack_other"
                  placeholder="Which stack?"
                  value={stackOther}
                  onChange={(e) => setStackOther(e.target.value)}
                  aria-label="Other stack"
                  required
                />
              )}
            </div>

            <fieldset
              className="field choice-fieldset"
              aria-describedby="ra-needs-hint"
            >
              <legend className="field-label">
                What do you need most? <span className="req-dot" />
              </legend>
              <div
                id="ra-needs-hint"
                className="t-caption muted"
                style={{ marginTop: -2, marginBottom: 10 }}
              >
                Pick as many as you want.
              </div>
              <div
                className="choice-group"
                style={
                  needsError
                    ? {
                        borderRadius: 12,
                        outline: "1px solid #c0392b",
                        outlineOffset: 4,
                      }
                    : undefined
                }
              >
                {needOptions.map((opt) => {
                  const selected = needs.includes(opt.id)
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      className={`choice-item ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => {
                        setNeeds((current) =>
                          current.includes(opt.id)
                            ? current.filter((id) => id !== opt.id)
                            : [...current, opt.id],
                        )
                        setNeedsError(false)
                      }}
                    >
                      <span className="choice-check" aria-hidden="true">
                        {selected && <CheckIcon size={12} weight="bold" />}
                      </span>
                      <div>
                        <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                          {opt.label}
                        </div>
                        {opt.sub && (
                          <div
                            className="t-caption muted"
                            style={{ marginTop: 2 }}
                          >
                            {opt.sub}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {needs.map((need) => (
                <input key={need} type="hidden" name="needs" value={need} />
              ))}
              <input
                type="hidden"
                name="needs_order"
                value={needOptions.map((option) => option.id).join(",")}
              />
              {needsError && (
                <div
                  className="t-caption"
                  style={{ marginTop: 8, color: "#c0392b" }}
                >
                  Please pick at least one.
                </div>
              )}
            </fieldset>

            <div className="field">
              <label className="field-label" htmlFor="ra-team-size">
                Team size
              </label>
              <select
                id="ra-team-size"
                name="team_size"
                className="input"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              >
                <option value="">Select…</option>
                {["Just me", "2–5", "6–20", "21–100", "100+"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {submitError && (
              <div
                className="t-caption"
                role="alert"
                style={{
                  marginTop: 4,
                  marginBottom: 12,
                  color: "var(--error)",
                }}
              >
                {submitError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 8,
              }}
              disabled={step === "submitting"}
            >
              {step === "submitting" ? (
                <span className="spinner" />
              ) : (
                <>
                  {isEnterprise ? "Talk to sales" : "Request access"}{" "}
                  <ArrowRightIcon size={14} aria-hidden="true" />
                </>
              )}
            </button>
            <p
              className="t-caption muted"
              style={{
                marginTop: 22,
                textAlign: "center",
                fontSize: 12,
              }}
            >
              We'll only use this to contact you about Ube access. This site is
              protected by reCAPTCHA.
            </p>
          </form>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--accent-tint)",
              border:
                "var(--translucent-border-width) solid rgba(107, 63, 160, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <CheckIcon size={22} color="var(--accent)" aria-hidden="true" />
          </div>
          <h3
            className="t-display-sm ink"
            style={{ margin: 0, marginBottom: 8 }}
          >
            {isEnterprise
              ? "Thanks! We'll be in touch."
              : "You're on the list."}
          </h3>
          <p
            className="t-body-md body"
            style={{
              margin: 0,
              marginBottom: 24,
              maxWidth: 360,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            We'll be in touch as we open up access. You can follow us on{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              GitHub
            </a>{" "}
            for updates.
          </p>
          <button type="button" onClick={onClose} className="inline-link">
            Close
          </button>
        </div>
      )}
    </Modal>
  )
}
