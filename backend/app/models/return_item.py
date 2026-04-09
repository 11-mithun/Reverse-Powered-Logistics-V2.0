import uuid
from datetime import datetime
from app import db


class ReturnItem(db.Model):
    __tablename__ = "return_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(50), index=True)
    customer_email = db.Column(db.String(120), index=True)
    customer_name = db.Column(db.String(100))

    # Product Info
    product_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    product_price = db.Column(db.Float, nullable=False)
    sku = db.Column(db.String(50), index=True)
    supplier_name = db.Column(db.String(100))

    # Return Context
    return_reason = db.Column(db.String(500), nullable=False)
    days_since_purchase = db.Column(db.Integer, nullable=False)
    warehouse_location = db.Column(db.String(100))
    image_path = db.Column(db.String(300))

    # AI Decision Output
    damage_level = db.Column(db.String(30))
    salvage_value_percent = db.Column(db.Float)
    resale_value = db.Column(db.Float)
    holding_cost = db.Column(db.Float)
    transport_cost = db.Column(db.Float)
    repair_cost = db.Column(db.Float, default=0.0)
    net_recovery_value = db.Column(db.Float)
    recommended_action = db.Column(db.String(50))
    routing_destination = db.Column(db.String(100))
    fraud_risk = db.Column(db.String(20))
    priority_level = db.Column(db.String(20))
    ai_reasoning = db.Column(db.Text)

    # Sustainability
    reuse_possible = db.Column(db.Boolean)
    recycling_needed = db.Column(db.Boolean)
    waste_reduction = db.Column(db.String(20))

    # CLV Impact
    clv_impact_score = db.Column(db.Float)
    churn_probability = db.Column(db.Float)

    # Status & Routing
    status = db.Column(db.String(30), default="pending")  # pending,processing,completed,escalated
    assigned_warehouse_id = db.Column(db.String(36), db.ForeignKey("warehouses.id"), nullable=True)
    assigned_partner_id = db.Column(db.String(36), db.ForeignKey("partners.id"), nullable=True)
    sla_deadline = db.Column(db.DateTime)
    processed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "customer_email": self.customer_email,
            "customer_name": self.customer_name,
            "product_name": self.product_name,
            "category": self.category,
            "product_price": self.product_price,
            "sku": self.sku,
            "supplier_name": self.supplier_name,
            "return_reason": self.return_reason,
            "days_since_purchase": self.days_since_purchase,
            "warehouse_location": self.warehouse_location,
            "damage_level": self.damage_level,
            "salvage_value_percent": self.salvage_value_percent,
            "resale_value": self.resale_value,
            "holding_cost": self.holding_cost,
            "transport_cost": self.transport_cost,
            "repair_cost": self.repair_cost,
            "net_recovery_value": self.net_recovery_value,
            "recommended_action": self.recommended_action,
            "routing_destination": self.routing_destination,
            "fraud_risk": self.fraud_risk,
            "priority_level": self.priority_level,
            "ai_reasoning": self.ai_reasoning,
            "reuse_possible": self.reuse_possible,
            "recycling_needed": self.recycling_needed,
            "waste_reduction": self.waste_reduction,
            "clv_impact_score": self.clv_impact_score,
            "churn_probability": self.churn_probability,
            "status": self.status,
            "sla_deadline": self.sla_deadline.isoformat() if self.sla_deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }
