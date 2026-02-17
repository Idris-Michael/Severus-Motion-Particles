const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    });
    const page = await browser.newPage();

    // Grant camera permission
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:3002', ['camera']);

    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to app...');
    // Note: Port might be 3002 since 3000 was busy in the logs
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });

    // Wait for canvas or UI
    console.log('Waiting for canvas...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give 5s for particles to spawn

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'screenshot.png' });

    await browser.close();
    console.log('Done.');
})();
