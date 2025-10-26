"""
Machine Learning Analysis Module
Independent Python file demonstrating ML capabilities as a separate module
Can be called like JavaScript functions from PureMix framework
"""

import json
import math
from datetime import datetime
from statistics import mean, median, stdev


def analyze_dataset(data, js_context=None):
    """
    Analyze a dataset with statistical methods

    Args:
        data: Dict with 'dataset' key containing list of records
        js_context: JavaScript context from calling environment

    Returns:
        Dict with comprehensive statistical analysis
    """
    try:
        dataset = data.get('dataset', [])

        if not dataset:
            return {
                'success': False,
                'error': 'No dataset provided',
                'method': 'Python ml_analyzer.py module'
            }

        # Basic dataset info
        num_records = len(dataset)
        if num_records == 0:
            return {
                'success': False,
                'error': 'Empty dataset',
                'method': 'Python ml_analyzer.py module'
            }

        # Analyze numeric columns
        first_record = dataset[0]
        numeric_columns = []
        categorical_columns = []

        for key, value in first_record.items():
            if isinstance(value, (int, float)):
                numeric_columns.append(key)
            else:
                categorical_columns.append(key)

        # Statistical analysis for numeric columns
        numeric_analysis = {}
        for column in numeric_columns:
            values = [record.get(column, 0) for record in dataset if isinstance(record.get(column), (int, float))]

            if values:
                numeric_analysis[column] = {
                    'count': len(values),
                    'mean': round(mean(values), 3),
                    'median': round(median(values), 3),
                    'std_dev': round(stdev(values), 3) if len(values) > 1 else 0,
                    'min': min(values),
                    'max': max(values),
                    'range': max(values) - min(values)
                }

        # Categorical analysis
        categorical_analysis = {}
        for column in categorical_columns:
            values = [record.get(column, '') for record in dataset]
            value_counts = {}
            for value in values:
                value_counts[value] = value_counts.get(value, 0) + 1

            categorical_analysis[column] = {
                'unique_values': len(value_counts),
                'most_frequent': max(value_counts.items(), key=lambda x: x[1]) if value_counts else ('N/A', 0),
                'distribution': dict(sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5])  # Top 5
            }

        # Correlation analysis (simplified)
        correlations = {}
        if len(numeric_columns) >= 2:
            for i, col1 in enumerate(numeric_columns):
                for col2 in numeric_columns[i+1:]:
                    values1 = [record.get(col1, 0) for record in dataset if isinstance(record.get(col1), (int, float))]
                    values2 = [record.get(col2, 0) for record in dataset if isinstance(record.get(col2), (int, float))]

                    if len(values1) == len(values2) and len(values1) > 1:
                        # Simple correlation calculation
                        mean1, mean2 = mean(values1), mean(values2)
                        numerator = sum((v1 - mean1) * (v2 - mean2) for v1, v2 in zip(values1, values2))
                        denominator = math.sqrt(sum((v1 - mean1)**2 for v1 in values1) * sum((v2 - mean2)**2 for v2 in values2))

                        if denominator != 0:
                            correlation = numerator / denominator
                            correlations[f"{col1}_vs_{col2}"] = round(correlation, 3)

        return {
            'success': True,
            'method': 'Python ml_analyzer.py module',
            'dataset_info': {
                'num_records': num_records,
                'numeric_columns': numeric_columns,
                'categorical_columns': categorical_columns,
                'total_columns': len(numeric_columns) + len(categorical_columns)
            },
            'numeric_analysis': numeric_analysis,
            'categorical_analysis': categorical_analysis,
            'correlations': correlations,
            'insights': {
                'data_quality': 'good' if num_records > 10 else 'limited',
                'complexity': 'high' if len(numeric_columns) > 5 else 'medium' if len(numeric_columns) > 2 else 'low',
                'recommendation': 'Dataset is suitable for analysis' if num_records > 10 and len(numeric_columns) > 2 else 'Consider collecting more data for robust analysis'
            },
            'context_info': f"Analysis requested from {js_context.get('request', {}).get('url', 'unknown')}" if js_context else 'No context',
            'framework_integration': 'independent Python module',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Dataset analysis failed: {str(e)}',
            'method': 'Python ml_analyzer.py module'
        }


