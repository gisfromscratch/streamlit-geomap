#!/usr/bin/env python3
"""
Test script for FeatureLayer functionality in streamlit-geomap component.
This script demonstrates how to use the new FeatureLayer features.
"""

import streamlit as st
from streamlit_geomap import st_geomap

def test_feature_layer_functionality():
    """Test FeatureLayer with different configuration options."""
    
    st.title("🗺️ FeatureLayer Testing")
    
    # Test 1: Basic FeatureLayer with URL
    st.header("Test 1: Basic FeatureLayer with URL")
    
    feature_layer_config = [
        {
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized/FeatureServer/0",
            "title": "USA Counties",
            "visible": True
        }
    ]
    
    result1 = st_geomap(feature_layers=feature_layer_config, key="test_feature_layer_url")
    if result1:
        st.write("FeatureLayer (URL) result:", result1)
    
    # Test 2: FeatureLayer with Portal Item ID
    st.header("Test 2: FeatureLayer with Portal Item ID")
    
    portal_item_config = [
        {
            "portal_item_id": "99fd67933e754a1181cc755146be21ca",
            "title": "World Countries",
            "visible": True
        }
    ]
    
    result2 = st_geomap(feature_layers=portal_item_config, key="test_feature_layer_portal")
    if result2:
        st.write("FeatureLayer (Portal Item) result:", result2)
    
    # Test 3: FeatureLayer with API Key Authentication
    st.header("Test 3: FeatureLayer with API Key")
    
    api_key = st.text_input("Enter ArcGIS API Key (optional):", type="password")
    
    if api_key:
        api_key_config = [
            {
                "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
                "api_key": api_key,
                "title": "USA States (with API Key)",
                "visible": True
            }
        ]
        
        result3 = st_geomap(feature_layers=api_key_config, key="test_feature_layer_api_key")
        if result3:
            st.write("FeatureLayer (API Key) result:", result3)
    
    # Test 4: FeatureLayer with Custom Renderer
    st.header("Test 4: FeatureLayer with Custom Renderer")
    
    renderer_config = [
        {
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States (Custom Renderer)",
            "visible": True,
            "renderer": {
                "type": "simple",
                "symbol": {
                    "type": "simple-fill",
                    "color": [255, 128, 0, 0.5],
                    "outline": {
                        "color": [255, 255, 255, 1],
                        "width": 2
                    }
                }
            }
        }
    ]
    
    result4 = st_geomap(feature_layers=renderer_config, key="test_feature_layer_renderer")
    if result4:
        st.write("FeatureLayer (Custom Renderer) result:", result4)
    
    # Test 5: FeatureLayer with Labeling
    st.header("Test 5: FeatureLayer with Labeling")
    
    labeling_config = [
        {
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States (with Labels)",
            "visible": True,
            "label_info": [
                {
                    "labelExpression": "[STATE_NAME]",
                    "symbol": {
                        "type": "text",
                        "color": [255, 255, 255, 1],
                        "backgroundColor": [0, 0, 0, 0.7],
                        "borderLineColor": [255, 255, 255, 1],
                        "borderLineSize": 1,
                        "font": {
                            "family": "Arial",
                            "size": 12,
                            "weight": "bold"
                        }
                    }
                }
            ]
        }
    ]
    
    result5 = st_geomap(feature_layers=labeling_config, key="test_feature_layer_labels")
    if result5:
        st.write("FeatureLayer (Labeling) result:", result5)
    
    # Test 6: Combined GeoJSON and FeatureLayer
    st.header("Test 6: Combined GeoJSON and FeatureLayer")
    
    sample_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-118.244, 34.052]
                },
                "properties": {
                    "name": "Los Angeles"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-74.006, 40.7128]
                },
                "properties": {
                    "name": "New York"
                }
            }
        ]
    }
    
    combined_config = [
        {
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States",
            "visible": True
        }
    ]
    
    result6 = st_geomap(
        geojson=sample_geojson, 
        feature_layers=combined_config, 
        key="test_combined"
    )
    if result6:
        st.write("Combined GeoJSON + FeatureLayer result:", result6)

if __name__ == "__main__":
    test_feature_layer_functionality()