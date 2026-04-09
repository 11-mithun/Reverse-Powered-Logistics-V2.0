from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from app import db
from app.models.return_item import ReturnItem
from app.ai.ml_models import calculate_clv_impact
from app.utils.auth import require_auth

customers_bp = Blueprint("customers", __name__)

@customers_bp.route("/portal/submit", methods=["POST"])
def portal_submit():
    """Public customer portal — no auth required."""
    d = request.get_json() or {}
    from app.ai.decision_engine import ai_decision
    import uuid
    price = float(d.get("product_price", 500))
    days = int(d.get("days_since_purchase", 7))
    decision = ai_decision(
        d.get("return_reason",""), d.get("category","Electronics"),
        price, days, 0, "India"
    )
    sust = decision.get("sustainability",{})
    r = ReturnItem(
        id=str(uuid.uuid4()),
        order_id=d.get("order_id",""),
        customer_email=d.get("customer_email",""),
        customer_name=d.get("customer_name",""),
        product_name=d.get("product_name",""),
        category=d.get("category","Electronics"),
        product_price=price,
        return_reason=d.get("return_reason",""),
        days_since_purchase=days,
        damage_level=decision["damage_level"],
        recommended_action=decision["recommended_action"],
        routing_destination=decision["routing_destination"],
        fraud_risk=decision["fraud_risk"],
        priority_level=decision["priority_level"],
        net_recovery_value=decision["net_recovery_value"],
        resale_value=decision["resale_value"],
        salvage_value_percent=decision["salvage_value_percent"],
        holding_cost=decision["holding_cost"],
        transport_cost=decision["transport_cost"],
        reuse_possible=sust.get("reuse",False),
        recycling_needed=sust.get("recycling_needed",False),
        waste_reduction=sust.get("waste_reduction","Medium"),
        status="pending",
        sla_deadline=datetime.utcnow()+timedelta(hours=72),
    )
    db.session.add(r)
    db.session.commit()
    return jsonify({"return_id": r.id, "action": decision["recommended_action"],
                    "message": "Return submitted successfully!", "decision": decision})

@customers_bp.route("/portal/track/<rid>", methods=["GET"])
def track_return(rid):
    r = ReturnItem.query.get_or_404(rid)
    return jsonify({"id":r.id,"status":r.status,"action":r.recommended_action,
                    "destination":r.routing_destination,"created_at":r.created_at.isoformat() if r.created_at else None})

@customers_bp.route("/clv", methods=["POST"])
@require_auth
def clv():
    d = request.get_json() or {}
    result = calculate_clv_impact(
        int(d.get("total_orders",5)), float(d.get("avg_order",1000)),
        int(d.get("return_count",1)), float(d.get("resolution_days",7))
    )
    return jsonify(result)


# ── SLA Blueprint ─────────────────────────────────────────────────────────
sla_bp = Blueprint("sla", __name__)

@sla_bp.route("/queue", methods=["GET"])
@require_auth
def priority_queue():
    now = datetime.utcnow()
    items = ReturnItem.query.filter(
        ReturnItem.status.in_(["pending","processing"])
    ).order_by(ReturnItem.sla_deadline).limit(100).all()
    result = []
    for r in items:
        mins_left = None
        if r.sla_deadline:
            mins_left = int((r.sla_deadline - now).total_seconds() / 60)
        urgency = "critical" if (mins_left or 999) < 60 else \
                  "high" if (mins_left or 999) < 240 else \
                  "medium" if (mins_left or 999) < 1440 else "low"
        result.append({**r.to_dict(), "minutes_remaining": mins_left, "urgency": urgency})
    return jsonify(result)

@sla_bp.route("/escalate/<rid>", methods=["POST"])
@require_auth
def escalate(rid):
    r = ReturnItem.query.get_or_404(rid)
    r.status = "escalated"
    r.priority_level = "High"
    db.session.commit()
    from app import socketio
    socketio.emit("sla_escalation", r.to_dict())
    return jsonify(r.to_dict())


# ── Datasets Blueprint ────────────────────────────────────────────────────
datasets_bp = Blueprint("datasets", __name__)

@datasets_bp.route("/info", methods=["GET"])
def dataset_info():
    """Returns info about the synthetic dataset and open-source references."""
    return jsonify({
        "synthetic_dataset": {
            "description": "150+ algorithmically generated e-commerce returns",
            "based_on": "UCI Online Retail II dataset patterns",
            "categories": 9,
            "products": 20,
            "date_range": "Last 90 days",
            "features": ["return_reason","category","price","days_since_purchase","damage_level","fraud_risk","recommended_action"],
        },
        "open_source_references": [
            {"name":"UCI Online Retail II","url":"https://archive.ics.uci.edu/dataset/502/online+retail+ii","license":"CC BY 4.0"},
            {"name":"Kaggle E-Commerce Returns","url":"https://www.kaggle.com/datasets/thedevastator/analyzing-product-returns-in-e-commerce","license":"CC0"},
            {"name":"Reverse Logistics Research Dataset","url":"https://data.mendeley.com/","license":"CC BY 4.0"},
        ],
        "to_use_real_data": "Download UCI dataset as XLSX, convert to CSV, upload via /api/returns/batch",
    })

@datasets_bp.route("/sample", methods=["GET"])
def sample_data():
    """Returns sample CSV format for batch import."""
    sample = """order_id,product_name,category,product_price,return_reason,days_since_purchase,warehouse_location,repair_cost,customer_email
ORD-12345,Wireless Headphones,Electronics,2999,Product is defective stopped working,7,Mumbai,200,customer@example.com
ORD-12346,Running Shoes,Sports,1899,Size doesn't fit,3,Delhi,0,buyer@example.com
ORD-12347,Coffee Table,Furniture,4999,Minor scratch on surface,14,Bangalore,150,user@example.com"""
    from flask import Response
    return Response(sample, mimetype="text/csv",
                    headers={"Content-Disposition":"attachment;filename=sample_batch.csv"})
