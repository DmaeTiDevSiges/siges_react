import sys
import os

file_path = r"d:\AG\Siges\vps_schema_info.json"
old_str = "activities_searchable"
new_str = "activities_description"

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    sys.exit(1)

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    count = content.count(old_str)
    if count == 0:
        print(f"No occurrences of '{old_str}' found.")
    else:
        new_content = content.replace(old_str, new_str)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully replaced {count} occurrences of '{old_str}' with '{new_str}'.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
