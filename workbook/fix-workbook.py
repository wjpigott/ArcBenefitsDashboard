import json
import re

# Read the file
with open(r"c:\repos\Arc\sa-benefits-dashboard\workbook\arc-benefits-workbook.json", 'r', encoding='utf-8') as f:
    content = f.read()

# Parse as JSON
data = json.loads(content)

# Function to recursively update items
def update_item(item):
    if isinstance(item, dict):
        # Check if this item has conditionalVisibility with ArcTab
        if ('conditionalVisibility' in item and 
            isinstance(item['conditionalVisibility'], dict) and
            item['conditionalVisibility'].get('parameterName') == 'ArcTab'):
            
            # Check if conditionalVisibilities already exists
            if 'conditionalVisibilities' not in item:
                # Create conditionalVisibilities array
                arc_tab_value = item['conditionalVisibility']['value']
                item['conditionalVisibilities'] = [
                    {
                        "parameterName": "ResourceType",
                        "comparison": "isEqualTo",
                        "value": "arc"
                    },
                    {
                        "parameterName": "ArcTab",
                        "comparison": "isEqualTo",
                        "value": arc_tab_value
                    }
                ]
                # Remove the old conditionalVisibility
                del item['conditionalVisibility']
        
        # Recursively process all values
        for key, value in list(item.items()):
            if isinstance(value, (dict, list)):
                update_item(value)
    
    elif isinstance(item, list):
        for sub_item in item:
            update_item(sub_item)

# Update ArcTab parameter to use dynamic query
for item in data.get('items', []):
    if item.get('type') == 9:  # Parameter type
        params = item.get('content', {}).get('parameters', [])
        for param in params:
            if param.get('name') == 'ArcTab':
                param['type'] = 1
                param['query'] = "print result = iff('{ResourceType}' == 'arc', '{ArcTab:value}', 'overview')\\r\\n| project result = iff(result == '', 'overview', result)"
                param['crossComponentResources'] = ["value::all"]
                param['isHiddenWhenLocked'] = True
                param['queryType'] = 0
                param['resourceType'] = "microsoft.resourcegraph/resources"
                if 'value' not in param:
                    param['value'] = 'overview'
            elif param.get('name') == 'SqlTab':
                param['type'] = 1
                param['query'] = "print result = iff('{ResourceType}' == 'sql', '{SqlTab:value}', 'overview')\\r\\n| project result = iff(result == '', 'overview', result)"
                param['crossComponentResources'] = ["value::all"]
                param['isHiddenWhenLocked'] = True
                param['queryType'] = 0
                param['resourceType'] = "microsoft.resourcegraph/resources"
                if 'value' not in param:
                    param['value'] = 'overview'

# Process all items
update_item(data)

# Write back
with open(r"c:\repos\Arc\sa-benefits-dashboard\workbook\arc-benefits-workbook.json", 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✓ Fixed all ArcTab conditional visibilities")
print("✓ Updated tab parameters to reset on ResourceType change")
