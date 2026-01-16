$file = "c:\repos\Arc\sa-benefits-dashboard\workbook\arc-benefits-workbook.json"
$json = Get-Content $file -Raw -Encoding UTF8

# Define the pattern for single conditionalVisibility with ArcTab
$pattern = '(\s+)"conditionalVisibility":\s*\{\s*[\r\n]+\s+"parameterName":\s*"ArcTab",\s*[\r\n]+\s+"comparison":\s*"isEqualTo",\s*[\r\n]+\s+"value":\s*"([^"]+)"\s*[\r\n]+\s+\}'

# Replacement with conditionalVisibilities array
$replacement = {
    $indent = $matches[1]
    $value = $matches[2]
    @"
$indent"conditionalVisibilities": [
$indent  {
$indent    "parameterName": "ResourceType",
$indent    "comparison": "isEqualTo",
$indent    "value": "arc"
$indent  },
$indent  {
$indent    "parameterName": "ArcTab",
$indent    "comparison": "isEqualTo",
$indent    "value": "$value"
$indent  }
$indent]
"@
}

$newJson = $json -replace $pattern, $replacement
$newJson | Set-Content $file -NoNewline -Encoding UTF8

Write-Host "Updated all ArcTab conditional visibilities" -ForegroundColor Green
