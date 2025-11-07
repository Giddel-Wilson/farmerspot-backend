const mongoose = require('mongoose')
const Joi = require('joi')
const JoiObjectId = require('joi-objectid')(Joi)
const { commentSchema } = require('./comment')

const milletItemSchema = new mongoose.Schema({
  listedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    default: 100,
    min: 0
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'piece', 'bunch', 'gram']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  listedAt: {
    type: Date,
    default: () => {
      return new Date()
    }
  },
  comments: [commentSchema]
})

const MilletItem = mongoose.model('MilletItem', milletItemSchema)

function validateMilletItem (item) {
  const schema = Joi.object().keys({
    listedBy: JoiObjectId().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    images: Joi.array().items(Joi.string()).required(),
    comments: Joi.array(),
    price: Joi.number().required(),
    stock: Joi.number().min(0),
    unit: Joi.string().valid('kg', 'piece', 'bunch', 'gram'),
    category: JoiObjectId(),
    isAvailable: Joi.boolean()
  })
  return schema.validate(item)
}

exports.MilletItem = MilletItem
exports.validateMilletItem = validateMilletItem
exports.milletItemSchema = milletItemSchema
