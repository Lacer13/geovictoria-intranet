import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5174/juego');
    await new Promise(r => setTimeout(r, 12000));
    const html = await page.evaluate(() => document.getElementById('root').innerHTML);
    console.log('HTML length:', html.length);
    console.log('Includes canvas?', html.includes('<canvas'));
    await browser.close();
})();
