import { openRequestAccess } from "@/stores/request-access"

const ctaButtons = document.querySelectorAll<HTMLButtonElement>(
  "[data-publisher-hero-cta]",
)

for (const btn of ctaButtons) {
  btn.addEventListener("click", () => {
    openRequestAccess("home_hero")
  })
}
