import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import json
import os

print("Fetching Expanded UCI Heart Disease Dataset...")

urls = [
    "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data",
    "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.hungarian.data",
    "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.switzerland.data",
    "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.va.data"
]

columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", 
    "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target"
]

dfs = []
for url in urls:
    try:
        df = pd.read_csv(url, names=columns, na_values="?")
        dfs.append(df)
        print(f"Loaded {len(df)} rows from {url.split('/')[-1]}")
    except Exception as e:
        print(f"Failed to load {url}: {e}")

data = pd.concat(dfs, ignore_index=True)
print(f"Total Combined Rows: {len(data)}")

# The target variable in the expanded dataset is 0 (no disease) and 1,2,3,4 (disease)
# We convert this to a binary classification problem: 0 vs 1
data['target'] = data['target'].apply(lambda x: 1 if x > 0 else 0)

# Impute missing values with median for numeric stability
imputer = SimpleImputer(strategy='median')
X = data.drop('target', axis=1)
y = data['target']

X_imputed = imputer.fit_transform(X)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_imputed)

# Train Logistic Regression Model
print("Training Logistic Regression Model on Expanded Data...")
model = LogisticRegression(random_state=42, max_iter=1000)
model.fit(X_scaled, y)

accuracy = model.score(X_scaled, y)
print(f"Training Accuracy on Expanded Data: {accuracy:.4f}")

# Extract weights and scaler stats
weights = model.coef_[0].tolist()
intercept = float(model.intercept_[0])
means = scaler.mean_.tolist()
scales = scaler.scale_.tolist()

model_data = {
    "feature_names": columns[:-1],
    "weights": weights,
    "intercept": intercept,
    "scaler_mean": means,
    "scaler_scale": scales,
    "training_accuracy": accuracy,
    "total_samples": len(data)
}

# Save to model_weights.json
output_path = os.path.join(os.path.dirname(__file__), 'model_weights.json')
with open(output_path, 'w') as f:
    json.dump(model_data, f, indent=4)

print(f"Successfully saved updated model weights to {output_path}")
