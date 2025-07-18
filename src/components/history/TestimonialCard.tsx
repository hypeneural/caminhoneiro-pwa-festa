import { motion } from "framer-motion";
import { useState } from "react";
import { MessageCircle, Play, Pause, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { testimonials } from "@/data/historyData";
import { Testimonial } from "@/types/history";

const categoryLabels = {
  organizer: 'Organizador',
  trucker: 'Caminhoneiro',
  family: 'Família',
  authority: 'Autoridade',
  participant: 'Participante',
  founder: 'Fundador',
  volunteer: 'Voluntário'
};

const categoryColors = {
  organizer: 'bg-trucker-blue text-trucker-blue-foreground',
  trucker: 'bg-trucker-yellow text-trucker-yellow-foreground',
  family: 'bg-trucker-green text-trucker-green-foreground',
  authority: 'bg-purple-500 text-white',
  participant: 'bg-gray-500 text-white',
  founder: 'bg-trucker-orange text-white',
  volunteer: 'bg-pink-500 text-white'
};

interface TestimonialItemProps {
  testimonial: Testimonial;
  index: number;
}

const TestimonialItem = ({ testimonial, index }: TestimonialItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudioToggle = () => {
    if (testimonial.audioUrl) {
      setIsPlaying(!isPlaying);
      // Audio playback logic would go here
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Card className={`group hover:shadow-lg transition-all duration-300 ${
        testimonial.isHighlighted ? 'ring-2 ring-trucker-yellow' : ''
      }`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={testimonial.author.photo} alt={testimonial.author.name} />
              <AvatarFallback>
                {testimonial.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  {testimonial.author.name}
                </h3>
                {testimonial.isHighlighted && (
                  <Badge variant="outline" className="text-xs bg-trucker-yellow/10">
                    Destaque
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {testimonial.author.role}
              </p>
              
              <div className="flex items-center gap-2">
                <Badge 
                  className={`text-xs ${categoryColors[testimonial.category]}`}
                >
                  {categoryLabels[testimonial.category]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {testimonial.author.yearsParticipating} anos participando
                </span>
              </div>
            </div>

            {/* Audio Control */}
            {testimonial.audioUrl && (
              <Button
                onClick={handleAudioToggle}
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
          </div>

          {/* Quote */}
          <div className="relative mb-4">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-trucker-yellow opacity-50" />
            <blockquote className="text-foreground italic leading-relaxed pl-4">
              "{testimonial.quote}"
            </blockquote>
          </div>

          {/* Full Testimonial */}
          {testimonial.fullTestimonial && (
            <div className="space-y-3">
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {testimonial.fullTestimonial}
                </motion.div>
              )}
              
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="text-trucker-blue hover:text-trucker-blue/80"
              >
                {isExpanded ? 'Ver menos' : 'Ler depoimento completo'}
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Depoimento de {testimonial.year}
            </span>
            
            {testimonial.relatedMilestone && (
              <Badge variant="outline" className="text-xs">
                Marco histórico relacionado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const TestimonialsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTestimonials = activeCategory
    ? testimonials.filter(t => t.category === activeCategory)
    : testimonials;

  const categories = Array.from(new Set(testimonials.map(t => t.category)));
  const highlightedTestimonials = testimonials.filter(t => t.isHighlighted);

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="w-8 h-8 text-trucker-blue" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Vozes da Nossa História
            </h2>
          </div>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Depoimentos de quem viveu e constrói a história da nossa festa desde 2003. 
            Cada voz representa uma parte fundamental dessa tradição de fé, trabalho e comunidade.
          </p>
        </motion.div>

        {/* Highlighted Testimonials Preview */}
        {highlightedTestimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold mb-4 text-center">Depoimentos em Destaque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlightedTestimonials.slice(0, 3).map((testimonial, index) => (
                <Card key={testimonial.id} className="bg-gradient-to-br from-trucker-yellow/5 to-trucker-orange/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={testimonial.author.photo} alt={testimonial.author.name} />
                        <AvatarFallback className="text-xs">
                          {testimonial.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{testimonial.author.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.author.role}</p>
                      </div>
                    </div>
                    <blockquote className="text-sm italic">
                      "{testimonial.quote}"
                    </blockquote>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          <Button
            onClick={() => setActiveCategory(null)}
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
          >
            Todos ({testimonials.length})
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setActiveCategory(category)}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              className="text-sm"
            >
              {categoryLabels[category as keyof typeof categoryLabels]} 
              ({testimonials.filter(t => t.category === category).length})
            </Button>
          ))}
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredTestimonials.length} depoimento{filteredTestimonials.length !== 1 ? 's' : ''}
            {activeCategory && ` da categoria "${categoryLabels[activeCategory as keyof typeof categoryLabels]}"`}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {filteredTestimonials.map((testimonial, index) => (
            <TestimonialItem
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Submit Testimonial CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-trucker-yellow/10 to-trucker-orange/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">Compartilhe Sua História</h3>
              <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                Você também faz parte desta tradição de 22 anos. Envie seu depoimento e ajude a 
                preservar nossa memória para as futuras gerações de caminhoneiros.
              </p>
              <div className="space-y-2">
                <Button className="bg-trucker-yellow hover:bg-trucker-yellow/90">
                  Enviar Meu Depoimento
                </Button>
                <p className="text-xs text-muted-foreground">
                  Projeto digital festadoscaminhoneiros.com.br preservando nossa história
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};