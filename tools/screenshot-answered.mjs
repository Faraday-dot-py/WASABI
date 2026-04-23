import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 15000 })
await new Promise((r) => setTimeout(r, 500))

// Enter flow
await page.click(".hero-cta")
await new Promise((r) => setTimeout(r, 600))

// Answer first question (click first option)
const options = await page.$$(".option-bloom")
if (options[0]) await options[0].click()
await new Promise((r) => setTimeout(r, 400))

// Answer second question
const options2 = await page.$$(".option-bloom")
if (options2[0]) await options2[0].click()
await new Promise((r) => setTimeout(r, 600))

writeFileSync("/tmp/wasabi-answered.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("Saved answered screenshot")
await browser.close()
