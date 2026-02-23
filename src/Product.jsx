import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './components/ui/badge';

const mockProducts = [
  {
    id: 1,
    name: "The Midnight Satchel",
    seller: "Luxury Bags Co.",
    sub: "Italian Leather • Midnight Blue",
    price: "$2,450",
    quantity: 12,
    lowStock: false,
    colors: ["#1a1a2e", "#16213e", "#0f3460"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbc5dxE3grW8p08E8TtaWN5L8YARMDRthJf6pzKLJE7uj3eaIfhldAvqZBwEJ869mgq48jOcjGej6zLtlrV4spzEjXI3d3TnAtGQYDXhni_ERAbMCU5__dE5BTSySucF66-Tam-NPTm_L4wqZ4ri_euRX9gy3LOCm6Q8qwFgqFbplPdoz-wl2wnadQozRro5HBbjY0oG7WHOAFumWG3QkohBlRJf0LbZVdQs-EXHx9fofCLvfgCPZD96qWxLrXQCkDmEa1lpUdDF8"
  },
  {
    id: 2,
    name: "Ivory Essential Tote",
    seller: "Eco Style Hub",
    sub: "Sustainable Vegan Leather • Ivory",
    price: "$1,800",
    quantity: 3,
    lowStock: true,
    colors: ["#f5f0e8", "#e8ddd0", "#d4c5b0"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2iIgrfiMmBYx39D4_vHqJgAshrgoMIswLRfc2TNvfzLU12RyRG8nYTV1JSaGLpieTiA4SFxSz28wVJu8RVEbJzuVBbJbm6Gj5XK9oEHZunRQAVk_1t0P2NjMKC3plNviwYC5tcEKM-Va_JQwOW6RTDFxwhgZ-7Nrxc3I_zAk8i6QRqKlYvomRE5405JaFLrDywqdjnveGzzlneGcygTz_tQjdyk0NKuib_RBkzl9yaB4TmD9ec64_I1ha5hAbnVobuns0GjFuACo"
  },
  {
    id: 3,
    name: "Azure Mini Crossbody",
    seller: "Trendy Fashion Hub",
    sub: "Napa Leather • Azure Blue",
    price: "$1,250",
    quantity: 8,
    lowStock: false,
    colors: ["#4a90d9", "#357abd", "#2868a8"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWO3irJ8GaADXHeVY-yLkBtsMwf3aoWwrPn6wqNY6K3DQq5LRcnFU6uJLYrYogD3twAiyFOntXJo8lQB3TyvMSVyRVC83zW6fHePyMWWYMM7uMNr0NFSVsU5mMhmgLZLRetdBuW-wV7IZDu8YwfunNKPxxcKjQYjjrdIwnPqXIVJzFMkZQjSnuYmsGn-3_UCSVtFpy_q12OcXgiujP6FAg01qNspjZ-dZzUa6E-_Vu12dwOpIL1c7srZV9Y8-FziRBfEBc_BMZ3xk"
  },
  {
    id: 4,
    name: "Onyx Evening Clutch",
    seller: "Elite Accessories",
    sub: "Polished Suede • Onyx Black",
    price: "$3,100",
    quantity: 2,
    lowStock: true,
    colors: ["#1a1a1a", "#333333", "#4d4d4d"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4l4XxqEhg8z3Flsf7ZlIUFWrALv7ps665xW56yrgFRslzAdD8YE8CoGD-eHc5CacM6ltr04XU04cFLCpo8kDWGQ_weuz7LJtzNEiwKXnDPmS1dFGrUin6u_w_KTD22tWJNcoIDmUEnnpE16CoUlghbfJ2e8VbxUV9NMUovHe1m0JdZmWvgSoLg7m8tCVCrIoUA2AMfdq2nGHljOnIjvN70QLD3Fj3DB2ZrxBERaq5OsNIfnX3c1t8u90vZG9fObqWGRCJkS7Lu1E"
  },
  {
    id: 5,
    name: "Crimson Structured Bag",
    seller: "Premium Leather Co.",
    sub: "Premium Leather • Red",
    price: "$3,200",
    quantity: 6,
    lowStock: false,
    colors: ["#c0392b", "#e74c3c", "#922b21"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVp1X2BUmdMSacdYElQUo1EI0AX_HNnADAw0PqFaM21IZLnoz6FHGphS31RK7sGzuTWcAkDVJK3MffDwMu8j08stgkWwTOSMv3b22bG7UdLKwQkzxfBWXdCbaYcDRjP2fiM9QzE9eq4RxVtFRxag3qQJ2IGsQveOf1NFHld9r4KFty1XXBbtDWXmK0y3PRdfG7CU6avgFtgyBtBegIo7AgdFiUMuXSmQvxDuP-jxNqqjbzKXoD16k_L5VQOm2xKo5TPfiEegqZd8"
  },
];

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

function ShoppingBagEmpty({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function Product() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [displayedProducts, setDisplayedProducts] = useState(mockProducts);
  const [isFiltered, setIsFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = mockProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.sub.toLowerCase().includes(query.toLowerCase()) ||
        product.seller.toLowerCase().includes(query.toLowerCase())
      );
      setDisplayedProducts(results);
      setIsFiltered(true);
    } else {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setDisplayedProducts(mockProducts);
    setIsFiltered(false);
    setSearchQuery('');
    setUploadedImage(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
    setIsFiltered(true);
    setDisplayedProducts(mockProducts);
    // Reset the file input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        .card-img { transition: transform 0.5s ease; }
        .product-card:hover .card-img { transform: scale(1.04); }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-blue-600">
            <LogoIcon />
            <span className="text-xl font-bold text-gray-900">Bag.NG</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-full border-none bg-transparent cursor-pointer hover:bg-gray-100"
              onClick={() => navigate("/profile")}
              title="Go to profile"
            >
              <Icon name="person" />
            </button>
            <button
              className="p-2 rounded-full border-none bg-transparent cursor-pointer hover:bg-gray-100"
              title="Shopping bag"
            >
              <Icon name="shopping_bag" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Bag</h1>
          <p className="text-gray-600 mb-6">Search by text or upload an image to find similar bags</p>

          {/* Search Bar */}
          <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm px-4 py-3 gap-3">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input
              type="text"
              placeholder="Search for bags..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
            {isFiltered && (
              <button onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 transition shrink-0 text-sm">✕</button>
            )}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shrink-0 transition-colors"
              title="Upload image to search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
          </div>

          {/* Uploaded image preview */}
          {uploadedImage && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <img src={uploadedImage} alt="Uploaded" className="w-12 h-12 object-cover rounded-lg border border-blue-200" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">Image uploaded</p>
                <p className="text-xs text-blue-600">Showing visually similar bags</p>
              </div>
              <button onClick={handleClearSearch} className="text-sm text-blue-500 hover:text-blue-700 font-medium">Remove</button>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isFiltered ? 'Search Results' : 'All Bags'}
            </h2>
            <p className="text-sm text-gray-500">
              {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'} found
            </p>
          </div>
          {isFiltered && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Filtered Results
            </Badge>
          )}
        </div>

        {/* Product Grid */}
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map((product) => (
              <div key={product.id} className="product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={product.src}
                    alt={product.name}
                    className="card-img w-full h-full object-cover"
                  />
                  {product.lowStock && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="font-bold text-base text-gray-900 mb-0.5">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.seller}</p>

                  {/* Colors */}
                  <p className="text-xs text-gray-500 mb-1.5">Available Colors:</p>
                  <div className="flex gap-1.5 mb-3">
                    {product.colors.map((color, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: color, outline: '1px solid #e5e7eb' }}
                      />
                    ))}
                  </div>

                  {/* Quantity + Price row */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Quantity Available</p>
                      <p className="text-sm font-semibold text-gray-800">{product.quantity} units</p>
                    </div>
                    <p className="text-blue-600 font-bold text-xl">{product.price}</p>
                  </div>

                  {/* Contact Seller Button */}
                  <a
                    href={`https://wa.me/2348147061837?text=Hi%2C%20I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Contact Seller
                  </a>
                  <p className="text-center text-xs text-gray-400 mt-1.5">via WhatsApp</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <ShoppingBagEmpty className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bags found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or browse all categories</p>
            <button
              onClick={handleClearSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Bags
            </button>
          </div>
        )}
      </div>
    </div>
  );
}