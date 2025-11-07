const mongoose = require('mongoose')
const Joi = require('joi')
const JoiObjectId = require('joi-objectid')(Joi)

const reviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MilletItem',
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Review = mongoose.model('Review', reviewSchema)

function validateReview (review) {
  const schema = Joi.object().keys({
    orderId: JoiObjectId().required(),
    customerId: JoiObjectId().required(),
    productId: JoiObjectId().required(),
    farmerId: JoiObjectId().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).allow('')
  })
  return schema.validate(review)
}

exports.Review = Review
exports.validateReview = validateReview
exports.reviewSchema = reviewSchema
