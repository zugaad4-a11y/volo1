'use client';

import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  workerLat: number | null;
  workerLng: number | null;
  customerLat: number;
  customerLng: number;
  workerName?: string;
  zoom?: number;
}

export default function GoogleMap({
  workerLat,
  workerLng,
  customerLat,
  customerLng,
  workerName = 'Technician',
  zoom = 14,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleKey, setGoogleKey] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map objects (Google)
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Map objects (Leaflet fallback)
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const leafletMapInstanceRef = useRef<any>(null);
  const leafletWorkerMarkerRef = useRef<any>(null);
  const leafletCustomerMarkerRef = useRef<any>(null);
  const leafletPolylineRef = useRef<any>(null);

  // 1. Fetch Maps configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/maps/config');
        const data = await res.json();
        if (data.configured && data.apiKey) {
          setGoogleKey(data.apiKey);
        } else {
          // Fallback to Leaflet immediately if Google is not configured
          loadLeafletFallback();
        }
      } catch (err) {
        console.error('Failed to load map config:', err);
        loadLeafletFallback();
      }
    }
    loadConfig();
  }, []);

  // 2. Load Google Maps script
  useEffect(() => {
    if (!googleKey) return;
    if ((window as any).google && (window as any).google.maps) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => {
        console.warn('Google Maps Script failed to load, falling back to Leaflet.');
        loadLeafletFallback();
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapsLoaded(true));
    }
  }, [googleKey]);

  // Leaflet fallback script loader
  const loadLeafletFallback = () => {
    if (typeof window === 'undefined') return;
    
    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const scriptId = 'leaflet-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      script.onerror = () => setError('Map engine failed to initialize.');
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setLeafletLoaded(true));
    }
  };

  // 3. Initialize/Update Google Map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || typeof window === 'undefined' || !(window as any).google) return;

    const maps = (window as any).google.maps;

    // Create Map Instance if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new maps.Map(mapRef.current, {
        center: { lat: customerLat, lng: customerLng },
        zoom: zoom,
        styles: [
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }],
          },
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }], // Turn off POIs for clean Operations Dashboard view
          },
          {
            featureType: 'road',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'transit',
            stylers: [{ visibility: 'off' }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    const map = mapInstanceRef.current;

    // Update Customer Marker
    if (!customerMarkerRef.current) {
      customerMarkerRef.current = new maps.Marker({
        position: { lat: customerLat, lng: customerLng },
        map,
        title: 'Customer Location',
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#E11D48', // Rose 600
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
      });
    } else {
      customerMarkerRef.current.setPosition({ lat: customerLat, lng: customerLng });
    }

    // Update Worker Marker
    if (workerLat !== null && workerLng !== null) {
      const workerPos = { lat: workerLat, lng: workerLng };
      
      if (!workerMarkerRef.current) {
        workerMarkerRef.current = new maps.Marker({
          position: workerPos,
          map,
          title: workerName,
          label: {
            text: '🚗',
            fontSize: '16px',
          },
        });
      } else {
        workerMarkerRef.current.setPosition(workerPos);
      }

      // Draw direct polyline route path
      if (!polylineRef.current) {
        polylineRef.current = new maps.Polyline({
          path: [workerPos, { lat: customerLat, lng: customerLng }],
          geodesic: true,
          strokeColor: '#2563EB', // Blue 600
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
      } else {
        polylineRef.current.setPath([workerPos, { lat: customerLat, lng: customerLng }]);
      }

      // Fit bounds to show both customer and worker
      const bounds = new maps.LatLngBounds();
      bounds.extend(customerMarkerRef.current.getPosition());
      bounds.extend(workerMarkerRef.current.getPosition());
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else {
      // Remove worker marker and line if not en route
      if (workerMarkerRef.current) {
        workerMarkerRef.current.setMap(null);
        workerMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      map.setCenter({ lat: customerLat, lng: customerLng });
    }
  }, [mapsLoaded, workerLat, workerLng, customerLat, customerLng, zoom, workerName]);

  // 4. Initialize/Update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || mapsLoaded || !mapRef.current || typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;

    if (!leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([customerLat, customerLng], zoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(leafletMapInstanceRef.current);
    }

    const map = leafletMapInstanceRef.current;

    // Custom Customer Pin
    const customerIcon = L.divIcon({
      html: `<div style="background-color: #e11d48; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3)"></div>`,
      className: 'custom-customer-icon',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    if (!leafletCustomerMarkerRef.current) {
      leafletCustomerMarkerRef.current = L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup('Service Destination');
    } else {
      leafletCustomerMarkerRef.current.setLatLng([customerLat, customerLng]);
    }

    // Custom Worker Pin
    if (workerLat !== null && workerLng !== null) {
      const workerIcon = L.divIcon({
        html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🚗</div>`,
        className: 'custom-worker-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (!leafletWorkerMarkerRef.current) {
        leafletWorkerMarkerRef.current = L.marker([workerLat, workerLng], { icon: workerIcon })
          .addTo(map)
          .bindPopup(workerName);
      } else {
        leafletWorkerMarkerRef.current.setLatLng([workerLat, workerLng]);
      }

      // Polyline route
      if (!leafletPolylineRef.current) {
        leafletPolylineRef.current = L.polyline(
          [[workerLat, workerLng], [customerLat, customerLng]],
          { color: '#2563eb', weight: 4, opacity: 0.8 }
        ).addTo(map);
      } else {
        leafletPolylineRef.current.setLatLngs([[workerLat, workerLng], [customerLat, customerLng]]);
      }

      // Adjust viewport bounds
      const bounds = L.latLngBounds([
        [customerLat, customerLng],
        [workerLat, workerLng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      if (leafletWorkerMarkerRef.current) {
        map.removeLayer(leafletWorkerMarkerRef.current);
        leafletWorkerMarkerRef.current = null;
      }
      if (leafletPolylineRef.current) {
        map.removeLayer(leafletPolylineRef.current);
        leafletPolylineRef.current = null;
      }
      map.setView([customerLat, customerLng], zoom);
    }
  }, [leafletLoaded, mapsLoaded, workerLat, workerLng, customerLat, customerLng, zoom, workerName]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      {error && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-xs text-rose-500 font-bold p-4 text-center z-10">
          {error}
        </div>
      )}
      <div ref={mapRef} className="w-full h-full bg-slate-50 min-h-[300px]" />
    </div>
  );
}
