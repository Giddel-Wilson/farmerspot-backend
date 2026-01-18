const express = require('express')
const router = express.Router()
const { Contact, validateContact } = require('../models/contact')
const { getSuccessResponse, getErrorResponse } = require('../utils/response')

/**
 * Submit a contact form
 * @param {Object} req.body - Contact form data
 * @param {string} req.body.name - Contact name
 * @param {string} req.body.email - Contact email
 * @param {string} req.body.phone - Contact phone (optional)
 * @param {string} req.body.subject - Message subject
 * @param {string} req.body.message - Message content
 */
router.post('/submit', async (req, res) => {
  try {
    // Validate input
    const { error } = validateContact(req.body)
    if (error) {
      return res.status(400).send(getErrorResponse(error.details[0].message))
    }

    // Create contact entry
    const contact = new Contact({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      subject: req.body.subject,
      message: req.body.message,
      ipAddress: req.ip || req.connection.remoteAddress || ''
    })

    await contact.save()

    return res.send(
      getSuccessResponse('Thank you for contacting us! We will get back to you soon.', {
        id: contact._id
      })
    )
  } catch (err) {
    console.error('Contact form submission error:', err)
    return res.status(500).send(
      getErrorResponse('An error occurred while processing your request. Please try again.')
    )
  }
})

/**
 * Get all contact submissions (Admin only - can be protected later)
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.status - Filter by status
 * @param {number} req.query.limit - Limit results
 */
router.get('/all', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    
    const query = status ? { status } : {}
    
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    return res.send(getSuccessResponse('Contacts retrieved successfully', contacts))
  } catch (err) {
    console.error('Get contacts error:', err)
    return res.status(500).send(getErrorResponse('Error retrieving contacts'))
  }
})

/**
 * Update contact status (Admin only - can be protected later)
 * @param {string} req.params.id - Contact ID
 * @param {string} req.body.status - New status
 */
router.patch('/status/:id', async (req, res) => {
  try {
    const { status } = req.body
    
    if (!['new', 'read', 'replied', 'resolved'].includes(status)) {
      return res.status(400).send(getErrorResponse('Invalid status value'))
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!contact) {
      return res.status(404).send(getErrorResponse('Contact not found'))
    }

    return res.send(getSuccessResponse('Contact status updated', contact))
  } catch (err) {
    console.error('Update contact status error:', err)
    return res.status(500).send(getErrorResponse('Error updating contact status'))
  }
})

module.exports = router
