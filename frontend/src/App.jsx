
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");
const heroSlides = [
  {
    image: "/images/hero-banner.jpg",
    eyebrow: "MIRA BEAUTY SHOP",
    title: (
      <>
        Reveal Your
        <br />
        Timeless Glow
      </>
    ),
    description: "Premium beauty essentials for your most radiant you.",
    first: true,
  },
  {
    image: "/images/hero-banner-2.jpg",
    eyebrow: "YOUR DAILY BEAUTY RITUAL",
    title: <>Glow Naturally</>,
    description: "",
    first: false,
  },
  {
    image: "/images/hero-banner-3.jpg",
    eyebrow: "THE BEAUTY COLLECTION",
    title: <>Discover Your Beauty</>,
    description: "",
    first: false,
  },
];


const categories = [
  {
    name: "Skincare",
    image: "/images/category-skincare.jpg",
    keywords: ["serum", "skincare", "moisturizer", "cream", "cleanser", "toner", "dưỡng", "kem", "sữa rửa mặt"],
    categoryId: 1,
  },
  {
    name: "Makeup",
    image: "/images/category-lipstick.jpg",
    keywords: ["lipstick", "foundation", "makeup", "mascara", "eyeshadow", "son", "kem nền", "phấn"],
    categoryId: 2,
  },
  {
    name: "Sunscreen",
    image: "/images/category-serum.jpg",
    keywords: ["sunscreen", "sun protection", "kem chống nắng"],
    categoryId: 3,
  },
  {
    name: "Body Care",
    image: "/images/category-bodycare.jpg",
    keywords: ["body lotion", "body wash", "body care", "body cream"],
    categoryId: 4,
  },
  {
    name: "Fragrance",
    image: "/images/category-perfume.jpg",
    keywords: ["perfume", "fragrance", "eau de parfum", "nước hoa"],
    categoryId: null,
  },

  {
    name: "Tools & Accessories",
    image: "/images/category-eye-makeup.jpg",
    keywords: ["brush", "sponge", "accessory", "makeup tools"],
    categoryId: null,
  },
];

const fallbackImages = [
  "/images/product-serum.jpg",
  "/images/product-cream.jpg",
  "/images/product-cleanser.jpg",
  "/images/product-toner.jpg",
  "/images/product-vitamin-c.jpg",
  "/images/product-night-cream.jpg",
  "/images/product-essence.jpg",
  "/images/product-face-mist.jpg",
  "/images/product-lipstick.jpg",
  "/images/product-foundation.jpg",
  "/images/product-eyeshadow.jpg",
  "/images/product-mascara.jpg",
  "/images/product-blush.jpg",
  "/images/product-concealer.jpg",
  "/images/product-highlighter.jpg",
  "/images/product-setting-spray.jpg",
  "/images/product-sunscreen.jpg",
  "/images/product-sun-gel.jpg",
  "/images/product-tinted-sunscreen.jpg",
  "/images/product-sun-cream.jpg",
  "/images/product-body-lotion.jpg",
  "/images/product-body-wash.jpg",
  "/images/product-body-scrub.jpg",
  "/images/product-hand-cream.jpg",
  "/images/product-perfume-floral.jpg",
  "/images/product-perfume-citrus.jpg",
  "/images/product-perfume-mist.jpg",
  "/images/product-perfume-gift-set.jpg",
  "/images/product-shampoo.jpg",
  "/images/product-conditioner.jpg",
  "/images/product-body-lotion.jpg",
  "/images/product-body-wash.jpg",
  "/images/product-body-scrub.jpg",
  "/images/product-hand-cream.jpg",
];

const productFallbackImages = [
  "/images/product-cleanser.jpg",
  "/images/product-face-mist.jpg",
  "/images/product-cream.jpg",
  "/images/product-serum.jpg",
  "/images/product-essence.jpg",
  "/images/product-vitamin-c.jpg",
  "/images/product-night-cream.jpg",
  "/images/product-sun-gel.jpg",
  "/images/product-hand-cream.jpg",
  "/images/product-setting-spray.jpg",
  "/images/product-shampoo.jpg",
  "/images/product-toner.jpg",
  "/images/product-conditioner.jpg",
  "/images/product-sun-cream.jpg",
  "/images/product-tinted-sunscreen.jpg",
  "/images/product-sunscreen.jpg",
  "/images/product-foundation.jpg",
  "/images/product-lipstick.jpg",
  "/images/product-mascara.jpg",
  "/images/product-concealer.jpg",
  "/images/product-blush.jpg",
  "/images/product-highlighter.jpg",
  "/images/product-eyeshadow.jpg",
  "/images/product-perfume-mist.jpg",
  "/images/product-perfume-citrus.jpg",
  "/images/product-perfume-floral.jpg",
  "/images/product-perfume-gift-set.jpg",
  "/images/product-body-wash.jpg",
  "/images/product-body-lotion.jpg",
  "/images/product-body-scrub.jpg",
];

const uniqueFallbackImages = [...new Set(fallbackImages)];


const collections = [
  { title: "Skincare Essentials", subtitle: "Healthy skin, happy you.", image: "/images/category-skincare.jpg" },
  { title: "Makeup Must-Haves", subtitle: "Create your signature look.", image: "/images/category-lipstick.jpg" },
  { title: "Haircare Rituals", subtitle: "Care for every strand.", image: "/images/experience-2.jpg" },
  { title: "Fragrance Collection", subtitle: "Scents that tell your story.", image: "/images/category-perfume.jpg" },
];

function getId(product) {
  return product.ProductId ?? product.productId ?? product.id;
}

function getName(product) {
  return product.ProductName ?? product.productName ?? product.name ?? "Beauty Essential";
}

function getPrice(product) {
  return Number(product.Price ?? product.price ?? 0);
}

function getImage(product, index = 0) {
  const image = String(product.ImageUrl ?? product.imageUrl ?? "").trim();
  if (image && (/^(https?:|data:image\/)/i.test(image) || image.startsWith("/"))) {
    return image;
  }
  if (image && !/^[a-z]+:/i.test(image)) {
    return `/${image.replace(/^(?:\.\/)+/, "")}`;
  }
  return fallbackImages[index % fallbackImages.length];
}

function getProductFallback(product, index = 0) {
  const productId = Number(getId(product));
  if (Number.isInteger(productId) && productId >= 5 && productId <= 34) {
    return productFallbackImages[productId - 5];
  }
  return uniqueFallbackImages[index % uniqueFallbackImages.length];
}

function formatPrice(price) {
  return Number(price).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function SafeImage({ src, alt, className = "", fallback = "/images/product-serum.jpg", loading = "lazy" }) {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  return (
    <img
      className={className}
      src={imageSrc}
      alt={alt}
      loading={loading}
      onError={() => {
        if (imageSrc !== fallback) setImageSrc(fallback);
      }}
    />
  );
}

function PromoBanner({ image, eyebrow, title, description, buttonText = "Explore Now", onClick, className = "" }) {
  return (
    <section className={`promo-banner ${className}`}>
      <SafeImage
        src={image}
        alt={title}
        className="promo-banner-image"
        fallback="/images/category-skincare.jpg"
      />
      <div className="promo-banner-content">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" className="primary-button" onClick={onClick}>
          {buttonText} →
        </button>
      </div>
    </section>
  );
}

function ProductCard({ product, index, onOpen, favorites, onFavorite, onAdd }) {
  const id = getId(product);
  const liked = favorites.some((item) => getId(item) === id);

  return (
    <article className="product-card">
      <div
        className="product-photo"
        role="button"
        tabIndex={0}
        onClick={() => onOpen(product, getImage(product, index), getProductFallback(product, index))}
        onKeyDown={(event) => {
          if (event.key === "Enter") onOpen(product, getImage(product, index), getProductFallback(product, index));
        }}
      >
        <SafeImage
          src={getImage(product, index)}
          alt={getName(product)}
          fallback={getProductFallback(product, index)}
        />
        {index === 0 && <span className="product-label">Bestseller</span>}
        <button
          type="button"
          className={`heart-button ${liked ? "is-liked" : ""}`}
          aria-label="Add Love"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(product);
          }}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      <div className="product-copy">
        <span className="product-brand">
          {product.Brand ?? product.brand ?? "MIRA BEAUTY"}
        </span>
        <h3 onClick={() => onOpen(product, getImage(product, index), getProductFallback(product, index))}>{getName(product)}</h3>
        <p>{product.Description ?? product.description ?? "A little daily ritual for your beauty."}</p>
        <div className="product-rating">★★★★★ <span>Customer favourite</span></div>
        <div className="product-price-row">
          <strong>{formatPrice(getPrice(product))}</strong>
          <span>Stock: {product.StockQuantity ?? product.stockQuantity ?? 0}</span>
        </div>
        <button type="button" className="add-cart-button" onClick={() => onAdd(product)}>
          ＋ Add Carts
        </button>
      </div>
    </article>
  );
}

