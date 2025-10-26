#!/usr/bin/env python3
"""Check if TensorFlow is available"""

try:
    import tensorflow as tf
    print(f"TensorFlow {tf.__version__} is available")
    
    # Check if GPU support is available
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        print(f"GPU support: {len(gpus)} GPU(s) detected")
        for i, gpu in enumerate(gpus):
            print(f"  GPU {i}: {gpu}")
    else:
        print("GPU support: CPU only")
    
    exit(0)
except ImportError:
    print("TensorFlow is not available")
    exit(1)
except Exception as e:
    print(f"TensorFlow check failed: {e}")
    exit(1)