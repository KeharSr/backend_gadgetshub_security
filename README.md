# GadgetsHub Backend

The backend server for GadgetsHub eCommerce platform, providing a secure and scalable API infrastructure. It is designed to handle core functionalities such as user authentication, product management, order processing, virtual try-on features, and secure integration with the Khalti payment gateway, with a strong focus on security and user data protection.

## Security Features

To ensure a secure and reliable experience for users, the backend implements the following advanced security mechanisms:

### 1. HTTPS with SSL/TLS
- All data transmitted between the client and server is encrypted using HTTPS, ensuring confidentiality and integrity.
- SSL/TLS certificates are regularly renewed to prevent unauthorized access or data tampering during transmission.

### 2. Rate Limiting
- Limits the number of requests a user or IP address can make within a specific timeframe.
- Prevents abusive behaviors like denial-of-service (DoS) attacks and brute-force attempts by restricting excessive requests.

### 3. Role-Based Access Control (RBAC)
- Assigns specific permissions based on user roles (e.g., regular users, logged-in users, and administrators).
- Protects sensitive functionalities and ensures that only authorized users can access critical operations like product management or order processing.

### 4. Input Validation and Sanitization
- Validates and sanitizes all user inputs to prevent injection attacks and cross-site scripting (XSS).
- Utilizes tools like **DOMPurify** to ensure no malicious code (e.g., `<script>` tags) can be executed in user-submitted content such as reviews or form fields.

### 5. Secure Authentication with JWT
- Implements JSON Web Tokens (JWT) for secure session management.
- Tokens are time-limited to reduce the risk of session hijacking, with automatic expiration after a defined period.
- Tokens include user role information to enforce role-based permissions seamlessly.

### 6. Password Security
- Enforces strong password policies requiring uppercase letters, lowercase letters, numbers, and special characters.
- Passwords are securely hashed using **bcrypt** with salting, ensuring that even if the database is compromised, passwords remain protected.
- Prevents password reuse by comparing the new password with previously used passwords.

### 7. Account Locking After Multiple Failed Logins
- Temporarily locks user accounts after three consecutive failed login attempts.
- Protects against brute-force attacks by introducing delays between login attempts.

### 8. CAPTCHA Integration
- Integrates Google reCAPTCHA to differentiate between humans and bots during critical actions like login and account creation.
- Blocks automated scripts from abusing the system.

### 9. Activity Logging
- Tracks all significant user actions (e.g., logins, product updates, and order placements) in detailed logs.
- Logs help detect unauthorized activities, debug issues, and maintain an audit trail for accountability.

### 10. File Upload Security
- Restricts file uploads to specific allowed formats (e.g., images for profile pictures).
- Prevents malicious files from being uploaded by validating file extensions and MIME types.

## Features

In addition to strong security measures, the backend offers the following functionalities:

### User Management
- Registration, login (including Google login), and profile management with JWT authentication.
- Upload and update profile pictures securely.

### Product Management
- Full CRUD operations for products with category-based recommendations and search functionality.

### Cart and Order Management
- Comprehensive cart management, including adding, removing, and updating cart items.
- Secure order placement and history retrieval with detailed order status updates.

### Review System
- Users can leave, update, and view product reviews.
- Provides average ratings for products based on user reviews.

### Khalti Payment Integration
- Enables secure payment initialization and verification using the Khalti payment gateway.

## Technologies Used

- **Node.js**: Server-side runtime for building scalable applications.
- **Express.js**: Web framework for handling API routes and middleware.
- **MongoDB**: NoSQL database for data storage.
- **Mongoose**: ODM library for modeling MongoDB data in Node.js.
- **Axios**: HTTP client for handling API requests.

## Security Configuration Details

### Middleware
- **Helmet**: Adds secure HTTP headers, including Content Security Policy (CSP) and HTTP Strict Transport Security (HSTS).
- **CORS**: Manages cross-origin resource sharing to allow safe communication between the backend and frontend.
- **Morgan**: Logs HTTP requests for monitoring and debugging.

### Authentication and Authorization
- **JWT**: Used for token-based authentication with role-based permissions.
- Tokens include user roles to enforce access control at both the route and application levels.

### Environment Variables
Ensure sensitive keys and configuration values are stored securely using `.env` files. Key variables include:
- `JWT_SECRET`: Secret for signing JWT tokens.
- `REACT_APP_API_URL`: Base URL for the backend server.
- `REACT_APP_KHALTI_PUBLIC_KEY`: Khalti payment gateway public key.
