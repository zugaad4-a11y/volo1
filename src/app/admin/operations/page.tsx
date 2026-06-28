'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Users, Map, Shield, Percent, Clock, MapPin, 
  Plus, Loader2, AlertCircle, RefreshCw, Layers, BarChart3, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell 
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ActiveBooking {
  id: string;
  status: string;
  address_line: string;
  lat: number;
  lng: number;
  worker_id: string | null;
  customer_id: string;
  total_amount: number;
  scheduled_at: string;
  service_items?: { name: string };
  workers?: { users?: { full_name: string } };
}

interface WorkerLocation {
  id: string;
  status: string;
  rating: number;
  users: { full_name: string; phone: string };
  worker_live_locations: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    updated_at: string;
  } | null;
}

interface ServiceZone {
  id: string;
  city_name: string;
  zone_name: string;
  radius_km: number;
  active: boolean;
}

export default function AdminOperationsDashboard() {
  const { data, error, isLoading } = useSWR('/api/admin/operations', fetcher, {
    refreshInterval: 15000 // Poll every 15 seconds
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'live' | 'zones' | 'analytics'>('live');
  const [syncing, setSyncing] = useState(false);

  // New service zone form states
  const [cityName, setCityName] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [radiusKm, setRadiusKm] = useState('10');
  const [zoneSaving, setZoneSaving] = useState(false);
  const [zoneSuccess, setZoneSuccess] = useState('');
  const [zoneError, setZoneError] = useState('');

  // Map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [googleKey, setGoogleKey] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // References to active map object & markers
  const googleMapInstanceRef = useRef<any>(null);
  const googleMarkersRef = useRef<any[]>([]);
  const leafletMapInstanceRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);

  // 1. Fetch Maps API Key
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/maps/config');
        const config = await res.json();
        if (config.configured && config.apiKey) {
          setGoogleKey(config.apiKey);
        } else {
          loadLeafletFallback();
        }
      } catch {
        loadLeafletFallback();
      }
    }
    loadConfig();
  }, []);

  // 2. Load Google Maps Script
  useEffect(() => {
    if (!googleKey) return;
    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-admin-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => loadLeafletFallback();
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapsLoaded(true));
    }
  }, [googleKey]);

  // Leaflet script fallback loader
  const loadLeafletFallback = () => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const scriptId = 'leaflet-admin-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setLeafletLoaded(true));
    }
  };

  // 3. Render/Update Map Markers
  useEffect(() => {
    if (activeTab !== 'live' || !data) return;

    const bookings: ActiveBooking[] = data.activeBookings || [];
    const online: WorkerLocation[] = data.onlineWorkers || [];
    const enRoute: WorkerLocation[] = data.enRouteWorkers || [];
    const onJob: WorkerLocation[] = data.onJobWorkers || [];
    const allWorkers = [...online, ...enRoute, ...onJob];

    let centerLat = 12.9716; // fallback
    let centerLng = 77.5946;

    if (bookings.length > 0) {
      centerLat = bookings[0].lat || centerLat;
      centerLng = bookings[0].lng || centerLng;
    } else if (allWorkers.length > 0) {
      centerLat = allWorkers[0].worker_live_locations?.latitude || centerLat;
      centerLng = allWorkers[0].worker_live_locations?.longitude || centerLng;
    }

    // Google Maps Render Loop
    if (mapsLoaded && mapContainerRef.current && (window as any).google?.maps) {
      const maps = (window as any).google.maps;

      if (!googleMapInstanceRef.current) {
        googleMapInstanceRef.current = new maps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
        });
      }

      const map = googleMapInstanceRef.current;

      // Clear existing Google markers
      googleMarkersRef.current.forEach(m => m.setMap(null));
      googleMarkersRef.current = [];

      // Render Customer Destinations
      bookings.forEach(b => {
        const marker = new maps.Marker({
          position: { lat: Number(b.lat), lng: Number(b.lng) },
          map,
          title: `Booking for ${b.service_items?.name || 'Home Service'}`,
          icon: {
            path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: '#E11D48', // Customer: Rose red
            fillOpacity: 1,
            strokeWeight: 1.5,
            strokeColor: '#FFFFFF',
          },
        });
        
        const info = new maps.InfoWindow({
          content: `<div style="color:black; font-size:11px; font-family:sans-serif; padding:2px">
            <strong>Booking ID:</strong> ${b.id.substring(0,8)}<br/>
            <strong>Service:</strong> ${b.service_items?.name || 'Home Service'}<br/>
            <strong>Status:</strong> ${b.status}
          </div>`
        });

        marker.addListener('click', () => info.open(map, marker));
        googleMarkersRef.current.push(marker);
      });

      // Render Active Worker Locations
      allWorkers.forEach(w => {
        if (!w.worker_live_locations) return;
        const pos = { 
          lat: Number(w.worker_live_locations.latitude), 
          lng: Number(w.worker_live_locations.longitude) 
        };

        const markerColor = w.status === 'ONLINE' ? '#10B981' : '#3B82F6'; // Online: Emerald, EnRoute/OnJob: Blue
        const marker = new maps.Marker({
          position: pos,
          map,
          title: w.users.full_name,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
          },
        });

        const info = new maps.InfoWindow({
          content: `<div style="color:black; font-size:11px; font-family:sans-serif; padding:2px">
            <strong>Worker:</strong> ${w.users.full_name}<br/>
            <strong>Status:</strong> ${w.status}<br/>
            <strong>Battery/GPS accuracy:</strong> ${w.worker_live_locations.accuracy}m
          </div>`
        });

        marker.addListener('click', () => info.open(map, marker));
        googleMarkersRef.current.push(marker);
      });

      return;
    }

    // Leaflet Maps Fallback Render Loop
    if (leafletLoaded && !mapsLoaded && mapContainerRef.current && (window as any).L) {
      const L = (window as any).L;

      if (!leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView([centerLat, centerLng], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(
          leafletMapInstanceRef.current
        );
      }

      const map = leafletMapInstanceRef.current;

      // Clear existing Leaflet markers
      leafletMarkersRef.current.forEach(m => map.removeLayer(m));
      leafletMarkersRef.current = [];

      // Add customer markers
      bookings.forEach(b => {
        const customerIcon = L.divIcon({
          html: `<div style="background-color:#e11d48; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.3)"></div>`,
          className: 'leaflet-customer-pin',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const marker = L.marker([b.lat, b.lng], { icon: customerIcon })
          .addTo(map)
          .bindPopup(`<b>Booking ${b.id.substring(0,8)}</b><br/>${b.service_items?.name}<br/>Status: ${b.status}`);

        leafletMarkersRef.current.push(marker);
      });

      // Add worker markers
      allWorkers.forEach(w => {
        if (!w.worker_live_locations) return;
        const color = w.status === 'ONLINE' ? '#10b981' : '#3b82f6';
        const workerIcon = L.divIcon({
          html: `<div style="background-color:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.3)"></div>`,
          className: 'leaflet-worker-pin',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const marker = L.marker(
          [w.worker_live_locations.latitude, w.worker_live_locations.longitude],
          { icon: workerIcon }
        )
          .addTo(map)
          .bindPopup(`<b>Worker: ${w.users.full_name}</b><br/>Status: ${w.status}`);

        leafletMarkersRef.current.push(marker);
      });
    }
  }, [activeTab, mapsLoaded, leafletLoaded, data]);

  const handleRefresh = async () => {
    setSyncing(true);
    await mutate('/api/admin/operations');
    setSyncing(false);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName || !zoneName || !radiusKm) {
      setZoneError('Please complete all zone properties.');
      return;
    }

    setZoneSaving(true);
    setZoneError('');
    setZoneSuccess('');

    try {
      const res = await fetch('/api/admin/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_name: cityName,
          zone_name: zoneName,
          radius_km: Number(radiusKm),
          active: true,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save zone.');

      setZoneSuccess('Service zone rule defined successfully.');
      setCityName('');
      setZoneName('');
      setRadiusKm('10');
      mutate('/api/admin/operations');
    } catch (err: any) {
      setZoneError(err.message || 'Server error creating zone.');
    } finally {
      setZoneSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-800">
        <Loader2 className="h-8 w-8 text-rose-600 animate-spin" />
        <p className="text-xs text-slate-500 mt-2">Loading Operations dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Failed to load Operations</h3>
        <p className="text-xs text-slate-550">Failed to load real-time admin operations dashboard telemetry.</p>
        <button
          type="button"
          onClick={() => mutate('/api/admin/operations')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { onlineWorkers, enRouteWorkers, onJobWorkers, activeBookings, serviceZones, analytics } = data;
  const totalActiveJobs = activeBookings.length;
  const totalTrackingSessions = enRouteWorkers.length + onJobWorkers.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-rose-500/5 blur-3xl rounded-full" />
        <div className="flex justify-between items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Operations Control Center</h2>
            <p className="text-xs text-slate-500">Live operational map, boundaries management, and ETA metrics monitoring.</p>
          </div>
          
          <button
            type="button"
            onClick={handleRefresh}
            disabled={syncing}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center space-y-1">
          <Users className="h-5 w-5 text-emerald-500 mx-auto" />
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Online Workers</span>
          <p className="text-lg font-black text-slate-800">{onlineWorkers.length}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center space-y-1">
          <TrendingUp className="h-5 w-5 text-blue-500 mx-auto" />
          <span className="text-[9px] uppercase font-bold text-slate-400 block">On Route</span>
          <p className="text-lg font-black text-slate-800">{enRouteWorkers.length}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center space-y-1">
          <Shield className="h-5 w-5 text-indigo-500 mx-auto" />
          <span className="text-[9px] uppercase font-bold text-slate-400 block">On Job</span>
          <p className="text-lg font-black text-slate-800">{onJobWorkers.length}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center space-y-1">
          <MapPin className="h-5 w-5 text-rose-500 mx-auto" />
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Active Jobs</span>
          <p className="text-lg font-black text-slate-800">{totalActiveJobs}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center space-y-1">
          <Clock className="h-5 w-5 text-amber-500 mx-auto" />
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Average ETA</span>
          <p className="text-lg font-black text-slate-800">{analytics.averageEtaMinutes}m</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center space-y-1">
          <Layers className="h-5 w-5 text-purple-500 mx-auto" />
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Live Sessions</span>
          <p className="text-lg font-black text-slate-800">{totalTrackingSessions}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'live' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className="h-4 w-4" />
          Live Operations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'zones' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Zone Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'live' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Real-time Map Feed</h3>
            <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded animate-pulse">
              Map Live
            </span>
          </div>
          <div ref={mapContainerRef} className="w-full h-[450px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden" />
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Zone Rules List */}
          <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Service Coverage Boundaries</h3>
            
            {serviceZones.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active service zones rules defined.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {serviceZones.map((z: ServiceZone) => (
                  <div key={z.id} className="py-3.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-850">{z.zone_name}</p>
                      <span className="text-[9px] text-slate-450 block">{z.city_name} — Radius: {z.radius_km} km</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded ${
                      z.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-550 border border-slate-200'
                    }`}>
                      {z.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Zone Rule Form */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-rose-600" />
              Define City Zone
            </h3>
            
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">City Name</label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500/50 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">Zone Label</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Indiranagar Core"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500/50 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider">Radius Limit (km)</label>
                <input
                  type="number"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  placeholder="10"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500/50 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  required
                />
              </div>

              {zoneError && (
                <p className="p-2.5 bg-red-50 border border-red-100 text-red-650 text-[10px] font-bold text-center rounded-lg flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  {zoneError}
                </p>
              )}

              {zoneSuccess && (
                <p className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-650 text-[10px] font-bold text-center rounded-lg">
                  {zoneSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={zoneSaving}
                className="w-full bg-rose-600 hover:bg-rose-550 text-white py-2.5 rounded-xl text-xs font-bold uppercase transition-all select-none cursor-pointer"
              >
                {zoneSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Zone Rule'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Historical Performance stats */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Zone Utilization</h3>
            <div className="h-64">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                  <BarChart data={analytics.zoneUtilization}>
                    <XAxis dataKey="zoneName" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="activeBookings" fill="#E11D48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Operational Metrics list */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Operational Accuracy & KPIs</h3>
            
            <div className="space-y-4 pt-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-455" />
                  <span className="font-semibold text-slate-700">Average Arrival Time</span>
                </div>
                <span className="font-black text-slate-900">{analytics.averageArrivalTimeMinutes} minutes</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-slate-455" />
                  <span className="font-semibold text-slate-700">Worker Utilization Rate</span>
                </div>
                <span className="font-black text-slate-900">{analytics.workerUtilizationPercent}%</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-455" />
                  <span className="font-semibold text-slate-700">Total Distance Covered</span>
                </div>
                <span className="font-black text-slate-900">{analytics.totalDistanceTraveledKm} km</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-455" />
                  <span className="font-semibold text-slate-700">Active Worker Tracking Hours</span>
                </div>
                <span className="font-black text-slate-900">{analytics.activeWorkerHours} hours</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
