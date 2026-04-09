"""
Complete End-to-End Test Suite — RL Platform v2.0
===================================================
Covers: Auth, Returns, Analytics, Agents, Premium Features,
        Multi-Agent Pipeline, GAN Synthetic, Insurance, Auctions.

Run: python -m pytest tests/ -v --tb=short
Run with coverage: python -m pytest tests/ -v --cov=app --cov-report=term-missing
"""
import pytest, json, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app, db as _db


# ── Fixtures ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def app():
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["FLASK_ENV"] = "testing"
    os.environ["SECRET_KEY"] = "test-secret-key-qa"
    application = create_app()
    application.config["TESTING"] = True
    return application

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def auth_token(client):
    r = client.post("/api/auth/login", json={"email": "admin@rlplatform.com", "password": "Admin@123456"})
    assert r.status_code == 200, f"Login failed: {r.data}"
    return r.get_json()["token"]

@pytest.fixture
def H(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture(scope="session")
def sample_return_id(client, auth_token):
    """Create one return used across multiple tests."""
    H = {"Authorization": f"Bearer {auth_token}"}
    r = client.post("/api/returns", json={
        "product_name": "Sony WH-1000XM5 Headphones",
        "category": "Electronics",
        "product_price": 24999,
        "days_since_purchase": 12,
        "return_reason": "Screen has flickering issue from day one",
        "customer_email": "test@example.com",
        "customer_name": "Test User",
        "warehouse_location": "Mumbai",
        "supplier_name": "Sony India",
        "sku": "SKU-SONY-WH5",
        "repair_cost": 2500,
    }, headers=H)
    assert r.status_code == 201
    return r.get_json()["id"]


# ══════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════
class TestAuth:
    def test_login_success(self, client):
        r = client.post("/api/auth/login", json={"email": "admin@rlplatform.com", "password": "Admin@123456"})
        assert r.status_code == 200
        d = r.get_json()
        assert "token" in d
        assert d["user"]["role"] == "admin"

    def test_login_wrong_password(self, client):
        r = client.post("/api/auth/login", json={"email": "admin@rlplatform.com", "password": "wrong"})
        assert r.status_code == 401

    def test_login_missing_fields(self, client):
        r = client.post("/api/auth/login", json={"email": "admin@rlplatform.com"})
        assert r.status_code == 400

    def test_register_new_user(self, client):
        r = client.post("/api/auth/register", json={
            "email": f"newuser_{int(time.time())}@test.com",
            "name": "QA Tester",
            "password": "QATest123!"
        })
        assert r.status_code == 201
        assert "token" in r.get_json()

    def test_protected_route_no_token(self, client):
        r = client.get("/api/returns")
        assert r.status_code == 401

    def test_me_endpoint(self, client, H):
        r = client.get("/api/auth/me", headers=H)
        assert r.status_code == 200
        assert "email" in r.get_json()


# ══════════════════════════════════════════════════════════════════════════
# RETURNS
# ══════════════════════════════════════════════════════════════════════════
class TestReturns:
    def test_create_return_full(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Samsung Galaxy S24",
            "category": "Electronics",
            "product_price": 79999,
            "days_since_purchase": 5,
            "return_reason": "Dead on arrival — device won't power on",
            "customer_email": "customer@test.com",
            "warehouse_location": "Bangalore",
            "supplier_name": "Samsung India",
            "sku": "SKU-SAM-S24",
            "repair_cost": 8000,
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert d["damage_level"] == "Severe Damage"
        assert d["recommended_action"] in ["Liquidate", "Refurbish", "Scrap / E-Waste"]
        assert "net_recovery_value" in d
        assert "fraud_risk" in d

    def test_create_return_no_damage(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Nike Running Shoes",
            "category": "Clothing",
            "product_price": 8999,
            "days_since_purchase": 3,
            "return_reason": "Size issue — ordered 10 but need 11",
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert d["damage_level"] == "No Damage"
        assert d["recommended_action"] in ["Restock", "Repack and Discount"]

    def test_create_return_missing_required(self, client, H):
        r = client.post("/api/returns", json={"product_name": "Test"}, headers=H)
        assert r.status_code == 400

    def test_list_returns(self, client, H, sample_return_id):
        r = client.get("/api/returns", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "items" in d
        assert "total" in d
        assert len(d["items"]) > 0

    def test_list_returns_filter_status(self, client, H):
        r = client.get("/api/returns?status=pending", headers=H)
        assert r.status_code == 200

    def test_list_returns_filter_fraud(self, client, H):
        r = client.get("/api/returns?fraud_risk=High", headers=H)
        assert r.status_code == 200

    def test_list_returns_search(self, client, H):
        r = client.get("/api/returns?q=Sony", headers=H)
        assert r.status_code == 200

    def test_get_single_return(self, client, H, sample_return_id):
        r = client.get(f"/api/returns/{sample_return_id}", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["id"] == sample_return_id

    def test_get_nonexistent_return(self, client, H):
        r = client.get("/api/returns/nonexistent-id-12345", headers=H)
        assert r.status_code == 404

    def test_update_return_status(self, client, H, sample_return_id):
        r = client.patch(f"/api/returns/{sample_return_id}", json={"status": "processing"}, headers=H)
        assert r.status_code == 200
        assert r.get_json()["status"] == "processing"

    def test_complete_return(self, client, H, sample_return_id):
        r = client.patch(f"/api/returns/{sample_return_id}", json={"status": "completed"}, headers=H)
        assert r.status_code == 200
        assert r.get_json()["status"] == "completed"

    def test_stats_summary(self, client, H):
        r = client.get("/api/returns/stats/summary", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "total_returns" in d
        assert "total_recovery_value" in d
        assert "actions_breakdown" in d

    def test_pagination(self, client, H):
        r = client.get("/api/returns?page=1&per_page=5", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert len(d["items"]) <= 5

    def test_customer_portal_submit(self, client):
        r = client.post("/api/customers/portal/submit", json={
            "product_name": "IKEA Chair",
            "category": "Furniture",
            "product_price": 5999,
            "days_since_purchase": 8,
            "return_reason": "Cosmetic scratch on armrest",
            "customer_email": "portal@test.com",
        })
        assert r.status_code == 200
        assert "return_id" in r.get_json()


# ══════════════════════════════════════════════════════════════════════════
# AI DECISION ENGINE
# ══════════════════════════════════════════════════════════════════════════
class TestAIDecisionEngine:
    def test_rule_based_severe_damage(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Laptop",
            "category": "Electronics",
            "product_price": 55000,
            "days_since_purchase": 2,
            "return_reason": "Battery exploded — device is damaged",
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert d["damage_level"] == "Severe Damage"
        assert d["priority_level"] == "High"

    def test_salvage_value_calculation(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Book Set",
            "category": "Books",
            "product_price": 2000,
            "days_since_purchase": 1,
            "return_reason": "Changed mind, not needed",
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert d["salvage_value_percent"] > 80  # Books No Damage = 95% base
        assert d["recommended_action"] == "Restock"

    def test_fraud_risk_detection(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Gold Watch",
            "category": "Electronics",
            "product_price": 85000,
            "days_since_purchase": 29,
            "return_reason": "no reason",
            "customer_total_orders": 1,
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert d["fraud_risk"] in ["Medium", "High"]


# ══════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ══════════════════════════════════════════════════════════════════════════
class TestAnalytics:
    def test_heatmap(self, client, H):
        r = client.get("/api/analytics/heatmap", headers=H)
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_daily_returns(self, client, H):
        r = client.get("/api/analytics/daily?days=7", headers=H)
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_forecast(self, client, H):
        r = client.get("/api/analytics/forecast", headers=H)
        assert r.status_code == 200

    def test_kpis(self, client, H):
        r = client.get("/api/analytics/kpis", headers=H)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════
# MULTI-AGENT SYSTEM
# ══════════════════════════════════════════════════════════════════════════
class TestAgents:
    def test_run_full_pipeline(self, client, H, sample_return_id):
        r = client.post("/api/agents/run", json={
            "return_id": sample_return_id,
            "category": "Electronics",
            "sku": "SKU-SONY-WH5",
            "original_price": 24999,
            "damage_level": "Moderate Damage",
            "current_routing": "Repair Center",
            "repair_cost": 2500,
            "warehouse_location": "Mumbai",
            "fraud_risk": "Low",
            "customer_ltv": 45000,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "final_routing" in d
        assert "agents_ran" in d
        assert len(d["agents_ran"]) >= 3
        assert "pipeline_id" in d

    def test_pipeline_high_fraud_high_ltv_escalation(self, client, H, sample_return_id):
        r = client.post("/api/agents/run", json={
            "return_id": sample_return_id,
            "category": "Electronics",
            "sku": "SKU-TEST",
            "original_price": 50000,
            "damage_level": "No Damage",
            "current_routing": "Main Warehouse",
            "repair_cost": 0,
            "warehouse_location": "Delhi",
            "fraud_risk": "High",
            "customer_ltv": 120000,
            "is_high_value_customer": True,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["escalated_to_human"] == True

    def test_communication_log(self, client, H):
        r = client.get("/api/agents/communication-log?limit=20", headers=H)
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_market_prices(self, client, H):
        r = client.get("/api/agents/market/prices?category=Electronics&price=25000&damage=Minor+Damage", headers=H)
        assert r.status_code == 200
        data = r.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "current_market_price" in data[0]
        assert "platform" in data[0]

    def test_market_evaluate_routing_change(self, client, H):
        r = client.post("/api/agents/market/evaluate", json={
            "return_id": "TEST-001",
            "category": "Electronics",
            "original_price": 20000,
            "damage_level": "Moderate Damage",
            "current_routing": "Repair Center",
            "repair_cost": 9000,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "decision" in d
        assert "agent_id" in d

    def test_inventory_health(self, client, H):
        r = client.get("/api/agents/inventory/health", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "total_warehouses" in d
        assert "network_efficiency_score" in d

    def test_inventory_stock_levels(self, client, H):
        r = client.get("/api/agents/inventory/stock?sku=SKU-TEST&category=Electronics", headers=H)
        assert r.status_code == 200
        data = r.get_json()
        assert isinstance(data, list)
        assert len(data) == 6  # 6 warehouses

    def test_synthetic_stats(self, client, H):
        r = client.get("/api/agents/synthetic/stats", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "fraud_archetypes" in d
        assert d["fraud_archetypes"] == 5

    def test_generate_synthetic_dataset(self, client, H):
        r = client.post("/api/agents/synthetic/generate", json={
            "n_fraud": 20,
            "n_legitimate": 40,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["total_samples"] == 60
        assert d["fraud_samples"] == 20
        assert d["legitimate_samples"] == 40
        assert "avg_discriminator_realism_score" in d

    def test_carbon_offset(self, client, H):
        r = client.get("/api/agents/carbon-offset", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert "total_co2_saved_kg" in d
        assert "sustainability_grade" in d
        assert "trees_equivalent" in d

    def test_nrv_heatmap(self, client, H):
        r = client.get("/api/agents/nrv-heatmap", headers=H)
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)


# ══════════════════════════════════════════════════════════════════════════
# PREMIUM FEATURES
# ══════════════════════════════════════════════════════════════════════════
class TestPremiumFeatures:

    # F1: Cognitive Procurement
    def test_cognitive_procurement(self, client, H):
        r = client.post("/api/premium/cognitive-procurement", json={
            "category": "Electronics",
            "damage_level": "Moderate Damage",
            "product_price": 18000,
            "return_volume_30d": 15,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["feature"] == "Cognitive Procurement"
        assert isinstance(d["recommended_parts"], list)
        assert "total_procurement_value" in d
        assert "procurement_strategy" in d
        assert d["procurement_strategy"] in ["BULK_ORDER", "STANDARD_ORDER", "SPOT_BUY"]

    # F2: Hyper-Personalized Disposition
    def test_hyper_disposition_platinum(self, client, H):
        r = client.post("/api/premium/hyper-disposition", json={
            "customer_ltv": 150000,
            "total_orders": 30,
            "return_count": 3,
            "product_price": 12000,
            "damage_level": "Minor Damage",
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["ltv_tier"]["tier"] == "Platinum"
        assert d["auto_approved"] == True
        assert d["compensation"] is not None

    def test_hyper_disposition_standard(self, client, H):
        r = client.post("/api/premium/hyper-disposition", json={
            "customer_ltv": 1500,
            "total_orders": 2,
            "return_count": 1,
            "product_price": 5000,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["auto_approved"] == False

    # F6: Dynamic SLA Pricing
    def test_sla_breach_12h(self, client, H):
        r = client.post("/api/premium/sla-breach-action", json={
            "return_id": "RET-001",
            "breach_hours": 8,
            "customer_email": "test@test.com",
            "product_price": 10000,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["discount_pct"] == 5

    def test_sla_breach_48h(self, client, H):
        r = client.post("/api/premium/sla-breach-action", json={
            "return_id": "RET-002",
            "breach_hours": 50,
            "customer_email": "test@test.com",
            "product_price": 10000,
        }, headers=H)
        assert r.status_code == 200
        assert r.get_json()["discount_pct"] == 20

    def test_sla_no_breach(self, client, H):
        r = client.post("/api/premium/sla-breach-action", json={"breach_hours": 0}, headers=H)
        assert r.status_code == 200
        assert r.get_json()["status"] == "no_breach"

    # F8: Reverse Auction
    def test_create_auction(self, client, H):
        r = client.post("/api/premium/auction/create", json={
            "product_name": "HP Laptop 15",
            "category": "Electronics",
            "damage_level": "Moderate Damage",
            "product_price": 45000,
            "duration_hours": 24,
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert "auction_id" in d
        assert d["status"] == "OPEN"
        assert d["current_bid"] > 0  # auto-bids generated
        assert len(d["bids"]) >= 1
        return d["auction_id"]

    def test_get_auction_live_bids(self, client, H):
        # Create then immediately fetch
        cr = client.post("/api/premium/auction/create", json={
            "product_name": "Test Item",
            "category": "Electronics",
            "damage_level": "Minor Damage",
            "product_price": 20000,
            "duration_hours": 2,
        }, headers=H)
        auction_id = cr.get_json()["auction_id"]
        r = client.get(f"/api/premium/auction/{auction_id}", headers=H)
        assert r.status_code == 200
        assert "bids" in r.get_json()

    def test_list_auctions(self, client, H):
        r = client.get("/api/premium/auction/list", headers=H)
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    # F11: Multi-language
    def test_i18n_languages_list(self, client):
        r = client.get("/api/premium/i18n/languages")
        assert r.status_code == 200
        langs = r.get_json()
        codes = [l["code"] for l in langs]
        assert "en" in codes
        assert "hi" in codes
        assert "ta" in codes
        assert len(langs) == 5

    def test_i18n_translate_hindi(self, client):
        r = client.get("/api/premium/i18n/translate?lang=hi")
        assert r.status_code == 200
        d = r.get_json()
        assert d["lang"] == "hi"
        assert "strings" in d
        assert "title" in d["strings"]

    def test_i18n_translate_tamil(self, client):
        r = client.get("/api/premium/i18n/translate?lang=ta")
        assert r.status_code == 200

    def test_i18n_fallback_unknown_lang(self, client):
        r = client.get("/api/premium/i18n/translate?lang=xyz")
        assert r.status_code == 200
        assert r.get_json()["lang"] == "xyz"  # falls back to English strings

    # F13: CLV Auto-Approve
    def test_clv_auto_approve_above_threshold(self, client, H):
        r = client.post("/api/premium/clv-auto-approve", json={
            "customer_ltv": 75000,
            "product_price": 8000,
            "ltv_threshold": 50000,
        }, headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["auto_approved"] == True
        assert d["immediate_refund_amount"] == 8000
        assert d["roi_positive"] == True

    def test_clv_auto_approve_below_threshold(self, client, H):
        r = client.post("/api/premium/clv-auto-approve", json={
            "customer_ltv": 20000,
            "product_price": 5000,
            "ltv_threshold": 50000,
        }, headers=H)
        assert r.status_code == 200
        assert r.get_json()["auto_approved"] == False
        assert r.get_json()["immediate_refund_amount"] == 0

    # F15: Supplier Scorecard
    def test_supplier_scorecard(self, client, H):
        r = client.get("/api/premium/suppliers/scorecard", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["feature"] == "Supplier Accountability Dashboard"
        assert "suppliers" in d
        assert isinstance(d["suppliers"], list)

    # F16: Insurance
    def test_insurance_plans(self, client):
        r = client.get("/api/premium/insurance/plans?product_price=20000")
        assert r.status_code == 200
        plans = r.get_json()
        assert len(plans) == 3
        for plan in plans:
            assert "premium_amount" in plan
            assert "coverage_pct" in plan
            assert plan["premium_amount"] > 0

    def test_insurance_file_claim_approved(self, client, H):
        r = client.post("/api/premium/insurance/claim", json={
            "plan_id": "INS-PREM",
            "product_price": 30000,
            "damage_level": "Severe Damage",
        }, headers=H)
        assert r.status_code == 201
        d = r.get_json()
        assert d["status"] == "APPROVED"
        assert d["payout_amount"] > 0

    def test_insurance_file_claim_no_damage(self, client, H):
        r = client.post("/api/premium/insurance/claim", json={
            "plan_id": "INS-BASIC",
            "product_price": 10000,
            "damage_level": "No Damage",
        }, headers=H)
        assert r.status_code == 201
        # No damage = 0 payout
        assert r.get_json()["payout_amount"] == 0

    # F20: 3PL API
    def test_3pl_optimize_with_key(self, client):
        r = client.post("/api/premium/3pl/optimize", json={
            "category": "Electronics",
            "damage_level": "Moderate Damage",
            "product_price": 15000,
            "repair_cost": 2000,
            "origin_city": "Delhi",
        }, headers={"X-API-Key": "rl_testkey123"})
        assert r.status_code == 200
        d = r.get_json()
        assert "recommended_action" in d
        assert "routing_destination" in d
        assert "net_recovery_value" in d
        assert d["api_version"] == "v1"

    def test_3pl_optimize_no_key(self, client):
        r = client.post("/api/premium/3pl/optimize", json={"category": "Electronics"})
        assert r.status_code == 401

    def test_3pl_generate_api_key(self, client, H):
        r = client.post("/api/premium/3pl/api-key/generate", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        assert d["api_key"].startswith("rl_")
        assert "scopes" in d

    # Kanban
    def test_kanban_items(self, client, H):
        r = client.get("/api/premium/kanban/items", headers=H)
        assert r.status_code == 200
        d = r.get_json()
        for col in ["pending", "processing", "completed", "escalated"]:
            assert col in d

    def test_kanban_move(self, client, H, sample_return_id):
        r = client.post("/api/premium/kanban/move", json={
            "return_id": sample_return_id,
            "new_status": "processing",
        }, headers=H)
        assert r.status_code == 200
        assert r.get_json()["success"] == True


# ══════════════════════════════════════════════════════════════════════════
# SLA
# ══════════════════════════════════════════════════════════════════════════
class TestSLA:
    def test_sla_summary(self, client, H):
        r = client.get("/api/sla/summary", headers=H)
        assert r.status_code == 200

    def test_sla_overdue(self, client, H):
        r = client.get("/api/sla/overdue", headers=H)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════
# MARKETPLACE
# ══════════════════════════════════════════════════════════════════════════
class TestMarketplace:
    def test_list_partners(self, client, H):
        r = client.get("/api/marketplace", headers=H)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════
# ROUTING
# ══════════════════════════════════════════════════════════════════════════
class TestRouting:
    def test_routing_suggest(self, client, H):
        r = client.post("/api/routing/suggest", json={
            "damage_level": "Moderate Damage",
            "category": "Electronics",
            "product_price": 20000,
        }, headers=H)
        assert r.status_code == 200

    def test_warehouses_list(self, client, H):
        r = client.get("/api/routing/warehouses", headers=H)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════
# DATASETS
# ══════════════════════════════════════════════════════════════════════════
class TestDatasets:
    def test_list_datasets(self, client, H):
        r = client.get("/api/datasets", headers=H)
        assert r.status_code == 200

    def test_download_sample(self, client, H):
        r = client.get("/api/datasets/sample/returns", headers=H)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════
# EDGE CASES & SECURITY
# ══════════════════════════════════════════════════════════════════════════
class TestEdgeCasesAndSecurity:
    def test_sql_injection_attempt(self, client, H):
        r = client.get("/api/returns?q='; DROP TABLE return_items; --", headers=H)
        assert r.status_code == 200  # Should handle gracefully

    def test_large_price_value(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Luxury Watch",
            "category": "Electronics",
            "product_price": 9999999,
            "days_since_purchase": 1,
            "return_reason": "changed mind",
        }, headers=H)
        assert r.status_code == 201

    def test_negative_price_handled(self, client, H):
        r = client.post("/api/returns", json={
            "product_name": "Test",
            "category": "Electronics",
            "product_price": -1000,
            "days_since_purchase": 5,
            "return_reason": "defective",
        }, headers=H)
        # Should either 400 or handle gracefully
        assert r.status_code in [201, 400]

    def test_invalid_token(self, client):
        r = client.get("/api/returns", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401

    def test_rate_limit_returns_list(self, client, H):
        # Make multiple rapid requests — should all succeed (no rate limiting in test mode)
        for _ in range(5):
            r = client.get("/api/returns?per_page=1", headers=H)
            assert r.status_code == 200

    def test_batch_csv_returns(self, client, H):
        csv_content = (
            "product_name,category,product_price,days_since_purchase,return_reason,warehouse_location\n"
            "Sony TV,Electronics,45000,7,Screen flickering,Mumbai\n"
            "Nike Shoes,Clothing,5000,3,Wrong size,Delhi\n"
            "IKEA Lamp,Home & Kitchen,1200,14,Cosmetic damage,Bangalore\n"
        )
        import io
        data = {"file": (io.BytesIO(csv_content.encode()), "test_batch.csv", "text/csv")}
        r = client.post("/api/returns/batch", data=data,
                        headers={"Authorization": f"Bearer {H['Authorization'].split(' ')[1]}",
                                 "Content-Type": "multipart/form-data"})
        assert r.status_code == 200
        d = r.get_json()
        assert d["processed"] >= 1
