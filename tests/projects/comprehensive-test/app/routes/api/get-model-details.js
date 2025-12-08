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

    // Get model details from storage
    const result = await request.python.call('get_model_details', {
      model_id: model_id
    }, `
from services.model_storage import model_storage

def get_model_details(data, js_context=None):
    """Get detailed information about a saved model"""
    try:
        model_metadata = model_storage.get_model_metadata(data['model_id'])

        if not model_metadata:
            return {
                'success': False,
                'error': f'Model with ID {data["model_id"]} not found'
            }

        # Get additional statistics if available
        model_list = model_storage.list_models()
        model_count = len(model_list)

        return {
            'success': True,
            'model_metadata': model_metadata,
            'total_models': model_count
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to get model details: {str(e)}'
        }
    `);

    return response.json(result);
  } catch (error) {
    console.error('Get model details failed:', error);
    return response.json({
      success: false,
      error: error.message
    });
  }
}