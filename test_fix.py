#!/usr/bin/env python3
"""
Test script to verify the DOM removeChild fix.
"""

import streamlit as st
from streamlit_geomap import st_geomap

# Set page config
st.set_page_config(
    page_title="Fix Test - Streamlit Geomap",
    page_icon="🗺️",
    layout="wide"
)

st.title("🔧 DOM Fix Test")

st.markdown("""
This test verifies that the React DOM `removeChild` error has been fixed.

**Changes made:**
1. Removed React.StrictMode to prevent double-rendering issues
2. Added defensive null checks in cleanup methods
3. Added unmount protection to prevent race conditions

**Expected behavior:**
- Component should load without browser console errors
- No "Node.removeChild: The node to be removed is not a child of this node" errors
- Map should initialize properly
""")

# Simple test case
sample_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4, 37.8]  # San Francisco
            },
            "properties": {
                "name": "San Francisco"
            }
        }
    ]
}

st.subheader("Test Component")

# Create the component
result = st_geomap(
    geojson=sample_geojson,
    height=400,
    key="fix_test"
)

if result:
    st.success("✅ Component loaded successfully!")
    st.json(result)
else:
    st.info("Waiting for component to load...")

st.markdown("""
### Expected Results:
- ✅ No browser console errors
- ✅ Map loads and displays correctly
- ✅ Point marker visible on map
- ✅ No React DOM manipulation errors
""")