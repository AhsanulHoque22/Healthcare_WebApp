import React from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

const GlobalLoadingIndicator: React.FC = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm transition-all">
      <div className="relative flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400 opacity-20 mx-auto"></div>
        <p className="text-gray-600 font-medium animate-pulse mt-8 bg-white/80 px-4 py-2 rounded-lg shadow-lg">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default GlobalLoadingIndicator;
