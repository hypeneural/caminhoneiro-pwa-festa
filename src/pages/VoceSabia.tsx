import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ArrowLeft, WifiOff, Sparkles, Brain, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FactFilters } from "@/components/facts/FactFilters";
import { FactsList, FactsListSkeleton } from "@/components/facts/FactsList";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { useFactsFilter } from "@/hooks/useFacts";
import { useNavigation } from "@/hooks/useNavigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

const VoceSabia = () => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    facts,
    loading,
    error,
    hasMore,
    categories,
    categoriesLoading,
    activeCategory,
    searchQuery,
    sortOrder,
    hasActiveFilters,
    setActiveCategory,
    setSearchQuery,
    setSortOrder,
    clearFilters,
    loadMore,
    refresh
  } = useFactsFilter();

  const { goBack } = useNavigation();
  const { isOnline } = useNetworkStatus();

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col">
        {/* Modern Native Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3">
              <TouchFeedback>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="p-2 h-auto rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Button>
              </TouchFeedback>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Você Sabia?</h1>
                  <p className="text-xs text-gray-500">Curiosidades da Festa</p>
                </div>
              </div>
            </div>

            {/* Filter toggle */}
            <TouchFeedback>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-2 h-auto rounded-full relative",
                  hasActiveFilters ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </Button>
            </TouchFeedback>
          </div>

          {/* Filters - collapsible */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200/50 px-4 py-3 bg-white/50"
              >
                <FactFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  categories={categories}
                  categoriesLoading={categoriesLoading}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Offline Indicator */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-16 left-4 right-4 z-40 bg-orange-100 border border-orange-200 text-orange-800 p-3 rounded-xl text-center text-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Modo offline ativo • Conteúdo em cache</span>
            </div>
          </motion.div>
        )}
        
        <main className={cn("flex-1 pb-20", !isOnline ? "pt-28" : showFilters ? "pt-24" : "pt-16")}>
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="px-4 py-6 space-y-6">
              {/* Hero Section - Modern Design */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="text-center space-y-4 py-6"
              >
                {/* Hero icons */}
                <div className="flex justify-center items-center gap-4 mb-6">
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Brain className="w-8 h-8 text-white" />
                  </motion.div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Curiosidades Incríveis
                  </h2>
                  <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                    Descubra fatos fascinantes sobre a Festa dos Caminhoneiros e muito mais!
                  </p>
                </div>

                {/* Quick stats */}
                {facts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center items-center gap-6 pt-4"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{facts.length}</div>
                      <div className="text-xs text-gray-500">Curiosidades</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
                      <div className="text-xs text-gray-500">Categorias</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Quick search - visible when not filtering */}
              {!showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="px-2"
                >
                  <TouchFeedback>
                    <div 
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50 cursor-pointer"
                      onClick={() => setShowFilters(true)}
                    >
                      <div className="flex items-center gap-3 text-gray-500">
                        <Search className="w-5 h-5" />
                        <span>Buscar curiosidades...</span>
                      </div>
                    </div>
                  </TouchFeedback>
                </motion.div>
              )}

              {/* Content Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {loading && facts.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
                      >
                        <Lightbulb className="w-6 h-6 text-white" />
                      </motion.div>
                      <p className="text-gray-500">Carregando curiosidades...</p>
                    </div>
                    <FactsListSkeleton />
                  </div>
                ) : (
                  <FactsList
                    facts={facts}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    onRefresh={refresh}
                  />
                )}
              </motion.div>

              {/* Bottom spacing for safe area */}
              <div className="h-8" />
            </div>
          </PullToRefresh>
        </main>

        <BottomNavigation />
      </div>
    </ErrorBoundary>
  );
};

export default VoceSabia; 