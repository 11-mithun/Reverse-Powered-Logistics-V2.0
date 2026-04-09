# RL Platform — Datasets

## Included Datasets

### synthetic_returns_1000.csv (auto-generated, always available)
1,000 rows with full OSCM decision labels for ML training.
Fields: product_name, category, price, days, damage_level, action, nrv, fraud_risk, etc.

### uci_online_retail/ (downloaded if network available)
UCI Online Retail II — 1M+ real e-commerce transactions
License: CC BY 4.0  |  https://archive.ics.uci.edu/dataset/502/online+retail+ii

## Kaggle Datasets (free manual download)
1. https://kaggle.com/datasets/thedevastator/analyzing-product-returns-in-e-commerce
2. https://kaggle.com/datasets/nidozhussain/ecommerce-shipping-dataset
3. https://kaggle.com/datasets/harshsingh2209/supply-chain-analysis

## How to use for training
    python scripts/train_models.py
    python scripts/train_models.py --dataset datasets/your_custom.csv

## Batch import into the platform
    Upload any CSV at: http://localhost:3000/returns/batch
    Sample template: GET http://localhost:5000/api/datasets/sample
