const mongoose = require('mongoose')
const Joi = require('joi')
const JoiObjectId = require('joi-objectid')(Joi)

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MilletItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
})

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'paystack'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentReference: {
    type: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    phone: String
  },
  deliverySlot: {
    date: Date,
    timeSlot: String
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  deliveredAt: Date,
  notes: String,
  cancellationReason: String,
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
})

// Generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `FS${Date.now()}${count + 1}`
  }
  next()
})

// Add index for geospatial queries
orderSchema.index({ 'deliveryAddress.location': '2dsphere' })

const Order = mongoose.model('Order', orderSchema)

function validateOrder (order) {
  const itemSchema = Joi.object().keys({
    productId: JoiObjectId().required(),
    name: Joi.string().required(),
    price: Joi.number().required(),
    quantity: Joi.number().min(1).required(),
    subtotal: Joi.number().required()
  })

  const schema = Joi.object().keys({
    customerId: JoiObjectId().required(),
    farmerId: JoiObjectId().required(),
    items: Joi.array().items(itemSchema).required(),
    totalAmount: Joi.number().required(),
    paymentMethod: Joi.string().valid('cod', 'online', 'paystack').required(),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded'),
    deliveryAddress: Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      phone: Joi.string().required()
    }).required(),
    deliverySlot: Joi.object().keys({
      date: Joi.date().required(),
      timeSlot: Joi.string().required()
    }),
    deliveryFee: Joi.number(),
    notes: Joi.string().allow('')
  })

  return schema.validate(order)
}

exports.Order = Order
exports.validateOrder = validateOrder
exports.orderSchema = orderSchema
