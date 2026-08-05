import { CheckIcon } from "@phosphor-icons/react"
import React from "react"
import { track } from "@/lib/analytics"
import { openRequestAccess } from "@/stores/request-access"
import styles from "./plans.module.css"

type BillingPeriod = "monthly" | "yearly"

type Plan = {
  name: string
  monthlyPrice?: number
  yearlyMonthlyPrice?: number
  yearlySavings?: string
  unit?: string
  priceLabel?: string
  caption?: string
  includesLabel: string
  bullets: string[]
  footnote?: string
  buttonLabel: string
  buttonStyle: "primary" | "secondary"
  onClick: () => void
}

// Every tier sells Ube — the growth-and-distribution flagship — and only
// Ube (ADR 0006). Ube Maintainer is not sold from a pricing tier, so no
// bullet here may mention maintenance, pull requests, or crash triage.
//
// The load-bearing difference between Solo and Team is the managed
// ad-spend ceiling, NOT an app allowance: neither tier caps how many apps a
// customer brings. Don't write copy that implies a metered app count.
const FOOTNOTE =
  "Ad spend and optional creative-AI fees billed directly by those platforms."

const buildPlans = (billingPeriod: BillingPeriod): Plan[] => [
  {
    name: "Solo",
    monthlyPrice: 200,
    yearlyMonthlyPrice: 160,
    yearlySavings: "Save $480/yr",
    unit: "/app/mo",
    includesLabel: "Includes:",
    bullets: [
      "Managed ad spend up to $1k/mo",
      "Full analytics + attribution stack setup",
      "Amplitude / Firebase dashboards built and tuned",
      "Creative direction (image, video, playable)",
      "Ad campaign setup across Meta, Google, TikTok",
      "Weekly campaign refresh",
      "A/B test recommendations and deployment",
      "Scholarship access (Amplitude, AppsFlyer)",
    ],
    footnote: FOOTNOTE,
    buttonLabel: "Join waitlist",
    buttonStyle: "secondary",
    onClick: () =>
      openRequestAccess("pricing_solo", "default", {
        billing_period: billingPeriod,
      }),
  },
  {
    name: "Team",
    monthlyPrice: 500,
    yearlyMonthlyPrice: 400,
    yearlySavings: "Save $1,200/yr",
    unit: "/app/mo",
    includesLabel: "Everything in Solo, plus:",
    bullets: [
      "Managed ad spend up to $15k/mo",
      "Team access with unlimited seats",
      "Multiple campaign refreshes per week",
      "Portfolio view — cross-app analytics, shared audiences, portfolio-level attribution",
      "Dedicated support",
    ],
    footnote: FOOTNOTE,
    buttonLabel: "Join waitlist",
    buttonStyle: "primary",
    onClick: () =>
      openRequestAccess("pricing_team", "default", {
        billing_period: billingPeriod,
      }),
  },
  {
    name: "Enterprise",
    priceLabel: "Custom",
    includesLabel: "Everything in Team, plus:",
    bullets: [
      "Dedicated account manager + SLA",
      "SSO (SAML / OIDC)",
      "Audit logs",
      "BAA + DPA",
      "Self-hosted / VPC deployment",
      "Custom integrations",
    ],
    buttonLabel: "Contact sales",
    buttonStyle: "secondary",
    onClick: () =>
      openRequestAccess("pricing_enterprise", "enterprise", {
        billing_period: billingPeriod,
      }),
  },
]

