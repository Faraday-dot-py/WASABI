import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })

async function shot(page, path) {
  writeFileSync(path, await page.screenshot({ type: "png", fullPage: false }))
  console.log("saved", path)
}

// 1. Desktop flow (show network overlay issue + why z-index)
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
  await new Promise(r => setTimeout(r, 500))
  await page.click(".hero-cta")
  await new Promise(r => setTimeout(r, 600))
  await shot(page, "/tmp/issue-flow-1440.png")

  // hover the Why button to show z-index issue
  const whyBtn = await page.$('[aria-label="Why this signal matters"]')
  if (whyBtn) {
    await whyBtn.hover()
    await new Promise(r => setTimeout(r, 400))
    await shot(page, "/tmp/issue-why-hover.png")
  }
  await page.close()
}

// 2. Done state - convergence chamber
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
  await new Promise(r => setTimeout(r, 400))
  await page.click(".hero-cta")
  await new Promise(r => setTimeout(r, 400))

  // answer all 8 questions with first option each time
  for (let i = 0; i < 8; i++) {
    const opts = await page.$$(".option-bloom")
    if (opts[0]) await opts[0].click()
    await new Promise(r => setTimeout(r, 350))
    const continueBtn = await page.$('button[type="button"]:not(:disabled) .lucide-arrow-right')
    if (continueBtn) {
      const btn = await continueBtn.evaluateHandle(el => el.closest('button'))
      await btn.click()
      await new Promise(r => setTimeout(r, 300))
    }
  }
  await new Promise(r => setTimeout(r, 800))
  await shot(page, "/tmp/issue-done-1440.png")
  await page.close()
}

// 3. Medium viewport
{
  const page = await browser.newPage()
  await page.setViewport({ width: 768, height: 1024 })
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
  await new Promise(r => setTimeout(r, 400))
  await page.click(".hero-cta")
  await new Promise(r => setTimeout(r, 600))
  await shot(page, "/tmp/issue-flow-768.png")
  await page.close()
}

// 4. Mobile
{
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" })
  await new Promise(r => setTimeout(r, 400))
  await page.click(".hero-cta")
  await new Promise(r => setTimeout(r, 600))
  await shot(page, "/tmp/issue-flow-390.png")
  await page.close()
}

await browser.close()
console.log("all done")
