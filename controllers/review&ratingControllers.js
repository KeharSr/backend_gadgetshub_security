


const Review = require('../models/review&ratingModel');
const Product = require('../models/productModel');
const { default: mongoose } = require('mongoose');

const createReview = async (req, res) => {
    const { rating, review, productId } = req.body;
    const id = req.user.id; 
    console.log('User ID:', id);
    console.log('Request Body:', req.body);

    try {
        // Check if the user has already posted a review for this product
        const existingReview = await Review.findOne({
            
            product: productId,
            user: id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product"
            });
        }

        const newReview = await Review.create({
            rating: rating,
            review: review,
            product: productId,
            user: id
        });

        console.log('New review created:', newReview);

        res.status(201).json({
            success: true,
            message: "Review added successfully",
            review: newReview
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, message: "Error adding review", error: error.message });
    }
};

// get product ratings and reviews by user and product
const getReviewByUserAndProduct = async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id;  

    console.log('Fetching review for UserID:', userId, 'ProductID:', productId);

    try {
        const review = await Review.findOne({ product: productId, user: userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'No review found for this product'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Review fetched successfully',
            review
        });
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ success: false, message: "Error fetching review", error: error.message });
    }
};


//Get all reviews for a product
const getReviewsByProduct = async (req, res) => {
    const productId = req.params.id;

    try {
        const reviews = await Review.find({ product: productId })

        

        res.status(200).json({
            success: true,
            message: 'Reviews fetched successfully',
            reviews: reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
    }
};






// get the average rating of a product
const getAverageRating = async (req, res) => {
    const productId = req.params.id; 
    console.log("Fetching average rating for product:", productId);  

    try {
       // Aggregate the average rating for the product and display all products
        const aggregation = await Review.aggregate([
            {
                $match: { product:new mongoose.Types.ObjectId(productId) }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (aggregation.length === 0) {
            return res.status(200).json({

                success: true,
                message: 'No reviews found for this product',
                averageRating: 0,
                count: 0,
                productId
            });
        }

        const { averageRating, count } = aggregation[0];

        res.status(200).json({
            success: true,
            message: 'Average rating fetched successfully',
            averageRating,
            count,
            productId  // Optional, if you want to return the count of reviews as well
        });
    } catch (error) {
        console.error('Error fetching average rating:', error);
        res.status(500).json({ success: false, message: "Error fetching average rating", error: error.message });
    }
};


const updateReviewByUserAndProduct = async (req, res) => {
    const { rating, review: updatedReview } = req.body;
    const productId = req.params.productId;
    const userId = req.user.id;

    console.log('Product ID:', productId);
    console.log('User ID:', userId);
    console.log('Rating:', rating);
    console.log('Review:', updatedReview);

    try {
        // Find the review by product and user and update it
        const review = await Review.findOneAndUpdate(
            { product: productId, user: userId },
            { rating, review: updatedReview },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "No review found that can be updated by this user for this product."
            });
        }

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ success: false, message: "Error updating review", error: error.message });
    }
};



module.exports = { 
    createReview, 
    getReviewsByProduct,
    getReviewByUserAndProduct,
    getAverageRating,
    updateReviewByUserAndProduct, 
    
};
