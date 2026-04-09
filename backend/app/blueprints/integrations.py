import uuid
from flask import Blueprint, jsonify, request
from datetime import datetime
from app import db
from app.models.warehouse import Integration
from app.utils.auth import require_auth

integrations_bp = Blueprint("integrations", __name__)

PLATFORMS = ["shopify","woocommerce","sap","zoho","fedex","ups","amazon","flipkart"]

@integrations_bp.route("", methods=["GET"])
@require_auth
def list_integrations():
    existing = {i.platform: i.to_dict() for i in Integration.query.all()}
    result = []
    for p in PLATFORMS:
        if p in existing:
            result.append(existing[p])
        else:
            result.append({"platform":p,"status":"disconnected","last_sync":None,"records_synced":0})
    return jsonify(result)

@integrations_bp.route("/connect", methods=["POST"])
@require_auth
def connect():
    d = request.get_json() or {}
    platform = d.get("platform","")
    if platform not in PLATFORMS:
        return jsonify({"error":"Unknown platform"}), 400
    existing = Integration.query.filter_by(platform=platform).first()
    if existing:
        existing.status = "connected"
        existing.last_sync = datetime.utcnow()
    else:
        existing = Integration(id=str(uuid.uuid4()), platform=platform,
                               status="connected", last_sync=datetime.utcnow())
        db.session.add(existing)
    db.session.commit()
    return jsonify(existing.to_dict())

@integrations_bp.route("/disconnect", methods=["POST"])
@require_auth
def disconnect():
    d = request.get_json() or {}
    platform = d.get("platform","")
    i = Integration.query.filter_by(platform=platform).first()
    if i:
        i.status = "disconnected"
        db.session.commit()
    return jsonify({"status":"disconnected","platform":platform})

@integrations_bp.route("/webhooks", methods=["POST"])
def webhook_receive():
    """Public webhook endpoint for external platforms."""
    data = request.get_json() or {}
    platform = request.args.get("platform","unknown")
    # Log the webhook event
    print(f"Webhook received from {platform}: {list(data.keys())}")
    return jsonify({"received": True, "platform": platform})
