import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "@/constants"
import type { FaqItem } from "@/data/faq-items"

type JsonLd = Record<string, unknown>

type BreadcrumbItem = {
  name: string
  url: string
}

type SiteUrl = URL | undefined

type WebPageSchemaArgs = {
  pageUrl: string
  title: string
  description: string
  dateModified: string
  aboutId?: string
}

const requireSite = (site: SiteUrl) => {
  if (!site) {
    throw new Error("Astro.site is required to build JSON-LD schema.")
  }

  return site
}

const absoluteUrl = (site: SiteUrl, path: string) =>
  new URL(path, requireSite(site)).href

export const schemaIds = (site: SiteUrl) => ({
  siteUrl: absoluteUrl(site, "/"),
  orgId: absoluteUrl(site, "/#organization"),
  websiteId: absoluteUrl(site, "/#website"),
  maintainerId: absoluteUrl(site, "/maintainer/#ube-maintainer"),
  publisherId: absoluteUrl(site, "/#ube-publisher"),
  offerCatalogId: absoluteUrl(site, "/pricing/#offer-catalog"),
})

export const buildOrganizationSchema = (
  site: SiteUrl,
  dateModified?: string,
): JsonLd => {
  const ids = schemaIds(site)

  return {
    "@type": "Organization",
    "@id": ids.orgId,
    name: "Ube",
    legalName: "Chunky Tofu Studios, LLC",
    url: ids.siteUrl,
    logo: absoluteUrl(site, "/assets/favicons/logo-512.png"),
    description:
      "Ube builds AI agents for mobile app teams: Ube Maintainer triages crashes, reviews, and dependency releases into verified pull requests, and Ube Publisher instruments analytics, attribution, paid acquisition, A/B tests, and monetization loops.",
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
    },
    sameAs: [GITHUB_URL, LINKEDIN_URL],
    knowsAbout: [
      "mobile app maintenance",
      "cross-platform app development",
      "crash triage",
      "dependency upgrades",
      "mobile analytics",
      "mobile attribution",
      "paid user acquisition",
      "A/B testing",
      "app monetization",
    ],
    makesOffer: [
      {
        "@type": "Offer",
        name: "Ube Publisher early access",
        url: ids.siteUrl,
        availability: "https://schema.org/PreOrder",
        itemOffered: {
          "@type": "SoftwareApplication",
          "@id": ids.publisherId,
          name: "Ube Publisher",
          applicationCategory: "BusinessApplication",
        },
      },
      {
        "@type": "Offer",
        name: "Ube Maintainer early access",
        url: absoluteUrl(site, "/maintainer/"),
        availability: "https://schema.org/PreOrder",
        itemOffered: {
          "@type": "SoftwareApplication",
          "@id": ids.maintainerId,
          name: "Ube Maintainer",
          applicationCategory: "DeveloperApplication",
        },
      },
    ],
    ...(dateModified ? { dateModified } : {}),
  }
}

export const buildWebsiteSchema = (site: SiteUrl): JsonLd => {
  const ids = schemaIds(site)

  return {
    "@type": "WebSite",
    "@id": ids.websiteId,
    name: "Ube",
    url: ids.siteUrl,
    description:
      "AI agents for maintaining and growing mobile apps, including Ube Maintainer and Ube Publisher.",
    publisher: { "@id": ids.orgId },
    inLanguage: "en-US",
  }
}

export const buildMaintainerSchema = (
  site: SiteUrl,
  dateModified: string,
): JsonLd => {
  const ids = schemaIds(site)

  return {
    "@type": "SoftwareApplication",
    "@id": ids.maintainerId,
    name: "Ube Maintainer",
    url: absoluteUrl(site, "/maintainer/"),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "An agent that listens to crash feeds, error dashboards, app reviews, and dependency releases - then triages, reproduces, and opens verified PRs against your repo. Supports React Native, Expo, Flutter, native iOS (Swift / Obj-C), native Android (Kotlin / Java), and Capacitor / Ionic.",
    dateModified,
    isPartOf: { "@id": ids.websiteId },
    featureList: [
      "Monitors crash feeds, error dashboards, app reviews, and dependency releases",
      "Ingests signals from Firebase Crashlytics, Sentry, Play Console, App Store Connect, support inboxes, dependency registries, and build systems",
      "Deduplicates issues across binaries, OS versions, and dependency upgrades",
      "Reproduces bugs on emulators, patches, and verifies against your test suite",
      "Opens verified pull requests with regression-suite coverage",
      "Closes the loop with the original reporter after release",
      "Escalates upstream with detailed reproduction reports",
    ],
    screenshot: absoluteUrl(site, "/assets/social/og-image-maintainer.jpg"),
    offers: {
      "@type": "Offer",
      name: "Ube Maintainer early access",
      url: absoluteUrl(site, "/pricing/"),
      price: "40",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "40",
        priceCurrency: "USD",
        unitText: "per app per month",
      },
    },
    creator: { "@id": ids.orgId },
  }
}

