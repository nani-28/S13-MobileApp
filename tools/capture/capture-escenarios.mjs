import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = path.join(root, 'artifacts/screenshots')
const baseUrl = process.env.EXPO_WEB_URL ?? 'http://127.0.0.1:8081'

mkdirSync(outDir, { recursive: true })

async function resetApi() {
  const response = await fetch('http://127.0.0.1:3001/api/test/reset', { method: 'POST' })
  if (!response.ok) {
    throw new Error(`No se pudo resetear la API: ${response.status}`)
  }
}

function byId(page, id) {
  return page.locator(`[data-testid="${id}"], #${id}`).first()
}

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`screenshot ${name}`)
}

async function openApp(page) {
  await resetApi()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByText('Salón Lila').first().waitFor({ timeout: 60000 })
  await byId(page, 'reset-data').click()
  await page.waitForTimeout(300)
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch()
  }
}

async function run() {
  const browser = await launchBrowser()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  await openApp(page)
  await byId(page, 'role-user').click()
  await page.getByText('Corte').waitFor()
  await page.getByText('Coloración').waitFor()
  await page.getByText('Manicure').waitFor()
  await shot(page, '01-catalogo')

  await openApp(page)
  await byId(page, 'role-user').click()
  await byId(page, 'service-corte').click()
  await byId(page, 'continue-services').click()
  await byId(page, 'slot-1100').click()
  await byId(page, 'confirm-booking').click()
  await byId(page, 'success').waitFor()
  await byId(page, 'go-appointments').click()
  await byId(page, 'appointments-list').waitFor()
  await page.getByText('Corte').waitFor()
  await page.getByText('11:00').waitFor()
  await shot(page, '02-reserva-exitosa')

  await openApp(page)
  await byId(page, 'role-user').click()
  await byId(page, 'service-color').click()
  await byId(page, 'continue-services').click()
  await byId(page, 'slot-1000').click()
  await byId(page, 'confirm-booking').click()
  await byId(page, 'error').waitFor()
  await page.getByText('Ese horario ya está ocupado').waitFor()
  await shot(page, '03-horario-ocupado')

  await openApp(page)
  await byId(page, 'role-user').click()
  await byId(page, 'continue-services').click()
  await byId(page, 'error').waitFor()
  await page.locator('#error').getByText('Elige un servicio').waitFor()
  await byId(page, 'continue-services').waitFor()
  await shot(page, '04-validacion')

  await openApp(page)
  await byId(page, 'role-user').click()
  await byId(page, 'service-manicure').click()
  await byId(page, 'continue-services').click()
  await byId(page, 'slot-1400').click()
  await byId(page, 'confirm-booking').click()
  await page.getByText('Reserva confirmada').waitFor()
  await byId(page, 'change-role').click()
  await byId(page, 'role-professional').click()
  await byId(page, 'agenda-list').waitFor()
  await page.getByText('Ana · Manicure').waitFor()
  await page.getByText('14:00').waitFor()
  await shot(page, '05-agenda-profesional')

  await browser.close()
  console.log(`listo: ${outDir}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
