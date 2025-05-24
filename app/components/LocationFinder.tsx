"use client";

import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

interface LocationFinderProps {
  onLocationFound: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

export default function LocationFinder({ onLocationFound, className = '' }: LocationFinderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [address, setAddress] = useState<string>('');

  // Function to get current location
  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to get address from coordinates');
        }

        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const formattedAddress = data.results[0].formatted_address;
          setAddress(formattedAddress);
          
          // Call the callback with location data
          onLocationFound({
            lat: latitude,
            lng: longitude,
            address: formattedAddress
          });
          
          setSuccess(true);
        } else {
          // If we can't get the address, still return the coordinates
          setAddress(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
          
          onLocationFound({
            lat: latitude,
            lng: longitude,
            address: `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          });
          
          setSuccess(true);
        }
      } catch (geocodeError) {
        console.error('Error getting address:', geocodeError);
        
        // Still return the coordinates even if geocoding fails
        setAddress(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
        
        onLocationFound({
          lat: latitude,
          lng: longitude,
          address: `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
        
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Error getting location:', err);
      setError(err.message || 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center mb-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Getting location...
            </>
          ) : (
            <>
              <FaMapMarkerAlt className="mr-2" />
              Use my current location
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-red-600 bg-red-50 p-2 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-2 text-green-600 bg-green-50 p-2 rounded-md flex items-center">
          <FaCheckCircle className="mr-2" />
          <span className="text-sm">Location found: {address}</span>
        </div>
      )}
    </div>
  );
}
