import path from 'path';
import { Browser, Page } from 'puppeteer';

const METAMASK_EXTENSION_PATH = path.join(process.cwd(), 'testing', 'metamask');
const TEST_PRIVATE_KEY = process.env.PRIVATE_KEY || '0x91405ae46540aa83c8186bede7aec70366e7abf5d8f322c9c3b0ecf1e92f2142';
const TEST_NETWORK_NAME = 'Base Sepolia';
const TEST_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ankr.com/base_sepolia/05b84b13e59af84cedd1d722b6ea35751dd5499b5d2ae7a6654a77d50228cd3d';
const TEST_CHAIN_ID = '84532';

export async function setupMetaMask(browser: Browser): Promise<void> {
  // Get all pages
  const pages = await browser.pages();
  const metamaskPage = pages[0];

  // Wait for MetaMask to load
  await metamaskPage.waitForSelector('[data-testid="onboarding-welcome-page"]', { timeout: 60000 });

  // Click "Get Started"
  await metamaskPage.click('[data-testid="onboarding-get-started"]');

  // Click "Import wallet"
  await metamaskPage.waitForSelector('[data-testid="onboarding-import-wallet"]');
  await metamaskPage.click('[data-testid="onboarding-import-wallet"]');

  // Accept terms
  await metamaskPage.waitForSelector('[data-testid="onboarding-terms-checkbox"]');
  await metamaskPage.click('[data-testid="onboarding-terms-checkbox"]');
  await metamaskPage.click('[data-testid="onboarding-import-confirm"]');

  // Enter password
  await metamaskPage.waitForSelector('[data-testid="create-password-new"]');
  await metamaskPage.type('[data-testid="create-password-new"]', 'Testing123!');
  await metamaskPage.type('[data-testid="create-password-confirm"]', 'Testing123!');
  await metamaskPage.click('[data-testid="create-password-terms"]');
  await metamaskPage.click('[data-testid="create-password-import"]');

  // Import private key
  await metamaskPage.waitForSelector('[data-testid="import-account-private-key"]');
  await metamaskPage.type('[data-testid="import-account-private-key-input"]', TEST_PRIVATE_KEY);
  await metamaskPage.click('[data-testid="import-account-confirm-button"]');

  // Add Base Sepolia network
  await metamaskPage.waitForSelector('[data-testid="network-display"]');
  await metamaskPage.click('[data-testid="network-display"]');
  
  await metamaskPage.waitForSelector('[data-testid="add-network-manually"]');
  await metamaskPage.click('[data-testid="add-network-manually"]');

  // Fill network details
  await metamaskPage.waitForSelector('[data-testid="network-form-network-name"]');
  await metamaskPage.type('[data-testid="network-form-network-name"]', TEST_NETWORK_NAME);
  await metamaskPage.type('[data-testid="network-form-rpc-url"]', TEST_RPC_URL);
  await metamaskPage.type('[data-testid="network-form-chain-id"]', TEST_CHAIN_ID);
  await metamaskPage.type('[data-testid="network-form-symbol"]', 'ETH');
  
  // Save network
  await metamaskPage.click('[data-testid="network-form-save"]');

  // Close the MetaMask tab
  await metamaskPage.close();
}

export async function getMetaMaskExtensionPath(): Promise<string> {
  return METAMASK_EXTENSION_PATH;
}

export async function approveMetaMaskConnection(browser: Browser): Promise<void> {
  const pages = await browser.pages();
  const metamaskPopup = pages[pages.length - 1];
  
  // Wait for and click the "Next" button
  await metamaskPopup.waitForSelector('[data-testid="page-container-footer-next"]');
  await metamaskPopup.click('[data-testid="page-container-footer-next"]');
  
  // Wait for and click the "Connect" button
  await metamaskPopup.waitForSelector('[data-testid="page-container-footer-connect"]');
  await metamaskPopup.click('[data-testid="page-container-footer-connect"]');
  
  // Close the popup
  await metamaskPopup.close();
}

export async function approveMetaMaskTransaction(browser: Browser): Promise<void> {
  const pages = await browser.pages();
  const metamaskPopup = pages[pages.length - 1];
  
  // Wait for and click the "Confirm" button
  await metamaskPopup.waitForSelector('[data-testid="confirmation-submit-button"]');
  await metamaskPopup.click('[data-testid="confirmation-submit-button"]');
  
  // Close the popup
  await metamaskPopup.close();
} 