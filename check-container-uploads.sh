#!/bin/bash
# Check container directory structure and permissions
echo "=== Checking container directory structure ==="
docker exec -it $(docker ps -q --filter "name=njcabinets") ls -la /app/uploads/
echo ""
echo "=== Checking logos directory ==="
docker exec -it $(docker ps -q --filter "name=njcabinets") ls -la /app/uploads/logos/
echo ""
echo "=== Checking directory ownership ==="
docker exec -it $(docker ps -q --filter "name=njcabinets") ls -ld /app/uploads /app/uploads/logos
