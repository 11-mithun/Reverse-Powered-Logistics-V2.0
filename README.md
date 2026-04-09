# RL Platform v2.0 — Intelligent Reverse Logistics

> **Next-generation AI-powered reverse logistics platform** with multi-agent reasoning, real-time asset valuation, autonomous inventory redistribution, GAN synthetic fraud data, and a premium holographic dashboard.

---

## 🚀 What's New in v2.0

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Agent Pipeline** | 5 specialized AI agents (Market, Inventory, Fraud, Escalation, Resolution) |
| 📈 **Real-time Asset Valuation** | Auto-switch Refurbish→Liquidate on 20%+ market price drop |
| 📦 **Autonomous Redistribution** | Returns routed to understocked warehouses automatically |
| 🧪 **GAN Synthetic Data Vault** | 5 fraud archetypes solve the AI cold-start problem |
| 💎 **Hyper-Personalized Disposition** | LTV-based auto-approval for Platinum/Gold customers |
| 🏆 **Reverse Auctions** | Liquidation partners bid in real-time for returned items |
| 🔧 **Cognitive Procurement** | AI predicts spare parts needed from damage patterns |
| 🌍 **Multi-language Portal** | 5 languages: English, Hindi, Tamil, Bengali, Telugu |
| 🛡️ **Return Insurance** | Paid protection plans with instant claim processing |
| 🌱 **Carbon Offset Tracker** | Live CO₂ savings from refurbishment decisions |
| 📡 **3PL REST API** | External partners query optimal routing via API key |
| 📊 **Boardroom View** | Full-screen executive dashboard with auto-rotating metrics |
| 🎯 **Kanban Board** | Drag-to-move returns across workflow stages |
| ⚡ **SLA Breach Coupons** | Automatic discount codes on SLA violations |

---

## 🏗️ Architecture

```
rl-platform/
├── backend/                    # Flask API server
│   ├── app/
│   │   ├── ai/
│   │   │   ├── decision_engine.py      # Claude/Gemini/GPT/Rule-based
│   │   │   ├── ml_models.py            # Fraud scoring, CLV, pricing
│   │   │   └── agents/
│   │   │       ├── market_dynamics_agent.py    # Real-time asset valuation
│   │   │       ├── inventory_balancing_agent.py # Auto redistribution
│   │   │       ├── gan_synthetic.py             # Synthetic fraud data
│   │   │       └── orchestrator.py              # Pipeline coordinator
│   │   ├── blueprints/
│   │   │   ├── returns.py, analytics.py, fraud.py
│   │   │   ├── agents.py               # /api/agents/* routes
│   │   │   └── premium.py              # /api/premium/* routes
│   │   └── models/
│   ├── tests/
│   │   └── test_all.py                 # 50+ E2E tests
│   └── requirements.txt
└── frontend/                   # Next.js 14 app
    └── src/app/
        ├── (dashboard)/
        │   ├── dashboard/              # Command Center (KPIs, neural net, carbon)
        │   ├── boardroom/              # Executive fullscreen view
        │   ├── agents/                 # AI Agent Hub + live comms log
        │   ├── kanban/                 # Drag-drop workflow board
        │   ├── auction/                # Reverse auction with live bidding
        │   ├── supplier/               # Supplier accountability scorecard
        │   ├── insurance/              # Return insurance & claims
        │   ├── procurement/            # Cognitive procurement analysis
        │   ├── returns/                # Returns list, submit, detail
        │   ├── analytics/              # Charts, forecasts, heatmaps
        │   └── settings/
        └── portal/                     # Public customer return portal
```

---

## ⚡ Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add at least one LLM key (or leave blank for rule-based)
python run.py
# → API running at http://localhost:5000
# → Auto-creates admin@rlplatform.com / Admin@123456
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # or create: NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
# → App running at http://localhost:3000
```

### 3. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@rlplatform.com` | `Admin@123456` |
| Demo Customer | `demo@customer.com` | `Demo@123456` |

---

## 🔑 Environment Variables

```env
# backend/.env

# Database (defaults to SQLite)
DATABASE_URL=sqlite:///rl_platform.db

# LLM Keys — use ANY one (system auto-selects first available)
ANTHROPIC_API_KEY=sk-ant-...        # Free credits at console.anthropic.com
GEMINI_API_KEY=AIza...              # Free 1M req/day at aistudio.google.com
OPENAI_API_KEY=sk-...               # Pay-per-use at platform.openai.com

# App Config
SECRET_KEY=your-super-secret-key-here
ADMIN_EMAIL=admin@rlplatform.com
ADMIN_PASSWORD=Admin@123456
FRONTEND_URL=http://localhost:3000
```

