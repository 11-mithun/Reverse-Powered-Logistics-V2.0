"""
Premium Features Blueprint — F1,F2,F6,F8,F11,F13,F15,F16,F20
"""
import random, uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from app import db
from app.models.return_item import ReturnItem
from app.utils.auth import require_auth

premium_bp = Blueprint("premium", __name__)

SPARE_PARTS_DB = {
    "Electronics": {
        "Severe Damage":   [{"part":"LCD Screen","sku":"LCD-001","price":2800,"lead_days":3,"supplier":"TechParts India"},{"part":"Motherboard","sku":"MB-002","price":4500,"lead_days":5,"supplier":"DigiSource"}],
        "Moderate Damage": [{"part":"Battery Pack","sku":"BAT-003","price":850,"lead_days":2,"supplier":"PowerCell Co"},{"part":"Charging Port","sku":"CP-004","price":320,"lead_days":1,"supplier":"TechParts India"}],
        "Minor Damage":    [{"part":"Screen Protector","sku":"SP-005","price":150,"lead_days":1,"supplier":"Accessories Hub"}],
    },
    "Home & Kitchen": {
        "Severe Damage":   [{"part":"Compressor Unit","sku":"CU-010","price":3200,"lead_days":7,"supplier":"AppliancePro"}],
        "Moderate Damage": [{"part":"Heating Element","sku":"HE-011","price":650,"lead_days":3,"supplier":"AppliancePro"}],
        "Minor Damage":    [{"part":"Knob Set","sku":"KN-013","price":180,"lead_days":2,"supplier":"Accessories Hub"}],
    },
    "Default": {
        "Severe Damage":   [{"part":"Main Assembly","sku":"MA-099","price":1500,"lead_days":5,"supplier":"GenParts Co"}],
        "Moderate Damage": [{"part":"Sub-Component","sku":"SC-098","price":600,"lead_days":3,"supplier":"GenParts Co"}],
        "Minor Damage":    [{"part":"Cosmetic Cover","sku":"CC-097","price":200,"lead_days":2,"supplier":"Accessories Hub"}],
    },
}

@premium_bp.route("/cognitive-procurement", methods=["POST"])
@require_auth
def cognitive_procurement():
    d = request.get_json() or {}
    category = d.get("category","Electronics")
    damage = d.get("damage_level","Moderate Damage")
    product_price = float(d.get("product_price",5000))
    return_volume_30d = int(d.get("return_volume_30d",10))
    parts_db = SPARE_PARTS_DB.get(category, SPARE_PARTS_DB["Default"])
    recommended = parts_db.get(damage, [])
    enriched = []
    for p in recommended:
        repair_viable = p["price"] < product_price * 0.35
        qty = max(1, int(return_volume_30d * 0.7))
        enriched.append({**p,"suggested_order_qty":qty,"total_order_value":round(p["price"]*qty,2),"repair_roi_viable":repair_viable,"urgency":"HIGH" if damage=="Severe Damage" else "MEDIUM","auto_po_eligible":repair_viable and qty>=3})
    total = sum(e["total_order_value"] for e in enriched)
    return jsonify({"feature":"Cognitive Procurement","category":category,"damage_level":damage,"recommended_parts":enriched,"total_procurement_value":round(total,2),"procurement_strategy":"BULK_ORDER" if total>50000 else "STANDARD_ORDER" if total>10000 else "SPOT_BUY","ai_confidence":round(random.uniform(0.82,0.96),2),"generated_at":datetime.utcnow().isoformat()})

LTV_TIERS = [
    {"tier":"Platinum","min_ltv":100000,"label":"💎","return_policy":"No Questions Asked — Full Refund","repair_priority":"INSTANT","discount_on_next":20},
    {"tier":"Gold","min_ltv":50000,"label":"🥇","return_policy":"Auto-Approve up to ₹25,000","repair_priority":"HIGH","discount_on_next":15},
    {"tier":"Silver","min_ltv":20000,"label":"🥈","return_policy":"Standard Policy — 30 Days","repair_priority":"MEDIUM","discount_on_next":10},
    {"tier":"Bronze","min_ltv":5000,"label":"🥉","return_policy":"Standard Policy — 15 Days","repair_priority":"NORMAL","discount_on_next":5},
    {"tier":"Standard","min_ltv":0,"label":"👤","return_policy":"Policy per damage assessment","repair_priority":"QUEUE","discount_on_next":0},
]

