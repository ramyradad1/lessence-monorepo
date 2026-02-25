const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/[locale]/admin/returns/[id]/page.tsx',
  'apps/web/src/app/[locale]/admin/page.tsx',
  'apps/web/src/app/[locale]/admin/products/page.tsx',
  'apps/web/src/app/[locale]/admin/orders/[id]/page.tsx',
  'apps/web/src/app/[locale]/admin/customers/[id]/page.tsx',
  'apps/web/src/app/[locale]/admin/bundles/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert imports if not present
  if (!content.includes("import { useLocale } from 'next-intl';")) {
    const importPosition = content.indexOf('export default function');
    if (importPosition !== -1) {
      content = content.slice(0, importPosition) + 
        `import { useLocale } from 'next-intl';\nimport { formatCurrency } from '@lessence/core';\n\n` + 
        content.slice(importPosition);
    }
  }

  // Insert const locale = useLocale(); inside the component
  if (!content.includes('const locale = useLocale();')) {
     content = content.replace(/export default function .*?\(.*?\) .*?\{/, match => `${match}\n  const locale = useLocale();`);
  }

  // Replacements
  content = content.replace(/\$\{([^\}]+?)\.toFixed\(\d+\)\}/g, '{formatCurrency($1, locale)}');
  content = content.replace(/>\$([^\<]+?)\.toFixed\(\d+\)</g, '>{formatCurrency($1, locale)}<');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
