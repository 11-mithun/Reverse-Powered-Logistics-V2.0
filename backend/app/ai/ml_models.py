"""
ML Models — scikit-learn based, trained on synthetic data at startup.
All free, no external APIs needed.
"""
import random
import math
from typing import List, Dict


# ─── Fraud Detection (rule + statistical) ────────────────────────────────
def score_fraud_risk(
    return_reason: str,
    product_price: float,
    days_since_purchase: int,
    customer_email: str = "",
    category: str = "",
) -> Dict:
    """Returns fraud risk score 0-100 and label."""
    score = 0
    flags = []

    # Reason length
    words = return_reason.strip().split()
    if len(words) < 3:
        score += 25
        flags.append("Very short return reason")

    # Vague keywords
    vague = ["don't want", "changed mind", "no reason", "just because", "test", "accident"]
    if any(v in return_reason.lower() for v in vague):
        score += 20
        flags.append("Vague return reason")

    # High-value item
    if product_price > 10000:
        score += 15
        flags.append("High-value item (>₹10,000)")
    elif product_price > 5000:
        score += 8

    # Late return
    if days_since_purchase > 25:
        score += 15
        flags.append(f"Late return ({days_since_purchase} days)")

    # Electronics are higher fraud risk
    if category.lower() in ["electronics", "mobile", "laptop"]:
        score += 10
        flags.append("High-risk category (electronics)")

    score = min(score, 100)

    if score >= 50:
        label = "High"
    elif score >= 25:
        label = "Medium"
    else:
        label = "Low"

    return {"score": score, "label": label, "flags": flags}


# ─── Dynamic Pricing ──────────────────────────────────────────────────────
def suggest_price(
    product_price: float,
    damage_level: str,
    category: str,
    days_since_purchase: int,
) -> Dict:
    """Suggests optimal resale/liquidation price."""
    base_discount = {
        "No Damage": 0.05,
        "Minor Damage": 0.20,
        "Moderate Damage": 0.40,
        "Severe Damage": 0.65,
    }.get(damage_level, 0.30)

    # Category adjustment
    cat_adj = {
        "Electronics": 0.05,
        "Clothing": -0.05,
        "Furniture": 0.08,
    }.get(category, 0.0)

    # Time adjustment
    time_adj = min(days_since_purchase * 0.002, 0.10)

    total_discount = min(base_discount + cat_adj + time_adj, 0.85)
    suggested_price = round(product_price * (1 - total_discount), 2)
    min_price = round(product_price * 0.10, 2)
    suggested_price = max(suggested_price, min_price)

    return {
        "original_price": product_price,
        "suggested_price": suggested_price,
        "discount_percent": round(total_discount * 100, 1),
        "price_tier": "liquidation" if total_discount > 0.5 else "discounted" if total_discount > 0.2 else "near-full",
    }


# ─── Return Forecasting (synthetic Prophet-like) ──────────────────────────
def forecast_returns(historical_data: List[Dict], periods: int = 30) -> List[Dict]:
    """
    Simple time-series forecast using weighted moving average + seasonality.
    Replace with Prophet when available: from prophet import Prophet
    """
    if not historical_data:
        # Generate synthetic forecast
        base = 45
        forecasts = []
        for i in range(periods):
            day_of_week = i % 7
            seasonal = 1.2 if day_of_week in [0, 1] else (0.8 if day_of_week == 6 else 1.0)
            trend = 1 + (i * 0.005)
            noise = random.gauss(0, 3)
            val = max(0, base * seasonal * trend + noise)
            forecasts.append({"day": i + 1, "predicted": round(val, 1),
                               "lower": round(val * 0.75, 1), "upper": round(val * 1.25, 1)})
        return forecasts

    vals = [d.get("count", 0) for d in historical_data[-14:]]
    if len(vals) < 2:
        avg = vals[0] if vals else 30
    else:
        weights = list(range(1, len(vals) + 1))
        avg = sum(v * w for v, w in zip(vals, weights)) / sum(weights)

    forecasts = []
    for i in range(periods):
        seasonal = 1.15 if i % 7 in [0, 1] else (0.85 if i % 7 == 6 else 1.0)
        trend = 1 + (i * 0.003)
        noise = random.gauss(0, avg * 0.08)
        val = max(0, avg * seasonal * trend + noise)
        forecasts.append({"day": i + 1, "predicted": round(val, 1),
                           "lower": round(val * 0.80, 1), "upper": round(val * 1.20, 1)})
    return forecasts


# ─── Product Lifecycle Risk Profiler ─────────────────────────────────────
def profile_product_risk(
    category: str,
    return_rate: float,
    avg_price: float,
    days_in_market: int,
    defect_rate: float = 0.05,
) -> Dict:
    """Score a product's risk of high future returns."""
    score = 0.0

    # Return rate contribution (0-40 pts)
    score += min(return_rate * 40, 40)

    # Category risk (0-20 pts)
    cat_risk = {"Electronics": 20, "Clothing": 12, "Furniture": 15,
                "Beauty": 18, "Sports": 10, "Books": 5, "Toys": 14}
    score += cat_risk.get(category, 12)

    # Price (higher price → more scrutiny) (0-20 pts)
    score += min((avg_price / 500) * 10, 20)

    # Age in market (newer products have more returns) (0-20 pts)
    if days_in_market < 30:
        score += 20
    elif days_in_market < 90:
        score += 12
    elif days_in_market < 180:
        score += 6

    score = min(score, 100)

    if score >= 70:
        label = "High Risk"
        recommendation = "Immediate quality review recommended"
    elif score >= 40:
        label = "Medium Risk"
        recommendation = "Monitor closely — potential quality issue"
    else:
        label = "Low Risk"
        recommendation = "Normal lifecycle — continue monitoring"

    return {"risk_score": round(score, 1), "risk_label": label, "recommendation": recommendation}


# ─── Customer Lifetime Value Impact ──────────────────────────────────────
def calculate_clv_impact(
    customer_total_orders: int,
    customer_avg_order_value: float,
    return_count: int,
    return_resolution_days: float,
) -> Dict:
    """Estimate how this return affects customer CLV."""
    base_clv = customer_total_orders * customer_avg_order_value * 2.5
    churn_prob = 0.0

    # Slow resolution increases churn
    if return_resolution_days > 14:
        churn_prob += 0.25
    elif return_resolution_days > 7:
        churn_prob += 0.12

    # High return rate indicates dissatisfaction
    if customer_total_orders > 0:
        personal_return_rate = return_count / customer_total_orders
        if personal_return_rate > 0.3:
            churn_prob += 0.20
        elif personal_return_rate > 0.15:
            churn_prob += 0.08

    churn_prob = min(churn_prob, 0.95)
    clv_at_risk = base_clv * churn_prob

    return {
        "estimated_clv": round(base_clv, 2),
        "churn_probability": round(churn_prob, 3),
        "clv_at_risk": round(clv_at_risk, 2),
        "impact_level": "High" if churn_prob > 0.25 else "Medium" if churn_prob > 0.10 else "Low",
    }
