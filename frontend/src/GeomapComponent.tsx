import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase 
} from "streamlit-component-lib"
import MapView from "@arcgis/core/views/MapView"
import Map from "@arcgis/core/Map"

interface State {
  mapLoaded?: boolean
  error?: string
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

  public componentWillUnmount = (): void => {
    // Clean up the map view when component unmounts
    if (this.mapView) {
      this.mapView.destroy()
      this.mapView = null
    }
  }

  private initializeMap = async (): Promise<void> => {
    if (!this.mapRef.current) {
      this.setState({ error: "Map container not found" })
      return
    }

    try {
      // Create a Map instance with a basemap
      const map = new Map({
        basemap: "topo-vector" // Topographic basemap
      })

      // Create a MapView instance
      this.mapView = new MapView({
        container: this.mapRef.current,
        map: map,
        center: [-118.244, 34.052], // Los Angeles coordinates
        zoom: 12
      })

      // Wait for the view to load
      await this.mapView.when()
      
      this.setState({ mapLoaded: true })
      
      // Set component value to indicate successful initialization
      this.props.args.Streamlit.setComponentValue({
        status: "map_loaded",
        basemap: "topo-vector",
        center: [-118.244, 34.052],
        zoom: 12,
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
}

export default withStreamlitConnection(GeomapComponent)