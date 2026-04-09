"""
Market Dynamics Agent — Real-time Asset Valuation Engine
=========================================================
Monitors simulated resale market prices and automatically switches
routing from 'Refurbish' → 'Liquidate' if resale price drops ≥ 20%
while the item is in transit / processing.

Interview Hook: "My system performs Real-time Asset Valuation,
ensuring we never spend more on repairing an item than its current
market worth."
"""

import random
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict


# ── Simulated Market Price Database ────────────────────────────────────────
CATEGORY_BASE_MULTIPLES = {
    "Electronics":    {"eBay": 0.72, "Amazon_Refurb": 0.78, "Flipkart_Open": 0.68, "OLX": 0.55},
    "Clothing":       {"eBay": 0.60, "Amazon_Refurb": 0.65, "Flipkart_Open": 0.58, "OLX": 0.45},
    "Home & Kitchen": {"eBay": 0.65, "Amazon_Refurb": 0.70, "Flipkart_Open": 0.62, "OLX": 0.50},
    "Sports":         {"eBay": 0.68, "Amazon_Refurb": 0.72, "Flipkart_Open": 0.65, "OLX": 0.52},
    "Furniture":      {"eBay": 0.55, "Amazon_Refurb": 0.60, "Flipkart_Open": 0.52, "OLX": 0.42},
    "Books":          {"eBay": 0.80, "Amazon_Refurb": 0.75, "Flipkart_Open": 0.78, "OLX": 0.60},
    "Toys":           {"eBay": 0.65, "Amazon_Refurb": 0.70, "Flipkart_Open": 0.62, "OLX": 0.48},
    "Beauty":         {"eBay": 0.50, "Amazon_Refurb": 0.55, "Flipkart_Open": 0.48, "OLX": 0.38},
    "Automotive":     {"eBay": 0.70, "Amazon_Refurb": 0.74, "Flipkart_Open": 0.67, "OLX": 0.55},
    "Default":        {"eBay": 0.65, "Amazon_Refurb": 0.70, "Flipkart_Open": 0.62, "OLX": 0.50},
}

# Market sentiment modifiers (simulated daily fluctuations)
MARKET_EVENTS = [
    {"name": "New Product Launch", "impact": -0.15, "probability": 0.08},
    {"name": "Festive Season Demand", "impact": +0.12, "probability": 0.10},
    {"name": "Supply Chain Disruption", "impact": +0.08, "probability": 0.06},
    {"name": "Competitor Discount War", "impact": -0.18, "probability": 0.07},
    {"name": "Category Trend Spike", "impact": +0.15, "probability": 0.09},
    {"name": "Normal Market", "impact": 0.0, "probability": 0.60},
]


@dataclass
class MarketPriceSnapshot:
    timestamp: str
    category: str
    original_price: float
    platform: str
    current_market_price: float
    price_change_pct: float
    market_event: Optional[str]
    demand_score: float  # 0-100
    competition_index: float  # 0-100


@dataclass
class RoutingDecision:
    original_routing: str
    new_routing: str
    reason: str
    price_drop_pct: float
    estimated_loss_avoided: float
    agent_confidence: float
    action_taken: bool
    timestamp: str


