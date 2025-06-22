import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase,
  Streamlit
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
 * 
 * IMPORTANT: This component calls Streamlit.setFrameHeight() to ensure
 * the iframe has the correct height. Without this, the iframe defaults
 * to height=0 and the component is invisible. This fixes issue #33.
 */
class GeomapComponent extends StreamlitComponentBase<State> {
  private mapRef = React.createRef<HTMLDivElement>()
  private mapView: MapView | null = null
  private graphicsLayer: GraphicsLayer | null = null
  private featureLayers: FeatureLayer[] = []
  private lastHoveredFeature: any = null
  private hoverThrottleTimeout: NodeJS.Timeout | null = null
  private isUnmounted: boolean = false
  private domObserver: MutationObserver | null = null
  private lastHeight: string | undefined = undefined

  public state: State = {
    mapLoaded: true, // This is a quick fix, because whenever we modify the state during initialization, it causes a re-render
    // we need to set it to true so that the component does not show the loading state
    // since then we receive comonent errors because the re-render does some removeChild calls!
    // we need a singleton approach to avoid this
    error: undefined,
    selectedGraphics: []
  }

  public render = (): React.ReactNode => {
    const { mapLoaded, error } = this.state
    
    // Get size props from arguments, with defaults
    const height = this.props.args.height || "400px"
    const width = this.props.args.width || "100%"
    
    return (
      console.log("🗺️ RENDER: Rendering GeomapComponent with height:", height, "and width:", width),
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

  public componentDidMount = async (): Promise<void> => {
    // Set up DOM mutation observer to catch unexpected DOM changes
    //this.setupDOMObserver()

    // Initialize the map when component mounts
    await this.initializeSimpleMap()

    // Set the iframe height for Streamlit and track current height
    this.lastHeight = this.props.args.height || "400px"
    this.setStreamlitFrameHeight()

    // Signal to Streamlit that the component is ready
    Streamlit.setComponentReady()
  }

  public componentDidUpdate = (): void => {
    // Check if height has changed and update frame height
    const currentHeight = this.props.args.height || "400px"
    if (this.lastHeight !== currentHeight) {
      this.lastHeight = currentHeight
      this.setStreamlitFrameHeight()
    }

    // Update the basemap if it has changed
    const currentBasemap = this.props.args.basemap || "topo-vector"
    if (this.mapView && this.mapView.map && this.mapView.map.basemap !== currentBasemap) {
      this.mapView.map.basemap = currentBasemap
    }

    // Update center and zoom if they have changed
    const currentCenter = this.props.args.center || [-118.244, 34.052] // Default: Los Angeles coordinates
    const currentZoom = this.props.args.zoom || 12
    if (this.mapView) {
      if (this.mapView.center.longitude !== currentCenter[0] || this.mapView.center.latitude !== currentCenter[1]) {
        this.mapView.center = new Point({
          longitude: currentCenter[0],
          latitude: currentCenter[1]
        })
      }
      if (this.mapView.zoom !== currentZoom) {
        this.mapView.zoom = currentZoom
      }
    }

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
          // Ensure mapView is ready before calling goTo to avoid "Animation Manager is undefined" error
          this.mapView.when(() => {
            this.mapView?.goTo(graphics).catch((error) => {
              console.warn("Failed to auto-center map:", error)
            })
          })
        }
      }
      
      // Handle feature layer updates
      if (currentFeatureLayers && Array.isArray(currentFeatureLayers) && this.mapView && this.mapView.map) {
        
        // Remove existing feature layers
        this.featureLayers.forEach((layer, index) => {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.remove(layer)
          }
          layer.destroy()
        })
        
        // Create and add new feature layers
        this.featureLayers = this.createFeatureLayers(currentFeatureLayers)
        this.featureLayers.forEach((layer, index) => {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.add(layer)
          }
        })
      }
    }
  }

  public componentWillUnmount = (): void => {
    // Set unmount flag to prevent further initialization
    this.isUnmounted = true
    
    // Add a small delay to ensure any pending operations complete
    // before starting cleanup - this helps prevent race conditions
    setTimeout(() => {
      this.cleanup()
    }, 0)
  }

  /**
   * Extracts numeric height value from height prop and sets the Streamlit frame height
   */
  private setStreamlitFrameHeight = (): void => {
    const height = this.props.args.height || "400px"
    const numericHeight = this.extractNumericHeight(height)
    
    console.log("🖼️ FRAME HEIGHT: Setting Streamlit frame height to:", numericHeight, "from prop:", height)
    Streamlit.setFrameHeight(numericHeight)
  }

  /**
   * Extracts numeric value from height string (removes 'px' suffix if present)
   */
  private extractNumericHeight = (height: string | number): number => {
    if (typeof height === 'number') {
      return height
    }
    
    if (typeof height === 'string') {
      // Remove 'px' suffix if present and convert to number
      const numericValue = height.endsWith('px') 
        ? parseInt(height.slice(0, -2), 10) 
        : parseInt(height, 10)
      
      // Return parsed value if valid, otherwise default to 400
      return !isNaN(numericValue) && numericValue > 0 ? numericValue : 400
    }
    
    // Default fallback
    return 400
  }

  private cleanup = (): void => {
    try {
      // Clear any pending timeouts
      if (this.hoverThrottleTimeout) {
        clearTimeout(this.hoverThrottleTimeout)
        this.hoverThrottleTimeout = null
      }

      // Stop DOM observer
      if (this.domObserver) {
        this.domObserver.disconnect()
        this.domObserver = null
      }

      // Step 1: Remove event handlers first to prevent further DOM manipulation
      if (this.mapView && !this.mapView.destroyed) {
        try {
          // Remove all event handlers to prevent them from firing during cleanup
          this.mapView.removeHandles()
        } catch (error) {
          // Ignore errors during event handler removal
        }
      }

      // Step 2: Clean up graphics layer before destroying MapView
      if (this.graphicsLayer) {
        try {
          // Clear all graphics first
          if (typeof this.graphicsLayer.removeAll === 'function') {
            this.graphicsLayer.removeAll()
          }
          // Remove graphics layer from map if it's still attached
          if (this.mapView && this.mapView.map && !this.mapView.destroyed) {
            if (this.mapView.map.layers.includes(this.graphicsLayer)) {
              this.mapView.map.remove(this.graphicsLayer)
            }
          }
          // Destroy the graphics layer if it has a destroy method
          if (typeof this.graphicsLayer.destroy === 'function') {
            this.graphicsLayer.destroy()
          }
        } catch (error) {
          console.log("⚠️ GRAPHICS LAYER: Error during cleanup:", error)
        }
        this.graphicsLayer = null
      }

      // Step 3: Clean up feature layers before destroying MapView
      this.featureLayers.forEach((layer, index) => {
        try {
          // Remove layer from map first if it's still attached
          if (this.mapView && this.mapView.map && !this.mapView.destroyed && layer) {
            if (this.mapView.map.layers.includes(layer)) {
              this.mapView.map.remove(layer)
            }
          }
          // Destroy layer if it exists and has a destroy method
          if (layer && typeof layer.destroy === 'function') {
            layer.destroy()
          }
        } catch (error) {
          console.log(`⚠️ FEATURE LAYER ${index}: Error during cleanup:`, error)
        }
      })
      this.featureLayers = []

      // Step 4: Destroy the MapView BEFORE DOM container cleanup
      if (this.mapView) {
        try {
          // Check if the MapView is already destroyed to prevent double-destruction
          if (!this.mapView.destroyed && typeof this.mapView.destroy === 'function') {
            // CRITICAL: This must happen while the DOM container still exists
            this.mapView.destroy()
          }
        } catch (error) {
          // Silently handle MapView destruction errors to prevent DOM exceptions
        }
        this.mapView = null
      }

      // Step 5: Only clear DOM container if it still exists and is connected
      if (this.mapRef.current) {
        try {
          // Check if the container is still connected to the DOM
          if (this.mapRef.current.isConnected) {
            // Use a more gentle approach to clear the container
            let childIndex = 0
            while (this.mapRef.current.firstChild) {
              try {
                const child = this.mapRef.current.firstChild               
                if (this.mapRef.current.contains(child)) {
                  this.mapRef.current.removeChild(child);
                }
                
                childIndex++
                
                // Safety break to prevent infinite loops
                if (childIndex > 100) {
                  break
                }
              } catch (domError) {
                // If removeChild fails, break the loop to prevent infinite attempts
                const errorMsg = domError instanceof Error ? domError.message : String(domError)
                console.log("⚠️ DOM CLEANUP: Child removal error:", errorMsg)
                console.log("⚠️ DOM CLEANUP: Error type:", domError?.constructor?.name)
                console.log("⚠️ DOM CLEANUP: Full error object:", domError)
                console.log("🚨 DOM CLEANUP: Breaking due to removeChild error")
                break
              }
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.log("⚠️ DOM CLEANUP: Container cleanup error:", errorMsg)
          console.log("⚠️ DOM CLEANUP: Error type:", error?.constructor?.name)
          console.log("⚠️ DOM CLEANUP: Full error object:", error)
        }
      }

      // Clear hover state
      this.lastHoveredFeature = null
    } catch (error) {
      // Log the error but don't throw it to prevent React from showing error boundaries
      console.log("❌ CLEANUP: Cleanup completed with errors:", error)
      console.log("❌ CLEANUP: Error type:", error?.constructor?.name)
      console.log("❌ CLEANUP: Full error object:", error)
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
    if (!this.mapView) {
      return
    }

    // Handle map click events
    this.mapView.on("click", (event) => {
      this.handleMapClick(event)
    })

    // Handle pointer move for hover effects
    this.mapView.on("pointer-move", (event) => {
      // Don't log every pointer move as it's too verbose
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
      Streamlit.setComponentValue({
          event: "map_clicked",
          coordinates: [mapPoint.longitude, mapPoint.latitude],
          screenPoint: screenPoint,
          feature: featureData,
          hasFeature: clickedGraphic !== null,
          timestamp: new Date().toISOString()
        })

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
          if (enableHover) {
            Streamlit.setComponentValue({
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
    Streamlit.setComponentValue({
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

  private setupDOMObserver = (): void => {
    if (!this.mapRef.current) {
      console.log("⚠️ DOM OBSERVER: Cannot setup observer - mapRef.current is null")
      return
    }

    this.domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          if (mutation.removedNodes.length > 0) {
            console.log("🚨 DOM OBSERVER: Child nodes removed from map container!")
            console.log("🔍 DOM OBSERVER: Removed nodes:", Array.from(mutation.removedNodes).map(node => ({
              nodeName: node.nodeName,
              nodeType: node.nodeType,
              className: (node as any).className || '(no class)',
              id: (node as any).id || '(no id)',
              isConnected: node.isConnected,
              parentNode: !!node.parentNode
            })))
            console.log("🔍 DOM OBSERVER: Target:", mutation.target)
            console.log("🔍 DOM OBSERVER: Stack trace:")
            console.trace("DOM removal stack trace")
          }
          if (mutation.addedNodes.length > 0) {
            console.log("➕ DOM OBSERVER: Child nodes added to map container")
            console.log("🔍 DOM OBSERVER: Added nodes:", Array.from(mutation.addedNodes).map(node => ({
              nodeName: node.nodeName,
              nodeType: node.nodeType,
              className: (node as any).className || '(no class)',
              id: (node as any).id || '(no id)'
            })))
          }
        }
        if (mutation.type === 'attributes') {
          console.log("📝 DOM OBSERVER: Attribute change on map container:", mutation.attributeName, mutation.oldValue)
        }
      })
    })

    this.domObserver.observe(this.mapRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    })
  }



  /**
   * Initializes a simple map using the configuration provided via component props.
   *
   * - Retrieves the basemap, center coordinates, and zoom level from `this.props.args`.
   * - Applies default values if any configuration is missing:
   *   - `basemap`: "topo-vector"
   *   - `center`: [-118.244, 34.052] (Los Angeles coordinates)
   *   - `zoom`: 12
   * - Logs the configuration to the console for debugging.
   * - Creates a new `Map` instance with the specified basemap.
   * - Instantiates a `MapView` and attaches it to the referenced container element.
   *
   * @private
   */
  private initializeSimpleMap = async (): Promise<void> => {
      // Get configuration from props
      const basemap = this.props.args.basemap || "topo-vector"
      const center = this.props.args.center || [-118.244, 34.052] // Default: Los Angeles coordinates
      const zoom = this.props.args.zoom || 12

      // Create a Map instance with configurable basemap
      const map = new Map({
        basemap: basemap
      })

      this.mapView = new MapView({
        container: this.mapRef.current,
        map: map,
        center: center,
        zoom: zoom
      })

      // Wait for the view to load
      await this.mapView.when()

      // Map is now initialized, define state to indicate readiness
      // setState would trigger a component re-render
      // we need to avoid that during initialization
      //this.state.mapLoaded = true

      // Set component value to indicate successful initialization
      Streamlit.setComponentValue({
        event: "map_loaded",
        basemap: basemap,
        center: [this.mapView.center.longitude, this.mapView.center.latitude],
        zoom: this.mapView.zoom,
        //featuresRendered: geojson?.features?.length || 0,
        featuresRendered: 0,
        featureLayersLoaded: this.featureLayers.length,
        timestamp: new Date().toISOString()
      })
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