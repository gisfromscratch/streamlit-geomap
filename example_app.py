"""
Example Streamlit app demonstrating the geomap component.

Run this app with:
    streamlit run example_app.py
"""

import streamlit as st
from streamlit_geomap import st_geomap

# Set page config
st.set_page_config(
    page_title="Streamlit Geomap Demo",
    page_icon="🗺️",
    layout="wide"
)

st.title("🗺️ Streamlit Geomap Component Demo")

st.markdown("""
This is a demonstration of the **Streamlit Geomap** component - a custom component
for rendering interactive geospatial maps using the ArcGIS Maps SDK for JavaScript.

The component provides:
- Interactive mapping capabilities
- **GeoJSON support for rendering point features**
- **Automatic map centering and zooming**
- High-performance rendering
- Seamless integration with Streamlit
- No IPython dependencies required
""")

# Sample GeoJSON data
sample_geojson = {
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
                "population": 3990456
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
                "population": 883305
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
                "population": 8336817
            }
        }
    ]
}

# Create the geomap component
st.subheader("Interactive Geomap with GeoJSON")

with st.container():
    # Add some configuration options in the sidebar
    st.sidebar.header("Map Configuration")
    
    # Options for GeoJSON display
    show_geojson = st.sidebar.checkbox("Show GeoJSON Points", value=True)
    
    if show_geojson:
        st.sidebar.info("Displaying sample city points with automatic centering")
        # Create the geomap with GeoJSON data
        result = st_geomap(geojson=sample_geojson, key="example_geomap")
    else:
        st.sidebar.info("Displaying basic map centered on Los Angeles")
        # Create the geomap without GeoJSON data
        result = st_geomap(key="example_geomap_basic")
    
    # Show the result
    if result:
        st.subheader("Component Status")
        st.json(result)
    
    # Show the GeoJSON data
    if show_geojson:
        st.subheader("GeoJSON Data")
        st.json(sample_geojson)
    
    # Add some information
    st.markdown("""
    ### Development Status
    
    - ✅ Component scaffold created
    - ✅ Basic React/TypeScript frontend
    - ✅ Python backend integration
    - ✅ ArcGIS Maps SDK integration
    - ✅ **GeoJSON point rendering**
    - ✅ **Automatic map centering and zooming**
    - ⏳ Interactive map events (coming next)
    - ⏳ Additional geometry types (coming next)
    """)

# Add footer
st.markdown("---")
st.markdown("Built with ❤️ using Streamlit Custom Components")