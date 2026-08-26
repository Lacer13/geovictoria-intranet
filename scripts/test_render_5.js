import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('CONSOLE ERROR:', msg.text());
        }
    });
    await page.goto('http://localhost:5174/juego');
    await new Promise(r => setTimeout(r, 12000));
    await browser.close();
})();
