"""
Multi-Agent Orchestrator — Agentic Escalation Layer
=====================================================
Coordinates all specialized agents and maintains the live
Agent Communication Log visible on the Boardroom Dashboard.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class AgentMessage:
    message_id: str
    timestamp: str
    from_agent: str
    to_agent: str
    message_type: str  # INFO, ALERT, ACTION, ESCALATION, RESOLUTION
    content: str
    data: Optional[Dict] = None
    return_id: Optional[str] = None


# In-memory communication log (last 500 messages)
_communication_log: List[Dict] = []
_MAX_LOG = 500


def log_agent_message(
    from_agent: str,
    to_agent: str,
    message_type: str,
    content: str,
    data: Optional[Dict] = None,
    return_id: Optional[str] = None,
) -> Dict:
    msg = AgentMessage(
        message_id=str(uuid.uuid4())[:8].upper(),
        timestamp=datetime.utcnow().isoformat(),
        from_agent=from_agent,
        to_agent=to_agent,
        message_type=message_type,
        content=content,
        data=data,
        return_id=return_id,
    )
    entry = asdict(msg)
    _communication_log.append(entry)
    if len(_communication_log) > _MAX_LOG:
        _communication_log.pop(0)
    return entry


def get_communication_log(limit: int = 50) -> List[Dict]:
    return list(reversed(_communication_log[-limit:]))


def run_multi_agent_pipeline(
    return_id: str,
    category: str,
    sku: str,
    original_price: float,
    damage_level: str,
    current_routing: str,
    repair_cost: float,
    warehouse_location: str,
    fraud_risk: str,
    customer_ltv: float = 10000,
    is_high_value_customer: bool = False,
) -> Dict[str, Any]:
    """
    Run the full multi-agent pipeline for a return item.
    Agents communicate and escalate based on their findings.
    """
    from app.ai.agents.market_dynamics_agent import market_agent
    from app.ai.agents.inventory_balancing_agent import inventory_agent

    pipeline_id = str(uuid.uuid4())[:8].upper()
    final_routing = current_routing
    final_action = None
    escalated = False
    agent_outputs = {}

    # ── Step 1: Fraud Check ────────────────────────────────────────────────
    log_agent_message(
        "FraudDetectionAgent", "MarketDynamicsAgent",
        "INFO",
        f"Fraud risk for return {return_id}: {fraud_risk}. Passing to market valuation.",
        return_id=return_id,
    )

    # ── Step 2: Market Dynamics Agent ─────────────────────────────────────
    market_result = market_agent.evaluate_routing(
        return_id=return_id,
        category=category,
        original_price=original_price,
        damage_level=damage_level,
        current_routing=current_routing,
        repair_cost=repair_cost,
    )
    agent_outputs["market_dynamics"] = market_result

    if market_result.get("decision", {}).get("action_taken"):
        new_routing = market_result["decision"]["new_routing"]
        final_routing = new_routing
        log_agent_message(
            "MarketDynamicsAgent", "InventoryBalancingAgent",
            "ACTION",
            f"Real-time Asset Valuation: Routing changed to '{new_routing}'. "
            f"Price drop: {market_result['decision']['price_drop_pct']}%. "
            f"Loss avoided: ₹{market_result['decision']['estimated_loss_avoided']:.0f}.",
            data={"new_routing": new_routing},
            return_id=return_id,
        )
    else:
        log_agent_message(
            "MarketDynamicsAgent", "InventoryBalancingAgent",
            "INFO",
            f"Market stable for {category}. Avg market: ₹{market_result.get('avg_market_price', 0):.0f}. No routing change.",
            return_id=return_id,
        )

    # ── Step 3: Inventory Balancing Agent ─────────────────────────────────
    inv_result = inventory_agent.evaluate_redistribution(
        return_id=return_id,
        sku=sku,
        category=category,
        damage_level=damage_level,
        current_routing=final_routing,
        origin_city=warehouse_location,
        product_value=original_price,
    )
    agent_outputs["inventory_balancing"] = inv_result

    if inv_result.get("action_taken"):
        inv_routing = inv_result.get("decision", {}).get("routing_override", final_routing)
        final_routing = inv_routing
        log_agent_message(
            "InventoryBalancingAgent", "EscalationAgent",
            "ACTION",
            f"Autonomous Inventory Redistribution: Item routed to "
            f"'{inv_result.get('target_warehouse', {}).get('city', 'Target WH')}' "
            f"to replenish critical stock.",
            data={"routing_override": inv_routing},
            return_id=return_id,
        )
    else:
        log_agent_message(
            "InventoryBalancingAgent", "EscalationAgent",
            "INFO",
            f"Network inventory balanced. Standard routing maintained.",
            return_id=return_id,
        )

    # ── Step 4: Fraud + CLV Escalation Logic ──────────────────────────────
    if fraud_risk == "High" and is_high_value_customer:
        escalated = True
        final_action = "Manual Override — High Value Customer with Fraud Flag"
        log_agent_message(
            "EscalationAgent", "HumanReviewQueue",
            "ESCALATION",
            f"🚨 CONFLICT: Fraud detected but customer LTV=₹{customer_ltv:.0f} (High Value). "
            f"Escalating to manual override for human review. Do NOT auto-reject.",
            data={"fraud_risk": fraud_risk, "ltv": customer_ltv},
            return_id=return_id,
        )
    elif fraud_risk == "High":
        final_action = "Auto-Reject — High Fraud Risk"
        log_agent_message(
            "EscalationAgent", "FraudReviewQueue",
            "ALERT",
            f"⚠️ High fraud risk confirmed. Auto-flagging for fraud review team.",
            return_id=return_id,
        )
    else:
        log_agent_message(
            "EscalationAgent", "ResolutionAgent",
            "INFO",
            f"No escalation required. Fraud={fraud_risk}. Routing to: {final_routing}.",
            return_id=return_id,
        )

    # ── Step 5: Resolution ─────────────────────────────────────────────────
    log_agent_message(
        "ResolutionAgent", "Dashboard",
        "RESOLUTION",
        f"✅ Pipeline complete for {return_id}. Final routing: '{final_routing}'. "
        f"Action: '{final_action or final_routing}'. Escalated: {escalated}.",
        data={"final_routing": final_routing, "escalated": escalated},
        return_id=return_id,
    )

    return {
        "pipeline_id": pipeline_id,
        "return_id": return_id,
        "agents_ran": ["FraudDetectionAgent", "MarketDynamicsAgent", "InventoryBalancingAgent", "EscalationAgent", "ResolutionAgent"],
        "final_routing": final_routing,
        "final_action": final_action,
        "escalated_to_human": escalated,
        "market_dynamics_result": agent_outputs.get("market_dynamics", {}),
        "inventory_balancing_result": agent_outputs.get("inventory_balancing", {}),
        "communication_log": get_communication_log(10),
        "completed_at": datetime.utcnow().isoformat(),
    }
