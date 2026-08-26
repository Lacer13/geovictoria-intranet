import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    await page.goto('http://localhost:5174/juego');
    await new Promise(r => setTimeout(r, 12000));
    const html = await page.evaluate(() => document.getElementById('root').innerHTML);
    console.log('HTML length:', html.length);
    console.log('HTML content:', html);
    await browser.close();
})();
