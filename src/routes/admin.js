const express = require('express')
const router = express.Router()
const { getSuccessResponse, getErrorResponse } = require('../utils/response')
const { User } = require('../models/user')
const { default: mongoose } = require('mongoose')
const { MilletItem } = require('../models/millet_item')

/**
 * Check if a user is an admin
 * @param {Object} req - The request object.
 * @param {string} req.params.userId - The user's ID.
 */
router.get('/isAdmin/:userId', async function (req, res) {
  const userId = req.params.userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(404).send(getErrorResponse('Invalid User ID'))
  }
  const user = await User.findOne({ _id: userId })
  if (!user) {
    return res.status(404).send(getErrorResponse('User not found'))
  }
  if (user.userType === 'admin') {
    return res.send(getSuccessResponse('Success', {
      isAdmin: true
    }))
  } else {
    return res.send(getSuccessResponse('Success', {
      isAdmin: false
    }))
  }
})

/**
 * Delete a product by ID
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.itemId - The ID of the item to delete.
 * @param {string} req.body.adminId - The ID of the admin performing the delete operation.
 */
router.post('/deleteItem', async (req, res) => {
  const { itemId, adminId } = req.body

  // Check and validate itemId
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(404).send(getErrorResponse('Invalid Item ID'))
  }
  // Check and validate adminId
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    return res.status(404).send(getErrorResponse('Invalid Admin ID'))
  }

  const user = await User.findOne({ _id: adminId })

  // When mongoose deletes an item it returns it as well

  let deletedItem = await MilletItem.findOne({ _id: itemId })

  if (
    user.userType !== 'admin' &&
    deletedItem.listedBy.toString() !== adminId
  ) {
    return res
      .status(404)
      .send(getErrorResponse('You are not the owner of the item'))
  }

  deletedItem = await MilletItem.findByIdAndDelete(itemId)

  if (!deletedItem) {
    return res
      .status(404)
      .send(getErrorResponse('Item with ID provided not found!'))
  }

  return res.send(getSuccessResponse('Deleted Item', deletedItem))
})

/**
 * Update item price (Admin only)
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.itemId - The ID of the item to update.
 * @param {string} req.body.adminId - The ID of the admin performing the update.
 * @param {number} req.body.price - The new price for the item.
 */
router.post('/updatePrice', async (req, res) => {
  const { itemId, adminId, price } = req.body

  // Validate itemId
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(404).send(getErrorResponse('Invalid Item ID'))
  }

  // Validate adminId
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    return res.status(404).send(getErrorResponse('Invalid Admin ID'))
  }

  // Validate price
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).send(getErrorResponse('Invalid price. Price must be a positive number'))
  }

  // Check if user is admin
  const user = await User.findOne({ _id: adminId })
  if (!user) {
    return res.status(404).send(getErrorResponse('Admin not found'))
  }

  if (user.userType !== 'admin') {
    return res.status(403).send(getErrorResponse('Only admins can update prices'))
  }

  // Find and update the item
  const item = await MilletItem.findById(itemId)
  if (!item) {
    return res.status(404).send(getErrorResponse('Item not found'))
  }

  const oldPrice = item.price
  item.price = price
  await item.save()

  return res.send(getSuccessResponse('Price updated successfully', {
    item,
    oldPrice,
    newPrice: price
  }))
})

/**
 * Bulk update prices for multiple items (Admin only)
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.adminId - The ID of the admin performing the update.
 * @param {Array} req.body.updates - Array of {itemId, price} objects.
 */
router.post('/bulkUpdatePrices', async (req, res) => {
  const { adminId, updates } = req.body

  // Validate adminId
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    return res.status(404).send(getErrorResponse('Invalid Admin ID'))
  }

  // Check if user is admin
  const user = await User.findOne({ _id: adminId })
  if (!user) {
    return res.status(404).send(getErrorResponse('Admin not found'))
  }

  if (user.userType !== 'admin') {
    return res.status(403).send(getErrorResponse('Only admins can update prices'))
  }

  // Validate updates array
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).send(getErrorResponse('Updates must be a non-empty array'))
  }

  const results = []
  const errors = []

  // Process each update
  for (const update of updates) {
    const { itemId, price } = update

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      errors.push({ itemId, error: 'Invalid Item ID' })
      continue
    }

    if (typeof price !== 'number' || price < 0) {
      errors.push({ itemId, error: 'Invalid price' })
      continue
    }

    try {
      const item = await MilletItem.findById(itemId)
      if (!item) {
        errors.push({ itemId, error: 'Item not found' })
        continue
      }

      const oldPrice = item.price
      item.price = price
      await item.save()

      results.push({
        itemId,
        name: item.name,
        oldPrice,
        newPrice: price
      })
    } catch (err) {
      errors.push({ itemId, error: err.message })
    }
  }

  return res.send(getSuccessResponse('Bulk price update completed', {
    updated: results.length,
    failed: errors.length,
    results,
    errors
  }))
})

module.exports = router
