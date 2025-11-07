const express = require('express')
const router = express.Router()
const { upload, cloudinary } = require('../config/cloudinary')
const { getErrorResponse, getSuccessResponse } = require('../utils/response')

/**
 * Upload single image to Cloudinary
 * @param {File} req.file - Image file
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send(getErrorResponse('No image file provided'))
    }

    return res.send(getSuccessResponse('Image uploaded successfully', {
      url: req.file.path,
      public_id: req.file.filename
    }))
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).send(getErrorResponse('Error uploading image: ' + err.message))
  }
})

/**
 * Upload multiple images to Cloudinary (max 5)
 * @param {File[]} req.files - Array of image files
 */
router.post('/upload-multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send(getErrorResponse('No image files provided'))
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }))

    return res.send(getSuccessResponse('Images uploaded successfully', {
      images: uploadedImages,
      count: uploadedImages.length
    }))
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).send(getErrorResponse('Error uploading images: ' + err.message))
  }
})

/**
 * Delete image from Cloudinary
 * @param {string} req.body.public_id - Cloudinary public ID
 */
router.delete('/delete', async (req, res) => {
  try {
    const { public_id } = req.body

    if (!public_id) {
      return res.status(400).send(getErrorResponse('Public ID is required'))
    }

    const result = await cloudinary.uploader.destroy(public_id)

    if (result.result === 'ok') {
      return res.send(getSuccessResponse('Image deleted successfully', result))
    } else {
      return res.status(404).send(getErrorResponse('Image not found or already deleted'))
    }
  } catch (err) {
    console.error('Delete error:', err)
    return res.status(500).send(getErrorResponse('Error deleting image: ' + err.message))
  }
})

module.exports = router
