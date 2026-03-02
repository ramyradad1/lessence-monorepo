import os
import re

fixes = [
    {
        "file": r"d:\Perfumes\apps\web\src\app\[locale]\v2\products\[slug]\page.tsx",
        "subs": [
            (r'import \{ Product, formatCurrency, isRTL \} from "@lessence/core";', r'import { Product, formatCurrency } from "@lessence/core";')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\app\[locale]\v2\profile\page.tsx",
        "subs": [
            (r'const \[profile, setProfile\] = useState<any>\(null\);', r'const [profile, setProfile] = useState<Record<string, unknown> | null>(null);')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\components\ProductTypeShowcase.tsx",
        "subs": [
            (r'import \{ motion \} from "framer-motion";', r'') # Just remove the line
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\components\v2\LuxuryButton.tsx",
        "subs": [
            (r'import \{ motion, HTMLMotionProps \} from "framer-motion";', r'import { motion } from "framer-motion";'),
            (r'const ButtonComponent: any = motion\.button;', r'(motion.button as any); // Ignoring the any since framer-motion props are complex.'),
            (r'const ButtonComponent\: any \= motion\.button\;', r'')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\components\v2\ProductCard.tsx",
        "subs": [
            (r'import \{ useTranslations \} from "next-intl";\n?', r''),
            (r'const rtl = isRTL\(locale\);\n?', r'')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\components\v2\ShopCollection.tsx",
        "subs": [
            (r'setFilters: \(f: any\) => void;', r'setFilters: (f: Record<string, unknown> | string | null) => void;'),
            (r'const productCategory = \(p as any\)\.category\?\.slug \|\| \'\';', r'const productCategory = (p as { category?: { slug?: string } }).category?.slug || \'\';')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\context\StoreSettingsContext.tsx",
        "subs": [
            (r'\} catch \(error\) \{', r'} catch (_error) {')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\services\cart.service.ts",
        "subs": [
            (r'export async function syncCartToDatabase\(supabase: any, userId: string, items: any\[\]\) \{', r'export async function syncCartToDatabase(_supabase: unknown, _userId: string, _items: unknown[]) {')
        ]
    },
    {
        "file": r"d:\Perfumes\apps\web\src\services\checkout.service.ts",
        "subs": [
            (r'export async function createCheckoutSession\(items: any\[\], locale: string\) \{', r'export async function createCheckoutSession(items: unknown[], locale: string) {')
        ]
    }
]

for fix in fixes:
    fp = fix["file"]
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # apply all replacements for this file
        for pattern, replacement in fix["subs"]:
            content = re.sub(pattern, replacement, content)
            
        # specifically fix LuxuryButton.tsx manual any fix since regex might be tricky
        if "LuxuryButton.tsx" in fp:
            content = content.replace("const ButtonComponent: any = motion.button;", "const ButtonComponent = motion.button as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any")
            content = content.replace("const ButtonComponent = motion.button as any; // eslint-disable-next-line @typescript-eslint/no-explicit-any", "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const ButtonComponent = motion.button as any;")

        if "ProductTypeShowcase.tsx" in fp:
            content = content.replace('import { motion } from "framer-motion";', '')

        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)

print("TypeScript ESLint fixes applied successfully.")
