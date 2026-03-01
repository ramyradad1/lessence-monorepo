import sys

file_path = r'd:/Perfumes/apps/web/src/app/[locale]/v2/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("backgroundColor: 'var(--v2-bg)'", "background: 'var(--v2-bg-gradient, var(--v2-bg))'")
content = content.replace("backgroundColor: 'var(--v2-bg-elevated)'", "background: 'var(--v2-bg-elevated-gradient, var(--v2-bg-elevated))'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done updating page.tsx backgrounds.')
