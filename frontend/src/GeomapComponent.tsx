import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase 
} from "streamlit-component-lib"
import MapView from "@arcgis/core/views/MapView"
import Map from "@arcgis/core/Map"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import Point from "@arcgis/core/geometry/Point"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"

interface State {
  mapLoaded?: boolean
  error?: string
}

// Interface for GeoJSON Feature
interface GeoJSONFeature {
  type: string
  geometry: {
    type: string
    coordinates: number[]
  }
  properties?: Record<string, any>
}

// Interface for GeoJSON FeatureCollection
interface GeoJSONFeatureCollection {
  type: string
  features: GeoJSONFeature[]
}

/**
 * Streamlit Geomap Component
 * 
 * A custom Streamlit component for rendering interactive geospatial maps
 * using the ArcGIS Maps SDK for JavaScript.
 */
class GeomapComponent extends StreamlitComponentBase<State> {
  private mapRef = React.createRef<HTMLDivElement>()
  private mapView: MapView | null = null
  private graphicsLayer: GraphicsLayer | null = null

  public state: State = {
    mapLoaded: false,
    error: undefined
  }

  public render = (): React.ReactNode => {
    const { mapLoaded, error } = this.state
    
    return (
      <div style={{ width: "100%", height: "400px" }}>
        <div 
          ref={this.mapRef}
          style={{ 
            width: "100%", 
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5"
          }}
        >
          {!mapLoaded && !error && (
            <div style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#666"
            }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 10px 0" }}>Loading Map...</h3>
                <p style={{ margin: 0 }}>
                  Initializing ArcGIS Maps SDK
                </p>
              </div>
            </div>
          )}
          {error && (
            <div style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#d32f2f"
            }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 10px 0" }}>Map Error</h3>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  public componentDidMount = (): void => {
    // Initialize the map when component mounts
    this.initializeMap()
  }

  public componentDidUpdate = (): void => {
    // Update graphics if GeoJSON data has changed
    const currentGeoJSON = this.props.args.geojson
    
    if (this.mapView && this.graphicsLayer) {
      // Clear existing graphics
      this.graphicsLayer.removeAll()
      
      // Add new graphics if GeoJSON is provided
      if (currentGeoJSON && currentGeoJSON.features && currentGeoJSON.features.length > 0) {
        const graphics = this.processGeoJSON(currentGeoJSON as GeoJSONFeatureCollection)
        this.graphicsLayer.addMany(graphics)
        
        // Auto-center and zoom to show all features
        if (graphics.length > 0) {
          this.mapView.goTo(graphics)
        }
      }
    }
  }

  public componentWillUnmount = (): void => {
    // Clean up the map view when component unmounts
    if (this.mapView) {
      this.mapView.destroy()
      this.mapView = null
    }
    if (this.graphicsLayer) {
      this.graphicsLayer = null
    }
  }

  private initializeMap = async (): Promise<void> => {
    if (!this.mapRef.current) {
      this.setState({ error: "Map container not found" })
      return
    }

    try {
      // Create a graphics layer for GeoJSON features
      this.graphicsLayer = new GraphicsLayer()

      // Create a Map instance with a basemap
      const map = new Map({
        basemap: "topo-vector", // Topographic basemap
        layers: [this.graphicsLayer]
      })

      // Get GeoJSON data from props
      const geojson = this.props.args.geojson as GeoJSONFeatureCollection

      // Default center and zoom
      let center: number[] = [-118.244, 34.052] // Los Angeles coordinates
      let zoom = 12

      // Create a MapView instance
      this.mapView = new MapView({
        container: this.mapRef.current,
        map: map,
        center: center,
        zoom: zoom
      })

      // Wait for the view to load
      await this.mapView.when()

      // Process GeoJSON data if provided
      if (geojson && geojson.features && geojson.features.length > 0) {
        const graphics = this.processGeoJSON(geojson)
        this.graphicsLayer.addMany(graphics)
        
        // Auto-center and zoom to show all features
        if (graphics.length > 0) {
          await this.mapView.goTo(graphics)
        }
      }
      
      this.setState({ mapLoaded: true })
      
      // Set component value to indicate successful initialization
      this.props.args.Streamlit.setComponentValue({
        status: "map_loaded",
        basemap: "topo-vector",
        center: [this.mapView.center.longitude, this.mapView.center.latitude],
        zoom: this.mapView.zoom,
        featuresRendered: geojson?.features?.length || 0,
        timestamp: new Date().toISOString()
      })

      console.log("ArcGIS map initialized successfully")
    } catch (error) {
      console.error("Error initializing ArcGIS map:", error)
      this.setState({ 
        error: `Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      
      // Set component value to indicate error
      this.props.args.Streamlit.setComponentValue({
        status: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }

  private processGeoJSON = (geojson: GeoJSONFeatureCollection): Graphic[] => {
    const graphics: Graphic[] = []

    geojson.features.forEach((feature) => {
      if (feature.geometry.type === "Point") {
        const [longitude, latitude] = feature.geometry.coordinates
        
        // Create a point geometry
        const point = new Point({
          longitude,
          latitude
        })

        // Create a simple marker symbol
        const symbol = new SimpleMarkerSymbol({
          color: [226, 119, 40], // Orange color
          outline: {
            color: [255, 255, 255],
            width: 2
          },
          size: 8
        })

        // Create the graphic
        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: feature.properties || {}
        })

        graphics.push(graphic)
      }
    })

    return graphics
  }
}

export default withStreamlitConnection(GeomapComponent)