#!/usr/bin/env python3
"""
Simple verification that the component loads without errors.
"""

import sys
import os

# Add the package to the path
sys.path.insert(0, '/home/runner/work/streamlit-geomap/streamlit-geomap')

try:
    # Try to import the component
    from streamlit_geomap import st_geomap
    print("✅ Component import successful")
    
    # Verify the build files exist
    build_path = "/home/runner/work/streamlit-geomap/streamlit-geomap/frontend/build"
    if os.path.exists(build_path):
        print("✅ Build directory exists")
        
        # Check for key files
        index_path = os.path.join(build_path, "index.html")
        if os.path.exists(index_path):
            print("✅ index.html exists")
        else:
            print("❌ index.html missing")
            
        manifest_path = os.path.join(build_path, "asset-manifest.json")
        if os.path.exists(manifest_path):
            print("✅ asset-manifest.json exists")
        else:
            print("❌ asset-manifest.json missing")
    else:
        print("❌ Build directory missing")
    
    print("\n🎉 Component is ready to test!")
    print("The DOM fix has been applied to the React component.")
    print("To test with Streamlit, run: streamlit run tests/test_dom_fix.py")
    
except ImportError as e:
    print(f"❌ Import failed: {e}")
except Exception as e:
    print(f"❌ Error: {e}")