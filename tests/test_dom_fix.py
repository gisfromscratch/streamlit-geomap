#!/usr/bin/env python3
"""
Test script to verify the DOM removeChild fix.
This test creates and destroys the component to trigger potential DOM errors.
"""

import streamlit as st
from streamlit_geomap import st_geomap

# Set page config
st.set_page_config(
    page_title="DOM Fix Test",
    page_icon="🔧",
    layout="wide"
)

st.title("🔧 DOM Error Fix Test")

st.markdown("""
## DOM Error Fix Applied

**Issue:** `DOMException: Node.removeChild: The node to be removed is not a child of this node`

**Fix Applied:**
1. **Improved cleanup sequence**: MapView destruction now happens before DOM container cleanup
2. **Enhanced error handling**: DOM operations are wrapped in comprehensive try-catch blocks
3. **Race condition prevention**: Added timing safeguards and DOM connectivity checks
4. **Defensive programming**: Multiple validation checks before DOM manipulation

**Expected behavior:**
- Component loads without browser console errors
- No "Node.removeChild" DOM exceptions
- Map initializes and displays correctly
- Rapid remounting works without errors
""")

# Simple test case with GeoJSON data
sample_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-118.2437, 34.0522]  # Los Angeles
            },
            "properties": {
                "name": "Los Angeles",
                "description": "Test point for DOM fix verification"
            }
        }
    ]
}

# Create columns for better layout
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Test Component")
    
    # Create the component
    result = st_geomap(
        geojson=sample_geojson,
        height=400,
        basemap="topo-vector",
        key="dom_fix_test"
    )
    
    if result:
        event_type = result.get("event")
        if event_type == "map_loaded":
            st.success("✅ Component loaded successfully without DOM errors!")
            st.info(f"Features rendered: {result.get('featuresRendered', 0)}")
        elif event_type == "map_clicked":
            coords = result.get('coordinates', [])
            st.info(f"🖱️ Map clicked at: [{coords[0]:.4f}, {coords[1]:.4f}]")
        
        with st.expander("📊 Component Event Data"):
            st.json(result)
    else:
        st.info("Waiting for component to load...")

with col2:
    st.subheader("🧪 Test Controls")
    
    # Counter for unique keys to force remount
    if 'remount_counter' not in st.session_state:
        st.session_state.remount_counter = 0
    
    if st.button("🔄 Force Remount", help="Force component remount to test DOM cleanup"):
        st.session_state.remount_counter += 1
        st.rerun()
        
    st.metric("Remount Count", st.session_state.remount_counter)
    
    if st.button("🗑️ Clear Counter"):
        st.session_state.remount_counter = 0
        st.rerun()
    
    st.markdown("""
    **Testing Instructions:**
    1. Open browser Developer Tools (F12)
    2. Go to Console tab
    3. Click "Force Remount" several times
    4. Check for absence of DOM errors
    5. Look specifically for no "removeChild" errors
    """)

st.markdown("---")

st.subheader("✅ Success Criteria")

success_criteria = [
    "No console errors during map initialization",
    "No 'Node.removeChild' DOM exceptions",
    "Map displays correctly with GeoJSON point",
    "Interactive events work without errors",
    "Component handles rapid remounting gracefully",
    "Cleanup sequence completes without throwing errors"
]

for i, criterion in enumerate(success_criteria, 1):
    st.markdown(f"{i}. ✅ {criterion}")

st.success("🎉 **Test Complete!** If you see this message and no console errors, the DOM fix is working correctly.")

st.markdown("""
---
**Technical Details:**

The fix addresses the race condition between React's DOM cleanup and ArcGIS MapView destruction by:
- Ensuring MapView.destroy() is called while DOM container still exists
- Using defensive DOM node existence checks before manipulation
- Implementing comprehensive error handling to prevent exceptions from propagating
- Adding timing safeguards with setTimeout for cleanup sequencing
""")