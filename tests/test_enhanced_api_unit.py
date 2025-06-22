#!/usr/bin/env python3
"""
Unit tests for the new Python API prop configuration features.
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add the package path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from streamlit_geomap import (
    st_geomap,
    _validate_height,
    _validate_width,
    _validate_basemap,
    _validate_center,
    _validate_zoom,
    _validate_view_mode,
    _validate_layers
)


class TestValidationFunctions(unittest.TestCase):
    """Test all validation functions."""
    
    def test_validate_height(self):
        """Test height validation."""
        # Valid cases
        self.assertEqual(_validate_height(400), "400px")
        self.assertEqual(_validate_height("500px"), "500px")
        self.assertEqual(_validate_height("80%"), "80%")
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_height(50)  # Too small
        with self.assertRaises(ValueError):
            _validate_height("invalid")  # Invalid format
        with self.assertRaises(ValueError):
            _validate_height(-100)  # Negative
    
    def test_validate_width(self):
        """Test width validation."""
        # Valid cases
        self.assertEqual(_validate_width(800), "800px")
        self.assertEqual(_validate_width("100%"), "100%")
        self.assertEqual(_validate_width("600px"), "600px")
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_width(50)  # Too small
        with self.assertRaises(ValueError):
            _validate_width("150%")  # Over 100%
    
    def test_validate_basemap(self):
        """Test basemap validation."""
        # Valid cases
        valid_basemaps = ['topo-vector', 'satellite', 'streets', 'hybrid']
        for basemap in valid_basemaps:
            self.assertEqual(_validate_basemap(basemap), basemap)
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_basemap("invalid-basemap")
    
    def test_validate_center(self):
        """Test center validation."""
        # Valid cases
        self.assertEqual(_validate_center([-122.4, 37.8]), [-122.4, 37.8])
        self.assertEqual(_validate_center([0, 0]), [0.0, 0.0])
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_center([200, 100])  # Invalid longitude
        with self.assertRaises(ValueError):
            _validate_center([-100, 100])  # Invalid latitude
        with self.assertRaises(ValueError):
            _validate_center([0])  # Wrong length
    
    def test_validate_zoom(self):
        """Test zoom validation."""
        # Valid cases
        self.assertEqual(_validate_zoom(10), 10.0)
        self.assertEqual(_validate_zoom(15.5), 15.5)
        self.assertEqual(_validate_zoom(0), 0.0)
        self.assertEqual(_validate_zoom(20), 20.0)
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_zoom(25)  # Too high
        with self.assertRaises(ValueError):
            _validate_zoom(-1)  # Too low
    
    def test_validate_view_mode(self):
        """Test view mode validation."""
        # Valid cases
        self.assertEqual(_validate_view_mode("2d"), "2d")
        self.assertEqual(_validate_view_mode("3d"), "3d")
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_view_mode("invalid")
    
    def test_validate_layers(self):
        """Test layers validation."""
        # Valid cases
        layers = [
            {"type": "feature", "url": "https://example.com/service"},
            {"type": "geojson", "data": {"type": "FeatureCollection"}},
            {"type": "graphics"}
        ]
        result = _validate_layers(layers)
        self.assertEqual(len(result), 3)
        
        # Invalid cases
        with self.assertRaises(ValueError):
            _validate_layers("not a list")
        
        with self.assertRaises(ValueError):
            _validate_layers([{"no_type": "field"}])  # Missing type
        
        with self.assertRaises(ValueError):
            _validate_layers([{"type": "invalid"}])  # Invalid type
        
        with self.assertRaises(ValueError):
            _validate_layers([{"type": "feature"}])  # Missing url/portal_item_id


class TestAPIIntegration(unittest.TestCase):
    """Test the main API integration."""
    
    @patch('streamlit_geomap._component_func')
    def test_basic_api_call(self, mock_component):
        """Test basic API call with new parameters."""
        mock_component.return_value = {"status": "success"}
        
        result = st_geomap(
            height=500,
            width="80%",
            basemap="satellite",
            center=[-122.4, 37.8],
            zoom=12
        )
        
        self.assertIsNotNone(result)
        mock_component.assert_called_once()
        
        # Check the call arguments
        args, kwargs = mock_component.call_args
        self.assertEqual(kwargs['height'], "500px")
        self.assertEqual(kwargs['width'], "80%")
        self.assertEqual(kwargs['basemap'], "satellite")
        self.assertEqual(kwargs['center'], [-122.4, 37.8])
        self.assertEqual(kwargs['zoom'], 12.0)
    
    @patch('streamlit_geomap._component_func')
    def test_layers_parameter(self, mock_component):
        """Test new layers parameter."""
        mock_component.return_value = {"status": "success"}
        
        layers = [
            {"type": "feature", "url": "https://example.com/service"},
            {"type": "geojson", "data": {}}
        ]
        
        result = st_geomap(layers=layers)
        
        mock_component.assert_called_once()
        args, kwargs = mock_component.call_args
        self.assertEqual(len(kwargs['layers']), 2)
    
    @patch('streamlit_geomap._component_func')
    def test_backward_compatibility(self, mock_component):
        """Test backward compatibility with feature_layers."""
        mock_component.return_value = {"status": "success"}
        
        feature_layers = [
            {"url": "https://example.com/service", "title": "Test Layer"}
        ]
        
        result = st_geomap(feature_layers=feature_layers)
        
        mock_component.assert_called_once()
        args, kwargs = mock_component.call_args
        
        # Should convert feature_layers to layers format
        self.assertIn('layers', kwargs)
        self.assertEqual(len(kwargs['layers']), 1)
        self.assertEqual(kwargs['layers'][0]['type'], 'feature')
    
    @patch('streamlit.error')
    @patch('streamlit_geomap._component_func')
    def test_invalid_parameters(self, mock_component, mock_error):
        """Test error handling for invalid parameters."""
        # Test invalid height
        result = st_geomap(height=50)  # Too small
        mock_error.assert_called()
        self.assertIsNone(result)
        
        # Reset mock
        mock_error.reset_mock()
        
        # Test invalid basemap
        result = st_geomap(basemap="invalid")
        mock_error.assert_called()
        self.assertIsNone(result)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions."""
    
    def test_boundary_values(self):
        """Test boundary values for validation."""
        # Minimum valid values
        self.assertEqual(_validate_height(100), "100px")
        self.assertEqual(_validate_width(100), "100px")
        self.assertEqual(_validate_zoom(0), 0.0)
        self.assertEqual(_validate_zoom(20), 20.0)
        
        # Boundary coordinates
        self.assertEqual(_validate_center([-180, -90]), [-180.0, -90.0])
        self.assertEqual(_validate_center([180, 90]), [180.0, 90.0])
    
    def test_type_conversions(self):
        """Test type conversions in validation."""
        # Integer to float conversion for zoom
        self.assertEqual(_validate_zoom(10), 10.0)
        self.assertIsInstance(_validate_zoom(10), float)
        
        # List to list conversion for center
        result = _validate_center((-122.4, 37.8))  # Tuple input
        self.assertIsInstance(result, list)
        self.assertEqual(result, [-122.4, 37.8])


def run_tests():
    """Run all tests and return success status."""
    print("🧪 Running Enhanced API Unit Tests")
    print("=" * 60)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestValidationFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestAPIIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("🎉 All tests passed!")
        print("\n✨ Enhanced API Features Validated:")
        print("   - Comprehensive input validation")
        print("   - Proper error handling")
        print("   - Backward compatibility")
        print("   - Type conversions")
        print("   - Boundary conditions")
        return True
    else:
        print("❌ Some tests failed!")
        return False


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)