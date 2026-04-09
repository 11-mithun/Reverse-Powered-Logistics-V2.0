"""
Synthetic dataset generator — creates realistic e-commerce return data.
Based on patterns from UCI Online Retail II dataset (open source).
No external downloads needed; all data is algorithmically generated.
"""
import random
import uuid
from datetime import datetime, timedelta
from app import db


CATEGORIES = ["Electronics", "Clothing", "Home & Kitchen", "Sports", "Furniture",
              "Books", "Toys", "Beauty", "Automotive"]

RETURN_REASONS = [
    "Product is defective, stopped working after 2 days",
    "Wrong item delivered",
    "Product not as described in listing",
    "Changed my mind, don't need it anymore",
    "Size doesn't fit properly",
    "Quality is much lower than expected",
    "Missing parts in the package",
    "Dead on arrival, never worked",
    "Minor scratch on the surface",
    "Received a damaged package",
    "Duplicate order, bought twice",
    "Found a better price elsewhere",
    "Product doesn't match the photo",
    "Cosmetic damage during shipping",
    "Device has screen defect",
]

SUPPLIERS = ["TechVista Pvt Ltd", "FashionHub India", "HomeDecor Co",
             "SportGear India", "FurniWorld", "BookBazaar", "ToyLand",
             "BeautyFirst", "AutoParts India", "GlobalImports Ltd"]

CITIES = [
    ("Mumbai", 19.076, 72.877), ("Delhi", 28.704, 77.102),
    ("Bangalore", 12.972, 77.594), ("Chennai", 13.083, 80.270),
    ("Hyderabad", 17.385, 78.487), ("Pune", 18.520, 73.856),
    ("Kolkata", 22.573, 88.364), ("Ahmedabad", 23.023, 72.572),
    ("Jaipur", 26.913, 75.787), ("Surat", 21.170, 72.831),
]

PRODUCTS = [
    {"name": "Wireless Bluetooth Headphones", "cat": "Electronics", "price": 2999},
    {"name": "Running Shoes Pro X", "cat": "Sports", "price": 1899},
    {"name": "Smart LED TV 32 inch", "cat": "Electronics", "price": 15999},
    {"name": "Cotton Casual T-Shirt", "cat": "Clothing", "price": 499},
    {"name": "Non-stick Cookware Set", "cat": "Home & Kitchen", "price": 1299},
    {"name": "Yoga Mat Premium", "cat": "Sports", "price": 799},
    {"name": "Laptop Backpack 15.6", "cat": "Electronics", "price": 1599},
    {"name": "Office Chair Ergonomic", "cat": "Furniture", "price": 8999},
    {"name": "Protein Shake Vanilla", "cat": "Beauty", "price": 1099},
    {"name": "Board Game Family Fun", "cat": "Toys", "price": 649},
    {"name": "Face Moisturizer SPF30", "cat": "Beauty", "price": 399},
    {"name": "Car Seat Cover Set", "cat": "Automotive", "price": 2199},
    {"name": "Python Programming Book", "cat": "Books", "price": 599},
    {"name": "Stainless Steel Water Bottle", "cat": "Home & Kitchen", "price": 349},
    {"name": "Wireless Gaming Mouse", "cat": "Electronics", "price": 1799},
    {"name": "Denim Jacket Classic", "cat": "Clothing", "price": 1499},
    {"name": "Coffee Table Wooden", "cat": "Furniture", "price": 4999},
    {"name": "Action Figure Set", "cat": "Toys", "price": 299},
    {"name": "Badminton Racket Set", "cat": "Sports", "price": 899},
    {"name": "Instant Pot Electric", "cat": "Home & Kitchen", "price": 3499},
]


def seed_all():
    """Seed warehouses, partners, products, and returns."""
    _seed_warehouses()
    _seed_partners()
    _seed_products()
    _seed_returns(count=150)
    db.session.commit()
    print("✅ Seeded 150 returns, 5 warehouses, 8 partners, 20 products.")


def _seed_warehouses():
    from app.models.warehouse import Warehouse
    types = ["main", "repair", "discount", "liquidation", "recycling"]
    type_names = {
        "main": "Main Distribution Center",
        "repair": "Refurbishment & Repair Hub",
        "discount": "Discount Inventory Zone",
        "liquidation": "Liquidation Staging Area",
        "recycling": "E-Waste & Recycling Unit",
    }
    selected_cities = random.sample(CITIES, 5)
    for i, (wtype, city) in enumerate(zip(types, selected_cities)):
        city_name, lat, lng = city
        w = Warehouse(
            id=str(uuid.uuid4()),
            name=f"{city_name} {type_names[wtype]}",
            location=f"{city_name}, India",
            city=city_name,
            lat=lat + random.uniform(-0.05, 0.05),
            lng=lng + random.uniform(-0.05, 0.05),
            capacity=random.randint(500, 2000),
            current_load=random.randint(50, 400),
            warehouse_type=wtype,
            is_active=True,
        )
        db.session.add(w)


