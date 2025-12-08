/**
 * Test Prediction API Endpoint
 * Provides quick testing of trained ML models with intelligent sample data
 */

export default async function handler(request, response) {
  try {
    const { model_id } = request.body;

    if (!model_id) {
      return response.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }

    // Import the ML model manager
    const { MLModelManager } = await import('../services/ml_model_manager.js');
    const mlManager = new MLModelManager();

    // Get model details to understand expected features
    const modelDetails = await mlManager.getModelDetails(model_id);

    if (!modelDetails.success || !modelDetails.model) {
      return response.status(404).json({
        success: false,
        error: 'Model not found or invalid'
      });
    }

    // Generate sample data based on model characteristics
    const sampleData = await generateIntelligentSampleData(modelDetails.model);

    if (!sampleData.success) {
      return response.status(500).json({
        success: false,
        error: 'Failed to generate sample data: ' + sampleData.error
      });
    }

    // Use the existing make-prediction endpoint with our sample data
    const predictionResult = await mlManager.makePrediction(model_id, sampleData.data);

    if (!predictionResult.success) {
      return response.status(500).json({
        success: false,
        error: 'Prediction failed: ' + predictionResult.error
      });
    }

    // Return comprehensive test results
    return response.json({
      success: true,
      model_id: model_id,
      model_info: {
        name: modelDetails.model.name,
        type: modelDetails.model.type,
        created: modelDetails.model.created,
        performance: modelDetails.model.performance
      },
      test_data: sampleData.data,
      sample_data_description: sampleData.description,
      predictions: predictionResult.predictions,
      test_summary: {
        num_samples: Array.isArray(sampleData.data[0]) ? sampleData.data.length : 1,
        feature_count: modelDetails.model.feature_count,
        prediction_type: modelDetails.model.type
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test prediction error:', error);

    // Handle Python unavailability gracefully
    if (error.message.includes('Python') || error.message.includes('not available')) {
      return response.status(503).json({
        success: false,
        error: 'Python services unavailable',
        suggestion: 'Please ensure Python and required ML libraries are installed'
      });
    }

    return response.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}

/**
 * Generate intelligent sample data based on model characteristics
 */
async function generateIntelligentSampleData(model) {
  try {
    // Use Python to generate realistic sample data based on model metadata
    const { request } = await import('../../../lib/puremix-engine.ts');

    const pythonCode = `
def generate_sample_data(model_metadata, js_context=None):
    \"\"\"Generate realistic sample data for ML model testing\"\"\"
    import json
    import random

    # Extract model information
    feature_count = model_metadata.get('feature_count', 4)
    model_type = model_metadata.get('type', 'regression')
    training_stats = model_metadata.get('training_stats', {})

    # Generate sample data based on training statistics if available
    feature_ranges = training_stats.get('feature_ranges', [
        {'min': 1.0, 'max': 10.0} for _ in range(feature_count)
    ])

    # Create 3 diverse test samples
    test_samples = []
    sample_types = ['low', 'medium', 'high']

    for sample_type in sample_types:
        if model_type == 'classification':
            # For classification, generate varied feature combinations
            sample = []
            for i in range(feature_count):
                range_info = feature_ranges[i] if i < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
                if sample_type == 'low':
                    value = random.uniform(range_info['min'], range_info['min'] + (range_info['max'] - range_info['min']) * 0.3)
                elif sample_type == 'medium':
                    value = random.uniform(range_info['min'] + (range_info['max'] - range_info['min']) * 0.3,
                                         range_info['min'] + (range_info['max'] - range_info['min']) * 0.7)
                else:  # high
                    value = random.uniform(range_info['min'] + (range_info['max'] - range_info['min']) * 0.7, range_info['max'])
                sample.append(round(value, 3))
        else:
            # For regression, generate realistic feature combinations
            sample = []
            for i in range(feature_count):
                range_info = feature_ranges[i] if i < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
                # Use normal distribution for regression data
                mean = (range_info['min'] + range_info['max']) / 2
                std_dev = (range_info['max'] - range_info['min']) / 6
                value = random.gauss(mean, std_dev)
                # Clamp to range
                value = max(range_info['min'], min(range_info['max'], value))
                sample.append(round(value, 3))

        test_samples.append(sample)

    return {
        'success': True,
        'data': test_samples,
        'description': f'Generated {len(test_samples)} {model_type} test samples with {feature_count} features each. ' +
                      f'Samples represent low, medium, and high value scenarios for comprehensive testing.',
        'sample_types': sample_types,
        'feature_ranges': feature_ranges[:feature_count]  # Show first few ranges for reference
    }
`;

    const result = await request.python.call('generate_sample_data', model, pythonCode);

    return {
      success: true,
      data: result.data.test_samples || result.data.data || [],
      description: result.data.description || 'Generated sample data for testing'
    };

  } catch (error) {
    console.error('Sample data generation error:', error);

    // Fallback: generate simple sample data without Python
    const feature_count = model.feature_count || 4;
    const fallbackData = [
      Array.from({ length: feature_count }, (_, i) => (i + 1) * 1.5),      // Low values
      Array.from({ length: feature_count }, (_, i) => (i + 1) * 3.0),      // Medium values
      Array.from({ length: feature_count }, (_, i) => (i + 1) * 4.5)       // High values
    ];

    return {
      success: true,
      data: fallbackData,
      description: `Fallback sample data: ${fallbackData.length} samples with ${feature_count} features each (low, medium, high scenarios)`
    };
  }
}