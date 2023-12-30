Clear-Host
Set-Location ".."
& nodemon "start-module.js" "--test"
Set-Location "cli"
Pause
Clear-Host