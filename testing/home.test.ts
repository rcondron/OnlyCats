import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { setupMetaMask, approveMetaMaskConnection, approveMetaMaskTransaction } from './setup-metamask';

describe('OnlyCats Home Page Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    console.log('Launching Chrome...');
    try {
      // Launch Chrome with MetaMask extension
      browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        defaultViewport: null,
        executablePath: process.platform === 'darwin' 
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : undefined,
        args: [
          '--window-size=1280,720',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          `--disable-extensions-except=${path.resolve(process.cwd(), 'testing', 'metamask')}`,
          `--load-extension=${path.resolve(process.cwd(), 'testing', 'metamask')}`,
          '--remote-debugging-port=9222',
        ],
        dumpio: true,
      });
      console.log('Chrome launched successfully');

      console.log('Setting up MetaMask...');
      // Set up MetaMask with our test account
      await setupMetaMask(browser);
      console.log('MetaMask setup complete');

      // Create a new page for our app
      console.log('Creating new page...');
      page = await browser.newPage();
      console.log('New page created');
    } catch (error) {
      console.error('Error during setup:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should generate image and mint NFT', async () => {
    console.log('Starting test...');
    try {
      // Navigate to home page
      await page.goto('http://localhost:3000');
      console.log('Navigated to homepage');
      
      // Wait for the page to load
      await page.waitForSelector('body');
      console.log('Page loaded');
      
      // Look for and click the wallet connect button
      const connectButton = await page.waitForSelector('button.btn-primary');
      if (!connectButton) throw new Error('Connect Wallet button not found');
      await connectButton.click();
      console.log('Clicked connect wallet button');
      
      // Wait for RainbowKit modal and select MetaMask
      const metaMaskOption = await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]');
      if (!metaMaskOption) throw new Error('MetaMask option not found');
      await metaMaskOption.click();
      console.log('Selected MetaMask from RainbowKit modal');

      // Handle MetaMask connection approval
      await approveMetaMaskConnection(browser);
      console.log('Approved MetaMask connection');
      
      // Wait for wallet connection (look for the generate button to appear)
      const generateButton = await page.waitForSelector('button:has-text("⚔️ Generate Warrior Cat ⚔️")', { timeout: 60000 });
      if (!generateButton) throw new Error('Generate button not found');
      await generateButton.click();
      console.log('Clicked generate button');
      
      // Wait for image generation (this might take some time)
      await page.waitForSelector('img[alt="Generated Warrior Cat"]', { timeout: 60000 });
      console.log('Image generated');
      
      // Look for and click the mint button
      const mintButton = await page.waitForSelector('button:has-text("Mint")');
      if (!mintButton) throw new Error('Mint button not found');
      await mintButton.click();
      console.log('Clicked mint button');

      // Handle MetaMask transaction approval
      await approveMetaMaskTransaction(browser);
      console.log('Approved MetaMask transaction');
      
      // Wait for the minting process to complete (look for success message or confirmation)
      await page.waitForSelector('.mint-success', { timeout: 60000 });
      console.log('Minting completed');
      
      // Verify the success state
      const successMessage = await page.$('.mint-success');
      expect(successMessage).toBeTruthy();
      console.log('Test completed successfully');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  }, 180000); // Increased timeout to 3 minutes for wallet setup
}); 