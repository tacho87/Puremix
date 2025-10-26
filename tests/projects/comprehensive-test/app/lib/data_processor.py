"""
Data processing utilities for the comprehensive test app
"""

def process_data(data, js_context=None):
    """Process raw data and return formatted results"""
    return {
        'success': True,
        'processed_count': len(data) if isinstance(data, list) else 1,
        'timestamp': '2025-09-15'
    }

def validate_data(data, rules, js_context=None):
    """Validate data against business rules"""
    return {
        'valid': True,
        'errors': [],
        'validated_fields': len(rules) if rules else 0
    }

def transform_data(data, transformations, js_context=None):
    """Apply transformations to data"""
    return {
        'transformed': True,
        'original_count': len(data) if isinstance(data, list) else 1,
        'transformations_applied': len(transformations) if transformations else 0
    }