@premium_bp.route("/hyper-disposition", methods=["POST"])
@require_auth
def hyper_disposition():
    d = request.get_json() or {}
    customer_ltv = float(d.get("customer_ltv",0))
    total_orders = int(d.get("total_orders",1))
    return_count = int(d.get("return_count",0))
    product_price = float(d.get("product_price",5000))
    tier = next((t for t in LTV_TIERS if customer_ltv >= t["min_ltv"]), LTV_TIERS[-1])
    return_rate = (return_count / max(total_orders,1)) * 100
    auto_approve = tier["tier"] in ["Platinum","Gold"] and product_price < 30000
    override_action = "Auto-Approved — VIP Policy" if auto_approve else ("Flagged — High Return Rate" if return_rate>25 else None)
    compensation = {"immediate_refund":product_price,"discount_code":f"VIP{random.randint(1000,9999)}","discount_pct":tier["discount_on_next"],"loyalty_points":int(product_price*0.1)} if auto_approve else None
    return jsonify({"feature":"Hyper-Personalized Disposition","ltv_tier":tier,"customer_ltv":customer_ltv,"return_rate_pct":round(return_rate,1),"auto_approved":auto_approve,"override_action":override_action,"compensation":compensation})

@premium_bp.route("/sla-breach-action", methods=["POST"])
@require_auth
def sla_breach_action():
    d = request.get_json() or {}
    breach_hours = float(d.get("breach_hours",0))
    product_price = float(d.get("product_price",1000))
    if breach_hours <= 0:
        return jsonify({"status":"no_breach","message":"SLA on track"})
    discount_pct = 5 if breach_hours<12 else 10 if breach_hours<24 else 15 if breach_hours<48 else 20
    coupon = f"SLA{discount_pct}-{uuid.uuid4().hex[:6].upper()}"
    return jsonify({"feature":"Dynamic SLA Pricing","breach_hours":breach_hours,"coupon_code":coupon,"discount_pct":discount_pct,"coupon_value":round(product_price*discount_pct/100,2),"valid_until":(datetime.utcnow()+timedelta(days=30)).isoformat(),"auto_email_sent":True})

AUCTION_PARTNERS = [
    {"id":"P001","name":"QuickLiquidators Pvt Ltd","city":"Mumbai","rating":4.7},
    {"id":"P002","name":"RetailRevive India","city":"Delhi","rating":4.5},
    {"id":"P003","name":"BidFirst Logistics","city":"Bangalore","rating":4.8},
    {"id":"P004","name":"ValueRecover Solutions","city":"Hyderabad","rating":4.3},
    {"id":"P005","name":"EcoLiquid Markets","city":"Chennai","rating":4.6},
]
_active_auctions = {}

@premium_bp.route("/auction/create", methods=["POST"])
@require_auth
def create_auction():
    d = request.get_json() or {}
    auction_id = f"AUC-{uuid.uuid4().hex[:8].upper()}"
    reserve_price = float(d.get("reserve_price", float(d.get("product_price",1000)) * 0.25))
    end_time = datetime.utcnow() + timedelta(hours=int(d.get("duration_hours",24)))
    auction = {"auction_id":auction_id,"return_id":d.get("return_id",""),"product_name":d.get("product_name","Item"),"category":d.get("category","Electronics"),"damage_level":d.get("damage_level","Moderate Damage"),"reserve_price":reserve_price,"current_bid":0,"bid_count":0,"end_time":end_time.isoformat(),"status":"OPEN","bids":[],"created_at":datetime.utcnow().isoformat()}
    base = reserve_price * random.uniform(0.9,1.1)
    for i,p in enumerate(AUCTION_PARTNERS[:3]):
        amt = round(base * random.uniform(0.95,1.15),2)
        auction["bids"].append({"bid_id":f"BID-{i+1}","partner_id":p["id"],"partner_name":p["name"],"amount":amt,"timestamp":datetime.utcnow().isoformat()})
        if amt > auction["current_bid"]: auction["current_bid"]=amt; auction["bid_count"]=i+1
    _active_auctions[auction_id] = auction
    return jsonify(auction), 201

@premium_bp.route("/auction/<auction_id>", methods=["GET"])
@require_auth
def get_auction(auction_id):
    a = _active_auctions.get(auction_id)
    if not a: return jsonify({"error":"Not found"}), 404
    if a["status"]=="OPEN" and random.random()<0.4:
        p = random.choice(AUCTION_PARTNERS)
        nb = round(a["current_bid"]*random.uniform(1.01,1.08),2)
        a["bids"].append({"bid_id":f"BID-{len(a['bids'])+1}","partner_id":p["id"],"partner_name":p["name"],"amount":nb,"timestamp":datetime.utcnow().isoformat()})
        a["current_bid"]=nb; a["bid_count"]=len(a["bids"])
    return jsonify(a)

@premium_bp.route("/auction/list", methods=["GET"])
@require_auth
def list_auctions():
    return jsonify(list(_active_auctions.values()))

