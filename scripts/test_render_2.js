import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    // We also want to catch unhandled promise rejections or other errors
    await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', e => {
            console.log('WINDOW ERROR:', e.message);
        });
    });

    await page.goto('http://localhost:5174/juego');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
