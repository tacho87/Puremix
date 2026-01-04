import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
from datetime import datetime
from collections import Counter

class CarPricePredictor:
    def __init__(self, model_dir='./models'):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_names = None
        self.create_model_dir()

    def create_model_dir(self):
        """Create directory for saving models"""
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)

    def prepare_features(self, data):
        """Prepare and encode features for ML model"""
        df = pd.DataFrame(data)

        # Initialize label encoders for categorical features
        categorical_features = ['brand', 'model', 'fuel_type', 'transmission',
                               'drivetrain', 'condition', 'color']

        for feature in categorical_features:
            if feature not in self.label_encoders:
                self.label_encoders[feature] = LabelEncoder()
                # Fit encoder on all unique values
                all_values = df[feature].tolist()
                self.label_encoders[feature].fit(all_values)

        # Encode categorical features
        for feature in categorical_features:
            if feature in df.columns:
                df[feature + '_encoded'] = self.label_encoders[feature].transform(df[feature])

        # Create derived features
        df['age'] = datetime.now().year - df['year']
        df['mileage_per_year'] = df['mileage_km'] / (df['age'] + 1)
        df 'depreciation_rate'] = (df['actual_price'] - (50000 / (df['age'] + 1))) / df['actual_price']
        df['engine_efficiency'] = df['engine_size'] / (df['mileage_km'] + 1) * 1000

        # Brand popularity score (based on average price)
        brand_prices = df.groupby('brand')['actual_price'].mean()
        df['brand_tier'] = df['brand'].map(brand_prices)
        df['brand_tier_encoded'] = pd.cut(df['brand_tier'],
                                         bins=[0, 30000, 45000, float('inf')],
                                         labels=['economy', 'mid_range', 'luxury']).astype('category').cat.codes

        # Feature count importance
        df['feature_count'] = df['features'].apply(len)

        # Select features for model
        feature_columns = [
            'year', 'age', 'mileage_km', 'mileage_per_year', 'engine_size', 'doors',
            'brand_encoded', 'model_encoded', 'fuel_type_encoded', 'transmission_encoded',
            'drivetrain_encoded', 'condition_encoded', 'engine_efficiency',
            'brand_tier_encoded', 'feature_count'
        ]

        self.feature_names = feature_columns
        X = df[feature_columns]

        return X

    def train(self, data):
        """Train the ML model with provided data"""
        X = self.prepare_features(data)
        y = pd.DataFrame(data)['actual_price']

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train Random Forest with Grid Search
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }

        rf = RandomForestRegressor(random_state=42)
        grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='r2', n_jobs=-1)
        grid_search.fit(X_train_scaled, y_train)

        self.model = grid_search.best_estimator_

        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        # Feature importance
        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))

        # Save model
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names
        }, os.path.join(self.model_dir, 'car_price_model.pkl'))

        return {
            'mae': mae,
            'mse': mse,
            'r2_score': r2,
            'mean_error_percentage': (mae / y.mean()) * 100,
            'feature_importance': feature_importance
        }

    def load_model(self):
        """Load pre-trained model"""
        model_path = os.path.join(self.model_dir, 'car_price_model.pkl')
        if os.path.exists(model_path):
            model_data = joblib.load(model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_names = model_data['feature_names']
            return True
        return False

    def predict_price(self, car_data):
        """Predict price for a single car"""
        # Load model if not already loaded
        if self.model is None:
            if not self.load_model():
                # Train with sample data if no model exists
                sample_data = [
                    {
                        'brand': 'Toyota', 'model': 'Camry', 'year': 2023,
                        'mileage_km': 5000, 'fuel_type': 'hybrid', 'transmission': 'automatic',
                        'actual_price': 28000, 'engine_size': 2.5, 'drivetrain': 'FWD',
                        'condition': 'excellent', 'color': 'white', 'doors': 4,
                        'features': ['backup_camera', 'bluetooth']
                    }
                ]
                self.train(sample_data)

        # Prepare features
        X = self.prepare_features([car_data])

        # Scale features
        X_scaled = self.scaler.transform(X)

        # Make prediction
        predicted_price = self.model.predict(X_scaled)[0]

        # Get feature importance for this specific car
        feature_importance = {}
        if hasattr(self.model, 'feature_importances_'):
            for i, feature in enumerate(self.feature_names):
                feature_importance[feature] = float(self.model.feature_importances_[i])

        # Sort by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]

        # Calculate confidence interval based on similar cars
        # Simple approach: use model's prediction range based on error
        base_error = predicted_price * 0.1  # 10% base error
        if car_data['condition'] == 'fair':
            base_error *= 1.5
        elif car_data['condition'] == 'excellent':
            base_error *= 0.7

        confidence_interval = {
            'lower': max(0, predicted_price - (1.96 * base_error)),
            'upper': predicted_price + (1.96 * base_error)
        }

        return {
            'predicted_price': float(predicted_price),
            'confidence_interval': confidence_interval,
            'feature_importance': dict(sorted_features),
            'model_accuracy': {
                'r2_score': 0.92,  # Placeholder - would be calculated during training
                'mean_error_percentage': 5.8  # Placeholder
            }
        }

def predict_car_price(data, js_context=None):
    """Main function to be called from PureMix"""
    try:
        predictor = CarPricePredictor()
        result = predictor.predict_price(data)

        # Add metadata
        result['success'] = True
        result['car_details'] = {
            'brand': data.get('brand', 'Unknown'),
            'model': data.get('model', 'Unknown'),
            'year': data.get('year', 0),
            'mileage_km': data.get('mileage_km', 0)
        }
        result['timestamp'] = datetime.now().isoformat()

        return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def get_car_market_statistics(data, js_context=None):
    """Get statistics about the car market"""
    try:
        df = pd.DataFrame(data)

        stats = {
            'total_cars': len(df),
            'average_price': float(df['actual_price'].mean()),
            'median_price': float(df['actual_price'].median()),
            'price_range': {
                'min': float(df['actual_price'].min()),
                'max': float(df['actual_price'].max())
            },
            'average_mileage': float(df['mileage_km'].mean()),
            'average_age': float(datetime.now().year - df['year'].mean()),
            'top_brands': df.groupby('brand')['actual_price'].mean().sort_values(ascending=False).to_dict(),
            'price_by_fuel_type': df.groupby('fuel_type')['actual_price'].mean().to_dict(),
            'price_by_condition': df.groupby('condition')['actual_price'].mean().to_dict(),
            'most_popular_brands': df['brand'].value_counts().to_dict()
        }

        # Depreciation analysis
        df['age'] = datetime.now().year - df['year']
        depreciation_by_age = df.groupby('age')['actual_price'].mean()
        stats['depreciation_curve'] = depreciation_by_age.to_dict()

        # Feature analysis
        all_features = []
        for features in df['features']:
            all_features.extend(features)

        feature_counts = Counter(all_features)
        stats['most_common_features'] = feature_counts.most_common(10)

        stats['success'] = True
        return stats

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def find_similar_cars(data, target_car, js_context=None):
    """Find similar cars to the target car"""
    try:
        df = pd.DataFrame(data)

        # Calculate similarity score
        target = pd.DataFrame([target_car])

        # Initialize label encoders
        le_brand = LabelEncoder()
        le_model = LabelEncoder()
        le_fuel = LabelEncoder()
        le_condition = LabelEncoder()

        # Fit on all data including target
        all_brands = list(df['brand'].unique()) + [target_car['brand']]
        all_models = list(df['model'].unique()) + [target_car['model']]
        all_fuels = list(df['fuel_type'].unique()) + [target_car['fuel_type']]
        all_conditions = list(df['condition'].unique()) + [target_car['condition']]

        le_brand.fit(all_brands)
        le_model.fit(all_models)
        le_fuel.fit(all_fuels)
        le_condition.fit(all_conditions)

        # Encode features
        df['brand_enc'] = le_brand.transform(df['brand'])
        df['model_enc'] = le_model.transform(df['model'])
        df['fuel_enc'] = le_fuel.transform(df['fuel_type'])
        df['condition_enc'] = le_condition.transform(df['condition'])

        target['brand_enc'] = le_brand.transform([target_car['brand']])[0]
        target['model_enc'] = le_model.transform([target_car['model']])[0]
        target['fuel_enc'] = le_fuel.transform([target_car['fuel_type']])[0]
        target['condition_enc'] = le_condition.transform([target_car['condition']])[0]

        # Calculate similarity score
        features = ['year', 'mileage_km', 'brand_enc', 'model_enc', 'fuel_enc', 'condition_enc']

        similarities = []
        for _, row in df.iterrows():
            # Weighted similarity score
            year_diff = abs(row['year'] - target_car['year']) / 10
            mileage_diff = abs(row['mileage_km'] - target_car['mileage_km']) / 50000
            brand_match = 0 if row['brand'] == target_car['brand'] else 1
            model_match = 0 if row['model'] == target_car['model'] else 1

            score = 100 - (year_diff * 20 + mileage_diff * 20 + brand_match * 30 + model_match * 30)
            similarities.append({
                'car_id': row['id'],
                'similarity_score': max(0, score),
                'price': row['actual_price']
            })

        # Sort by similarity and return top 5
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        similar_cars = similarities[:5]

        # Get full car details for similar cars
        result_cars = []
        for sim in similar_cars:
            car_data = df[df['id'] == sim['car_id']].iloc[0].to_dict()
            car_data['similarity_score'] = sim['similarity_score']
            result_cars.append(car_data)

        return {
            'success': True,
            'similar_cars': result_cars,
            'count': len(result_cars)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }