$file = "c:\repos\Arc\sa-benefits-dashboard\workbook\arc-benefits-workbook.json"
$json = Get-Content $file -Raw -Encoding UTF8 | ConvertFrom-Json

# Function to update items recursively
function Update-Items($item) {
    if ($item -is [PSCustomObject]) {
        # Check if this has conditionalVisibility with ArcTab
        if ($item.conditionalVisibility -and 
            $item.conditionalVisibility.parameterName -eq "ArcTab" -and
            -not $item.conditionalVisibilities) {
            
            $arcTabValue = $item.conditionalVisibility.value
            
            # Add conditionalVisibilities
            $item | Add-Member -Force -MemberType NoteProperty -Name "conditionalVisibilities" -Value @(
                [PSCustomObject]@{
                    parameterName = "ResourceType"
                    comparison = "isEqualTo"
                    value = "arc"
                },
                [PSCustomObject]@{
                    parameterName = "ArcTab"
                    comparison = "isEqualTo"
                    value = $arcTabValue
                }
            )
            
            # Remove old conditionalVisibility
            $item.PSObject.Properties.Remove('conditionalVisibility')
        }
        
        # Recursively process all properties
        $item.PSObject.Properties | ForEach-Object {
            if ($_.Value -is [PSCustomObject] -or $_.Value -is [Array]) {
                Update-Items $_.Value
            }
        }
    }
    elseif ($item -is [Array]) {
        foreach ($subItem in $item) {
            Update-Items $subItem
        }
    }
}

# Update tab parameters
foreach ($item in $json.items) {
    if ($item.type -eq 9) {
        foreach ($param in $item.content.parameters) {
            if ($param.name -eq "ArcTab") {
                $param | Add-Member -Force -MemberType NoteProperty -Name "query" -Value "print result = iff('{ResourceType}' == 'arc', '{ArcTab:value}', 'overview')`r`n| project result = iff(result == '', 'overview', result)"
                $param | Add-Member -Force -MemberType NoteProperty -Name "crossComponentResources" -Value @("value::all")
                $param | Add-Member -Force -MemberType NoteProperty -Name "isHiddenWhenLocked" -Value $true
                $param | Add-Member -Force -MemberType NoteProperty -Name "queryType" -Value 0
                $param | Add-Member -Force -MemberType NoteProperty -Name "resourceType" -Value "microsoft.resourcegraph/resources"
            }
            elseif ($param.name -eq "SqlTab") {
                $param | Add-Member -Force -MemberType NoteProperty -Name "query" -Value "print result = iff('{ResourceType}' == 'sql', '{SqlTab:value}', 'overview')`r`n| project result = iff(result == '', 'overview', result)"
                $param | Add-Member -Force -MemberType NoteProperty -Name "crossComponentResources" -Value @("value::all")
                $param | Add-Member -Force -MemberType NoteProperty -Name "isHiddenWhenLocked" -Value $true
                $param | Add-Member -Force -MemberType NoteProperty -Name "queryType" -Value 0
                $param | Add-Member -Force -MemberType NoteProperty -Name "resourceType" -Value "microsoft.resourcegraph/resources"
            }
        }
    }
}

# Update all items
Update-Items $json

# Write back
$json | ConvertTo-Json -Depth 100 | Set-Content $file -Encoding UTF8 -NoNewline

Write-Host "✓ Fixed all ArcTab conditional visibilities" -ForegroundColor Green
Write-Host "✓ Updated tab parameters to reset on ResourceType change" -ForegroundColor Green
