import { ethers } from 'ethers';

export async function getSignatureForMint(tokenUri: string): Promise<string> {
  const privateKey = process.env.MINTING_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Missing MINTING_PRIVATE_KEY environment variable');
  }

  const signer = new ethers.Wallet(privateKey);
  const messageHash = ethers.solidityPackedKeccak256(
    ['string'],
    [tokenUri]
  );
  
  const signature = await signer.signMessage(ethers.getBytes(messageHash));
  return signature;
} 