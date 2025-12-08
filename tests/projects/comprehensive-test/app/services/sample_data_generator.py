"""
Sample Data Generator for ML Model Testing
Provides intelligent sample data generation based on model characteristics and training statistics
"""

import json
import random
import math
from typing import Dict, List, Any, Optional

def generate_sample_data(model_metadata: Dict[str, Any], num_samples: int = 3) -> Dict[str, Any]:
    """
    Generate realistic sample data for ML model testing

    Args:
        model_metadata: Dictionary containing model information
        num_samples: Number of test samples to generate

    Returns:
        Dictionary with generated sample data and metadata
    """
    try:
        feature_count = model_metadata.get('feature_count', 4)
        model_type = model_metadata.get('type', 'regression')
        training_stats = model_metadata.get('training_stats', {})
        performance_metrics = model_metadata.get('performance', {})

        # Generate sample data based on model type and training statistics
        if model_type == 'classification':
            samples = _generate_classification_samples(feature_count, num_samples, training_stats)
        else:
            samples = _generate_regression_samples(feature_count, num_samples, training_stats)

        return {
            'success': True,
            'data': samples,
            'description': _generate_description(feature_count, model_type, num_samples, training_stats),
            'sample_metadata': {
                'feature_count': feature_count,
                'model_type': model_type,
                'sample_count': num_samples,
                'generation_method': 'intelligent' if training_stats else 'fallback'
            },
            'feature_ranges': _get_feature_ranges(training_stats, feature_count)
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Sample data generation failed: {str(e)}'
        }

def _generate_classification_samples(feature_count: int, num_samples: int, training_stats: Dict) -> List[List[float]]:
    """Generate samples for classification models with clear class separation"""

    # Get feature ranges from training stats or use defaults
    feature_ranges = training_stats.get('feature_ranges', [
        {'min': 0.0, 'max': 10.0} for _ in range(feature_count)
    ])

    samples = []
    sample_strategies = ['low', 'medium', 'high', 'mixed']

    for i in range(min(num_samples, len(sample_strategies))):
        strategy = sample_strategies[i % len(sample_strategies)]
        sample = []

        for j in range(feature_count):
            range_info = feature_ranges[j] if j < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
            feature_range = range_info['max'] - range_info['min']

            if strategy == 'low':
                # Values in lower 30% of range
                value = random.uniform(range_info['min'], range_info['min'] + feature_range * 0.3)
            elif strategy == 'medium':
                # Values in middle 40% of range
                value = random.uniform(range_info['min'] + feature_range * 0.3,
                                     range_info['min'] + feature_range * 0.7)
            elif strategy == 'high':
                # Values in upper 30% of range
                value = random.uniform(range_info['min'] + feature_range * 0.7, range_info['max'])
            else:  # mixed
                # Random across entire range
                value = random.uniform(range_info['min'], range_info['max'])

            sample.append(round(value, 3))

        samples.append(sample)

    # Fill remaining samples with mixed strategy
    while len(samples) < num_samples:
        sample = []
        for j in range(feature_count):
            range_info = feature_ranges[j] if j < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
            value = random.uniform(range_info['min'], range_info['max'])
            sample.append(round(value, 3))
        samples.append(sample)

    return samples

def _generate_regression_samples(feature_count: int, num_samples: int, training_stats: Dict) -> List[List[float]]:
    """Generate samples for regression models with realistic value distribution"""

    # Get feature ranges and statistics from training data
    feature_ranges = training_stats.get('feature_ranges', [
        {'min': 0.0, 'max': 10.0} for _ in range(feature_count)
    ])

    feature_means = training_stats.get('feature_means', None)
    feature_stds = training_stats.get('feature_stds', None)

    samples = []

    # Generate diverse test scenarios
    test_scenarios = [
        ('conservative', 0.8),    # Use 80% of data range
        ('typical', 1.0),        # Use full data range
        ('extreme', 1.2),        # Slightly beyond training range (for robustness testing)
    ]

    for i in range(min(num_samples, len(test_scenarios))):
        scenario_name, range_multiplier = test_scenarios[i % len(test_scenarios)]
        sample = []

        for j in range(feature_count):
            range_info = feature_ranges[j] if j < len(feature_ranges) else {'min': 0.0, 'max': 1.0}

            if feature_means and feature_stds and j < len(feature_means):
                # Use training statistics for realistic distribution
                mean = feature_means[j]
                std_dev = feature_stds[j] * range_multiplier

                # Generate value with normal distribution
                value = random.gauss(mean, std_dev)

                # Clamp to reasonable range
                max_range = (range_info['max'] - range_info['min']) * range_multiplier
                center = (range_info['max'] + range_info['min']) / 2
                value = max(center - max_range/2, min(center + max_range/2, value))
            else:
                # Fallback to uniform distribution with scenario multiplier
                feature_range = (range_info['max'] - range_info['min']) * range_multiplier
                center = (range_info['max'] + range_info['min']) / 2
                value = random.uniform(center - feature_range/2, center + feature_range/2)

                # Still clamp to original range for extreme scenarios
                value = max(range_info['min'], min(range_info['max'], value))

            sample.append(round(value, 3))

        samples.append(sample)

    # Fill remaining samples with typical range
    while len(samples) < num_samples:
        sample = []
        for j in range(feature_count):
            range_info = feature_ranges[j] if j < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
            value = random.uniform(range_info['min'], range_info['max'])
            sample.append(round(value, 3))
        samples.append(sample)

    return samples

