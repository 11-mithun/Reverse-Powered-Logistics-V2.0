# 📊 RL Platform — Datasets

All datasets used are **free and open-source**. No account required for most.

---

## 🚀 Quick Start (Automated)

```bash
cd rl-platform/backend

# Activate your venv first!
source venv/bin/activate

# Generate 5,000 synthetic records (no download needed, works offline)
python scripts/download_datasets.py --dataset synthetic --synthetic-count 5000

# Download real UCI dataset (requires internet)
python scripts/download_datasets.py --dataset uci_retail

# Download all available datasets
python scripts/download_datasets.py --all

# Then train ML models on the data
python scripts/train_models.py

# Restart Flask to load trained models
python run.py
```

---

## 📂 Dataset Catalog

### 1. UCI Online Retail II ⭐ RECOMMENDED
| Property | Value |
|----------|-------|
| **Rows** | 541,909 transactions |
| **Returns** | ~18,000 (negative quantity = return) |
| **License** | CC BY 4.0 (free commercial use) |
| **Format** | XLSX (2 sheets: 2009-2010, 2010-2011) |
| **Size** | ~45 MB (zip) |
| **Account needed** | ❌ No |

**Direct download:**
```
https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip
```

**Manual download:**
1. Go to: https://archive.ics.uci.edu/dataset/502/online+retail+ii
2. Click "Download" button
3. Place zip in: `rl-platform/datasets/`
4. Run: `python scripts/download_datasets.py --dataset uci_retail`

**Columns:** InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country

---

### 2. Olist Brazilian E-Commerce
| Property | Value |
|----------|-------|
| **Rows** | 99,441 orders |
| **License** | CC BY-NC-SA 4.0 |
| **Format** | 9 CSV files |
| **Size** | ~42 MB |
| **Account needed** | ✅ Kaggle account (free) |

**Direct download URL (Kaggle API):**
```bash
pip install kaggle
kaggle datasets download -d olistbr/brazilian-ecommerce
```

**Manual download:**
1. Go to: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
2. Click "Download" (requires free Kaggle account)
3. Extract to: `rl-platform/datasets/olist/`

**Key files:**
- `olist_orders_dataset.csv` — order status including returns
- `olist_order_items_dataset.csv` — product details
- `olist_order_reviews_dataset.csv` — quality signals

---

### 3. Kaggle E-Commerce Shipping Dataset
| Property | Value |
|----------|-------|
| **Rows** | 10,999 shipments |
| **License** | CC0 Public Domain |
| **Format** | CSV |
| **Size** | ~1 MB |
| **Account needed** | ✅ Kaggle account (free) |

**Kaggle API:**
```bash
kaggle datasets download -d nidozhussain/ecommerce-shipping-dataset
```

**Manual:** https://www.kaggle.com/datasets/nidozhussain/ecommerce-shipping-dataset

---

### 4. Mendeley Reverse Logistics Research Dataset
| Property | Value |
|----------|-------|
| **Rows** | ~5,000 |
| **License** | CC BY 4.0 |
| **Format** | CSV |
| **Size** | ~2 MB |
| **Account needed** | ❌ No |

**Direct download:**
https://data.mendeley.com/datasets/3k3gcdbkzb/1

---

### 5. Synthetic RL Platform Dataset (Built-in) ✅ ALWAYS WORKS
| Property | Value |
|----------|-------|
| **Rows** | Configurable (default: 150, max: unlimited) |
| **License** | MIT |
| **Format** | Generated at runtime |
| **Download needed** | ❌ No — auto-seeded on first run |

```bash
# Generate larger synthetic dataset for training
python scripts/download_datasets.py --dataset synthetic --synthetic-count 10000
```

Generated using realistic patterns from:
- Real return reason distributions from retail research
- Indian e-commerce pricing and location data
- Category-specific return rate statistics

---

## 🤖 Using Kaggle API (Automated Downloads)

```bash
# Install Kaggle CLI inside venv
pip install kaggle==1.6.17

# Get your API key:
# 1. Go to https://www.kaggle.com/settings
# 2. Click "Create New Token"
# 3. Download kaggle.json
# 4. Place at: ~/.kaggle/kaggle.json (Linux/Mac)
#              %USERPROFILE%\.kaggle\kaggle.json (Windows)
chmod 600 ~/.kaggle/kaggle.json

# Then download:
kaggle datasets download -d olistbr/brazilian-ecommerce -p datasets/
kaggle datasets download -d nidozhussain/ecommerce-shipping-dataset -p datasets/
```

---

## 📥 Importing Data into RL Platform

### Option A: Batch CSV Upload (Dashboard)
1. Go to `/returns/batch` in the dashboard
2. Download template: `GET /api/datasets/sample`
3. Fill your data in the CSV format
4. Upload via the batch processor UI

### Option B: API Import
```bash
curl -X POST http://localhost:5000/api/returns/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@datasets/uci_returns_converted.csv"
```

### Option C: Direct DB Import (Fastest)
```bash
cd backend
source venv/bin/activate
python -c "
from app import create_app, db
from app.utils.seeder import seed_all
app = create_app()
with app.app_context():
    seed_all()
"
```

---

## 🧠 Training ML Models

After downloading data:
```bash
cd backend
source venv/bin/activate

# Train on synthetic data (offline, always works)
python scripts/train_models.py

# Train on UCI retail data (better accuracy)
python scripts/train_models.py --data datasets/uci_returns_converted.csv

# Train on large synthetic dataset
python scripts/download_datasets.py --dataset synthetic --synthetic-count 10000
python scripts/train_models.py --data datasets/synthetic_returns.csv
```

**Trained model files (saved to `backend/models_trained/`):**
| File | Purpose | Algorithm |
|------|---------|-----------|
| `damage_classifier.pkl` | Damage level prediction | Random Forest |
| `action_recommender.pkl` | Return action prediction | Gradient Boosting |
| `fraud_detector.pkl` | Anomaly/fraud detection | Isolation Forest |
| `priority_classifier.pkl` | SLA priority prediction | Random Forest |
| `training_meta.json` | Training stats and feature info | — |

Models are auto-loaded by Flask on restart. No code changes needed.

---

## 📊 Expected Model Accuracy (on 5k+ records)

| Model | Expected Accuracy |
|-------|-----------------|
| Damage Classifier | 88–94% |
| Action Recommender | 85–91% |
| Priority Classifier | 82–89% |
| Fraud Detector | Unsupervised (anomaly score) |

---

## 🌐 Network Note

If you're in a restricted network environment:
1. Use the **synthetic dataset** — it requires no downloads
2. Download datasets on a machine with internet, then copy the CSV files
3. Place CSVs in `rl-platform/datasets/` and import via batch upload