---

## 🤖 Multi-Agent System

### Agent Pipeline Flow

```
Return Submitted
       │
       ▼
FraudDetectionAgent ──────────────────────────────────────────────┐
       │                                                           │
       ▼                                                           │
MarketDynamicsAgent                                                │
  • Fetches real-time resale prices (eBay, Amazon, Flipkart, OLX) │
  • If price drop ≥ 20%: switches Repair Center → Liquidation     │
  • If repair cost > 40% of market value: auto-liquidate          │
       │                                                           │
       ▼                                                           │
InventoryBalancingAgent                                            │
  • Checks stock across 6 regional warehouses                     │
  • If target WH is CRITICAL/UNDERSTOCKED: route return directly  │
  • Autonomous Inventory Redistribution triggered                  │
       │                                                           │
       ▼                                                           │
EscalationAgent                                                    │
  • Fraud=HIGH + LTV>₹50K → Manual Override (human review)        │
  • Fraud=HIGH + standard → Auto-Reject                           │
  • Flags conflict between fraud risk and customer value           │
       │                                                           │
       ▼                                                           │
ResolutionAgent ──────────────────────────────────────────────────┘
  • Finalises routing + action
  • Emits WebSocket event to dashboard
  • Logs to Agent Communication Feed
```

### Triggering the Pipeline

```bash
curl -X POST http://localhost:5000/api/agents/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "return_id": "RET-001",
    "category": "Electronics",
    "sku": "SKU-TECH-042",
    "original_price": 24999,
    "damage_level": "Moderate Damage",
    "current_routing": "Repair Center",
    "repair_cost": 2500,
    "warehouse_location": "Mumbai",
    "fraud_risk": "Low",
    "customer_ltv": 45000
  }'
```

---

## 🧪 GAN Synthetic Data Vault

The system generates synthetic fraudulent return patterns to solve the ML cold-start problem.

**5 Fraud Archetypes:**
- `wardrobing` — Buy, use, return (clothing/electronics)
- `switch_fraud` — Returns different/broken item, keeps original
- `identity_fraud` — Multiple accounts, same delivery address
- `collusion_fraud` — Insider + customer working together
- `opportunistic_fraud` — Exploiting lenient return policies

```bash
# Generate training dataset
curl -X POST http://localhost:5000/api/agents/synthetic/generate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"n_fraud": 500, "n_legitimate": 1000}'
```

---

## 📡 3PL REST API (F20)

External logistics partners can query routing decisions:

```bash
curl -X POST http://localhost:5000/api/premium/3pl/optimize \
  -H "X-API-Key: rl_your_partner_key" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Electronics",
    "damage_level": "Moderate Damage",
    "product_price": 15000,
    "repair_cost": 2000,
    "origin_city": "Delhi"
  }'
```

**Generate API Key:**
```bash
curl -X POST http://localhost:5000/api/premium/3pl/api-key/generate \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate

# All tests with verbose output
python -m pytest tests/ -v

# With coverage report
python -m pytest tests/ -v --cov=app --cov-report=term-missing

# Specific test class
python -m pytest tests/ -v -k "TestAgents"
python -m pytest tests/ -v -k "TestPremiumFeatures"

# Fail fast on first error
python -m pytest tests/ -v -x
```

**Test Coverage:**
- ✅ Authentication (login, register, token validation)
- ✅ Returns CRUD (create, list, filter, update, batch CSV)
- ✅ AI Decision Engine (damage classification, salvage, fraud)
- ✅ Analytics endpoints (heatmap, daily, forecast, KPIs)
- ✅ Multi-Agent Pipeline (full orchestration, escalation)
- ✅ Market Dynamics Agent (price evaluation, routing switch)
- ✅ Inventory Balancing Agent (stock levels, redistribution)
- ✅ GAN Synthetic Vault (dataset generation, stats)
- ✅ F1 Cognitive Procurement
- ✅ F2 Hyper-Personalized Disposition (Platinum, Standard)
- ✅ F6 Dynamic SLA Pricing (all breach tiers)
- ✅ F8 Reverse Auctions (create, bid, list)
- ✅ F11 Multi-language (5 languages)
- ✅ F13 CLV Auto-Approve (above/below threshold)
- ✅ F15 Supplier Scorecard
- ✅ F16 Return Insurance (plans, claims, no-damage)
- ✅ F20 3PL API (with/without key)
- ✅ Security (SQL injection, invalid tokens, edge cases)

---

## 🎨 Frontend Design System

### Premium CSS Classes