def _seed_partners():
    from app.models.warehouse import Partner
    partner_data = [
        ("QuickFix Electronics", "repair", "Bangalore", 12.95, 77.58, 4.5, 3, 12.0, "Electronics,Automotive"),
        ("RefurbPro India", "repair", "Mumbai", 19.08, 72.88, 4.2, 5, 10.0, "Electronics,Home & Kitchen"),
        ("ClearSale Liquidators", "liquidation", "Delhi", 28.70, 77.10, 4.0, 2, 8.0, "Clothing,Sports,Toys"),
        ("GreenRecycle Hub", "recycling", "Chennai", 13.08, 80.27, 4.7, 4, 5.0, "Electronics,Furniture"),
        ("ValueDeal Partners", "liquidation", "Hyderabad", 17.39, 78.49, 3.8, 1, 7.0, "Beauty,Books,Clothing"),
        ("TechRepair Masters", "repair", "Pune", 18.52, 73.86, 4.6, 4, 14.0, "Electronics"),
        ("EcoDispose India", "recycling", "Kolkata", 22.57, 88.36, 4.3, 6, 4.0, "All Categories"),
        ("BulkBuy Wholesale", "liquidation", "Ahmedabad", 23.02, 72.57, 3.9, 2, 9.0, "Home & Kitchen,Sports"),
    ]
    for p in partner_data:
        partner = Partner(
            id=str(uuid.uuid4()),
            name=p[0], partner_type=p[1], city=p[2],
            lat=p[3], lng=p[4], rating=p[5],
            avg_turnaround_days=p[6], avg_cost_percent=p[7],
            specializations=p[8],
            contact_email=f"contact@{p[0].lower().replace(' ', '')}.in",
        )
        db.session.add(partner)


def _seed_products():
    from app.models.warehouse import Product
    for i, p in enumerate(PRODUCTS):
        sold = random.randint(200, 2000)
        returned = random.randint(5, int(sold * 0.25))
        product = Product(
            id=str(uuid.uuid4()),
            sku=f"SKU-{i+1:04d}",
            name=p["name"],
            category=p["cat"],
            supplier_name=random.choice(SUPPLIERS),
            base_price=p["price"],
            total_sold=sold,
            total_returned=returned,
            return_rate=returned / sold,
            risk_score=round(random.uniform(0.1, 0.9), 2),
        )
        db.session.add(product)


def _seed_returns(count: int = 150):
    from app.models.return_item import ReturnItem
    from app.ai.decision_engine import rule_based_decision

    statuses = ["pending", "processing", "completed", "escalated"]
    status_weights = [0.20, 0.15, 0.55, 0.10]

    for i in range(count):
        product = random.choice(PRODUCTS)
        reason = random.choice(RETURN_REASONS)
        days = random.randint(1, 30)
        city_name, lat, lng = random.choice(CITIES)
        repair_cost = round(random.uniform(0, product["price"] * 0.25), 2)
        customer_num = random.randint(1000, 9999)

        decision = rule_based_decision(
            return_reason=reason,
            category=product["cat"],
            product_price=product["price"],
            days_since_purchase=days,
            repair_cost=repair_cost,
            warehouse_location=city_name,
        )

        sust = decision.get("sustainability", {})
        # Spread created_at over last 90 days for realistic data
        created = datetime.utcnow() - timedelta(
            days=random.randint(0, 90),
            hours=random.randint(0, 23),
        )
        status = random.choices(statuses, weights=status_weights)[0]

        r = ReturnItem(
            id=str(uuid.uuid4()),
            order_id=f"ORD-{random.randint(10000, 99999)}",
            customer_email=f"customer{customer_num}@example.com",
            customer_name=f"Customer {customer_num}",
            product_name=product["name"],
            category=product["cat"],
            product_price=product["price"],
            sku=f"SKU-{PRODUCTS.index(product)+1:04d}",
            supplier_name=random.choice(SUPPLIERS),
            return_reason=reason,
            days_since_purchase=days,
            warehouse_location=city_name,
            damage_level=decision["damage_level"],
            salvage_value_percent=decision["salvage_value_percent"],
            resale_value=decision["resale_value"],
            holding_cost=decision["holding_cost"],
            transport_cost=decision["transport_cost"],
            repair_cost=repair_cost,
            net_recovery_value=decision["net_recovery_value"],
            recommended_action=decision["recommended_action"],
            routing_destination=decision["routing_destination"],
            fraud_risk=decision["fraud_risk"],
            priority_level=decision["priority_level"],
            ai_reasoning=decision["reasoning"],
            reuse_possible=sust.get("reuse", False),
            recycling_needed=sust.get("recycling_needed", False),
            waste_reduction=sust.get("waste_reduction", "Medium"),
            clv_impact_score=round(random.uniform(0.1, 0.9), 2),
            churn_probability=round(random.uniform(0.0, 0.5), 3),
            status=status,
            created_at=created,
            processed_at=created + timedelta(hours=random.randint(1, 48)) if status == "completed" else None,
        )
        db.session.add(r)
