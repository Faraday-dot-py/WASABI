import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
await new Promise(r => setTimeout(r, 400))
await page.click(".hero-cta")
await new Promise(r => setTimeout(r, 400))

// answer all 8 questions
for (let i = 0; i < 8; i++) {
  await new Promise(r => setTimeout(r, 300))
  const opts = await page.$$(".option-bloom")
  if (opts[0]) { await opts[0].click(); await new Promise(r => setTimeout(r, 300)) }
  // click continue/reveal button
  const allBtns = await page.$$('button[type="button"]:not([disabled])')
  for (const btn of allBtns) {
    const txt = await page.evaluate(el => el.textContent?.trim() ?? '', btn)
    if (txt.includes("Continue") || txt.includes("Reveal")) {
      await btn.click()
      break
    }
  }
}
await new Promise(r => setTimeout(r, 1000))
writeFileSync("/tmp/modal-done.png", await page.screenshot({ type: "png", fullPage: false }))

// find and click "See full details"
const allBtns = await page.$$('button')
for (const btn of allBtns) {
  const txt = await page.evaluate(el => el.textContent?.trim() ?? '', btn)
  if (txt.includes("See full details") || txt.includes("full details")) {
    await btn.click()
    console.log("clicked modal button")
    break
  }
}
await new Promise(r => setTimeout(r, 800))
writeFileSync("/tmp/modal-open2.png", await page.screenshot({ type: "png", fullPage: false }))
console.log("done")
await browser.close()
