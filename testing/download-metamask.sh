#!/bin/bash

# Create metamask directory if it doesn't exist
mkdir -p testing/metamask

# Download MetaMask
curl -L https://github.com/MetaMask/metamask-extension/releases/download/v11.10.1/metamask-chrome-11.10.1.zip -o testing/metamask.zip

# Unzip MetaMask
cd testing && unzip metamask.zip -d metamask/

# Clean up
rm metamask.zip

echo "MetaMask extension downloaded and prepared for testing." 