export default async function handler(request, response) {
  try {
    // Get all saved models from the ML predictor
    const result = await request.python.call('get_saved_models', {}, `
from services.ml_predictor import ml_predictor

def get_saved_models(data, js_context=None):
    """Get all saved models with their metadata"""
    try:
        return ml_predictor.get_saved_models()
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to get saved models: {str(e)}',
            'models': [],
            'count': 0
        }
    `);

    return response.json(result);
  } catch (error) {
    console.error('Get saved models failed:', error);
    return response.json({
      success: false,
      error: error.message,
      models: [],
      count: 0
    });
  }
}