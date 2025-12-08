export default async function handler(request, response) {
  try {
    const { model_id } = request.body;

    // Validate input
    if (!model_id || typeof model_id !== 'string') {
      return response.json({
        success: false,
        error: 'Model ID is required'
      });
    }

    // Delete the model
    const result = await request.python.call('delete_saved_model', {
      model_id: model_id
    }, `
from services.ml_predictor import ml_predictor

def delete_saved_model(data, js_context=None):
    """Delete a saved model"""
    try:
        return ml_predictor.delete_saved_model(data['model_id'])
    except Exception as e:
        return {
            'success': False,
            'error': f'Model deletion failed: {str(e)}'
        }
    `);

    return response.json(result);
  } catch (error) {
    console.error('Delete model failed:', error);
    return response.json({
      success: false,
      error: error.message
    });
  }
}