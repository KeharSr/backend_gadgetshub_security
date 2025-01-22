const router = require("express").Router();
const productController = require("../controllers/productControllers");
const { authGuard, adminGuard } = require("../middleware/authGuard");

// Create a new product
router.post("/create", adminGuard, productController.createProduct);

// Get all products (protected route with authGuard middleware)
router.get("/get_all_products", productController.getAllProducts);

// Get products by category
router.get(
  "/get_products_by_category/",
  productController.getProductsByCategory
);

// Delete a product (protected route with adminGuard middleware)
router.delete(
  "/delete_product/:id",
  adminGuard,
  productController.deleteProduct
);

// Update a product
router.put("/update_product/:id", adminGuard, productController.updateProduct);

// Get a single product by ID (protected route with authGuard middleware)
router.get(
  "/get_single_product/:id",
  authGuard,
  productController.getSingleProduct
);

// Pagination example route
router.get("/pagination", productController.paginatonProducts);

// search products
router.get("/search", productController.searchProductsByName);

module.exports = router;
