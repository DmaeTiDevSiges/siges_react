import re

# Read the file
with open('schema_public.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

missing_drops = []
i = 0
while i < len(lines):
    line = lines[i]
    # Check if this is a CREATE FUNCTION line
    if line.strip().startswith('CREATE FUNCTION public.'):
        # Look back up to 5 lines to see if there's a DROP statement
        has_drop = False
        for j in range(max(0, i-5), i):
            if 'DROP FUNCTION IF EXISTS' in lines[j]:
                has_drop = True
                break
        
        if not has_drop:
            # Extract function name
            match = re.search(r'CREATE FUNCTION public\.([a-zA-Z_0-9]+)\(', line)
            if match:
                func_name = match.group(1)
                missing_drops.append((i+1, func_name))
    i += 1

print(f"Found {len(missing_drops)} functions missing DROP statements:\n")
for line_num, func_name in missing_drops[:20]:  # Show first 20
    print(f"Line {line_num}: {func_name}")

if len(missing_drops) > 20:
    print(f"\n... and {len(missing_drops) - 20} more")
