const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log("Navigating to http://localhost:3000/threat-intel...");
  await page.goto('http://localhost:3000/threat-intel', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // give react router time
  await page.screenshot({ path: 'n7_debug.png', fullPage: true });
  
  console.log("--- VERIFICATION ---");
  
  console.log("1. Verifying Title...");
  const title = await page.locator('h2:has-text("Threat Intelligence")').first().isVisible();
  console.log(`Title visible: ${title}`);
  
  console.log("2. Verifying Summary Cards...");
  // Wait for the skeleton loaders to disappear
  await page.waitForSelector('text="Active KEV"');
  await page.waitForTimeout(2000); // give it time to render data
  
  const activeKev = await page.locator('h4:text-is("Active KEV") + div').innerText();
  const ransomwareKev = await page.locator('h4:text-is("Ransomware KEV") + div').innerText();
  const overdueKev = await page.locator('h4:text-is("Overdue KEV") + div').innerText();
  const tacticsCount = await page.locator('h4:text-is("ATT&CK Tactics") + div').innerText();
  const techniquesCount = await page.locator('h4:text-is("ATT&CK Techniques") + div').innerText();
  
  console.log(`Summary - Active KEV: ${activeKev}`);
  console.log(`Summary - Ransomware KEV: ${ransomwareKev}`);
  console.log(`Summary - Overdue KEV: ${overdueKev}`);
  console.log(`Summary - ATT&CK Tactics: ${tacticsCount}`);
  console.log(`Summary - ATT&CK Techniques: ${techniquesCount}`);
  
  console.log("3. Verifying KEV Rows...");
  const tableRows = await page.locator('table tbody tr').count();
  console.log(`KEV Rows Count: ${tableRows}`);
  
  if (tableRows > 0) {
    console.log("9. Clicking View on first KEV record...");
    await page.locator('table tbody tr').first().locator('button:has-text("View")').click();
    await page.waitForSelector('[role="dialog"]');
    const modalVisible = await page.locator('[role="dialog"]').isVisible();
    console.log(`Modal visible: ${modalVisible}`);
    
    console.log("10. Checking Provenance in Modal...");
    const provSource = await page.locator('[role="dialog"]').innerText();
    const hasProvenance = provSource.includes('Provenance') && provSource.includes('Source:');
    console.log(`Provenance visible: ${hasProvenance}`);
    
    console.log("Closing modal...");
    await page.keyboard.press('Escape'); // usually closes modals
    await page.waitForTimeout(500);
  }
  
  console.log("11/12. Verifying MITRE Tactics and Techniques render...");
  const tacticsList = await page.locator('h4:has-text("Tactics")').locator('xpath=../..').locator('.max-h-80 > div').count();
  const techniquesList = await page.locator('h4:has-text("Techniques")').locator('xpath=../..').locator('.max-h-80 > div').count();
  console.log(`MITRE Tactics listed in section: ${tacticsList}`);
  console.log(`MITRE Techniques listed in section: ${techniquesList}`);

  console.log("Taking screenshot...");
  await page.screenshot({ path: 'n7_verification.png', fullPage: true });

  await browser.close();
  console.log("Verification complete.");
})().catch(e => {
  console.error("Browser test failed:", e);
  process.exit(1);
});
