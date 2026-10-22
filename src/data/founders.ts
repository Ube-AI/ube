// Ube founders — single source of truth for the /about/ founder cards, the
// hero byline avatars, and the Person nodes in the page's JSON-LD (same
// pattern as faq-items.ts).
import type { ImageMetadata } from "astro"
import alanKrueger from "@/assets/team/alan-krueger.webp"
import orkunDuman from "@/assets/team/orkun-duman.webp"

export type Founder = {
  // Doubles as the card's DOM id and the Person @id fragment
  // (`/about/#<slug>`), so the JSON-LD identity resolves to the card.
  slug: string
  name: string
  role: string
  linkedin: string
  photo: ImageMetadata
  // `object-position` for the 4:5 print crop. The two sources differ (square
  // vs. 2:3 portrait), so each is nudged until the eye lines match.
  focal: string
}

export const FOUNDERS: Founder[] = [
  {
    slug: "orkun-duman",
    name: "Orkun Duman",
    role: "Co-founder & CEO",
    linkedin: "https://www.linkedin.com/in/orkun-duman/",
    photo: orkunDuman,
    focal: "38% 50%",
  },
  {
    slug: "alan-krueger",
    name: "Alan Krueger",
    role: "Co-founder & CTO",
    linkedin: "https://www.linkedin.com/in/alankrueger/",
    photo: alanKrueger,
    focal: "50% 35%",
  },
]
