-- Clear existing data
TRUNCATE public.categories CASCADE;

-- Insert Categories
INSERT INTO public.categories (id, slug, name_en, name_ar, is_active)
VALUES
('451d1242-6714-43f0-91b5-15a7700f2434', 'men', 'Men', 'رجالي', true),
('34421060-99ff-4d9f-afc1-502fd242dd67', 'women', 'Women', 'نسائي', true),
('39432f03-afa6-4ccf-a13d-19d99ab98181', 'unisex', 'Unisex', 'للجنسين', true),
('6bdfcf01-9866-4246-a401-baad58f951ac', 'oud', 'Oud', 'عود', true),
('6fe7831d-f892-43a6-b2b6-46063690437d', 'floral', 'Floral', 'زهري', true);

-- Insert Products and Variants
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('18384223-6de5-49e7-85aa-01501c17fb86', '6bdfcf01-9866-4246-a401-baad58f951ac', 'midnight-oud', 'MIDNIG', 'Midnight Oud', 'عود منتصف الليل', 120.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('1422a138-1506-4e5d-9552-23619be290a1', '18384223-6de5-49e7-85aa-01501c17fb86', 'MIDNIG-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('0931f7a0-bcea-4914-8450-6a17c113d556', '18384223-6de5-49e7-85aa-01501c17fb86', 'MIDNIG-100', 100, 'Eau de Parfum', 'ماء عطر', 60.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('690e5122-0518-46c1-83e8-569604d9c269', '6fe7831d-f892-43a6-b2b6-46063690437d', 'desert-rose', 'DESERT', 'Desert Rose', 'وردة الصحراء', 90.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('33923c34-b335-40b1-a62e-1302411c186b', '690e5122-0518-46c1-83e8-569604d9c269', 'DESERT-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('63058d61-3e55-4e36-b25c-3b758283db7c', '690e5122-0518-46c1-83e8-569604d9c269', 'DESERT-100', 100, 'Eau de Parfum', 'ماء عطر', 45.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('b2171880-0e1a-4ccb-adac-3e29ef73e78c', '451d1242-6714-43f0-91b5-15a7700f2434', 'ocean-breeze', 'OCEANB', 'Ocean Breeze', 'نسيم المحيط', 85.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('15428f14-e7f3-4198-88ba-deb333aad62f', 'b2171880-0e1a-4ccb-adac-3e29ef73e78c', 'OCEANB-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('0e2dc89c-2649-4ba8-b292-3860dcdc8c22', 'b2171880-0e1a-4ccb-adac-3e29ef73e78c', 'OCEANB-100', 100, 'Eau de Parfum', 'ماء عطر', 42.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('4cd9aa5e-f832-48d5-b500-5036f8284e08', '34421060-99ff-4d9f-afc1-502fd242dd67', 'velvet-vanilla', 'VELVET', 'Velvet Vanilla', 'فانيليا مخملية', 110.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('8a1ee46d-963f-40e2-99c4-0d423c653e45', '4cd9aa5e-f832-48d5-b500-5036f8284e08', 'VELVET-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('d9c83ff0-ee5a-445c-9d8a-91c791636a84', '4cd9aa5e-f832-48d5-b500-5036f8284e08', 'VELVET-100', 100, 'Eau de Parfum', 'ماء عطر', 55.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('8b03687c-ffb4-49d4-a8e2-f09693dbee09', '39432f03-afa6-4ccf-a13d-19d99ab98181', 'spicy-amber', 'SPICYA', 'Spicy Amber', 'عنبر حار', 130.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('323703ac-caa9-4d67-8b8b-f25bad723097', '8b03687c-ffb4-49d4-a8e2-f09693dbee09', 'SPICYA-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('4b4e11cc-9ab1-43d3-b084-66b8583f988c', '8b03687c-ffb4-49d4-a8e2-f09693dbee09', 'SPICYA-100', 100, 'Eau de Parfum', 'ماء عطر', 65.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('27146d17-d9ec-4ed0-9243-efbfb2acc0b6', '451d1242-6714-43f0-91b5-15a7700f2434', 'royal-musk', 'ROYALM', 'Royal Musk', 'مسك ملكي', 150.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('40f08cf5-b45f-44b8-9563-6c21ce8981e1', '27146d17-d9ec-4ed0-9243-efbfb2acc0b6', 'ROYALM-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('bcf7047d-365c-4660-837f-34611fe68e7a', '27146d17-d9ec-4ed0-9243-efbfb2acc0b6', 'ROYALM-100', 100, 'Eau de Parfum', 'ماء عطر', 75.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('e6b1c5cf-2d40-486d-93a3-5ac7a0d3bbe3', '39432f03-afa6-4ccf-a13d-19d99ab98181', 'citrus-splash', 'CITRUS', 'Citrus Splash', 'رشة حمضيات', 75.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('ffd2b4c2-ad45-49f4-a414-1b4a3d127789', 'e6b1c5cf-2d40-486d-93a3-5ac7a0d3bbe3', 'CITRUS-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('71aa6112-db42-433e-b450-5e0f5e434901', 'e6b1c5cf-2d40-486d-93a3-5ac7a0d3bbe3', 'CITRUS-100', 100, 'Eau de Parfum', 'ماء عطر', 37.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('c137e139-9dac-4373-b65f-3bb86a98c436', '451d1242-6714-43f0-91b5-15a7700f2434', 'mystic-woods', 'MYSTIC', 'Mystic Woods', 'أخشاب غامضة', 115.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('6d254946-abdd-450b-9b6c-9c49580a3949', 'c137e139-9dac-4373-b65f-3bb86a98c436', 'MYSTIC-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('2cca7902-065d-4ce5-aa32-8e313f763e88', 'c137e139-9dac-4373-b65f-3bb86a98c436', 'MYSTIC-100', 100, 'Eau de Parfum', 'ماء عطر', 57.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('de827788-63d6-4e3c-9f24-25d34e646506', '34421060-99ff-4d9f-afc1-502fd242dd67', 'sweet-jasmine', 'SWEETJ', 'Sweet Jasmine', 'ياسمين حلو', 95.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('e5f49e46-6721-4c42-82b2-da6d965e0759', 'de827788-63d6-4e3c-9f24-25d34e646506', 'SWEETJ-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('a63d5a84-15bb-4c98-a689-e89a507017d6', 'de827788-63d6-4e3c-9f24-25d34e646506', 'SWEETJ-100', 100, 'Eau de Parfum', 'ماء عطر', 47.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('ec125359-d0e3-4987-b2c9-ab7000e2a9b6', '6bdfcf01-9866-4246-a401-baad58f951ac', 'golden-saffron', 'GOLDEN', 'Golden Saffron', 'زعفران ذهبي', 160.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('6c83339d-70e3-4efd-afc4-0bbc807345b0', 'ec125359-d0e3-4987-b2c9-ab7000e2a9b6', 'GOLDEN-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('c5eddf0c-f80b-42a4-8aa9-ba9f3d8c2ea5', 'ec125359-d0e3-4987-b2c9-ab7000e2a9b6', 'GOLDEN-100', 100, 'Eau de Parfum', 'ماء عطر', 80.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('1e6ae3e3-f075-4b27-b00d-aa9a41ab940d', '6fe7831d-f892-43a6-b2b6-46063690437d', 'spring-bloom', 'SPRING', 'Spring Bloom', 'زهرة الربيع', 80.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('3755d1fa-39da-47ed-801c-a7f96e9a0460', '1e6ae3e3-f075-4b27-b00d-aa9a41ab940d', 'SPRING-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('b4caf36b-4742-4ff1-ad09-2c65f30ca591', '1e6ae3e3-f075-4b27-b00d-aa9a41ab940d', 'SPRING-100', 100, 'Eau de Parfum', 'ماء عطر', 40.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('9a9ac36b-6c21-4b35-b4c5-1f9f03fd9874', '451d1242-6714-43f0-91b5-15a7700f2434', 'dark-leather', 'DARKLE', 'Dark Leather', 'جلد داكن', 140.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('766a1bf4-d31a-43b8-8059-1f7ea4cdf850', '9a9ac36b-6c21-4b35-b4c5-1f9f03fd9874', 'DARKLE-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('1642f2e2-f50e-4f7b-a2d1-a64a839bcc45', '9a9ac36b-6c21-4b35-b4c5-1f9f03fd9874', 'DARKLE-100', 100, 'Eau de Parfum', 'ماء عطر', 70.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('5565e8a1-91f7-4c13-9b08-e8063ea3c215', '39432f03-afa6-4ccf-a13d-19d99ab98181', 'pure-patchouli', 'PUREPA', 'Pure Patchouli', 'باتشولي نقي', 105.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('05ee1cd8-2e61-41c3-ab5e-72016aa59d44', '5565e8a1-91f7-4c13-9b08-e8063ea3c215', 'PUREPA-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('d50b3986-bebf-46e2-9b9e-71f4d81b2bec', '5565e8a1-91f7-4c13-9b08-e8063ea3c215', 'PUREPA-100', 100, 'Eau de Parfum', 'ماء عطر', 52.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('4a28dc75-0fae-4b79-aec1-cb11353ad33d', '34421060-99ff-4d9f-afc1-502fd242dd67', 'white-linen', 'WHITEL', 'White Linen', 'كتان أبيض', 85.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('a945845f-73d8-4ec2-a20d-0b122f974107', '4a28dc75-0fae-4b79-aec1-cb11353ad33d', 'WHITEL-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('e69a0292-97c2-4faa-b541-7d36faa5ac40', '4a28dc75-0fae-4b79-aec1-cb11353ad33d', 'WHITEL-100', 100, 'Eau de Parfum', 'ماء عطر', 42.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('0dc5f05b-d1a3-4cab-b75a-e1b22874e320', '39432f03-afa6-4ccf-a13d-19d99ab98181', 'enchanted-forest', 'ENCHAN', 'Enchanted Forest', 'غابة مسحورة', 125.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('abe671d9-1688-4e69-a347-a3a0a3e08914', '0dc5f05b-d1a3-4cab-b75a-e1b22874e320', 'ENCHAN-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('518e720b-6407-4a8c-9038-3954886e4627', '0dc5f05b-d1a3-4cab-b75a-e1b22874e320', 'ENCHAN-100', 100, 'Eau de Parfum', 'ماء عطر', 62.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('d24180f0-4f42-4f0c-b4e1-287b8e15d5cd', '34421060-99ff-4d9f-afc1-502fd242dd67', 'rose-gold', 'ROSEGO', 'Rose Gold', 'ذهب وردي', 155.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('ed587095-075e-49ff-9404-51a7d1e248a3', 'd24180f0-4f42-4f0c-b4e1-287b8e15d5cd', 'ROSEGO-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('3fe37d79-fcd6-472b-bc0c-ff27314b88da', 'd24180f0-4f42-4f0c-b4e1-287b8e15d5cd', 'ROSEGO-100', 100, 'Eau de Parfum', 'ماء عطر', 77.5, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('f6df7510-99bf-4c09-92af-58f051697320', '6bdfcf01-9866-4246-a401-baad58f951ac', 'oud-supreme', 'OUDSUP', 'Oud Supreme', 'سوبريم عود', 200.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('59c3bbb4-7c75-4550-860b-f09d4079a202', 'f6df7510-99bf-4c09-92af-58f051697320', 'OUDSUP-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('ea280a5f-08fc-4d1d-8055-fef5fa1d7de6', 'f6df7510-99bf-4c09-92af-58f051697320', 'OUDSUP-100', 100, 'Eau de Parfum', 'ماء عطر', 100.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('25798cdb-957e-4234-918e-9d66e620ae76', '451d1242-6714-43f0-91b5-15a7700f2434', 'aqua-marine', 'AQUAMA', 'Aqua Marine', 'أكوا مارين', 90.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('ea2a7c6d-4b95-40ce-ace7-e44aebdf1dca', '25798cdb-957e-4234-918e-9d66e620ae76', 'AQUAMA-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('8f3811f1-e3aa-47b9-9ec4-c5012001c7e5', '25798cdb-957e-4234-918e-9d66e620ae76', 'AQUAMA-100', 100, 'Eau de Parfum', 'ماء عطر', 45.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('7eb201f0-f882-4b47-80f8-e1043c5a66f6', '39432f03-afa6-4ccf-a13d-19d99ab98181', 'vanilla-bean', 'VANILL', 'Vanilla Bean', 'حبة الفانيليا', 70.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('4a6d234c-6b4c-436d-9af0-964fed048f25', '7eb201f0-f882-4b47-80f8-e1043c5a66f6', 'VANILL-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('c1ff75bd-51b4-4d62-ae65-eff32090f603', '7eb201f0-f882-4b47-80f8-e1043c5a66f6', 'VANILL-100', 100, 'Eau de Parfum', 'ماء عطر', 35.0, 50);
INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)
VALUES ('85eef24b-eafc-4925-87c4-276eb4ebf918', '6fe7831d-f892-43a6-b2b6-46063690437d', 'cherry-blossom', 'CHERRY', 'Cherry Blossom', 'زهر الكرز', 85.0, true);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('fbda1de1-4902-485e-936d-c6ee3b288d94', '85eef24b-eafc-4925-87c4-276eb4ebf918', 'CHERRY-50', 50, 'Eau de Parfum', 'ماء عطر', 0, 100);
INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)
VALUES ('4248a625-e453-4f77-8f1c-d25c1f74e040', '85eef24b-eafc-4925-87c4-276eb4ebf918', 'CHERRY-100', 100, 'Eau de Parfum', 'ماء عطر', 42.5, 50);
