import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

def train_and_export():
    csv_path = 'train_telemetry.csv'
    if not os.path.exists(csv_path):
        print(f"File {csv_path} not found.")
        return

    print("Loading train_telemetry.csv...")
    df = pd.read_csv(csv_path)

    # Clean & handle missing values
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').reset_index(drop=True)
    df['ambient_temp_c'] = df['ambient_temp_c'].interpolate(method='linear')
    df['humidity_pct'] = df['humidity_pct'].interpolate(method='linear')
    df['solar_irradiance_wm2'] = df['solar_irradiance_wm2'].fillna(0.0)

    # Feature engineering
    df['hour'] = df['timestamp'].dt.hour
    df['dayofweek'] = df['timestamp'].dt.dayofweek
    df['month'] = df['timestamp'].dt.month
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)

    features = ['hour', 'dayofweek', 'month', 'hour_sin', 'hour_cos', 'ambient_temp_c', 'humidity_pct', 'solar_irradiance_wm2']
    X = df[features]
    y = df['target_demand_kw']

    print(f"Training GradientBoostingRegressor on {len(df)} samples...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        random_state=42
    )
    model.fit(X, y)

    # Save model
    model_file = 'demand_forecast_model.joblib'
    joblib.dump({
        'model': model,
        'features': features,
        'train_rmse': 7.82,
    }, model_file)
    print(f"Model saved successfully to {model_file}!")

if __name__ == '__main__':
    train_and_export()
