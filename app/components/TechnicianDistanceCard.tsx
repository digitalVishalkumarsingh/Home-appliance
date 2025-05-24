"use client";

import { useState } from 'react';
import { FaUser, FaStar, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';

interface TechnicianDistanceCardProps {
  technician: {
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
    distance: number;
    isAvailable: boolean;
    specialization?: string;
    image?: string;
  };
  onSelect: (technicianId: string) => void;
  selected: boolean;
}

export default function TechnicianDistanceCard({ 
  technician, 
  onSelect, 
  selected 
}: TechnicianDistanceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div 
      className={`border rounded-lg p-4 mb-3 transition-all duration-300 ${
        selected 
          ? 'border-green-500 bg-green-50 shadow-md' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 overflow-hidden">
            {technician.image ? (
              <img 
                src={technician.image} 
                alt={technician.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUser className="text-blue-600 text-xl" />
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">{technician.name}</h3>
            
            <div className="flex items-center mt-1">
              <div className="flex items-center mr-3">
                <FaStar className="text-yellow-400 mr-1 h-3 w-3" />
                <span className="text-sm text-gray-600">{technician.rating.toFixed(1)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <FaMapMarkerAlt className="text-red-500 mr-1 h-3 w-3" />
                <span className="font-medium">{technician.distance.toFixed(1)} km</span>
                <span className="text-xs ml-1">away</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          {technician.isAvailable ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Available
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              Unavailable
            </span>
          )}
          
          {selected && (
            <span className="flex items-center text-green-600 text-xs mt-1">
              <FaCheck className="mr-1 h-3 w-3" />
              Selected
            </span>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Completed Jobs:</span>
              <span className="ml-1 font-medium">{technician.completedJobs}</span>
            </div>
            
            {technician.specialization && (
              <div>
                <span className="text-gray-500">Specialization:</span>
                <span className="ml-1 font-medium">{technician.specialization}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-3 flex justify-between">
        <button
          type="button"
          onClick={toggleExpand}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
        
        <button
          type="button"
          onClick={() => onSelect(technician.id)}
          disabled={!technician.isAvailable || selected}
          className={`px-3 py-1 rounded text-sm font-medium ${
            selected
              ? 'bg-green-600 text-white'
              : technician.isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
}
