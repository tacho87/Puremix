#!/usr/bin/env python3
"""Check if Pandas is available"""

try:
    import pandas as pd
    print(f"Pandas {pd.__version__} is available")
    exit(0)
except ImportError:
    print("Pandas is not available")
    exit(1)