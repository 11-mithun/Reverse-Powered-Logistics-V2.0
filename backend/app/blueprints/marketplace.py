from flask import Blueprint, jsonify, request
from app import db
from app.models.warehouse import Partner, Integration
from app.utils.auth import require_auth

marketplace_bp = Blueprint("marketplace", __name__)

@marketplace_bp.route("", methods=["GET"])
@require_auth
def list_partners():
    ptype = request.args.get("type")
    q = Partner.query.filter_by(is_active=True)
    if ptype:
        q = q.filter_by(partner_type=ptype)
    return jsonify([p.to_dict() for p in q.order_by(Partner.rating.desc()).all()])

@marketplace_bp.route("/<pid>/quote", methods=["POST"])
@require_auth
def request_quote(pid):
    partner = Partner.query.get_or_404(pid)
    d = request.get_json() or {}
    price = float(d.get("product_price", 1000))
    est_cost = round(price * partner.avg_cost_percent / 100, 2)
    return jsonify({
        "partner": partner.to_dict(),
        "estimated_cost": est_cost,
        "estimated_days": partner.avg_turnaround_days,
        "quote_id": f"QT-{pid[:8].upper()}",
    })
