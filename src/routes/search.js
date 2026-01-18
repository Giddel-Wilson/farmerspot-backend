const express = require('express')
const router = express.Router()
const { getSuccessResponse, getErrorResponse } = require('../utils/response')
const { MilletItem } = require('../models/millet_item')

/**
 * Get autocomplete suggestions for product names
 * @param {Object} req - The request object.
 * @param {string} req.params.query - The search query.
 */
router.get('/autocomplete/:query', async function (req, res) {
  const query = req.params.query

  try {
    const items = await MilletItem.find({
      name: {
        $regex: query,
        $options: 'i'
      }
    }).select('name').limit(10)
    
    const suggestions = items.map(item => item.name)
    return res.send(getSuccessResponse('Success', suggestions))
  } catch (e) {
    return res.send(
      getErrorResponse(`An error occured while searching. ${e.message}`)
    )
  }
})

/**
 * Search for millet items by name
 * @param {Object} req - The request object.
 * @param {string} req.params.query - The search query.
 */
router.get('/:query', async function (req, res) {
  const query = req.params.query
  console.log(`Searching For ${query}...`)

  try {
    const items = await MilletItem.find({
      name: {
        $regex: query,
        // $options: 'i' makes the search case-insensitive
        $options: 'i'
      }
    })
    return res.send(getSuccessResponse('Success', items))
  } catch (e) {
    return res.send(
      getErrorResponse(`An error occured while searching. ${e.message}`)
    )
  }
})

module.exports = router
