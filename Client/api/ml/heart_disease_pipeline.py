import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

def load_and_explore(filepath):
    print("--- Loading and Exploring Data ---")
    df = pd.read_csv(filepath)
    print(f"Shape: {df.shape}")
    print("\nInfo:")
    df.info()
    print("\nChecking for missing values:")
    print(df.isnull().sum())
    
    # Handle missing values if any
    if df.isnull().sum().sum() > 0:
        df = df.dropna()
        print("Dropped missing values.")
        
    return df

def feature_engineering_and_split(df):
    print("\n--- Data Splitting and Scaling ---")
    X = df.drop(columns=['target'])
    y = df['target']
    
    # Train-test split with fixed random_state
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save scaler for future predictions
    joblib.dump(scaler, 'scaler.pkl')
    print("Saved Scaler to 'scaler.pkl'")
    
    return X_train_scaled, X_test_scaled, y_train, y_test, X.columns

def train_and_evaluate(X_train, X_test, y_train, y_test, feature_names):
    print("\n--- Training Models ---")
    
    models = {
        "Logistic Regression": LogisticRegression(random_state=42),
        "Random Forest": RandomForestClassifier(random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    }
    
    trained_models = {}
    
    for name, model in models.items():
        print(f"\n================ Eval: {name} ================")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        print(f"Accuracy: {acc:.4f}")
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        trained_models[name] = model
        
        # Save models to disk
        filename = f"{name.replace(' ', '_').lower()}_model.pkl"
        joblib.dump(model, filename)
        print(f"Saved {name} to {filename}")
        
    print("\n--- Explainability (Feature Importance & Coefficients) ---")
    
    # Logistic Regression Coefficients
    print("\nLogistic Regression Coefficients:")
    log_reg = trained_models["Logistic Regression"]
    coef_df = pd.DataFrame({'Feature': feature_names, 'Coefficient': log_reg.coef_[0]})
    coef_df = coef_df.sort_values(by='Coefficient', ascending=False)
    print(coef_df)
    
    # Random Forest Feature Importance
    print("\nRandom Forest Feature Importance:")
    rf = trained_models["Random Forest"]
    rf_importance = pd.DataFrame({'Feature': feature_names, 'Importance': rf.feature_importances_})
    rf_importance = rf_importance.sort_values(by='Importance', ascending=False)
    print(rf_importance)
    
    return trained_models

def predict_and_explain(patient_data_dict, model, scaler, feature_names):
    """
    Takes patient data dictionary, predicts risk, and explains the factors.
    Uses predict_proba to output a risk percentage.
    """
    print("\n--- New Patient Prediction (ZEZE Explainability) ---")
    
    # Convert input to DataFrame mapping the exact training columns
    patient_df = pd.DataFrame([patient_data_dict])[feature_names]
    
    # Scale features
    patient_scaled = scaler.transform(patient_df)
    
    # Predict Probability
    probabilities = model.predict_proba(patient_scaled)[0]
    risk_percentage = probabilities[1] * 100
    
    print(f"Patient Risk: {risk_percentage:.2f}%")
    
    # Build explanation: Pick factors that have very high or low values for this patient
    top_factors = []
    
    for i, feature in enumerate(feature_names):
        z_score = patient_scaled[0][i]
        val = patient_df.iloc[0][i]
        
        # If the feature deviates by more than 1 standard deviation from the mean, it's a driving factor
        if z_score > 1.0:
            top_factors.append(f"high {feature} ({val})")
        elif z_score < -1.0:
            top_factors.append(f"low {feature} ({val})")
            
    if top_factors:
        explanation = f"High risk due to " + ", ".join(top_factors) + "." if risk_percentage >= 50 else f"Lower risk, though notes of " + ", ".join(top_factors) + "."
    else:
        explanation = f"{'High' if risk_percentage >= 50 else 'Low'} risk; all key health indicators are within reasonably normal ranges compared to the baseline population."
        
    print(f"\nExplanation: {explanation}")
    return risk_percentage, explanation

if __name__ == "__main__":
    filepath = "Heart_disease_cleveland_new.csv"
    
    # 1. Load Data
    df = load_and_explore(filepath)
    
    # 2. Preprocess
    X_train_scaled, X_test_scaled, y_train, y_test, feature_names = feature_engineering_and_split(df)
    
    # 3. Train & Evaluate
    trained_models = train_and_evaluate(X_train_scaled, X_test_scaled, y_train, y_test, feature_names)
    
    # 4. Demonstrate Explainability function
    print("\nLoading models from disk to simulate production environment...")
    scaler_loaded = joblib.load('scaler.pkl')
    # Using Logistic Regression as we can interpret coefficients easily, or Random forest as best accuracy
    model_loaded = joblib.load('xgboost_model.pkl')
    
    # Dummy patient data
    sample_patient = {
        'age': 55,
        'sex': 1,
        'cp': 3,
        'trestbps': 160, # very high BP
        'chol': 286, # high cholesterol
        'fbs': 0,
        'restecg': 2,
        'thalach': 108, # low max heart rate
        'exang': 1, # exercise induced angina
        'oldpeak': 1.5,
        'slope': 1,
        'ca': 3,
        'thal': 1
    }
    
    # Predict step
    predict_and_explain(sample_patient, model_loaded, scaler_loaded, feature_names)
