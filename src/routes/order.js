const express = require('express')
const router = express.Router()
const { getErrorResponse, getSuccessResponse } = require('../utils/response')
const { Order, validateOrder } = require('../models/order')
const { MilletItem } = require('../models/millet_item')
const { Cart } = require('../models/cart')
const mongoose = require('mongoose')

/**
 * Create a new order from cart
 * @param {Object} req.body - Order details
 */
router.post('/create', async (req, res) => {
  const { error } = validateOrder(req.body)
  if (error) return res.status(400).send(getErrorResponse(error.details[0].message))

  try {
    // Validate stock availability
    for (const item of req.body.items) {
      const product = await MilletItem.findById(item.productId)
      if (!product) {
        return res.status(404).send(getErrorResponse(`Product ${item.name} not found`))
      }
      if (product.stock < item.quantity) {
        return res.status(400).send(getErrorResponse(`Insufficient stock for ${item.name}. Available: ${product.stock}`))
      }
    }

    // Generate unique order number (FS + timestamp + random)
    const orderNumber = `FS${Date.now()}${Math.floor(Math.random() * 1000)}`
    
    // Prepare order data - remove location if coordinates not provided
    const orderData = { ...req.body, orderNumber }
    if (orderData.deliveryAddress?.location && !orderData.deliveryAddress.location.coordinates) {
      delete orderData.deliveryAddress.location
    }
    
    // Create order with generated order number
    const order = new Order(orderData)
    
    // Add initial timeline entry
    order.timeline.push({
      status: 'pending',
      note: 'Order placed'
    })

    await order.save()

    // Update product stock
    for (const item of req.body.items) {
      await MilletItem.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      )
    }

    // Clear customer's cart
    await Cart.findOneAndUpdate(
      { userId: req.body.customerId },
      { $set: { items: [] } }
    )

    return res.send(getSuccessResponse('Order created successfully', order))
  } catch (err) {
    console.error(err)
    return res.status(500).send(getErrorResponse('Error creating order: ' + err.message))
  }
})

/**
 * Get order by ID
 * @param {string} req.params.id - Order ID
 */
router.get('/:id', async (req, res) => {
  const orderId = req.params.id
  
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).send(getErrorResponse('Invalid Order ID'))
  }

  try {
    const order = await Order.findById(orderId)
      .populate('customerId', 'name email phone')
      .populate('farmerId', 'name email phone')
      .populate('items.productId')

    if (!order) {
      return res.status(404).send(getErrorResponse('Order not found'))
    }

    return res.send(getSuccessResponse('Success', order))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error fetching order: ' + err.message))
  }
})

/**
 * Get all orders for a customer
 * @param {string} req.params.customerId - Customer ID
 */
router.get('/customer/:customerId', async (req, res) => {
  const customerId = req.params.customerId

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(404).send(getErrorResponse('Invalid Customer ID'))
  }

  try {
    const orders = await Order.find({ customerId })
      .populate('farmerId', 'name email')
      .sort({ createdAt: -1 })

    return res.send(getSuccessResponse('Success', orders))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error fetching orders: ' + err.message))
  }
})

/**
 * Get all orders for a farmer
 * @param {string} req.params.farmerId - Farmer ID
 */
router.get('/farmer/:farmerId', async (req, res) => {
  const farmerId = req.params.farmerId

  if (!mongoose.Types.ObjectId.isValid(farmerId)) {
    return res.status(404).send(getErrorResponse('Invalid Farmer ID'))
  }

  try {
    const orders = await Order.find({ farmerId })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })

    return res.send(getSuccessResponse('Success', orders))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error fetching orders: ' + err.message))
  }
})

/**
 * Update order status
 * @param {string} req.params.id - Order ID
 * @param {string} req.body.status - New status
 * @param {string} req.body.note - Optional note
 */
router.patch('/:id/status', async (req, res) => {
  const orderId = req.params.id
  const { status, note } = req.body

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).send(getErrorResponse('Invalid Order ID'))
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return res.status(400).send(getErrorResponse('Invalid status'))
  }

  try {
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).send(getErrorResponse('Order not found'))
    }

    order.status = status
    
    // Update specific timestamps
    if (status === 'confirmed') {
      order.confirmedAt = new Date()
    } else if (status === 'delivered') {
      order.deliveredAt = new Date()
    }

    // Add timeline entry
    order.timeline.push({
      status,
      note: note || `Order ${status}`
    })

    await order.save()

    return res.send(getSuccessResponse('Order status updated', order))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error updating order: ' + err.message))
  }
})

/**
 * Update payment status
 * @param {string} req.params.id - Order ID
 * @param {string} req.body.paymentStatus - New payment status
 * @param {string} req.body.paymentReference - Payment reference
 */
router.patch('/:id/payment', async (req, res) => {
  const orderId = req.params.id
  const { paymentStatus, paymentReference } = req.body

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).send(getErrorResponse('Invalid Order ID'))
  }

  try {
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).send(getErrorResponse('Order not found'))
    }

    order.paymentStatus = paymentStatus
    if (paymentReference) {
      order.paymentReference = paymentReference
    }

    await order.save()

    return res.send(getSuccessResponse('Payment status updated', order))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error updating payment: ' + err.message))
  }
})

/**
 * Cancel order
 * @param {string} req.params.id - Order ID
 * @param {string} req.body.reason - Cancellation reason
 */
router.post('/:id/cancel', async (req, res) => {
  const orderId = req.params.id
  const { reason } = req.body

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).send(getErrorResponse('Invalid Order ID'))
  }

  try {
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).send(getErrorResponse('Order not found'))
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).send(getErrorResponse('Cannot cancel this order'))
    }

    // Restore stock
    for (const item of order.items) {
      await MilletItem.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      )
    }

    order.status = 'cancelled'
    order.cancellationReason = reason
    order.timeline.push({
      status: 'cancelled',
      note: reason || 'Order cancelled'
    })

    await order.save()

    return res.send(getSuccessResponse('Order cancelled', order))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error cancelling order: ' + err.message))
  }
})

/**
 * Get order statistics for farmer
 * @param {string} req.params.farmerId - Farmer ID
 */
router.get('/farmer/:farmerId/stats', async (req, res) => {
  const farmerId = req.params.farmerId

  if (!mongoose.Types.ObjectId.isValid(farmerId)) {
    return res.status(404).send(getErrorResponse('Invalid Farmer ID'))
  }

  try {
    const orders = await Order.find({ farmerId })

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    }

    return res.send(getSuccessResponse('Success', stats))
  } catch (err) {
    return res.status(500).send(getErrorResponse('Error fetching stats: ' + err.message))
  }
})

module.exports = router