def train_simple_regression(training_data, js_context=None):
    """
    Train a simple linear regression model

    Args:
        training_data: Dict with 'x' and 'y' arrays
        js_context: JavaScript context

    Returns:
        Dict with trained model and predictions
    """
    try:
        x_data = training_data.get('x', [])
        y_data = training_data.get('y', [])

        if len(x_data) != len(y_data) or len(x_data) < 2:
            return {
                'success': False,
                'error': 'Invalid training data: need at least 2 points with equal length x and y arrays',
                'method': 'Python ml_analyzer.py module'
            }

        n = len(x_data)

        # Calculate linear regression coefficients (y = mx + b)
        sum_x = sum(x_data)
        sum_y = sum(y_data)
        sum_xy = sum(x * y for x, y in zip(x_data, y_data))
        sum_x_squared = sum(x * x for x in x_data)

        # Slope (m) and intercept (b)
        m = (n * sum_xy - sum_x * sum_y) / (n * sum_x_squared - sum_x * sum_x)
        b = (sum_y - m * sum_x) / n

        # Generate predictions
        predictions = [m * x + b for x in x_data]

        # Calculate R-squared
        y_mean = mean(y_data)
        ss_total = sum((y - y_mean) ** 2 for y in y_data)
        ss_residual = sum((y - pred) ** 2 for y, pred in zip(y_data, predictions))
        r_squared = 1 - (ss_residual / ss_total) if ss_total != 0 else 0

        # Model performance metrics
        mse = ss_residual / n
        rmse = math.sqrt(mse)

        # Generate test predictions
        test_points = [min(x_data) + (max(x_data) - min(x_data)) * i / 10 for i in range(11)]
        test_predictions = [m * x + b for x in test_points]

        return {
            'success': True,
            'method': 'Python ml_analyzer.py module',
            'model': {
                'type': 'linear_regression',
                'slope': round(m, 6),
                'intercept': round(b, 6),
                'equation': f"y = {round(m, 3)}x + {round(b, 3)}"
            },
            'performance': {
                'r_squared': round(r_squared, 4),
                'mse': round(mse, 4),
                'rmse': round(rmse, 4),
                'training_points': n
            },
            'predictions': {
                'training': [{'x': x, 'y_actual': y, 'y_predicted': round(pred, 3)} for x, y, pred in zip(x_data, y_data, predictions)],
                'test_line': [{'x': round(x, 2), 'y': round(y, 3)} for x, y in zip(test_points, test_predictions)]
            },
            'model_quality': {
                'fit': 'excellent' if r_squared > 0.9 else 'good' if r_squared > 0.7 else 'moderate' if r_squared > 0.5 else 'poor',
                'recommendation': 'Model fits well' if r_squared > 0.7 else 'Consider non-linear model or more features'
            },
            'context_info': f"Model trained for session {js_context.get('session', {}).get('id', 'anonymous')}" if js_context else 'No context',
            'framework_integration': 'independent Python module',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Regression training failed: {str(e)}',
            'method': 'Python ml_analyzer.py module'
        }


def classify_data_points(classification_data, js_context=None):
    """
    Simple classification using distance-based clustering

    Args:
        classification_data: Dict with 'data_points' and optional 'centers'
        js_context: JavaScript context

    Returns:
        Dict with classification results
    """
    try:
        data_points = classification_data.get('data_points', [])
        provided_centers = classification_data.get('centers', [])

        if not data_points:
            return {
                'success': False,
                'error': 'No data points provided',
                'method': 'Python ml_analyzer.py module'
            }

        # If no centers provided, create simple 2-cluster centers
        if not provided_centers:
            x_values = [point[0] for point in data_points if len(point) >= 2]
            y_values = [point[1] for point in data_points if len(point) >= 2]

            if not x_values or not y_values:
                return {
                    'success': False,
                    'error': 'Data points must have at least 2 dimensions',
                    'method': 'Python ml_analyzer.py module'
                }

            center1 = [min(x_values) + (max(x_values) - min(x_values)) * 0.25, min(y_values) + (max(y_values) - min(y_values)) * 0.25]
            center2 = [min(x_values) + (max(x_values) - min(x_values)) * 0.75, min(y_values) + (max(y_values) - min(y_values)) * 0.75]
            centers = [center1, center2]
        else:
            centers = provided_centers

        # Classify each point to nearest center
        classified_points = []
        cluster_assignments = []

        for point in data_points:
            if len(point) < 2:
                continue

            min_distance = float('inf')
            assigned_cluster = 0

            for i, center in enumerate(centers):
                # Euclidean distance
                distance = math.sqrt(sum((p - c) ** 2 for p, c in zip(point[:2], center[:2])))
                if distance < min_distance:
                    min_distance = distance
                    assigned_cluster = i

            classified_points.append({
                'point': point,
                'cluster': assigned_cluster,
                'distance_to_center': round(min_distance, 3)
            })
            cluster_assignments.append(assigned_cluster)

        # Calculate cluster statistics
        cluster_stats = {}
        for i, center in enumerate(centers):
            cluster_points = [cp for cp in classified_points if cp['cluster'] == i]
            cluster_stats[f'cluster_{i}'] = {
                'center': [round(c, 3) for c in center],
                'point_count': len(cluster_points),
                'avg_distance': round(mean([cp['distance_to_center'] for cp in cluster_points]), 3) if cluster_points else 0
            }

        return {
            'success': True,
            'method': 'Python ml_analyzer.py module',
            'classification_results': classified_points,
            'cluster_centers': [[round(c, 3) for c in center] for center in centers],
            'cluster_statistics': cluster_stats,
            'summary': {
                'total_points': len(classified_points),
                'num_clusters': len(centers),
                'algorithm': 'distance-based clustering'
            },
            'quality_metrics': {
                'well_separated': all(stats['avg_distance'] < 2.0 for stats in cluster_stats.values()),
                'balanced_clusters': max(stats['point_count'] for stats in cluster_stats.values()) / min(stats['point_count'] for stats in cluster_stats.values()) < 3 if cluster_stats else True
            },
            'context_info': f"Classification from {js_context.get('request', {}).get('method', 'unknown')} request" if js_context else 'No context',
            'framework_integration': 'independent Python module',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Classification failed: {str(e)}',
            'method': 'Python ml_analyzer.py module'
        }


