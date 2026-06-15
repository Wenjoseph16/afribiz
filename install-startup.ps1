$shortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AfriBiz.lnk"
$batPath = "$PSScriptRoot\start-dev.bat"

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = "$PSScriptRoot"
$shortcut.WindowStyle = 7
$shortcut.Description = "AfriBiz - Demarrage automatique des serveurs"
$shortcut.Save()

Write-Host "Raccourci cree dans le demarrage Windows : $shortcutPath"
Write-Host "Les serveurs AfriBiz demarreront automatiquement au prochain demarrage de Windows."
Write-Host ""
Write-Host "Pour lancer maintenant : double-cliquez sur start-dev.bat"
