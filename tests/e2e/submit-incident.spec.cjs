const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 30000;

async function main() {
  const options = new chrome.Options().addArguments('--headless=new');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  const uniqueTitle = `E2E Incident ${Date.now()}`;
  const tag = 'dns';

  try {
    await driver.get(`${BASE_URL}/submit`);

    await fillInput(driver, 'title', uniqueTitle);
    await fillTextarea(driver, 'context', 'E2E test context');
    await fillTextarea(driver, 'whatHappened', 'Automated test submission flow.');
    await fillTextarea(driver, 'rootCause', 'Testing root cause');
    await fillTextarea(driver, 'impact', 'Minimal; test only.');
    await fillTextarea(driver, 'fix', 'None needed');
    await fillTextarea(driver, 'lessons', 'Tests catch regressions');
    await fillTextarea(driver, 'prevention', 'Run e2e before deploy');
    await fillInput(driver, 'costEstimate', '1234');

    await clickButtonWithText(driver, tag);

    const submitButton = await driver.findElement(By.xpath("//button[normalize-space()='Submit Incident']"));
    await submitButton.click();

    await driver.wait(until.urlContains('/incident/'), DEFAULT_TIMEOUT);
    await driver.wait(until.elementLocated(By.xpath(`//h1[normalize-space()="${uniqueTitle}"]`)), DEFAULT_TIMEOUT);

    await driver.findElement(By.xpath(`//a[normalize-space()="${tag}"]`));

    await driver.get(`${BASE_URL}/`);
    const card = await driver.wait(
      until.elementLocated(By.xpath(`//article[.//h2[normalize-space()="${uniqueTitle}"]]`)),
      DEFAULT_TIMEOUT
    );
    await card.findElement(By.xpath(`.//a[normalize-space()="${tag}"]`));

    console.log('✅ Incident submission flow passed');
  } finally {
    await driver.quit();
  }
}

async function fillInput(driver, id, value) {
  const el = await driver.findElement(By.id(id));
  await el.clear();
  await el.sendKeys(value);
}

async function fillTextarea(driver, id, value) {
  return fillInput(driver, id, value);
}

async function clickButtonWithText(driver, text) {
  const button = await driver.findElement(By.xpath(`//button[normalize-space()="${text}"]`));
  await button.click();
}

main().catch((err) => {
  console.error('E2E test failed', err);
  process.exit(1);
});
