export default async function handler(request, response) {
  try {
    const { model_id, prediction_data } = request.body;

    // Validate input
    if (!model_id || typeof model_id !== 'string') {
      return response.json({
        success: false,
        error: 'Model ID is required'
      });
    }

    if (!prediction_data || !Array.isArray(prediction_data)) {
      return response.json({
        success: false,
        error: 'Prediction data is required and must be an array'
      });
    }

    // Make prediction using saved model
    const result = await request.python.call('predict_with_saved_model', {
      model_id: model_id,
      new_data: prediction_data
    }, `
from services.ml_predictor import ml_predictor

def predict_with_saved_model(data, js_context=None):
    """Make predictions using a saved model"""
    try:
        return ml_predictor.predict_with_saved_model(
            data['model_id'],
            data['new_data']
        )
    except Exception as e:
        return {
            'success': False,
            'error': f'Prediction failed: {str(e)}'
        }
    `);

    return response.json(result);
  } catch (error) {
    console.error('Make prediction failed:', error);
    return response.json({
      success: false,
      error: error.message
    });
  }
}