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
  participant: 'Participante'
};

const categoryColors = {
  organizer: 'bg-trucker-blue text-trucker-blue-foreground',
  trucker: 'bg-trucker-yellow text-trucker-yellow-foreground',
  family: 'bg-trucker-green text-trucker-green-foreground',
  authority: 'bg-purple-500 text-white',
  participant: 'bg-gray-500 text-white'
};

interface TestimonialItemProps {
  testimonial: Testimonial;
  index: number;
}

const TestimonialItem = ({ testimonial, index }: TestimonialItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudioPlay = () => {
    // Mock audio functionality
    setIsPlaying(!isPlaying);
    setTimeout(() => setIsPlaying(false), 3000); // Simulate 3 second audio
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
                <h3 className="font-semibold text-foreground">{testimonial.author.name}</h3>
                {testimonial.isHighlighted && (
                  <Badge variant="secondary" className="text-xs">
                    Destaque
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{testimonial.author.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={categoryColors[testimonial.category]}>
                  {categoryLabels[testimonial.category]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {testimonial.author.yearsParticipating} anos participando
                </span>
              </div>
            </div>

            {/* Audio Player */}
            {testimonial.audioUrl && (
              <Button
                onClick={handleAudioPlay}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Quote */}
          <div className="relative mb-4">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-trucker-yellow/30" />
            <blockquote className="text-lg italic text-foreground pl-4">
              "{testimonial.quote}"
            </blockquote>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>{testimonial.year}</span>
            {testimonial.relatedMilestone && (
              <span>Relacionado ao marco histórico</span>
            )}
          </div>

          {/* Full Testimonial */}
          {testimonial.fullTestimonial && (
            <>
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                {isExpanded ? 'Menos detalhes' : 'Ler depoimento completo'}
              </Button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t"
                >
                  <p className="text-muted-foreground">
                    {testimonial.fullTestimonial}
                  </p>
                </motion.div>
              )}
            </>
          )}
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

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
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
              Vozes da Tradição
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Depoimentos de quem viveu e constrói a história da nossa festa, 
            preservando memórias e compartilhando experiências únicas.
          </p>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            onClick={() => setActiveCategory(null)}
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
          >
            Todos
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setActiveCategory(category)}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
            >
              {categoryLabels[category as keyof typeof categoryLabels]}
            </Button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2">
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
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-trucker-yellow/10 to-trucker-orange/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">Compartilhe Sua História</h3>
              <p className="text-muted-foreground mb-4">
                Você também faz parte desta tradição. Envie seu depoimento e ajude a preservar nossa memória.
              </p>
              <Button className="bg-trucker-yellow hover:bg-trucker-yellow/90">
                Enviar Depoimento
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                * Funcionalidade demonstrativa - Em breve disponível
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};