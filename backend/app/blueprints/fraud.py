from flask import Blueprint, jsonify, request
from app.models.return_item import ReturnItem
from app.ai.ml_models import score_fraud_risk
from app.utils.auth import require_auth

fraud_bp = Blueprint("fraud", __name__)

@fraud_bp.route("/score", methods=["POST"])
@require_auth
def score():
    d = request.get_json() or {}
    result = score_fraud_risk(
        d.get("return_reason",""), float(d.get("product_price",0)),
        int(d.get("days_since_purchase",0)), d.get("customer_email",""), d.get("category","")
    )
    return jsonify(result)

@fraud_bp.route("/flagged", methods=["GET"])
@require_auth
def flagged():
    items = ReturnItem.query.filter_by(fraud_risk="High").order_by(ReturnItem.created_at.desc()).limit(50).all()
    return jsonify([r.to_dict() for r in items])