def _generate_description(feature_count: int, model_type: str, num_samples: int, training_stats: Dict) -> str:
    """Generate human-readable description of the sample data"""

    has_training_stats = bool(training_stats)

    if has_training_stats:
        base_desc = f"Generated {num_samples} intelligent {model_type} test samples with {feature_count} features each based on training data statistics. "

        if model_type == 'classification':
            base_desc += "Samples represent different class regions (low, medium, high feature values) to test classification boundaries."
        else:
            base_desc += "Samples include conservative, typical, and slightly extreme scenarios to test regression robustness."

        if feature_count > 4:
            base_desc += f" Feature ranges derived from {feature_count}-dimensional training data."
    else:
        base_desc = f"Generated {num_samples} fallback {model_type} test samples with {feature_count} features each. "
        base_desc += "Samples use default value ranges since training statistics are not available."

    return base_desc

def _get_feature_ranges(training_stats: Dict, feature_count: int) -> List[Dict[str, float]]:
    """Extract feature ranges for reference"""

    if 'feature_ranges' in training_stats:
        return training_stats['feature_ranges'][:feature_count]

    # Default ranges if not available
    return [
        {'min': 0.0, 'max': 1.0} for _ in range(feature_count)
    ]

def generate_sample_data_for_specific_scenario(model_metadata: Dict[str, Any], scenario: str) -> Dict[str, Any]:
    """
    Generate sample data for a specific test scenario

    Args:
        model_metadata: Model information
        scenario: Test scenario ('edge_cases', 'boundary_values', 'performance_stress')

    Returns:
        Dictionary with scenario-specific sample data
    """

    try:
        feature_count = model_metadata.get('feature_count', 4)
        model_type = model_metadata.get('type', 'regression')
        training_stats = model_metadata.get('training_stats', {})

        if scenario == 'edge_cases':
            samples = _generate_edge_case_samples(feature_count, training_stats)
        elif scenario == 'boundary_values':
            samples = _generate_boundary_samples(feature_count, training_stats)
        elif scenario == 'performance_stress':
            samples = _generate_performance_test_samples(feature_count, 100, training_stats)  # 100 samples for stress testing
        else:
            return {
                'success': False,
                'error': f'Unknown scenario: {scenario}'
            }

        return {
            'success': True,
            'data': samples,
            'scenario': scenario,
            'description': f"Generated {len(samples)} samples for '{scenario}' testing scenario",
            'sample_count': len(samples)
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Scenario generation failed: {str(e)}'
        }

def _generate_edge_case_samples(feature_count: int, training_stats: Dict) -> List[List[float]]:
    """Generate edge case samples (minimums, maximums, zero values)"""

    feature_ranges = training_stats.get('feature_ranges', [
        {'min': 0.0, 'max': 10.0} for _ in range(feature_count)
    ])

    samples = []

    # Minimum values
    samples.append([range_info['min'] for range_info in feature_ranges[:feature_count]])

    # Maximum values
    samples.append([range_info['max'] for range_info in feature_ranges[:feature_count]])

    # Zero values (if within range)
    samples.append([0.0 if range_info['min'] <= 0 <= range_info['max'] else range_info['min']
                   for range_info in feature_ranges[:feature_count]])

    # Very small positive values
    samples.append([max(range_info['min'], min(range_info['max'], 0.001))
                   for range_info in feature_ranges[:feature_count]])

    return samples

def _generate_boundary_samples(feature_count: int, training_stats: Dict) -> List[List[float]]:
    """Generate samples at various boundary conditions"""

    feature_ranges = training_stats.get('feature_ranges', [
        {'min': 0.0, 'max': 10.0} for _ in range(feature_count)
    ])

    samples = []

    # Different boundary combinations
    boundary_combinations = [
        [0.0, 0.0, 1.0, 1.0],  # Mixed min/max
        [0.25, 0.25, 0.75, 0.75],  # Quartile boundaries
        [0.1, 0.5, 0.5, 0.9],  # Asymmetric boundaries
    ]

    for combo in boundary_combinations[:feature_count]:
        sample = []
        for i in range(feature_count):
            range_info = feature_ranges[i] if i < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
            factor = combo[i % len(combo)]
            value = range_info['min'] + (range_info['max'] - range_info['min']) * factor
            sample.append(round(value, 3))
        samples.append(sample)

    return samples

def _generate_performance_test_samples(feature_count: int, num_samples: int, training_stats: Dict) -> List[List[float]]:
    """Generate many samples for performance stress testing"""

    feature_ranges = training_stats.get('feature_ranges', [
        {'min': 0.0, 'max': 10.0} for _ in range(feature_count)
    ])

    samples = []

    for _ in range(num_samples):
        sample = []
        for i in range(feature_count):
            range_info = feature_ranges[i] if i < len(feature_ranges) else {'min': 0.0, 'max': 1.0}
            value = random.uniform(range_info['min'], range_info['max'])
            sample.append(round(value, 3))
        samples.append(sample)

    return samples

# Main function for direct Python execution
if __name__ == "__main__":
    # Example usage
    example_model = {
        'feature_count': 4,
        'type': 'regression',
        'training_stats': {
            'feature_ranges': [
                {'min': 1.0, 'max': 10.0},
                {'min': 2.0, 'max': 20.0},
                {'min': 0.5, 'max': 5.0},
                {'min': 0.0, 'max': 1.0}
            ],
            'feature_means': [5.5, 11.0, 2.75, 0.5],
            'feature_stds': [2.0, 4.0, 1.0, 0.3]
        }
    }

    result = generate_sample_data(example_model, num_samples=3)
    print(json.dumps(result, indent=2))