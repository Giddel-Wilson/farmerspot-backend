const express = require('express')
const router = express.Router()
const { getErrorResponse, getSuccessResponse } = require('../utils/response')
const { Review, validateReview } = require('../models/review')
const { Order } = require('../models/order')
const { MilletItem } = require('../models/millet_item')
const mongoose = require('mongoose')

/**
 * Create a review for a product from a delivered order
 * @param {Object} req.body - Review details
 */
router.post('/create', async (req, res) => {
  const { error } = validateReview(req.body)
  if (error) return res.status(400).send(getErrorResponse(error.details[0].message))

  try {
    // Verify order exists and is delivered
    const order = await Order.findById(req.body.orderId)
    if (!order) {
      return res.status(404).send(getErrorResponse('Order not found'))
    }

    if (order.status !== 'delivered') {
      return res.status(400).send(getErrorResponse('Can only review delivered orders'))
    }

    // Check if customer owns this order
    if (order.customerId.toString() !== req.body.customerId) {
      return res.status(403).send(getErrorResponse('Not authorized to review this order'))
    }

    // Check if product was in the order
    const productInOrder = order.items.find(
      item => item.productId.toString() === req.body.productId
    )
    if (!productInOrder) {
      return res.status(400).send(getErrorResponse('Product not found in this order'))
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      orderId: req.body.orderId,
      productId: req.body.productId,
      customerId: req.body.customerId
    })

    if (existingReview) {
      return res.status(400).send(getErrorResponse('You have already reviewed this product'))
    }

    const review = new Review(req.body)
    await review.save()

    return res.send(getSuccessResponse('Review submitted successfully', review))
  } catch (err) {
    console.error(err)
    return res.status(500).send(getErrorResponse('Error creating review: ' + err.message))
  }
})

/**
 * Get reviews for a specific product
 * @param {string} req.params.productId - Product ID
 */
router.get('/product/:productId', async (req, res) => {
  const productId = req.params.productId

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(404).send(getErrorResponse('Invalid Product ID'))
  }

  try {
    const reviews = await Review.find({ productId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return res.send(getSuccessResponse('Success', {
      reviews,
      totalReviews: reviews.length,
      averageRating: avgRating.toFixed(1)
    }))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error fetching reviews: ' + err.message))
  }
})

/**
 * Get reviews for a farmer's products
 * @param {string} req.params.farmerId - Farmer ID
 */
router.get('/farmer/:farmerId', async (req, res) => {
  const farmerId = req.params.farmerId

  if (!mongoose.Types.ObjectId.isValid(farmerId)) {
    return res.status(404).send(getErrorResponse('Invalid Farmer ID'))
  }

  try {
    const reviews = await Review.find({ farmerId })
      .populate('customerId', 'name')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return res.send(getSuccessResponse('Success', {
      reviews,
      totalReviews: reviews.length,
      averageRating: avgRating.toFixed(1)
    }))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error fetching reviews: ' + err.message))
  }
})

/**
 * Check if customer can review products from an order
 * @param {string} req.params.orderId - Order ID
 * @param {string} req.params.customerId - Customer ID
 */
router.get('/can-review/:orderId/:customerId', async (req, res) => {
  const { orderId, customerId } = req.params

  if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(404).send(getErrorResponse('Invalid ID'))
  }

  try {
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).send(getErrorResponse('Order not found'))
    }

    if (order.status !== 'delivered') {
      return res.send(getSuccessResponse('Success', { canReview: false, reason: 'Order not delivered yet' }))
    }

    if (order.customerId.toString() !== customerId) {
      return res.send(getSuccessResponse('Success', { canReview: false, reason: 'Not your order' }))
    }

    // Get already reviewed products
    const existingReviews = await Review.find({ orderId, customerId })
    const reviewedProductIds = existingReviews.map(r => r.productId.toString())

    // Get products that can still be reviewed
    const reviewableProducts = order.items.filter(
      item => !reviewedProductIds.includes(item.productId.toString())
    )

    return res.send(getSuccessResponse('Success', {
      canReview: reviewableProducts.length > 0,
      reviewableProducts,
      alreadyReviewed: existingReviews.length
    }))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error checking review status: ' + err.message))
  }
})

module.exports = router
