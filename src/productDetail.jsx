import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd" />
  </svg>
);

const Icon = ({ name, size = 22 }) => (
  <span style={{
    fontFamily: "'Material Symbols Outlined'",
    fontWeight: "normal",
    fontStyle: "normal",
    fontSize: size,
    lineHeight: 1,
    display: "inline-block",
    textTransform: "none",
    letterSpacing: "normal",
    wordWrap: "normal",
    whiteSpace: "nowrap",
    direction: "ltr",
  }}>{name}</span>
);

const WaIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Mock product data — replace with real data from your router/context
const product = {
  id: 1,
  name: "The Midnight Satchel",
  brand: "Luxury Bags Co.",
  seller: "Chukwuemeka Stores",
  sellerPhone: "2348147061837",
  sellerLocation: "Balogun Market, Lagos Island, Lagos",
  sellerVerified: true,
  sellerJoined: "2021",
  sub: "Italian Leather • Midnight Blue",
  description:
    "Crafted from premium Italian leather, The Midnight Satchel combines timeless elegance with modern functionality. Its structured silhouette and deep midnight blue tone make it the perfect statement piece for any occasion — from boardrooms to evening soirées.",
  price: "$2,450",
  originalPrice: "$2,900",
  quantity: 12,
  lowStock: false,
  rating: 4.7,
  reviews: 128,
  colors: ["#1a1a2e", "#16213e", "#0f3460"],
  sizes: ["XS", "S", "M", "L", "XL"],
  category: "Satchels",
  images: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8",
  ],
};

