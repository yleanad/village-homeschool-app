import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Filter, List, Map as MapIcon, Users, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Discover = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState('25');
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // US center

  useEffect(() => {
    fetchFamilies();
  }, [radius]);

  const fetchFamilies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/families/nearby?radius=${radius}`, {
        withCredentials: true
      });
      setFamilies(response.data);
      
      // Center map on first family with coords
      const familyWithCoords = response.data.find(f => f.latitude && f.longitude);
      if (familyWithCoords) {
        setMapCenter([familyWithCoords.latitude, familyWithCoords.longitude]);
      }
    } catch (error) {
      console.error('Error fetching families:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchFamilies();
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/families/search?q=${encodeURIComponent(searchQuery)}`, {
        withCredentials: true
      });
      setFamilies(response.data);
    } catch (error) {
      console.error('Error searching families:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFamilies = families.filter(family =>
    family.family_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    family.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="discover-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653]">
              Discover Families
            </h1>
            <p className="text-[#5F6F75] mt-1">
              Find homeschool families in your area
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#2A9D8F]' : ''}
              data-testid="list-view-btn"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-[#2A9D8F]' : ''}
              data-testid="map-view-btn"
            >
              <MapIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5F6F75]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, city, or interests..."
                className="pl-10 h-11 border-[#E0E0E0]"
                data-testid="search-input"
              />
            </div>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="w-full sm:w-40 h-11" data-testid="radius-select">
                <SelectValue placeholder="Radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Within 10 miles</SelectItem>
                <SelectItem value="25">Within 25 miles</SelectItem>
                <SelectItem value="50">Within 50 miles</SelectItem>
                <SelectItem value="100">Within 100 miles</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="btn-coral h-11" data-testid="search-btn">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFamilies.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-[#5F6F75]/30 mx-auto mb-4" />
                <h3 className="font-fraunces text-xl text-[#264653] mb-2">No families found</h3>
                <p className="text-[#5F6F75]">Try expanding your search radius or changing filters</p>
              </div>
            ) : (
              filteredFamilies.map((family, index) => (
                <motion.div
                  key={family.family_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/family/${family.family_id}`} data-testid={`family-card-${index}`}>
                    <div className="family-card p-5 h-full">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#C8907A]/15 flex items-center justify-center text-[#C8907A] font-semibold text-lg flex-shrink-0">
                          {family.family_name?.charAt(0) || 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-fraunces text-lg font-semibold text-[#264653] truncate">
                            {family.family_name}
                          </h3>
                          <p className="text-sm text-[#5F6F75] flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {family.city}, {family.state}
                            {family.distance && (
                              <span className="ml-1 text-[#C8907A] font-medium">
                                · {family.distance} mi
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {family.bio && (
                        <p className="text-sm text-[#5F6F75] mt-3 line-clamp-2">{family.bio}</p>
                      )}
                      
                      {family.kids?.length > 0 && (
                        <p className="text-sm text-[#264653] mt-2">
                          <span className="font-medium">{family.kids.length}</span> {family.kids.length === 1 ? 'child' : 'children'}
                          {family.kids.length > 0 && (
                            <span className="text-[#5F6F75]">
                              {' '}(ages {family.kids.map(k => k.age).sort((a,b) => a-b).join(', ')})
                            </span>
                          )}
                        </p>
                      )}
                      
                      {family.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {family.interests.slice(0, 4).map((interest, i) => (
                            <span key={i} className="interest-tag text-xs">
                              {interest}
                            </span>
                          ))}
                          {family.interests.length > 4 && (
                            <span className="text-xs text-[#5F6F75]">+{family.interests.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden" style={{ height: '500px' }}>
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredFamilies.filter(f => f.latitude && f.longitude).map((family) => (
                <Marker
                  key={family.family_id}
                  position={[family.latitude, family.longitude]}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold text-[#264653]">{family.family_name}</h3>
                      <p className="text-sm text-[#5F6F75]">{family.city}, {family.state}</p>
                      {family.kids?.length > 0 && (
                        <p className="text-sm mt-1">{family.kids.length} children</p>
                      )}
                      <Link 
                        to={`/family/${family.family_id}`}
                        className="text-sm text-[#C8907A] font-medium mt-2 inline-block"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Results count */}
        {!loading && filteredFamilies.length > 0 && (
          <p className="text-center text-[#5F6F75]">
            Showing {filteredFamilies.length} {filteredFamilies.length === 1 ? 'family' : 'families'}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Discover;
