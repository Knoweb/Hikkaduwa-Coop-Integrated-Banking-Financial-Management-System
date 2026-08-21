# Load environment variables from .env file
if (Test-Path .env) {
    Write-Host "Loading .env file..."
    Get-Content .env | Where-Object { $_.Trim() -ne '' -and $_.StartsWith('#') -eq $false } | ForEach-Object {
        if ($_ -match '^(.*?)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
} else {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
}

Start-Process powershell -ArgumentList "-Command cd 'hmcs-api-gateway'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-Command cd 'hmcs-loan-service'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-Command cd 'hmcs-member-auth-service'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-Command cd 'hmcs-pawning-service'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-Command cd 'hmcs-reporting-service'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-Command cd 'hmcs-savings-service'; .\mvnw.cmd spring-boot:run"