export const buildPublisherSchema = (
  site: SiteUrl,
  dateModified: string,
  description = "Ube Publisher sets up analytics, attribution, dashboards, paid ads, creatives, and A/B tests so app builders learn what to improve before scaling spend.",
): JsonLd => {
  const ids = schemaIds(site)

  return {
    "@type": "SoftwareApplication",
    "@id": ids.publisherId,
    name: "Ube Publisher",
    url: ids.siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    dateModified,
    isPartOf: { "@id": ids.websiteId },
    creator: { "@id": ids.orgId },
    featureList: [
      "Audits and instruments mobile apps with analytics and attribution SDKs",
      "Works with Firebase, Amplitude, Clarity, RevenueCat, AppsFlyer, AdMob, Google Ads, Meta, TikTok, Creatify, and Sett",
      "Sets up dashboards, MMP imports, SKAdNetwork schema, and event forwarding",
      "Creates and tests ad creatives across paid acquisition channels",
      "Finds drop-off points and recommends retention and monetization experiments",
      "Runs A/B tests through Firebase or RevenueCat with approval gates",
      "Scales budget only after retention, monetization, and campaign math improve",
    ],
    offers: {
      "@type": "Offer",
      name: "Maintainer + Publisher early access",
      url: absoluteUrl(site, "/pricing/"),
      price: "200",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "200",
        priceCurrency: "USD",
        unitText: "per app per month",
      },
    },
  }
}

export const buildPricingOffers = (site: SiteUrl): JsonLd[] => {
  const ids = schemaIds(site)
  const pricingUrl = absoluteUrl(site, "/pricing/")

  return [
    {
      "@type": "Offer",
      name: "Maintainer",
      url: pricingUrl,
      price: "40",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      itemOffered: {
        "@type": "SoftwareApplication",
        "@id": ids.maintainerId,
        name: "Ube Maintainer",
        applicationCategory: "DeveloperApplication",
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "40",
        priceCurrency: "USD",
        unitText: "per app per month",
      },
      eligibleDuration: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: "MON",
      },
    },
    {
      "@type": "Offer",
      name: "Maintainer yearly",
      url: pricingUrl,
      price: "32",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      itemOffered: {
        "@type": "SoftwareApplication",
        "@id": ids.maintainerId,
        name: "Ube Maintainer",
        applicationCategory: "DeveloperApplication",
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "32",
        priceCurrency: "USD",
        unitText: "per app per month, billed yearly",
      },
      eligibleDuration: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: "ANN",
      },
    },
    {
      "@type": "Offer",
      name: "Maintainer + Publisher",
      url: pricingUrl,
      price: "200",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      itemOffered: {
        "@type": "Product",
        name: "Ube Maintainer + Publisher",
        isRelatedTo: [
          {
            "@type": "SoftwareApplication",
            "@id": ids.maintainerId,
            name: "Ube Maintainer",
          },
          {
            "@type": "SoftwareApplication",
            "@id": ids.publisherId,
            name: "Ube Publisher",
          },
        ],
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "200",
        priceCurrency: "USD",
        unitText: "per app per month",
      },
      eligibleDuration: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: "MON",
      },
    },
    {
      "@type": "Offer",
      name: "Maintainer + Publisher yearly",
      url: pricingUrl,
      price: "160",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      itemOffered: {
        "@type": "Product",
        name: "Ube Maintainer + Publisher",
        isRelatedTo: [
          {
            "@type": "SoftwareApplication",
            "@id": ids.maintainerId,
            name: "Ube Maintainer",
          },
          {
            "@type": "SoftwareApplication",
            "@id": ids.publisherId,
            name: "Ube Publisher",
          },
        ],
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "160",
        priceCurrency: "USD",
        unitText: "per app per month, billed yearly",
      },
      eligibleDuration: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: "ANN",
      },
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      url: pricingUrl,
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      itemOffered: {
        "@type": "Product",
        name: "Ube Enterprise",
      },
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        description: "Custom pricing",
      },
    },
  ]
}

export const buildOfferCatalogSchema = (
  site: SiteUrl,
  offers: JsonLd[],
): JsonLd => {
  const ids = schemaIds(site)

  return {
    "@type": "OfferCatalog",
    "@id": ids.offerCatalogId,
    name: "Ube pricing plans",
    url: absoluteUrl(site, "/pricing/"),
    itemListElement: offers,
    provider: { "@id": ids.orgId },
  }
}

export const buildWebPageSchema = (
  site: SiteUrl,
  { pageUrl, title, description, dateModified, aboutId }: WebPageSchemaArgs,
): JsonLd => {
  const ids = schemaIds(site)

  return {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    name: title,
    url: pageUrl,
    description,
    dateModified,
    isPartOf: { "@id": ids.websiteId },
    publisher: { "@id": ids.orgId },
    ...(aboutId ? { about: { "@id": aboutId } } : {}),
  }
}

export const buildBreadcrumbSchema = (
  pageUrl: string,
  items: BreadcrumbItem[],
): JsonLd => ({
  "@type": "BreadcrumbList",
  "@id": `${pageUrl}#breadcrumb`,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export const buildFaqPageSchema = (
  pageUrl: string,
  items: FaqItem[],
): JsonLd => ({
  "@type": "FAQPage",
  "@id": `${pageUrl}#faq`,
  mainEntityOfPage: pageUrl,
  mainEntity: items.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
})

export const buildJsonLdGraph = (nodes: JsonLd[]): JsonLd => ({
  "@context": "https://schema.org",
  "@graph": nodes,
})
