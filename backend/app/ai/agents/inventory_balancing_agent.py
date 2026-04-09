"""
Inventory Balancing Agent — Autonomous Inventory Redistribution
===============================================================
Checks current stock levels in regional warehouses and routes
"Like-New" returns directly to understocked locations, turning a
return into a localized stock replenishment event.

Interview Hook: "I implemented Autonomous Inventory Redistribution,
turning a return into a localized stock replenishment strategy."
"""

import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict


# ── Simulated Regional Warehouse Stock Data ────────────────────────────────
WAREHOUSES = {
    "WH-MUM": {
        "name": "Mumbai Main Warehouse",
        "city": "Mumbai", "region": "West",
        "lat": 19.076, "lng": 72.877,
        "capacity": 5000, "type": "main",
    },
    "WH-DEL": {
        "name": "Delhi Distribution Center",
        "city": "Delhi", "region": "North",
        "lat": 28.704, "lng": 77.102,
        "capacity": 4500, "type": "main",
    },
    "WH-BLR": {
        "name": "Bangalore Tech Hub",
        "city": "Bangalore", "region": "South",
        "lat": 12.972, "lng": 77.594,
        "capacity": 3500, "type": "main",
    },
    "WH-CHN": {
        "name": "Chennai Coastal Center",
        "city": "Chennai", "region": "South",
        "lat": 13.083, "lng": 80.270,
        "capacity": 3000, "type": "main",
    },
    "WH-HYD": {
        "name": "Hyderabad Smart Warehouse",
        "city": "Hyderabad", "region": "South",
        "lat": 17.385, "lng": 78.487,
        "capacity": 3200, "type": "main",
    },
    "WH-KOL": {
        "name": "Kolkata East Hub",
        "city": "Kolkata", "region": "East",
        "lat": 22.573, "lng": 88.364,
        "capacity": 2800, "type": "main",
    },
}

# Simulated current SKU stock levels per warehouse
# Format: {warehouse_id: {sku: stock_qty}}
_sku_stock_simulation: Dict[str, Dict[str, int]] = {}


def _init_stock_simulation(sku: str, category: str):
    """Initialize random stock distribution for a SKU."""
    global _sku_stock_simulation
    if sku not in str(_sku_stock_simulation):
        for wh_id in WAREHOUSES:
            if wh_id not in _sku_stock_simulation:
                _sku_stock_simulation[wh_id] = {}
            # Simulate varied stock: 0–80% of warehouse capacity section
            base = random.randint(0, 120)
            # Some warehouses intentionally overstocked, some understocked
            if random.random() < 0.25:  # 25% chance of overstocked
                base = random.randint(100, 200)
            elif random.random() < 0.20:  # 20% chance of critically low
                base = random.randint(0, 5)
            _sku_stock_simulation[wh_id][sku] = base


OVERSTOCK_THRESHOLD = 100    # Units above which we consider overstocked
UNDERSTOCK_THRESHOLD = 10    # Units below which we consider understocked
CRITICAL_STOCK = 3           # Critical — needs immediate replenishment
OUTBOUND_COST_PER_KM = 0.8  # ₹ per km for routing


def _haversine_distance(lat1, lng1, lat2, lng2) -> float:
    """Calculate approximate distance in km between two coordinates."""
    import math
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@dataclass
class StockStatus:
    warehouse_id: str
    warehouse_name: str
    city: str
    sku: str
    current_stock: int
    status: str  # "CRITICAL", "UNDERSTOCKED", "NORMAL", "OVERSTOCKED"
    demand_velocity: float  # Units per day


@dataclass
class RedistributionDecision:
    action_taken: bool
    source_warehouse: Optional[str]
    destination_warehouse: Optional[str]
    routing_override: Optional[str]
    distance_km: Optional[float]
    transfer_cost: Optional[float]
    stock_before_source: Optional[int]
    stock_before_dest: Optional[int]
    reason: str
    estimated_stock_days_saved: float
    agent_confidence: float
    timestamp: str


