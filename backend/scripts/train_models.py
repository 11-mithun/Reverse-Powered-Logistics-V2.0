#!/usr/bin/env python3
"""
ML Model Training Script for RL Platform
=========================================
Trains scikit-learn models on the synthetic/real dataset.
Trained models are saved to models/ and auto-loaded by the API.

Usage:
    source venv/bin/activate
    python scripts/train_models.py                             # use synthetic data
    python scripts/train_models.py --dataset path/to/data.csv # use custom data

Models trained:
  1. DamageClassifier    — predicts damage level from text+features (RandomForest)
  2. FraudDetector       — detects suspicious returns (IsolationForest + heuristics)
  3. ActionPredictor     — predicts optimal action (GradientBoosting)
  4. SalvageRegressor    — predicts salvage % (GradientBoosting Regressor)
  5. NRVPredictor        — predicts net recovery value (Linear Regression)

NOTE: These models enhance the rule-based engine. The LLM still makes
      the final decision when an API key is available.
"""
import sys, os, json, argparse
from pathlib import Path

# Add parent to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)
DATASETS_DIR = Path(__file__).parent.parent / "datasets"


def load_data(csv_path: str):
    import csv
    rows = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def encode_features(rows):
    """Convert CSV rows to numeric feature matrix."""
    DAMAGE_CODES = {"No Damage": 0, "Minor Damage": 1, "Moderate Damage": 2, "Severe Damage": 3}
    ACTION_CODES = {"Restock": 0, "Repack and Discount": 1, "Refurbish": 2, "Liquidate": 3, "Scrap / E-Waste": 4}
    CAT_CODES = {"Electronics":0,"Clothing":1,"Home & Kitchen":2,"Sports":3,
                 "Furniture":4,"Books":5,"Toys":6,"Beauty":7,"Automotive":8}
    FRAUD_CODES = {"Low": 0, "Medium": 1, "High": 2}

    X, y_damage, y_action, y_salvage, y_nrv, y_fraud = [], [], [], [], [], []
    for r in rows:
        try:
            features = [
                float(r.get("product_price", 0)),
                int(r.get("days_since_purchase", 0)),
                float(r.get("repair_cost", 0)),
                CAT_CODES.get(r.get("category", ""), 0),
                len(r.get("return_reason", "").split()),  # word count of reason
                int(float(r.get("product_price", 0)) > 5000),  # high-value flag
            ]
            X.append(features)
            y_damage.append(DAMAGE_CODES.get(r.get("damage_level", "No Damage"), 0))
            y_action.append(ACTION_CODES.get(r.get("recommended_action", "Liquidate"), 3))
            y_salvage.append(float(r.get("salvage_value_percent", 75)))
            y_nrv.append(float(r.get("net_recovery_value", 0)))
            y_fraud.append(FRAUD_CODES.get(r.get("fraud_risk", "Low"), 0))
        except Exception:
            continue
    return X, y_damage, y_action, y_salvage, y_nrv, y_fraud


