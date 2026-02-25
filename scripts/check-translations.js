const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../packages/core/i18n/en/common.json');
const arPath = path.join(__dirname, '../packages/core/i18n/ar/common.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const enKeys = Object.keys(enJson);
const arKeys = Object.keys(arJson);

const missingInAr = enKeys.filter(key => !arKeys.includes(key));
const missingInEn = arKeys.filter(key => !enKeys.includes(key));

if (missingInAr.length === 0 && missingInEn.length === 0) {
  console.log('Translations are perfectly synced!');
} else {
  if (missingInAr.length > 0) {
    console.log('Missing in Arabic:', missingInAr);
  }
  if (missingInEn.length > 0) {
    console.log('Missing in English:', missingInEn);
  }
}
