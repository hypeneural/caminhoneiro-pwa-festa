import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Star, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { FAQItem } from "@/types/faq";
import { cn } from "@/lib/utils";

interface FAQListProps {
  faqs: FAQItem[];
  loading?: boolean;
  searchQuery?: string;
  className?: string;
}

export function FAQList({
  faqs,
  loading = false,
  searchQuery = '',
  className
}: FAQListProps) {
  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <LoadingState 
              size="sm" 
              text="Carregando perguntas..."
              className="h-16"
            />
          </Card>
        ))}
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma pergunta encontrada
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {searchQuery 
            ? `Não encontramos resultados para "${searchQuery}". Tente outros termos.`
            : 'Não há perguntas disponíveis nesta categoria.'
          }
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={faqs.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={faq.id} 
                  className="border-0 bg-card rounded-lg shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className={cn(
                    "px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors",
                    "[&[data-state=open]]:bg-muted/30"
                  )}>
                    <div className="flex items-start gap-3 text-left flex-1">
                      <div className="flex-shrink-0 mt-1">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          faq.popular 
                            ? "bg-trucker-blue text-white" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {faq.popular ? (
                            <Star className="w-4 h-4 fill-current" />
                          ) : (
                            <HelpCircle className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-relaxed pr-4">
                          {highlightText(faq.question, searchQuery)}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {faq.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          
                          {faq.tags.slice(0, 2).map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <div className="pl-11">
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="leading-relaxed">
                          {highlightText(faq.answer, searchQuery)}
                        </p>
                      </div>
                      
                      {faq.tags.length > 2 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {faq.tags.slice(2).map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}