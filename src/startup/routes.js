const auth = require('../routes/auth')
const list = require('../routes/list')
const search = require('../routes/search')
const profile = require('../routes/profile')
const cart = require('../routes/cart')
const admin = require('../routes/admin')
const order = require('../routes/order')
const review = require('../routes/review')
const upload = require('../routes/upload')

/**
 * Function that exports all the routes
 * @param {Express} app
 */

module.exports = function (app) {
  app.use('/api/auth', auth)
  app.use('/api/list', list)
  app.use('/api/search', search)
  app.use('/api/profile', profile)
  app.use('/api/cart', cart)
  app.use('/api/admin', admin)
  app.use('/api/orders', order)
  app.use('/api/review', review)
  app.use('/api/upload', upload)
}