def train_all(rows):
    print(f"Training on {len(rows)} rows...")
    try:
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, GradientBoostingRegressor
        from sklearn.linear_model import LinearRegression
        from sklearn.ensemble import IsolationForest
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score
        import joblib
        import numpy as np
    except ImportError as e:
        print(f"Missing package: {e}")
        print("Run: pip install scikit-learn joblib numpy")
        return

    X, y_damage, y_action, y_salvage, y_nrv, y_fraud = encode_features(rows)
    if len(X) < 10:
        print("Not enough data rows to train. Need at least 10.")
        return

    X = np.array(X, dtype=float)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    results = {}

    # 1. Damage Classifier
    print("  [1/5] Training DamageClassifier (RandomForest)...")
    Xtr, Xte, ytr, yte = train_test_split(X_scaled, y_damage, test_size=0.2, random_state=42)
    clf1 = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf1.fit(Xtr, ytr)
    acc = accuracy_score(yte, clf1.predict(Xte))
    print(f"      Accuracy: {acc:.1%}")
    joblib.dump(clf1, MODELS_DIR / "damage_classifier.pkl")
    results["damage_classifier_accuracy"] = round(acc, 4)

    # 2. Action Predictor
    print("  [2/5] Training ActionPredictor (GradientBoosting)...")
    Xtr, Xte, ytr, yte = train_test_split(X_scaled, y_action, test_size=0.2, random_state=42)
    clf2 = GradientBoostingClassifier(n_estimators=100, random_state=42)
    clf2.fit(Xtr, ytr)
    acc2 = accuracy_score(yte, clf2.predict(Xte))
    print(f"      Accuracy: {acc2:.1%}")
    joblib.dump(clf2, MODELS_DIR / "action_predictor.pkl")
    results["action_predictor_accuracy"] = round(acc2, 4)

    # 3. Salvage Regressor
    print("  [3/5] Training SalvageRegressor (GradientBoosting)...")
    Xtr, Xte, ytr, yte = train_test_split(X_scaled, y_salvage, test_size=0.2, random_state=42)
    reg1 = GradientBoostingRegressor(n_estimators=100, random_state=42)
    reg1.fit(Xtr, ytr)
    r2 = reg1.score(Xte, yte)
    print(f"      R² score: {r2:.3f}")
    joblib.dump(reg1, MODELS_DIR / "salvage_regressor.pkl")
    results["salvage_r2"] = round(r2, 4)

    # 4. NRV Predictor
    print("  [4/5] Training NRVPredictor (LinearRegression)...")
    Xtr, Xte, ytr, yte = train_test_split(X_scaled, y_nrv, test_size=0.2, random_state=42)
    reg2 = LinearRegression()
    reg2.fit(Xtr, ytr)
    r2_nrv = reg2.score(Xte, yte)
    print(f"      R² score: {r2_nrv:.3f}")
    joblib.dump(reg2, MODELS_DIR / "nrv_predictor.pkl")
    results["nrv_r2"] = round(r2_nrv, 4)

    # 5. Fraud Detector (IsolationForest for anomaly + RF for supervision)
    print("  [5/5] Training FraudDetector (IsolationForest)...")
    iso = IsolationForest(contamination=0.1, random_state=42, n_jobs=-1)
    iso.fit(X_scaled)
    joblib.dump(iso, MODELS_DIR / "fraud_detector.pkl")
    print("      IsolationForest trained on full dataset")
    results["fraud_detector"] = "trained"

    # Save scaler
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")

    # Save training metadata
    meta = {
        "training_rows": len(rows),
        "features": ["product_price","days_since_purchase","repair_cost","category_code","reason_word_count","high_value_flag"],
        "models": ["damage_classifier","action_predictor","salvage_regressor","nrv_predictor","fraud_detector"],
        "results": results,
    }
    with open(MODELS_DIR / "training_meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n  All models saved to: {MODELS_DIR}/")
    print(f"  Training metadata: {MODELS_DIR}/training_meta.json")
    print(f"  Results: {json.dumps(results, indent=4)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train RL Platform ML models")
    parser.add_argument("--dataset", default=None, help="Path to CSV dataset (default: synthetic)")
    args = parser.parse_args()

    if args.dataset:
        csv_path = args.dataset
        if not os.path.exists(csv_path):
            print(f"Dataset not found: {csv_path}")
            sys.exit(1)
    else:
        csv_path = str(DATASETS_DIR / "synthetic_returns_1000.csv")
        if not os.path.exists(csv_path):
            print("Synthetic dataset not found. Generating...")
            os.system("python scripts/download_datasets.py")

    print("=" * 55)
    print("  RL Platform — ML Model Training")
    print("=" * 55)
    rows = load_data(csv_path)
    print(f"Loaded {len(rows)} rows from {csv_path}")
    train_all(rows)
    print("\nDone! Restart the Flask server to use trained models.")
