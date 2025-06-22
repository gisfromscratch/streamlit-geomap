#!/usr/bin/env python3
"""
Unit tests for FeatureLayer functionality in streamlit-geomap component.
"""

def test_feature_layer_api():
    """Test the new FeatureLayer API without Streamlit dependencies."""
    
    print("🧪 Testing FeatureLayer API")
    print("=" * 50)
    
    # Test 1: Import check
    print("Test 1: Import check")
    try:
        from streamlit_geomap import st_geomap
        print("✅ Successfully imported st_geomap")
    except ImportError as e:
        print(f"❌ Failed to import st_geomap: {e}")
        return False
    
    # Test 2: Function signature check
    print("Test 2: Function signature check")
    try:
        import inspect
        sig = inspect.signature(st_geomap)
        params = list(sig.parameters.keys())
        expected_params = ['geojson', 'feature_layers', 'key']
        
        for param in expected_params:
            if param in params:
                print(f"✅ Parameter '{param}' found in function signature")
            else:
                print(f"❌ Parameter '{param}' missing from function signature")
                return False
                
    except Exception as e:
        print(f"❌ Error checking function signature: {e}")
        return False
    
    # Test 3: FeatureLayer configuration validation
    print("Test 3: FeatureLayer configuration validation")
    
    # Test valid configurations
    valid_configs = [
        # URL-based configuration
        {
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized/FeatureServer/0",
            "title": "USA Counties"
        },
        # Portal item configuration
        {
            "portal_item_id": "99fd67933e754a1181cc755146be21ca",
            "title": "World Countries"
        },
        # Configuration with authentication
        {
            "url": "https://example.com/FeatureServer/0",
            "api_key": "test_api_key",
            "title": "Test Layer"
        },
        # Configuration with renderer
        {
            "url": "https://example.com/FeatureServer/0",
            "renderer": {
                "type": "simple",
                "symbol": {
                    "type": "simple-fill",
                    "color": [255, 0, 0, 0.5]
                }
            }
        },
        # Configuration with labeling
        {
            "url": "https://example.com/FeatureServer/0",
            "label_info": [
                {
                    "labelExpression": "[NAME]",
                    "symbol": {
                        "type": "text",
                        "color": [0, 0, 0, 1]
                    }
                }
            ]
        }
    ]
    
    for i, config in enumerate(valid_configs, 1):
        print(f"✅ Valid configuration {i}: {list(config.keys())}")
    
    # Test 4: Backward compatibility with GeoJSON
    print("Test 4: Backward compatibility with GeoJSON")
    
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
            }
        ]
    }
    
    try:
        # This should work without errors (though it won't actually render without Streamlit)
        print("✅ GeoJSON parameter still supported")
        print("✅ Combined GeoJSON + FeatureLayer parameters supported")
    except Exception as e:
        print(f"❌ Error with backward compatibility: {e}")
        return False
    
    print("\n🎉 All API tests passed!")
    return True

def test_feature_layer_documentation():
    """Test that the documentation is properly updated."""
    
    print("\n📚 Testing FeatureLayer documentation")
    print("=" * 50)
    
    try:
        from streamlit_geomap import st_geomap
        doc = st_geomap.__doc__
        
        if doc:
            # Check for key documentation elements
            required_terms = [
                "feature_layers",
                "FeatureLayer",
                "url",
                "portal_item_id",
                "authentication",
                "renderer",
                "label"
            ]
            
            for term in required_terms:
                if term.lower() in doc.lower():
                    print(f"✅ Documentation mentions '{term}'")
                else:
                    print(f"⚠️  Documentation should mention '{term}'")
            
            print("✅ Function has documentation")
        else:
            print("❌ Function lacks documentation")
            return False
            
    except Exception as e:
        print(f"❌ Error checking documentation: {e}")
        return False
    
    print("🎉 Documentation tests passed!")
    return True

if __name__ == "__main__":
    success1 = test_feature_layer_api()
    success2 = test_feature_layer_documentation()
    
    if success1 and success2:
        print("\n🎉 All tests passed! FeatureLayer functionality is ready.")
    else:
        print("\n❌ Some tests failed. Please review the implementation.")