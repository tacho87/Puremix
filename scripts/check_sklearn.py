#!/usr/bin/env python3
"""Check if scikit-learn is available"""

try:
    import sklearn
    print(f"scikit-learn {sklearn.__version__} is available")
    exit(0)
except ImportError:
    print("scikit-learn is not available")
    exit(1)