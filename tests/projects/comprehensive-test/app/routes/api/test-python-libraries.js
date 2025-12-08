export default async function handler(request, response) {
  try {
    // Test Python ML library availability
    const result = await request.python.call('test_ml_libraries', {}, `
import sys
import importlib
import json

def test_ml_libraries(data, js_context=None):
    """Test availability of Python ML libraries"""
    libraries = {
        'numpy': False,
        'pandas': False,
        'sklearn': False,
        'tensorflow': False
    }

    versions = {}

    for lib in libraries.keys():
        try:
            if lib == 'sklearn':
                module = importlib.import_module('sklearn')
                versions[lib] = module.__version__
                libraries[lib] = True
            elif lib == 'tensorflow':
                module = importlib.import_module('tensorflow')
                versions[lib] = module.__version__
                libraries[lib] = True
            else:
                module = importlib.import_module(lib)
                versions[lib] = module.__version__
                libraries[lib] = True
        except ImportError:
            versions[lib] = None

    # Test basic functionality
    test_results = {}
    try:
        import numpy as np
        test_results['numpy'] = str(np.array([1, 2, 3]).mean())
    except:
        test_results['numpy'] = 'Failed'

    try:
        import pandas as pd
        test_results['pandas'] = str(pd.DataFrame({'a': [1, 2, 3]}).mean())
    except:
        test_results['pandas'] = 'Failed'

    return {
        'success': True,
        'libraries': libraries,
        'versions': versions,
        'test_results': test_results,
        'python_version': sys.version
    }
    `);

    return response.json(result);
  } catch (error) {
    console.error('Python libraries test failed:', error);
    return response.json({
      success: false,
      error: error.message,
      libraries: {
        numpy: false,
        pandas: false,
        sklearn: false,
        tensorflow: false
      }
    });
  }
}