import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '../types';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix for default marker icon in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
    properties: Property[];
}

// Component to auto-center map boundaries based on markers
const UpdateBounds: React.FC<{ properties: Property[] }> = ({ properties }) => {
    const map = useMap();

    useEffect(() => {
        if (properties.length === 0) return;

        const bounds = L.latLngBounds(
            properties.map(p => {
                // Mock coordinates if not available, or parse from address if we had geocoding
                // For this demo, we will generate fake coords around a central point if needed
                // But let's assume properties might have lat/lng functionality later.
                // For now, I will mock random slight variations around a center city point.

                // MOCK LOGIC: Generate deterministic fake coords based on ID characters
                const baseLat = -23.550520; // SP
                const baseLng = -46.633308;
                const idNum = parseInt(p.id.replace(/\D/g, '').slice(0, 5) || '1111') / 100000;

                return [baseLat + (idNum * (Math.random() > 0.5 ? 1 : -1)), baseLng + (idNum * (Math.random() > 0.5 ? 1 : -1))];
            }) as L.LatLngTuple[]
        );

        map.fitBounds(bounds, { padding: [50, 50] });
    }, [properties, map]);

    return null;
};

const PropertyMap: React.FC<PropertyMapProps> = ({ properties }) => {
    // Default center (São Paulo)
    const center: [number, number] = [-23.550520, -46.633308];

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden z-0 relative">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <UpdateBounds properties={properties} />

                {properties.map(property => {
                    // MOCK COORDS LOGIC (Replace with real property.latitude/longitude later)
                    const baseLat = -23.550520;
                    const baseLng = -46.633308;
                    const idNum = parseInt(property.id.replace(/\D/g, '').slice(0, 5) || '1111') / 5000; // Spread out more
                    const lat = baseLat + (idNum * (property.title.length % 2 === 0 ? 0.02 : -0.02));
                    const lng = baseLng + (idNum * (property.title.length % 3 === 0 ? 0.02 : -0.02));

                    return (
                        <Marker key={property.id} position={[lat, lng]}>
                            <Popup>
                                <div className="min-w-[200px]">
                                    <img src={property.images[0]} alt={property.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                                    <Link to={`/properties/${property.id}`} className="font-bold text-brand-900 hover:underline block mb-1">
                                        {property.title}
                                    </Link>
                                    <p className="text-gray-600 text-xs mb-1">{property.city}</p>
                                    <p className="text-green-600 font-bold">
                                        {property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default PropertyMap;
