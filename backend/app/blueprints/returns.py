import uuid, csv, io
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from app import db
from app.models.return_item import ReturnItem
from app.ai.decision_engine import ai_decision
from app.ai.ml_models import score_fraud_risk, suggest_price, calculate_clv_impact
from app.utils.auth import require_auth

returns_bp = Blueprint("returns", __name__)


@returns_bp.route("", methods=["GET"])
@require_auth
def list_returns():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status = request.args.get("status")
    category = request.args.get("category")
    fraud_risk = request.args.get("fraud_risk")
    q = request.args.get("q", "")

    query = ReturnItem.query
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if fraud_risk:
        query = query.filter_by(fraud_risk=fraud_risk)
    if q:
        like = f"%{q}%"
        query = query.filter(
            db.or_(ReturnItem.product_name.ilike(like),
                   ReturnItem.customer_email.ilike(like),
                   ReturnItem.order_id.ilike(like))
        )
    query = query.order_by(ReturnItem.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [r.to_dict() for r in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@returns_bp.route("/<rid>", methods=["GET"])
@require_auth
def get_return(rid):
    r = ReturnItem.query.get_or_404(rid)
    return jsonify(r.to_dict())


@returns_bp.route("", methods=["POST"])
@require_auth
def create_return():
    data = request.get_json() or {}
    required = ["return_reason", "category", "product_price", "days_since_purchase", "product_name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing: {field}"}), 400

    price = float(data["product_price"])
    days = int(data["days_since_purchase"])
    repair = float(data.get("repair_cost", 0))

    # Run AI decision
    decision = ai_decision(
        return_reason=data["return_reason"],
        category=data["category"],
        product_price=price,
        days_since_purchase=days,
        repair_cost=repair,
        warehouse_location=data.get("warehouse_location", "India"),
    )

    # Fraud scoring
    fraud_detail = score_fraud_risk(
        data["return_reason"], price, days,
        data.get("customer_email", ""), data["category"]
    )

    # Pricing suggestion
    pricing = suggest_price(price, decision["damage_level"], data["category"], days)

    # CLV
    clv = calculate_clv_impact(
        int(data.get("customer_total_orders", 5)),
        float(data.get("customer_avg_order", price)),
        int(data.get("customer_return_count", 1)),
        float(data.get("resolution_days", 7)),
    )

    sust = decision.get("sustainability", {})
    r = ReturnItem(
        id=str(uuid.uuid4()),
        order_id=data.get("order_id", f"ORD-{uuid.uuid4().hex[:8].upper()}"),
        customer_email=data.get("customer_email", ""),
        customer_name=data.get("customer_name", ""),
        product_name=data["product_name"],
        category=data["category"],
        product_price=price,
        sku=data.get("sku", ""),
        supplier_name=data.get("supplier_name", ""),
        return_reason=data["return_reason"],
        days_since_purchase=days,
        warehouse_location=data.get("warehouse_location", ""),
        damage_level=decision["damage_level"],
        salvage_value_percent=decision["salvage_value_percent"],
        resale_value=decision["resale_value"],
        holding_cost=decision["holding_cost"],
        transport_cost=decision["transport_cost"],
        repair_cost=repair,
        net_recovery_value=decision["net_recovery_value"],
        recommended_action=decision["recommended_action"],
        routing_destination=decision["routing_destination"],
        fraud_risk=decision["fraud_risk"],
        priority_level=decision["priority_level"],
        ai_reasoning=decision["reasoning"],
        reuse_possible=sust.get("reuse", False),
        recycling_needed=sust.get("recycling_needed", False),
        waste_reduction=sust.get("waste_reduction", "Medium"),
        clv_impact_score=clv["churn_probability"],
        churn_probability=clv["churn_probability"],
        status="pending",
        sla_deadline=datetime.utcnow() + timedelta(hours=48),
    )
    db.session.add(r)
    db.session.commit()

    from app import socketio
    socketio.emit("new_return", r.to_dict())

    return jsonify({**r.to_dict(), "pricing_suggestion": pricing, "clv_detail": clv}), 201


@returns_bp.route("/<rid>", methods=["PATCH"])
@require_auth
def update_return(rid):
    r = ReturnItem.query.get_or_404(rid)
    data = request.get_json() or {}
    allowed = ["status", "recommended_action", "routing_destination", "repair_cost"]
    for field in allowed:
        if field in data:
            setattr(r, field, data[field])
    if data.get("status") == "completed":
        r.processed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(r.to_dict())


@returns_bp.route("/batch", methods=["POST"])
@require_auth
def batch_process():
    """Process CSV batch of returns."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    f = request.files["file"]
    content = f.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    results = []
    errors = []
    for i, row in enumerate(reader):
        try:
            price = float(row.get("product_price", 0))
            days = int(row.get("days_since_purchase", 0))
            repair = float(row.get("repair_cost", 0))
            decision = ai_decision(
                return_reason=row.get("return_reason", ""),
                category=row.get("category", "Electronics"),
                product_price=price,
                days_since_purchase=days,
                repair_cost=repair,
                warehouse_location=row.get("warehouse_location", "India"),
            )
            results.append({**row, **decision, "row": i + 1})
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})
    return jsonify({"processed": len(results), "errors": len(errors),
                    "results": results[:500], "error_details": errors})


@returns_bp.route("/stats/summary", methods=["GET"])
@require_auth
def stats_summary():
    total = ReturnItem.query.count()
    completed = ReturnItem.query.filter_by(status="completed").count()
    pending = ReturnItem.query.filter_by(status="pending").count()
    high_fraud = ReturnItem.query.filter_by(fraud_risk="High").count()
    from sqlalchemy import func
    nrv = db.session.query(func.sum(ReturnItem.net_recovery_value)).scalar() or 0
    avg_salvage = db.session.query(func.avg(ReturnItem.salvage_value_percent)).scalar() or 0

    actions = db.session.query(
        ReturnItem.recommended_action,
        func.count(ReturnItem.id).label("count")
    ).group_by(ReturnItem.recommended_action).all()

    categories = db.session.query(
        ReturnItem.category,
        func.count(ReturnItem.id).label("count")
    ).group_by(ReturnItem.category).all()

    return jsonify({
        "total_returns": total,
        "completed": completed,
        "pending": pending,
        "high_fraud_flags": high_fraud,
        "total_recovery_value": round(nrv, 2),
        "avg_salvage_percent": round(avg_salvage, 1),
        "actions_breakdown": [{"action": a, "count": c} for a, c in actions],
        "category_breakdown": [{"category": cat, "count": c} for cat, c in categories],
    })
