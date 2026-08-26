import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch window errors and console errors
    await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', e => {
            console.log('UNCAUGHT ERROR:', e.message, e.filename, e.lineno);
        });
        const origError = console.error;
        console.error = function(...args) {
            console.log('CONSOLE.ERROR:', args.map(a => (a && a.message) ? a.message : String(a)).join(' '));
            origError.apply(console, args);
        };
    });

    page.on('console', msg => {
        console.log('LOG:', msg.text());
    });

    await page.goto('http://localhost:5174/juego');
    await new Promise(r => setTimeout(r, 6000));
    await browser.close();
})();
