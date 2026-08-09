type PaperShaders = typeof import("@paper-design/shaders")
type ShaderMount = import("@paper-design/shaders").ShaderMount

const targets = document.querySelectorAll<HTMLElement>("[data-warp-shader]")

if (targets.length > 0) {
  const shaderWindow = window as Window & {
    __ubeWarpShaderCleanup?: () => void
  }

  // Dispose mounts left behind by dev hot reloads before creating new ones.
  shaderWindow.__ubeWarpShaderCleanup?.()

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
  const mounts = new Map<HTMLElement, ShaderMount>()
  let paperShadersPromise: Promise<PaperShaders> | undefined
  let noiseTexturePromise: Promise<HTMLImageElement> | undefined
  let disposed = false

  const animatedSpeed = 2.5

  const loadNoiseTexture = async (
    paperShaders: PaperShaders,
  ): Promise<HTMLImageElement> => {
    const image = paperShaders.getShaderNoiseTexture()
    if (!image) throw new Error("Paper Shaders noise texture is unavailable")

    if (!image.complete || image.naturalWidth === 0) {
      await image.decode()
    }

    return image
  }

  const mountShader = async (target: HTMLElement) => {
    if (
      disposed ||
      mounts.has(target) ||
      target.dataset["warpMounting"] === "true"
    ) {
      return
    }

    target.dataset["warpMounting"] = "true"

    try {
      paperShadersPromise ??= import("@paper-design/shaders")
      const paperShaders = await paperShadersPromise

      noiseTexturePromise ??= loadNoiseTexture(paperShaders)
      const noiseTexture = await noiseTexturePromise

      if (disposed || !target.isConnected) return

      const colors = [
        "#17161a",
        "#251d2d",
        "#4a2d69",
        "#6b3fa0",
        "#211d24",
      ].map(paperShaders.getShaderColorFromString)

      const mount = new paperShaders.ShaderMount(
        target,
        paperShaders.warpFragmentShader,
        {
          u_colors: colors,
          u_colorsCount: colors.length,
          u_proportion: 0.58,
          u_softness: 0.9,
          u_shape: paperShaders.WarpPatterns.checks,
          u_shapeScale: 0.12,
          u_distortion: 0.28,
          u_swirl: 0.2,
          u_swirlIterations: 7,
          u_noiseTexture: noiseTexture,
          u_fit: paperShaders.ShaderFitOptions.cover,
          u_scale: 1.08,
          u_rotation: -10,
          u_originX: 0.5,
          u_originY: 0.5,
          u_offsetX: -0.04,
          u_offsetY: 0.03,
          u_worldWidth: 0,
          u_worldHeight: 0,
        },
        { alpha: true, antialias: false, premultipliedAlpha: true },
        motionPreference.matches ? 0 : animatedSpeed,
        4_800,
        1,
        1_200_000,
      )

      mount.canvasElement.setAttribute("aria-hidden", "true")
      mount.canvasElement.setAttribute("role", "presentation")
      mounts.set(target, mount)

      requestAnimationFrame(() => {
        if (!disposed && target.isConnected) {
          target.dataset["warpMounted"] = "true"
        }
      })
    } catch (error) {
      // The CSS background remains visible when WebGL, texture decoding, or
      // dynamic loading is unavailable.
      target.dataset["warpFailed"] = "true"
      console.warn("Ube Warp shader unavailable; using CSS fallback.", error)
    } finally {
      delete target.dataset["warpMounting"]
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        void mountShader(entry.target as HTMLElement)
      }
    },
    { rootMargin: "240px 0px", threshold: 0.01 },
  )

  for (const target of targets) observer.observe(target)

  const handleMotionPreference = (event: MediaQueryListEvent) => {
    for (const mount of mounts.values()) {
      mount.setSpeed(event.matches ? 0 : animatedSpeed)
    }
  }
  motionPreference.addEventListener("change", handleMotionPreference)

  const cleanup = () => {
    if (disposed) return
    disposed = true
    observer.disconnect()
    motionPreference.removeEventListener("change", handleMotionPreference)

    for (const mount of mounts.values()) mount.dispose()
    mounts.clear()
  }

  window.addEventListener("pagehide", cleanup, { once: true })
  shaderWindow.__ubeWarpShaderCleanup = cleanup
}
