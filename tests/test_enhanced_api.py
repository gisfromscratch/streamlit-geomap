#!/usr/bin/env python3
"""
Comprehensive test and example for the new Python API with prop configuration.
This demonstrates all the new features and validates the implementation.
"""

import streamlit as st
from streamlit_geomap import st_geomap

def main():
    st.title("🗺️ Enhanced Streamlit Geomap Component")
    st.subheader("Python API & Prop Configuration Demo")
    
    st.markdown("""
    This demo showcases the new enhanced Python API with comprehensive prop configuration:
    
    ✨ **New Features:**
    - 🎨 **Configurable Size**: Custom height and width
    - 🗺️ **Multiple Basemaps**: 12+ basemap options
    - 📍 **Center & Zoom**: Precise map positioning
    - 📚 **Unified Layers**: New layers parameter
    - ✅ **Input Validation**: Comprehensive error handling
    - 🔄 **Backward Compatibility**: Legacy feature_layers still supported
    """)
    
    # Configuration options
    st.sidebar.header("🎛️ Map Configuration")
    
    # Size configuration
    st.sidebar.subheader("📐 Size")
    height = st.sidebar.slider("Height (px)", min_value=300, max_value=800, value=500)
    width_option = st.sidebar.selectbox("Width", ["100%", "90%", "80%", "800px", "600px"])
    
    # Basemap configuration
    st.sidebar.subheader("🗺️ Basemap")
    basemap_options = [
        'topo-vector', 'streets-vector', 'streets', 'satellite', 'hybrid',
        'terrain', 'osm', 'dark-gray-vector', 'gray-vector', 'streets-night-vector',
        'streets-relief-vector', 'streets-navigation-vector'
    ]
    basemap = st.sidebar.selectbox("Basemap", basemap_options, index=3)  # Default to satellite
    
    # Center and zoom configuration
    st.sidebar.subheader("📍 View")
    preset_locations = {
        "Custom": None,
        "San Francisco": [-122.4194, 37.7749],
        "New York": [-74.0059, 40.7128],
        "London": [-0.1276, 51.5074],
        "Tokyo": [139.6503, 35.6762],
        "Sydney": [151.2093, -33.8688]
    }
    
    location = st.sidebar.selectbox("Preset Location", list(preset_locations.keys()))
    
    if location == "Custom":
        col1, col2 = st.sidebar.columns(2)
        longitude = col1.number_input("Longitude", min_value=-180.0, max_value=180.0, value=-122.4)
        latitude = col2.number_input("Latitude", min_value=-90.0, max_value=90.0, value=37.8)
        center = [longitude, latitude]
    else:
        center = preset_locations[location]
    
    zoom = st.sidebar.slider("Zoom Level", min_value=1, max_value=18, value=10)
    
    # Layer configuration
    st.sidebar.subheader("📚 Layers")
    use_sample_layer = st.sidebar.checkbox("Add Sample Feature Layer", value=True)
    
    layers = []
    if use_sample_layer:
        layers.append({
            "type": "feature",
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States",
            "visible": True
        })
    
    # Interactive features
    st.sidebar.subheader("🖱️ Interactions")
    enable_selection = st.sidebar.checkbox("Enable Selection", value=True)
    enable_hover = st.sidebar.checkbox("Enable Hover", value=True)
    
    # Display configuration
    st.subheader("⚙️ Current Configuration")
    config_col1, config_col2 = st.columns(2)
    
    with config_col1:
        st.write("**Size & View:**")
        st.write(f"- Height: {height}px")
        st.write(f"- Width: {width_option}")
        st.write(f"- Basemap: {basemap}")
        st.write(f"- Center: {center}")
        st.write(f"- Zoom: {zoom}")
    
    with config_col2:
        st.write("**Features:**")
        st.write(f"- Layers: {len(layers)} configured")
        st.write(f"- Selection: {'Enabled' if enable_selection else 'Disabled'}")
        st.write(f"- Hover: {'Enabled' if enable_hover else 'Disabled'}")
    
    # Create the map with new API
    st.subheader("🗺️ Interactive Map")
    
    try:
        result = st_geomap(
            layers=layers if layers else None,
            height=height,
            width=width_option,
            basemap=basemap,
            center=center,
            zoom=zoom,
            view_mode="2d",
            enable_selection=enable_selection,
            enable_hover=enable_hover,
            key="enhanced_geomap"
        )
        
        # Display result
        if result:
            st.subheader("📡 Map Events")
            st.json(result)
            
            # Show specific event information
            if result.get("event") == "map_loaded":
                st.success("✅ Map loaded successfully!")
                st.info(f"🗺️ Loaded {result.get('featureLayersLoaded', 0)} feature layers and rendered {result.get('featuresRendered', 0)} features")
            elif result.get("event") == "map_clicked":
                coords = result.get("coordinates", [])
                if coords:
                    st.info(f"📍 Map clicked at: {coords[1]:.4f}, {coords[0]:.4f}")
            elif result.get("event") == "feature_selected":
                count = result.get("selectionCount", 0)
                st.info(f"🎯 {count} feature(s) selected")
            elif result.get("event") == "feature_hovered":
                feature = result.get("feature", {})
                if feature.get("attributes"):
                    st.info(f"👆 Hovering over feature: {feature['attributes']}")
        
    except Exception as e:
        st.error(f"❌ Error creating map: {str(e)}")
    
    # Code example
    st.subheader("💻 Code Example")
    st.code(f'''
import streamlit as st
from streamlit_geomap import st_geomap

# Create enhanced geomap with new API
result = st_geomap(
    layers={layers if layers else None},
    height={height},
    width="{width_option}",
    basemap="{basemap}",
    center={center},
    zoom={zoom},
    view_mode="2d",
    enable_selection={enable_selection},
    enable_hover={enable_hover},
    key="my_map"
)
''', language='python')
    
    # Feature comparison
    st.subheader("🆚 API Comparison")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**Before (Limited):**")
        st.code('''
# Old API - limited options
result = st_geomap(
    geojson=data,
    feature_layers=layers,
    key="map"
)
# Fixed size: 400px height
# Fixed basemap: topo-vector
# Fixed center: Los Angeles
# Fixed zoom: 12
''', language='python')
    
    with col2:
        st.write("**After (Enhanced):**")
        st.code('''
# New API - full control
result = st_geomap(
    layers=layers,          # Unified layers
    height=600,             # Custom height
    width="90%",            # Custom width
    basemap="satellite",    # 12+ options
    center=[-74.0, 40.7],   # Custom center
    zoom=15,                # Custom zoom
    view_mode="2d",         # 2D/3D support
    enable_selection=True,
    enable_hover=True,
    key="map"
)
''', language='python')
    
    # Validation examples
    st.subheader("✅ Input Validation")
    st.markdown("""
    The new API includes comprehensive validation:
    
    - **Height/Width**: Must be ≥100px, supports px and % units
    - **Basemap**: Validates against 12 supported basemap types
    - **Center**: Longitude [-180, 180], Latitude [-90, 90]
    - **Zoom**: Range [0, 20]
    - **Layers**: Type validation and required field checking
    - **Helpful Errors**: Clear error messages for invalid inputs
    """)
    
    # Backward compatibility note
    st.info("🔄 **Backward Compatibility**: Existing code using `feature_layers` parameter continues to work unchanged!")

if __name__ == "__main__":
    main()