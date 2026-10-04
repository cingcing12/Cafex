import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/config'
import io from 'socket.io-client'

// 🟢 Socket Connection
const socket = io('https://tutto-joyously-alayna.ngrok-free.dev', {
  transports: ['websocket', 'polling'], 
  extraHeaders: { "ngrok-skip-browser-warning": "true" }
});

export const useMainStore = defineStore('main', () => {
  
  // ==========================================
  // 1. STATE
  // ==========================================
  const products = ref([]);
  const categories = ref([]);
  const orders = ref([]);
  const users = ref([]);
  const notifications = ref([]); 
  const staffList = ref([]); // Delivery Staff List
  const cart = ref(JSON.parse(localStorage.getItem('cafex_cart')) || []);
  const wishlist = ref(JSON.parse(localStorage.getItem('cafex_wishlist')) || []);
  const storeReviews = ref(JSON.parse(localStorage.getItem('cafex_reviews')) || []);
  const toasts = ref([]);
  const currentUser = ref(JSON.parse(localStorage.getItem('cafex_current_user')) || null);
  const currentAdmin = ref(JSON.parse(localStorage.getItem('cafex_current_admin')) || null);
  const currentDriver = ref(JSON.parse(localStorage.getItem('cafex_driver_user')) || null); 

  // ==========================================
  // 2. HELPERS
  // ==========================================
  const removeToast = (id) => {
      toasts.value = toasts.value.filter(t => t.id !== id);
  };

  const showToast = (message, type = 'success') => { 
      const id = Date.now(); 
      toasts.value.push({ id, message, type }); 
      setTimeout(() => { removeToast(id) }, 4000);
  };

  const syncCartToDB = async () => {
      localStorage.setItem('cafex_cart', JSON.stringify(cart.value)); 
      if (currentUser.value) {
          try { await api.put('/user/cart', { userId: currentUser.value.id || currentUser.value._id, cart: cart.value }); } catch (e) {}
      }
  };

  const saveLocal = () => { 
      localStorage.setItem('cafex_wishlist', JSON.stringify(wishlist.value)); 
      localStorage.setItem('cafex_reviews', JSON.stringify(storeReviews.value));
      syncCartToDB(); 
  };

  // 🟢 FIXED: Missing Function Added Here
  const getAverageRating = (list) => {
      if (!list || list.length === 0) return 0;
      const sum = list.reduce((acc, r) => acc + Number(r.rating), 0);
      return (sum / list.length).toFixed(1);
  };

  // ==========================================
  // 3. API FETCHERS (Define these BEFORE using in Sockets)
  // ==========================================
  const fetchProducts = async () => { try { const res = await api.get('/products'); products.value = (currentUser.value?.role === 'admin' || currentAdmin.value) ? res.data : res.data.filter(p => p.isActive !== false); } catch (e) {} }
  const fetchCategories = async () => { try { const res = await api.get('/categories'); categories.value = res.data; } catch (e) {} }
  const fetchOrders = async () => { try { const res = await api.get('/orders'); orders.value = res.data.map(o => ({ ...o, id: o._id || o.id, total: Number(o.amount || 0), items: o.items || [] })); } catch (e) {} }
  const fetchUsers = async () => { try { const res = await api.get('/users'); users.value = res.data; } catch (e) {} }
  const fetchStoreReviews = async () => { try { const res = await api.get('/reviews'); storeReviews.value = res.data; } catch (e) {} }
  
  const fetchUserProfile = async () => { 
      if (!currentUser.value) return; 
      try { 
          const res = await api.get('/users'); 
          const freshUser = res.data.find(u => u.email === currentUser.value.email); 
          if (freshUser) { 
              currentUser.value = freshUser; 
              localStorage.setItem('cafex_current_user', JSON.stringify(freshUser)); 
              if (freshUser.savedCart) { cart.value = freshUser.savedCart; localStorage.setItem('cafex_cart', JSON.stringify(cart.value)); }
              if (freshUser.notifications) { notifications.value = freshUser.notifications; }
          } 
      } catch (e) {} 
  }

  const fetchUserCart = async () => { 
      if (!currentUser.value) return; 
      try { 
          const res = await api.get('/users'); 
          const freshUser = res.data.find(u => u.email === currentUser.value.email); 
          if (freshUser && freshUser.savedCart) { 
              cart.value = freshUser.savedCart; 
              localStorage.setItem('cafex_cart', JSON.stringify(cart.value)); 
          } 
      } catch (e) {} 
  };

  const fetchDeliveryStaff = async () => { try { const res = await api.get('/admin/staff'); staffList.value = res.data || []; } catch (e) { staffList.value = []; } }

  // ==========================================
  // 4. COMPUTED PROPERTIES
  // ==========================================
  const loyaltyPoints = computed(() => currentUser.value?.points || 0)
  const pointsInCart = computed(() => cart.value.reduce((total, item) => item.isReward ? total + (100 * item.quantity) : total, 0))
  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
  const myOrders = computed(() => { 
      if (!currentUser.value) return []; 
      return orders.value.filter(o => o.customer?.email?.toLowerCase() === currentUser.value.email?.toLowerCase()).sort((a,b) => new Date(b.date) - new Date(a.date)); 
  });
  const cartTotalValue = computed(() => cart.value.reduce((s, i) => s + (i.price * i.quantity), 0));
  const cartTotalQuantity = computed(() => cart.value.reduce((s, i) => s + i.quantity, 0));

  // ==========================================
  // 5. SHOP ACTIONS
  // ==========================================
  const redeemReward = (product) => {
    if (!currentUser.value) return showToast("Please login to redeem rewards", "error");
    if (loyaltyPoints.value < pointsInCart.value + 100) return showToast(`Not enough points!`, "error");
    if (product.price > 2.5) return showToast("Item must be $2.50 or less.", "error");
    cart.value.push({ ...product, cartId: Date.now() + Math.random().toString(), price: 0, originalPrice: product.price, isReward: true, quantity: 1, options: { size: 'Regular', sugar: '100%', ice: 'Normal' } });
    syncCartToDB(); showToast(`Redeemed ${product.name}!`, "success");
  }

  const addToCart = (product, quantity = 1, options = {}) => { 
      const cat = categories.value.find(c => c.name === product.category);
      const group = cat ? cat.group : 'Drinks'; 
      let finalOptions = { note: options.note || '' };
      if (group === 'Drinks') { finalOptions.size = options.size || 'Regular'; finalOptions.sugar = options.sugar || '100%'; finalOptions.ice = options.ice || 'Normal'; } 
      else if (group === 'Food') { finalOptions.temperature = options.temperature || 'Warm'; finalOptions.cutlery = options.cutlery || 'No'; }
      const optionsSignature = JSON.stringify(finalOptions);
      const existingItem = cart.value.find(i => i.id === product.id && !i.isReward && JSON.stringify(i.options) === optionsSignature);
      if(existingItem) { existingItem.quantity += quantity; } 
      else { cart.value.push({ ...product, cartId: Date.now() + Math.random().toString(), quantity: quantity, isReward: false, options: finalOptions }); }
      syncCartToDB(); showToast("Added to cart"); 
  }

  const incrementItem = (cartId) => { const item = cart.value.find(x => x.cartId === cartId); if (!item) return; if (item.isReward && loyaltyPoints.value < (pointsInCart.value + 100)) { showToast(`Not enough points!`, "error"); return; } item.quantity++; syncCartToDB(); }
  const decrementItem = (cartId) => { const i = cart.value.find(x => x.cartId === cartId); if(i) { if(i.quantity > 1) { i.quantity--; syncCartToDB(); } else { removeFromCart(cartId); } } }
  const removeFromCart = (cartId) => { cart.value = cart.value.filter(x => x.cartId !== cartId); syncCartToDB(); }
  const reOrder = (items) => { cart.value = []; items.forEach(i => { cart.value.push({ ...i, cartId: Date.now() + Math.random().toString() }); }); syncCartToDB(); showToast("Reordered!"); }
  const toggleWishlist = (p) => { const i = wishlist.value.findIndex(x => x.id === p.id); if(i !== -1) wishlist.value.splice(i,1); else wishlist.value.push(p); saveLocal(); }
  const isInWishlist = (id) => wishlist.value.some(p => p.id === id);

  // ==========================================
  // 6. ORDER & PAYMENT ACTIONS
  // ==========================================
  const createOrder = async (method, orderPayload) => {
    try {
        const res = await api.post('/create-order', orderPayload);
        if (res.data.newPoints !== undefined && currentUser.value) { 
            currentUser.value.points = res.data.newPoints; 
            localStorage.setItem('cafex_current_user', JSON.stringify(currentUser.value)); 
        }
        if(method === 'cash' || res.data.amount === 0) { fetchOrders(); cart.value = []; syncCartToDB(); }
        return res.data; 
    } catch (e) { throw e; }
  }

  const checkPaymentStatus = async (md5) => { 
      try { 
          const res = await api.post('/check-status', { md5 }); 
          if (res.data.status === 'success') { 
              if (res.data.newPoints !== undefined && currentUser.value) { 
                  currentUser.value.points = res.data.newPoints; 
                  localStorage.setItem('cafex_current_user', JSON.stringify(currentUser.value)); 
              } 
              fetchOrders(); 
          } 
          return res.data; 
      } catch { return { status: 'error' }; } 
  }

  // ==========================================
  // 7. DRIVER ACTIONS
  // ==========================================
  const generateDriverQR = async (orderId) => { try { const res = await api.post('/driver/generate-qr', { orderId }); return res.data; } catch (e) { showToast("Failed to generate QR", "error"); throw e; } };
  
  const updateDriverProfile = async (id, formData) => { 
      try { 
          const res = await api.put(`/delivery/profile/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
          currentDriver.value = res.data.staff; 
          localStorage.setItem('cafex_driver_user', JSON.stringify(res.data.staff)); 
          showToast("Profile Updated!"); 
          return true; 
      } catch (e) { showToast("Failed update", "error"); return false; } 
  };

  const loginDriver = async (c) => { try { const res = await api.post('/delivery/login', c); currentDriver.value = res.data.staff; localStorage.setItem('cafex_driver_user', JSON.stringify(res.data.staff)); return true; } catch (e) { return false; } }
  const logoutDriver = () => { currentDriver.value = null; localStorage.removeItem('cafex_driver_user'); }
  const completeDelivery = async (id) => { try { await api.put(`/delivery/confirm-payment/${id}`); showToast("Order Completed & Paid!"); await fetchOrders(); } catch (e) {} }
  const addDeliveryStaff = async (formData) => { 
    try { 
        // Note: Do not manually set Content-Type for FormData, axios/browser does it automatically
        await api.post('/admin/staff', formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
        await fetchDeliveryStaff(); 
        showToast("Staff Added!"); 
        return true; 
    } catch (e) { return false; } 
}
  const updateDeliveryStaff = async (id, formData) => { 
    try { 
        await api.put(`/admin/staff/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
        await fetchDeliveryStaff(); 
        showToast("Staff Updated!"); 
        return true; 
    } catch (e) { return false; } 
}
  const deleteDeliveryStaff = async (id) => { try { await api.delete(`/admin/staff/${id}`); staffList.value = staffList.value.filter(s => s._id !== id); showToast("Staff Deleted!"); return true; } catch (e) { return false; } }

  // ==========================================
  // 8. AUTH ACTIONS
  // ==========================================
  const loginCustomer = async (e, p) => { try { const u = (await api.post('/login', { email:e, password:p })).data.user; if (u.role === 'admin') return false; currentUser.value = u; localStorage.setItem('cafex_current_user', JSON.stringify(u)); if (u.savedCart) cart.value = u.savedCart; if (u.notifications) notifications.value = u.notifications; await fetchOrders(); return true; } catch(err) { showToast("Login Failed", "error"); return false; } }
  const verifyLoginOTP = async (email, otp) => { try { const res = await api.post('/verify-login-otp', { email, otp }); if (res.data.user) { currentUser.value = res.data.user; localStorage.setItem('cafex_current_user', JSON.stringify(res.data.user)); if (res.data.user.savedCart) cart.value = res.data.user.savedCart; if (res.data.user.notifications) notifications.value = res.data.user.notifications; return true; } return false; } catch (e) { showToast("Invalid Code", "error"); return false; } }
  const googleAuth = async (token) => { try { const res = await api.post('/google-login', { token }); if (res.data.requireOtp) { return { requireOtp: true, action: res.data.action, email: res.data.email }; } return { success: false, error: "Unexpected state" }; } catch (e) { return { success: false, error: "Google Login Failed" }; } }
  const logoutUser = () => { currentUser.value = null; cart.value = []; orders.value = []; wishlist.value = []; notifications.value = []; localStorage.removeItem('cafex_current_user'); localStorage.removeItem('cafex_cart'); localStorage.removeItem('cafex_wishlist'); location.href = '/login'; }
  const loginStep1 = async (email, password) => { try { const res = await api.post('/login', { email, password }); if (res.data.requireOtp) return { success: true, requireOtp: true }; return { success: false }; } catch (e) { return { success: false, error: "Login failed" }; } }
  const sendOTP = async (userData) => { try { await api.post('/send-otp', userData); return true; } catch (e) { return "Failed to send OTP"; } }
  const verifyOTPAndRegister = async (email, otp) => { try { const res = await api.post('/verify-otp', { email, otp }); if (res.data.user) { currentUser.value = res.data.user; localStorage.setItem('cafex_current_user', JSON.stringify(res.data.user)); showToast("Welcome!", "success"); return true; } return false; } catch (e) { return false; } }
  const forgotPassword = async (email) => { try { await api.post('/forgot-password', { email }); return true; } catch (e) { return "Failed to send code"; } }
  const resetPassword = async (email, otp, newPassword) => { try { await api.post('/reset-password', { email, otp, newPassword }); return true; } catch (e) { return "Failed to reset"; } }
  const verifyResetCode = async (email, otp) => { try { await api.post('/verify-reset-code', { email, otp }); return true; } catch (e) { return false; } }
  const requestPasswordChangeOTP = async (email) => { try { await api.post('/request-password-change', { email }); return true; } catch (e) { showToast("Failed to send OTP", "error"); return false; } }
  const verifyPasswordChange = async (email, otp, newPassword) => { try { await api.post('/verify-password-change', { email, otp, newPassword }); return true; } catch (e) { showToast("Failed to update", "error"); return false; } }

  // ==========================================
  // 9. ADMIN ACTIONS
  // ==========================================
  const updateProfile = async (formData) => { try { const id = currentUser.value._id || currentUser.value.id; const res = await api.put(`/user/profile/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); currentUser.value = res.data.user; localStorage.setItem('cafex_current_user', JSON.stringify(currentUser.value)); return true; } catch (e) { return false; } }
  const updateOrderStatus = async (id, updates) => { try { await api.put(`/orders/${id}/status`, updates); const o = orders.value.find(x => x.id === id); if(o) Object.assign(o, updates); showToast("Updated"); } catch(e){} }
  const loginAdmin = async (e, p) => { try { const u = (await api.post('/login', { email:e, password:p })).data.user; if(u.role !== 'admin') return false; currentAdmin.value = u; localStorage.setItem('cafex_current_admin', JSON.stringify(u)); return true; } catch(err) { showToast("Login Failed", "error"); return false; } }
  const logoutAdmin = () => { currentAdmin.value = null; localStorage.removeItem('cafex_current_admin'); location.href = '/admin/login'; }
  const toggleProductActive = async (id, isActive) => { try { await api.put(`/products/${id}/toggle-active`, { isActive }); const p = products.value.find(x => x.id === id); if (p) p.isActive = isActive; showToast(isActive ? "Product Activated" : "Product Deactivated", "info"); return true; } catch (e) { return false; } }
  const addCategory = async (d) => { try { await api.post('/categories', d, {headers:{'Content-Type':'multipart/form-data'}}); categories.value.push(d); showToast("Added"); return true;} catch(e){return false}}
  const updateCategory = async (id,d) => { try { await api.put(`/categories/${id}`, d, {headers:{'Content-Type':'multipart/form-data'}}); await fetchCategories(); return true;} catch(e){return false}}
  const deleteCategory = async (id) => { try { await api.delete(`/categories/${id}`); categories.value = categories.value.filter(c => c.id !== id); } catch(e){} }
  const addProduct = async (d) => { try { await api.post('/products', d, {headers:{'Content-Type':'multipart/form-data'}}); await fetchProducts(); showToast("Added"); return true;} catch(e){return false}}
  const updateProduct = async (id,d) => { try { await api.put(`/products/${id}`, d, {headers:{'Content-Type':'multipart/form-data'}}); await fetchProducts(); return true;} catch(e){return false}}
  const deleteProduct = async (id) => { try { await api.delete(`/products/${id}`); products.value = products.value.filter(p => p.id !== id); } catch(e){} }
  const deleteOrder = async (id) => { try { await api.delete(`/orders/${id}`); orders.value = orders.value.filter(o => o.id !== id); showToast("Deleted"); } catch(e){} }
  const addStoreReview = async (rating, comment) => { try { const userName = currentUser.value?.name || "Guest"; const res = await api.post('/reviews', { user: userName, rating, comment }); storeReviews.value.unshift(res.data); showToast("Thank you!", "success"); return true; } catch (e) { return false; } }
  const addProductReview = async (productId, rating, comment) => { try { const userName = currentUser.value?.name || "Guest"; const res = await api.post(`/products/${productId}/reviews`, { user: userName, rating, comment }); const product = products.value.find(p => p.id === productId || p._id === productId); if (product) { if (!product.reviews) product.reviews = []; product.reviews.push(res.data.review); } showToast("Thanks!", "success"); return true; } catch (e) { return false; } }
  const markNotificationRead = async (notificationId) => { const notif = notifications.value.find(n => n.id === notificationId); if (notif) notif.isRead = true; if (currentUser.value) { try { await api.put('/user/notifications/read', { userId: currentUser.value.id || currentUser.value._id, notificationId }); } catch(e) {} } };

  // ==========================================
  // 10. SOCKET EVENT HANDLERS (PLACED LAST)
  // ==========================================
  
  socket.on("product-status-changed", async (data) => {
      const p = products.value.find(x => x.id === data.productId);
      if (p) p.isActive = data.isActive;
      if (!data.isActive) {
          const hasItem = cart.value.some(item => String(item.id) === String(data.productId) || String(item.product) === String(data.productId));
          if (hasItem && !currentUser.value) {
              cart.value = cart.value.filter(item => String(item.id) !== String(data.productId));
              saveLocal(); showToast("Item removed (Out of Stock)", "warning");
          }
      }
  });

  

 socket.on("cart-updated", async (data) => {
      if (!currentUser.value) return;
      
      const myEmail = currentUser.value.email?.toLowerCase().trim();
      const targetEmail = data.email?.toLowerCase().trim();

      if (myEmail && myEmail === targetEmail) {
          console.log("🔔 Received Personal Update:", data);

          // 1. UPDATE CART IMMEDIATELY
          if (data.cart) {
              cart.value = [...data.cart]; // Create a new array reference to trigger reactivity
              currentUser.value.savedCart = [...data.cart];
              localStorage.setItem('cafex_cart', JSON.stringify(cart.value));
              localStorage.setItem('cafex_current_user', JSON.stringify(currentUser.value));
          }

          // 2. UPDATE NOTIFICATIONS
          if (data.notifications) {
              notifications.value = [...data.notifications];
              currentUser.value.notifications = [...data.notifications];
          }

          // 3. SHOW TOAST (If Alert)
          const latest = data.notifications?.[0];
          if (latest && latest.type === 'alert' && !latest.isRead) {
               showToast(latest.message, "warning");
          }
      }
  });

  socket.on("staff-status-changed", (data) => {
      const staff = staffList.value.find(s => s._id === data.id);
      if (staff) {
          staff.status = data.status;
          if(data.rating) staff.rating = data.rating; 
      }
  });

  socket.on("payment-success", () => fetchOrders());
  socket.on("order-updated", () => fetchOrders());
  
  socket.on("request-driver-rating", (data) => {
      // Logic: Only show if I am the intended user
      if (currentUser.value && currentUser.value.email === data.userEmail) {
          
          // 1. Add to local notification list immediately
          const newNote = { 
              id: Date.now(), 
              title: "Order Delivered!", 
              message: "Please rate your driver.", 
              type: "rating", 
              data: { staffId: data.staffId },
              isRead: false, 
              createdAt: new Date() 
          };
          
          notifications.value.unshift(newNote);
          currentUser.value.notifications = notifications.value;
          localStorage.setItem('cafex_current_user', JSON.stringify(currentUser.value));

          // 2. Show Toast
          showToast("Order Delivered! Please rate your driver.", "success");

          // 3. Trigger Modal via Event (UserRatingModal.vue listens for this)
          window.dispatchEvent(new CustomEvent('open-rating-modal', { detail: { staffId: data.staffId } }));
      }
  });

  // Init
  fetchProducts(); fetchCategories(); fetchStoreReviews(); if(currentUser.value) { fetchUserCart(); fetchUserProfile(); }

  return {
    products, categories, orders, users, storeReviews, cart, wishlist, toasts, notifications, staffList, currentUser, currentAdmin, currentDriver,
    loginAdmin, loginCustomer, logoutUser, logoutAdmin, updateProfile, sendOTP, verifyOTPAndRegister, loginStep1, verifyLoginOTP, googleAuth,
    requestPasswordChangeOTP, verifyPasswordChange, forgotPassword, resetPassword, verifyResetCode, addToCart, incrementItem, decrementItem, removeFromCart, createOrder, checkPaymentStatus, 
    addStoreReview, getAverageRating, toggleWishlist, isInWishlist, showToast, removeToast, reOrder, redeemReward, cartTotalQuantity, cartTotalValue, loyaltyPoints, myOrders, fetchUserProfile, addProductReview, fetchStoreReviews, pointsInCart, 
    syncCartToDB, fetchUserCart, markNotificationRead, unreadCount, fetchProducts, fetchCategories, fetchOrders, fetchUsers, addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct, updateOrderStatus, deleteOrder, toggleProductActive, 
    fetchDeliveryStaff, completeDelivery, addDeliveryStaff, updateDeliveryStaff, deleteDeliveryStaff, loginDriver, logoutDriver,
    generateDriverQR, updateDriverProfile
  }
});