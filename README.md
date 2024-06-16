# AWS RS School Shop

# Task 3.1

- [] Create a lambda function called getProductsList under the same AWS CDK Stack file of Product Service which will be triggered by the HTTP GET method.
- [] The requested URL should be /products.
- [] The response from the lambda should be a full array of products (mock data should be used - this mock data should be stored in Product Service).
- [] This endpoint should be integrated with Frontend app for PLP (Product List Page) representation.

# Task 3.2

- [] Create a lambda function called getProductsById under the same AWS CDK Stack file of Product Service which will be triggered by the HTTP GET method.
- [] The requested URL should be /products/{productId} (what productId is in your application is up to you - productName, UUID, etc.).
- [] The response from the lambda should be 1 searched product from an array of products (mock data should be used - this mock data should be stored in Product Service).
- [] This endpoint is not needed to be integrated with Frontend right now.
