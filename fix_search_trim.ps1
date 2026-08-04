Get-ChildItem -Path 'hmcs-frontend\src' -Recurse -Filter '*.tsx' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    if ($content -match 'setSearchQuery\(e\.target\.value\)') {
        $content = $content -replace 'setSearchQuery\(e\.target\.value\)', 'setSearchQuery(e.target.value.trimStart())'
        $modified = $true
    }
    if ($content -match 'setSearch\(e\.target\.value\)') {
        $content = $content -replace 'setSearch\(e\.target\.value\)', 'setSearch(e.target.value.trimStart())'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $_.FullName -Value $content
        Write-Host "Updated $($_.FullName)"
    }
}
