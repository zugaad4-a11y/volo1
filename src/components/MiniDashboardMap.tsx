'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MiniDashboardMapProps {
  workerLat: number | null;
  workerLng: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  customerName?: string;
  zoom?: number;
}

export default function MiniDashboardMap({
  workerLat,
  workerLng,
  customerLat = null,
  customerLng = null,
  customerName = 'Client',
  zoom = 14,
}: MiniDashboardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map reference instances
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const radarCircleRef = useRef<any>(null);

  // Load Leaflet Fallback Assets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const scriptId = 'leaflet-dashboard-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      script.onerror = () => setError('Failed to load Map engine.');
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setLeafletLoaded(true));
    }
  }, []);

  // Initialize & Update Map Layer
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;

    // Center coordinates: prefer worker coordinates, fallback to customer coordinates, fallback to default (Bangalore center e.g. 12.9716, 77.5946)
    const centerLat = workerLat ?? customerLat ?? 12.9716;
    const centerLng = workerLng ?? customerLng ?? 77.5946;

    // Create Map Instance if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        touchZoom: true
      }).setView([centerLat, centerLng], zoom);

      // Dark theme tiles CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Define Icons
    const workerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute h-6 w-6 bg-[#0EA5E9]/20 border border-[#0EA5E9]/50 rounded-full animate-ping"></div>
          <div class="h-3 w-3 bg-[#0EA5E9] rounded-full border border-white shadow-md shadow-sky-500/50 relative z-10"></div>
        </div>
      `,
      className: 'custom-worker-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const customerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute h-8 w-8 bg-[#FF7A00]/25 border border-[#FF7A00]/50 rounded-full animate-pulse"></div>
          <div class="h-4.5 w-4.5 bg-[#FF7A00] rounded-xl border-2 border-white flex items-center justify-center shadow-lg shadow-orange-500/40 relative z-10">
            <span class="text-[9px] text-white font-black">📍</span>
          </div>
        </div>
      `,
      className: 'custom-customer-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Check Active Job routing context
    const hasActiveJob = customerLat !== null && customerLng !== null;

    // 1. Manage Worker Marker
    if (workerLat !== null && workerLng !== null) {
      if (!workerMarkerRef.current) {
        workerMarkerRef.current = L.marker([workerLat, workerLng], { icon: workerIcon })
          .addTo(map)
          .bindPopup('Your Location');
      } else {
        workerMarkerRef.current.setLatLng([workerLat, workerLng]);
      }
    } else {
      if (workerMarkerRef.current) {
        map.removeLayer(workerMarkerRef.current);
        workerMarkerRef.current = null;
      }
    }

    // 2. Manage Customer Marker & Route Path
    if (hasActiveJob) {
      // Add/Update Customer Destination Marker
      if (!customerMarkerRef.current) {
        customerMarkerRef.current = L.marker([customerLat, customerLng], { icon: customerIcon })
          .addTo(map)
          .bindPopup(`Client: ${customerName}`);
      } else {
        customerMarkerRef.current.setLatLng([customerLat, customerLng]);
      }

      // Draw routing line if we have both coordinates
      if (workerLat !== null && workerLng !== null) {
        const routePoints = [
          [workerLat, workerLng],
          [customerLat, customerLng]
        ];

        if (!routePolylineRef.current) {
          routePolylineRef.current = L.polyline(routePoints, {
            color: '#FF7A00',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '8, 8', // dashed route line representing driving ETA
            lineCap: 'round'
          }).addTo(map);
        } else {
          routePolylineRef.current.setLatLngs(routePoints);
        }

        // Fit map viewport bounds to show both markers
        const bounds = L.latLngBounds(routePoints);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      } else {
        // Center on customer destination directly
        map.setView([customerLat, customerLng], zoom);
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
          routePolylineRef.current = null;
        }
      }

      // Remove radar circle if active job starts
      if (radarCircleRef.current) {
        map.removeLayer(radarCircleRef.current);
        radarCircleRef.current = null;
      }

    } else {
      // No active job: clear customer destination and route polyline layers
      if (customerMarkerRef.current) {
        map.removeLayer(customerMarkerRef.current);
        customerMarkerRef.current = null;
      }
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }

      // Add a Radar scanning layout overlay around the geolocated worker coordinates
      if (workerLat !== null && workerLng !== null) {
        map.setView([workerLat, workerLng], zoom - 1);
        
        if (!radarCircleRef.current) {
          radarCircleRef.current = L.circle([workerLat, workerLng], {
            radius: 800,
            color: '#0EA5E9',
            fillColor: '#0EA5E9',
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '3, 6'
          }).addTo(map);
        } else {
          radarCircleRef.current.setLatLng([workerLat, workerLng]);
        }
      }
    }

  }, [leafletLoaded, workerLat, workerLng, customerLat, customerLng, customerName, zoom]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/[0.08] shadow-inner bg-[#070B14] group select-none">
      {error && (
        <div className="absolute inset-0 bg-[#0F172A] flex flex-col items-center justify-center text-[11px] text-[#EF4444] font-bold p-6 text-center z-10 gap-2">
          <span>⚠️ {error}</span>
          <span className="text-[9px] font-normal text-slate-500">Check connection or reload dashboard</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[200px] sm:min-h-[250px] relative z-0" />
      
      {/* Radar scanning scan sweep visual indicator overlay when offline/waiting */}
      {!(customerLat && customerLng) && workerLat && workerLng && (
        <div className="absolute top-4 right-4 z-10 bg-[#0F172A]/90 border border-white/[0.08] backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
          <div className="h-2 w-2 rounded-full bg-[#0EA5E9] animate-ping" />
          <span className="text-[9px] font-black tracking-wider uppercase text-sky-400">Scanning Radar...</span>
        </div>
      )}
    </div>
  );
}
