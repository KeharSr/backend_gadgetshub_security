# Lensify Backend

This is the backend server for the Lensify eCommerce platform. The server handles all API requests, including user authentication, product management, order processing, virtual try-on features, and integration with the Khalti payment gateway.

## Features

- **User Management**: Register, login, and manage user profiles.
- **Product Management**: Create, read, update, and delete products.
- **Order Management**: Handle order placement, status updates, and order history retrieval.
- **Cart Management**: Manage the shopping cart, including adding and removing items, and updating quantities.
- **Review System**: Users can leave reviews for products, with options to update and view reviews.
- **Google Login**: Secure authentication via Google accounts.
- **Virtual Try-On**: Users can virtually try on lenses before making a purchase.
- **Khalti Payment Integration**: Support for initializing and verifying payments through Khalti.

## Technologies

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user, product, and order information.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB and Node.js.
- **Axios**: Promise-based HTTP client for handling API requests.

## API Endpoints

### User APIs

- **Register User**: `POST /api/user/create`
  - Registers a new user with the provided data.
  
- **Login User**: `POST /api/user/login`
  - Authenticates a user and returns a token.
  
- **Google Login**: `POST /api/user/googleLogin`
  - Authenticates a user via Google account and returns a token.
  
- **Get Current User**: `GET /api/user/current`
  - Retrieves the currently logged-in user's details.
  
- **Edit User Profile**: `PUT /api/user/update`
  - Updates the user's profile information.
  
- **Upload Profile Picture**: `POST /api/user/profile_picture`
  - Uploads a profile picture for the user.
  
- **Get User by Google Email**: `POST /api/user/getUserByGoogle`
  - Retrieves user information using a Google email.

### Product APIs

- **Create Product**: `POST /api/product/create`
  - Creates a new product listing.
  
- **Get All Products**: `GET /api/product/get_all_products`
  - Retrieves all product listings.
  
- **Get Single Product**: `GET /api/product/get_one_product/:id`
  - Retrieves a single product by its ID.
  
- **Get Recommended Products**: `GET /api/product/recommend/:category`
  - Retrieves recommended products based on the category.
  
- **Update Product**: `PUT /api/product/update_product/:id`
  - Updates an existing product by its ID.
  
- **Delete Product**: `DELETE /api/product/delete/:id`
  - Deletes a product by its ID.
  
- **Search Products**: `GET /api/product/search`
  - Searches for products based on a query.
  
- **Pagination**: `GET /api/product/get_paginated_products`
  - Retrieves paginated product listings.
  
- **Get Product Count**: `GET /api/product/get_products_count`
  - Retrieves the total count of products.

### Cart APIs

- **Get Cart**: `GET /api/cart/get_cart`
  - Retrieves the current user's cart.
  
- **Add to Cart**: `POST /api/cart/add_to_cart`
  - Adds an item to the user's cart.
  
- **Remove from Cart**: `DELETE /api/cart/remove_from_cart/:id`
  - Removes an item from the user's cart.
  
- **Update Cart Quantity**: `PUT /api/cart/update_quantity`
  - Updates the quantity of an item in the cart.
  
- **Update Cart Status**: `PUT /api/cart/update_status`
  - Updates the status of the cart.

### Order APIs

- **Place Order**: `POST /api/order/place_order`
  - Places a new order.
  
- **Get Single Order**: `GET /api/order/get_single_order/:id`
  - Retrieves details of a single order by its ID.
  
- **Get All Orders**: `GET /api/order/get_all_orders`
  - Retrieves all orders.
  
- **Get Orders by User**: `GET /api/order/get_orders_by_user`
  - Retrieves all orders made by the current user.
  
- **Update Order Status**: `POST /api/order/update_order_status/:id`
  - Updates the status of an order.

### Review APIs

- **Add Review**: `POST /api/review/post_reviews`
  - Adds a review for a product.
  
- **Get Reviews**: `GET /api/review/get_reviews/:ProductId`
  - Retrieves all reviews for a specific product.
  
- **Get Reviews by User and Product**: `GET /api/review/get_reviews_by_user_and_product/:ProductId`
  - Retrieves reviews left by the current user for a specific product.
  
- **Get Average Rating**: `GET /api/review/get_average_rating/:ProductId`
  - Retrieves the average rating for a product.
  
- **Update Review**: `PUT /api/review/update_reviews/:id`
  - Updates a user's review.

### Virtual Try-On APIs

- **Upload Face Image**: `POST /api/virtual_try_on/upload_face_image`
  - Uploads a user's face image to enable the virtual try-on feature.
  
- **Try On Product**: `POST /api/virtual_try_on/try_on/:ProductId`
  - Allows the user to virtually try on a specific product using their uploaded face image.

### Khalti Payment APIs

- **Initialize Khalti Payment**: `POST /api/khalti/initialize-khalti`
  - Initializes a payment request with Khalti.
  
- **Verify Khalti Payment**: `GET /api/khalti/complete-khalti-payment`
  - Verifies the payment status with Khalti.

### External Khalti API

- **Initiate Khalti Payment**: `POST /api/v2/epayment/initiate/`
  - Initiates the payment process via the Khalti payment gateway.

## Configuration

### Environment Variables

- `REACT_APP_API_URL`:  `http://localhost:5000`
- `REACT_APP_GOOGLE_CLIENT_ID`: "348505927725-nhamp4q2f0jkqp4ov57ch1t51oir47pe.apps.googleusercontent.com"
- `REACT_APP_KHALTI_URL`: "https://a.khalti.com"
- `REACT_APP_KHALTI_PUBLIC_KEY`: "064d32e438be480288e4d15e300cbfce"

### Headers Configuration

The backend server uses Axios for making HTTP requests. The following headers are configured:

- **Content-Type**: Determines the format of the data being sent (e.g., `multipart/form-data` or `application/json`).
- **Authorization**: Bearer token for authenticating API requests.
