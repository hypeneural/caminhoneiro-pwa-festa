import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FAQSearch } from "@/components/faq/FAQSearch";
import { FAQCategories } from "@/components/faq/FAQCategories";
import { FAQList } from "@/components/faq/FAQList";
import { useFAQ } from "@/hooks/useFAQ";
import { useNavigation } from "@/hooks/useNavigation";
import { cn } from "@/lib/utils";

const FAQ = () => {
  const {
    filteredFAQs,
    categories,
    activeCategory,
    searchQuery,
    loading,
    setActiveCategory,
    setSearchQuery,
    clearSearch
  } = useFAQ();

  const { goBack } = useNavigation();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-trucker-blue text-white px-4 flex items-center gap-4 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-white hover:bg-white/20 p-2 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6" />
            <h1 className="text-lg font-bold">Dúvidas Frequentes</h1>
          </div>
        </header>
        
        <main className="flex-1 pb-20 pt-16">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Search Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FAQSearch
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
              />
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <FAQCategories
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </motion.div>

            {/* FAQ List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <FAQList
                faqs={filteredFAQs}
                loading={loading}
                searchQuery={searchQuery}
              />
            </motion.div>
          </div>
        </main>

        <BottomNavigation />
      </div>
    </ErrorBoundary>
  );
};

export default FAQ;