// Typed registry of third-party integration logos.
//
// Every logo is imported as a module so it lives in the bundle graph: rename
// or delete a file and the build fails (Vite can't resolve the import).
// Consumers reference a *key* (`integrationLogos.firebase`), never a path
// string, so a typo is a compile error and the "/assets/..." leading-slash
// 404 class is unrepresentable. Each value is an `ImageMetadata`; use `.src`
// for the resolved (hashed) URL in an `<img>`.
import type { ImageMetadata } from "astro"
import admob from "@/assets/integrations/admob.svg"
import amplitude from "@/assets/integrations/amplitude.svg"
import android from "@/assets/integrations/android.svg"
import apple from "@/assets/integrations/apple.svg"
import appsflyer from "@/assets/integrations/appsflyer.svg"
import bun from "@/assets/integrations/bun.svg"
import clarity from "@/assets/integrations/clarity.png"
import claudeCode from "@/assets/integrations/claude-code.svg"
import codemagic from "@/assets/integrations/codemagic.svg"
import codex from "@/assets/integrations/codex.svg"
import creatify from "@/assets/integrations/creatify.png"
import dart from "@/assets/integrations/dart.svg"
import docker from "@/assets/integrations/docker.svg"
import expo from "@/assets/integrations/expo.svg"
import firebase from "@/assets/integrations/firebase.svg"
import flutter from "@/assets/integrations/flutter.svg"
import github from "@/assets/integrations/github.svg"
import githubActions from "@/assets/integrations/github_actions.svg"
import googleAds from "@/assets/integrations/google_ads.svg"
import googlePlay from "@/assets/integrations/google-play.png"
import linkedin from "@/assets/integrations/linkedin.svg"
import meta from "@/assets/integrations/meta.svg"
import npm from "@/assets/integrations/npm.svg"
import react from "@/assets/integrations/react.svg"
import revenuecat from "@/assets/integrations/revenuecat.svg"
import sentry from "@/assets/integrations/sentry.svg"
import sett from "@/assets/integrations/sett.svg"
import tiktok from "@/assets/integrations/tiktok.svg"
import unity from "@/assets/integrations/unity.svg"

export const integrationLogos = {
  admob,
  amplitude,
  android,
  apple,
  appsflyer,
  bun,
  clarity,
  claudeCode,
  codemagic,
  codex,
  creatify,
  dart,
  docker,
  expo,
  firebase,
  flutter,
  github,
  githubActions,
  googleAds,
  googlePlay,
  linkedin,
  meta,
  npm,
  react,
  revenuecat,
  sentry,
  sett,
  tiktok,
  unity,
} satisfies Record<string, ImageMetadata>

export type IntegrationLogoKey = keyof typeof integrationLogos
