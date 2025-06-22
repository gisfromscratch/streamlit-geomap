#!/usr/bin/env python3
"""
Basic validation test for the refactored GeomapComponent
"""

import streamlit as st
import streamlit_geomap

def test_basic_functionality():
    """Test basic functionality works after refactoring"""
    
    # Test 1: Basic import and function availability
    assert hasattr(streamlit_geomap, 'st_geomap'), "st_geomap function should be available"
    
    # Test 2: Component frontend build exists
    import os
    # The build folder is at the root level, not inside streamlit_geomap package
    root_dir = os.path.dirname(os.path.dirname(streamlit_geomap.__file__))
    build_path = os.path.join(root_dir, "frontend", "build")
    assert os.path.exists(build_path), f"Frontend build should exist at {build_path}"
    
    # Test 3: Main JS file exists in build
    static_js_path = os.path.join(build_path, "static", "js")
    if os.path.exists(static_js_path):
        js_files = [f for f in os.listdir(static_js_path) if f.startswith("main.") and f.endswith(".js")]
        assert len(js_files) > 0, "Main JS file should exist in build"
    
    # Test 4: CSS file exists in build (our new CSS)
    static_css_path = os.path.join(build_path, "static", "css")
    if os.path.exists(static_css_path):
        css_files = [f for f in os.listdir(static_css_path) if f.startswith("main.") and f.endswith(".css")]
        assert len(css_files) > 0, "Main CSS file should exist in build"
    
    print("✅ All basic functionality tests passed!")

if __name__ == "__main__":
    test_basic_functionality()
    print("🎉 Refactored GeomapComponent validation successful!")