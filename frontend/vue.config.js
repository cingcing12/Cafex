const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,

  publicPath: process.env.NODE_ENV === 'production'
    ? '/Cafex/'
    : '/',

  // Correct Vue CLI configuration:
  devServer: {
    port: 5173,
    client: {
      overlay: false, // Optional: turns off error overlay in browser
    }
  }
})