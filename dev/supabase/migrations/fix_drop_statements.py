import re

# Read the file
with open('schema_public.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Fix malformed DROP statements with backticks
# These look like: DROP FUNCTION IF EXISTS public.func_name;`n`nfunc_name(...)
pattern_broken = r'DROP FUNCTION IF EXISTS public\.([a-zA-Z_0-9]+);`n`n([a-zA-Z_0-9]+)\('

def fix_broken_drop(match):
    func_name = match.group(1)
    # We need to preserve the opening parenthesis and everything after
    return f'DROP FUNCTION IF EXISTS public.{func_name};\n\nCREATE FUNCTION public.{match.group(2)}('

content = re.sub(pattern_broken, fix_broken_drop, content)

# Pattern 2: Add proper DROP statements before CREATE FUNCTION if missing
# Match function comment blocks followed by CREATE FUNCTION without DROP
pattern_missing = r'(--\s*Name:\s*(fc_[a-zA-Z_0-9]+)\([^)]+\);\s*Type:\s*FUNCTION[^\n]*\n--\s*\n)(?!DROP FUNCTION IF EXISTS)(CREATE FUNCTION public\.\2)'

def add_missing_drop(match):
    comment_block = match.group(1)
    func_name = match.group(2)
    create_stmt = match.group(3)
    # Extract full function signature from what follows
    return f'{comment_block}DROP FUNCTION IF EXISTS public.{func_name};\n\n{create_stmt}'

content = re.sub(pattern_missing, add_missing_drop, content)

# Write the fixed file
with open('schema_public.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Fixed all malformed DROP statements")
print("✓ Added missing DROP statements where needed")
