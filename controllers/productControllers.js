const path = require("path");
const productModel = require("../models/productModel");
const fs = require("fs");
const validator = require("validator"); // Import validator library

// Utility function to sanitize input
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return validator.escape(input.trim());
  }
  return input; // Return non-string inputs as-is
};

// Create a new product
const createProduct = async (req, res) => {
  const {
    productName,
    productPrice,
    productCategory,
    productDescription,
    productQuantity,
  } = req.body;

  // Sanitize inputs
  const sanitizedProductName = sanitizeInput(productName);
  const sanitizedProductPrice = parseFloat(productPrice);
  const sanitizedProductCategory = sanitizeInput(productCategory);
  const sanitizedProductDescription = sanitizeInput(productDescription);
  const sanitizedProductQuantity = parseInt(productQuantity);

  // Validate required fields
  if (
    !sanitizedProductName ||
    !sanitizedProductPrice ||
    !sanitizedProductCategory ||
    !sanitizedProductDescription ||
    !sanitizedProductQuantity
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter all details!",
    });
  }

  // Validate price and quantity
  if (sanitizedProductPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Product price cannot be negative!",
    });
  }

  if (sanitizedProductQuantity < 0) {
    return res.status(400).json({
      success: false,
      message: "Product quantity cannot be negative!",
    });
  }

  let imageName = null;

  try {
    // Handle image upload
    if (req.files && req.files.productImage) {
      const { productImage } = req.files;
      imageName = `${Date.now()}_${sanitizeInput(productImage.name)}`;
      const imagePath = path.join(__dirname, `../public/products/${imageName}`);
      await productImage.mv(imagePath);
    }

    // Create a new product
    const newProduct = new productModel({
      productName: sanitizedProductName,
      productPrice: sanitizedProductPrice,
      productCategory: sanitizedProductCategory,
      productDescription: sanitizedProductDescription,
      productImage: imageName,
      productQuantity: sanitizedProductQuantity,
    });

    // Save product to database
    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product Created Successfully!",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get a single product
const getSingleProduct = async (req, res) => {
  const productId = sanitizeInput(req.params.id); // Sanitize input

  try {
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "No product found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const allProducts = await productModel.find({});
    res.status(200).json({
      success: true,
      message: "Products fetched successfully!",
      products: allProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  const { productPrice, productQuantity, productImage } = req.body;

  try {
    // Sanitize inputs
    const sanitizedProductPrice = productPrice ? parseFloat(productPrice) : undefined;
    const sanitizedProductQuantity = productQuantity ? parseInt(productQuantity) : undefined;

    // Validate price and quantity
    if (sanitizedProductPrice !== undefined && sanitizedProductPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Product price cannot be negative!",
      });
    }

    if (sanitizedProductQuantity !== undefined && sanitizedProductQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Product quantity cannot be negative!",
      });
    }

    // Handle image upload if provided
    if (req.files && req.files.productImage) {
      const imageFile = req.files.productImage;
      const imageName = `${Date.now()}_${sanitizeInput(imageFile.name)}`;
      const imageUploadPath = path.join(__dirname, `../public/products/${imageName}`);

      // Save new image and delete the old one
      await imageFile.mv(imageUploadPath);

      const existingProduct = await productModel.findById(req.params.id);
      if (existingProduct && existingProduct.productImage) {
        const oldImagePath = path.join(
          __dirname,
          `../public/products/${existingProduct.productImage}`
        );
        fs.unlinkSync(oldImagePath);
      }

      req.body.productImage = imageName;
    }

    // Update product
    const updatedProduct = await productModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Pagination for products
const paginatonProducts = async (req, res) => {
  const pageNo = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);

  try {
    const products = await productModel
      .find({})
      .skip((pageNo - 1) * limit)
      .limit(limit);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  const category = sanitizeInput(req.query.category || "All");
  const search = sanitizeInput(req.query.search || "");
  const pageNo = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);

  try {
    let query = {
      productName: { $regex: search, $options: "i" },
    };

    if (category !== "All") {
      query.productCategory = category;
    }

    const products = await productModel.find(query).skip((pageNo - 1) * limit).limit(limit);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this category",
      });
    }

    res.status(200).json({
      success: true,
      message: "Products fetched successfully by category",
      products: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Search products by name
const searchProductsByName = async (req, res) => {
  const search = sanitizeInput(req.query.search || "");
  const pageNo = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);

  try {
    const query = { productName: { $regex: search, $options: "i" } };

    const [products, totalProducts] = await Promise.all([
      productModel.find(query).skip((pageNo - 1) * limit).limit(limit),
      productModel.countDocuments(query),
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this search",
      });
    }

    res.status(200).json({
      success: true,
      message: "Products fetched successfully by search",
      products: products,
      totalProducts: totalProducts,
      currentPage: pageNo,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
  paginatonProducts,
  getProductsByCategory,
  searchProductsByName,
};
