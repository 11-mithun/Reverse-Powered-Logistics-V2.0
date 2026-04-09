"""
Core AI Decision Engine — 8-step OSCM reverse logistics evaluation.

Supports (first available key is used):
  1. ANTHROPIC_API_KEY  -> Claude Haiku  (console.anthropic.com  — free credits)
  2. GEMINI_API_KEY     -> Gemini Flash  (aistudio.google.com    — free 1M req/day)
  3. OPENAI_API_KEY     -> GPT-4o-mini   (platform.openai.com    — pay per use)
  4. Rule-based fallback -> zero cost, works fully offline
"""
import os
import json
from typing import Dict, Any, Optional

# ── Rule-based constants ───────────────────────────────────────────────────
DAMAGE_KEYWORDS = {
    "defective": "Moderate Damage", "broken": "Severe Damage",
    "cracked": "Severe Damage", "shattered": "Severe Damage",
    "water damage": "Severe Damage", "dead on arrival": "Severe Damage",
    "doa": "Severe Damage", "stopped working": "Severe Damage",
    "not working": "Severe Damage", "screen issue": "Moderate Damage",
    "missing parts": "Moderate Damage", "quality issue": "Moderate Damage",
    "damaged": "Moderate Damage", "faulty": "Moderate Damage",
    "scratch": "Minor Damage", "dent": "Minor Damage",
    "cosmetic": "Minor Damage", "packaging": "Minor Damage",
    "wrong item": "No Damage", "wrong product": "No Damage",
    "changed mind": "No Damage", "doesn't fit": "No Damage",
    "size issue": "No Damage", "duplicate": "No Damage",
    "not needed": "No Damage", "not as described": "Minor Damage",
}

CATEGORY_SALVAGE = {
    "Electronics":    {"No Damage": 88, "Minor Damage": 74, "Moderate Damage": 50, "Severe Damage": 14},
    "Clothing":       {"No Damage": 93, "Minor Damage": 81, "Moderate Damage": 56, "Severe Damage": 10},
    "Home & Kitchen": {"No Damage": 90, "Minor Damage": 78, "Moderate Damage": 58, "Severe Damage": 20},
    "Sports":         {"No Damage": 87, "Minor Damage": 73, "Moderate Damage": 51, "Severe Damage": 17},
    "Furniture":      {"No Damage": 85, "Minor Damage": 70, "Moderate Damage": 47, "Severe Damage": 12},
    "Books":          {"No Damage": 95, "Minor Damage": 86, "Moderate Damage": 66, "Severe Damage": 30},
    "Toys":           {"No Damage": 91, "Minor Damage": 77, "Moderate Damage": 54, "Severe Damage": 15},
    "Beauty":         {"No Damage": 80, "Minor Damage": 65, "Moderate Damage": 38, "Severe Damage":  5},
    "Automotive":     {"No Damage": 86, "Minor Damage": 72, "Moderate Damage": 49, "Severe Damage": 18},
    "Default":        {"No Damage": 88, "Minor Damage": 75, "Moderate Damage": 52, "Severe Damage": 15},
}

ACTION_MAP = {
    "No Damage": "Restock", "Minor Damage": "Repack and Discount",
    "Moderate Damage": "Refurbish", "Severe Damage": "Liquidate",
}

ROUTING_MAP = {
    "Restock": "Main Warehouse", "Repack and Discount": "Discount Inventory Zone",
    "Refurbish": "Repair Center", "Liquidate": "Liquidation Partner",
    "Scrap / E-Waste": "Recycling Unit",
}

FRAUD_VAGUE = ["just because", "no reason", "none", "test", "accident",
               "changed", "don't want", "not needed", "no problem"]


def _classify_damage(reason: str) -> str:
    r = reason.lower()
    for kw, level in DAMAGE_KEYWORDS.items():
        if kw in r:
            return level
    if any(w in r for w in ["burnt", "exploded", "flood", "fire"]):
        return "Severe Damage"
    if any(w in r for w in ["minor", "small", "slight"]):
        return "Minor Damage"
    if any(w in r for w in ["issue", "problem", "fault"]):
        return "Moderate Damage"
    return "No Damage"


def _salvage_pct(damage: str, category: str, days: int) -> float:
    table = CATEGORY_SALVAGE.get(category, CATEGORY_SALVAGE["Default"])
    base = table.get(damage, 75.0)
    return max(base - min(days * 0.15, 25.0), 5.0)


def _fraud_risk(reason: str, price: float, days: int) -> str:
    score = 0
    if any(v in reason.lower() for v in FRAUD_VAGUE):
        score += 2
    if len(reason.split()) < 4:
        score += 2
    if price > 10000:
        score += 1
    if days > 25:
        score += 1
    return "High" if score >= 4 else "Medium" if score >= 2 else "Low"


def _sustainability(damage: str, action: str) -> dict:
    reuse = action in ("Restock", "Repack and Discount", "Refurbish")
    recycle = action in ("Scrap / E-Waste", "Liquidate")
    waste = "Low" if damage == "No Damage" else "High" if damage == "Severe Damage" else "Medium"
    return {"reuse": reuse, "recycling_needed": recycle, "waste_reduction": waste}


