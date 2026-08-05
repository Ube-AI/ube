import { openRequestAccess } from "@/stores/request-access"

const ctaButtons = document.querySelectorAll<HTMLButtonElement>(
  "[data-publisher-final-cta]",
)

for (const btn of ctaButtons) {
  btn.addEventListener("click", () => {
    openRequestAccess("home_final_cta")
  })
}
