import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Minus, Trash2, ShoppingBag, 
  Clock, MessageSquare, Check, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/types/menu';
import { useToast } from '@/hooks/use-toast';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const {
    cart,
    formattedTotal,
    isEmpty,
    updateQuantity,
    removeFromCart,
    clearCart,
    createOrder
  } = useCart();

  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { toast } = useToast();

  const handleQuantityUpdate = (itemId: number, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: number) => {
    removeFromCart(itemId);
  };

  const handlePlaceOrder = async () => {
    if (isEmpty) return;
    
    setIsProcessingOrder(true);
    
    try {
      await createOrder(orderNotes);
      
      toast({
        title: "Pedido enviado!",
        description: "Seu pedido foi recebido com sucesso.",
        duration: 3000,
      });
      
      onClose();
      setOrderNotes('');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Erro ao enviar pedido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const estimatedTime = 15 + (cart.items.length * 3);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4 p-0 max-h-[90vh] overflow-hidden rounded-3xl border-0 shadow-2xl bg-white">
        <div className="relative">
          {/* Modern Header with Gradient */}
          <div className="relative bg-gradient-to-r from-green-500 to-green-600 p-6 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Meu Carrinho
                </h2>
                {!isEmpty && (
                  <p className="text-green-100 text-sm mt-1">
                    {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Total Preview */}
            {!isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm">Total do pedido</span>
                  <span className="text-2xl font-bold text-white">
                    {formattedTotal}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-white/80 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>Pronto em ~{estimatedTime} min</span>
                </div>
              </motion.div>
            )}

            {/* Curved Bottom */}
            <div className="absolute -bottom-4 left-0 right-0 h-6 bg-white rounded-t-3xl" />
          </div>

          {isEmpty ? (
            // Empty State - Modern Design
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"
              >
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Carrinho vazio
                </h3>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">
                  Que tal começar adicionando alguns pratos deliciosos ao seu pedido?
                </p>
                
                <Button 
                  onClick={onClose}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-3 font-medium"
                >
                  Explorar Cardápio
                </Button>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Cart Items with Native Scrolling */}
              <div className="flex-1 overflow-y-auto max-h-[50vh] px-4 pt-2">
                <div className="space-y-3">
                  <AnimatePresence>
                    {cart.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <CartItemCard
                          item={item}
                          onQuantityUpdate={handleQuantityUpdate}
                          onRemove={handleRemoveItem}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Order Notes */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Observações do pedido
                    </span>
                  </div>
                  
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: sem cebola, bem passado, entrega na mesa 5..."
                    className="text-sm resize-none border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 space-y-3">
                {/* Clear Cart Button */}
                <Button
                  variant="ghost"
                  onClick={clearCart}
                  className="w-full text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar carrinho
                </Button>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessingOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isProcessingOrder ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando pedido...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      <span>Confirmar Pedido • {formattedTotal}</span>
                    </div>
                  )}
                </Button>

                {/* Info Text */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>Pedido será processado pelo estabelecimento</span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onQuantityUpdate: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

function CartItemCard({ item, onQuantityUpdate, onRemove }: CartItemCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(item.price);

  const totalPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(item.price * item.quantity);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {item.image_url ? (
            <OptimizedImage
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 pr-2">
              {item.name}
            </h4>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-600">{formattedPrice}</span>
              <span className="text-gray-400 mx-1">×</span>
              <span className="font-semibold text-green-600">{totalPrice}</span>
            </div>
            
            {/* Quantity Controls - Native Style */}
            <div className="flex items-center bg-gray-100 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityUpdate(item.id, item.quantity - 1)}
                className="h-8 w-8 rounded-full hover:bg-gray-200 text-gray-600"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="mx-3 text-sm font-semibold text-gray-900 min-w-[20px] text-center">
                {item.quantity}
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityUpdate(item.id, item.quantity + 1)}
                className="h-8 w-8 rounded-full hover:bg-gray-200 text-gray-600"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Notes Display */}
          {item.notes && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              {item.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 