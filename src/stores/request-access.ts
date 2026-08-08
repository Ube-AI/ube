// Ube — Request Access modal state.
//
// The modal is mounted once globally in BaseLayout.astro (ADR 0002), but its
// open-triggers live across many React islands (Nav, Hero, FinalCta) that
// don't share React context. Nano Stores bridges those islands: every CTA
// island calls `openRequestAccess(source)` and the modal island subscribes
// via `useStore(isRequestAccessOpen)`.
//
// The wrapper fires the `request_access_modal_opened` analytics event so
// call sites can never forget to track it.
import { atom } from "nanostores"

import { track } from "@/lib/analytics"

// Source labels track user-facing copy: when a CTA is renamed, its label is
// renamed with it, accepting the break in the analytics series rather than
// carrying a name that no longer describes what it points at. The homepage
// stopped saying "Publisher" and the pricing cards became Solo/Team at new
// prices, so those four labels moved with them (ADR 0006).
//
// This is the OPPOSITE of the need-signal values in RequestAccessModal,
// which stay `publisher`/`maintainer` on purpose. A source label names a
// CTA; the need signal measures the same growth-vs-maintenance question
// before and after the rename, so its series must stay continuous.
export type ModalSource =
  | "direct_link"
  | "nav"
  | "maintainer_hero"
  | "home_hero"
  | "maintainer_final_cta"
  | "home_final_cta"
  | "pricing_solo"
  | "pricing_team"
  | "pricing_enterprise"
  | "pricing_final_cta"

export type ModalVariant = "default" | "enterprise"

export const isRequestAccessOpen = atom<boolean>(false)
export const requestAccessVariant = atom<ModalVariant>("default")
export const requestAccessSource = atom<ModalSource | null>(null)

export const openRequestAccess = (
  source: ModalSource,
  variant: ModalVariant = "default",
  extra?: Record<string, unknown>,
): void => {
  requestAccessVariant.set(variant)
  requestAccessSource.set(source)
  track("request_access_modal_opened", { source, variant, ...extra })
  isRequestAccessOpen.set(true)
}

export const closeRequestAccess = (): void => {
  isRequestAccessOpen.set(false)
}
