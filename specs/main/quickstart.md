# Quickstart & Testing

## Overview
This document outlines how to quickly test the multi-platform perfumes ecommerce application.

## Prerequisites
- Node.js installed for Web
- Flutter SDK installed for Mobile
- Supabase CLI installed and logged in
- Access to the Supabase project

## Running Locally

### 1. Web Local Server
```bash
cd apps/web
npm install
npm run dev
```

### 2. Mobile Local Server
```bash
cd apps/mobile
flutter pub get
flutter run
```

### 3. Testing I18N
- Open the web app or mobile app.
- Toggle the language selector between English and Arabic.
- Verify RTL/LTR layout changes and strings.

### 4. Testing Checkout with EGP
- Add a perfume to the cart.
- Proceed to checkout.
- Verify the total price is displayed in EGP.
- Complete the order and verify the record in Supabase `orders` table.
