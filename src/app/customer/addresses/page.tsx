'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  MapPin, Plus, Trash2, Home, Briefcase, HelpCircle, 
  Loader2, AlertCircle, Edit3, CheckCircle2, Save, X 
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface AddressItem {
  id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  place_id?: string | null;
  formatted_address?: string | null;
}

export default function CustomerAddressesPage() {
  const { data, error, isLoading } = useSWR('/api/customer/addresses', fetcher);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [detecting, setDetecting] = useState(false);

  // Modal editor states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [deviceCoords, setDeviceCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Initialize coordinates dynamically based on current user device position
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setDeviceCoords({ lat, lng });
          setLatitude(lat);
          setLongitude(lng);
        },
        (error) => {
          console.error("Device geolocation query failed on mount:", error);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);

  const handleAddressChange = async (val: string) => {
    setAddress(val);
    setPlaceId(null);
    setFormattedAddress(null);
    if (val.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error fetching autocomplete suggestions:', err);
    }
  };

  const handleSelectSuggestion = async (sugg: any) => {
    setShowSuggestions(false);
    setAddress(sugg.description);
    setSaving(true);
    try {
      const res = await fetch(`/api/maps/place-details?placeId=${sugg.placeId}`);
      const data = await res.json();
      if (data && data.details) {
        setAddress(data.details.formattedAddress);
        setFormattedAddress(data.details.formattedAddress);
        setPlaceId(data.details.placeId || sugg.placeId);
        setLatitude(String(data.details.lat.toFixed(6)));
        setLongitude(String(data.details.lng.toFixed(6)));
      }
    } catch (err) {
      console.error('Error fetching place details:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    const processCoords = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(String(lat.toFixed(6)));
      setLongitude(String(lng.toFixed(6)));

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'VoloHomeServices/1.0 (contact@volo.com)' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
      } finally {
        setDetecting(false);
      }
    };

    const runDetection = async () => {
      try {
        const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 });
        await processCoords(pos);
      } catch (highAccErr: any) {
        console.warn('High accuracy location detection failed or timed out. Retrying with low accuracy fallback...', highAccErr);
        try {
          const pos = await getPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 });
          await processCoords(pos);
        } catch (fallbackErr: any) {
          setErrorMsg(`Location detection failed: ${fallbackErr.message || String(fallbackErr)}`);
          setDetecting(false);
        }
      }
    };

    runDetection();
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setLabel('HOME');
    setAddress('');
    setLatitude(deviceCoords?.lat || '12.9716');
    setLongitude(deviceCoords?.lng || '77.5946');
    setIsDefault(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setPlaceId(null);
    setFormattedAddress(null);
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: AddressItem) => {
    setEditingId(item.id);
    setLabel(item.label);
    setAddress(item.address);
    setLatitude(String(item.latitude));
    setLongitude(String(item.longitude));
    setIsDefault(item.is_default);
    setSuggestions([]);
    setShowSuggestions(false);
    setPlaceId(item.place_id || null);
    setFormattedAddress(item.formatted_address || null);
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  // Submit address form (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setErrorMsg('Address text details are required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const url = editingId ? `/api/customer/addresses/${editingId}` : '/api/customer/addresses';
    const method = editingId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          is_default: isDefault,
          place_id: placeId,
          formatted_address: formattedAddress || address
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save address.');
      }

      setSuccessMsg(editingId ? 'Address updated successfully.' : 'Address saved successfully.');
      mutate('/api/customer/addresses');
      mutate('/api/customer/dashboard');
      setTimeout(() => setShowModal(false), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // Set default address immediately
  const handleSetDefault = async (item: AddressItem) => {
    try {
      const res = await fetch(`/api/customer/addresses/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      });
      if (!res.ok) throw new Error('Failed to set default address.');
      mutate('/api/customer/addresses');
      mutate('/api/customer/dashboard');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Delete address
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete address.');
      mutate('/api/customer/addresses');
      mutate('/api/customer/dashboard');
    } catch (err: any) {
      console.error(err);
    }
  };

  const getLabelIcon = (labelType: 'HOME' | 'WORK' | 'OTHER') => {
    switch (labelType) {
      case 'HOME':
        return <Home className="h-4 w-4 text-rose-600" />;
      case 'WORK':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden select-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-rose-500/5 blur-3xl rounded-full" />
        <div className="flex justify-between items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Saved Addresses</h2>
            <p className="text-xs text-slate-500">Manage multiple locations for quick booking dispatch allocations.</p>
          </div>
          
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-550 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase transition-all tracking-wider select-none cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Main List Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="h-7 w-7 text-rose-600 animate-spin mx-auto mb-2.5" />
          <p className="text-xs">Fetching saved addresses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center text-xs text-red-500">
          Failed to load saved addresses.
        </div>
      ) : !data.addresses || data.addresses.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center select-none space-y-2.5">
          <MapPin className="h-8 w-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-400 text-sm">No Saved Addresses</h4>
          <p className="text-xs text-slate-550 max-w-xs mx-auto">Save locations like Home, Office, or Office branch to book technicians instantly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.addresses.map((item: AddressItem) => (
            <div 
              key={item.id}
              className={`bg-white border rounded-3xl p-5 shadow-sm space-y-3 transition-all ${
                item.is_default ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200/80'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getLabelIcon(item.label)}
                  </div>
                  <span className="font-bold text-xs uppercase text-slate-800 tracking-wider">{item.label}</span>
                  {item.is_default && (
                    <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded bg-rose-50 text-rose-650 border border-rose-100">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 select-none">
                  {!item.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(item)}
                      className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 hover:text-rose-500 cursor-pointer"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1 hover:bg-slate-100 text-slate-450 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 hover:bg-red-50 text-slate-450 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs select-all">
                <p className="font-semibold text-slate-700 leading-relaxed">{item.address}</p>
                <span className="text-[9px] text-slate-450 block font-mono">
                  Coordinates: {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center select-none">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? 'Edit Saved Location' : 'Add New Location'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5 select-none">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Address Label</label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['HOME', 'WORK', 'OTHER'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLabel(type)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        label === type
                          ? 'bg-white text-rose-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Address Text</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 font-semibold outline-none transition-all resize-none leading-relaxed"
                  placeholder="e.g. 123 Main Street, Indiranagar, Bangalore"
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 shadow-md select-none mt-1">
                    {suggestions.map((sugg) => (
                      <button
                        key={sugg.placeId}
                        type="button"
                        onClick={() => handleSelectSuggestion(sugg)}
                        className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <p className="font-bold text-slate-800">{sugg.mainText}</p>
                        <p className="text-[9px] text-slate-450 truncate">{sugg.secondaryText}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 select-none">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detecting}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 border border-rose-200 hover:border-rose-350 rounded-xl text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100/60 transition-colors select-none cursor-pointer disabled:opacity-50"
                >
                  {detecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-rose-605" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-rose-600" />
                      Detect Current Location
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 select-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Set as Default Address</span>
                <button
                  type="button"
                  onClick={() => setIsDefault(!isDefault)}
                  className={`h-5 w-9 rounded-full relative transition-colors ${
                    isDefault ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`h-4.5 w-4.5 rounded-full bg-white absolute top-0.25 transition-transform shadow ${
                    isDefault ? 'right-0.25' : 'left-0.25'
                  }`} />
                </button>
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <p className="p-2.5 bg-red-50 border border-red-100 text-red-650 text-[10px] font-bold text-center rounded-lg flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-650 text-[10px] font-bold text-center rounded-lg flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-550 text-white py-3 px-6 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Location
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