def rule_based_decision(return_reason, category, product_price,
                        days_since_purchase, repair_cost, warehouse_location) -> dict:
    damage = _classify_damage(return_reason)
    salvage = _salvage_pct(damage, category, days_since_purchase)
    resale = round(salvage / 100 * product_price, 2)
    holding = round(0.02 * product_price * (days_since_purchase / 10), 2)
    transport = round(0.05 * product_price, 2)
    nrv = round(resale - repair_cost - holding - transport, 2)
    action = ACTION_MAP.get(damage, "Liquidate")
    if nrv < 0 and action != "Restock":
        action = "Scrap / E-Waste"
    return {
        "damage_level": damage,
        "salvage_value_percent": round(salvage, 1),
        "resale_value": resale,
        "holding_cost": holding,
        "transport_cost": transport,
        "repair_cost": repair_cost,
        "net_recovery_value": nrv,
        "recommended_action": action,
        "routing_destination": ROUTING_MAP.get(action, "Liquidation Partner"),
        "fraud_risk": _fraud_risk(return_reason, product_price, days_since_purchase),
        "priority_level": "High" if salvage > 80 or days_since_purchase < 5 else "Medium" if salvage > 50 else "Low",
        "sustainability": _sustainability(damage, action),
        "reasoning": (
            f"Rule-based: '{damage}' from reason text. Salvage {salvage:.1f}% "
            f"after {min(days_since_purchase*0.15,25):.1f}% depreciation. "
            f"NRV=₹{nrv:.0f}. Action='{action}'."
        ),
        "engine": "rule-based",
    }


def _build_prompt(return_reason, category, product_price, days_since_purchase,
                  repair_cost, warehouse_location) -> str:
    return (
        "You are an expert OSCM Reverse Logistics AI. Analyze this return and return ONLY valid JSON.\n\n"
        f"INPUT:\n"
        f"- Return Reason: {return_reason}\n"
        f"- Category: {category}\n"
        f"- Product Price: {product_price}\n"
        f"- Days Since Purchase: {days_since_purchase}\n"
        f"- Repair Cost: {repair_cost}\n"
        f"- Location: {warehouse_location}\n\n"
        "RULES:\n"
        "damage_level: No Damage | Minor Damage | Moderate Damage | Severe Damage\n"
        "salvage_%: No=85-95, Minor=70-85, Moderate=40-70, Severe=0-30. Minus 0.15*days depreciation.\n"
        "resale_value = salvage_pct/100 * price\n"
        "holding_cost = 0.02 * price * (days/10)\n"
        "transport_cost = 0.05 * price\n"
        "net_recovery_value = resale - repair - holding - transport\n"
        "action: Restock | Repack and Discount | Refurbish | Liquidate | Scrap / E-Waste\n"
        "routing: Main Warehouse | Discount Inventory Zone | Repair Center | Liquidation Partner | Recycling Unit\n"
        "fraud_risk: Low | Medium | High\n"
        "priority_level: High | Medium | Low\n\n"
        'Return ONLY: {"damage_level":"","salvage_value_percent":0,"resale_value":0,'
        '"holding_cost":0,"transport_cost":0,"repair_cost":0,"net_recovery_value":0,'
        '"recommended_action":"","routing_destination":"","fraud_risk":"","priority_level":"",'
        '"sustainability":{"reuse":true,"recycling_needed":false,"waste_reduction":"Medium"},'
        '"reasoning":""}'
    )


def _parse(raw: str, repair_cost: float, provider: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    result = json.loads(text)
    result["repair_cost"] = repair_cost
    result["engine"] = provider
    return result


def _try_claude(prompt: str, repair_cost: float) -> Optional[dict]:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key or "your-key" in key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse(msg.content[0].text, repair_cost, "claude-haiku")
    except Exception as e:
        print(f"[Claude] {e}"); return None


def _try_gemini(prompt: str, repair_cost: float) -> Optional[dict]:
    """Google Gemini 1.5 Flash — FREE 1M requests/day at aistudio.google.com"""
    key = os.getenv("GEMINI_API_KEY", "")
    if not key or "your-key" in key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "max_output_tokens": 600},
        )
        return _parse(resp.text, repair_cost, "gemini-1.5-flash")
    except Exception as e:
        print(f"[Gemini] {e}"); return None


def _try_openai(prompt: str, repair_cost: float) -> Optional[dict]:
    key = os.getenv("OPENAI_API_KEY", "")
    if not key or "your-key" in key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini", max_tokens=600,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse(resp.choices[0].message.content, repair_cost, "gpt-4o-mini")
    except Exception as e:
        print(f"[OpenAI] {e}"); return None


def ai_decision(return_reason: str, category: str, product_price: float,
                days_since_purchase: int, repair_cost: float,
                warehouse_location: str) -> dict:
    """Try Claude → Gemini → OpenAI → rule-based fallback."""
    prompt = _build_prompt(return_reason, category, product_price,
                           days_since_purchase, repair_cost, warehouse_location)
    for fn in [_try_claude, _try_gemini, _try_openai]:
        result = fn(prompt, repair_cost)
        if result is not None:
            return result
    return rule_based_decision(return_reason, category, product_price,
                               days_since_purchase, repair_cost, warehouse_location)
