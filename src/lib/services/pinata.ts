import axios from 'axios';
import FormData from 'form-data';

const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  throw new Error('Missing PINATA_JWT environment variable');
}

export async function pinFileToIPFS(fileBuffer: Buffer, fileName: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: 'image/png',
  });

  const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      ...formData.getHeaders(),
    },
  });

  return response.data.IpfsHash;
}

export async function pinJSONToIPFS(json: any): Promise<string> {
  const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', json, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data.IpfsHash;
}

export async function unpinFromIPFS(hash: string): Promise<void> {
  if (!process.env.PINATA_JWT) {
    throw new Error('Missing Pinata JWT');
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${hash}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.PINATA_JWT}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to unpin from IPFS: ${await response.text()}`);
  }
} 