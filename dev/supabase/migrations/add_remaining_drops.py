import re

# Read the file
with open('schema_public.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match function comment blocks followed by CREATE FUNCTION without DROP
# This handles various function name patterns
pattern = r'(--\s*Name:\s*([a-zA-Z_][a-zA-Z_0-9]*)\([^)]*\);\s*Type:\s*FUNCTION[^\n]*\n--\s*\n)(?!DROP FUNCTION IF EXISTS)(CREATE FUNCTION public\.\2)'

def add_drop(match):
    comment_block = match.group(1)
    func_name = match.group(2)
    create_stmt = match.group(3)
    
    # Extract function signature (everything between parentheses after function name)
    # Look ahead in content to find the full signature
    remaining = content[match.end():]
    sig_match = re.match(r'\([^)]*\)', remaining)
    
    if sig_match:
        signature = sig_match.group(0)
        drop_stmt = f'DROP FUNCTION IF EXISTS public.{func_name}{signature};\n\n'
    else:
        # Fallback without signature
        drop_stmt = f'DROP FUNCTION IF EXISTS public.{func_name};\n\n'
    
    return f'{comment_block}{drop_stmt}{create_stmt}'

# Apply the replacement
new_content = re.sub(pattern, add_drop, content)

# Write the fixed file
with open('schema_public.sql', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✓ Added DROP statements to remaining functions")
