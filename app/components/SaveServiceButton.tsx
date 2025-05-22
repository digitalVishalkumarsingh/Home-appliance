"use client";

import { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAuth from '@/app/hooks/useAuth';

interface SaveServiceButtonProps {
  serviceId: string;
  className?: string;
  showText?: boolean;
  onRemove?: () => void;
}

const SaveServiceButton = ({ serviceId, className = '', showText = false, onRemove }: SaveServiceButtonProps) => {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if the service is already saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/user/saved-services');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const savedServices = data.savedServices || [];
            const isServiceSaved = savedServices.some((service: any) => service._id === serviceId);
            setIsSaved(isServiceSaved);
          }
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkIfSaved();
  }, [serviceId, isAuthenticated]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save services');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isSaved) {
        // Remove from saved services
        const response = await fetch(`/api/user/saved-services?serviceId=${serviceId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsSaved(false);
          toast.success('Service removed from saved list');
          // Call onRemove callback if provided
          if (onRemove) {
            onRemove();
          }
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to remove service from saved list');
        }
      } else {
        // Add to saved services
        const response = await fetch('/api/user/saved-services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ serviceId }),
        });

        if (response.ok) {
          setIsSaved(true);
          toast.success('Service saved to your list');
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to save service');
        }
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <button
        className={`flex items-center justify-center ${className}`}
        disabled
      >
        <span className="animate-pulse">
          <FaRegHeart className="text-gray-300" />
        </span>
        {showText && <span className="ml-1 text-gray-400">Loading...</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleSave}
      className={`flex items-center justify-center transition-colors duration-300 ${className}`}
      disabled={isLoading}
      aria-label={isSaved ? "Remove from saved services" : "Save this service"}
    >
      {isSaved ? (
        <>
          <FaHeart className="text-red-500" />
          {showText && <span className="ml-1">Saved</span>}
        </>
      ) : (
        <>
          <FaRegHeart className="text-gray-500 hover:text-red-500" />
          {showText && <span className="ml-1">Save</span>}
        </>
      )}
    </button>
  );
};

export default SaveServiceButton;
