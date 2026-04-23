/**
 * tools/screenshot.mjs
 * Usage: node tools/screenshot.mjs <url> <output-path> [width] [height]
 * Captures a full-page screenshot of a URL using Puppeteer's bundled Chromium.
 */
import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const [, , url, outPath, w, h] = process.argv
if (!url || !outPath) {
  console.error("Usage: node tools/screenshot.mjs <url> <output-path> [width] [height]")
  process.exit(1)
}

const width = parseInt(w ?? "1440", 10)
const height = parseInt(h ?? "900", 10)

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width, height })
await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 })
// Let animations settle
await new Promise((r) => setTimeout(r, 800))

const screenshot = await page.screenshot({ type: "png", fullPage: false })
writeFileSync(outPath, screenshot)
console.log(`Saved ${width}x${height} screenshot to ${outPath}`)
await browser.close()