class MarketDynamicsAgent:
    """
    Agent 1: Market Dynamics — Real-time Asset Valuation
    Prevents over-investment in refurbishment when market value drops.
    """

    ROUTING_SWITCH_THRESHOLD = 0.20  # 20% price drop triggers routing switch
    LIQUIDATION_THRESHOLD = 0.30     # 30% drop → immediate liquidation
    REPAIR_COST_RATIO_MAX = 0.40     # Never spend >40% of market value on repair

    def __init__(self):
        self.agent_id = "MDA-001"
        self.agent_name = "Market Dynamics Agent"
        self.log: List[Dict] = []

    def _get_market_multiples(self, category: str) -> Dict[str, float]:
        return CATEGORY_BASE_MULTIPLES.get(category, CATEGORY_BASE_MULTIPLES["Default"])

    def _simulate_market_event(self) -> Dict:
        """Simulate a random market event affecting prices."""
        rand = random.random()
        cumulative = 0
        for event in MARKET_EVENTS:
            cumulative += event["probability"]
            if rand <= cumulative:
                return event
        return MARKET_EVENTS[-1]

    def fetch_market_prices(self, category: str, original_price: float,
                            damage_level: str) -> List[MarketPriceSnapshot]:
        """
        Fetch (simulated) current resale market prices across platforms.
        In production: integrate with eBay API, Amazon SP-API, scrapers.
        """
        multiples = self._get_market_multiples(category)
        event = self._simulate_market_event()

        # Damage adjustment
        damage_discount = {
            "No Damage": 0.0,
            "Minor Damage": -0.08,
            "Moderate Damage": -0.18,
            "Severe Damage": -0.35,
        }.get(damage_level, -0.10)

        snapshots = []
        for platform, base_multiple in multiples.items():
            # Add noise + event impact + damage
            noise = random.uniform(-0.03, 0.03)
            effective_multiple = base_multiple + event["impact"] + damage_discount + noise
            effective_multiple = max(0.05, min(1.0, effective_multiple))

            current_price = round(original_price * effective_multiple, 2)
            base_price = original_price * base_multiple
            change_pct = ((current_price - base_price) / base_price) * 100

            demand_score = random.uniform(30, 95) + (event["impact"] * 100)
            demand_score = max(5, min(100, demand_score))

            snapshots.append(MarketPriceSnapshot(
                timestamp=datetime.utcnow().isoformat(),
                category=category,
                original_price=original_price,
                platform=platform,
                current_market_price=current_price,
                price_change_pct=round(change_pct, 2),
                market_event=event["name"] if event["impact"] != 0 else None,
                demand_score=round(demand_score, 1),
                competition_index=round(random.uniform(40, 90), 1),
            ))

        return snapshots

    def evaluate_routing(
        self,
        return_id: str,
        category: str,
        original_price: float,
        damage_level: str,
        current_routing: str,
        repair_cost: float,
    ) -> Dict[str, Any]:
        """
        Core logic: evaluate if current routing is still optimal given market prices.
        Returns a routing decision with full justification.
        """
        snapshots = self.fetch_market_prices(category, original_price, damage_level)

        # Use best (highest) market price as reference
        best_market = max(snapshots, key=lambda s: s.current_market_price)
        avg_market_price = sum(s.current_market_price for s in snapshots) / len(snapshots)

        # Baseline: what we expected when routing was decided
        expected_multiples = self._get_market_multiples(category)
        expected_price = original_price * list(expected_multiples.values())[0]

        price_drop_pct = max(0, (expected_price - avg_market_price) / expected_price)

        # Decision logic
        new_routing = current_routing
        action_taken = False
        reason = f"Market stable. Avg resale: ₹{avg_market_price:.0f}. No routing change needed."
        confidence = 0.85

        if price_drop_pct >= self.LIQUIDATION_THRESHOLD and current_routing != "Liquidation Partner":
            new_routing = "Liquidation Partner"
            action_taken = True
            reason = (
                f"🚨 CRITICAL: Market price dropped {price_drop_pct*100:.1f}% "
                f"(₹{expected_price:.0f} → ₹{avg_market_price:.0f}). "
                f"Repair cost ₹{repair_cost:.0f} would exceed recovery value. "
                f"Emergency switch to Liquidation."
            )
            confidence = 0.92

        elif price_drop_pct >= self.ROUTING_SWITCH_THRESHOLD:
            if current_routing == "Repair Center":
                new_routing = "Liquidation Partner"
                action_taken = True
                reason = (
                    f"⚠️ Market drop {price_drop_pct*100:.1f}% detected via Real-time Asset Valuation. "
                    f"Routing switched: Repair Center → Liquidation Partner. "
                    f"Repair ROI no longer viable at avg market ₹{avg_market_price:.0f}."
                )
                confidence = 0.88
            elif current_routing == "Discount Inventory Zone":
                new_routing = "Liquidation Partner"
                action_taken = True
                reason = (
                    f"Market softening {price_drop_pct*100:.1f}%. Discount pricing window missed. "
                    f"Escalating to Liquidation Partner to clear inventory."
                )
                confidence = 0.80

        # Repair cost sanity check
        if repair_cost > (avg_market_price * self.REPAIR_COST_RATIO_MAX):
            if current_routing == "Repair Center":
                new_routing = "Liquidation Partner"
                action_taken = True
                reason += f" Additionally: Repair cost (₹{repair_cost:.0f}) exceeds 40% of market value."
                confidence = min(confidence + 0.05, 0.99)

        estimated_loss_avoided = max(0, repair_cost - avg_market_price * 0.05) if action_taken else 0

        decision = RoutingDecision(
            original_routing=current_routing,
            new_routing=new_routing,
            reason=reason,
            price_drop_pct=round(price_drop_pct * 100, 2),
            estimated_loss_avoided=round(estimated_loss_avoided, 2),
            agent_confidence=round(confidence, 2),
            action_taken=action_taken,
            timestamp=datetime.utcnow().isoformat(),
        )

        log_entry = {
            "return_id": return_id,
            "agent": self.agent_name,
            "decision": asdict(decision),
            "market_snapshots": [asdict(s) for s in snapshots],
            "best_platform": best_market.platform,
            "best_market_price": best_market.current_market_price,
            "avg_market_price": round(avg_market_price, 2),
        }
        self.log.append(log_entry)

        return {
            **log_entry,
            "agent_id": self.agent_id,
            "agent_message": (
                f"[{self.agent_name}] {reason}"
            ),
        }

    def get_market_dashboard(self, categories: List[str], price: float = 10000) -> Dict:
        """Get aggregated market data for dashboard display."""
        result = {}
        for cat in categories:
            snaps = self.fetch_market_prices(cat, price, "Minor Damage")
            result[cat] = {
                "avg_resale_multiple": round(
                    sum(s.current_market_price for s in snaps) / (len(snaps) * price), 3
                ),
                "best_platform": max(snaps, key=lambda s: s.current_market_price).platform,
                "market_trend": "📈 Rising" if snaps[0].price_change_pct > 2 else (
                    "📉 Falling" if snaps[0].price_change_pct < -2 else "➡️ Stable"
                ),
                "platforms": {s.platform: s.current_market_price for s in snaps},
            }
        return result


# Singleton instance
market_agent = MarketDynamicsAgent()