const PlanPrice = ({
  plan,
  billingPeriod,
}: {
  plan: Plan
  billingPeriod: BillingPeriod
}) => {
  if (plan.priceLabel) {
    return (
      <div className={styles["price-block"]}>
        <div className={styles["price-row"]}>
          <span className={styles["price-custom"]}>{plan.priceLabel}</span>
        </div>
        <div
          className={`${styles["savings-note"]} ${styles["savings-note-placeholder"]}`}
          aria-hidden="true"
        >
          &nbsp;
        </div>
      </div>
    )
  }

  const activePrice =
    billingPeriod === "yearly"
      ? (plan.yearlyMonthlyPrice ?? plan.monthlyPrice)
      : plan.monthlyPrice
  const hasVisibleSavings =
    billingPeriod === "yearly" && Boolean(plan.yearlySavings)

  return (
    <div className={styles["price-block"]}>
      <div className={styles["price-row"]}>
        {billingPeriod === "yearly" && plan.monthlyPrice && (
          <span className={styles["price-original"]}>${plan.monthlyPrice}</span>
        )}
        <span
          className={styles["price-value"]}
          key={`${plan.name}-${billingPeriod}`}
        >
          ${activePrice}
        </span>
        {plan.unit && <span className={styles["price-unit"]}>{plan.unit}</span>}
      </div>
      <div
        className={`${styles["savings-note"]} ${
          hasVisibleSavings ? "" : styles["savings-note-placeholder"]
        }`}
        aria-hidden={!hasVisibleSavings}
      >
        {hasVisibleSavings ? plan.yearlySavings : "\u00a0"}
      </div>
    </div>
  )
}

export const Plans = () => {
  const [billingPeriod, setBillingPeriod] =
    React.useState<BillingPeriod>("monthly")
  const plans = React.useMemo(() => buildPlans(billingPeriod), [billingPeriod])

  const monthlyRef = React.useRef<HTMLButtonElement>(null)
  const yearlyRef = React.useRef<HTMLButtonElement>(null)
  const [thumb, setThumb] = React.useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  React.useLayoutEffect(() => {
    const el =
      billingPeriod === "monthly" ? monthlyRef.current : yearlyRef.current
    if (!el) return
    const measure = () =>
      setThumb({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      })
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [billingPeriod])

  const setPeriod = (period: BillingPeriod) => {
    setBillingPeriod(period)
    track("pricing_billing_period_changed", { period })
  }

  return (
    <section className={styles["plans-section"]} aria-label="Pricing plans">
      <div className="container">
        <fieldset className={styles["billing-toggle"]}>
          <legend className={styles["billing-legend"]}>Billing period</legend>
          {thumb && (
            <span
              className={styles["billing-thumb"]}
              aria-hidden="true"
              style={{
                transform: `translateX(${thumb.left}px)`,
                top: thumb.top,
                width: thumb.width,
                height: thumb.height,
              }}
            />
          )}
          <button
            ref={monthlyRef}
            type="button"
            className={`${styles["billing-option"]} ${
              billingPeriod === "monthly" ? styles["is-active"] : ""
            }`}
            aria-pressed={billingPeriod === "monthly"}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            ref={yearlyRef}
            type="button"
            className={`${styles["billing-option"]} ${
              billingPeriod === "yearly" ? styles["is-active"] : ""
            }`}
            aria-pressed={billingPeriod === "yearly"}
            onClick={() => setPeriod("yearly")}
          >
            Yearly <span className={styles["save-text"]}>Save 20%</span>
          </button>
        </fieldset>

        <div className={styles["plans-grid"]}>
          {plans.map((plan) => (
            <article className={`card ${styles["plan-card"]}`} key={plan.name}>
              <div>
                <h2 className={styles["plan-name"]}>{plan.name}</h2>
                <PlanPrice plan={plan} billingPeriod={billingPeriod} />
                {plan.caption && (
                  <p className={styles["plan-caption"]}>{plan.caption}</p>
                )}
              </div>

              <div className={styles["features-block"]}>
                <h3 className={styles["includes-label"]}>
                  {plan.includesLabel}
                </h3>
                <ul className={styles["feature-list"]}>
                  {plan.bullets.map((bullet) => (
                    <li key={bullet}>
                      <CheckIcon size={14} weight="bold" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                {plan.footnote && (
                  <p className={styles["plan-footnote"]}>{plan.footnote}</p>
                )}
              </div>

              <button
                type="button"
                className={`btn btn-${plan.buttonStyle} ${styles["plan-button"]}`}
                onClick={plan.onClick}
              >
                {plan.buttonLabel}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
