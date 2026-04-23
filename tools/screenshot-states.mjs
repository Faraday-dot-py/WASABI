import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
const page = await browser.newPage()

// 1440x900 desktop
await page.setViewport({ width: 1440, height: 900 })
await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 15000 })
await new Promise((r) => setTimeout(r, 600))
await page.click(".hero-cta")
await new Promise((r) => setTimeout(r, 800))
writeFileSync("/tmp/wasabi-q1.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("q1 done")

// answer q1 and get to q2
const opts = await page.$$(".option-bloom")
if (opts[0]) await opts[0].click()
await new Promise((r) => setTimeout(r, 700))
writeFileSync("/tmp/wasabi-q2.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("q2 done")

// medium screen
await page.setViewport({ width: 900, height: 800 })
await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
await new Promise((r) => setTimeout(r, 400))
await page.click(".hero-cta")
await new Promise((r) => setTimeout(r, 600))
writeFileSync("/tmp/wasabi-medium.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("medium done")

await browser.close()
