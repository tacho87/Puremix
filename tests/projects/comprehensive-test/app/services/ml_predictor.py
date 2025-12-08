"""
ML Prediction Service
Handles making predictions with saved ML models and managing model lifecycle
"""

import numpy as np
import json
from typing import Dict, Any, List, Optional, Union
import model_storage

class MLPredictor:
    def __init__(self):
        self.loaded_models = {}  # Cache for loaded models
        self.model_storage = model_storage

    def train_and_save_regression_model(self, training_data: List[Dict[str, Any]],
                                     hyperparameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Train a regression model and save it for future predictions

        Args:
            training_data: List of training samples with 'features' and 'target'
            hyperparameters: Optional hyperparameters for the model

        Returns:
            Dictionary with training results and model ID
        """
        try:
            import pandas as pd
            from sklearn.linear_model import LinearRegression
            from sklearn.preprocessing import StandardScaler
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

            # Extract features and targets
            features = []
            targets = []

            for item in training_data:
                if 'features' in item and 'target' in item:
                    features.append(item['features'])
                    targets.append(item['target'])

            if len(features) < 5:
                return {
                    'success': False,
                    'error': 'Need at least 5 data points for training'
                }

            # Convert to numpy arrays
            X = np.array(features)
            y = np.array(targets)

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)

            # Train model
            model = LinearRegression()
            model.fit(X_train_scaled, y_train)

            # Make predictions
            train_pred = model.predict(X_train_scaled)
            test_pred = model.predict(X_test_scaled)

            # Calculate metrics
            train_r2 = r2_score(y_train, train_pred)
            test_r2 = r2_score(y_test, test_pred)
            train_mse = mean_squared_error(y_train, train_pred)
            test_mse = mean_squared_error(y_test, test_pred)
            train_mae = mean_absolute_error(y_train, train_pred)
            test_mae = mean_absolute_error(y_test, test_pred)

            # Save model with metadata
            model_metadata = {
                "model_type": "Linear Regression",
                "algorithm": "scikit-learn",
                "features": [f"feature_{i}" for i in range(X.shape[1])],
                "target_variable": "target",
                "performance": {
                    "train_r2": float(train_r2),
                    "test_r2": float(test_r2),
                    "train_mse": float(train_mse),
                    "test_mse": float(test_mse),
                    "train_mae": float(train_mae),
                    "test_mae": float(test_mae),
                    "rmse": float(np.sqrt(test_mse))
                },
                "model_summary": {
                    "coefficients": model.coef_.tolist(),
                    "intercept": float(model.intercept_),
                    "n_features": X.shape[1],
                    "n_samples": len(X)
                },
                "hyperparameters": hyperparameters or {},
                "training_data": training_data[:10],  # Save sample of training data
                "data_shape": X.shape
            }

            # Package model and scaler together
            model_package = {
                "model": model,
                "scaler": scaler,
                "feature_names": model_metadata["features"],
                "target_name": model_metadata["target_variable"],
                "training_stats": {
                    "mean": float(np.mean(y)),
                    "std": float(np.std(y)),
                    "min": float(np.min(y)),
                    "max": float(np.max(y))
                }
            }

            # Save the model
            model_id = self.model_storage.save_model(model_package, model_metadata)

            return {
                'success': True,
                'model_id': model_id,
                'model_type': model_metadata["model_type"],
                'performance': model_metadata["performance"],
                'model_summary': model_metadata["model_summary"],
                'sample_predictions': test_pred[:5].tolist(),
                'actual_values': y_test[:5].tolist(),
                'training_data_used': len(training_data),
                'message': f'Model trained and saved successfully with ID: {model_id[:8]}...'
            }

        except ImportError as e:
            return {
                'success': False,
                'error': f'Required library not available: {str(e)}',
                'suggestion': 'Install scikit-learn and pandas with: pip install scikit-learn pandas'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Training failed: {str(e)}'
            }

    def predict_with_saved_model(self, model_id: str, new_data: List[List[float]]) -> Dict[str, Any]:
        """
        Make predictions using a saved model

        Args:
            model_id: ID of the saved model to use
            new_data: New data points for prediction

        Returns:
            Dictionary with predictions and model information
        """
        try:
            # Load model metadata
            model_metadata = self.model_storage.get_model_metadata(model_id)
            if not model_metadata:
                return {
                    'success': False,
                    'error': f'Model with ID {model_id} not found'
                }

            # Load or get cached model
            if model_id not in self.loaded_models:
                model_package = self.model_storage.load_model(model_id)
                self.loaded_models[model_id] = model_package
            else:
                model_package = self.loaded_models[model_id]

            # Prepare new data
            X_new = np.array(new_data)

            # Validate data dimensions
            if X_new.shape[1] != model_package["model"].coef_.shape[0]:
                return {
                    'success': False,
                    'error': f'Expected {model_package["model"].coef_.shape[0]} features, got {X_new.shape[1]}',
                    'expected_features': model_package["feature_names"]
                }

            # Scale features
            X_new_scaled = model_package["scaler"].transform(X_new)

            # Make predictions
            predictions = model_package["model"].predict(X_new_scaled)

            # Create prediction intervals (simple approach)
            prediction_intervals = []
            for i, pred in enumerate(predictions):
                # Simple confidence interval based on training stats
                std_error = model_package["training_stats"]["std"] * 0.1
                lower = pred - 1.96 * std_error
                upper = pred + 1.96 * std_error
                prediction_intervals.append([float(lower), float(upper)])

            return {
                'success': True,
                'model_id': model_id,
                'model_type': model_metadata["model_type"],
                'predictions': predictions.tolist(),
                'prediction_intervals': prediction_intervals,
                'input_data': new_data,
                'model_metadata': {
                    'created_at': model_metadata["created_at"],
                    'performance': model_metadata["performance"],
                    'features': model_package["feature_names"],
                    'target': model_package["target_name"]
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Prediction failed: {str(e)}'
            }

    def get_saved_models(self) -> Dict[str, Any]:
        """Get list of all saved models with their metadata"""
        try:
            models = self.model_storage.list_models()
            return {
                'success': True,
                'models': models,
                'count': len(models)
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to load models: {str(e)}'
            }

    def delete_saved_model(self, model_id: str) -> Dict[str, Any]:
        """Delete a saved model"""
        try:
            # Remove from cache if loaded
            if model_id in self.loaded_models:
                del self.loaded_models[model_id]

            # Delete from storage
            success = self.model_storage.delete_model(model_id)

            return {
                'success': success,
                'model_id': model_id,
                'message': 'Model deleted successfully' if success else 'Model not found'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to delete model: {str(e)}'
            }

# Global predictor instance
ml_predictor = MLPredictor()