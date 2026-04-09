"""
Agents Blueprint — API routes for the Multi-Agent system.
"""
from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth
from app.ai.agents.orchestrator import run_multi_agent_pipeline, get_communication_log
from app.ai.agents.market_dynamics_agent import market_agent
from app.ai.agents.inventory_balancing_agent import inventory_agent
from app.ai.agents.gan_synthetic import synthetic_vault

agents_bp = Blueprint("agents", __name__)


@agents_bp.route("/run", methods=["POST"])
@require_auth
def run_pipeline():
    """Run the full multi-agent pipeline for a return."""
    data = request.get_json() or {}
    required = ["return_id", "category", "sku", "original_price", "damage_level", "current_routing"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"Missing: {f}"}), 400

    result = run_multi_agent_pipeline(
        return_id=data["return_id"],
        category=data["category"],
        sku=data.get("sku", "SKU-UNKNOWN"),
        original_price=float(data["original_price"]),
        damage_level=data["damage_level"],
        current_routing=data["current_routing"],
        repair_cost=float(data.get("repair_cost", 0)),
        warehouse_location=data.get("warehouse_location", "Mumbai"),
        fraud_risk=data.get("fraud_risk", "Low"),
        customer_ltv=float(data.get("customer_ltv", 5000)),
        is_high_value_customer=data.get("is_high_value_customer", False),
    )
    return jsonify(result)


@agents_bp.route("/communication-log", methods=["GET"])
@require_auth
def communication_log():
    """Get the live agent communication log."""
    limit = request.args.get("limit", 50, type=int)
    return jsonify(get_communication_log(limit))


@agents_bp.route("/market/prices", methods=["GET"])
@require_auth
def market_prices():
    """Get current market prices for a category."""
    category = request.args.get("category", "Electronics")
    price = request.args.get("price", 10000, type=float)
    damage = request.args.get("damage", "Minor Damage")
    snapshots = market_agent.fetch_market_prices(category, price, damage)
    return jsonify([s.__dict__ for s in snapshots])


@agents_bp.route("/market/dashboard", methods=["GET"])
@require_auth
def market_dashboard():
    """Get aggregated market data across all categories."""
    categories = ["Electronics", "Clothing", "Home & Kitchen", "Sports", "Furniture"]
    price = request.args.get("price", 10000, type=float)
    return jsonify(market_agent.get_market_dashboard(categories, price))


@agents_bp.route("/inventory/health", methods=["GET"])
@require_auth
def inventory_health():
    """Get warehouse network health."""
    return jsonify(inventory_agent.get_network_health())


@agents_bp.route("/inventory/stock", methods=["GET"])
@require_auth
def inventory_stock():
    """Get stock levels for a SKU."""
    sku = request.args.get("sku", "SKU-001")
    category = request.args.get("category", "Electronics")
    statuses = inventory_agent.get_stock_levels(sku, category)
    return jsonify([s.__dict__ for s in statuses])


@agents_bp.route("/synthetic/generate", methods=["POST"])
@require_auth
def generate_synthetic():
    """Generate synthetic fraud training data."""
    data = request.get_json() or {}
    n_fraud = min(int(data.get("n_fraud", 100)), 2000)
    n_legitimate = min(int(data.get("n_legitimate", 200)), 4000)
    result = synthetic_vault.generate_training_dataset(n_fraud, n_legitimate)
    return jsonify(result)


@agents_bp.route("/synthetic/stats", methods=["GET"])
@require_auth
def synthetic_stats():
    """Get GAN statistics."""
    return jsonify(synthetic_vault.get_gan_stats())


@agents_bp.route("/market/evaluate", methods=["POST"])
@require_auth
def evaluate_market_routing():
    """Evaluate if routing needs to change based on market conditions."""
    data = request.get_json() or {}
    result = market_agent.evaluate_routing(
        return_id=data.get("return_id", "EVAL"),
        category=data.get("category", "Electronics"),
        original_price=float(data.get("original_price", 10000)),
        damage_level=data.get("damage_level", "Minor Damage"),
        current_routing=data.get("current_routing", "Repair Center"),
        repair_cost=float(data.get("repair_cost", 1500)),
    )
    return jsonify(result)


@agents_bp.route("/carbon-offset", methods=["GET"])
@require_auth
def carbon_offset():
    """
    Carbon Offset Tracker — calculate CO₂ saved by repairing vs scrapping.
    ESG/Sustainability metrics for the boardroom dashboard.
    """
    from app.models.return_item import ReturnItem
    from app import db
    from sqlalchemy import func
    import random

    # CO₂ saved metrics per action (kg CO₂ equivalent)
    CO2_SAVINGS = {
        "Restock": 4.2,
        "Repack and Discount": 3.1,
        "Refurbish": 6.8,
        "Liquidate": 1.5,
        "Scrap / E-Waste": 0.0,
    }

    actions = db.session.query(
        ReturnItem.recommended_action,
        func.count(ReturnItem.id).label("count")
    ).group_by(ReturnItem.recommended_action).all()

    total_kg_saved = 0
    breakdown = []
    for action, count in actions:
        kg = CO2_SAVINGS.get(action, 0) * count
        total_kg_saved += kg
        breakdown.append({"action": action, "count": count, "co2_saved_kg": round(kg, 1)})

    # Trees equivalent (1 tree absorbs ~21 kg CO₂/year)
    trees_equivalent = round(total_kg_saved / 21, 1)
    cars_off_road = round(total_kg_saved / 4600, 2)  # avg car emits 4600 kg/year

    return jsonify({
        "total_co2_saved_kg": round(total_kg_saved, 2),
        "trees_equivalent": trees_equivalent,
        "cars_off_road_equivalent": cars_off_road,
        "breakdown": breakdown,
        "esg_score": min(100, round(trees_equivalent * 0.8, 1)),
        "sustainability_grade": (
            "A+" if trees_equivalent > 100 else
            "A" if trees_equivalent > 50 else
            "B" if trees_equivalent > 20 else "C"
        ),
        "last_updated": "live",
    })


@agents_bp.route("/nrv-heatmap", methods=["GET"])
@require_auth
def nrv_heatmap():
    """
    Net Recovery Value Heatmap — regional return cost analysis.
    Managers can identify local courier/operational issues.
    """
    from app.models.return_item import ReturnItem
    from app import db
    from sqlalchemy import func

    rows = db.session.query(
        ReturnItem.warehouse_location,
        func.count(ReturnItem.id).label("total_returns"),
        func.avg(ReturnItem.net_recovery_value).label("avg_nrv"),
        func.avg(ReturnItem.holding_cost).label("avg_holding"),
        func.avg(ReturnItem.transport_cost).label("avg_transport"),
        func.avg(ReturnItem.repair_cost).label("avg_repair"),
        func.sum(ReturnItem.net_recovery_value).label("total_nrv"),
    ).group_by(ReturnItem.warehouse_location).all()

    city_coords = {
        "Mumbai": (19.076, 72.877), "Delhi": (28.704, 77.102),
        "Bangalore": (12.972, 77.594), "Chennai": (13.083, 80.270),
        "Hyderabad": (17.385, 78.487), "Pune": (18.520, 73.856),
        "Kolkata": (22.573, 88.364), "Ahmedabad": (23.023, 72.572),
        "Jaipur": (26.913, 75.787), "Surat": (21.170, 72.831),
    }

    result = []
    for city, total, avg_nrv, avg_h, avg_t, avg_r, total_nrv in rows:
        coords = city_coords.get(city, (20.5, 79.0))
        avg_nrv = avg_nrv or 0
        result.append({
            "city": city,
            "lat": coords[0],
            "lng": coords[1],
            "total_returns": total,
            "avg_nrv": round(avg_nrv, 2),
            "total_nrv": round(total_nrv or 0, 2),
            "avg_holding_cost": round(avg_h or 0, 2),
            "avg_transport_cost": round(avg_t or 0, 2),
            "avg_repair_cost": round(avg_r or 0, 2),
            "risk_level": (
                "HIGH" if avg_nrv < 0 else
                "MEDIUM" if avg_nrv < 500 else "LOW"
            ),
        })
    return jsonify(sorted(result, key=lambda x: x["avg_nrv"]))
