const auth = require('../routes/auth')
const list = require('../routes/list')
const search = require('../routes/search')
const profile = require('../routes/profile')
const cart = require('../routes/cart')
const admin = require('../routes/admin')
const order = require('../routes/order')
const review = require('../routes/review')
const upload = require('../routes/upload')
const contact = require('../routes/contact')

/**
 * Function that exports all the routes
 * @param {Express} app
 */

module.exports = function (app) {
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Farmerspot API is running',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        products: '/api/list',
        search: '/api/search',
        profile: '/api/profile',
        cart: '/api/cart',
        admin: '/api/admin',
        orders: '/api/orders',
        reviews: '/api/review',
        upload: '/api/upload',
        contact: '/api/contact'
      },
      documentation: process.env.NODE_ENV === 'dev' ? '/docs' : 'API documentation available in development mode'
    })
  })

  app.use('/api/auth', auth)
  app.use('/api/list', list)
  app.use('/api/search', search)
  app.use('/api/profile', profile)
  app.use('/api/cart', cart)
  app.use('/api/admin', admin)
  app.use('/api/orders', order)
  app.use('/api/review', review)
  app.use('/api/upload', upload)
  app.use('/api/contact', contact)
}
