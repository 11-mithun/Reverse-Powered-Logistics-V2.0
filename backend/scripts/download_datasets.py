#!/usr/bin/env python3
"""
Dataset Download + Generation Script for RL Platform
Run: python scripts/download_datasets.py
"""
import os, csv, random, json
from pathlib import Path

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
DATASETS_DIR.mkdir(exist_ok=True)

CATEGORIES = ["Electronics","Clothing","Home & Kitchen","Sports","Furniture","Books","Toys","Beauty","Automotive"]
REASONS = [
    ("Product is defective, stopped working after 2 days","Moderate Damage"),
    ("Wrong item delivered","No Damage"),
    ("Product not as described in listing","Minor Damage"),
    ("Changed my mind, don't need it","No Damage"),
    ("Size doesn't fit properly","No Damage"),
    ("Quality much lower than expected","Moderate Damage"),
    ("Missing parts in the package","Moderate Damage"),
    ("Dead on arrival, never worked","Severe Damage"),
    ("Minor scratch on the surface","Minor Damage"),
    ("Received damaged packaging","Minor Damage"),
    ("Duplicate order placed","No Damage"),
    ("Screen cracked during delivery","Severe Damage"),
    ("Battery drains in one hour","Moderate Damage"),
    ("Water damage inside device","Severe Damage"),
    ("Cosmetic damage on body","Minor Damage"),
    ("Device shattered when dropped","Severe Damage"),
    ("Product stopped working entirely","Severe Damage"),
    ("Wrong color delivered","No Damage"),
    ("Doesn't fit my use case","No Damage"),
    ("Packaging damage only, product fine","Minor Damage"),
]
PRODUCTS = [
    ("Bluetooth Headphones","Electronics",2999),("Running Shoes","Sports",1899),
    ("LED TV 32 inch","Electronics",15999),("Cotton T-Shirt","Clothing",499),
    ("Cookware Set","Home & Kitchen",1299),("Yoga Mat","Sports",799),
    ("Laptop Backpack","Electronics",1599),("Office Chair","Furniture",8999),
    ("Face Cream SPF","Beauty",399),("Board Game","Toys",649),
    ("Wireless Gaming Mouse","Electronics",1799),("Denim Jacket","Clothing",1499),
    ("Coffee Table","Furniture",4999),("Python Book","Books",599),
    ("Car Seat Cover","Automotive",2199),("Smart Watch","Electronics",5999),
    ("Protein Powder","Beauty",1099),("Badminton Set","Sports",899),
    ("Instant Pot","Home & Kitchen",3499),("Action Figure Set","Toys",299),
]
CITIES = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Surat"]
SUPPLIERS = ["TechVista Ltd","FashionHub India","HomeDecor Co","SportGear India","FurniWorld","BookBazaar","AutoParts India","GlobalImports"]
ACTION_MAP = {
    "No Damage":"Restock","Minor Damage":"Repack and Discount",
    "Moderate Damage":"Refurbish","Severe Damage":"Liquidate"
}
ROUTE_MAP = {
    "Restock":"Main Warehouse","Repack and Discount":"Discount Inventory Zone",
    "Refurbish":"Repair Center","Liquidate":"Liquidation Partner","Scrap / E-Waste":"Recycling Unit"
}


