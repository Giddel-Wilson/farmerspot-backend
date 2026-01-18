const mongoose = require('mongoose')
const Joi = require('joi')

/**
 * Contact Schema
 * Stores contact form submissions from users
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'resolved'],
      default: 'new'
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

const Contact = mongoose.model('Contact', contactSchema)

/**
 * Validate contact form data
 * @param {Object} contact - The contact object to validate
 * @returns {Joi.ValidationResult}
 */
function validateContact(contact) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').optional(),
    subject: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(2000).required()
  })

  return schema.validate(contact)
}

module.exports = { Contact, validateContact }
