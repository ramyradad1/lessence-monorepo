import os
import re

file_path = r'd:\Perfumes\apps\web\src\app\[locale]\v2\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'className="flex flex-col w-full overflow-x-hidden" style={{ background: \'var\(--v2-bg-gradient, var\(--v2-bg\)\)\' }}', r'className="flex flex-col w-full overflow-x-hidden bg-[background:var(--v2-bg-gradient,var(--v2-bg))]"'),
    (r'className="relative w-full min-h-\[70vh\] md:min-h-\[85vh\] flex flex-col justify-end overflow-hidden" style={{ background: \'var\(--v2-bg-elevated-gradient, var\(--v2-bg-elevated\)\)\' }}', r'className="relative w-full min-h-[70vh] md:min-h-[85vh] flex flex-col justify-end overflow-hidden bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))]"'),
    (r'className="absolute inset-0 z-0"\s*style={{ background: \'linear-gradient\(to bottom, var\(--v2-bg-card\), var\(--v2-bg-elevated\), var\(--v2-bg\)\)\' }}', r'className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom,var(--v2-bg-card),var(--v2-bg-elevated),var(--v2-bg))]"'),
    (r'className="relative w-full py-14 sm:py-20"\s*style={{ background: \'var\(--v2-bg-gradient, var\(--v2-bg\)\)\' }}', r'className="relative w-full py-14 sm:py-20 bg-[background:var(--v2-bg-gradient,var(--v2-bg))]"'),
    (r'className="text-2xl sm:text-3xl md:text-4xl font-serif text-center tracking-\[0.08em\] sm:tracking-\[0.12em\] leading-tight uppercase"\s*style={{ color: \'var\(--v2-text\)\' }}', r'className="text-2xl sm:text-3xl md:text-4xl font-serif text-center tracking-[0.08em] sm:tracking-[0.12em] leading-tight uppercase text-[var(--v2-text)]"'),
    (r'className="block group relative aspect-square overflow-hidden transition-all duration-500"\s*style={{ backgroundColor: \'var\(--v2-bg-card\)\', border: \'1px solid var\(--v2-border\)\' }}', r'className="block group relative aspect-square overflow-hidden transition-all duration-500 bg-[var(--v2-bg-card)] border border-[var(--v2-border)]"'),
    (r'className="object-contain"\s*style={{ filter: \'drop-shadow\(0 15px 25px rgba\(0,0,0,0.5\)\)\' }}', r'className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"'),
    (r'className="relative w-full py-14 sm:py-20 px-4 sm:px-6"\s*style={{ background: \'var\(--v2-bg-elevated-gradient, var\(--v2-bg-elevated\)\)\' }}', r'className="relative w-full py-14 sm:py-20 px-4 sm:px-6 bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))]"'),
    (r'className="block group relative transition-all duration-\[800ms\] ease-out overflow-hidden min-h-\[350px\] sm:min-h-\[420px\]"\s*style={{ backgroundColor: \'var\(--v2-bg-card\)\', border: \'1px solid var\(--v2-border\)\' }}', r'className="block group relative transition-all duration-[800ms] ease-out overflow-hidden min-h-[350px] sm:min-h-[420px] bg-[var(--v2-bg-card)] border border-[var(--v2-border)]"'),
    (r'className="object-contain"\s*style={{ filter: \'drop-shadow\(0 25px 35px var\(--v2-product-shadow\)\)\' }}', r'className="object-contain drop-shadow-[0_25px_35px_var(--v2-product-shadow)]"'),
    (r'className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center text-\[8px\] sm:text-\[9px\] uppercase tracking-\[0.2em\] sm:tracking-\[0.25em\] backdrop-blur-md z-10 transition-colors duration-700"\s*style={{ color: \'var\(--v2-text-faint\)\', backgroundColor: \'var\(--v2-bg-glass\)\', borderTop: \'1px solid var\(--v2-border\)\' }}', r'className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] backdrop-blur-md z-10 transition-colors duration-700 text-[var(--v2-text-faint)] bg-[var(--v2-bg-glass)] border-t border-[var(--v2-border)]"'),
    (r'<span className="opacity-50 group-hover:opacity-100 transition-opacity duration-700"\s*style={{ color: \'var\(--v2-text\)\' }}>', r'<span className="opacity-50 group-hover:opacity-100 transition-opacity duration-700 text-[var(--v2-text)]">'),
    (r'className="w-full py-10"\s*style={{ background: \'var\(--v2-bg-gradient, var\(--v2-bg\)\)\', borderTop: \'1px solid var\(--v2-border\)\' }}', r'className="w-full py-10 bg-[background:var(--v2-bg-gradient,var(--v2-bg))] border-t border-[var(--v2-border)]"'),
    (r'className="relative w-full py-28 md:py-40 overflow-hidden"\s*style={{ background: \'var\(--v2-bg-elevated-gradient, var\(--v2-bg-elevated\)\)\' }}', r'className="relative w-full py-28 md:py-40 overflow-hidden bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))]"'),
    (r'className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight italic tracking-wide"\s*style={{ color: \'var\(--v2-text\)\' }}', r'className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight italic tracking-wide text-[var(--v2-text)]"'),
    (r'className="relative w-full py-16 sm:py-24 overflow-hidden"\s*style={{ background: \'var\(--v2-bg-gradient, var\(--v2-bg\)\)\', borderTop: \'1px solid var\(--v2-border\)\' }}', r'className="relative w-full py-16 sm:py-24 overflow-hidden bg-[background:var(--v2-bg-gradient,var(--v2-bg))] border-t border-[var(--v2-border)]"'),
    (r'className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6 sm:mb-8"\s*style={{ color: \'var\(--v2-text\)\' }}', r'className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6 sm:mb-8 text-[var(--v2-text)]"'),
    (r'className="text-base sm:text-lg leading-relaxed mb-6"\s*style={{ color: \'var\(--v2-text-secondary\)\' }}', r'className="text-base sm:text-lg leading-relaxed mb-6 text-[var(--v2-text-secondary)]"'),
    (r'className="w-full pt-10 pb-20 overflow-hidden"\s*style={{ background: \'var\(--v2-bg-elevated-gradient, var\(--v2-bg-elevated\)\)\', borderTop: \'1px solid var\(--v2-border\)\' }}', r'className="w-full pt-10 pb-20 overflow-hidden bg-[background:var(--v2-bg-elevated-gradient,var(--v2-bg-elevated))] border-t border-[var(--v2-border)]"'),
]

new_content = content
for old, new in replacements:
    new_content = re.sub(old, new, new_content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("No changes made, regex might not have matched correctly")
