#!/usr/bin/env python3
"""Check if NumPy is available"""

try:
    import numpy as np
    print(f"NumPy {np.__version__} is available")
    exit(0)
except ImportError:
    print("NumPy is not available")
    exit(1)