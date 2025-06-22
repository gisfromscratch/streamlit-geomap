"""
Test application for interactive geomap features.

Run with: streamlit run test_interactive.py
"""

import streamlit as st
from streamlit_geomap import st_geomap

# Set page config
st.set_page_config(
    page_title="Interactive Geomap Test",
    page_icon="🗺️",
    layout="wide"
)

st.title("🗺️ Interactive Geomap Features Test")

st.markdown("""
This test app demonstrates the new interactive features:
- **Click Events**: Click anywhere on the map
- **Feature Selection**: Click on features to select them
- **Hover Events**: Hover over features to see data
""")

# Sample GeoJSON data for testing
sample_data = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-118.244, 34.052]  # Los Angeles
            },
            "properties": {
                "name": "Los Angeles",
                "population": 3990456,
                "type": "Major City"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.419, 37.775]  # San Francisco
            },
            "properties": {
                "name": "San Francisco",
                "population": 883305,
                "type": "Major City"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-73.935, 40.730]  # New York
            },
            "properties": {
                "name": "New York",
                "population": 8336817,
                "type": "Major City"
            }
        }
    ]
}

# Interactive controls
st.sidebar.header("Interactive Controls")
enable_selection = st.sidebar.checkbox("Enable Selection", value=True)
enable_hover = st.sidebar.checkbox("Enable Hover", value=True)

# Create the interactive map
st.subheader("Interactive Map")
result = st_geomap(
    geojson=sample_data,
    enable_selection=enable_selection,
    enable_hover=enable_hover,
    key="interactive_test"
)

# Display the result
if result:
    st.subheader("Event Data")
    
    event_type = result.get("event", "unknown")
    
    if event_type == "map_clicked":
        st.success(f"🖱️ Map Clicked!")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Longitude", f"{result['coordinates'][0]:.4f}")
        with col2:
            st.metric("Latitude", f"{result['coordinates'][1]:.4f}")
        
        if result.get("hasFeature"):
            st.info("🎯 Clicked on a feature!")
            st.json(result["feature"])
    
    elif event_type == "feature_hovered":
        st.info(f"👆 Feature Hovered!")
        st.json(result["feature"])
    
    elif event_type == "feature_selected":
        st.success(f"✅ Feature Selection Changed!")
        st.metric("Selected Features", result["selectionCount"])
        if result["selectedFeatures"]:
            st.subheader("Selected Features")
            for i, feature in enumerate(result["selectedFeatures"]):
                st.write(f"**Feature {i+1}:**")
                st.json(feature)
    
    elif event_type == "map_loaded":
        st.success("🗺️ Map Loaded Successfully!")
    
    # Show full event data
    with st.expander("Full Event Data"):
        st.json(result)

# Instructions
st.markdown("""
### How to Test:

1. **Map Clicks**: Click anywhere on the map to see coordinates
2. **Feature Selection**: Click on the orange city markers to select/deselect them
3. **Hover Effects**: Move your mouse over city markers to see hover data
4. **Multiple Selection**: You can select multiple cities
5. **Selection Highlighting**: Selected features have yellow outlines

### Expected Behavior:

- Clicking empty areas shows coordinates only
- Clicking features shows both coordinates and feature data
- Selected features are highlighted with yellow outlines
- Hover events show feature properties
- All events are captured and displayed below the map
""")