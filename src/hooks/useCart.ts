import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cart, CartItem, APIMenuItem, Order, OfflineOrder } from '@/types/menu';
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';

const createInitialCart = (): Cart => ({
  items: [],
  total: 0,
  itemCount: 0,
  lastUpdated: Date.now(),
  sessionId: crypto.randomUUID()
});

export function useCart() {
  const [cartData, setCartData] = useLocalStorage<Cart>('cart', createInitialCart());
  const [pendingOrders, setPendingOrders] = useLocalStorage<OfflineOrder[]>('pending-orders', []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Force re-render when cart data changes
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Calculate totals
  const calculateTotals = useCallback((items: CartItem[]) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const customizationsTotal = item.customizations?.reduce(
        (custSum, cust) => custSum + (cust.selected ? cust.price : 0),
        0
      ) || 0;
      return sum + itemTotal + (customizationsTotal * item.quantity);
    }, 0);

    return { itemCount, total };
  }, []);

  // Update cart with computed values
  const updateCart = useCallback((updater: (prevCart: Cart) => Cart) => {
    setCartData(prevCart => {
      const newCart = updater(prevCart);
      const { itemCount, total } = calculateTotals(newCart.items);
      
      const finalCart = {
        ...newCart,
        itemCount,
        total,
        lastUpdated: Date.now()
      };
      
      // Force component re-render
      setTimeout(() => forceUpdate(), 0);
      
      return finalCart;
    });
  }, [setCartData, calculateTotals, forceUpdate]);

  // Add item to cart
  const addToCart = useCallback(async (item: APIMenuItem, quantity: number = 1, notes?: string) => {
    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      image_url: item.image_url,
      category_name: item.category_name,
      icon_url: item.icon_url,
      quantity,
      notes,
      customizations: []
    };

    updateCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(cartItem => cartItem.id === item.id);
      
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
          notes: notes || newItems[existingItemIndex].notes
        };
      } else {
        newItems = [...prevCart.items, cartItem];
      }

      return {
        ...prevCart,
        items: newItems
      };
    });

    // Show cart briefly when item is added (optional)
    if (!isCartOpen) {
      setIsCartOpen(true);
      setTimeout(() => setIsCartOpen(false), 2000);
    }
  }, [updateCart, isCartOpen]);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: number) => {
    updateCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.filter(item => item.id !== itemId)
    }));
  }, [updateCart]);

  // Update item quantity
  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    updateCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }));
  }, [updateCart, removeFromCart]);

  // Update item notes
  const updateItemNotes = useCallback((itemId: number, notes: string) => {
    updateCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item =>
        item.id === itemId ? { ...item, notes } : item
      )
    }));
  }, [updateCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartData(createInitialCart());
    forceUpdate();
  }, [setCartData, forceUpdate]);

  // Get item quantity in cart
  const getItemQuantity = useCallback((itemId: number): number => {
    const item = cartData.items.find(item => item.id === itemId);
    return item?.quantity || 0;
  }, [cartData.items, updateTrigger]); // Include updateTrigger as dependency

  // Check if item is in cart
  const isItemInCart = useCallback((itemId: number): boolean => {
    return cartData.items.some(item => item.id === itemId);
  }, [cartData.items, updateTrigger]); // Include updateTrigger as dependency

  // Create order (simplified - no payment/checkout)
  const createOrder = useCallback(async (notes?: string) => {
    if (cartData.items.length === 0) {
      throw new Error('Carrinho vazio');
    }

    const order: Order = {
      id: crypto.randomUUID(),
      sessionId: cartData.sessionId,
      items: [...cartData.items],
      total: cartData.total,
      status: 'pending',
      createdAt: Date.now(),
      estimatedTime: 15 + (cartData.items.length * 3), // Estimate based on items
      notes
    };

    if (!isOnline) {
      // Save as pending order for later sync
      const offlineOrder: OfflineOrder = {
        id: order.id,
        cart: { ...cartData },
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };
      
      setPendingOrders(prev => [...prev, offlineOrder]);
      clearCart();
      return order;
    }

    try {
      // TODO: Send order to server when online
      console.log('Order created:', order);
      clearCart();
      return order;
    } catch (error) {
      // If online but request fails, save as pending
      const offlineOrder: OfflineOrder = {
        id: order.id,
        cart: { ...cartData },
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      };
      
      setPendingOrders(prev => [...prev, offlineOrder]);
      clearCart();
      throw error;
    }
  }, [cartData, isOnline, setPendingOrders, clearCart]);

  // Sync pending orders when back online
  const syncPendingOrders = useCallback(async () => {
    if (!isOnline || pendingOrders.length === 0) return;

    const syncPromises = pendingOrders
      .filter(order => !order.synced && order.retryCount < 3)
      .map(async (offlineOrder) => {
        try {
          // TODO: Send order to server
          console.log('Syncing order:', offlineOrder.id);
          
          // Mark as synced
          setPendingOrders(prev =>
            prev.map(order =>
              order.id === offlineOrder.id
                ? { ...order, synced: true }
                : order
            )
          );
        } catch (error) {
          // Increment retry count
          setPendingOrders(prev =>
            prev.map(order =>
              order.id === offlineOrder.id
                ? { ...order, retryCount: order.retryCount + 1 }
                : order
            )
          );
        }
      });

    await Promise.allSettled(syncPromises);

    // Remove synced orders older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    setPendingOrders(prev =>
      prev.filter(order => !order.synced || order.timestamp > oneDayAgo)
    );
  }, [isOnline, pendingOrders, setPendingOrders]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingOrders();
    }
  }, [isOnline, syncPendingOrders]);

  // Computed values with memoization
  const computedValues = useMemo(() => {
    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cartData.total);

    return {
      formattedTotal,
      isEmpty: cartData.items.length === 0,
      itemCount: cartData.itemCount,
      total: cartData.total
    };
  }, [cartData.total, cartData.itemCount, cartData.items.length, updateTrigger]);

  return {
    // State
    cart: cartData,
    isCartOpen,
    isCheckoutModalOpen,
    pendingOrders,
    
    // Cart actions
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    clearCart,
    getItemQuantity,
    isItemInCart,
    
    // UI actions
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toggleCart: () => setIsCartOpen(prev => !prev),
    openCheckout: () => setIsCheckoutModalOpen(true),
    closeCheckout: () => setIsCheckoutModalOpen(false),
    
    // Order actions
    createOrder,
    syncPendingOrders,
    
    // Computed values
    ...computedValues
  };
} 