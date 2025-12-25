$files = @('scripts/scan-nmap.sh', 'scripts/enrich-nmap.sh', 'scripts/scan-arp.sh')
foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content.Replace("`r`n", "`n")
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "Converted $file to LF"
}
