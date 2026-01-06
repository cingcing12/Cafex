<template>
  <footer class="bg-gray-900 text-white py-12 border-t border-gray-800">
    <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
      <div class="col-span-1 md:col-span-2">
        <h2 class="text-3xl font-bold text-coffee-500 mb-4 tracking-tighter">CAFÉX</h2>
        <p class="text-gray-400 max-w-sm">
          Crafting the perfect cup since 2024. We believe in sustainable sourcing, expert roasting, and the art of brewing.
        </p>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-4">Quick Links</h3>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li><router-link to="/" class="hover:text-coffee-400">Menu</router-link></li>
          <li><router-link to="/about" class="hover:text-coffee-400">Our Story</router-link></li>
          <li><router-link to="/contact" class="hover:text-coffee-400">Contact</router-link></li>
          <li><router-link to="/profile" class="hover:text-coffee-400">My Account</router-link></li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-4">Visit Us</h3>
        <p class="text-gray-400 text-sm">
          123 Coffee Street<br>
          Phnom Penh, Cambodia<br><br>
          Daily: 7am - 9pm
        </p>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
      &copy; 2026 CAFÉX. All rights reserved.
    </div>
  </footer>
</template>