/**
 * ML Model Manager Service
 * JavaScript interface for the Python ML model management system
 * Provides persistent model storage, training, and prediction capabilities
 */

export class MLModelManager {
  constructor() {
    this.models = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the model manager and test Python environment
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const pythonTest = await this.testPythonLibraries();
      this.pythonAvailable = pythonTest.success;
      this.initialized = true;
    } catch (error) {
      console.warn('ML Model Manager initialization failed:', error);
      this.pythonAvailable = false;
    }
  }

  /**
   * Test Python ML library availability
   */
  async testPythonLibraries() {
    try {
      const response = await fetch('/api/test-python-libraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to test Python libraries:', error);
      return {
        success: false,
        error: error.message,
        libraries: {
          numpy: false,
          pandas: false,
          sklearn: false,
          tensorflow: false
        }
      };
    }
  }

  /**
   * Get all saved models
   */
  async getSavedModels() {
    try {
      const response = await fetch('/api/get-saved-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get saved models:', error);
      return {
        success: false,
        error: error.message,
        models: [],
        count: 0
      };
    }
  }

  /**
   * Train and save a new ML model
   */
  async trainAndSaveModel(trainingData, options = {}) {
    await this.initialize();

    if (!this.pythonAvailable) {
      return {
        success: false,
        error: 'Python ML libraries are not available',
        message: 'Please install Python and required ML libraries'
      };
    }

    try {
      const requestData = {
        training_data: trainingData,
        model_name: options.model_name || 'Unnamed Model',
        model_type: options.model_type || 'Linear Regression',
        description: options.description || '',
        algorithm: options.algorithm || 'linear_regression',
        test_size: options.test_size || 0.3,
        hyperparameters: options.hyperparameters || {}
      };

      const response = await fetch('/api/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Model trained and saved successfully:', result.model_id);
        return result;
      } else {
        console.error('❌ Model training failed:', result.error);
        return result;
      }
    } catch (error) {
      console.error('Failed to train model:', error);
      return {
        success: false,
        error: error.message,
        message: 'Training failed due to network or server error'
      };
    }
  }

  /**
   * Make predictions using a saved model
   */
  async makePrediction(modelId, predictionData) {
    await this.initialize();

    if (!this.pythonAvailable) {
      return {
        success: false,
        error: 'Python ML libraries are not available',
        message: 'Please install Python and required ML libraries'
      };
    }

    try {
      const requestData = {
        model_id: modelId,
        prediction_data: predictionData
      };

      const response = await fetch('/api/make-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Prediction completed successfully');
        return result;
      } else {
        console.error('❌ Prediction failed:', result.error);
        return result;
      }
    } catch (error) {
      console.error('Failed to make prediction:', error);
      return {
        success: false,
        error: error.message,
        message: 'Prediction failed due to network or server error'
      };
    }
  }

  /**
   * Delete a saved model
   */
  async deleteModel(modelId) {
    try {
      const requestData = { model_id: modelId };

      const response = await fetch('/api/delete-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Model deleted successfully:', modelId);
      } else {
        console.error('❌ Model deletion failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Failed to delete model:', error);
      return {
        success: false,
        error: error.message,
        message: 'Model deletion failed due to network or server error'
      };
    }
  }

  /**
   * Get model details and metadata
   */
  async getModelDetails(modelId) {
    try {
      const response = await fetch('/api/get-model-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model_id: modelId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get model details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export model data (for backup or transfer)
   */
  async exportModel(modelId) {
    try {
      const response = await fetch('/api/export-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model_id: modelId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Create downloadable file
        const dataStr = JSON.stringify(result.model_data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `model_${modelId.substring(0, 8)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        console.log('✅ Model exported successfully');
      }

      return result;
    } catch (error) {
      console.error('Failed to export model:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate training data format
   */
  validateTrainingData(data) {
    const errors = [];

    if (!Array.isArray(data)) {
      errors.push('Training data must be an array');
      return { valid: false, errors };
    }

    if (data.length < 5) {
      errors.push('Need at least 5 data points for training');
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (!item.features || !Array.isArray(item.features)) {
        errors.push(`Item ${i + 1}: Missing or invalid 'features' array`);
        continue;
      }

      if (typeof item.target !== 'number') {
        errors.push(`Item ${i + 1}: Missing or invalid 'target' number`);
      }

      if (item.features.length === 0) {
        errors.push(`Item ${i + 1}: Features array cannot be empty`);
      }
    }

    // Check for consistent feature lengths
    if (data.length > 0 && data[0].features) {
      const expectedLength = data[0].features.length;
      for (let i = 0; i < data.length; i++) {
        if (data[i].features && data[i].features.length !== expectedLength) {
          errors.push(`Item ${i + 1}: Features length mismatch. Expected ${expectedLength}, got ${data[i].features.length}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate prediction data format
   */
  validatePredictionData(data) {
    const errors = [];

    if (!Array.isArray(data)) {
      errors.push('Prediction data must be an array');
      return { valid: false, errors };
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (!Array.isArray(item)) {
        errors.push(`Prediction ${i + 1}: Must be an array of features`);
      } else if (item.length === 0) {
        errors.push(`Prediction ${i + 1}: Feature array cannot be empty`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format training data for display
   */
  formatTrainingDataForDisplay(data) {
    if (!Array.isArray(data)) return 'Invalid data';

    const maxDisplay = 3;
    const display = data.slice(0, maxDisplay);
    const remaining = data.length - maxDisplay;

    let formatted = display.map(item =>
      `  {"features": [${item.features.map(f => f.toFixed(2)).join(', ')}], "target": ${item.target}}`
    ).join(',\n');

    if (remaining > 0) {
      formatted += ',\n  // ... ' + remaining + ' more items';
    }

    return '[\n' + formatted + '\n]';
  }

  /**
   * Get statistics about saved models
   */
  getModelStatistics(models) {
    if (!models || !Array.isArray(models)) {
      return {
        total: 0,
        byType: {},
        averagePerformance: null,
        oldestModel: null,
        newestModel: null
      };
    }

    const stats = {
      total: models.length,
      byType: {},
      averagePerformance: null,
      oldestModel: null,
      newestModel: null
    };

    let totalR2 = 0;
    let r2Count = 0;
    let oldestDate = null;
    let newestDate = null;

    models.forEach(model => {
      // Count by type
      const type = model.model_type || 'Unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Performance metrics
      if (model.performance && model.performance.test_r2) {
        totalR2 += model.performance.test_r2;
        r2Count++;
      }

      // Date ranges
      const createdDate = new Date(model.created_at);
      if (!oldestDate || createdDate < oldestDate) {
        oldestDate = createdDate;
        stats.oldestModel = model;
      }
      if (!newestDate || createdDate > newestDate) {
        newestDate = createdDate;
        stats.newestModel = model;
      }
    });

    if (r2Count > 0) {
      stats.averagePerformance = totalR2 / r2Count;
    }

    return stats;
  }
}

// Create and export a singleton instance
export const mlModelManager = new MLModelManager();

// Export default for compatibility
export default mlModelManager;