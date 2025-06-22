import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase 
} from "streamlit-component-lib"
import MapView from "@arcgis/core/views/MapView"
import Map from "@arcgis/core/Map"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import FeatureLayer from "@arcgis/core/layers/FeatureLayer"
import Point from "@arcgis/core/geometry/Point"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import esriConfig from "@arcgis/core/config"

interface State {
  mapLoaded?: boolean
  error?: string
  selectedGraphics?: Graphic[]
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

// Interface for FeatureLayer configuration
interface FeatureLayerConfig {
  url?: string
  portal_item_id?: string
  api_key?: string
  oauth_token?: string
  renderer?: any
  label_info?: any
  title?: string
  visible?: boolean
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
  private featureLayers: FeatureLayer[] = []
  private lastHoveredFeature: any = null
  private hoverThrottleTimeout: NodeJS.Timeout | null = null

  public state: State = {
    mapLoaded: false,
    error: undefined,
    selectedGraphics: []
  }

  public render = (): React.ReactNode => {
    const { mapLoaded, error } = this.state
    
    // Get size props from arguments, with defaults
    const height = this.props.args.height || "400px"
    const width = this.props.args.width || "100%"
    
    return (
      <div style={{ width: width, height: height }}>
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
    // Initialize the map when component mounts, but check if Streamlit is ready first
    this.initializeMapSafely()
  }

  public componentDidUpdate = (): void => {
    // Update graphics if GeoJSON data has changed
    const currentGeoJSON = this.props.args.geojson
    const currentFeatureLayers = this.props.args.feature_layers as FeatureLayerConfig[]
    
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
      
      // Handle feature layer updates
      if (currentFeatureLayers && Array.isArray(currentFeatureLayers) && this.mapView && this.mapView.map) {
        // Remove existing feature layers
        this.featureLayers.forEach(layer => {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.remove(layer)
          }
          layer.destroy()
        })
        
        // Create and add new feature layers
        this.featureLayers = this.createFeatureLayers(currentFeatureLayers)
        this.featureLayers.forEach(layer => {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.add(layer)
          }
        })
      }
    }
  }

  public componentWillUnmount = (): void => {
    // Clean up resources to prevent memory leaks and DOM issues
    this.cleanup()
  }

  private cleanup = (): void => {
    try {
      // Clear any pending timeouts
      if (this.hoverThrottleTimeout) {
        clearTimeout(this.hoverThrottleTimeout)
        this.hoverThrottleTimeout = null
      }

      // Clean up feature layers first
      this.featureLayers.forEach(layer => {
        try {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.remove(layer)
          }
          layer.destroy()
        } catch (error) {
          console.error("Error cleaning up feature layer:", error)
        }
      })
      this.featureLayers = []

      // Clean up graphics layer
      if (this.graphicsLayer) {
        try {
          this.graphicsLayer.removeAll()
        } catch (error) {
          console.error("Error cleaning up graphics layer:", error)
        }
        this.graphicsLayer = null
      }

      // Destroy the map view
      if (this.mapView) {
        try {
          this.mapView.destroy()
        } catch (error) {
          console.error("Error destroying map view:", error)
        }
        this.mapView = null
      }

      // Clear hover state
      this.lastHoveredFeature = null

      console.log("Map component cleaned up successfully")
    } catch (error) {
      console.error("Error during map cleanup:", error)
    }
  }

  private createLayersFromConfigs = (layerConfigs: any[]): FeatureLayer[] => {
    const layers: FeatureLayer[] = []
    
    layerConfigs.forEach(config => {
      try {
        if (config.type === 'feature') {
          // Convert to FeatureLayerConfig format and use existing method
          const featureConfig: FeatureLayerConfig = {
            url: config.url,
            portal_item_id: config.portal_item_id,
            api_key: config.api_key,
            oauth_token: config.oauth_token,
            renderer: config.renderer,
            label_info: config.label_info,
            title: config.title,
            visible: config.visible
          }
          
          const featureLayers = this.createFeatureLayers([featureConfig])
          layers.push(...featureLayers)
        }
        // Note: 'geojson' and 'graphics' layer types would be handled here
        // but for now we focus on feature layers to maintain existing functionality
      } catch (error) {
        console.error("Error creating layer:", error, config)
      }
    })
    
    return layers
  }

  private createFeatureLayers = (configs: FeatureLayerConfig[]): FeatureLayer[] => {
    const layers: FeatureLayer[] = []
    
    configs.forEach(config => {
      try {
        // Handle authentication
        if (config.api_key) {
          esriConfig.apiKey = config.api_key
        }
        
        // Create FeatureLayer configuration
        const layerConfig: any = {}
        
        if (config.url) {
          layerConfig.url = config.url
        } else if (config.portal_item_id) {
          layerConfig.portalItem = {
            id: config.portal_item_id
          }
        } else {
          console.warn("FeatureLayer config must include either 'url' or 'portal_item_id'")
          return
        }
        
        // Add optional properties
        if (config.title) {
          layerConfig.title = config.title
        }
        
        if (config.visible !== undefined) {
          layerConfig.visible = config.visible
        }
        
        if (config.renderer) {
          layerConfig.renderer = config.renderer
        }
        
        if (config.label_info) {
          layerConfig.labelingInfo = config.label_info
        }
        
        // Handle OAuth token if provided
        if (config.oauth_token) {
          // Note: OAuth token handling would typically be done at the esriConfig level
          // or through IdentityManager, but for simplicity we'll set it as a custom request header
          layerConfig.customParameters = {
            token: config.oauth_token
          }
        }
        
        const featureLayer = new FeatureLayer(layerConfig)
        layers.push(featureLayer)
        
      } catch (error) {
        console.error("Error creating FeatureLayer:", error, config)
      }
    })
    
    return layers
  }

  private addEventHandlers = (): void => {
    if (!this.mapView) return

    // Handle map click events
    this.mapView.on("click", (event) => {
      this.handleMapClick(event)
    })

    // Handle pointer move for hover effects
    this.mapView.on("pointer-move", (event) => {
      this.handlePointerMove(event)
    })
  }

  private handleMapClick = async (event: any): Promise<void> => {
    if (!this.mapView) return

    try {
      // Get screen point from the event
      const screenPoint = {
        x: event.x,
        y: event.y
      }

      // Convert screen point to map point
      const mapPoint = this.mapView.toMap(screenPoint)

      // Hit test to find graphics at click location
      const response = await this.mapView.hitTest(screenPoint)
      
      let clickedGraphic = null
      let featureData = null

      // Check if we clicked on a graphic
      if (response.results.length > 0) {
        const hitResult = response.results[0]
        if (hitResult.type === "graphic" &&  hitResult.graphic && hitResult.graphic.geometry) {
          clickedGraphic = hitResult.graphic
          featureData = {
            attributes: hitResult.graphic.attributes || {},
            geometry: {
              type: hitResult.graphic.geometry.type,
              coordinates: hitResult.graphic.geometry.type === "point" 
                ? [(hitResult.graphic.geometry as any).longitude, (hitResult.graphic.geometry as any).latitude]
                : null
            }
          }

          // Handle selection
          this.handleFeatureSelection(hitResult.graphic)
        }
      }

      // Send click event data back to Streamlit
      if (this.props.args.Streamlit) {
        this.props.args.Streamlit.setComponentValue({
          event: "map_clicked",
          coordinates: [mapPoint.longitude, mapPoint.latitude],
          screenPoint: screenPoint,
          feature: featureData,
          hasFeature: clickedGraphic !== null,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error("Error handling map click:", error)
    }
  }

  private handlePointerMove = async (event: any): Promise<void> => {
    if (!this.mapView) return

    // Throttle hover events to avoid too much communication
    if (this.hoverThrottleTimeout) {
      clearTimeout(this.hoverThrottleTimeout)
    }

    this.hoverThrottleTimeout = setTimeout(async () => {
      try {
        // Get screen point from the event
        const screenPoint = {
          x: event.x,
          y: event.y
        }

        // Hit test to find graphics at hover location
        const response = await this.mapView!.hitTest(screenPoint)
        
        let hoveredFeature = null

        // Check if we're hovering over a graphic
        if (response.results.length > 0) {
          const hitResult = response.results[0]
          if (hitResult.type === "graphic" && hitResult.graphic && hitResult.graphic.geometry) {
            hoveredFeature = {
              attributes: hitResult.graphic.attributes || {},
              geometry: {
                type: hitResult.graphic.geometry.type,
                coordinates: hitResult.graphic.geometry.type === "point" 
                  ? [(hitResult.graphic.geometry as any).longitude, (hitResult.graphic.geometry as any).latitude]
                  : null
              }
            }

            // Change cursor to pointer when hovering over features
            if (this.mapView && this.mapView.container) {
              this.mapView.container.style.cursor = "pointer"
            }
          }
        } else {
          // Reset cursor when not hovering over features
          if (this.mapView && this.mapView.container) {
            this.mapView.container.style.cursor = "grab"
          }
        }

        // Only send hover events if there's a feature being hovered and it's different from last
        if (hoveredFeature && JSON.stringify(hoveredFeature) !== JSON.stringify(this.lastHoveredFeature)) {
          this.lastHoveredFeature = hoveredFeature
          
          // Check if hover events are enabled
          const enableHover = this.props.args.enable_hover !== false
          if (enableHover && this.props.args.Streamlit) {
            this.props.args.Streamlit.setComponentValue({
              event: "feature_hovered",
              feature: hoveredFeature,
              timestamp: new Date().toISOString()
            })
          }
        } else if (!hoveredFeature && this.lastHoveredFeature) {
          // Clear last hovered feature when no longer hovering
          this.lastHoveredFeature = null
        }

      } catch (error) {
        // Silently handle hover errors to avoid console spam
      }
    }, 100) // Throttle to 100ms
  }

  private handleFeatureSelection = (graphic: Graphic): void => {
    if (!this.mapView) return

    // Get current interactive settings
    const enableSelection = this.props.args.enable_selection !== false

    if (!enableSelection) return

    // Toggle selection state
    let newSelectedGraphics = [...(this.state.selectedGraphics || [])]
    
    const isAlreadySelected = newSelectedGraphics.some(g => g === graphic)
    
    if (isAlreadySelected) {
      // Deselect
      newSelectedGraphics = newSelectedGraphics.filter(g => g !== graphic)
      this.removeSelectionHighlight(graphic)
    } else {
      // Select
      newSelectedGraphics.push(graphic)
      this.addSelectionHighlight(graphic)
    }

    // Update state
    this.setState({ selectedGraphics: newSelectedGraphics })

    // Send selection event data back to Streamlit
    if (this.props.args.Streamlit) {
      this.props.args.Streamlit.setComponentValue({
        event: "feature_selected",
        selectedFeatures: newSelectedGraphics.map(g => ({
          attributes: g.attributes || {},
          geometry: g.geometry ? {
            type: g.geometry.type,
            coordinates: g.geometry.type === "point" 
              ? [(g.geometry as any).longitude, (g.geometry as any).latitude]
              : null
          } : null
        })),
        selectionCount: newSelectedGraphics.length,
        timestamp: new Date().toISOString()
      })
    }
  }

  private addSelectionHighlight = (graphic: Graphic): void => {
    if (!graphic.symbol) return

    // Create a highlight symbol based on the original
    const originalSymbol = graphic.symbol as SimpleMarkerSymbol
    const highlightSymbol = originalSymbol.clone()
    
    // Make it larger and add a bright outline
    highlightSymbol.size = (originalSymbol.size || 8) + 4
    highlightSymbol.outline = {
      color: [255, 255, 0, 1], // Yellow outline
      width: 3
    } as any

    // Store original symbol for restoration
    (graphic as any).__originalSymbol = originalSymbol
    graphic.symbol = highlightSymbol
  }

  private removeSelectionHighlight = (graphic: Graphic): void => {
    // Restore original symbol
    const originalSymbol = (graphic as any).__originalSymbol
    if (originalSymbol) {
      graphic.symbol = originalSymbol
      delete (graphic as any).__originalSymbol
    }
  }

  private initializeMapSafely = (retries: number = 0): void => {
    const maxRetries = 50 // Maximum 5 seconds of retries (50 * 100ms)
    
    // Check if Streamlit connection is ready
    if (!this.props.args || !this.props.args.Streamlit) {
      if (retries < maxRetries) {
        console.log(`Streamlit connection not ready, retrying in 100ms... (${retries + 1}/${maxRetries})`)
        setTimeout(() => this.initializeMapSafely(retries + 1), 100)
        return
      } else {
        // Max retries reached, show error
        console.error("Streamlit connection failed after maximum retries")
        this.setState({ error: "Failed to connect to Streamlit. Please refresh the page." })
        return
      }
    }
    
    // Streamlit is ready, proceed with map initialization
    this.initializeMap()
  }

  private initializeMap = async (): Promise<void> => {
    if (!this.mapRef.current) {
      this.setState({ error: "Map container not found" })
      return
    }

    try {
      // Create a graphics layer for GeoJSON features
      this.graphicsLayer = new GraphicsLayer()

      // Get configuration from props
      const basemap = this.props.args.basemap || "topo-vector"
      const center = this.props.args.center || [-118.244, 34.052] // Default: Los Angeles coordinates
      const zoom = this.props.args.zoom || 12
      // Note: viewMode (2d/3d) support would require SceneView for 3D - keeping as 2D for now
      
      // Handle layers - support both new 'layers' and legacy 'feature_layers' 
      let allFeatureLayers: FeatureLayer[] = []
      
      // New layers prop takes precedence
      if (this.props.args.layers && Array.isArray(this.props.args.layers)) {
        const layerConfigs = this.props.args.layers
        allFeatureLayers = this.createLayersFromConfigs(layerConfigs)
      } 
      // Fallback to legacy feature_layers for backward compatibility
      else if (this.props.args.feature_layers && Array.isArray(this.props.args.feature_layers)) {
        const featureLayerConfigs = this.props.args.feature_layers as FeatureLayerConfig[]
        allFeatureLayers = this.createFeatureLayers(featureLayerConfigs)
      }
      
      this.featureLayers = allFeatureLayers

      // Create a Map instance with configurable basemap
      const allLayers = [this.graphicsLayer, ...this.featureLayers]
      const map = new Map({
        basemap: basemap,
        layers: allLayers
      })

      // Get GeoJSON data from props
      const geojson = this.props.args.geojson as GeoJSONFeatureCollection

      // Create a MapView instance with configurable properties
      this.mapView = new MapView({
        container: this.mapRef.current,
        map: map,
        center: center,
        zoom: zoom
      })

      // Wait for the view to load
      await this.mapView.when()

      // Add interactive event handlers
      this.addEventHandlers()

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
      if (this.props.args.Streamlit) {
        this.props.args.Streamlit.setComponentValue({
          status: "map_loaded",
          basemap: basemap,
          center: [this.mapView.center.longitude, this.mapView.center.latitude],
          zoom: this.mapView.zoom,
          featuresRendered: geojson?.features?.length || 0,
          featureLayersLoaded: this.featureLayers.length,
          timestamp: new Date().toISOString()
        })
      }

      console.log("ArcGIS map initialized successfully")
    } catch (error) {
      console.error("Error initializing ArcGIS map:", error)
      this.setState({ 
        error: `Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      
      // Set component value to indicate error
      if (this.props.args.Streamlit) {
        this.props.args.Streamlit.setComponentValue({
          status: "error",
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
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