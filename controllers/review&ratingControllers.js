const Review = require('../models/review&ratingModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose'); // Import mongoose library
const validator = require('validator'); // Import the validator library

// Utility function to sanitize input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input; // Return non-string inputs as-is
};

// Create a new review
const createReview = async (req, res) => {
  const { rating, review, productId } = req.body;
  const id = req.user.id;

  try {
    // Sanitize inputs
    const sanitizedRating = parseFloat(rating); // Convert to float (assuming rating is numeric)
    const sanitizedReview = sanitizeInput(review);
    const sanitizedProductId = sanitizeInput(productId);

    // Check if the user has already posted a review for this product
    const existingReview = await Review.findOne({
      product: sanitizedProductId,
      user: id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    const newReview = await Review.create({
      rating: sanitizedRating,
      review: sanitizedReview,
      product: sanitizedProductId,
      user: id,
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: newReview,
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
};

// Get a review by user and product
const getReviewByUserAndProduct = async (req, res) => {
  const productId = sanitizeInput(req.params.id); // Sanitize input
  const userId = req.user.id;

  try {
    const review = await Review.findOne({ product: productId, user: userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'No review found for this product',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review fetched successfully',
      review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ success: false, message: 'Error fetching review', error: error.message });
  }
};

// Get all reviews for a product
const getReviewsByProduct = async (req, res) => {
  const productId = sanitizeInput(req.params.id); // Sanitize input

  try {
    const reviews = await Review.find({ product: productId });

    res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};

// Get the average rating of a product
const getAverageRating = async (req, res) => {
  const productId = sanitizeInput(req.params.id); // Sanitize input

  try {
    const aggregation = await Review.aggregate([
      {
        $match: { product: new mongoose.Types.ObjectId(productId) },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (aggregation.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No reviews found for this product',
        averageRating: 0,
        count: 0,
        productId,
      });
    }

    const { averageRating, count } = aggregation[0];

    res.status(200).json({
      success: true,
      message: 'Average rating fetched successfully',
      averageRating,
      count,
      productId,
    });
  } catch (error) {
    console.error('Error fetching average rating:', error);
    res.status(500).json({ success: false, message: 'Error fetching average rating', error: error.message });
  }
};

// Update a review by user and product
const updateReviewByUserAndProduct = async (req, res) => {
  const { rating, review: updatedReview } = req.body;
  const productId = sanitizeInput(req.params.productId); // Sanitize input
  const userId = req.user.id;

  try {
    // Sanitize inputs
    const sanitizedRating = parseFloat(rating); // Convert to float
    const sanitizedReview = sanitizeInput(updatedReview);

    const review = await Review.findOneAndUpdate(
      { product: productId, user: userId },
      { rating: sanitizedRating, review: sanitizedReview },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'No review found that can be updated by this user for this product.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
};

module.exports = {
  createReview,
  getReviewsByProduct,
  getReviewByUserAndProduct,
  getAverageRating,
  updateReviewByUserAndProduct,
};
