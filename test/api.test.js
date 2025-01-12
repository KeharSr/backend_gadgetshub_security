const request = require("supertest");
const app = require("../index");

describe("User API Tests", () => {
  let authToken = "";
  let adminToken = "";
  let productId = "";
  let favouriteId = "";
  it("Post /register | Register new user ", async () => {
    // No existing user
    const response = await request(app).post("/api/user/create").send({
      firstName: "test",
      lastName: "test",
      email: "test@gmail.com",
      password: "12345678",
      userName: "test",
      phoneNumber: "111111111",
    });
    if (response.statusCode === 201) {
      expect(response.body.message).toEqual("User created successfully");
    } else {
      expect(response.body.message).toEqual(
        "User with this email already exists!"
      );
    }
  });
  it("Post /register | Register new owner ", async () => {
    // No existing user
    const response = await request(app).post("/api/user/create").send({
      firstName: "test",
      lastName: "test",
      email: "ram@gmail.com",
      password: "12345678",
      userName: "test",
      phoneNumber: "124356789",
      isAdmin: true,
    });

    if (response.statusCode === 201) {
      expect(response.body.message).toEqual("User created successfully");
    } else {
      expect(response.body.message).toEqual(
        "User with this email already exists!"
      );
    }
  });

  it("Post /login | Login user", async () => {
    const response = await request(app).post("/api/user/login").send({
      email: "test@gmail.com",
      password: "12345678",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
    authToken = response.body.token;
  });
  it("Post /login | Login user", async () => {
    const response = await request(app).post("/api/user/login").send({
      email: "ram@gmail.com",
      password: "12345678",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
    adminToken = response.body.token;
  });

  // Get user by id
  it("Get /get | Get user by id", async () => {
    const response = await request(app)
      .get(`/api/user/current`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("user");

    expect(response.body.user).toHaveProperty("email");
    expect(response.body.user.email).toBe("test@gmail.com");
  });

  it("Post /create | Add new product ", async () => {
    const response = await request(app)
      .post("/api/product/create")
      .send({
        productName: "test",
        productDescription: "test",
        productQuantity: 2,
        productPrice: 10,
        productCategory: "test",
      })
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("message");
    console.log(response.body.product);
    productId = response.body.product._id;
  });

  // Get product by product id
  it("Get /get_single_product/:id | Get All products", async () => {
    const response = await request(app)
      .get(`/api/product/get_single_product/${productId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("product");
    // product has been added
    expect(response.body.product.productName).toBe("test");
  });

  // Delete by product id
  it("Delete /delete | Delete product", async () => {
    const response = await request(app)
      .delete(`/api/product/delete_product/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(response.body);
    expect(response.statusCode).toBe(200);
  });

  describe("Favorite API Tests", () => {
    it("Post /add | Add favorite product", async () => {
      const response = await request(app)
        .post(`/api/favourite/add_favourite`)
        .send({
          productId: productId,
        })
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message");
        favouriteId = response.body.favorite._id;
        console.log(response.body);
    });

    it("Get /get | Get favorite product", async () => {
      const response = await request(app)
        .get(`/api/favourite/get_favourite`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("favorites");
      const favorites = response.body.favorites;
      expect(favorites.length > 0).toBe(true);
    });

    it("Delete /delete | Delete favorite product", async () => {
      const response = await request(app)
        .delete(`/api/favorite/remove_favourite/${favouriteId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });
});