def predict_time_series(time_series_data, js_context=None):
    """
    Simple time series prediction using moving averages and trend analysis

    Args:
        time_series_data: Dict with 'values' array and 'forecast_periods'
        js_context: JavaScript context

    Returns:
        Dict with predictions and analysis
    """
    try:
        values = time_series_data.get('values', [])
        forecast_periods = time_series_data.get('forecast_periods', 5)

        if len(values) < 3:
            return {
                'success': False,
                'error': 'Need at least 3 data points for time series analysis',
                'method': 'Python ml_analyzer.py module'
            }

        # Calculate moving averages
        window_size = min(3, len(values) // 2)
        moving_averages = []

        for i in range(window_size - 1, len(values)):
            avg = sum(values[i - window_size + 1:i + 1]) / window_size
            moving_averages.append(avg)

        # Simple trend calculation
        if len(moving_averages) >= 2:
            recent_trend = moving_averages[-1] - moving_averages[-2]
            longer_trend = (moving_averages[-1] - moving_averages[0]) / (len(moving_averages) - 1) if len(moving_averages) > 1 else 0
        else:
            recent_trend = 0
            longer_trend = 0

        # Generate forecasts
        forecasts = []
        last_value = values[-1]

        for i in range(forecast_periods):
            # Simple trend projection with some dampening
            dampening_factor = 0.9 ** i  # Reduce trend impact over time
            forecast = last_value + (recent_trend * (i + 1) * dampening_factor)
            forecasts.append(round(forecast, 3))

        # Statistical analysis
        data_mean = mean(values)
        data_std = stdev(values) if len(values) > 1 else 0

        # Seasonality detection (simplified)
        seasonality_detected = False
        if len(values) >= 12:
            # Check for repeating patterns
            first_half = values[:len(values)//2]
            second_half = values[len(values)//2:]
            min_len = min(len(first_half), len(second_half))

            if min_len > 3:
                correlation = 0
                for i in range(min_len):
                    correlation += abs(first_half[i] - second_half[i])
                correlation = correlation / min_len
                seasonality_detected = correlation < data_std

        return {
            'success': True,
            'method': 'Python ml_analyzer.py module',
            'original_data': values,
            'moving_averages': [round(ma, 3) for ma in moving_averages],
            'forecasts': forecasts,
            'analysis': {
                'data_points': len(values),
                'mean': round(data_mean, 3),
                'std_deviation': round(data_std, 3),
                'recent_trend': round(recent_trend, 3),
                'overall_trend': round(longer_trend, 3),
                'seasonality_detected': seasonality_detected,
                'volatility': 'high' if data_std > data_mean * 0.3 else 'medium' if data_std > data_mean * 0.1 else 'low'
            },
            'forecast_confidence': {
                'short_term': 'high' if abs(recent_trend) < data_std else 'medium',
                'long_term': 'low' if abs(longer_trend) > data_std else 'medium',
                'recommendation': 'Use forecasts for planning only' if data_std > data_mean * 0.2 else 'Forecasts are relatively reliable'
            },
            'context_info': f"Time series analysis from {js_context.get('request', {}).get('url', 'unknown')}" if js_context else 'No context',
            'framework_integration': 'independent Python module',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Time series prediction failed: {str(e)}',
            'method': 'Python ml_analyzer.py module'
        }


# Module-level test function
def test_ml_module(test_data, js_context=None):
    """Test that this ML module can be called independently"""
    return {
        'success': True,
        'message': 'ML Python module working as independent file!',
        'module_name': __name__,
        'available_functions': [
            'analyze_dataset',
            'train_simple_regression',
            'classify_data_points',
            'predict_time_series',
            'test_ml_module'
        ],
        'capabilities': {
            'statistical_analysis': 'comprehensive dataset analysis',
            'regression': 'linear regression training and prediction',
            'classification': 'distance-based clustering',
            'time_series': 'moving average forecasting'
        },
        'test_data_received': test_data,
        'context_available': js_context is not None,
        'framework_integration': 'Language-agnostic: Python ML module callable like JavaScript',
        'timestamp': datetime.now().isoformat()
    }