import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMainStore = defineStore('main', () => {
  
  // ==========================================
  // 1. STATE (Initialized from LocalStorage)
  // ==========================================

  // Users Database
  const users = ref(JSON.parse(localStorage.getItem('cafex_users')) || [
    { id: 1, name: 'Admin User', email: 'admin@cafex.com', phone: '012345678', password: '123', role: 'admin', savedCart: [], savedWishlist: [] },
    { id: 2, name: 'John Doe', email: 'user@cafex.com', phone: '098765432', password: '123', role: 'customer', savedCart: [], savedWishlist: [] }
  ])

  // Products Database
  const products = ref(JSON.parse(localStorage.getItem('cafex_products')) || [
    { id: 1, name: 'Cappuccino', category: 'Coffee', price: 3.50, desc: 'Rich espresso with steamed milk foam.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600', reviews: [] },
    { id: 2, name: 'Iced Matcha', category: 'Tea', price: 4.00, desc: 'Premium Japanese Matcha.', image: 'https://images.unsplash.com/photo-1515823664972-6d9094fb9430?w=600', reviews: [] },
    { id: 3, name: 'Cheesecake', category: 'Desserts', price: 4.50, desc: 'Classic NY Style Cheesecake.', image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600', reviews: [] },
    { id: 4, name: 'Avocado Toast', category: 'Snacks', price: 5.50, desc: 'Sourdough bread.', image: 'https://images.unsplash.com/photo-1588137372308-15f75323a4dd?w=600', reviews: [] },
  ])

  const storeReviews = ref(JSON.parse(localStorage.getItem('cafex_store_reviews')) || [])
  const orders = ref(JSON.parse(localStorage.getItem('cafex_orders')) || [])
  
  // *** ACTIVE SESSION STATE ***
  // These are temporary holders for the current logged-in user
  const cart = ref(JSON.parse(localStorage.getItem('cafex_cart')) || [])
  const wishlist = ref(JSON.parse(localStorage.getItem('cafex_wishlist')) || [])

  const currentUser = ref(JSON.parse(localStorage.getItem('cafex_current_user')) || null)
  const currentAdmin = ref(JSON.parse(localStorage.getItem('cafex_current_admin')) || null)
  
  const toasts = ref([]) 


  // ==========================================
  // 2. HELPER: SAVE TO LOCAL STORAGE
  // ==========================================
  const saveToStorage = () => {
    // 1. If User is Logged In -> Sync active cart/wishlist to their User Profile
    if (currentUser.value) {
      const userIndex = users.value.findIndex(u => u.id === currentUser.value.id)
      if (userIndex !== -1) {
        users.value[userIndex].savedCart = cart.value
        users.value[userIndex].savedWishlist = wishlist.value
        // Also update the local currentUser ref to match
        currentUser.value.savedCart = cart.value
        currentUser.value.savedWishlist = wishlist.value
      }
    }

    localStorage.setItem('cafex_users', JSON.stringify(users.value))
    localStorage.setItem('cafex_products', JSON.stringify(products.value))
    localStorage.setItem('cafex_store_reviews', JSON.stringify(storeReviews.value))
    localStorage.setItem('cafex_orders', JSON.stringify(orders.value))
    
    // Save active session state (so it survives page refresh)
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

  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }


  // ==========================================
  // 3. ACTIONS: AUTHENTICATION
  // ==========================================
  const register = (userData) => { 
    userData.id = Date.now()
    userData.role = 'customer'
    userData.savedCart = [] // Init empty cart
    userData.savedWishlist = [] // Init empty wishlist
    users.value.push(userData)
    saveToStorage()
    return true 
  }

  const loginCustomer = (id, pw) => { 
    const u = users.value.find(u => (u.email === id || u.phone === id) && u.password === pw)
    if (u && u.role === 'customer') { 
      currentUser.value = u
      
      // *** LOAD USER CART & WISHLIST ***
      cart.value = u.savedCart || []
      wishlist.value = u.savedWishlist || []
      
      saveToStorage()
      return true 
    } 
    return false 
  }

  const loginAdmin = (id, pw) => { 
    const u = users.value.find(u => (u.email === id || u.phone === id) && u.password === pw)
    if (u && u.role === 'admin') { 
      currentAdmin.value = u
      saveToStorage()
      return true 
    } 
    return false 
  }

  const logoutUser = () => { 
    // Save current state before clearing
    saveToStorage() 
    
    currentUser.value = null
    // Clear active session
    cart.value = []
    wishlist.value = []
    
    // Force local storage clear for session items
    localStorage.removeItem('cafex_cart')
    localStorage.removeItem('cafex_wishlist')
    localStorage.removeItem('cafex_current_user')
    
    showToast('Logged out successfully', 'info')
  }

  const logoutAdmin = () => { 
    currentAdmin.value = null
    saveToStorage()
  }

  const logout = () => { 
    // Generic logout handles both
    if (currentUser.value) logoutUser()
    if (currentAdmin.value) logoutAdmin()
  }
  
  const updateProfile = (data) => { 
    if(!currentUser.value) return
    currentUser.value = {...currentUser.value, ...data}
    const idx = users.value.findIndex(u => u.id === currentUser.value.id)
    if(idx!==-1) users.value[idx] = currentUser.value
    saveToStorage() 
  }


  // ==========================================
  // 4. ACTIONS: CART & SHOPPING
  // ==========================================
  const addToCart = (product) => {
    if (!currentUser.value) { showToast('Please login to shop!', 'error'); return }
    const existing = cart.value.find(item => item.id === product.id)
    if (existing) existing.quantity++
    else cart.value.push({ ...product, quantity: 1 })
    saveToStorage() // This saves to user profile now
    showToast(`${product.name} added to cart!`, 'success')
  }

  const incrementItem = (id) => { 
    const item = cart.value.find(i => i.id === id)
    if(item) { item.quantity++; saveToStorage() } 
  }

  const decrementItem = (id) => { 
    const item = cart.value.find(i => i.id === id)
    if(item) { 
      if(item.quantity > 1) { item.quantity--; saveToStorage() } 
      else { removeFromCart(id) } 
    } 
  }

  const removeFromCart = (id) => { 
    cart.value = cart.value.filter(item => item.id !== id)
    saveToStorage() 
  }

  const reOrder = (items) => { 
    if (!currentUser.value) { showToast('Login required!', 'error'); return } 
    items.forEach(i => { 
      const ex = cart.value.find(c => c.id === i.id)
      if(ex) ex.quantity += i.quantity
      else cart.value.push({...i}) 
    })
    saveToStorage()
    showToast('Items added to cart!', 'success') 
  }


  // ==========================================
  // 5. ACTIONS: ORDER MANAGEMENT
  // ==========================================
  const placeOrder = (paymentType, deliveryDetails, saveInfo = false) => {
    if (cart.value.length === 0) return

    const newOrder = {
      id: Date.now(),
      userId: currentUser.value ? currentUser.value.id : 'guest',
      userName: currentUser.value ? currentUser.value.name : 'Guest',
      items: [...cart.value],
      total: cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'Pending',
      paymentMethod: paymentType,
      delivery: { ...deliveryDetails },
      date: new Date().toISOString()
    }

    orders.value.push(newOrder)
    cart.value = [] // Empty cart after order

    if (saveInfo && currentUser.value) {
      updateProfile({
        phone: deliveryDetails.phone,
        address: deliveryDetails.address
      })
    }

    saveToStorage() // Updates user profile to have empty cart
    return newOrder.id
  }
  
  const cancelOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order && order.status === 'Pending') {
      order.status = 'Cancelled'
      saveToStorage()
      showToast('Order cancelled successfully', 'info')
    } else {
      showToast('Cannot cancel this order', 'error')
    }
  }

  const deleteOrder = (orderId) => {
    orders.value = orders.value.filter(o => o.id !== orderId)
    saveToStorage()
    showToast('Order permanently deleted.', 'info')
  }

  const deleteUser = (userId) => {
    if (currentUser.value && currentUser.value.id === userId) {
      showToast('You cannot delete your own account.', 'error')
      return
    }
    users.value = users.value.filter(u => u.id !== userId)
    saveToStorage()
    showToast('User account deleted.', 'info')
  }

  const updateOrderStatus = (id, s) => { 
    const o = orders.value.find(x => x.id === id)
    if(o) { o.status = s; saveToStorage() } 
  }


  // ==========================================
  // 6. ACTIONS: PRODUCT & REVIEW MANAGEMENT
  // ==========================================
  const addProduct = (p) => { products.value.push({...p, id: Date.now(), reviews:[]}); saveToStorage() }
  const deleteProduct = (id) => { products.value = products.value.filter(p => p.id !== id); saveToStorage() }
  
  const addProductReview = (pid, r, c) => { 
    if(!currentUser.value){ showToast('Login to review','error'); return } 
    const p = products.value.find(x=>x.id===pid)
    if(p){ 
      if(!p.reviews) p.reviews=[]
      p.reviews.push({id:Date.now(), user:currentUser.value.name, rating:r, comment:c, date:new Date().toLocaleDateString()})
      saveToStorage()
      showToast('Review added!') 
    } 
  }

  const addStoreReview = (r, c) => { 
    if(!currentUser.value){ showToast('Login to review','error'); return } 
    storeReviews.value.push({id:Date.now(), user:currentUser.value.name, rating:r, comment:c, date:new Date().toLocaleDateString()})
    saveToStorage()
    showToast('Feedback sent!') 
  }

  const getAverageRating = (arr) => { 
    if(!arr || arr.length===0) return 0
    return (arr.reduce((s,r)=>s+r.rating,0)/arr.length).toFixed(1) 
  }

  const toggleWishlist = (product) => {
    if (!currentUser.value) { showToast('Please login to use Wishlist!', 'error'); return }
    const index = wishlist.value.findIndex(p => p.id === product.id)
    if (index !== -1) { wishlist.value.splice(index, 1); showToast('Removed from Wishlist', 'success') } 
    else { wishlist.value.push(product); showToast('Added to Wishlist', 'success') }
    saveToStorage()
  }

  const isInWishlist = (id) => wishlist.value.some(p => p.id === id)


  // ==========================================
  // 7. COMPUTED PROPERTIES
  // ==========================================
  const cartTotalQuantity = computed(() => cart.value.reduce((total, item) => total + item.quantity, 0))

  const myOrders = computed(() => { 
    if(!currentUser.value) return []
    return orders.value
      .filter(o => o.userId === currentUser.value.id)
      .sort((a,b)=>new Date(b.date)-new Date(a.date)) 
  })

  const loyaltyPoints = computed(() => { 
    if(!currentUser.value) return 0
    const validOrders = myOrders.value.filter(o => o.status !== 'Cancelled')
    return validOrders.length * 10 
  })

  return { 
    users, products, orders, cart, storeReviews, wishlist,
    currentUser, currentAdmin, toasts, 
    saveToStorage, showToast, removeToast,
    register, loginCustomer, loginAdmin, logoutUser, logoutAdmin, logout, updateProfile,
    addToCart, incrementItem, decrementItem, removeFromCart, reOrder, placeOrder, 
    cancelOrder, deleteOrder, deleteUser,
    updateOrderStatus, addProduct, deleteProduct,
    addProductReview, addStoreReview, getAverageRating, cartTotalQuantity,
    toggleWishlist, isInWishlist,
    myOrders, loyaltyPoints
  }
})