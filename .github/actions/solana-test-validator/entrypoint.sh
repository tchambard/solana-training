#!/bin/sh

# Set config file
echo "{\"imageName\": \"tchambard/solana-test-validator:solana_$INPUT_SOLANA_VERSION-anchor_$INPUT_ANCHOR_VERSION\",\"containerName\": \"solana-test-validator\"}" > ../../../solrc.json

# Start container
docker run -d -u 1000:1000 --name solana-test-validator -p $INPUT_PORT:8899 tchambard/solana-test-validator:solana_$INPUT_SOLANA_VERSION-anchor_$INPUT_ANCHOR_VERSION bash
