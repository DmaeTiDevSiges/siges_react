
import re

file_path = "d:/AG/Siges/services/dataService.ts"
pattern = re.compile(r'\.upload\(')

with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if pattern.search(line):
            print(f"{i}: {line.strip()}")
