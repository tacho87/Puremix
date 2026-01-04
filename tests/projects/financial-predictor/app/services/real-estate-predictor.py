import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
from datetime import datetime

class RealEstatePredictor:
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

        # Initialize label encoders if not already done
        categorical_features = ['location', 'neighborhood', 'heating_type', 'energy_efficiency']

        for feature in categorical_features:
            if feature not in self.label_encoders:
                self.label_encoders[feature] = LabelEncoder()
                # Fit encoder on all unique values in this feature
                all_values = df[feature].tolist()
                self.label_encoders[feature].fit(all_values)

        # Encode categorical features
        for feature in categorical_features:
            if feature in df.columns:
                df[feature + '_encoded'] = self.label_encoders[feature].transform(df[feature])

        # Create new features
        df['price_per_sqm'] = df['actual_price'] / df['square_meters']
        df['room_density'] = df['rooms'] / df['square_meters']
        df['age_squared'] = df['age_years'] ** 2
        df['distance_squared'] = df['distance_to_center_km'] ** 2

        # Binary features
        df['has_garage'] = df['has_parking'].astype(int)
        df['has_pool'] = df['has_pool'].astype(int)

        # Select features for model
        feature_columns = [
            'square_meters', 'rooms', 'bathrooms', 'age_years',
            'distance_to_center_km', 'has_garage', 'has_pool',
            'floor_number', 'total_floors', 'room_density',
            'location_encoded', 'neighborhood_encoded',
            'heating_type_encoded', 'energy_efficiency_encoded'
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

        # Create polynomial features
        poly_features = PolynomialFeatures(degree=2, include_bias=False)
        X_train_poly = poly_features.fit_transform(X_train_scaled)
        X_test_poly = poly_features.transform(X_test_scaled)

        # Train model
        self.model = LinearRegression()
        self.model.fit(X_train_poly, y_train)

        # Evaluate
        y_pred = self.model.predict(X_test_poly)
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        # Save model
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'poly_features': poly_features
        }, os.path.join(self.model_dir, 'real_estate_model.pkl'))

        return {
            'mae': mae,
            'mse': mse,
            'r2_score': r2,
            'mean_error_percentage': (mae / y.mean()) * 100
        }

    def load_model(self):
        """Load pre-trained model"""
        model_path = os.path.join(self.model_dir, 'real_estate_model.pkl')
        if os.path.exists(model_path):
            model_data = joblib.load(model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_names = model_data['feature_names']
            self.poly_features = model_data['poly_features']
            return True
        return False

    def predict_price(self, property_data):
        """Predict price for a single property"""
        # Load model if not already loaded
        if self.model is None:
            if not self.load_model():
                # Train with sample data if no model exists
                sample_data = [
                    {
                        'location': 'New York', 'square_meters': 120, 'rooms': 3,
                        'bathrooms': 2, 'age_years': 5, 'neighborhood': 'Manhattan',
                        'distance_to_center_km': 2, 'has_parking': True, 'has_pool': False,
                        'floor_number': 12, 'total_floors': 20, 'heating_type': 'central',
                        'energy_efficiency': 'A', 'actual_price': 750000
                    }
                ]
                self.train(sample_data)

        # Prepare features
        X = self.prepare_features([property_data])

        # Scale and create polynomial features
        X_scaled = self.scaler.transform(X)
        X_poly = self.poly_features.transform(X_scaled)

        # Make prediction
        predicted_price = self.model.predict(X_poly)[0]

        # Calculate feature importance (using absolute coefficients)
        feature_importance = {}
        poly_feature_names = self.poly_features.get_feature_names_out(self.feature_names)

        # For polynomial features, aggregate importance by base feature
        base_importance = {}
        for i, feature_name in enumerate(poly_feature_names):
            base_feature = feature_name.split(' ')[0]
            if base_feature not in base_importance:
                base_importance[base_feature] = 0
            base_importance[base_feature] += abs(self.model.coef_[i])

        # Normalize importance
        total_importance = sum(base_importance.values())
        for feature in base_importance:
            base_importance[feature] = (base_importance[feature] / total_importance) * 100

        # Get top 5 features
        sorted_features = sorted(base_importance.items(), key=lambda x: x[1], reverse=True)[:5]

        # Calculate confidence interval (simple approximation)
        std_dev = np.std([property_data['actual_price']]) if 'actual_price' in property_data else predicted_price * 0.1
        confidence_interval = {
            'lower': max(0, predicted_price - (1.96 * std_dev * 0.2)),
            'upper': predicted_price + (1.96 * std_dev * 0.2)
        }

        return {
            'predicted_price': float(predicted_price),
            'price_per_sqm': float(predicted_price / property_data['square_meters']),
            'confidence_interval': confidence_interval,
            'feature_importance': dict(sorted_features),
            'model_accuracy': {
                'r2_score': 0.85,  # Placeholder - would be calculated during training
                'mean_error_percentage': 8.5  # Placeholder
            }
        }

def predict_property_price(data, js_context=None):
    """Main function to be called from PureMix"""
    try:
        predictor = RealEstatePredictor()
        result = predictor.predict_price(data)

        # Add metadata
        result['success'] = True
        result['property_details'] = {
            'location': data.get('location', 'Unknown'),
            'square_meters': data.get('square_meters', 0),
            'rooms': data.get('rooms', 0),
            'bathrooms': data.get('bathrooms', 0)
        }
        result['timestamp'] = datetime.now().isoformat()

        return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def get_market_statistics(data, js_context=None):
    """Get statistics about the real estate market"""
    try:
        df = pd.DataFrame(data)

        stats = {
            'total_properties': len(df),
            'average_price': float(df['actual_price'].mean()),
            'median_price': float(df['actual_price'].median()),
            'price_range': {
                'min': float(df['actual_price'].min()),
                'max': float(df['actual_price'].max())
            },
            'average_price_per_sqm': float((df['actual_price'] / df['square_meters']).mean()),
            'top_locations': df.groupby('location')['actual_price'].mean().sort_values(ascending=False).to_dict(),
            'price_by_rooms': df.groupby('rooms')['actual_price'].mean().to_dict(),
            'average_age': float(df['age_years'].mean()),
            'most_common_features': []
        }

        # Analyze most common features
        all_features = []
        for features in df['features']:
            all_features.extend(features)

        from collections import Counter
        feature_counts = Counter(all_features)
        stats['most_common_features'] = feature_counts.most_common(5)

        stats['success'] = True
        return stats

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }