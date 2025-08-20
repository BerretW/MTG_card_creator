#!/bin/bash
echo "Sestavuji Docker image mtg-card-creator:latest..."
docker build -t mtg-card-creator:latest .
echo "Build dokončen."