const similarProducts = [
  {
    id: 2,
    name: "Ivory Essential Tote",
    seller: "Eco Style Hub",
    price: "$1,800",
    lowStock: true,
    colors: ["#f5f0e8", "#e8ddd0", "#d4c5b0"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo",
  },
  {
    id: 3,
    name: "Azure Mini Crossbody",
    seller: "Trendy Fashion Hub",
    price: "$1,250",
    lowStock: false,
    colors: ["#4a90d9", "#357abd", "#2868a8"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk",
  },
  {
    id: 4,
    name: "Onyx Evening Clutch",
    seller: "Elite Accessories",
    price: "$3,100",
    lowStock: true,
    colors: ["#1a1a1a", "#333333", "#4d4d4d"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E",
  },
  {
    id: 5,
    name: "Crimson Structured Bag",
    seller: "Premium Leather Co.",
    price: "$3,200",
    lowStock: false,
    colors: ["#c0392b", "#e74c3c", "#922b21"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="15" height="15" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#F59E0B" : "#D1D5DB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAddToCart = () => {
    setCartAdded(true);
    setCartCount((c) => c + quantity);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const whatsappMsg = encodeURIComponent(
    `Hi! I'm interested in the *${product.name}* by ${product.brand} listed at ${product.price}. Is it still available?`
  );
  const whatsappUrl = `https://wa.me/${product.sellerPhone}?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .thumb-img { transition: transform 0.4s ease; }
        .thumb-card:hover .thumb-img { transform: scale(1.05); }
        .product-card { transition: box-shadow 0.25s ease, transform 0.25s ease; }
        .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .card-img { transition: transform 0.5s ease; }
        .product-card:hover .card-img { transform: scale(1.04); }

        /* ── Sticky bottom CTA bar on mobile only ── */
        .sticky-bottom-cta {
          display: none;
        }
        @media (max-width: 767px) {
          .sticky-bottom-cta {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 40;
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            padding: 10px 12px;
            gap: 8px;
            align-items: center;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.08);
          }
          .hide-on-mobile { display: none !important; }
          .main-content { padding-bottom: 80px; }
        }
        @media (min-width: 768px) {
          .sticky-bottom-cta { display: none !important; }
          .main-content { padding-bottom: 0; }
        }
      `}</style>

      {/* ════════════ HEADER ════════════ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14 md:h-16">

          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 text-blue-600 cursor-pointer"
            onClick={() => navigate('/products')}
          >
            <LogoIcon />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Bag.NG</span>
          </div>

          {/* Desktop nav buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <button className="p-2.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition text-gray-700">
              <Icon name="person" size={24} />
            </button>
            <button className="relative p-2.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition text-gray-700">
              <Icon name="shopping_cart" size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition text-gray-700 font-semibold text-sm"
            >
              ← Back to Shop
            </button>
          </div>

          {/* Mobile cart icon */}
          <div className="lg:hidden relative">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-700">
              <Icon name="shopping_cart" size={22} />
            </button>
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center pointer-events-none">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ════════════ MOBILE SIDEBAR OVERLAY ════════════ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-700 mb-6"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="space-y-3">
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition text-gray-700">
              <Icon name="person" size={24} /><span className="font-medium">Profile</span>
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition text-gray-700">
              <Icon name="shopping_cart" size={24} /><span className="font-medium">Cart {cartCount > 0 && `(${cartCount})`}</span>
            </button>
            <hr className="border-gray-200" />
            <button
              onClick={() => { navigate('/products'); setIsSidebarOpen(false); }}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-blue-50 transition text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="font-medium">Back to Shop</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════════════ PAGE CONTENT ════════════ */}
      <div className="main-content max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center flex-wrap gap-1 text-xs sm:text-sm text-gray-500 mb-4 md:mb-6">
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/products')}>Home</span>
          <span>/</span>
          <span className="hover:text-blue-600 cursor-pointer">{product.category}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate" style={{ maxWidth: '45vw' }}>{product.name}</span>
        </nav>

        {/* ════ MAIN GRID ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-12 md:mb-16">

          {/* ── LEFT: Images ── */}
          <div>
            {/* Main image */}
            <div
              className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mb-2.5 sm:mb-3"
              style={{ aspectRatio: '4/3' }}
            >
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
                style={{ transition: 'opacity 0.3s' }}
              />
              {product.lowStock && (
                <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  Low Stock
                </span>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 sm:gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`thumb-card flex-1 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
                  style={{ aspectRatio: '1' }}
                >
                  <img src={img} alt="" className="thumb-img w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Brand badge + name */}
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wide uppercase">
                {product.brand}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-1">{product.name}</h1>
              <p className="text-gray-500 text-sm">{product.sub}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating rating={product.rating} />
              <span className="text-sm text-gray-500">{product.rating} ({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-blue-600">{product.price}</span>
              <span className="text-base sm:text-lg text-gray-400 line-through">{product.originalPrice}</span>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">SALE</span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

            {/* Colors */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Colors</p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? 'border-blue-600 scale-110 shadow-md' : 'border-white shadow'}`}
                    style={{
                      backgroundColor: c,
                      outline: selectedColor === c ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${selectedSize === s ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add to Cart — hidden on mobile (moved to sticky bar) */}
            <div className="hide-on-mobile flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-11 text-gray-600 hover:bg-gray-100 transition text-xl font-medium">−</button>
                <span className="w-10 text-center text-sm font-bold text-gray-800">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))} className="w-10 h-11 text-gray-600 hover:bg-gray-100 transition text-xl font-medium">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${cartAdded ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {cartAdded ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Added to Cart!</>
                ) : (
                  <><Icon name="shopping_cart" size={18} /> Add to Cart</>
                )}
              </button>
            </div>

            {/* WhatsApp Button — hidden on mobile (moved to sticky bar) */}
            <div className="hide-on-mobile">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                <WaIcon size={16} />
                Chat Seller on WhatsApp
              </a>
              <p className="text-center text-xs text-gray-400 mt-1">via WhatsApp</p>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-4 flex flex-col gap-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller Information</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {product.seller.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{product.seller}</p>
                    {product.sellerVerified && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Member since {product.sellerJoined}</p>
                </div>
              </div>
              {/* Location row */}
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Seller Location</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{product.sellerLocation}</p>
                </div>
              </div>
            </div>

            {/* Stock note */}
            <p className="text-xs text-gray-500">
              🔒 Only <strong className="text-gray-700">{product.quantity} units</strong> left in stock
            </p>
          </div>
        </div>

        {/* ════ SIMILAR PRODUCTS ════ */}
        <div>
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">Similar Products</h2>
            <div className="flex-1 h-px bg-gray-200" />
            <button
              onClick={() => navigate('/products')}
              className="text-xs sm:text-sm text-blue-600 hover:underline whitespace-nowrap font-medium"
            >
              View All →
            </button>
          </div>

          {/*
            Responsive grid:
            mobile  < 640px  → 1 col
            sm      ≥ 640px  → 2 cols
            lg      ≥ 1024px → 4 cols
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {similarProducts.map((p) => (
              <div
                key={p.id}
                className="product-card bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
              >
                <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={p.src}
                    alt={p.name}
                    className="card-img w-full h-full object-cover"
                  />
                  {p.lowStock && (
                    <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-0.5 truncate">{p.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2.5 sm:mb-3 truncate">{p.seller}</p>
                  <p className="text-xs text-gray-500 mb-1.5">Available Colors:</p>
                  <div className="flex gap-1.5 mb-3">
                    {p.colors.map((color, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: color, outline: '1px solid #e5e7eb' }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-blue-600 font-bold text-lg sm:text-xl">{p.price}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors"
                  >
                    View Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ STICKY BOTTOM CTA — mobile only ════════════ */}
      <div className="sticky-bottom-cta">
        {/* Quantity control */}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shrink-0">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-10 text-gray-600 hover:bg-gray-100 transition text-lg font-medium"
          >−</button>
          <span className="w-8 text-center text-sm font-bold text-gray-800">{quantity}</span>
          <button
            onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
            className="w-9 h-10 text-gray-600 hover:bg-gray-100 transition text-lg font-medium"
          >+</button>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold text-sm transition-all ${cartAdded ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {cartAdded ? (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Added!</>
          ) : (
            <><Icon name="shopping_cart" size={16} />Add to Cart</>
          )}
        </button>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-colors shrink-0 whitespace-nowrap"
        >
          <WaIcon size={15} /> WhatsApp
        </a>
      </div>
    </div>
  );
}