def generate_synthetic(count=1000):
    print(f"Generating {count} synthetic returns...")
    rows = []
    for i in range(count):
        prod = random.choice(PRODUCTS)
        reason_text, damage = random.choice(REASONS)
        days = random.randint(1, 30)
        price = round(prod[2] * random.uniform(0.85, 1.15), 2)
        repair = round(random.uniform(0, price * 0.25), 2) if damage in ["Moderate Damage","Severe Damage"] else 0
        city = random.choice(CITIES)
        sv_base = {"No Damage":90,"Minor Damage":77,"Moderate Damage":54,"Severe Damage":15}[damage]
        salvage = round(max(sv_base - days * 0.15, 5), 1)
        resale = round(price * salvage / 100, 2)
        holding = round(0.02 * price * (days / 10), 2)
        transport = round(0.05 * price, 2)
        nrv = round(resale - repair - holding - transport, 2)
        action = ACTION_MAP[damage]
        if nrv < 0: action = "Scrap / E-Waste"
        rows.append({
            "id": i+1,
            "order_id": f"ORD-{random.randint(10000,99999)}",
            "customer_email": f"cust{random.randint(1000,9999)}@example.com",
            "product_name": prod[0],
            "category": prod[1],
            "product_price": price,
            "sku": f"SKU-{i+1:04d}",
            "supplier_name": random.choice(SUPPLIERS),
            "return_reason": reason_text,
            "days_since_purchase": days,
            "warehouse_location": city,
            "repair_cost": repair,
            "damage_level": damage,
            "salvage_value_percent": salvage,
            "resale_value": resale,
            "holding_cost": holding,
            "transport_cost": transport,
            "net_recovery_value": nrv,
            "recommended_action": action,
            "routing_destination": ROUTE_MAP[action],
            "fraud_risk": random.choices(["Low","Medium","High"], weights=[60,30,10])[0],
            "priority_level": "High" if salvage > 80 or days < 5 else "Medium" if salvage > 50 else "Low",
            "reuse_possible": action in ("Restock","Repack and Discount","Refurbish"),
            "recycling_needed": action in ("Scrap / E-Waste","Liquidate"),
            "waste_reduction": "Low" if damage=="No Damage" else "High" if damage=="Severe Damage" else "Medium",
        })
    csv_path = DATASETS_DIR / "synthetic_returns_1000.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader(); writer.writerows(rows)
    json_path = DATASETS_DIR / "synthetic_returns_1000.json"
    with open(json_path, "w") as f:
        json.dump(rows, f, indent=2)
    print(f"  Saved {count} rows -> datasets/synthetic_returns_1000.csv + .json")
    return rows


def try_download_uci():
    """Try to download UCI Online Retail II dataset."""
    import urllib.request, zipfile
    dest = DATASETS_DIR / "uci_online_retail"
    dest.mkdir(exist_ok=True)
    url = "https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip"
    zip_path = dest / "online_retail_ii.zip"
    print(f"Downloading UCI Online Retail II from {url}...")
    print("  (44 MB, license: CC BY 4.0)")
    try:
        def progress(b, bs, total):
            if total > 0:
                print(f"\r  {min(100,int(b*bs/total*100))}%", end="", flush=True)
        urllib.request.urlretrieve(url, zip_path, reporthook=progress)
        print()
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(dest)
        zip_path.unlink()
        print("  Saved -> datasets/uci_online_retail/")
        return True
    except Exception as e:
        print(f"  Download failed: {e}")
        print("  Manual: https://archive.ics.uci.edu/dataset/502/online+retail+ii")
        return False


def write_datasets_readme():
    readme = """# RL Platform — Datasets

## Included Datasets

### synthetic_returns_1000.csv (auto-generated, always available)
1,000 rows with full OSCM decision labels for ML training.
Fields: product_name, category, price, days, damage_level, action, nrv, fraud_risk, etc.

### uci_online_retail/ (downloaded if network available)
UCI Online Retail II — 1M+ real e-commerce transactions
License: CC BY 4.0  |  https://archive.ics.uci.edu/dataset/502/online+retail+ii

## Kaggle Datasets (free manual download)
1. https://kaggle.com/datasets/thedevastator/analyzing-product-returns-in-e-commerce
2. https://kaggle.com/datasets/nidozhussain/ecommerce-shipping-dataset
3. https://kaggle.com/datasets/harshsingh2209/supply-chain-analysis

## How to use for training
    python scripts/train_models.py
    python scripts/train_models.py --dataset datasets/your_custom.csv

## Batch import into the platform
    Upload any CSV at: http://localhost:3000/returns/batch
    Sample template: GET http://localhost:5000/api/datasets/sample
"""
    (DATASETS_DIR / "README.md").write_text(readme)
    print("  Written datasets/README.md")


if __name__ == "__main__":
    print("=" * 55)
    print("  RL Platform — Dataset Download & Generation")
    print("=" * 55)
    rows = generate_synthetic(1000)
    try:
        try_download_uci()
    except Exception as e:
        print(f"  UCI download skipped: {e}")
    write_datasets_readme()
    print("\nKaggle Datasets (manual download):")
    for u in [
        "https://kaggle.com/datasets/thedevastator/analyzing-product-returns-in-e-commerce",
        "https://kaggle.com/datasets/nidozhussain/ecommerce-shipping-dataset",
    ]:
        print(f"  {u}")
    print(f"\nDone! {len(rows)} synthetic rows ready.")
    print("Next: python scripts/train_models.py")
