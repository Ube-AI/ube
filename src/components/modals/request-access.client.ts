// Open the globally mounted Request Access modal when another app links to
// any page with the `request-access` query flag. The flag is intentionally
// value-less, so it composes cleanly with attribution parameters:
// `/?request-access&utm_source=partner`.
//
// This script runs before the React island hydrates. Nano Stores preserves the
// update, so the modal renders open as soon as its client bundle is ready.
import { openRequestAccess } from "@/stores/request-access"

const params = new URLSearchParams(window.location.search)

if (params.has("request-access")) {
  openRequestAccess("direct_link")
}
