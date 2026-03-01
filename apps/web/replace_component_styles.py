import os
import re

def process_inline_styles(content):
    # Regex to find <Tag ... className="existing" ... style={{ ... }} ...>
    # or <Tag ... style={{ ... }} ... className="existing" ...>
    
    # We'll just do a simpler approach:
    # Find all style={{ ... }} objects. Parse the keys and values.
    # Convert them to tailwind classes if they match our known patterns.
    # We will search file by file manually if needed, or use a regex to capture className and style on the same line.
    
    matches = list(re.finditer(r'(className=["`\'])(.*?)(["`\'])([\s\S]*?)style=\{\{([^}]+)\}\}', content))
    if not matches:
        # Try reverse order: style then className
        matches = list(re.finditer(r'style=\{\{([^}]+)\}\}([\s\S]*?)(className=["`\'])(.*?)(["`\'])', content))
        if not matches:
            return content
            
    # Actually, a safer way to parse JSX in python for this specific formatting:
    def style_to_classes(style_str):
        classes = []
        style_str = style_str.strip()
        # e.g., color: 'var(--v2-text)', backgroundColor: 'var(--v2-bg-card)'
        props = re.split(r',(?=(?:[^\']*\'[^\']*\')*[^\']*$)', style_str)
        # remove anything we can't safely convert
        safe = True
        for prop in props:
            if not prop.strip(): continue
            parts = prop.split(':', 1)
            if len(parts) != 2:
                safe = False; break
            key = parts[0].strip()
            val = parts[1].strip().strip('\'"').replace(' ', '_')
            
            if key == 'color': classes.append(f'text-[{val}]')
            elif key == 'backgroundColor' or key == 'background': classes.append(f'bg-[{val}]')
            elif key == 'border': classes.append(f'border-[{val}]')
            elif key == 'borderTop': classes.append(f'border-t-[{val}]')
            elif key == 'borderBottom': classes.append(f'border-b-[{val}]')
            else: safe = False; break
        return classes if safe else None

    # Let's just do a simple string replacement based on the specific strings from the linter output, it's MUCH safer.
    return content

files_to_fix = [
    r'd:\Perfumes\apps\web\src\app\[locale]\v2\profile\page.tsx',
    r'd:\Perfumes\apps\web\src\components\GenderShowcase.tsx',
    r'd:\Perfumes\apps\web\src\components\RecentlyViewed.tsx',
    r'd:\Perfumes\apps\web\src\components\v2\FooterLuxury.tsx',
    r'd:\Perfumes\apps\web\src\components\v2\NavbarLuxury.tsx',
    r'd:\Perfumes\apps\web\src\components\v2\ProductCard.tsx',
    r'd:\Perfumes\apps\web\src\components\v2\SectionTitle.tsx',
    r'd:\Perfumes\apps\web\src\components\v2\ShopCollection.tsx',
]

for fp in files_to_fix:
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            text = f.read()
            
        # Common patterns:
        
        # color: 'var(--v2-text)' -> text-[var(--v2-text)]
        # style={{ color: 'var(--v2-text)' }}
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*color:\s*[\'"](var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}', r'className=\g<1>\g<2> text-[\g<3>]\g<1>', text)
        text = re.sub(r'style=\{\{\s*color:\s*[\'"](var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}\s*className=(["`\'])([^"`\']+?)\2', r'className=\g<2>\g<3> text-[\g<1>]\g<2>', text)
        
        # color: 'var(--v2-text-secondary)'
        
        # backgroundColor: 'var(--v2-bg-card)' -> bg-[var(--v2-bg-card)]
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*backgroundColor:\s*[\'"](var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}', r'className=\g<1>\g<2> bg-[\g<3>]\g<1>', text)
        
        # background: 'linear-gradient(...)' 
        
        # backgroundColor: 'var(--v2-bg-card)', border: '1px solid var(--v2-border)'
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*backgroundColor:\s*[\'"](var\(--[a-zA-Z0-9-]+\))[\'"],\s*border:\s*[\'"]1px solid (var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}', r'className=\g<1>\g<2> bg-[\g<3>] border border-[\g<4>]\g<1>', text)

        # borderTop: '1px solid var(--v2-border)'
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*borderTop:\s*[\'"]1px solid (var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}', r'className=\g<1>\g<2> border-t border-[\g<3>]\g<1>', text)
        
        # background: 'var(--v2-bg)'
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*background:\s*[\'"](var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}', r'className=\g<1>\g<2> bg-[background:\g<3>]\g<1>', text)
        
        # background: 'var(--v2-bg-elevated)'
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*background:\s*[\'"](var\(--[a-zA-Z0-9-]+\))[\'"]\s*\}\}', r'className=\g<1>\g<2> bg-[background:\g<3>]\g<1>', text)

        # filter: 'drop-shadow(...)'
        text = re.sub(r'className=(["`\'])([^"`\']+?)\1\s*style=\{\{\s*filter:\s*[\'"]drop-shadow\(([^)]+)\)[\'"]\s*\}\}', lambda m: f'className={m.group(1)}{m.group(2)} drop-shadow-[{m.group(3).replace(" ", "_")}]{m.group(1)}', text)

        with open(fp, 'w', encoding='utf-8') as f:
            f.write(text)
            
print("Regex replacements applied to components.")
