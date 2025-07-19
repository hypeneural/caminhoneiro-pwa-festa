import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

interface GalleryDebugPanelProps {
  galleryState: {
    photos: any[];
    loading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    page: number;
    totalPhotos: number;
    selectedTagId: number | null;
    error: string | null;
  };
  scrollInfo?: {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
    distanceFromBottom: number;
    shouldLoadMore: boolean;
  };
}

export const GalleryDebugPanel: React.FC<GalleryDebugPanelProps> = ({
  galleryState,
  scrollInfo
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Só mostra em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const getStatusColor = (condition: boolean) => {
    return condition ? 'text-green-400' : 'text-red-400';
  };

  const getLoadingStatus = () => {
    if (galleryState.loading) return 'Loading initial...';
    if (galleryState.isLoadingMore) return 'Loading more...';
    return 'Idle';
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : '48px',
          opacity: 1
        }}
        className="bg-black/90 text-white rounded-lg border border-gray-600 overflow-hidden backdrop-blur-sm"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Bug size={16} className="text-blue-400" />
            <span className="text-sm font-medium">Gallery Debug</span>
            <div className={`w-2 h-2 rounded-full ${galleryState.loading || galleryState.isLoadingMore ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-3 space-y-3 text-xs"
            >
              {/* Status Overview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-gray-400">Status</div>
                  <div className={`font-medium ${galleryState.loading || galleryState.isLoadingMore ? 'text-yellow-400' : 'text-green-400'}`}>
                    {getLoadingStatus()}
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-gray-400">Photos</div>
                  <div className="font-medium text-blue-400">
                    {galleryState.photos.length} / {galleryState.totalPhotos}
                  </div>
                </div>
              </div>

              {/* Pagination Info */}
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-400 mb-1">Pagination</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Page:</span>
                    <span className="ml-1 text-white font-medium">{galleryState.page}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Has More:</span>
                    <span className={`ml-1 font-medium ${getStatusColor(galleryState.hasMore)}`}>
                      {galleryState.hasMore ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tag:</span>
                    <span className="ml-1 text-white font-medium">
                      {galleryState.selectedTagId || 'All'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loading States */}
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-400 mb-1">Loading States</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <span className={getStatusColor(galleryState.loading)}>
                      {galleryState.loading ? 'True' : 'False'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading More:</span>
                    <span className={getStatusColor(galleryState.isLoadingMore)}>
                      {galleryState.isLoadingMore ? 'True' : 'False'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scroll Info */}
              {scrollInfo && (
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-gray-400 mb-1">Scroll Debug</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span className="text-blue-400">
                        {Math.round(scrollInfo.scrollTop)}px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>From Bottom:</span>
                      <span className="text-blue-400">
                        {Math.round(scrollInfo.distanceFromBottom)}px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Should Load:</span>
                      <span className={getStatusColor(scrollInfo.shouldLoadMore)}>
                        {scrollInfo.shouldLoadMore ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="text-blue-400">
                        {Math.round((scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Info */}
              {galleryState.error && (
                <div className="bg-red-900/50 border border-red-500 rounded p-2">
                  <div className="text-red-400 mb-1">Error</div>
                  <div className="text-red-300 text-xs break-words">
                    {galleryState.error}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-400 mb-1">Performance</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Photos/Page:</span>
                    <span className="text-green-400">
                      {galleryState.photos.length > 0 ? Math.round(galleryState.photos.length / galleryState.page) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load Progress:</span>
                    <span className="text-green-400">
                      {galleryState.totalPhotos > 0 ? Math.round((galleryState.photos.length / galleryState.totalPhotos) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 