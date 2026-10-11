
import { useEffect, useState } from "react";
import "./App.css";

const initialProducts = [
  { id: 1, name: "Engineering Textbooks", category: "Books", price: 450, emoji: "📚" },
  { id: 2, name: "Scientific Calculator", category: "Electronics", price: 600, emoji: "🧮" },
  { id: 3, name: "College Backpack", category: "Accessories", price: 350, emoji: "🎒" },
  { id: 4, name: "Study Table Lamp", category: "Electronics", price: 250, emoji: "💡" },
  { id: 5, name: "Class Notes Bundle", category: "Books", price: 120, emoji: "📝" },
  { id: 6, name: "Wireless Headphones", category: "Electronics", price: 700, emoji: "🎧" },
];

function App() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState("");
  const [message, setMessage] = useState("");
  const [backendMessage, setBackendMessage] = useState("Connecting...");
  const [editingProduct, setEditingProduct] = useState(null);

  // Restore the signed-in user after a browser refresh.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("campusCartUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/test")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.text();
      })
      .then(setBackendMessage)
      .catch(() => {
        setBackendMessage("Backend connection failed");
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }
        return response.json();
      })
      .then((data) => {
        setProducts(
          data.map((product) => ({
            ...product,
            emoji: product.imageUrl || "📦",
          }))
        );
      })
      .catch((error) => {
        console.error("Products loading error:", error);
      });
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const selectedProduct = products.find(
    (product) => modal === `product-${product.id}`
  );

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const isSignin = modal === "signin";

    setMessage(isSignin ? "Signing in..." : "Creating account...");

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/${isSignin ? "login" : "signup"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(isSignin ? {} : { fullName }),
            email,
            password,
          }),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        setMessage(
          data.message || `Request failed: ${response.status}`
        );
        return;
      }

      if (isSignin) {
        const user = {
          fullName: data.fullName || email.split("@")[0],
          email: data.email || email,
        };

        // Save user information so refresh will not sign them out.
        localStorage.setItem(
          "campusCartUser",
          JSON.stringify(user)
        );

        setCurrentUser(user);
        setModal("");
        setMessage("");
      } else {
        setMessage(
          data.message || "Account created successfully! Please sign in."
        );
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage("Request failed. Please check the backend.");
    }
  }

  function handleSignOut() {
    localStorage.removeItem("campusCartUser");
    setCurrentUser(null);
    setModal("");
    setMessage("You have signed out.");
  }

  async function handleAddProduct(event) {
    event.preventDefault();

    if (!currentUser) {
      setMessage("Please sign in before adding a product.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("productName") || "").trim();
    const productCategory = String(
      formData.get("productCategory") || "Books"
    );
    const price = Number(formData.get("productPrice"));
    const emoji = String(formData.get("productEmoji") || "📦").trim();

    if (!name || !Number.isFinite(price) || price <= 0) {
      setMessage("Please enter a product name and valid price.");
      return;
    }

    setMessage("Saving product...");

    try {
      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category: productCategory,
          price,
          description: "",
          sellerName: currentUser.fullName,
          imageUrl: emoji,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const savedProduct = await response.json();

      setProducts((current) => [
        ...current,
        {
          ...savedProduct,
          emoji: savedProduct.imageUrl || emoji,
        },
      ]);

      setSearch("");
      setCategory("All");
      setModal("");
      setMessage("");
    } catch (error) {
      console.error("Add product error:", error);
      setMessage(
        "Product save failed. Please check the backend terminal."
      );
    }
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setMessage("");
    setModal("edit");
  }

  async function handleEditProduct(event) {
    event.preventDefault();

    if (!editingProduct) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("productName") || "").trim();
    const productCategory = String(
      formData.get("productCategory") || "Books"
    );
    const price = Number(formData.get("productPrice"));
    const emoji = String(formData.get("productEmoji") || "📦").trim();

    if (!name || !Number.isFinite(price) || price <= 0) {
      setMessage("Please enter a valid product name and price.");
      return;
    }

    setMessage("Updating product...");

    try {
      const response = await fetch(
        `http://localhost:8080/api/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            category: productCategory,
            price,
            description: editingProduct.description || "",
            sellerName: editingProduct.sellerName || "",
            imageUrl: emoji,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedProduct = await response.json();

      setProducts((current) =>
        current.map((product) =>
          product.id === updatedProduct.id
            ? {
                ...updatedProduct,
                emoji: updatedProduct.imageUrl || emoji,
              }
            : product
        )
      );

      setEditingProduct(null);
      setModal("");
      setMessage("");
    } catch (error) {
      console.error("Edit product error:", error);
      setMessage(
        "Product update failed. Please check the backend terminal."
      );
    }
  }

  async function handleDeleteProduct(product) {
    if (!currentUser) {
      setMessage("Please sign in first.");
      setModal("signin");
      return;
    }

    if (!product.id) {
      setMessage("This product has no database ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setModal("");
      setMessage("");
    } catch (error) {
      console.error("Delete product error:", error);
      setMessage(
        "Delete failed. Please check the backend terminal."
      );
    }
  }

  function closeModal() {
    setModal("");
    setMessage("");
    setEditingProduct(null);
  }

  function openSellModal() {
    setMessage("");

    if (!currentUser) {
      setModal("signin");
      return;
    }

    setModal("sell");
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home">
          Campus<span>Cart.</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#products">Marketplace</a>
          <a href="#about">About</a>
        </nav>

        <button className="add-product-btn" onClick={openSellModal}>
          + Add Product
        </button>

        <div className="nav-actions">
          {currentUser ? (
            <>
              <button
                className="signin-btn"
                onClick={() => {
                  setMessage("");
                  setModal("profile");
                }}
              >
                👤 My Profile
              </button>

              <button className="signup-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                className="signin-btn"
                onClick={() => {
                  setMessage("");
                  setModal("signin");
                }}
              >
                Sign In
              </button>

              <button
                className="signup-btn"
                onClick={() => {
                  setMessage("");
                  setModal("signup");
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              🎓 MADE FOR COLLEGE STUDENTS
            </span>

            <h1>
              Your Campus.
              <br />
              Your <span>Marketplace.</span>
            </h1>

            <p>{backendMessage}</p>

            <p>
              Buy, sell, and discover affordable essentials within your
              college community.
            </p>

            <div className="hero-actions">
              <a className="primary-btn" href="#products">
                Explore Products →
              </a>

              <button className="secondary-btn" onClick={openSellModal}>
                Start Selling
              </button>
            </div>

            <div className="hero-note">
              ✨ Affordable finds. Student-friendly prices.
            </div>
          </div>

          <div className="hero-art" aria-label="College essentials">
            <div className="art-circle"></div>
            <div className="floating-card card-top">📚 Textbooks</div>
            <div className="main-illustration">🎒</div>
            <div className="floating-card card-bottom">
              💜 Great deals for students
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE STUDENT COLLECTION</span>
              <h2>Explore the Marketplace</h2>
              <p>Find useful items for your college life.</p>
            </div>
          </div>

          <div className="search-box">
            <span>🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search books, electronics, bags..."
            />
          </div>

          <div className="category-list">
            {["All", "Books", "Electronics", "Accessories"].map((item) => (
              <button
                key={item}
                className={
                  category === item ? "category active" : "category"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div
                  className="product-image"
                  onClick={() => setModal(`product-${product.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="product-emoji">
                    {product.emoji || "📦"}
                  </span>
                  <span className="condition">Student pick</span>
                </div>

                <div className="product-info">
                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <div className="product-bottom">
                    <strong>₹{product.price}</strong>

                    <button
                      className="contact-btn"
                      onClick={() => {
                        setMessage("");
                        setModal("signin");
                      }}
                    >
                      Contact Seller
                    </button>
                  </div>

                  <div
                    className="product-management"
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => openEditProduct(product)}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="contact-btn"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <p className="empty-message">
              No products found. Try another search.
            </p>
          )}
        </section>

        <section className="sell-banner" id="about">
          <div>
            <span className="eyebrow">GOT SOMETHING TO SELL?</span>
            <h2>Give your unused items a new home.</h2>
            <p>Help another student while earning some extra money.</p>
          </div>

          <button className="banner-btn" onClick={openSellModal}>
            Sell a Product →
          </button>
        </section>
      </main>

      <footer>
        <a className="logo" href="#home">
          Campus<span>Cart.</span>
        </a>
        <p>Built for students, powered by community. 💜</p>
      </footer>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="auth-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={closeModal}
              aria-label="Close dialog"
            >
              ×
            </button>

            {modal === "profile" && currentUser ? (
              <div className="sell-product-form">
                <div className="modal-logo">👤</div>
                <h2>My Profile</h2>
                <p className="modal-subtitle">
                  Your CampusCart account details.
                </p>

                <div
                  style={{
                    textAlign: "left",
                    margin: "20px 0",
                    lineHeight: 1.9,
                  }}
                >
                  <p>
                    <strong>Full Name:</strong> {currentUser.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {currentUser.email}
                  </p>
                  <p>
                    <strong>My Listings:</strong>{" "}
                    {
                      products.filter(
                        (product) =>
                          product.sellerName === currentUser.fullName
                      ).length
                    }
                  </p>
                </div>

                <button
                  className="submit-btn"
                  type="button"
                  onClick={handleSignOut}
                >
                  Sign Out →
                </button>
              </div>
            ) : modal === "edit" && editingProduct ? (
              <div className="sell-product-form">
                <div className="modal-logo">✏️</div>
                <h2>Edit Product</h2>
                <p className="modal-subtitle">
                  Update your product details.
                </p>

                <form onSubmit={handleEditProduct}>
                  <label>
                    Product Name
                    <input
                      type="text"
                      name="productName"
                      defaultValue={editingProduct.name}
                      maxLength={80}
                      required
                    />
                  </label>

                  <label>
                    Category
                    <select
                      name="productCategory"
                      defaultValue={editingProduct.category}
                      required
                    >
                      <option value="Books">Books</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </label>

                  <label>
                    Price (₹)
                    <input
                      type="number"
                      name="productPrice"
                      defaultValue={editingProduct.price}
                      min="1"
                      step="1"
                      required
                    />
                  </label>

                  <label>
                    Product Emoji
                    <input
                      type="text"
                      name="productEmoji"
                      defaultValue={editingProduct.emoji || "📦"}
                      maxLength={8}
                    />
                  </label>

                  <button className="submit-btn" type="submit">
                    Save Changes →
                  </button>

                  {message && <p className="form-message">{message}</p>}
                </form>
              </div>
            ) : selectedProduct ? (
              <div className="product-details">
                <div className="modal-logo">
                  {selectedProduct.emoji || "📦"}
                </div>

                <span className="product-category">
                  {selectedProduct.category}
                </span>

                <h2>{selectedProduct.name}</h2>

                <p className="modal-subtitle">
                  A useful find for your campus life.
                </p>

                <h3>₹{selectedProduct.price}</h3>
                <p>Condition: Student pick</p>

                <button
                  className="submit-btn"
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setModal("signin");
                  }}
                >
                  Contact Seller →
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => openEditProduct(selectedProduct)}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="contact-btn"
                    type="button"
                    onClick={() => handleDeleteProduct(selectedProduct)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ) : modal === "sell" ? (
              <div className="sell-product-form">
                <div className="modal-logo">🛍️</div>
                <h2>Sell a Product</h2>
                <p className="modal-subtitle">
                  Add an item to your campus marketplace.
                </p>

                <form onSubmit={handleAddProduct}>
                  <label>
                    Product Name
                    <input
                      type="text"
                      name="productName"
                      placeholder="e.g. Lab coat"
                      maxLength={80}
                      required
                    />
                  </label>

                  <label>
                    Category
                    <select
                      name="productCategory"
                      defaultValue="Books"
                      required
                    >
                      <option value="Books">Books</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </label>

                  <label>
                    Price (₹)
                    <input
                      type="number"
                      name="productPrice"
                      placeholder="e.g. 300"
                      min="1"
                      step="1"
                      required
                    />
                  </label>

                  <label>
                    Product Emoji (optional)
                    <input
                      type="text"
                      name="productEmoji"
                      placeholder="📦"
                      maxLength={8}
                    />
                  </label>

                  <button className="submit-btn" type="submit">
                    Add Product →
                  </button>

                  {message && <p className="form-message">{message}</p>}
                </form>
              </div>
            ) : (
              <>
                <div className="modal-logo">🎓</div>

                <h2>
                  {modal === "signin"
                    ? "Welcome back!"
                    : "Join CampusCart"}
                </h2>

                <p className="modal-subtitle">
                  {modal === "signin"
                    ? "Sign in to continue your campus journey."
                    : "Create an account and join your campus community."}
                </p>

                <div className="modal-tabs">
                  <button
                    type="button"
                    className={modal === "signin" ? "tab selected" : "tab"}
                    onClick={() => {
                      setModal("signin");
                      setMessage("");
                    }}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    className={modal === "signup" ? "tab selected" : "tab"}
                    onClick={() => {
                      setModal("signup");
                      setMessage("");
                    }}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {modal === "signup" && (
                    <label>
                      Full Name
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Enter your full name"
                        required
                      />
                    </label>
                  )}

                  <label>
                    College Email
                    <input
                      type="email"
                      name="email"
                      placeholder="you@college.edu"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      minLength={8}
                      required
                    />
                  </label>

                  <button className="submit-btn" type="submit">
                    {modal === "signin"
                      ? "Sign In →"
                      : "Create Account →"}
                  </button>

                  {message && <p className="form-message">{message}</p>}
                </form>

                <p className="terms">
                  By continuing, you agree to use CampusCart responsibly.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
