const mongoose = require('mongoose')
const Joi = require('joi')

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Category = mongoose.model('Category', categorySchema)

function validateCategory (category) {
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    slug: Joi.string().required(),
    description: Joi.string().allow(''),
    image: Joi.string().allow(''),
    isActive: Joi.boolean()
  })

  return schema.validate(category)
}

exports.Category = Category
exports.validateCategory = validateCategory
