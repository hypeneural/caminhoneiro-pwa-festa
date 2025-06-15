import { motion } from "framer-motion";
import { useState } from "react";
import { Image, Filter, X, Calendar, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { galleryImages } from "@/data/historyData";

const decades = [2000, 2010, 2020];
const types = ['photos', 'documents', 'newspaper', 'all'] as const;
const themes = ['origem', 'celebracao', 'shows', 'procissao', 'futuro'];

const typeLabels = {
  photos: 'Fotos',
  documents: 'Documentos',
  newspaper: 'Jornais',
  all: 'Todos'
};

export const HistoricalGallery = () => {
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredImages = galleryImages.filter(image => {
    if (selectedDecade && image.decade !== selectedDecade) return false;
    if (selectedType !== 'all' && image.type !== selectedType) return false;
    if (selectedTheme && image.theme !== selectedTheme) return false;
    return true;
  });

  const openImageModal = (image: any) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedDecade(null);
    setSelectedType('all');
    setSelectedTheme(null);
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image className="w-8 h-8 text-trucker-brown" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Galeria Histórica: Memórias da Estrada
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uma jornada visual através dos anos, preservando momentos únicos 
            e a evolução da nossa tradição.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-trucker-blue" />
                <h3 className="font-semibold">Filtros</h3>
                {(selectedDecade || selectedType !== 'all' || selectedTheme) && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Decades */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Década:</label>
                  <div className="flex flex-wrap gap-2">
                    {decades.map(decade => (
                      <Button
                        key={decade}
                        onClick={() => setSelectedDecade(selectedDecade === decade ? null : decade)}
                        variant={selectedDecade === decade ? "default" : "outline"}
                        size="sm"
                      >
                        {decade}s
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Types */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo:</label>
                  <div className="flex flex-wrap gap-2">
                    {types.map(type => (
                      <Button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        variant={selectedType === type ? "default" : "outline"}
                        size="sm"
                      >
                        {typeLabels[type]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Themes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tema:</label>
                  <div className="flex flex-wrap gap-2">
                    {themes.map(theme => (
                      <Button
                        key={theme}
                        onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
                        variant={selectedTheme === theme ? "default" : "outline"}
                        size="sm"
                      >
                        {theme}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredImages.length} {filteredImages.length === 1 ? 'imagem encontrada' : 'imagens encontradas'}
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer"
              onClick={() => openImageModal(image)}
            >
              <Card className="overflow-hidden group">
                <div className="relative aspect-video">
                  <img
                    src={image.thumbnailUrl}
                    alt={image.title}
                    className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                      image.isHistorical ? 'sepia contrast-110' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {image.title}
                    </h3>
                    <p className="text-white/80 text-xs">
                      {image.description}
                    </p>
                  </div>

                  {/* Historical Badge */}
                  {image.isHistorical && (
                    <Badge className="absolute top-2 left-2 bg-amber-600">
                      Histórica
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma imagem encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros para ver mais resultados.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Limpar filtros
            </Button>
          </motion.div>
        )}

        {/* Image Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            {selectedImage && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedImage.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      className={`w-full max-h-96 object-contain rounded-lg ${
                        selectedImage.isHistorical ? 'sepia contrast-110' : ''
                      }`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{selectedImage.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedImage.decade}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        <span>{selectedImage.theme}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Badge variant="secondary">{typeLabels[selectedImage.type]}</Badge>
                      {selectedImage.isHistorical && (
                        <Badge className="bg-amber-600">Histórica</Badge>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button className="w-full" variant="outline">
                        <Image className="w-4 h-4 mr-2" />
                        Compartilhar Imagem
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};