function App() {
  const isStorefrontPreview = new URLSearchParams(window.location.search).get("preview") === "storefront";
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
  const timer = setInterval(() => {
    setActiveSlide((current) => (current + 1) % heroSlides.length);
  }, 4000);

  return () => clearInterval(timer);
}, []);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Shop All");
  const [page, setPage] = useState(() => {
    if (isStorefrontPreview) return "home";
    try {
      return JSON.parse(localStorage.getItem("mira-user") || "null")?.role === "Admin" ? "admin" : "home";
    } catch {
      return "home";
    }
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductImage, setSelectedProductImage] = useState("");
  const [selectedProductImageFallback, setSelectedProductImageFallback] = useState(fallbackImages[0]);
  const [detailImageView, setDetailImageView] = useState("main");
  const [detailTab, setDetailTab] = useState("description");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mira-user") || "null"); } catch { return null; }
  });
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [checkoutForm, setCheckoutForm] = useState({ fullName: "", phone: "", address: "" });
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminEditorOpen, setAdminEditorOpen] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [myOrders, setMyOrders] = useState([]);
  const [adminForm, setAdminForm] = useState({ ProductName: "", Brand: "", Description: "", Price: "", StockQuantity: 0, CategoryId: 1, ImageUrl: "/images/product-serum.jpg" });
  const [adminEditingId, setAdminEditingId] = useState(null);
  const [adminToday] = useState(() => new Date());

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mira-cart") || "[]");
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mira-favorites") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/products`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("API sản phẩm trả về lỗi.");
        return response.json();
      })
      .then((result) => {
        if (!result.success) throw new Error(result.message || "Không tải được sản phẩm.");
        setProducts(Array.isArray(result.data) ? result.data : []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setApiError("Không kết nối được API. Hãy kiểm tra backend tại cổng 5000.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem("mira-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("mira-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (user) localStorage.setItem("mira-user", JSON.stringify(user));
    else localStorage.removeItem("mira-user");
  }, [user]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    const category = categories.find((item) => item.name === selectedCategory);

    return products.filter((product) => {
      const searchable = `${getName(product)} ${product.Brand ?? ""} ${product.Description ?? ""}`.toLocaleLowerCase("vi");
      const matchesSearch = !keyword || searchable.includes(keyword);
      const matchesCategory =
        !category || category.keywords.some((word) => searchable.includes(word));
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product, image = getImage(product), imageFallback = getProductFallback(product)) {
    setSelectedProduct(product);
    setSelectedProductImage(image);
    setSelectedProductImageFallback(imageFallback);
    setDetailImageView("main");
    setDetailTab("description");
    setDetailQuantity(1);
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart(product) {
    const id = getId(product);

    setCart((current) => {
      const exists = current.some((item) => getId(item) === id);
      return exists
        ? current.map((item) =>
            getId(item) === id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { ...product, quantity: 1 }];
    });

    showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          getId(item) === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function toggleFavorite(product) {
    const id = getId(product);
    const exists = favorites.some((item) => getId(item) === id);

    setFavorites((current) =>
      exists
        ? current.filter((item) => getId(item) !== id)
        : [...current, product]
    );

    showNotice(exists ? "Đã bỏ khỏi yêu thích." : "Đã thêm vào yêu thích.");
  }

  function chooseCategory(name) {
    setSelectedCategory(name);
    setPage("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  
  function renderProductGrid(items) {
    if (!items.length) {
      return (
        <p className="empty-state">
          Chưa có sản phẩm phù hợp.
        </p>
      );
    }

    const groups = [];

    for (let i = 0; i < items.length; i += 8) {
      groups.push(items.slice(i, i + 8));
    }

    return (
      <div className="product-grid-with-banners">
        {groups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`}>
            <div className="product-grid">
              {group.map((product, index) => (
                <ProductCard
                  key={getId(product) ?? `${groupIndex}-${index}`}
                  product={product}
                  index={groupIndex * 8 + index}
                  onOpen={openProduct}
                  favorites={favorites}
                  onFavorite={toggleFavorite}
                  onAdd={addToCart}
                />
              ))}
            </div>

            {groupIndex < groups.length - 1 && (
              <PromoBanner
                image={
                  groupIndex % 2 === 0
                    ? "/images/collection-banner.jpg"
                    : "/images/hero-banner-2.jpg"
                }
                eyebrow="DISCOVER MIRA"
                title={
                  groupIndex % 2 === 0
                    ? "Your Everyday Beauty Ritual"
                    : "Find Your Natural Glow"
                }
                description="Discover beauty essentials for your daily routine."
                buttonText="Explore Now"
                onClick={() => chooseCategory("Shop All")}
                className="product-promo-banner"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderCategorySection(category, index) {
    const items = products.filter((product) => {
      const categoryId = product.CategoryId ?? product.categoryId;

      if (category.categoryId != null) {
        return Number(categoryId) === category.categoryId;
      }

      const searchable = [
        getName(product),
        product.Brand ?? product.brand ?? "",
        product.Description ?? product.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return category.keywords.some((word) =>
        searchable.includes(word.toLowerCase())
      );
    });

    return (
      <section
        className="category-products-section"
        key={category.name}
        id={`category-${index}`}
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">DISCOVER MIRA</span>
            <h2>{category.name}</h2>
            <p className="muted">
              Discover your everyday beauty essentials.
            </p>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => chooseCategory(category.name)}
          >
            View All →
          </button>
        </div>

        {items.length > 0 ? (
          renderProductGrid(items.slice(0, 4))
        ) : (
          <p className="empty-state">
            New {category.name.toLowerCase()} products are coming soon.
          </p>
        )}
      </section>
    );
  }

  async function submitAuth(event) {
    event.preventDefault();
    try {
      const endpoint = authMode === "login" ? "login" : "register";
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể xác thực tài khoản.");
      setUser(result.data);
      showNotice(authMode === "login" ? "Đăng nhập thành công." : "Đăng ký thành công.");
      goToPage(result.data.role === "Admin" ? "admin" : "home");
    } catch (error) { showNotice(error.message || "Không kết nối được máy chủ."); }
  }

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token || ""}`, ...(options.headers || {}) },
    });
  }

  async function loadAdmin() {
    setAdminLoading(true);
    setAdminError("");
    try {
      const [summaryResponse, productsResponse, ordersResponse, usersResponse] = await Promise.all([
        authFetch(`${API_URL}/admin/summary`),
        authFetch(`${API_URL}/admin/products`),
        authFetch(`${API_URL}/admin/orders`),
        authFetch(`${API_URL}/admin/users`),
      ]);
      const [summary, products, orders, users] = await Promise.all([
        summaryResponse.json(),
        productsResponse.json(),
        ordersResponse.json(),
        usersResponse.json(),
      ]);
      const failedResponse = [
        [summaryResponse, summary],
        [productsResponse, products],
        [ordersResponse, orders],
        [usersResponse, users],
      ].find(([response, result]) => !response.ok || !result.success);
      if (failedResponse) {
        throw new Error(failedResponse[1].message || "Không tải được dữ liệu quản trị.");
      }
      setAdminSummary(summary.data);
      setAdminProducts(products.data);
      setAdminOrders(orders.data);
      setAdminUsers(users.data);
    } catch (error) {
      const message = error.message || "Không kết nối được máy chủ.";
      setAdminError(message);
      showNotice(message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function saveAdminProduct(event) {
    event.preventDefault();
    try {
      const editing = Boolean(adminEditingId);
      const response = await authFetch(`${API_URL}/admin/products${editing ? `/${adminEditingId}` : ""}`, {
        method: editing ? "PUT" : "POST", body: JSON.stringify({ ...adminForm, Price: Number(adminForm.Price), StockQuantity: Number(adminForm.StockQuantity), CategoryId: Number(adminForm.CategoryId) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Không lưu được sản phẩm.");
      setAdminForm({ ProductName: "", Brand: "", Description: "", Price: "", StockQuantity: 0, CategoryId: 1, ImageUrl: "/images/product-serum.jpg" });
      setAdminEditingId(null);
      setAdminEditorOpen(false);
      await loadAdmin();
      showNotice("Đã lưu sản phẩm.");
      const productResponse = await fetch(`${API_URL}/products`);
      const productResult = await productResponse.json();
      if (!productResponse.ok || !productResult.success) throw new Error(productResult.message || "Không tải lại được danh sách sản phẩm.");
      setProducts(productResult.data || []);
      setPreviewRevision((revision) => revision + 1);
    } catch (error) { showNotice(error.message); }
  }

  async function toggleAdminProduct(id, isActive) {
    try {
      const response = await authFetch(`${API_URL}/admin/products/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không cập nhật được sản phẩm.");
      await loadAdmin();
      const publicResponse = await fetch(`${API_URL}/products`);
      const publicResult = await publicResponse.json();
      if (!publicResponse.ok || !publicResult.success) throw new Error(publicResult.message || "Không tải lại được danh sách sản phẩm.");
      setProducts(publicResult.data || []);
      setPreviewRevision((revision) => revision + 1);
      showNotice(isActive ? "Đã hiển thị sản phẩm." : "Đã ẩn sản phẩm.");
    } catch (error) { showNotice(error.message || "Không kết nối được máy chủ."); }
  }

  async function updateAdminUser(id, updates) {
    try {
      const response = await authFetch(`${API_URL}/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không cập nhật được người dùng.");
      await loadAdmin();
      showNotice("Đã cập nhật người dùng.");
    } catch (error) {
      showNotice(error.message || "Không kết nối được máy chủ.");
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      const response = await authFetch(`${API_URL}/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Không cập nhật được đơn hàng.");
      await loadAdmin();
    } catch (error) { showNotice(error.message); }
  }

  async function loadMyOrders() {
    if (!user) return;
    try {
      const response = await authFetch(`${API_URL}/orders/my`);
      const result = await response.json();
      if (response.ok) setMyOrders(result.data || []);
      else showNotice(result.message || "Không tải được đơn hàng.");
    } catch { showNotice("Không kết nối được máy chủ."); }
  }

  async function checkout(event) {
    event.preventDefault();
    if (!user) { setAuthMode("login"); goToPage("account"); showNotice("Vui lòng đăng nhập trước khi đặt hàng."); return; }
    try {
      const response = await authFetch(`${API_URL}/orders`, {
        method: "POST",
        body: JSON.stringify({ items: cart.map(item => ({ productId: getId(item), quantity: item.quantity })), ...checkoutForm })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Không thể tạo đơn hàng.");
      setCart([]); showNotice(`Đặt hàng thành công. Mã đơn: ${result.data.orderId}`); goToPage("orders");
    } catch (error) { showNotice(error.message); }
  }

  function buyNow(product) {
    setCart([{ ...product, quantity: detailQuantity }]);
    goToPage("checkout");
  }

  useEffect(() => { if (page === "admin" && user?.role === "Admin") loadAdmin(); if (page === "orders" && user) loadMyOrders(); }, [page, user?.role]);

  function previousSlide() {
    setActiveSlide(
      (current) => (current - 1 + heroSlides.length) % heroSlides.length
    );
  }

  function nextSlide() {
    setActiveSlide(
      (current) => (current + 1) % heroSlides.length
    );
  }

  const filteredAdminProducts = adminProducts.filter((product) =>
    `${product.ProductName} ${product.Brand || ""}`.toLocaleLowerCase("vi").includes(adminSearch.trim().toLocaleLowerCase("vi"))
  );
  const filteredAdminOrders = adminOrders.filter((order) =>
    `${order.OrderId} ${order.CustomerName} ${order.Phone} ${order.Status}`.toLocaleLowerCase("vi").includes(adminSearch.trim().toLocaleLowerCase("vi"))
  );
  const filteredAdminUsers = adminUsers.filter((adminUser) =>
    `${adminUser.FullName} ${adminUser.Email} ${adminUser.Role}`.toLocaleLowerCase("vi").includes(adminSearch.trim().toLocaleLowerCase("vi"))
  );

  return (
    <div className="mira-site">
      {page !== "admin" && <>
      <div className="promo-bar">
        <span>✧ Free Shipping on Orders Over 500K</span>
        <span>Get 10% Off Your First Order · Code: <b>MIRA10</b></span>
      </div>

      <header className="site-header">
        <button type="button" className="brand-lockup" onClick={() => goToPage("home")}>
          <span className="brand-flower">❀</span>
          <span className="brand-wordmark">MIRA<small>BEAUTY SHOP</small></span>
        </button>

        <nav className="header-nav">
          <button type="button" onClick={() => goToPage("home")}>Home</button>
          <button type="button" onClick={() => chooseCategory("Shop All")}>Shop</button>
          <button type="button" onClick={() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" })}>Collections</button>
          <button type="button" onClick={() => document.getElementById("beauty-experience")?.scrollIntoView({ behavior: "smooth" })}>Beauty Tips</button>
          <button type="button" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>About</button>
        </nav>

        <form className="search-box" onSubmit={(event) => {
          event.preventDefault();
          setSelectedCategory("Shop All");
          goToPage("shop");
        }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search skincare, makeup..."
            aria-label="Tìm sản phẩm"
          />
          <button type="submit" aria-label="Tìm kiếm">⌕</button>
        </form>

        <div className="header-actions">
          <button type="button" aria-label="Tài khoản" onClick={() => goToPage(user?.role === "Admin" ? "admin" : "account")}>♙{user ? <small>{user.name || user.email}</small> : null}</button>
          <button type="button" aria-label="Yêu thích" onClick={() => goToPage("favorites")}>♡<small>{favorites.length}</small></button>
          <button type="button" aria-label="Giỏ hàng" onClick={() => goToPage("cart")}>♧<small>{cartCount}</small></button>
        </div>
      </header>
      </>}

      {notice && <div className="toast-message">{notice}</div>}

      {page === "home" && (
        <main>
          <section className="hero-banner home-hero" aria-label="Bộ sưu tập MIRA Beauty">
            <img
              key={heroSlides[activeSlide].image}
              className="hero-image"
              src={heroSlides[activeSlide].image}
              alt={heroSlides[activeSlide].eyebrow}
            />

            <div className={`hero-content ${activeSlide === 0 ? "hero-content-first" : "hero-content-minimal"}`}>
              <span className="eyebrow">{activeSlide === 0 ? "MIRA BEAUTY · CHĂM SÓC BẠN MỖI NGÀY" : heroSlides[activeSlide].eyebrow}</span>
              <h1>{activeSlide === 0 ? <>ĐÁNH THỨC<br />VẺ ĐẸP<br />TỰ NHIÊN</> : heroSlides[activeSlide].title}</h1>
              <p>{activeSlide === 0 ? "Chọn những điều dịu dàng cho làn da và dành một chút yêu thương cho chính mình." : heroSlides[activeSlide].description || "Khám phá những sản phẩm làm đẹp được tuyển chọn dành riêng cho bạn."}</p>
              <div className="hero-buttons">
                <button type="button" className="primary-button" onClick={() => chooseCategory("Shop All")}>Khám phá sản phẩm <span aria-hidden="true">→</span></button>
                <button type="button" className="outline-button" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>Câu chuyện MIRA</button>
              </div>
              <div className="hero-social-proof"><span aria-hidden="true">✦ ✦ ✦ ✦ ✦</span><strong>Được yêu thích bởi cộng đồng làm đẹp</strong></div>
            </div>

            <aside className="hero-product-note">
              <SafeImage src="/images/product-serum.jpg" alt="Tinh chất dưỡng da" />
              <span><small>GỢI Ý TỪ MIRA</small><strong>Chăm sóc da dịu nhẹ</strong><button type="button" onClick={() => chooseCategory("Skincare")}>Khám phá ngay <span aria-hidden="true">→</span></button></span>
            </aside>
            <div className="hero-service-note"><span aria-hidden="true">♧</span><span><strong>Làm đẹp an tâm</strong><small>Tuyển chọn sản phẩm chất lượng</small></span></div>

            <button type="button" className="banner-arrow banner-prev" onClick={previousSlide} aria-label="Banner trước">
              &#8249;
            </button>
            <button type="button" className="banner-arrow banner-next" onClick={nextSlide} aria-label="Banner tiếp theo">
              &#8250;
            </button>

            <div className="banner-dots">
              {heroSlides.map((slide, index) => (
                <button
                  type="button"
                  key={slide.image}
                  className={activeSlide === index ? "active" : ""}
                  aria-label={`Chuyển đến banner ${index + 1}`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </section>

          <section className="category-section" id="categories">
            <div className="section-heading">
              <div>
                <span className="eyebrow">KHÁM PHÁ THEO NHU CẦU</span>
                <h2>Chọn điều làn da cần</h2>
              </div>
              <button type="button" className="text-button" onClick={() => chooseCategory("Shop All")}>Tất cả sản phẩm →</button>
            </div>

            <div className="category-grid">
              {categories.map((category) => (
                <button
                  type="button"
                  className={`category-card ${selectedCategory === category.name ? "selected" : ""}`}
                  key={category.name}
                  onClick={() => chooseCategory(category.name)}
                >
                  <SafeImage src={category.image} alt={category.name} fallback="/images/product-serum.jpg" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="home-featured collection-banner">
            <SafeImage src="/images/collection-banner.jpg" alt="Bộ sưu tập chăm sóc sắc đẹp MIRA" fallback="/images/hero-banner-3.jpg" />
            <div>
              <span className="eyebrow">BỘ SƯU TẬP ĐƯỢC YÊU THÍCH</span>
              <h2>Khoảnh khắc dịu dàng của riêng bạn</h2>
              <p>Mỹ phẩm và chăm sóc da cho những ngày bạn muốn yêu chiều bản thân hơn.</p>
              <button type="button" className="primary-button" onClick={() => chooseCategory("Shop All")}>Khám phá bộ sưu tập <span aria-hidden="true">→</span></button>
            </div>
          </section>

          <div className="content-columns">
            <section className="best-sellers-section" id="best-sellers">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">LỰA CHỌN DÀNH RIÊNG CHO BẠN</span>
                  <h2>{search ? "Kết quả tìm kiếm" : selectedCategory === "Shop All" ? "Sản phẩm nổi bật" : selectedCategory}</h2>
                </div>
                <span className="muted">{filteredProducts.length} sản phẩm</span>
              </div>

              {loading ? (
                <p className="empty-state">Đang tải sản phẩm...</p>
              ) : apiError ? (
                <p className="error-state">{apiError}</p>
              ) : renderProductGrid(filteredProducts.slice(0, 4))}
              {!loading && !apiError && filteredProducts.length > 4 && <button type="button" className="home-view-all" onClick={() => chooseCategory(selectedCategory)}>Xem tất cả {filteredProducts.length} sản phẩm <span aria-hidden="true">→</span></button>}
            </section>

            <aside className="beauty-side">
              <section id="beauty-experience">
                <h2>Khoảnh khắc làm đẹp</h2>
                <div className="experience-grid">
                  {["experience-1.jpg", "experience-2.jpg", "experience-3.jpg", "experience-4.jpg", "experience-5.jpg"].map((image, index) => (
                    <SafeImage key={image} src={`/images/${image}`} alt={`Beauty experience ${index + 1}`} fallback="/images/category-skincare.jpg" />
                  ))}
                </div>
              </section>

              <section className="why-us">
                <h2>Vì sao chọn MIRA?</h2>
                <div className="benefit-grid">
                  <div><span>♡</span><small>Chăm sóc tận tâm</small></div>
                  <div><span>♧</span><small>Sản phẩm chất lượng</small></div>
                  <div><span>✧</span><small>Lựa chọn tinh tế</small></div>
                  <div><span>♙</span><small>Trải nghiệm chỉn chu</small></div>
                </div>
              </section>
            </aside>
          </div>

          <section className="collection-cards" id="collections">
            {collections.map((item) => (
              <article className="mini-collection" key={item.title}>
                <SafeImage src={item.image} alt={item.title} fallback="/images/category-skincare.jpg" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                  <button type="button" onClick={() => chooseCategory("Shop All")}>Shop Now →</button>
                </div>
              </article>
            ))}
          </section>

          <section className="newsletter">
            <div>
              <h2>Join Our Beauty Community</h2>
              <p>Get exclusive offers, beauty tips and the latest news.</p>
            </div>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (email.includes("@")) setSubscribed(true);
            }}>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" required />
              <button type="submit">{subscribed ? "Subscribed ✓" : "Subscribe →"}</button>
            </form>
          </section>
        </main>
      )}

      {page === "shop" && (
        <main className="inner-page shop-page">
          <nav className="detail-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => goToPage("home")}>Trang chủ</button><span>›</span><span>Sản phẩm</span>
          </nav>
          <header className="shop-page-heading">
            <span className="eyebrow">MIRA BEAUTY · TUYỂN CHỌN CHO BẠN</span>
            <h1>Khám phá sản phẩm</h1>
            <p>Tìm sản phẩm phù hợp với nhu cầu chăm sóc và làm đẹp mỗi ngày.</p>
          </header>
          <section className="shop-categories" aria-label="Danh mục sản phẩm">
            <button type="button" className={selectedCategory === "Shop All" ? "active" : ""} onClick={() => setSelectedCategory("Shop All")}>Tất cả</button>
            {categories.map((category) => <button type="button" className={selectedCategory === category.name ? "active" : ""} key={category.name} onClick={() => setSelectedCategory(category.name)}>{category.name}</button>)}
          </section>
          <section className="shop-results" id="shop-products">
            <div className="section-heading">
              <div><span className="eyebrow">LỰA CHỌN DÀNH RIÊNG CHO BẠN</span><h2>{search ? "Kết quả tìm kiếm" : selectedCategory === "Shop All" ? "Tất cả sản phẩm" : selectedCategory}</h2></div>
              <span className="muted">{filteredProducts.length} sản phẩm</span>
            </div>
            {loading ? <p className="empty-state">Đang tải sản phẩm...</p> : apiError ? <p className="error-state">{apiError}</p> : renderProductGrid(filteredProducts)}
          </section>
        </main>
      )}

      {page === "detail" && selectedProduct && (
        <main className="inner-page product-detail-page">
          <nav className="detail-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => goToPage("home")}>Trang chủ</button>
            <span>›</span>
            <button type="button" onClick={() => chooseCategory("Shop All")}>Sản phẩm</button>
            <span>›</span>
            <span>{getName(selectedProduct)}</span>
          </nav>
          <section className="detail-layout">
            <div className="detail-gallery">
              <div className="detail-gallery-main">
                <SafeImage
                  className={`detail-main-image detail-image-view-${detailImageView}`}
                  src={selectedProductImage || getImage(selectedProduct)}
                  alt={getName(selectedProduct)}
                  fallback={selectedProductImageFallback}
                  loading="eager"
                />
                <span className="detail-image-zoom" aria-hidden="true">⌕</span>
              </div>
              <div className="detail-gallery-thumbnails" aria-label="Góc xem ảnh sản phẩm">
                {[
                  { id: "main", label: "Ảnh sản phẩm" },
                  { id: "detail-left", label: "Xem cận cảnh bên trái" },
                  { id: "detail-center", label: "Xem cận cảnh trung tâm" },
                  { id: "detail-right", label: "Xem cận cảnh bên phải" },
                ].map((view) => (
                  <button
                    type="button"
                    key={view.id}
                    className={detailImageView === view.id ? "active" : ""}
                    aria-label={view.label}
                    aria-pressed={detailImageView === view.id}
                    onClick={() => setDetailImageView(view.id)}
                  >
                    <SafeImage src={selectedProductImage || getImage(selectedProduct)} alt="" fallback={selectedProductImageFallback} loading="eager" />
                  </button>
                ))}
              </div>
            </div>
            <div className="detail-product-info">
              <span className="eyebrow">{selectedProduct.Brand || "MIRA BEAUTY"}</span>
              <h1>{getName(selectedProduct)}</h1>
              <p className="detail-brand-line">{(selectedProduct.Brand || "MIRA BEAUTY").toLocaleUpperCase("vi")}</p>
              <div className="detail-rating" aria-label="Sản phẩm được yêu thích">★★★★★ <span>5.0 · Được khách hàng yêu thích</span></div>
              <p className="detail-description">{selectedProduct.Description || "Sản phẩm chăm sóc sắc đẹp được tuyển chọn cho quy trình chăm sóc hằng ngày của bạn."}</p>
              <div className="detail-product-facts">
                <span>✧ Được tuyển chọn cho quy trình chăm sóc hằng ngày</span>
                <span>◇ Thông tin sản phẩm rõ ràng, minh bạch</span>
                <span>✓ Tình trạng: {Number(selectedProduct.StockQuantity ?? selectedProduct.stockQuantity ?? 0) > 0 ? "Còn hàng" : "Hết hàng"}</span>
              </div>
              <p className="detail-price">{formatPrice(getPrice(selectedProduct))}</p>
              <div className="detail-purchase-options">
                <div className="detail-stock">
                  <span>SỐ LƯỢNG</span>
                  <div className="detail-quantity">
                    <button type="button" aria-label="Giảm số lượng" onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span>{detailQuantity}</span>
                    <button type="button" aria-label="Tăng số lượng" onClick={() => setDetailQuantity(q => Math.min(Number(selectedProduct.StockQuantity ?? selectedProduct.stockQuantity ?? 99), q + 1))}>＋</button>
                  </div>
                </div>
                <span className="detail-stock-count">Còn {selectedProduct.StockQuantity ?? selectedProduct.stockQuantity ?? 0} sản phẩm</span>
              </div>
              <div className="detail-actions">
                <button type="button" className="primary-button" onClick={() => { for (let i = 0; i < detailQuantity; i++) addToCart(selectedProduct); }}>Thêm vào giỏ hàng</button>
                <button type="button" className="outline-button" onClick={() => buyNow(selectedProduct)}>Mua ngay · {formatPrice(getPrice(selectedProduct) * detailQuantity)}</button>
              </div>
              <button type="button" className="detail-wishlist" onClick={() => toggleFavorite(selectedProduct)}>♡ Thêm vào yêu thích</button>
              <p className="detail-delivery-note"><span aria-hidden="true">♧</span><span><strong>Giao hàng toàn quốc</strong><small>Thông tin vận chuyển được xác nhận khi đặt hàng.</small></span></p>
            </div>
          </section>

          <section className="detail-benefits" aria-label="Cam kết MIRA">
            <div><span>♧</span><strong>CHĂM SÓC TẬN TÂM</strong><small>Tư vấn lựa chọn sản phẩm</small></div>
            <div><span>◇</span><strong>SẢN PHẨM CHẤT LƯỢNG</strong><small>Thông tin rõ ràng, minh bạch</small></div>
            <div><span>♡</span><strong>THANH TOÁN AN TOÀN</strong><small>Quy trình mua sắm tiện lợi</small></div>
            <div><span>⇢</span><strong>GIAO HÀNG TOÀN QUỐC</strong><small>Miễn phí cho đơn từ 500.000 ₫</small></div>
          </section>

          <section className="detail-information">
            <nav className="detail-tabs" aria-label="Thông tin sản phẩm">
              {[
                { id: "description", label: "MÔ TẢ" },
                { id: "product", label: "THÔNG TIN SẢN PHẨM" },
                { id: "delivery", label: "GIAO HÀNG & ĐỔI TRẢ" },
              ].map((tab) => <button type="button" key={tab.id} className={detailTab === tab.id ? "active" : ""} aria-pressed={detailTab === tab.id} onClick={() => setDetailTab(tab.id)}>{tab.label}</button>)}
            </nav>
            <div className="detail-description-section">
              <div className="detail-description-copy">
                {detailTab === "description" && <>
                  <span className="eyebrow">MIRA BEAUTY · CHĂM SÓC BẠN MỖI NGÀY</span>
                  <h2>Mô tả sản phẩm</h2>
                  <p>{selectedProduct.Description || "Sản phẩm chăm sóc sắc đẹp được tuyển chọn kỹ lưỡng, giúp bạn tận hưởng trải nghiệm chăm sóc bản thân mỗi ngày."}</p>
                  <p>Thêm sản phẩm này vào quy trình chăm sóc của bạn và khám phá lựa chọn phù hợp từ MIRA.</p>
                </>}
                {detailTab === "product" && <>
                  <span className="eyebrow">THÔNG TIN SẢN PHẨM</span>
                  <h2>{getName(selectedProduct)}</h2>
                  <ul><li>Thương hiệu: {selectedProduct.Brand || "MIRA BEAUTY"}</li><li>Tình trạng: {Number(selectedProduct.StockQuantity ?? selectedProduct.stockQuantity ?? 0) > 0 ? "Còn hàng" : "Hết hàng"}</li><li>Mã sản phẩm: {getId(selectedProduct)}</li></ul>
                  <p>{selectedProduct.Description || "Thông tin chi tiết về sản phẩm được cung cấp bởi MIRA BEAUTY."}</p>
                </>}
                {detailTab === "delivery" && <>
                  <span className="eyebrow">DỊCH VỤ MIRA</span>
                  <h2>Giao hàng & đổi trả</h2>
                  <p>MIRA sẽ liên hệ xác nhận đơn hàng, phí vận chuyển và thời gian giao dự kiến sau khi bạn gửi thông tin đặt hàng.</p>
                  <p>Vui lòng kiểm tra sản phẩm khi nhận hàng và liên hệ với MIRA nếu cần hỗ trợ.</p>
                </>}
              </div>
              <div className="detail-description-image">
                <SafeImage src={selectedProductImage || getImage(selectedProduct)} alt={getName(selectedProduct)} fallback={selectedProductImageFallback} loading="eager" />
              </div>
            </div>
          </section>

          {products.filter((product) => getId(product) !== getId(selectedProduct)).length > 0 && (
            <section className="detail-related">
              <div className="detail-related-heading">
                <span className="eyebrow">KHÁM PHÁ THÊM</span>
                <h2>Có thể bạn cũng yêu thích</h2>
              </div>
              <div className="detail-related-grid">
                {products.filter((product) => getId(product) !== getId(selectedProduct)).slice(0, 3).map((product, index) => (
                  <ProductCard
                    key={getId(product)}
                    product={product}
                    index={index}
                    onOpen={openProduct}
                    favorites={favorites}
                    onFavorite={toggleFavorite}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {page === "cart" && (
        <main className="inner-page">
          <h1>Your Shopping Bag</h1>
          {cart.length === 0 ? (
            <p className="empty-state">Your bag is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-row" key={getId(item)}>
                  <SafeImage src={getImage(item)} alt={getName(item)} fallback={getProductFallback(item)} />
                  <div className="cart-details">
                    <h3>{getName(item)}</h3>
                    <p>{formatPrice(getPrice(item))}</p>
                    <button type="button" onClick={() => changeQuantity(getId(item), -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(getId(item), 1)}>＋</button>
                    <button type="button" className="remove-button" onClick={() => setCart((current) => current.filter((product) => getId(product) !== getId(item)))}>Remove</button>
                  </div>
                </div>
              ))}
              <h2 className="cart-total">Total: {formatPrice(cartTotal)}</h2>
              <button type="button" className="primary-button" onClick={() => goToPage("checkout")}>Proceed to Checkout</button>
            </>
          )}
          <button type="button" className="outline-button" onClick={() => goToPage("home")}>Continue Shopping</button>
        </main>
      )}

      {page === "favorites" && (
        <main className="inner-page">
          <h1>My Wishlist</h1>
          {renderProductGrid(favorites)}
        </main>
      )}

      {page === "account" && (
        <main className="inner-page auth-page">
          <section className="auth-card">
            <span className="eyebrow">MIRA BEAUTY SHOP</span>
            <h1>{authMode === "login" ? "Welcome Back" : "Create Your Account"}</h1>
            <p>{authMode === "login" ? "Log in to continue shopping." : "Create an account to save your shopping information."}</p>
            <form onSubmit={submitAuth} className="stack-form">
              {authMode === "register" && <label>Name<input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} autoComplete="name" /></label>}
              <label>Email<input required type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} autoComplete="email" /></label>
              <label>Password<input required minLength={8} type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
              <button className="primary-button" type="submit">{authMode === "login" ? "Log In" : "Sign Up"}</button>
            </form>
            <button type="button" className="text-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Log In"}</button>
            {user && <div className="account-actions"><p>Đang đăng nhập: {user.email} ({user.role})</p><button className="outline-button" onClick={() => { setUser(null); goToPage("home"); }}>Đăng xuất</button><button className="outline-button" onClick={() => goToPage("orders")}>Đơn hàng của tôi</button></div>}
          </section>
        </main>
      )}

      {page === "checkout" && (
        <main className="inner-page checkout-page">
          <nav className="checkout-breadcrumb" aria-label="Tiến trình đặt hàng"><button type="button" onClick={() => goToPage("cart")}>Giỏ hàng</button><span>›</span><strong>Thông tin giao hàng</strong><span>›</span><span>Xác nhận</span></nav>
          <header className="checkout-heading"><span className="eyebrow">MIRA BEAUTY SHOP</span><h1>Hoàn tất đơn hàng</h1><p>Chỉ còn một bước nữa để những món đồ yêu thích được gửi đến bạn.</p></header>
          {cart.length === 0 ? (
            <section className="checkout-empty"><span aria-hidden="true">♡</span><h2>Giỏ hàng của bạn đang trống</h2><p>Khám phá các sản phẩm chăm sóc sắc đẹp được MIRA tuyển chọn.</p><button type="button" className="primary-button" onClick={() => goToPage("home")}>Tiếp tục mua sắm <span aria-hidden="true">→</span></button></section>
          ) : (
            <div className="checkout-layout">
              <form className="checkout-form checkout-card" onSubmit={checkout}>
                <section className="checkout-form-section">
                  <div className="checkout-section-heading"><span>01</span><div><h2>Thông tin người nhận</h2><p>Thông tin cần thiết để giao đơn hàng đến bạn.</p></div></div>
                  <label>Họ và tên<input autoComplete="name" required value={checkoutForm.fullName} onChange={e => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })} placeholder="Nhập họ tên người nhận" /></label>
                  <label>Số điện thoại<input autoComplete="tel" type="tel" required value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="Nhập số điện thoại liên hệ" /></label>
                  <label>Địa chỉ giao hàng<textarea autoComplete="street-address" required rows="3" value={checkoutForm.address} onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" /></label>
                </section>
                <section className="checkout-payment-note"><span aria-hidden="true">♧</span><div><strong>Hướng dẫn thanh toán</strong><p>MIRA sẽ liên hệ xác nhận đơn hàng và hướng dẫn thanh toán sau khi tiếp nhận.</p></div></section>
                <div className="checkout-form-actions"><button type="button" className="checkout-back-link" onClick={() => goToPage("cart")}>← Quay lại giỏ hàng</button><button className="primary-button" type="submit">Đặt hàng · {formatPrice(cartTotal)}</button></div>
              </form>

              <aside className="checkout-summary">
                <div className="checkout-summary-heading"><h2>Đơn hàng của bạn</h2><span>{cartCount} sản phẩm</span></div>
                <div className="checkout-items">{cart.map((item) => (
                  <article className="checkout-item" key={getId(item)}>
                    <SafeImage src={getImage(item)} alt={getName(item)} fallback={getProductFallback(item)} />
                    <div><strong>{getName(item)}</strong><span>{item.Brand ?? item.brand ?? "MIRA BEAUTY"} · SL: {item.quantity}</span></div>
                    <strong>{formatPrice(getPrice(item) * item.quantity)}</strong>
                  </article>
                ))}</div>
                <div className="checkout-totals"><div><span>Tạm tính</span><strong>{formatPrice(cartTotal)}</strong></div><div><span>Phí giao hàng</span><span>Thông báo khi xác nhận</span></div></div>
                <div className="checkout-grand-total"><span>Tổng tiền sản phẩm</span><strong>{formatPrice(cartTotal)}</strong></div>
                <p className="checkout-shipping-note">Phí giao hàng (nếu có) sẽ được thông báo khi xác nhận đơn.</p>
                <div className="checkout-safe-note"><span aria-hidden="true">✓</span><span>Thông tin của bạn được sử dụng để xử lý và giao đơn hàng.</span></div>
              </aside>
            </div>
          )}
        </main>
      )}

      {page === "orders" && (
        <main className="inner-page">
          <h1>My Orders</h1>
          {!user ? <><p>Please log in to view your orders.</p><button className="primary-button" onClick={() => goToPage("account")}>Log In</button></> : myOrders.length === 0 ? <p>You have no orders yet.</p> : <div className="admin-list">{myOrders.map(order => <article className="admin-list-row" key={order.OrderId}><div><strong>Order #{order.OrderId}</strong><p>{new Date(order.CreatedAt).toLocaleString("vi-VN")} · {order.Status}</p><p>{order.Address}</p></div><strong>{formatPrice(order.TotalAmount)}</strong></article>)}</div>}
          <button className="primary-button" onClick={() => goToPage("home")}>Continue Shopping</button>
        </main>
      )}

      {page === "admin" && (
        user?.role !== "Admin" ? (
          <main className="inner-page admin-page"><section className="auth-card"><h2>Admin Access Required</h2><p>Đăng nhập bằng tài khoản quản trị để tiếp tục.</p><button className="primary-button" onClick={() => goToPage("account")}>Đăng nhập</button></section></main>
        ) : (
          <div className="admin-shell">
            <aside className="admin-sidebar">
              <button type="button" className="admin-brand" onClick={() => setAdminSection("dashboard")}><span className="admin-brand-mark">M</span><span>MIRA<small>BEAUTY ADMIN</small></span></button>
              <div className="admin-profile"><div className="admin-avatar">{(user.name || user.email || "A").slice(0, 1).toUpperCase()}</div><div><strong>{user.name || "Quản trị viên"}</strong><small>Quản trị viên</small></div><span className="admin-online-dot" /></div>
              <span className="admin-nav-caption">TỔNG QUAN</span>
              <nav className="admin-nav" aria-label="Điều hướng quản trị">
                {[
                  { id: "dashboard", icon: "▦", title: "Dashboard" },
                  { id: "products", icon: "◇", title: "Sản phẩm", count: adminProducts.length },
                  { id: "orders", icon: "▤", title: "Đơn hàng", count: adminSummary?.pendingOrderCount },
                  { id: "users", icon: "♙", title: "Người dùng", count: adminUsers.length },
                  { id: "storefront", icon: "↗", title: "Xem website" },
                ].map((item) => (
                  <button type="button" key={item.id} className={adminSection === item.id ? "active" : ""} onClick={() => { setAdminSection(item.id); setAdminSearch(""); }}>
                    <span className="admin-nav-icon">{item.icon}</span><span>{item.title}</span>{item.count !== undefined && <small>{item.count}</small>}
                  </button>
                ))}
              </nav>
              <div className="admin-sidebar-bottom"><span>ĐANG ĐĂNG NHẬP</span><strong>{user.email}</strong><button type="button" onClick={() => { setUser(null); goToPage("home"); }}>↪ Đăng xuất</button></div>
            </aside>
            <main className="admin-main">
              <header className="admin-topbar">
                <div><span className="admin-breadcrumb">MIRA / QUẢN TRỊ /</span><h1>{({ dashboard: "Tổng quan", products: "Sản phẩm", orders: "Đơn hàng", users: "Người dùng", storefront: "Xem website" })[adminSection]}</h1></div>
                <div className="admin-top-actions"><span className="admin-date">{adminToday.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><button type="button" aria-label="Tải lại dữ liệu" onClick={loadAdmin} disabled={adminLoading}>↻</button></div>
              </header>
              {adminError && <div className="admin-error" role="alert">{adminError} <button type="button" onClick={loadAdmin}>Thử lại</button></div>}
              {adminLoading && !adminSummary ? <div className="admin-loading">Đang tải dữ liệu quản trị…</div> : <>
                {adminSection === "dashboard" && <>
                  <section className="admin-welcome"><div><span className="admin-eyebrow">BẢNG ĐIỀU KHIỂN</span><h2>{user.name || "Admin"} </h2><p>Tình hình kinh doanh MIRA Beauty Shop của bạn hôm nay.</p></div><button type="button" onClick={() => setAdminSection("orders")}>Xem đơn hàng <span>→</span></button></section>
                  <section className="admin-stat-grid" aria-label="Thống kê kinh doanh">
                    <article className="admin-stat-card"><div className="admin-stat-top"><span>DOANH THU</span><span className="admin-stat-icon rose">₫</span></div><strong>{formatPrice(adminSummary?.revenue || 0)}</strong><small>Tổng đơn hợp lệ, loại trừ đơn đã hủy</small><div className="admin-stat-foot"><i className="stat-dot rose-dot" />Toàn thời gian</div></article>
                    <article className="admin-stat-card"><div className="admin-stat-top"><span>ĐƠN HÀNG</span><span className="admin-stat-icon blue">▤</span></div><strong>{Number(adminSummary?.orderCount || 0).toLocaleString("vi-VN")}</strong><small>{adminSummary?.pendingOrderCount || 0} đơn đang chờ xử lý</small><div className="admin-stat-foot"><i className="stat-dot blue-dot" />Tất cả trạng thái</div></article>
                    <article className="admin-stat-card"><div className="admin-stat-top"><span>KHÁCH HÀNG</span><span className="admin-stat-icon green">♙</span></div><strong>{Number(adminSummary?.customerCount || 0).toLocaleString("vi-VN")}</strong><small>Tài khoản khách hàng</small><div className="admin-stat-foot"><i className="stat-dot green-dot" />Đã đăng ký</div></article>
                    <article className="admin-stat-card"><div className="admin-stat-top"><span>SẢN PHẨM ĐANG BÁN</span><span className="admin-stat-icon purple">◇</span></div><strong>{Number(adminSummary?.activeProductCount || 0).toLocaleString("vi-VN")}</strong><small>{adminProducts.filter((product) => Number(product.StockQuantity) <= 5 && product.IsActive).length} sản phẩm sắp hết hàng</small><div className="admin-stat-foot"><i className="stat-dot purple-dot" />Kho sản phẩm</div></article>
                  </section>
                  <section className="admin-dashboard-grid">
                    <article className="admin-card admin-revenue-card"><div className="admin-card-heading"><div><h3>Doanh thu 7 ngày gần nhất</h3><p>Doanh thu theo ngày · loại trừ đơn đã hủy</p></div><span className="admin-card-tag">7 NGÀY</span></div>
                      <div className="admin-chart">
                        <div className="admin-chart-axis"><span>{formatPrice(Math.max(0, ...((adminSummary?.revenueByDay || []).map((day) => Number(day.revenue)))) )}</span><span>₫0</span></div>
                        <div className="admin-chart-bars">{(adminSummary?.revenueByDay || []).map((day) => { const values = adminSummary?.revenueByDay || []; const max = Math.max(1, ...values.map((item) => Number(item.revenue))); const height = Math.max(4, Number(day.revenue) / max * 100); return <div className="admin-chart-column" key={day.date} title={`${new Date(`${day.date}T00:00:00`).toLocaleDateString("vi-VN")}: ${formatPrice(day.revenue)}`}><div className="admin-chart-bar-wrap"><span className="admin-chart-bar" style={{ height: `${height}%` }} /></div><small>{new Date(`${day.date}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "short" })}</small></div>; })}</div>
                      </div>
                    </article>
                    <article className="admin-card admin-stock-card"><div className="admin-card-heading"><div><h3>Cần chú ý</h3><p>Tình trạng tồn kho sản phẩm</p></div><span className="admin-warning-icon">!</span></div>
                      {adminProducts.filter((product) => product.IsActive && Number(product.StockQuantity) <= 5).length === 0 ? <p className="admin-empty">Tồn kho ổn định — không có cảnh báo.</p> : <div className="admin-alert-list">{adminProducts.filter((product) => product.IsActive && Number(product.StockQuantity) <= 5).slice(0, 5).map((product) => <div key={product.ProductId}><span className={Number(product.StockQuantity) === 0 ? "stock-critical" : "stock-low"}>●</span><span>{product.ProductName}<small>{Number(product.StockQuantity) === 0 ? "Đã hết hàng" : "Sắp hết hàng"}</small></span><strong>{product.StockQuantity}</strong></div>)}</div>}
                    </article>
                  </section>
                  <section className="admin-dashboard-grid admin-dashboard-grid-bottom">
                    <article className="admin-card"><div className="admin-card-heading"><div><h3>Sản phẩm bán chạy</h3><p>Sắp xếp theo số lượng đã bán</p></div><button type="button" className="admin-text-link" onClick={() => setAdminSection("products")}>Tất cả sản phẩm →</button></div>
                      {(adminSummary?.topProducts || []).length === 0 ? <p className="admin-empty">Chưa có dữ liệu bán hàng.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>SẢN PHẨM</th><th>ĐÃ BÁN</th><th>DOANH THU</th></tr></thead><tbody>{adminSummary.topProducts.map((product) => <tr key={product.ProductId}><td><strong>{product.ProductName}</strong></td><td>{product.unitsSold}</td><td>{formatPrice(product.revenue)}</td></tr>)}</tbody></table></div>}
                    </article>
                    <article className="admin-card"><div className="admin-card-heading"><div><h3>Đơn hàng mới nhất</h3><p>Cập nhật gần đây</p></div><button type="button" className="admin-text-link" onClick={() => setAdminSection("orders")}>Tất cả đơn →</button></div>
                      {(adminSummary?.recentOrders || []).length === 0 ? <p className="admin-empty">Chưa có đơn hàng.</p> : <div className="admin-recent-orders">{adminSummary.recentOrders.slice(0, 5).map((order) => <div key={order.OrderId}><span className="admin-order-number">#{order.OrderId}</span><span className="admin-recent-customer">{order.CustomerName}<small>{new Date(order.CreatedAt).toLocaleDateString("vi-VN")}</small></span><strong>{formatPrice(order.TotalAmount)}</strong><span className={`admin-status status-${order.Status.toLowerCase()}`}>{order.Status}</span></div>)}</div>}
                    </article>
                  </section>
                </>}

                {adminSection === "products" && <section className="admin-card admin-management">
                  <div className="admin-card-heading"><div><h3>Quản lý sản phẩm</h3><p>{adminProducts.length} sản phẩm · Thêm, sửa, ẩn hoặc hiển thị sản phẩm</p></div><button type="button" className="admin-primary-button" onClick={() => { setAdminEditingId(null); setAdminForm({ ProductName: "", Brand: "", Description: "", Price: "", StockQuantity: 0, CategoryId: 1, ImageUrl: "/images/product-serum.jpg" }); setAdminEditorOpen(true); document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth" }); }}>＋ Thêm sản phẩm</button></div>
                  <div className="admin-search-row"><input value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="Tìm tên hoặc thương hiệu sản phẩm…" aria-label="Tìm sản phẩm" /><span>{filteredAdminProducts.length} kết quả</span></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>SẢN PHẨM</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{filteredAdminProducts.map((product, index) => <tr key={product.ProductId}><td><div className="admin-product-cell"><SafeImage src={getImage(product, index)} alt={product.ProductName} fallback={getProductFallback(product, index)} /><span><strong>{product.ProductName}</strong><small>{product.Brand || `Mã SP: ${product.ProductId}`}</small></span></div></td><td>{formatPrice(product.Price)}</td><td><span className={Number(product.StockQuantity) <= 5 ? "admin-stock-low-label" : ""}>{product.StockQuantity} sản phẩm</span></td><td><span className={`admin-status ${product.IsActive ? "status-active" : "status-inactive"}`}>{product.IsActive ? "Đang bán" : "Đã ẩn"}</span></td><td><div className="admin-row-actions"><button type="button" onClick={() => { setAdminEditingId(product.ProductId); setAdminForm({ ProductName: product.ProductName || "", Brand: product.Brand || "", Description: product.Description || "", Price: product.Price || "", StockQuantity: product.StockQuantity || 0, CategoryId: product.CategoryId || 1, ImageUrl: product.ImageUrl || "/images/product-serum.jpg" }); setAdminEditorOpen(true); document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth" }); }}>Sửa</button><button type="button" className="admin-danger-link" onClick={() => toggleAdminProduct(product.ProductId, !product.IsActive)}>{product.IsActive ? "Ẩn" : "Hiển thị"}</button></div></td></tr>)}</tbody></table></div>
                  {filteredAdminProducts.length === 0 && <p className="admin-empty">Không tìm thấy sản phẩm phù hợp.</p>}
                  <details className="admin-product-editor" id="admin-product-form" open={adminEditorOpen} onToggle={(event) => setAdminEditorOpen(event.currentTarget.open)}><summary>{adminEditingId ? "Đang sửa sản phẩm" : "Thêm sản phẩm mới"}</summary><form className="admin-product-form" onSubmit={saveAdminProduct}><label>Tên sản phẩm<input required value={adminForm.ProductName} onChange={(event) => setAdminForm({ ...adminForm, ProductName: event.target.value })} /></label><label>Thương hiệu<input value={adminForm.Brand} onChange={(event) => setAdminForm({ ...adminForm, Brand: event.target.value })} /></label><label>Giá bán (VND)<input required type="number" min="0" value={adminForm.Price} onChange={(event) => setAdminForm({ ...adminForm, Price: event.target.value })} /></label><label>Tồn kho<input required type="number" min="0" value={adminForm.StockQuantity} onChange={(event) => setAdminForm({ ...adminForm, StockQuantity: event.target.value })} /></label><label>Mã danh mục<input required type="number" min="1" value={adminForm.CategoryId} onChange={(event) => setAdminForm({ ...adminForm, CategoryId: event.target.value })} /></label><label>URL hình ảnh<input value={adminForm.ImageUrl} onChange={(event) => setAdminForm({ ...adminForm, ImageUrl: event.target.value })} /></label><label className="admin-form-wide">Mô tả<textarea rows="3" value={adminForm.Description} onChange={(event) => setAdminForm({ ...adminForm, Description: event.target.value })} /></label><div className="admin-form-actions"><button className="admin-primary-button" type="submit">{adminEditingId ? "Lưu thay đổi" : "Tạo sản phẩm"}</button>{adminEditingId && <button type="button" className="admin-secondary-button" onClick={() => { setAdminEditingId(null); setAdminEditorOpen(false); setAdminForm({ ProductName: "", Brand: "", Description: "", Price: "", StockQuantity: 0, CategoryId: 1, ImageUrl: "/images/product-serum.jpg" }); }}>Hủy sửa</button>}</div></form></details>
                </section>}

                {adminSection === "orders" && <section className="admin-card admin-management">
                  <div className="admin-card-heading"><div><h3>Quản lý đơn hàng</h3><p>Theo dõi đơn hàng và cập nhật trạng thái xử lý</p></div><span className="admin-card-tag">{adminOrders.length} ĐƠN</span></div>
                  <div className="admin-search-row"><input value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="Tìm mã đơn, tên khách, số điện thoại…" aria-label="Tìm đơn hàng" /><span>{filteredAdminOrders.length} kết quả</span></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>NGÀY ĐẶT</th><th>TỔNG TIỀN</th><th>ĐỊA CHỈ GIAO HÀNG</th><th>TRẠNG THÁI</th></tr></thead><tbody>{filteredAdminOrders.map((order) => <tr key={order.OrderId}><td><strong>#{order.OrderId}</strong></td><td>{order.CustomerName}<small className="admin-cell-subtext">{order.Phone}</small></td><td>{new Date(order.CreatedAt).toLocaleDateString("vi-VN")}</td><td><strong>{formatPrice(order.TotalAmount)}</strong></td><td className="admin-address-cell">{order.Address}</td><td><select className="admin-status-select" value={order.Status} onChange={(event) => updateOrderStatus(order.OrderId, event.target.value)}><option>Pending</option><option>Confirmed</option><option>Shipping</option><option>Completed</option><option>Cancelled</option></select></td></tr>)}</tbody></table></div>
                  {filteredAdminOrders.length === 0 && <p className="admin-empty">Không tìm thấy đơn hàng phù hợp.</p>}
                </section>}

                {adminSection === "users" && <section className="admin-card admin-management">
                  <div className="admin-card-heading"><div><h3>Quản lý người dùng</h3><p>Phân quyền quản trị và kiểm soát trạng thái tài khoản</p></div><span className="admin-card-tag">{adminUsers.length} TÀI KHOẢN</span></div>
                  <div className="admin-search-row"><input value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="Tìm tên, email hoặc vai trò…" aria-label="Tìm người dùng" /><span>{filteredAdminUsers.length} kết quả</span></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>NGƯỜI DÙNG</th><th>NGÀY THAM GIA</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{filteredAdminUsers.map((adminUser) => { const isSelf = adminUser.UserId === user.id; return <tr key={adminUser.UserId}><td><div className="admin-user-cell"><span>{(adminUser.FullName || adminUser.Email).slice(0, 1).toUpperCase()}</span><strong>{adminUser.FullName}<small>{adminUser.Email}</small></strong></div></td><td>{new Date(adminUser.CreatedAt).toLocaleDateString("vi-VN")}</td><td><select aria-label={`Vai trò ${adminUser.Email}`} className="admin-role-select" value={adminUser.Role} disabled={isSelf || !adminUser.IsActive} onChange={(event) => updateAdminUser(adminUser.UserId, { role: event.target.value })}><option value="Customer">Khách hàng</option><option value="Admin">Admin</option></select></td><td><span className={`admin-status ${adminUser.IsActive ? "status-active" : "status-inactive"}`}>{adminUser.IsActive ? "Hoạt động" : "Đã khóa"}</span></td><td><button type="button" className="admin-user-toggle" disabled={isSelf} title={isSelf ? "Không thể tự khóa tài khoản đang sử dụng" : ""} onClick={() => updateAdminUser(adminUser.UserId, { isActive: !adminUser.IsActive })}>{isSelf ? "Tài khoản của bạn" : adminUser.IsActive ? "Khóa tài khoản" : "Mở khóa"}</button></td></tr>; })}</tbody></table></div>
                  {filteredAdminUsers.length === 0 && <p className="admin-empty">Không tìm thấy người dùng phù hợp.</p>}
                </section>}

                {adminSection === "storefront" && <section className="admin-card admin-storefront-preview">
                  <div className="admin-card-heading"><div><h3>Trang người dùng</h3><p>Xem trực tiếp giao diện cửa hàng như khách hàng nhìn thấy.</p></div><div className="admin-preview-actions"><button type="button" className="admin-secondary-button" onClick={() => setPreviewRevision((revision) => revision + 1)}>Làm mới</button><a className="admin-primary-button" href="/?preview=storefront" target="_blank" rel="noopener noreferrer">Mở trang đầy đủ ↗</a></div></div>
                  <iframe key={previewRevision} className="admin-storefront-frame" title="Bản xem trước trang người dùng" src={`/?preview=storefront&refresh=${previewRevision}`} />
                </section>}
              </>}
            </main>
          </div>
        )
      )}

      {page !== "admin" && <>
      <footer className="site-footer" id="about">
        <div className="footer-brand">
          <span className="brand-wordmark">MIRA<small>BEAUTY SHOP</small></span>
          <p>Beauty isn't just what you look like.<br />It's about how you feel.</p>
          <span>◎　♡　f　◉</span>
        </div>
        <div><h3>Shop</h3><a href="#best-sellers">All Products</a><a href="#best-sellers">New Arrivals</a><a href="#best-sellers">Best Sellers</a><a href="#collections">Collections</a></div>
        <div><h3>Customer Care</h3><a href="#about">Track Your Order</a><a href="#about">Shipping & Delivery</a><a href="#about">Returns & Refunds</a><a href="#about">FAQs</a></div>
        <div><h3>About</h3><a href="#about">Our Story</a><a href="#about">Sustainability</a><a href="#about">Careers</a><a href="#about">Contact</a></div>
      </footer>

      <div className="copyright">
        © 2026 MIRA Beauty Shop. All rights reserved. | Privacy Policy | Terms of Service
      </div>
      </>}
    </div>
  );
}

export default App;
