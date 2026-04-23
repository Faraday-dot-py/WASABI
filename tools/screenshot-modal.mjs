import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
await new Promise(r => setTimeout(r, 400))
await page.click(".hero-cta")
await new Promise(r => setTimeout(r, 400))

// answer all questions quickly
for (let i = 0; i < 8; i++) {
  const opts = await page.$$(".option-bloom")
  if (opts[0]) await opts[0].click()
  await new Promise(r => setTimeout(r, 300))
  const btns = await page.$$('button[type="button"]:not(:disabled)')
  for (const btn of btns) {
    const text = await btn.evaluate(el => el.textContent?.trim())
    if (text?.includes("Continue") || text?.includes("Reveal")) {
      await btn.click(); break
    }
  }
  await new Promise(r => setTimeout(r, 250))
}
await new Promise(r => setTimeout(r, 600))

// open the full recommendation modal
const btns = await page.$$('button')
for (const btn of btns) {
  const text = await btn.evaluate(el => el.textContent?.trim())
  if (text?.includes("Full recommendation")) {
    await btn.click(); break
  }
}
await new Promise(r => setTimeout(r, 700))
writeFileSync("/tmp/modal-open.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("saved modal")
await browser.close()
