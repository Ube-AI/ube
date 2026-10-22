import { type ModalSource, openRequestAccess } from "@/stores/request-access"

const ctaButtons = document.querySelectorAll<HTMLButtonElement>(
  "[data-publisher-final-cta]",
)

for (const btn of ctaButtons) {
  // The attribute value is the typed `source` prop FinalCta.astro renders.
  const source = (btn.dataset["publisherFinalCta"] ||
    "home_final_cta") as ModalSource
  btn.addEventListener("click", () => {
    openRequestAccess(source)
  })
}
