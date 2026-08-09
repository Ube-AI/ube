// Single source of truth for pages under /integrations/*, so
// IntegrationsSidebar.astro can list every disclosure page without each
// one hardcoding its siblings.

export type IntegrationPage = {
  slug: string
  label: string
}

export const INTEGRATION_PAGES: IntegrationPage[] = [
  { slug: "google-ads", label: "Google Ads" },
]
