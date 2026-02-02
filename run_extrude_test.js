import puppeteer from "puppeteer";
(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();
  page.on("console", msg => console.log(msg.text()));
  await page.goto("http://localhost:3000/test_extrude.html");
  await page.waitForFunction(() => document.body.textContent.includes("Done!"), { timeout: 60000 });
  await browser.close();
})();
