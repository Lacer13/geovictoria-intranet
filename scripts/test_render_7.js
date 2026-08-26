import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', async msg => {
        const args = await Promise.all(msg.args().map(a => a.jsonValue()));
        console.log('LOG:', args);
    });
    await page.goto('http://localhost:5174/juego');
    await new Promise(r => setTimeout(r, 8000));
    await browser.close();
})();
