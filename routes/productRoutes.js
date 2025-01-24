const router = require("express").Router();
const productController = require("../controllers/productControllers");
const { authGuard, adminGuard } = require("../middleware/authGuard");
const { logRequest } = require("../middleware/activityLogs");

// Create a new product
router.post("/create", adminGuard,logRequest, productController.createProduct);

// Get all products (protected route with authGuard middleware)
router.get("/get_all_products", productController.getAllProducts);

// Get products by category
router.get(
  "/get_products_by_category/",logRequest,
  productController.getProductsByCategory
);

// Delete a product (protected route with adminGuard middleware)
router.delete(
  "/delete_product/:id",
  adminGuard,
  productController.deleteProduct
);

// Update a product
router.put("/update_product/:id", adminGuard,logRequest, productController.updateProduct);

// Get a single product by ID (protected route with authGuard middleware)
router.get(
  "/get_single_product/:id",
  logRequest,
  authGuard,
  productController.getSingleProduct
);

// Pagination example route
router.get("/pagination",logRequest, productController.paginatonProducts);

// search products
router.get("/search",logRequest, productController.searchProductsByName);

module.exports = router;