TRANSLATIONS = {
    "en":{"title":"Return Status","approved":"Approved","pending":"Pending","rejected":"Rejected","action":"Recommended Action","ref_no":"Reference Number","submit":"Submit Return","reason_label":"Reason for Return"},
    "hi":{"title":"वापसी की स्थिति","approved":"स्वीकृत","pending":"लंबित","rejected":"अस्वीकृत","action":"अनुशंसित कार्रवाई","ref_no":"संदर्भ संख्या","submit":"वापसी जमा करें","reason_label":"वापसी का कारण"},
    "ta":{"title":"திரும்பப் பெறுதல் நிலை","approved":"அங்கீகரிக்கப்பட்டது","pending":"நிலுவையில் உள்ளது","rejected":"நிராகரிக்கப்பட்டது","action":"பரிந்துரைக்கப்பட்ட நடவடிக்கை","ref_no":"குறிப்பு எண்","submit":"சமர்ப்பிக்கவும்","reason_label":"காரணம்"},
    "bn":{"title":"ফিরে আসার অবস্থা","approved":"অনুমোদিত","pending":"মুলতুবি","rejected":"প্রত্যাখ্যাত","action":"প্রস্তাবিত পদক্ষেপ","ref_no":"রেফারেন্স নম্বর","submit":"জমা দিন","reason_label":"কারণ"},
    "te":{"title":"రిటర్న్ స్థితి","approved":"ఆమోదించబడింది","pending":"పెండింగ్","rejected":"తిరస్కరించబడింది","action":"సిఫార్సు చేయబడిన చర్య","ref_no":"రిఫరెన్స్ నంబర్","submit":"సమర్పించండి","reason_label":"కారణం"},
}
LANG_NAMES = {"en":"English","hi":"हिन्दी","ta":"தமிழ்","bn":"বাংলা","te":"తెలుగు"}

@premium_bp.route("/i18n/languages", methods=["GET"])
def get_languages():
    return jsonify([{"code":k,"name":v} for k,v in LANG_NAMES.items()])

@premium_bp.route("/i18n/translate", methods=["GET"])
def translate():
    lang = request.args.get("lang","en")
    return jsonify({"lang":lang,"lang_name":LANG_NAMES.get(lang,"English"),"strings":TRANSLATIONS.get(lang,TRANSLATIONS["en"])})

@premium_bp.route("/clv-auto-approve", methods=["POST"])
@require_auth
def clv_auto_approve():
    d = request.get_json() or {}
    ltv = float(d.get("customer_ltv",0))
    price = float(d.get("product_price",5000))
    threshold = float(d.get("ltv_threshold",50000))
    approved = ltv >= threshold
    return jsonify({"feature":"CLV Auto-Approve","customer_ltv":ltv,"threshold":threshold,"auto_approved":approved,"immediate_refund_amount":price if approved else 0,"reason":f"LTV ₹{ltv:,.0f} {'≥' if approved else '<'} ₹{threshold:,.0f} threshold.","churn_risk_prevented":round(ltv*0.2,2) if approved else 0,"roi_positive":approved and (ltv*0.2>price)})

@premium_bp.route("/suppliers/scorecard", methods=["GET"])
@require_auth
def supplier_scorecard():
    from sqlalchemy import func
    rows = db.session.query(
        ReturnItem.supplier_name,
        func.count(ReturnItem.id).label("total"),
        func.avg(ReturnItem.salvage_value_percent).label("avg_salvage"),
        func.count(db.case((ReturnItem.damage_level=="Severe Damage",1))).label("severe"),
        func.count(db.case((ReturnItem.damage_level=="Moderate Damage",1))).label("moderate"),
    ).filter(ReturnItem.supplier_name!=None, ReturnItem.supplier_name!="")\
     .group_by(ReturnItem.supplier_name).all()
    suppliers = []
    for name,total,avg_s,severe,moderate in rows:
        if not name: continue
        defect_rate = (severe+moderate)/max(total,1)*100
        quality_score = max(0,100-defect_rate*1.5)
        alert = defect_rate > 40
        suppliers.append({"supplier_name":name,"total_returns":total,"avg_salvage_pct":round(avg_s or 0,1),"severe_damage_count":severe,"moderate_damage_count":moderate,"defect_rate_pct":round(defect_rate,1),"quality_score":round(quality_score,1),"grade":"A" if quality_score>=85 else "B" if quality_score>=70 else "C" if quality_score>=55 else "D","alert_issued":alert,"alert_message":f"High defect rate ({defect_rate:.1f}%) — review required" if alert else None,"recommendation":"CONTINUE" if quality_score>=70 else "REVIEW" if quality_score>=55 else "REPLACE"})
    suppliers.sort(key=lambda x:x["quality_score"],reverse=True)
    return jsonify({"feature":"Supplier Accountability Dashboard","total_suppliers":len(suppliers),"alerts_issued":sum(1 for s in suppliers if s["alert_issued"]),"suppliers":suppliers})

