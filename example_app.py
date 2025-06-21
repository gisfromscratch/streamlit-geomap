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
    
    # Sidebar options
    st.sidebar.header("Map Configuration")
    
    # Map display options
    map_type = st.sidebar.selectbox(
        "Select Map Type:",
        ["GeoJSON Only", "FeatureLayer Only", "Combined GeoJSON + FeatureLayer"]
    )
    
    if map_type == "GeoJSON Only":
        st.sidebar.info("Displaying sample city points with automatic centering")
        result = st_geomap(geojson=sample_geojson, key="example_geojson")
        
    elif map_type == "FeatureLayer Only":
        st.sidebar.info("Displaying FeatureLayer from ArcGIS Online")
        
        # FeatureLayer configuration options
        layer_option = st.sidebar.selectbox(
            "Select FeatureLayer:",
            ["USA Counties", "World Countries", "USA States"]
        )
        
        feature_layer_configs = {
            "USA Counties": [{
                "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized/FeatureServer/0",
                "title": "USA Counties",
                "visible": True
            }],
            "World Countries": [{
                "portal_item_id": "99fd67933e754a1181cc755146be21ca",
                "title": "World Countries",
                "visible": True
            }],
            "USA States": [{
                "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
                "title": "USA States",
                "visible": True,
                "renderer": {
                    "type": "simple",
                    "symbol": {
                        "type": "simple-fill",
                        "color": [51, 153, 255, 0.4],
                        "outline": {
                            "color": [255, 255, 255, 1],
                            "width": 2
                        }
                    }
                }
            }]
        }
        
        selected_config = feature_layer_configs[layer_option]
        result = st_geomap(feature_layers=selected_config, key="example_feature_layer")
        
    else:  # Combined
        st.sidebar.info("Displaying both GeoJSON points and FeatureLayer")
        
        combined_feature_layer = [{
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States",
            "visible": True,
            "renderer": {
                "type": "simple",
                "symbol": {
                    "type": "simple-fill",
                    "color": [255, 165, 0, 0.3],
                    "outline": {
                        "color": [255, 255, 255, 1],
                        "width": 1
                    }
                }
            }
        }]
        
        result = st_geomap(
            geojson=sample_geojson, 
            feature_layers=combined_feature_layer, 
            key="example_combined"
        )
    
    # Authentication section
    st.sidebar.header("Authentication (Optional)")
    api_key = st.sidebar.text_input(
        "ArcGIS API Key:",
        type="password",
        help="Enter your ArcGIS API key for authenticated requests"
    )
    
    if api_key:
        st.sidebar.success("API key configured (hidden for security)")
        
        # Demo with authenticated layer
        auth_layer = [{
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "api_key": api_key,
            "title": "Authenticated Layer",
            "visible": True
        }]
        
        if st.sidebar.button("Test Authenticated Layer"):
            result_auth = st_geomap(feature_layers=auth_layer, key="example_auth")
            if result_auth:
                st.sidebar.json(result_auth)
    
    # Show the result
    if result:
        st.subheader("Component Status")
        st.json(result)
    
    # Show the GeoJSON data
    if map_type in ["GeoJSON Only", "Combined GeoJSON + FeatureLayer"]:
        st.subheader("GeoJSON Data")
        with st.expander("View GeoJSON Data"):
            st.json(sample_geojson)
    
    # Show FeatureLayer configuration
    if map_type in ["FeatureLayer Only", "Combined GeoJSON + FeatureLayer"]:
        st.subheader("FeatureLayer Configuration")
        with st.expander("View FeatureLayer Config"):
            if map_type == "FeatureLayer Only":
                st.json(selected_config)
            else:
                st.json(combined_feature_layer)
    
    # Add information about new features
    st.markdown("""
    ### ✨ New FeatureLayer Features
    
    This component now supports **ArcGIS FeatureLayers** in addition to GeoJSON data:
    
    #### 🔗 Layer Sources
    - **URLs**: Direct links to ArcGIS Feature Services
    - **Portal Items**: ArcGIS Online/Portal item IDs
    
    #### 🔐 Authentication
    - **API Keys**: For accessing secured services
    - **OAuth Tokens**: For user-authenticated access
    
    #### 🎨 Styling & Labeling
    - **Custom Renderers**: Define symbols and colors
    - **Labeling**: Add text labels to features
    
    #### 🔄 Backward Compatibility
    - **GeoJSON Support**: Existing GeoJSON functionality preserved
    - **Combined Usage**: Use both GeoJSON and FeatureLayers together
    """)
    
    # Add some information
    st.markdown("""
    ### Development Status
    
    - ✅ Component scaffold created
    - ✅ Basic React/TypeScript frontend
    - ✅ Python backend integration
    - ✅ ArcGIS Maps SDK integration
    - ✅ **GeoJSON point rendering**
    - ✅ **Automatic map centering and zooming**
    - ✅ **FeatureLayer support (URLs & Portal Items)**
    - ✅ **Authentication (API Key & OAuth)**
    - ✅ **Custom renderers and labeling**
    - ⏳ Interactive map events (coming next)
    - ⏳ Additional geometry types (coming next)
    """)

# Add footer
st.markdown("---")
st.markdown("Built with ❤️ using Streamlit Custom Components")