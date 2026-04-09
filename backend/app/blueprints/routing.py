from flask import Blueprint, jsonify, request
from app import db
from app.models.warehouse import Warehouse
from app.utils.auth import require_auth
import math

routing_bp = Blueprint("routing", __name__)

def _distance(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@routing_bp.route("/suggest", methods=["POST"])
@require_auth
def suggest_routing():
    d = request.get_json() or {}
    action = d.get("recommended_action","Liquidate")
    lat = float(d.get("lat", 20.5))
    lng = float(d.get("lng", 79.0))
    type_map = {
        "Restock":"main","Repack and Discount":"discount",
        "Refurbish":"repair","Liquidate":"liquidation","Scrap / E-Waste":"recycling"
    }
    wtype = type_map.get(action,"liquidation")
    warehouses = Warehouse.query.filter_by(warehouse_type=wtype, is_active=True).all()
    scored = []
    for w in warehouses:
        d_km = _distance(lat, lng, w.lat or 20.5, w.lng or 79.0)
        util = w.current_load / max(w.capacity, 1)
        score = d_km * 0.6 + util * 100 * 0.4
        scored.append({**w.to_dict(), "distance_km": round(d_km,1), "score": round(score,2)})
    scored.sort(key=lambda x: x["score"])
    return jsonify({"warehouses": scored, "recommended": scored[0] if scored else None})

@routing_bp.route("/warehouses", methods=["GET"])
@require_auth
def list_warehouses():
    return jsonify([w.to_dict() for w in Warehouse.query.filter_by(is_active=True).all()])