| Class | Use |
|-------|-----|
| `.card-glass` | Glassmorphism card with gradient top border |
| `.card-premium` | Hover-animated card with brand gradient |
| `.holographic` | Aurora iridescent shimmer card (D2) |
| `.btn-brand` | Indigo gradient primary button |
| `.btn-cyan` | Cyan gradient secondary button |
| `.input-premium` | Dark glass input with focus glow |
| `.badge-success/warning/danger/info` | Status badges |
| `.text-gradient-brand/cyan/emerald/amber/rose` | Text gradients |
| `.divider-brand` | Brand gradient horizontal divider |
| `.agent-msg-{type}` | Coloured agent message cards |
| `.animate-marquee` | D6 scrolling ticker animation |
| `.animate-float` | Floating animation for hero elements |
| `.animate-ping-soft` | Soft pulse for live status dots |

### Design Features Implemented

| Code | Feature |
|------|---------|
| D1 | Neural Network animated canvas (WebGL particles) |
| D2 | Holographic iridescent metric cards |
| D6 | Live agent ticker at top of every page |
| D7 | Ambient sound toggle in sidebar |
| D8 | Kanban board with column workflow |
| D9 | Boardroom fullscreen auto-rotating view |
| D10 | AI Reasoning step-by-step playback |

---

## 📊 API Reference

### Returns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/returns` | List with filters (status, category, fraud_risk, q) |
| POST | `/api/returns` | Create + trigger AI pipeline |
| GET | `/api/returns/:id` | Single return detail |
| PATCH | `/api/returns/:id` | Update status/action |
| POST | `/api/returns/batch` | CSV batch processing |
| GET | `/api/returns/stats/summary` | KPI summary |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/run` | Full multi-agent pipeline |
| GET | `/api/agents/communication-log` | Live agent comms feed |
| GET | `/api/agents/market/prices` | Market prices by category |
| POST | `/api/agents/market/evaluate` | Routing re-evaluation |
| GET | `/api/agents/inventory/health` | Network warehouse health |
| GET | `/api/agents/inventory/stock` | Stock levels by SKU |
| POST | `/api/agents/synthetic/generate` | GAN dataset generation |
| GET | `/api/agents/carbon-offset` | CO₂ saved metrics |
| GET | `/api/agents/nrv-heatmap` | NRV by region |

### Premium
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/premium/cognitive-procurement` | Spare parts AI |
| POST | `/api/premium/hyper-disposition` | LTV-based disposition |
| POST | `/api/premium/sla-breach-action` | Auto coupon on SLA breach |
| POST | `/api/premium/auction/create` | Launch reverse auction |
| GET | `/api/premium/auction/:id` | Live auction + bids |
| GET | `/api/premium/i18n/languages` | Available languages |
| GET | `/api/premium/i18n/translate?lang=hi` | Translated strings |
| POST | `/api/premium/clv-auto-approve` | LTV auto-approve check |
| GET | `/api/premium/suppliers/scorecard` | Supplier quality ranking |
| GET | `/api/premium/insurance/plans` | Insurance plan pricing |
| POST | `/api/premium/insurance/claim` | File insurance claim |
| POST | `/api/premium/3pl/optimize` | External routing API (X-API-Key) |
| POST | `/api/premium/kanban/move` | Move return between stages |

---

## 🌱 ESG / Sustainability

The platform tracks environmental impact automatically:

- **CO₂ saved** per refurbishment (vs scrapping) — displayed in kg
- **Trees equivalent** calculation (1 tree = 21 kg CO₂/year)
- **Cars off road** equivalent
- **ESG Grade** (A+ to C) based on refurbishment ratio
- Auto-included in Carbon Offset Tracker widget on dashboard

---

## 🔒 Security

- JWT Bearer token authentication on all protected routes
- Token expiry with auto-redirect to login
- SQL injection protection via SQLAlchemy ORM
- CORS whitelisted to frontend URL only
- Rate limiting ready (Flask-Limiter compatible)
- API key authentication for 3PL external partners

---

## 🤝 Interview Keywords

Use these when presenting the system:

- **"Cognitive Procurement"** — AI-driven spare parts prediction
- **"Hyper-Personalized Disposition"** — LTV-aware return policies
- **"Zero-Touch Logistics"** — fully automated return processing
- **"Real-time Asset Valuation"** — live market price monitoring
- **"Autonomous Inventory Redistribution"** — return-as-replenishment
- **"Technical Debt Mitigation"** — modular microservices (Flask + Next.js)
- **"GAN Cold-Start Solution"** — synthetic data for rare fraud classes
- **"Agentic Escalation Layer"** — multi-agent conflict resolution

---

*Built with ❤️ — RL Platform v2.0 | Flask + Next.js + Multi-Agent AI*
