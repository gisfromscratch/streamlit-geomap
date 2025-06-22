#!/usr/bin/env python3
"""
Rapid remount test to verify DOM cleanup fixes.
"""

import streamlit as st
from streamlit_geomap import st_geomap
import time

# Set page config
st.set_page_config(
    page_title="Rapid Remount Test",
    page_icon="🔄",
    layout="wide"
)

st.title("🔄 Rapid Component Remount Test")

st.markdown("""
This test rapidly creates and destroys the component to verify that DOM cleanup
is working properly and no removeChild errors occur.
""")

# Counter for unique keys
if 'counter' not in st.session_state:
    st.session_state.counter = 0

# Controls
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Remount Component"):
        st.session_state.counter += 1
        st.rerun()

with col2:
    auto_remount = st.checkbox("🤖 Auto Remount (every 2s)")

with col3:
    st.metric("Remount Count", st.session_state.counter)

# Auto remount logic
if auto_remount:
    time.sleep(2)
    st.session_state.counter += 1
    st.rerun()

# Component with unique key
st.subheader(f"Component Instance #{st.session_state.counter}")

sample_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-118.2, 34.0]  # Los Angeles
            },
            "properties": {
                "name": f"Test Point #{st.session_state.counter}"
            }
        }
    ]
}

# Create component with unique key to force remount
result = st_geomap(
    geojson=sample_geojson,
    height=300,
    key=f"remount_test_{st.session_state.counter}"
)

if result:
    st.success(f"✅ Component #{st.session_state.counter} loaded successfully!")
    
st.markdown("""
### Instructions:
1. Click "Remount Component" several times rapidly
2. Check browser console for any errors
3. Enable "Auto Remount" for continuous testing

### Expected Results:
- ✅ No console errors on rapid remounting
- ✅ Each new instance loads correctly
- ✅ Old instances clean up properly
- ✅ No "removeChild" or DOM manipulation errors
""")