"""
Datasets Blueprint — Feature info, sample downloads, and dataset management.
Open-source datasets: UCI Online Retail II, Kaggle Returns, Mendeley.
"""
from flask import Blueprint, jsonify, request, Response
from app import db
from app.models.return_item import ReturnItem
from app.models.warehouse import Product
from app.utils.auth import require_auth
import json, csv, io

datasets_bp = Blueprint("datasets", __name__)

OPEN_SOURCE_DATASETS = [
    {
        "name": "UCI Online Retail II",
        "description": "541,909 transactions from UK-based online retailer. Contains returns (negative quantities).",
        "url": "https://archive.ics.uci.edu/dataset/502/online+retail+ii",
        "direct_download": "https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip",
        "license": "CC BY 4.0",
        "format": "XLSX",
        "rows": 541909,
        "size_mb": 45,
        "columns": ["InvoiceNo","StockCode","Description","Quantity","InvoiceDate","UnitPrice","CustomerID","Country"],
        "returns_identifier": "Negative Quantity values = returns",
        "script": "scripts/download_datasets.py --dataset uci_retail",
    },
    {
        "name": "Kaggle E-Commerce Shipping Dataset",
        "description": "10,999 shipment records with product, logistics, and customer data.",
        "url": "https://www.kaggle.com/datasets/prachi13/customer-churn-dataset",
        "license": "CC0 Public Domain",
        "format": "CSV",
        "rows": 10999,
        "size_mb": 1,
        "script": "scripts/download_datasets.py --dataset kaggle_shipping",
    },
    {
        "name": "Brazilian E-Commerce (Olist)",
        "description": "100k orders from 2016-2018 with order status, payments, reviews, and logistics.",
        "url": "https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce",
        "license": "CC BY-NC-SA 4.0",
        "format": "CSV (multiple files)",
        "rows": 99441,
        "size_mb": 42,
        "script": "scripts/download_datasets.py --dataset olist",
    },
    {
        "name": "Mendeley Reverse Logistics Dataset",
        "description": "Research dataset focused on reverse logistics operations and returns processing.",
        "url": "https://data.mendeley.com/datasets/3k3gcdbkzb/1",
        "license": "CC BY 4.0",
        "format": "CSV",
        "rows": 5000,
        "size_mb": 2,
        "script": "scripts/download_datasets.py --dataset mendeley_rl",
    },
    {
        "name": "Synthetic RL Platform Dataset",
        "description": "Auto-generated dataset using faker + realistic e-commerce return patterns. No download needed.",
        "url": "Built-in",
        "license": "MIT",
        "format": "SQLite / JSON",
        "rows": 150,
        "size_mb": 0.1,
        "script": "Already seeded on first run",
    },
]


@datasets_bp.route("/info", methods=["GET"])
def dataset_info():
    total_returns = ReturnItem.query.count()
    return jsonify({
        "platform_data": {
            "total_returns_in_db": total_returns,
            "source": "Synthetic (algorithmically generated from UCI + Kaggle patterns)",
            "categories": 9,
            "products": 20,
            "warehouses": 5,
            "partners": 8,
        },
        "open_source_datasets": OPEN_SOURCE_DATASETS,
        "how_to_use": {
            "step_1": "Run: python scripts/download_datasets.py --all",
            "step_2": "Run: python scripts/train_models.py",
            "step_3": "Models saved to backend/models_trained/",
            "step_4": "Restart Flask — it auto-loads trained models",
        }
    })


@datasets_bp.route("/sample", methods=["GET"])
def sample_csv():
    """Download a sample CSV template for batch import."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "order_id","product_name","category","product_price",
        "return_reason","days_since_purchase","warehouse_location",
        "repair_cost","customer_email","customer_name","sku","supplier_name"
    ])
    samples = [
        ["ORD-12345","Wireless Bluetooth Headphones","Electronics",2999,
         "Product is defective, stopped working after 2 days of use",7,
         "Mumbai",200,"customer1@example.com","Rahul Sharma","SKU-0001","TechVista Pvt Ltd"],
        ["ORD-12346","Running Shoes Pro X","Sports",1899,
         "Size doesn't fit, ordered L but received M",3,
         "Delhi",0,"buyer2@example.com","Priya Nair","SKU-0002","SportGear India"],
        ["ORD-12347","Coffee Table Wooden","Furniture",4999,
         "Minor cosmetic scratch on table top from shipping",14,
         "Bangalore",150,"user3@example.com","Amit Kumar","SKU-0017","FurniWorld"],
        ["ORD-12348","Smart LED TV 32 inch","Electronics",15999,
         "Dead on arrival, screen does not turn on at all",1,
         "Chennai",0,"cust4@example.com","Sneha Joshi","SKU-0003","TechVista Pvt Ltd"],
        ["ORD-12349","Face Moisturizer SPF30","Beauty",399,
         "Wrong product delivered, ordered SPF50 received SPF30",2,
         "Hyderabad",0,"buyer5@example.com","Deepa Rao","SKU-0011","BeautyFirst"],
    ]
    writer.writerows(samples)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=rl_platform_batch_template.csv"}
    )


@datasets_bp.route("/export", methods=["GET"])
@require_auth
def export_returns():
    """Export all returns as CSV."""
    returns = ReturnItem.query.all()
    output = io.StringIO()
    if returns:
        fieldnames = list(returns[0].to_dict().keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for r in returns:
            writer.writerow(r.to_dict())
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=returns_export.csv"}
    )


@datasets_bp.route("/stats", methods=["GET"])
def dataset_stats():
    """Public stats about the platform data."""
    from sqlalchemy import func
    total = ReturnItem.query.count()
    by_cat = db.session.query(ReturnItem.category, func.count(ReturnItem.id)).group_by(ReturnItem.category).all()
    by_action = db.session.query(ReturnItem.recommended_action, func.count(ReturnItem.id)).group_by(ReturnItem.recommended_action).all()
    return jsonify({
        "total_returns": total,
        "by_category": {cat: cnt for cat, cnt in by_cat},
        "by_action": {act: cnt for act, cnt in by_action if act},
    })
