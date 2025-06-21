"""
Basic usage example for streamlit-geomap.

This example demonstrates the simplest way to use the component
with default settings and basic GeoJSON data.

Run with: streamlit run examples/basic_usage.py
"""

import streamlit as st
from streamlit_geomap import st_geomap

st.set_page_config(page_title="Basic Geomap Example", page_icon="🗺️")

st.title("🗺️ Basic Geomap Example")

st.markdown("""
This is the simplest possible example of using streamlit-geomap.
It displays a few sample points on the map with default settings.
""")

# Sample GeoJSON data - a few major cities
sample_data = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4194, 37.7749]  # San Francisco
            },
            "properties": {
                "name": "San Francisco",
                "state": "California",
                "population": 873965
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-74.0060, 40.7128]  # New York
            },
            "properties": {
                "name": "New York",
                "state": "New York", 
                "population": 8336817
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-87.6298, 41.8781]  # Chicago
            },
            "properties": {
                "name": "Chicago",
                "state": "Illinois",
                "population": 2693976
            }
        }
    ]
}

# Create the map
result = st_geomap(
    geojson=sample_data,
    height=500,
    key="basic_example"
)

# Display results
if result:
    event_type = result.get("event")
    
    if event_type == "map_clicked":
        st.success("🖱️ Map clicked!")
        coords = result["coordinates"]
        st.write(f"**Coordinates:** {coords[1]:.4f}, {coords[0]:.4f}")
        
        if result.get("feature"):
            feature = result["feature"]["properties"]  
            st.write(f"**City:** {feature['name']}")
            st.write(f"**State:** {feature['state']}")
            st.write(f"**Population:** {feature['population']:,}")
    
    elif event_type == "feature_selected":
        selected_count = len(result.get("selectedFeatures", []))
        st.info(f"✅ {selected_count} cities selected")
        
    elif event_type == "feature_hovered":
        feature = result["feature"]["properties"]
        st.info(f"👆 Hovering over {feature['name']}")

st.markdown("""
### Try These Interactions:
- **Click** anywhere on the map to see coordinates
- **Click** on city markers to see details  
- **Hover** over markers to see city names
- **Select** multiple cities by clicking on them
""")