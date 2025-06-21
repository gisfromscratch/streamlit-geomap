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
- **Interactive click, hover, and selection events**
- **Feature selection with visual highlighting**
- **Real-time event data communication**
- GeoJSON support for rendering point features
- Automatic map centering and zooming
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
    
    # Interactive controls
    st.sidebar.subheader("Interactive Features")
    enable_selection = st.sidebar.checkbox("Enable Feature Selection", value=True)
    enable_hover = st.sidebar.checkbox("Enable Hover Events", value=True)
    
    # Map display options
    map_type = st.sidebar.selectbox(
        "Select Map Type:",
        ["GeoJSON Only", "FeatureLayer Only", "Combined GeoJSON + FeatureLayer"]
    )
    
    if map_type == "GeoJSON Only":
        st.sidebar.info("Displaying sample city points with automatic centering")
        result = st_geomap(
            geojson=sample_geojson, 
            enable_selection=enable_selection,
            enable_hover=enable_hover,
            key="example_geojson"
        )
        
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
        result = st_geomap(
            feature_layers=selected_config,
            enable_selection=enable_selection,
            enable_hover=enable_hover,
            key="example_feature_layer"
        )
        
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
            enable_selection=enable_selection,
            enable_hover=enable_hover,
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
    
    # Show the result with better formatting
    if result:
        st.subheader("Component Events")
        
        event_type = result.get("event", "unknown")
        
        if event_type == "map_clicked":
            st.success(f"🖱️ Map Clicked at [{result['coordinates'][0]:.4f}, {result['coordinates'][1]:.4f}]")
            if result.get("hasFeature"):
                st.info("🎯 Clicked on a feature!")
        elif event_type == "feature_hovered":
            st.info("👆 Feature being hovered")
        elif event_type == "feature_selected":
            st.success(f"✅ Features selected: {result['selectionCount']}")
        elif event_type == "map_loaded":
            st.success("🗺️ Map loaded successfully")
        
        with st.expander("View Full Event Data"):
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
    ### ✨ New Interactive Features
    
    The component now supports **real-time interactive events**:
    
    #### 🖱️ Click Events
    - **Map Clicks**: Get coordinates of any map location
    - **Feature Clicks**: Access feature properties and select features
    - **Real-time Response**: Instant feedback in Streamlit
    
    #### 🎯 Feature Selection
    - **Visual Highlighting**: Selected features get yellow outlines
    - **Multiple Selection**: Select multiple features simultaneously
    - **Selection Data**: Get full data of selected features
    
    #### 👆 Hover Events
    - **Feature Detection**: Automatically detects when hovering over features
    - **Cursor Changes**: Pointer cursor when over features
    - **Hover Data**: Access feature properties on hover
    
    Plus existing FeatureLayer features:
    - URLs and Portal Item IDs
    - Authentication (API Key & OAuth)
    - Custom renderers and labeling
    - Full backward compatibility
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
    - ✅ **Interactive click, hover, and selection events**
    - ✅ **Feature selection with visual highlighting**
    - ✅ **Real-time event data communication**
    - ⏳ Additional geometry types (coming next)
    - ⏳ Popup customization (coming next)
    """)
    
    st.markdown("""
    ### 🧪 Try It Out!
    
    **Click**: Click anywhere on the map or on features to see coordinates and data  
    **Hover**: Move your mouse over features to see hover events  
    **Select**: Click on features to select them (yellow highlight)  
    **Multi-select**: Hold and click multiple features to select several at once  
    
    All events are captured and displayed in the "Component Events" section above!
    """)

# Add footer
st.markdown("---")
st.markdown("Built with ❤️ using Streamlit Custom Components")