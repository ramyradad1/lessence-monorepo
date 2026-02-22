const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to http://localhost:64911...');
  await page.goto('http://localhost:64911', { waitUntil: 'networkidle0', timeout: 30000 });
  
  const rootHtml = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML : 'NO ROOT ELEMENT';
  });
  
  if (rootHtml === 'NO ROOT ELEMENT' || rootHtml.trim() === '') {
    console.log('App did not render (empty root).');
  } else {
    console.log('Root has content! Length:', rootHtml.length);
  }
  
  await browser.close();
})();
