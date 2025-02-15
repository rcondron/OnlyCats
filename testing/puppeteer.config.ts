import { PuppeteerLaunchOptions } from 'puppeteer-core';

const config: PuppeteerLaunchOptions = {
  headless: false,
  slowMo: 50, // Slows down Puppeteer operations by 50ms - helpful for watching tests
  defaultViewport: null, // This allows the browser to use the full window size
  args: ['--window-size=1280,720'],
  timeout: 30000, // Default timeout of 30 seconds
};

export default config; 