class InventoryBalancingAgent:
    """
    Agent 2: Inventory Balancing — Autonomous Inventory Redistribution
    Converts a return into a supply chain replenishment event.
    """

    def __init__(self):
        self.agent_id = "IBA-002"
        self.agent_name = "Inventory Balancing Agent"
        self.log: List[Dict] = []

    def get_stock_levels(self, sku: str, category: str) -> List[StockStatus]:
        """Fetch current stock levels across all warehouses."""
        _init_stock_simulation(sku, category)

        statuses = []
        for wh_id, wh_info in WAREHOUSES.items():
            stock = _sku_stock_simulation.get(wh_id, {}).get(sku, 0)

            if stock <= CRITICAL_STOCK:
                status = "CRITICAL"
            elif stock <= UNDERSTOCK_THRESHOLD:
                status = "UNDERSTOCKED"
            elif stock >= OVERSTOCK_THRESHOLD:
                status = "OVERSTOCKED"
            else:
                status = "NORMAL"

            # Simulated demand velocity (units/day)
            demand_map = {
                "Electronics": random.uniform(3, 12),
                "Clothing": random.uniform(5, 20),
                "Home & Kitchen": random.uniform(2, 8),
                "Sports": random.uniform(1, 6),
                "Default": random.uniform(2, 8),
            }
            velocity = demand_map.get(category, demand_map["Default"])

            statuses.append(StockStatus(
                warehouse_id=wh_id,
                warehouse_name=wh_info["name"],
                city=wh_info["city"],
                sku=sku,
                current_stock=stock,
                status=status,
                demand_velocity=round(velocity, 1),
            ))

        return statuses

    def evaluate_redistribution(
        self,
        return_id: str,
        sku: str,
        category: str,
        damage_level: str,
        current_routing: str,
        origin_city: str,
        product_value: float,
    ) -> Dict[str, Any]:
        """
        Core logic: check if a "Like-New" or "No Damage" return should be
        routed to an understocked warehouse instead of the default destination.
        """
        # Only applies to near-perfect condition items
        eligible_damage_levels = ["No Damage", "Minor Damage"]
        if damage_level not in eligible_damage_levels:
            return {
                "agent_id": self.agent_id,
                "agent_message": f"[{self.agent_name}] Item has '{damage_level}' — not eligible for inventory redistribution. Standard routing maintained.",
                "action_taken": False,
                "reason": f"Damage level '{damage_level}' not suitable for direct restock redistribution.",
            }

        stock_statuses = self.get_stock_levels(sku, category)

        # Find overstocked source and understocked destinations
        critical_warehouses = [s for s in stock_statuses if s.status == "CRITICAL"]
        understocked_warehouses = [s for s in stock_statuses if s.status == "UNDERSTOCKED"]
        overstocked_warehouses = [s for s in stock_statuses if s.status == "OVERSTOCKED"]

        if not (critical_warehouses or understocked_warehouses):
            return {
                "agent_id": self.agent_id,
                "agent_message": f"[{self.agent_name}] Stock levels balanced across all {len(WAREHOUSES)} warehouses. No redistribution needed.",
                "action_taken": False,
                "reason": "All warehouses within normal stock range.",
                "stock_overview": [asdict(s) for s in stock_statuses],
            }

        # Find origin warehouse coords (approximate by city name)
        origin_coords = None
        for wh_id, wh_info in WAREHOUSES.items():
            if origin_city.lower() in wh_info["city"].lower():
                origin_coords = (wh_info["lat"], wh_info["lng"])
                break
        if not origin_coords:
            origin_coords = (20.5, 79.0)  # India center

        # Target: critical first, then understocked — find closest
        targets = critical_warehouses if critical_warehouses else understocked_warehouses
        best_target = None
        best_distance = float("inf")

        for target in targets:
            wh_info = WAREHOUSES[target.warehouse_id]
            dist = _haversine_distance(
                origin_coords[0], origin_coords[1],
                wh_info["lat"], wh_info["lng"]
            )
            if dist < best_distance:
                best_distance = dist
                best_target = target

        transfer_cost = round(best_distance * OUTBOUND_COST_PER_KM, 2)
        days_of_stock = best_target.current_stock / max(best_target.demand_velocity, 0.1)
        days_saved = product_value * 0.003  # Holding cost saved

        # Determine new routing
        target_wh = WAREHOUSES[best_target.warehouse_id]
        new_routing = f"Direct → {target_wh['name']} ({target_wh['city']})"

        status_label = "🔴 CRITICAL" if best_target.status == "CRITICAL" else "🟡 UNDERSTOCKED"
        source_label = overstocked_warehouses[0].city if overstocked_warehouses else "Return Origin"

        reason = (
            f"Autonomous Inventory Redistribution triggered. "
            f"{status_label}: {target_wh['city']} has only {best_target.current_stock} units "
            f"(demand: {best_target.demand_velocity:.1f} units/day = {days_of_stock:.1f} days left). "
            f"Return routed directly to {target_wh['name']} instead of Main Warehouse. "
            f"Transfer cost: ₹{transfer_cost:.0f} | Distance: {best_distance:.0f}km."
        )

        decision = RedistributionDecision(
            action_taken=True,
            source_warehouse=source_label,
            destination_warehouse=target_wh["name"],
            routing_override=new_routing,
            distance_km=round(best_distance, 1),
            transfer_cost=transfer_cost,
            stock_before_source=overstocked_warehouses[0].current_stock if overstocked_warehouses else None,
            stock_before_dest=best_target.current_stock,
            reason=reason,
            estimated_stock_days_saved=round(days_saved, 2),
            agent_confidence=0.91 if best_target.status == "CRITICAL" else 0.83,
            timestamp=datetime.utcnow().isoformat(),
        )

        log_entry = {
            "return_id": return_id,
            "agent": self.agent_name,
            "decision": asdict(decision),
            "stock_overview": [asdict(s) for s in stock_statuses],
            "target_warehouse": target_wh,
        }
        self.log.append(log_entry)

        return {
            **log_entry,
            "agent_id": self.agent_id,
            "agent_message": f"[{self.agent_name}] {reason}",
        }

    def get_network_health(self) -> Dict[str, Any]:
        """Get overall inventory network health for dashboard."""
        total_wh = len(WAREHOUSES)
        # Simulate health metrics
        healthy = random.randint(2, 4)
        understocked = random.randint(1, 2)
        overstocked = total_wh - healthy - understocked
        overstocked = max(0, overstocked)

        return {
            "total_warehouses": total_wh,
            "healthy": healthy,
            "understocked": understocked,
            "overstocked": overstocked,
            "network_efficiency_score": round(random.uniform(72, 94), 1),
            "redistributions_today": random.randint(3, 18),
            "cost_saved_today": round(random.uniform(8000, 45000), 2),
            "warehouses": [
                {
                    "id": wh_id,
                    **wh_info,
                    "utilization_pct": round(random.uniform(35, 92), 1),
                    "sku_count": random.randint(120, 890),
                }
                for wh_id, wh_info in WAREHOUSES.items()
            ],
        }


# Singleton instance
inventory_agent = InventoryBalancingAgent()
