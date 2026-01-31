import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMainStore = defineStore('main', () => {
  
  // ==========================================
  // 1. STATE
  // ==========================================

  const users = ref(JSON.parse(localStorage.getItem('cafex_users')) || [
    { id: 1, name: 'Admin User', email: 'admin@cafex.com', phone: '012345678', password: '123', role: 'admin', savedCart: [], savedWishlist: [], pointsUsed: 0 },
    { id: 2, name: 'John Doe', email: 'user@cafex.com', phone: '098765432', password: '123', role: 'customer', savedCart: [], savedWishlist: [], pointsUsed: 0 }
  ])

  const products = ref(JSON.parse(localStorage.getItem('cafex_products')) || [
    { id: 1, name: 'Cappuccino', category: 'Coffee', price: 3.50, desc: 'Rich espresso with steamed milk foam.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600', reviews: [] },
    { id: 2, name: 'Iced Matcha', category: 'Tea', price: 4.00, desc: 'Premium Japanese Matcha.', image: 'https://vancouverwithlove.com/wp-content/uploads/2025/03/iced-matcha-latte-8.jpg', reviews: [] },
    { id: 3, name: 'Cheesecake', category: 'Desserts', price: 4.50, desc: 'Classic NY Style Cheesecake.', image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600', reviews: [] },
    { id: 4, name: 'Avocado Toast', category: 'Snacks', price: 5.50, desc: 'Sourdough bread.', image: 'https://whatsgabycooking.com/wp-content/uploads/2023/01/Master.jpg', reviews: [] },
    { id: 5, name: 'Espresso Shot', category: 'Coffee', price: 2.00, desc: 'Pure energy in a cup.', image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600', reviews: [] },
  ])

  const storeReviews = ref(JSON.parse(localStorage.getItem('cafex_store_reviews')) || [])
  const orders = ref(JSON.parse(localStorage.getItem('cafex_orders')) || [])
  const cart = ref(JSON.parse(localStorage.getItem('cafex_cart')) || [])
  const wishlist = ref(JSON.parse(localStorage.getItem('cafex_wishlist')) || [])
  
  const currentUser = ref(JSON.parse(localStorage.getItem('cafex_current_user')) || null)
  
  // Safety: Initialize pointsUsed if missing
  if(currentUser.value && typeof currentUser.value.pointsUsed === 'undefined') {
      currentUser.value.pointsUsed = 0
  }

  const currentAdmin = ref(JSON.parse(localStorage.getItem('cafex_current_admin')) || null)
  const toasts = ref([]) 

  // ==========================================
  // 2. HELPER
  // ==========================================
  const saveToStorage = () => {
    if (currentUser.value) {
      const userIndex = users.value.findIndex(u => String(u.id) === String(currentUser.value.id))
      if (userIndex !== -1) {
        users.value[userIndex].savedCart = cart.value
        users.value[userIndex].savedWishlist = wishlist.value
        users.value[userIndex].pointsUsed = currentUser.value.pointsUsed || 0
      }
    }
    localStorage.setItem('cafex_users', JSON.stringify(users.value))
    localStorage.setItem('cafex_products', JSON.stringify(products.value))
    localStorage.setItem('cafex_store_reviews', JSON.stringify(storeReviews.value))
    localStorage.setItem('cafex_orders', JSON.stringify(orders.value))
    localStorage.setItem('cafex_cart', JSON.stringify(cart.value))
    localStorage.setItem('cafex_wishlist', JSON.stringify(wishlist.value))
    
    if(currentUser.value) localStorage.setItem('cafex_current_user', JSON.stringify(currentUser.value))
    else localStorage.removeItem('cafex_current_user')

    if(currentAdmin.value) localStorage.setItem('cafex_current_admin', JSON.stringify(currentAdmin.value))
    else localStorage.removeItem('cafex_current_admin')
  }

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => { removeToast(id) }, 3000)
  }

  const removeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id) }

  // ==========================================
  // 3. COMPUTED (FIXED LOGIC)
  // ==========================================
  const myOrders = computed(() => { 
    if(!currentUser.value) return []
    // *** FIX: Convert both IDs to String to ensure they match ***
    return orders.value
      .filter(o => String(o.userId) === String(currentUser.value.id))
      .sort((a,b)=>new Date(b.date)-new Date(a.date)) 
  })

  const loyaltyPoints = computed(() => { 
    if(!currentUser.value) return 0
    
    const validOrders = myOrders.value.filter(o => o.status !== 'Cancelled')
    const earned = validOrders.length * 10
    const used = currentUser.value.pointsUsed || 0
    
    // *** FIX: If Used > Earned (Bad Data), reset visible points to 0 but don't show negative ***
    // Ideally, we should fix 'used', but for display, blocking negative is enough.
    const balance = earned - used
    
    return Math.max(0, balance)
  })

  // ==========================================
  // 4. ACTIONS
  // ==========================================
  
  // *** NEW: RESET DATA ACTION (To fix your broken state) ***
  const resetAllData = () => {
      localStorage.clear()
      window.location.reload()
  }

  const register = (userData) => { 
    userData.id = Date.now()
    userData.role = 'customer'
    userData.savedCart = [] 
    userData.savedWishlist = []
    userData.pointsUsed = 0 
    users.value.push(userData)
    saveToStorage()
    return true 
  }

  const loginCustomer = (id, pw) => { 
    const u = users.value.find(u => (u.email === id || u.phone === id) && u.password === pw)
    if (u && u.role === 'customer') { 
      currentUser.value = u
      if(typeof currentUser.value.pointsUsed === 'undefined') currentUser.value.pointsUsed = 0
      cart.value = u.savedCart || []
      wishlist.value = u.savedWishlist || []
      saveToStorage()
      return true 
    } 
    return false 
  }

  const loginAdmin = (id, pw) => { 
    const u = users.value.find(u => (u.email === id || u.phone === id) && u.password === pw)
    if (u && u.role === 'admin') { currentAdmin.value = u; saveToStorage(); return true } 
    return false 
  }
  
  const logoutUser = () => { 
      saveToStorage()
      currentUser.value = null
      cart.value = []
      wishlist.value = []
      localStorage.removeItem('cafex_cart')
      localStorage.removeItem('cafex_wishlist')
      localStorage.removeItem('cafex_current_user')
      showToast('Logged out', 'info') 
  }

  const logoutAdmin = () => { currentAdmin.value = null; saveToStorage() }
  const logout = () => { if (currentUser.value) logoutUser(); if (currentAdmin.value) logoutAdmin() }
  const updateProfile = (data) => { if(!currentUser.value) return; currentUser.value = {...currentUser.value, ...data}; const idx = users.value.findIndex(u => u.id === currentUser.value.id); if(idx!==-1) users.value[idx] = currentUser.value; saveToStorage() }

  const addToCart = (product) => {
    if (!currentUser.value) { showToast('Please login to shop!', 'error'); return }
    const existing = cart.value.find(item => item.id === product.id && !item.isReward)
    if (existing) existing.quantity++
    else cart.value.push({ ...product, quantity: 1 })
    saveToStorage() 
    showToast(`${product.name} added to cart!`, 'success')
  }

  const redeemReward = (product) => {
    if (!currentUser.value) { showToast('Login required', 'error'); return false }
    if (loyaltyPoints.value < 100) { showToast('Not enough points!', 'error'); return false }
    if (product.price > 2.50) { showToast('Product price too high', 'error'); return false }

    const rewardId = `reward_${product.id}`
    currentUser.value.pointsUsed = (currentUser.value.pointsUsed || 0) + 100

    const existing = cart.value.find(item => item.id === rewardId)
    if (existing) {
        existing.quantity++
    } else {
        const rewardItem = {
          ...product,
          id: rewardId, 
          price: 0.00,
          originalPrice: product.price,
          quantity: 1,
          isReward: true,
          name: `${product.name} (Free Reward)`
        }
        cart.value.push(rewardItem)
    }
    
    saveToStorage()
    showToast(`Redeemed ${product.name} for 100 points!`, 'success')
    return true 
  }

  const incrementItem = (id) => { 
      const item = cart.value.find(i => i.id === id)
      if(item) { 
          if(item.isReward) {
              if(loyaltyPoints.value < 100) {
                  showToast('Not enough points to add another!', 'error')
                  return
              }
              currentUser.value.pointsUsed = (currentUser.value.pointsUsed || 0) + 100
          }
          item.quantity++ 
          saveToStorage() 
      } 
  }

  const decrementItem = (id) => { 
      const item = cart.value.find(i => i.id === id)
      if(item) { 
          if(item.quantity > 1) { 
              item.quantity--
              if(item.isReward) {
                  currentUser.value.pointsUsed = Math.max(0, (currentUser.value.pointsUsed || 0) - 100)
              }
              saveToStorage() 
          } else { 
              removeFromCart(id) 
          } 
      } 
  }

  const removeFromCart = (id) => { 
    const item = cart.value.find(i => i.id === id)
    if (item && item.isReward) {
        const pointsToRefund = item.quantity * 100
        currentUser.value.pointsUsed = Math.max(0, (currentUser.value.pointsUsed || 0) - pointsToRefund)
        showToast(`Refunded ${pointsToRefund} points`, 'info')
    }
    cart.value = cart.value.filter(item => item.id !== id)
    saveToStorage() 
  }

  const reOrder = (items) => { if (!currentUser.value) { showToast('Login required!', 'error'); return } items.forEach(i => { const ex = cart.value.find(c => c.id === i.id); if(ex) ex.quantity += i.quantity; else cart.value.push({...i}) }); saveToStorage(); showToast('Items added to cart!', 'success') }

  // *** PLACE ORDER (Double Check) ***
  const placeOrder = (paymentType, deliveryDetails, saveInfo = false) => {
    if (cart.value.length === 0) return
    
    const newOrder = {
      id: Date.now(),
      // Ensure we use the exact same ID format as the User Object
      userId: currentUser.value ? currentUser.value.id : 'guest', 
      userName: currentUser.value ? currentUser.value.name : 'Guest',
      items: [...cart.value],
      total: cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'Pending',
      paymentMethod: paymentType,
      delivery: { ...deliveryDetails },
      date: new Date().toISOString()
    }
    
    // Replace array to force reactivity update
    orders.value = [...orders.value, newOrder]
    
    cart.value = [] 
    
    if (saveInfo && currentUser.value) { 
        updateProfile({ 
            phone: deliveryDetails.phone, 
            address: deliveryDetails.address 
        }) 
    }
    
    saveToStorage()
    
    // Calculate new total points to show in toast
    const validOrders = orders.value.filter(o => String(o.userId) === String(currentUser.value.id) && o.status !== 'Cancelled')
    const currentPoints = (validOrders.length * 10) - (currentUser.value.pointsUsed || 0)

    showToast(`Order placed! Total Points: ${currentPoints}`, 'success')
    
    return newOrder.id
  }

  const cancelOrder = (orderId) => { const order = orders.value.find(o => o.id === orderId); if (order && order.status === 'Pending') { order.status = 'Cancelled'; saveToStorage(); showToast('Order cancelled', 'info') } else { showToast('Cannot cancel', 'error') } }
  const deleteOrder = (orderId) => { orders.value = orders.value.filter(o => o.id !== orderId); saveToStorage(); showToast('Order deleted', 'info') }
  const deleteUser = (userId) => { if (currentUser.value && currentUser.value.id === userId) { showToast('Cannot delete self', 'error'); return } users.value = users.value.filter(u => u.id !== userId); saveToStorage(); showToast('User deleted', 'info') }
  const updateOrderStatus = (id, s) => { const o = orders.value.find(x => x.id === id); if(o) { o.status = s; saveToStorage() } }
  
  const addProduct = (p) => { products.value.push({...p, id: Date.now(), reviews:[]}); saveToStorage() }
  const deleteProduct = (id) => { products.value = products.value.filter(p => p.id !== id); saveToStorage() }
  const addProductReview = (pid, r, c) => { if(!currentUser.value){ showToast('Login to review','error'); return } const p = products.value.find(x=>x.id===pid); if(p){ if(!p.reviews) p.reviews=[]; p.reviews.push({id:Date.now(), user:currentUser.value.name, rating:r, comment:c, date:new Date().toLocaleDateString()}); saveToStorage(); showToast('Review added!') } }
  const addStoreReview = (r, c) => { if(!currentUser.value){ showToast('Login to review','error'); return } storeReviews.value.push({id:Date.now(), user:currentUser.value.name, rating:r, comment:c, date:new Date().toLocaleDateString()}); saveToStorage(); showToast('Feedback sent!') }
  const getAverageRating = (arr) => { if(!arr || arr.length===0) return 0; return (arr.reduce((s,r)=>s+r.rating,0)/arr.length).toFixed(1) }
  const toggleWishlist = (product) => { if (!currentUser.value) { showToast('Login required', 'error'); return } const index = wishlist.value.findIndex(p => p.id === product.id); if (index !== -1) { wishlist.value.splice(index, 1); showToast('Removed from Wishlist', 'success') } else { wishlist.value.push(product); showToast('Added to Wishlist', 'success') } saveToStorage() }
  const isInWishlist = (id) => wishlist.value.some(p => p.id === id)
  const cartTotalQuantity = computed(() => cart.value.reduce((total, item) => total + item.quantity, 0))


  return { 
    users, products, orders, cart, storeReviews, wishlist,
    currentUser, currentAdmin, toasts, 
    saveToStorage, showToast, removeToast, resetAllData, // Exported reset
    register, loginCustomer, loginAdmin, logoutUser, logoutAdmin, logout, updateProfile,
    addToCart, incrementItem, decrementItem, removeFromCart, reOrder, placeOrder, 
    cancelOrder, deleteOrder, deleteUser,
    updateOrderStatus, addProduct, deleteProduct,
    addProductReview, addStoreReview, getAverageRating, cartTotalQuantity,
    toggleWishlist, isInWishlist, redeemReward,
    myOrders, loyaltyPoints
  }
})