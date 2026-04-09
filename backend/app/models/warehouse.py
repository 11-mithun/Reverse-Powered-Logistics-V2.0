import uuid
from datetime import datetime
from app import db


class Warehouse(db.Model):
    __tablename__ = "warehouses"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    city = db.Column(db.String(100))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    capacity = db.Column(db.Integer, default=1000)
    current_load = db.Column(db.Integer, default=0)
    warehouse_type = db.Column(db.String(50))  # main, repair, discount, liquidation, recycling
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "city": self.city,
            "lat": self.lat,
            "lng": self.lng,
            "capacity": self.capacity,
            "current_load": self.current_load,
            "utilization": round(self.current_load / self.capacity * 100, 1) if self.capacity else 0,
            "warehouse_type": self.warehouse_type,
            "is_active": self.is_active,
        }


class Partner(db.Model):
    __tablename__ = "partners"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    partner_type = db.Column(db.String(50))  # repair, liquidation, recycling
    city = db.Column(db.String(100))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    rating = db.Column(db.Float, default=4.0)
    avg_turnaround_days = db.Column(db.Integer, default=5)
    avg_cost_percent = db.Column(db.Float, default=15.0)  # % of product price
    specializations = db.Column(db.String(300))  # comma-separated categories
    contact_email = db.Column(db.String(120))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "partner_type": self.partner_type,
            "city": self.city,
            "lat": self.lat,
            "lng": self.lng,
            "rating": self.rating,
            "avg_turnaround_days": self.avg_turnaround_days,
            "avg_cost_percent": self.avg_cost_percent,
            "specializations": self.specializations.split(",") if self.specializations else [],
            "contact_email": self.contact_email,
            "is_active": self.is_active,
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = db.Column(db.String(50), unique=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    supplier_name = db.Column(db.String(100))
    base_price = db.Column(db.Float, nullable=False)
    total_sold = db.Column(db.Integer, default=0)
    total_returned = db.Column(db.Integer, default=0)
    return_rate = db.Column(db.Float, default=0.0)
    risk_score = db.Column(db.Float, default=0.5)  # ML-derived 0-1
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "category": self.category,
            "supplier_name": self.supplier_name,
            "base_price": self.base_price,
            "total_sold": self.total_sold,
            "total_returned": self.total_returned,
            "return_rate": round(self.return_rate * 100, 1),
            "risk_score": self.risk_score,
        }


class Integration(db.Model):
    __tablename__ = "integrations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform = db.Column(db.String(50), nullable=False)  # shopify, woocommerce, sap, fedex
    status = db.Column(db.String(20), default="disconnected")  # connected, disconnected, error
    api_key_hash = db.Column(db.String(128))
    webhook_url = db.Column(db.String(300))
    last_sync = db.Column(db.DateTime)
    records_synced = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "platform": self.platform,
            "status": self.status,
            "webhook_url": self.webhook_url,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "records_synced": self.records_synced,
        }
