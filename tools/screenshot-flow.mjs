import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 15000 })
await new Promise((r) => setTimeout(r, 600))

// Click "Begin the observation run"
await page.click(".hero-cta")
await new Promise((r) => setTimeout(r, 800))

writeFileSync("/tmp/wasabi-flow.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("Saved flow screenshot")
await browser.close()
