import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Users, Award, AlertTriangle, Sparkles, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { historicalMilestones } from "@/data/historyData";
import { HistoricalMilestone } from "@/types/history";
import { useIsMobile } from "@/hooks/use-mobile";

const significanceIcons = {
  foundation: Flag,
  growth: Users,
  recognition: Award,
  controversy: AlertTriangle,
  future: Sparkles
};

const significanceColors = {
  foundation: "text-trucker-blue",
  growth: "text-trucker-green",
  recognition: "text-trucker-yellow",
  controversy: "text-red-500",
  future: "text-purple-500"
};

interface MobileTimelineItemProps {
  milestone: HistoricalMilestone;
  index: number;
}

const MobileTimelineItem = ({ milestone, index }: MobileTimelineItemProps) => {
  const IconComponent = significanceIcons[milestone.significance];
  const iconColor = significanceColors[milestone.significance];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative pl-8 pb-8"
    >
      {/* Timeline Line */}
      <div className="absolute left-3 top-0 w-0.5 h-full bg-gradient-to-b from-trucker-blue via-trucker-green to-trucker-yellow" />
      
      {/* Timeline Dot */}
      <div className="absolute left-0 top-4 z-10">
        <div className="w-6 h-6 bg-background border-2 border-trucker-blue rounded-full flex items-center justify-center shadow-sm">
          <IconComponent className={`w-3 h-3 ${iconColor}`} />
        </div>
      </div>

      {/* Content Card */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={milestone.id} className="border rounded-lg bg-card shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex flex-col items-start text-left space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="text-xs bg-trucker-blue text-trucker-blue-foreground">
                  {milestone.year}
                </Badge>
                {milestone.participantsEstimate && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-trucker-green" />
                    <span className="text-xs text-trucker-green font-medium">
                      {milestone.participantsEstimate}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">
                {milestone.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {milestone.description}
              </p>
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Image */}
              {milestone.images && milestone.images[0] && (
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={milestone.images[0].url}
                    alt={milestone.images[0].caption}
                    className={`w-full h-32 object-cover ${
                      milestone.images[0].isHistorical ? 'sepia' : ''
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs">
                      {milestone.images[0].caption}
                    </p>
                  </div>
                </div>
              )}

              {/* Long Description */}
              {milestone.longDescription && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {milestone.longDescription}
                </p>
              )}

              {/* Key Figures */}
              {milestone.keyFigures && milestone.keyFigures.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 text-foreground">Figuras Importantes:</h4>
                  <div className="space-y-2">
                    {milestone.keyFigures.map((figure, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {figure.photo && (
                          <img
                            src={figure.photo}
                            alt={figure.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-xs font-medium text-foreground">{figure.name}</p>
                          <p className="text-xs text-muted-foreground">{figure.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context */}
              {milestone.context && (
                <div>
                  <h4 className="text-xs font-semibold mb-1 text-foreground">Contexto:</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{milestone.context}</p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

interface DesktopTimelineItemProps {
  milestone: HistoricalMilestone;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const DesktopTimelineItem = ({ milestone, index, isExpanded, onToggle }: DesktopTimelineItemProps) => {
  const IconComponent = significanceIcons[milestone.significance];
  const iconColor = significanceColors[milestone.significance];
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-border" />
      
      {/* Timeline Dot */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-8 z-10">
        <div className="w-12 h-12 bg-background border-4 border-trucker-blue rounded-full flex items-center justify-center">
          <IconComponent className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      {/* Content */}
      <div className={`grid grid-cols-2 gap-8 mb-16 ${isEven ? '' : 'text-right'}`}>
        <div className={isEven ? 'pr-8' : 'order-2 pl-8'}>
          <Card className="group hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              {/* Year Badge */}
              <Badge className="mb-3 bg-trucker-blue text-trucker-blue-foreground">
                {milestone.year}
              </Badge>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2 text-foreground">
                {milestone.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mb-4">
                {milestone.description}
              </p>

              {/* Participants */}
              {milestone.participantsEstimate && (
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-trucker-green" />
                  <span className="text-sm font-medium text-trucker-green">
                    {milestone.participantsEstimate}
                  </span>
                </div>
              )}

              {/* Expand Button */}
              <Button
                onClick={onToggle}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Menos detalhes
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver mais detalhes
                  </>
                )}
              </Button>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t space-y-4"
                >
                  {milestone.longDescription && (
                    <p className="text-sm text-muted-foreground">
                      {milestone.longDescription}
                    </p>
                  )}

                  {milestone.keyFigures && milestone.keyFigures.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Figuras Importantes:</h4>
                      <div className="space-y-2">
                        {milestone.keyFigures.map((figure, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {figure.photo && (
                              <img
                                src={figure.photo}
                                alt={figure.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">{figure.name}</p>
                              <p className="text-xs text-muted-foreground">{figure.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {milestone.context && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Contexto:</h4>
                      <p className="text-sm text-muted-foreground">{milestone.context}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image */}
        <div className={`${isEven ? 'order-2 pl-8' : 'pr-8'} flex items-center`}>
          {milestone.images && milestone.images[0] && (
            <div className="relative overflow-hidden rounded-lg group">
              <img
                src={milestone.images[0].url}
                alt={milestone.images[0].caption}
                className={`w-full h-48 object-cover transition-all duration-300 group-hover:scale-105 ${
                  milestone.images[0].isHistorical ? 'sepia' : ''
                }`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs bg-black/60 px-2 py-1 rounded">
                  {milestone.images[0].caption}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const HistoricalTimeline = () => {
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <section className="py-8 md:py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-trucker-blue" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              Linha do Tempo da Nossa História
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Acompanhe a evolução da Festa do Caminhoneiro através dos anos, 
            desde seus primórdios até os desafios e conquistas atuais.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {isMobile ? (
            // Mobile Timeline - Vertical stack
            <div className="space-y-6">
              {historicalMilestones.map((milestone, index) => (
                <MobileTimelineItem
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                />
              ))}
            </div>
          ) : (
            // Desktop Timeline - Original layout
            historicalMilestones.map((milestone, index) => (
              <DesktopTimelineItem
                key={milestone.id}
                milestone={milestone}
                index={index}
                isExpanded={expandedItems.has(milestone.id)}
                onToggle={() => toggleExpanded(milestone.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};