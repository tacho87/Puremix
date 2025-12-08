export default async function handler(request, response) {
  try {
    const { training_data, model_name, model_type, description, algorithm, test_size, hyperparameters } = request.body;

    // Validate input
    if (!training_data || !Array.isArray(training_data)) {
      return response.json({
        success: false,
        error: 'Invalid training data: must be an array'
      });
    }

    if (!model_name || typeof model_name !== 'string') {
      return response.json({
        success: false,
        error: 'Model name is required'
      });
    }

    // Train and save the model
    const result = await request.python.call('train_and_save_model', {
      training_data: training_data,
      model_name: model_name,
      model_type: model_type || 'Linear Regression',
      description: description || '',
      algorithm: algorithm || 'linear_regression',
      test_size: test_size || 0.3,
      hyperparameters: hyperparameters || {}
    }, `
from services.ml_predictor import ml_predictor

def train_and_save_model(data, js_context=None):
    """Train and save a regression model with persistence"""
    try:
        return ml_predictor.train_and_save_regression_model(
            data['training_data'],
            {
                'model_name': data['model_name'],
                'model_type': data['model_type'],
                'description': data['description'],
                'algorithm': data['algorithm'],
                'test_size': data['test_size'],
                'hyperparameters': data['hyperparameters'],
                'features': [f"feature_{i}" for i in range(len(data['training_data'][0]['features']))],
                'target_variable': 'target'
            }
        )
    except Exception as e:
        return {
            'success': False,
            'error': f'Model training failed: {str(e)}'
        }
    `);

    return response.json(result);
  } catch (error) {
    console.error('Train model failed:', error);
    return response.json({
      success: false,
      error: error.message
    });
  }
}