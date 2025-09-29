import process from 'node:process'

const brandPalette = {
  500: '#2563eb',
  600: '#1d4ed8',
  700: '#1e40af',
}

const backgrounds = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  dark: '#0f172a',
}

const textTargets = {
  default: '#0f172a',
  inverse: '#FFFFFF',
}

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

const luminance = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  const channel = [r, g, b].map((value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2]
}

const contrastRatio = (foreground, background) => {
  const l1 = luminance(foreground)
  const l2 = luminance(background)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

let failures = 0

for (const [tone, hex] of Object.entries(brandPalette)) {
  for (const [bgName, bgHex] of Object.entries({ background: backgrounds.background, surface: backgrounds.surface })) {
    const ratio = contrastRatio(hex, bgHex)
    if (ratio < 4.5) {
      console.error(`⚠️  Brand ${tone} fails contrast on ${bgName}: ${ratio.toFixed(2)} : 1`)
      failures += 1
    }
  }
}

const textCombos = [
  { label: 'default text on background', fg: textTargets.default, bg: backgrounds.background },
  { label: 'inverse text on dark', fg: textTargets.inverse, bg: backgrounds.dark },
]

for (const combo of textCombos) {
  const ratio = contrastRatio(combo.fg, combo.bg)
  if (ratio < 4.5) {
    console.error(`⚠️  ${combo.label} fails contrast: ${ratio.toFixed(2)} : 1`)
    failures += 1
  }
}

if (failures > 0) {
  process.exitCode = 1
  console.error(`Contrast audit failed with ${failures} violation(s).`)
} else {
  console.log('✓ Brand contrast audit passed for light and dark surfaces.')
}
