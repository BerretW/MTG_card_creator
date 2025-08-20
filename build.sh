#!/bin/bash
# Tento skript sestaví Docker image pro aplikaci MTG Card Creator.

# Zastavíme, pokud jakýkoliv příkaz selže
set -e

# Název a tag pro naši Docker image
IMAGE_NAME="mtg-card-creator"
IMAGE_TAG="latest"

echo "========================================================"
echo "==       Sestavuji Docker image: $IMAGE_NAME:$IMAGE_TAG       =="
echo "========================================================"
echo ""

# Spustíme samotný build.
# -t definuje název a tag image (name:tag)
# . říká Dockeru, aby použil Dockerfile z aktuálního adresáře
docker build -t "$IMAGE_NAME:$IMAGE_TAG" .

echo ""
echo "========================================================"
echo "==   Sestavení Docker image bylo úspěšně dokončeno.   =="
echo "==   Image je připravena: $IMAGE_NAME:$IMAGE_TAG          =="
echo "========================================================"
echo ""
echo "Pro spuštění kontejneru na serveru použijte docker-compose up -d"