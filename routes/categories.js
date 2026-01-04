const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { categoryOperations } = require('../database/sqlite');
const auth = require('../middleware/auth');

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// all categeories are fetched.
router.get('/', auth, async (req, res) => {
  try {
    const categories = await categoryOperations.findByUserId(req.user.id);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// Creating new category
router.post('/', auth, upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
  body('itemCount').optional().isInt({ min: 0 }).withMessage('Item count must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, itemCount } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const category = await categoryOperations.create({
      name,
      itemCount: parseInt(itemCount) || 0,
      image,
      createdBy: req.user.id
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error while creating category' });
  }
});

// for Updating category
router.put('/:id', auth, upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
  body('itemCount').optional().isInt({ min: 0 }).withMessage('Item count must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, itemCount } = req.body;
  const updateData = {
  name,
};

if (itemCount !== undefined) {
  updateData.itemCount = parseInt(itemCount);
}


    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const category = await categoryOperations.update(req.params.id, req.user.id, updateData);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error while updating category' });
  }
});



module.exports = router;