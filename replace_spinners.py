import os
import re

directory = '/home/edukmattos/Projetos/siges_react'

div_pattern = re.compile(r'<div[^>]*className="[^"]*animate-spin[^"]*"[^>]*>(?:</div>)?', re.IGNORECASE)
span_pattern = re.compile(r'<span[^>]*className="[^"]*animate-spin[^"]*"[^>]*>(?:.*?)</span>', re.IGNORECASE)
span_self_closing_pattern = re.compile(r'<span[^>]*className="[^"]*animate-spin[^"]*"[^>]*/>', re.IGNORECASE)
hi_pattern = re.compile(r'<HiOutlineDotsCircleHorizontal[^>]*className="[^"]*animate-spin[^"]*"[^>]*/>', re.IGNORECASE)

# Some sizes logic based on w-X h-X
def get_size(match_text):
    if 'w-12' in match_text or 'h-12' in match_text or 'text-4xl' in match_text:
        return 'md'
    elif 'w-8' in match_text or 'h-8' in match_text:
        return 'sm'
    elif 'w-10' in match_text or 'h-10' in match_text:
        return 'sm'
    else:
        return 'xs'

def replace_match(m):
    text = m.group(0)
    size = get_size(text)
    return f'<Loading size="{size}" />'

for root, _, files in os.walk(directory):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            new_content = div_pattern.sub(replace_match, new_content)
            # For spans, we only want to replace if it's a fixed animate-spin, not dynamic like `${... ? 'animate-spin' : ''}`
            # Actually, let's replace all if it's pure string className.
            # But wait, we shouldn't break dynamic strings like `className={"..."}`.
            
            # Let's write a safe replacer for spans
            def safe_span_replace(m):
                text = m.group(0)
                if '${' in text:
                    return text # Skip dynamic
                size = get_size(text)
                return f'<Loading size="{size}" />'
                
            new_content = span_pattern.sub(safe_span_replace, new_content)
            new_content = span_self_closing_pattern.sub(safe_span_replace, new_content)
            new_content = hi_pattern.sub(safe_span_replace, new_content)

            if new_content != content:
                # Add import if missing
                if '<Loading' in new_content and 'import { Loading }' not in new_content:
                    # Calculate relative path
                    # e.g. from views/Users/ProfileScreen.tsx to components/ui/Loading
                    rel_path = os.path.relpath('/home/edukmattos/Projetos/siges_react/components/ui/Loading', os.path.dirname(path))
                    # replace \ with /
                    rel_path = rel_path.replace('\\', '/')
                    if not rel_path.startswith('.'):
                        rel_path = './' + rel_path
                    import_statement = f"import {{ Loading }} from '{rel_path}';\n"
                    
                    # Insert after the last import
                    lines = new_content.split('\n')
                    last_import_idx = 0
                    for i, line in enumerate(lines):
                        if line.startswith('import '):
                            last_import_idx = i
                    lines.insert(last_import_idx + 1, import_statement)
                    new_content = '\n'.join(lines)
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
