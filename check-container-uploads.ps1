# Check container directory structure and permissions
Write-Host "=== Checking container directory structure ===" -ForegroundColor Green
docker exec -it $(docker ps -q --filter "name=njcabinets") ls -la /app/uploads/
Write-Host ""
Write-Host "=== Checking logos directory ===" -ForegroundColor Green  
docker exec -it $(docker ps -q --filter "name=njcabinets") ls -la /app/uploads/logos/
Write-Host ""
Write-Host "=== Checking directory ownership ===" -ForegroundColor Green
docker exec -it $(docker ps -q --filter "name=njcabinets") ls -ld /app/uploads /app/uploads/logos
