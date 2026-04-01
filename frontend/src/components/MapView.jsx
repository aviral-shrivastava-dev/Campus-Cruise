import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom car icon for driver location
const carIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMDA3OGQ0Ij48cGF0aCBkPSJNMTguOTIgNi4wMUMxOC43MiA1LjQyIDE4LjE2IDUgMTcuNSA1aC0xMWMtLjY2IDAtMS4yMS40Mi0xLjQyIDEuMDFMMyAxMnY4YzAgLjU1LjQ1IDEgMSAxaDFjLjU1IDAgMS0uNDUgMS0xdi0xaDEydjFjMCAuNTUuNDUgMSAxIDFoMWMuNTUgMCAxLS40NSAxLTF2LThsLTIuMDgtNi45OXpNNi41IDE2Yy0uODMgMC0xLjUtLjY3LTEuNS0xLjVTNS42NyAxMyA2LjUgMTNzMS41LjY3IDEuNSAxLjUtLjY3IDEuNS0xLjUgMS41em0xMSAwYy0uODMgMC0xLjUtLjY3LTEuNS0xLjVzLjY3LTEuNSAxLjUtMS41IDEuNS42NyAxLjUgMS41LS42NyAxLjUtMS41IDEuNXpNNSAxMWwyLTYuNWgxMEwxOSAxMUg1eiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Component to update map center when location changes
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

function MapView({ 
  driverLocation, 
  driverName = 'Driver',
  height = '400px',
  showControls = true 
}) {
  const mapRef = useRef(null);
  
  // Default center (will be updated when driver location is available)
  const defaultCenter = [37.7749, -122.4194]; // San Francisco as default
  const center = driverLocation 
    ? [driverLocation.latitude, driverLocation.longitude] 
    : defaultCenter;

  return (
    <div className="map-view-container" style={{ height }}>
      {!driverLocation && (
        <div className="map-placeholder">
          <div className="map-placeholder-content">
            <span className="map-placeholder-icon">📍</span>
            <p>Waiting for driver location...</p>
            <p className="map-placeholder-hint">
              Location tracking will begin when the ride starts
            </p>
          </div>
        </div>
      )}
      
      {driverLocation && (
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={showControls}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater center={center} />
          
          <Marker position={center} icon={carIcon}>
            <Popup>
              <div className="map-popup">
                <strong>{driverName}</strong>
                <br />
                <small>Current Location</small>
                {driverLocation.timestamp && (
                  <>
                    <br />
                    <small>
                      Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                    </small>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
}

export default MapView;
