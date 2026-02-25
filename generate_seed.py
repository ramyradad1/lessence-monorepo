import uuid
import json

def q(s):
    return "'" + s.replace("'", "''") + "'"

categories = [
    {"name_en": "Men", "name_ar": "رجالي", "slug": "men"},
    {"name_en": "Women", "name_ar": "نسائي", "slug": "women"},
    {"name_en": "Unisex", "name_ar": "للجنسين", "slug": "unisex"},
    {"name_en": "Oud", "name_ar": "عود", "slug": "oud"},
    {"name_en": "Floral", "name_ar": "زهري", "slug": "floral"},
]

for c in categories:
    c['id'] = str(uuid.uuid4())

perfumes = [
    ("Midnight Oud", "عود منتصف الليل", "oud", 120.00),
    ("Desert Rose", "وردة الصحراء", "floral", 90.00),
    ("Ocean Breeze", "نسيم المحيط", "men", 85.00),
    ("Velvet Vanilla", "فانيليا مخملية", "women", 110.00),
    ("Spicy Amber", "عنبر حار", "unisex", 130.00),
    ("Royal Musk", "مسك ملكي", "men", 150.00),
    ("Citrus Splash", "رشة حمضيات", "unisex", 75.00),
    ("Mystic Woods", "أخشاب غامضة", "men", 115.00),
    ("Sweet Jasmine", "ياسمين حلو", "women", 95.00),
    ("Golden Saffron", "زعفران ذهبي", "oud", 160.00),
    ("Spring Bloom", "زهرة الربيع", "floral", 80.00),
    ("Dark Leather", "جلد داكن", "men", 140.00),
    ("Pure Patchouli", "باتشولي نقي", "unisex", 105.00),
    ("White Linen", "كتان أبيض", "women", 85.00),
    ("Enchanted Forest", "غابة مسحورة", "unisex", 125.00),
    ("Rose Gold", "ذهب وردي", "women", 155.00),
    ("Oud Supreme", "سوبريم عود", "oud", 200.00),
    ("Aqua Marine", "أكوا مارين", "men", 90.00),
    ("Vanilla Bean", "حبة الفانيليا", "unisex", 70.00),
    ("Cherry Blossom", "زهر الكرز", "floral", 85.00)
]

with open(r"d:\Perfumes\supabase\seed.sql", "w", encoding="utf-8") as f:
    f.write("-- Clear existing data\n")
    f.write("TRUNCATE public.categories CASCADE;\n\n")
    
    f.write("-- Insert Categories\n")
    f.write("INSERT INTO public.categories (id, slug, name_en, name_ar, is_active)\nVALUES\n")
    cat_vals = []
    for c in categories:
        cat_vals.append(f"({q(c['id'])}, {q(c['slug'])}, {q(c['name_en'])}, {q(c['name_ar'])}, true)")
    f.write(",\n".join(cat_vals) + ";\n\n")

    f.write("-- Insert Products and Variants\n")
    
    for name_en, name_ar, cat_slug, price in perfumes:
        cat = next(c for c in categories if c['slug'] == cat_slug)
        prod_id = str(uuid.uuid4())
        sku = name_en.replace(" ", "").upper()[:6]
        
        f.write(f"INSERT INTO public.products (id, category_id, slug, sku, name_en, name_ar, base_price, is_active)\n")
        f.write(f"VALUES ({q(prod_id)}, {q(cat['id'])}, {q(name_en.lower().replace(' ', '-'))}, {q(sku)}, {q(name_en)}, {q(name_ar)}, {price}, true);\n")
        
        # variants
        # 50ml
        var1_id = str(uuid.uuid4())
        f.write(f"INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)\n")
        f.write(f"VALUES ({q(var1_id)}, {q(prod_id)}, {q(sku+'-50')}, 50, 'Eau de Parfum', 'ماء عطر', 0, 100);\n")
        
        # 100ml
        var2_id = str(uuid.uuid4())
        f.write(f"INSERT INTO public.product_variants (id, product_id, sku, size_ml, concentration_en, concentration_ar, price_adjustment, stock_quantity)\n")
        f.write(f"VALUES ({q(var2_id)}, {q(prod_id)}, {q(sku+'-100')}, 100, 'Eau de Parfum', 'ماء عطر', {price*0.5}, 50);\n")

print("seed.sql generated successfully")
