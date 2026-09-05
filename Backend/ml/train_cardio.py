import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, f1_score,
    brier_score_loss, classification_report, confusion_matrix
)
from sklearn.inspection import permutation_importance

def load_and_preprocess_data(csv_path: str):
    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path, sep=';')
    print(f"Raw patient count: {len(df)}")

    # 1. Clean physiological outliers (filter out measurement typos)
    clean_mask = (
        (df['ap_hi'] >= 80) & (df['ap_hi'] <= 240) &
        (df['ap_lo'] >= 40) & (df['ap_lo'] <= 160) &
        (df['ap_hi'] > df['ap_lo']) &
        (df['height'] >= 120) & (df['height'] <= 220) &
        (df['weight'] >= 35) & (df['weight'] <= 220)
    )
    df_clean = df[clean_mask].copy()
    print(f"Physiologically valid records preserved: {len(df_clean)} ({len(df_clean)/len(df)*100:.1f}%)")

    # 2. Feature Engineering
    # Convert age from days to exact years
    df_clean['age_years'] = (df_clean['age'] / 365.25).round(1)
    
    # Standardize gender: 1 = Male (raw was 2), 0 = Female (raw was 1)
    df_clean['gender'] = (df_clean['gender'] == 2).astype(int)

    # Body Mass Index (BMI = kg / m^2)
    df_clean['bmi'] = (df_clean['weight'] / ((df_clean['height'] / 100) ** 2)).round(1)

    # Clinical Cardiology Metrics: Pulse Pressure & Mean Arterial Pressure (MAP)
    df_clean['pulse_pressure'] = df_clean['ap_hi'] - df_clean['ap_lo']
    df_clean['map'] = (df_clean['ap_lo'] + (df_clean['pulse_pressure'] / 3.0)).round(1)

    # ACC/AHA Blood Pressure Stages (0: Normal, 1: Elevated, 2: Stage 1, 3: Stage 2)
    def categorize_bp(row):
        hi, lo = row['ap_hi'], row['ap_lo']
        if hi >= 140 or lo >= 90:
            return 3  # Stage 2 Hypertension
        elif (130 <= hi < 140) or (80 <= lo < 90):
            return 2  # Stage 1 Hypertension
        elif (120 <= hi < 130) and lo < 80:
            return 1  # Elevated
        else:
            return 0  # Normal

    df_clean['bp_stage'] = df_clean.apply(categorize_bp, axis=1)

    # WHO BMI Categories (0: Under/Normal, 1: Overweight, 2: Obese Class 1, 3: Severe Obese)
    def categorize_bmi(bmi):
        if bmi < 25.0:
            return 0
        elif bmi < 30.0:
            return 1
        elif bmi < 35.0:
            return 2
        else:
            return 3

    df_clean['bmi_category'] = df_clean['bmi'].apply(categorize_bmi)

    # Compound Lifestyle Risk Count (smoking + alcohol + inactivity)
    df_clean['lifestyle_risk'] = df_clean['smoke'] + df_clean['alco'] + (1 - df_clean['active'])

    feature_cols = [
        'age_years',
        'gender',
        'height',
        'weight',
        'bmi',
        'ap_hi',
        'ap_lo',
        'pulse_pressure',
        'map',
        'bp_stage',
        'bmi_category',
        'cholesterol',
        'gluc',
        'smoke',
        'alco',
        'active',
        'lifestyle_risk'
    ]

    X = df_clean[feature_cols]
    y = df_clean['cardio']

    return X, y, feature_cols, df_clean

def train_and_evaluate(X, y, feature_cols):
    print("\n--- Model Training & Cross Validation ---")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training split: {len(X_train)} samples | Holdout test split: {len(X_test)} samples")

    # Base Gradient Boosting Estimator
    base_gbm = HistGradientBoostingClassifier(
        max_iter=250,
        learning_rate=0.07,
        max_depth=6,
        min_samples_leaf=25,
        l2_regularization=1.5,
        random_state=42
    )

    # Cross-validated Probability Calibration
    print("Training Calibrated Classifier with 5-Fold Stratified CV...")
    calibrated_model = CalibratedClassifierCV(
        estimator=base_gbm,
        cv=5,
        method='sigmoid'
    )
    
    calibrated_model.fit(X_train, y_train)

    # Fit a standalone base estimator to extract feature importances
    base_gbm.fit(X_train, y_train)
    perm_importance = permutation_importance(
        base_gbm, X_test, y_test, n_repeats=5, random_state=42, scoring='roc_auc'
    )
    importances = dict(zip(feature_cols, perm_importance.importances_mean.tolist()))

    # Evaluate on Holdout Test Set
    y_pred_proba = calibrated_model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    test_roc_auc = float(roc_auc_score(y_test, y_pred_proba))
    test_accuracy = float(accuracy_score(y_test, y_pred))
    test_precision = float(precision_score(y_test, y_pred))
    test_recall = float(recall_score(y_test, y_pred))
    test_f1 = float(f1_score(y_test, y_pred))
    test_brier = float(brier_score_loss(y_test, y_pred_proba))

    print(f"\n=== HOLDOUT TEST RESULTS ===")
    print(f"ROC-AUC Score:        {test_roc_auc:.4f}")
    print(f"Brier Score (Calib):  {test_brier:.4f}")
    print(f"Accuracy:             {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
    print(f"Precision:            {test_precision:.4f}")
    print(f"Recall:               {test_recall:.4f}")
    print(f"F1 Score:             {test_f1:.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Calculate Feature Population Baselines (means, medians, stds) for Real-Time SHAP/Impact scoring
    baselines = {}
    for col in feature_cols:
        baselines[col] = {
            "median": float(X[col].median()),
            "mean": float(X[col].mean()),
            "std": float(X[col].std()),
            "min": float(X[col].min()),
            "max": float(X[col].max())
        }

    metadata = {
        "model_type": "Calibrated_HistGradientBoosting",
        "feature_names": feature_cols,
        "n_samples": int(len(X)),
        "metrics": {
            "roc_auc": round(test_roc_auc, 4),
            "accuracy": round(test_accuracy, 4),
            "precision": round(test_precision, 4),
            "recall": round(test_recall, 4),
            "f1": round(test_f1, 4),
            "brier_score": round(test_brier, 4)
        },
        "feature_importances": importances,
        "baselines": baselines,
        "risk_thresholds": {
            "low_cutoff": 0.25,
            "moderate_cutoff": 0.60
        }
    }

    return calibrated_model, metadata

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "cardio_train.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Missing {csv_path}. Please place cardio_train.csv in Backend/ml/")

    X, y, feature_cols, df_clean = load_and_preprocess_data(csv_path)
    model, metadata = train_and_evaluate(X, y, feature_cols)

    # Save Model & Metadata
    model_output_path = os.path.join(base_dir, "cardio_model.joblib")
    metadata_output_path = os.path.join(base_dir, "cardio_model_metadata.json")

    joblib.dump(model, model_output_path)
    print(f"\n[OK] Model successfully saved to: {model_output_path}")

    with open(metadata_output_path, "w") as f:
        json.dump(metadata, f, indent=4)
    print(f"[OK] Metadata successfully saved to: {metadata_output_path}")
