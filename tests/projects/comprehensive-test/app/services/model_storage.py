"""
ML Model Storage Service
Handles saving, loading, and managing trained ML models with their metadata
"""

import os
import json
import pickle
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import hashlib

class ModelStorage:
    def __init__(self, storage_dir: str = "./models"):
        self.storage_dir = storage_dir
        self.models_file = os.path.join(storage_dir, "models.json")
        self.ensure_storage_dir()

    def ensure_storage_dir(self):
        """Create storage directory if it doesn't exist"""
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)

        # Initialize models registry if it doesn't exist
        if not os.path.exists(self.models_file):
            with open(self.models_file, 'w') as f:
                json.dump([], f)

    def save_model(self, model: Any, metadata: Dict[str, Any]) -> str:
        """
        Save a trained model with its metadata

        Args:
            model: The trained model object
            metadata: Dictionary containing model information

        Returns:
            model_id: Unique identifier for the saved model
        """
        model_id = str(uuid.uuid4())

        # Create model metadata
        model_metadata = {
            "model_id": model_id,
            "created_at": datetime.now().isoformat(),
            "model_type": metadata.get("model_type", "Unknown"),
            "algorithm": metadata.get("algorithm", "Unknown"),
            "data_shape": metadata.get("data_shape"),
            "features": metadata.get("features", []),
            "target_variable": metadata.get("target_variable"),
            "performance": metadata.get("performance", {}),
            "training_history": metadata.get("training_history", {}),
            "model_summary": metadata.get("model_summary", {}),
            "hyperparameters": metadata.get("hyperparameters", {}),
            "training_data_hash": self._hash_data(metadata.get("training_data", [])),
            "file_path": os.path.join(self.storage_dir, f"{model_id}.pkl")
        }

        # Save the model using pickle
        try:
            with open(model_metadata["file_path"], 'wb') as f:
                pickle.dump(model, f)

            # Update model registry
            models = self.load_model_registry()
            models.append(model_metadata)

            with open(self.models_file, 'w') as f:
                json.dump(models, f, indent=2)

            return model_id

        except Exception as e:
            raise Exception(f"Failed to save model: {str(e)}")

    def load_model(self, model_id: str) -> Any:
        """
        Load a saved model by ID

        Args:
            model_id: Unique identifier of the model to load

        Returns:
            The loaded model object
        """
        models = self.load_model_registry()
        model_metadata = next((m for m in models if m["model_id"] == model_id), None)

        if not model_metadata:
            raise Exception(f"Model with ID {model_id} not found")

        try:
            with open(model_metadata["file_path"], 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            raise Exception(f"Failed to load model {model_id}: {str(e)}")

    def load_model_registry(self) -> List[Dict[str, Any]]:
        """Load the model registry containing metadata for all saved models"""
        try:
            with open(self.models_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def get_model_metadata(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific model"""
        models = self.load_model_registry()
        return next((m for m in models if m["model_id"] == model_id), None)

    def list_models(self, model_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all saved models, optionally filtered by type

        Args:
            model_type: Optional filter for specific model type

        Returns:
            List of model metadata dictionaries
        """
        models = self.load_model_registry()

        if model_type:
            models = [m for m in models if m["model_type"].lower() == model_type.lower()]

        # Sort by creation date (newest first)
        models.sort(key=lambda x: x["created_at"], reverse=True)
        return models

    def delete_model(self, model_id: str) -> bool:
        """
        Delete a saved model

        Args:
            model_id: ID of the model to delete

        Returns:
            True if successful, False otherwise
        """
        models = self.load_model_registry()
        model_metadata = next((m for m in models if m["model_id"] == model_id), None)

        if not model_metadata:
            return False

        try:
            # Delete model file
            if os.path.exists(model_metadata["file_path"]):
                os.remove(model_metadata["file_path"])

            # Remove from registry
            models = [m for m in models if m["model_id"] != model_id]

            with open(self.models_file, 'w') as f:
                json.dump(models, f, indent=2)

            return True

        except Exception:
            return False

    def _hash_data(self, data: Any) -> str:
        """Create a hash of training data for change detection"""
        if not data:
            return ""

        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()

# Global model storage instance
model_storage = ModelStorage()