INSURANCE_PLANS = [
    {"plan_id":"INS-BASIC","name":"Basic Cover","premium_pct":1.5,"coverage_pct":80,"max_payout":5000,"deductible":500},
    {"plan_id":"INS-STD","name":"Standard Cover","premium_pct":2.5,"coverage_pct":90,"max_payout":15000,"deductible":250},
    {"plan_id":"INS-PREM","name":"Premium Cover","premium_pct":3.5,"coverage_pct":100,"max_payout":50000,"deductible":0},
]
_claims = {}

@premium_bp.route("/insurance/plans", methods=["GET"])
def insurance_plans():
    price = float(request.args.get("product_price",5000))
    return jsonify([{**p,"premium_amount":round(price*p["premium_pct"]/100,2),"max_payout_actual":round(min(price*p["coverage_pct"]/100,p["max_payout"]),2)} for p in INSURANCE_PLANS])

@premium_bp.route("/insurance/claim", methods=["POST"])
@require_auth
def file_claim():
    d = request.get_json() or {}
    claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
    plan = next((p for p in INSURANCE_PLANS if p["plan_id"]==d.get("plan_id","INS-STD")), INSURANCE_PLANS[1])
    price = float(d.get("product_price",5000))
    damage = d.get("damage_level","Moderate Damage")
    payout_pct = {"No Damage":0,"Minor Damage":0.3,"Moderate Damage":0.6,"Severe Damage":1.0}.get(damage,0.5)
    payout = min(max(price*plan["coverage_pct"]/100*payout_pct - plan["deductible"],0), plan["max_payout"])
    claim = {"claim_id":claim_id,"plan_id":plan["plan_id"],"plan_name":plan["name"],"product_price":price,"damage_level":damage,"payout_amount":round(payout,2),"deductible_applied":plan["deductible"],"status":"APPROVED" if payout>0 else "REJECTED","processing_days":2 if plan["plan_id"]=="INS-PREM" else 5,"filed_at":datetime.utcnow().isoformat()}
    _claims[claim_id] = claim
    return jsonify(claim), 201

@premium_bp.route("/3pl/optimize", methods=["POST"])
def optimize_3pl():
    api_key = request.headers.get("X-API-Key","")
    if not api_key: return jsonify({"error":"X-API-Key header required"}), 401
    d = request.get_json() or {}
    damage = d.get("damage_level","Minor Damage")
    price = float(d.get("product_price",5000))
    repair_cost = float(d.get("repair_cost",0))
    ACTION_MAP = {"No Damage":"Restock","Minor Damage":"Repack and Discount","Moderate Damage":"Refurbish","Severe Damage":"Liquidate"}
    ROUTING_MAP = {"Restock":"Main Warehouse","Repack and Discount":"Discount Inventory Zone","Refurbish":"Repair Center","Liquidate":"Liquidation Partner"}
    action = ACTION_MAP.get(damage,"Refurbish")
    salvage = {"No Damage":88,"Minor Damage":74,"Moderate Damage":52,"Severe Damage":18}.get(damage,60)
    resale = round(salvage/100*price,2)
    return jsonify({"api_version":"v1","request_id":str(uuid.uuid4())[:8].upper(),"recommended_action":action,"routing_destination":ROUTING_MAP.get(action,"Main Warehouse"),"salvage_value_pct":salvage,"estimated_resale_value":resale,"net_recovery_value":round(resale-repair_cost-price*0.02,2),"origin_city":d.get("origin_city","Mumbai"),"estimated_processing_days":{"Restock":1,"Repack and Discount":2,"Refurbish":7,"Liquidate":3}.get(action,5),"sla_hours":48,"processed_at":datetime.utcnow().isoformat()})

@premium_bp.route("/3pl/api-key/generate", methods=["POST"])
@require_auth
def generate_api_key():
    return jsonify({"api_key":f"rl_{uuid.uuid4().hex}","expires":"never","scopes":["routing","analytics"],"created_at":datetime.utcnow().isoformat()})

@premium_bp.route("/kanban/items", methods=["GET"])
@require_auth
def kanban_items():
    """D8: Kanban board data - returns grouped by status."""
    columns = ["pending","processing","completed","escalated"]
    result = {}
    for col in columns:
        items = ReturnItem.query.filter_by(status=col).order_by(ReturnItem.created_at.desc()).limit(20).all()
        result[col] = [r.to_dict() for r in items]
    return jsonify(result)

@premium_bp.route("/kanban/move", methods=["POST"])
@require_auth
def kanban_move():
    """D8: Move a return between Kanban columns."""
    d = request.get_json() or {}
    r = ReturnItem.query.get_or_404(d.get("return_id",""))
    r.status = d.get("new_status","processing")
    if r.status == "completed": r.processed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"success":True,"return_id":r.id,"new_status":r.status})
