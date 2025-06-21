import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase 
} from "streamlit-component-lib"

interface State {}

/**
 * Streamlit Geomap Component
 * 
 * A custom Streamlit component for rendering interactive geospatial maps
 * using the ArcGIS Maps SDK for JavaScript.
 */
class GeomapComponent extends StreamlitComponentBase<State> {
  private mapRef = React.createRef<HTMLDivElement>()

  public state: State = {}

  public render = (): React.ReactNode => {
    return (
      <div style={{ width: "100%", height: "400px" }}>
        <div 
          ref={this.mapRef}
          style={{ 
            width: "100%", 
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            color: "#666"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>Streamlit Geomap Component</h3>
            <p style={{ margin: 0 }}>
              Interactive geospatial maps with ArcGIS Maps SDK for JavaScript
            </p>
            <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
              Component initialized successfully!
            </p>
          </div>
        </div>
      </div>
    )
  }

  public componentDidMount = (): void => {
    // Initialize the map when component mounts
    this.initializeMap()
  }

  private initializeMap = (): void => {
    // For now, just signal that the component is ready
    // In the future, this is where we'll initialize the ArcGIS map
    console.log("Geomap component mounted and ready for map initialization")
    
    // Set initial component value
    this.props.args.Streamlit.setComponentValue({
      status: "initialized",
      timestamp: new Date().toISOString()
    })
  }
}

export default withStreamlitConnection(GeomapComponent)