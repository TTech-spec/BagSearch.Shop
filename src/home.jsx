import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";

// This component renders the LuxeBag landing page converted from static HTML to React JSX.
// Tailwind via CDN and Google Fonts are injected into the document head on mount to mirror the original page behavior.

const injectHeadAssets = () => {
  // Tailwind CDN (with plugins)
  if (!document.querySelector('script[src^="https://cdn.tailwindcss.com"]')) {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
    document.head.appendChild(script);
  }

  // Tailwind runtime config
  if (!document.getElementById("tailwind-config")) {
    const cfg = document.createElement("script");
    cfg.id = "tailwind-config";
    cfg.innerHTML = `
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: '#135bec',
              'background-light': '#f6f6f8',
              'background-dark': '#101622',
            },
            fontFamily: {
              display: ['Manrope', 'sans-serif'],
            },
            borderRadius: {
              DEFAULT: '0.25rem',
              lg: '0.5rem',
              xl: '0.75rem',
              full: '9999px',
            },
          },
        },
      }
    `;
    document.head.appendChild(cfg);
  }

  // Google Fonts: Manrope
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Manrope" ]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }

  // Google Material Symbols Outlined
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Material+Symbols+Outlined" ]')) {
    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    document.head.appendChild(link2);
  }

  // Inline styles used by the original page
  if (!document.getElementById("luxe-inline-styles")) {
    const style = document.createElement("style");
    style.id = "luxe-inline-styles";
    style.innerHTML = `
      body { font-family: 'Manrope', sans-serif; }
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
  }
};

export default function Home() {
  const { user, login, logout, loading } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    injectHeadAssets();
    // Ensure the html element has the correct lang and class attributes similar to original
    const html = document.documentElement;
    html.lang = 'en';
    if (!html.classList.contains('light') && !html.classList.contains('dark')) {
      html.classList.add('light');
    }
  }, []);

  const handleFakeLogin = () => {
    if (!user) {
      login({ name: 'Guest User', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvpoXo7YtW65fZoifh6-OBvboYK04miweSOuj6Xt3MU0lRTW3gROZ-yGC5x-7oo9rZ57jNo4UuErEqgoaDr1TAMdHPFfFP-vatuw0qptaMY1HfYfW5ibMHPKsvKOnRhVyJ_yK70bwtDd2fC8o-w9Wa3OtWchZ6yhFWdsOnEfszjQ_RO_7j5yBbu1XlwzB1smpV05dB47YQX77KfuNTOAVVgE7n1Bs3k07i85QoUJOXc0fFm49DcM7_v0DwmkIyfDF6Bmk3Lvj2ZWs' });
    }
  };

  const navItems = [
    { icon: 'home', label: 'Home' },
    { icon: 'grid_view', label: 'Collections' },
    { icon: 'new_releases', label: 'New Arrivals' },
    { icon: 'trending_up', label: 'Trending Now' },
    { icon: 'info', label: 'About Us' },
  ];

  return (
    <div className="bg-white dark:bg-background-dark font-display text-[#111318] dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg border-b border-[#dbdfe6] dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button 
              className="p-2 text-[#616f89] hover:text-primary transition-colors md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">shopping_bag</span>
              </div>
              <span className="text-xl font-black tracking-tight">LUXEBAG</span>
            </div>

            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#616f89] group-focus-within:text-primary transition-colors">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or upload a photo..."
                  className="block w-full pl-11 pr-24 py-3 bg-background-light dark:bg-gray-800 border-transparent rounded-full text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <button className="flex items-center gap-1 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-all">
                    <span className="material-symbols-outlined text-base">image_search</span>
                    Visual Search
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <button className="text-[#616f89] hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">favorite</span>
              </button>
              <button className="relative text-[#616f89] hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                <span className="absolute -top-1 -right-1 size-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <button className="size-10 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <img
                      src={user.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCvpoXo7YtW65fZoifh6-OBvboYK04miweSOuj6Xt3MU0lRTW3gROZ-yGC5x-7oo9rZ57jNo4UuErEqgoaDr1TAMdHPFfFP-vatuw0qptaMY1HfYfW5ibMHPKsvKOnRhVyJ_yK70bwtDd2fC8o-w9Wa3OtWchZ6yhFWdsOnEfszjQ_RO_7j5yBbu1XlwzB1smpV05dB47YQX77KfuNTOAVVgE7n1Bs3k07i85QoUJOXc0fFm49DcM7_v0DwmkIyfDF6Bmk3Lvj2ZWs"}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <span className="hidden md:inline text-sm">{user.name || 'User'}</span>
                  <button onClick={logout} className="px-3 py-1 text-xs font-bold rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={handleFakeLogin} className="px-4 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all">
                  {loading ? 'Loading…' : 'Login'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              alt="Hero" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNPSuErvUQzNWlP1jYgHSy35w8kbHLVCEs-z6BHzB6xA3u31e0J35RsxamS01C-q8pZw-YDAFx8jszYBqBVe-pQuYzqs7m-V-wqkK12hRnyY9E_AWsjN2o_ZiFUNq7wNroeQfCEaO9lFYze1_1qp3f9vTUhZMzUApAquoMX30pEJbLCYvFaTyW68liLQviWg7jTlfXNIoPWod6OhbUw2jFi9H33pu_SpHHJK88W5DT-19YUcVNf5lF3AKjRWwOzmGAMB0frIyFcdk"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
          </div>
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-start">
            <span className="text-primary font-bold tracking-[0.2em] uppercase mb-4">Limited Edition</span>
            <h1 className="text-5xl md:text-7xl font-black text-white max-w-2xl leading-[1.1] mb-6">
              Find Your Perfect Match <br/>With <span className="text-primary">AI Vision</span>
            </h1>
            <p className="text-gray-200 text-lg max-w-lg mb-8">
              See a bag you love? Take a photo and our AI will find it or suggest similar styles from our luxury collection.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">camera_enhance</span>
                Try Visual Search
              </button>
              <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all">
                Browse Catalog
              </button>
            </div>
          </div>
        </section>

        {/* New Arrivals Section */}
        <section className="py-16 bg-white dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black tracking-tight">New Arrivals</h2>
                <p className="text-[#616f89] mt-2">Fresh arrivals from the world's most iconic designers.</p>
              </div>
              <div className="flex gap-2">
                <button className="size-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="size-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8">
              {/* Card 1 */}
              <div className="min-w-[320px] md:min-w-[400px] group cursor-pointer">
                <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 mb-4 relative">
                  <img
                    alt="Classic Leather Tote"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1M-wNA_bDjdtXcWFW2QQ0Ap7H7fHvxOZkodgM-Y2TJUYl_INGZIeYNItkrfwCultBnZL7YWSxI9aWicu3lYoTQX76ihjq-4JVOVmBqUWC49ml9jbAvu_0oPPBCNMCa5ecigl35vGH3JkFwhsdfuywahciLurV0Qg2EIUIuf7Yef7m3nOUVmQwCdaQ6I9UmF5ubB4pz27Wk-3kyO0aKi293kQpytkSxa89xvgKAdktzshKTqWKcT_hpuxGwsQVRpoIwWLtHOR3sY"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">New In</span>
                  </div>
                  <button className="absolute bottom-6 right-6 size-12 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                  </button>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">Monogram Leather Tote</h3>
                <p className="text-[#616f89] text-sm">Classic Collection</p>
                <p className="text-xl font-black mt-2">$2,450.00</p>
              </div>

              {/* Card 2 */}
              <div className="min-w-[320px] md:min-w-[400px] group cursor-pointer">
                <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 mb-4 relative">
                  <img
                    alt="Suede Crossbody"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9TsB1OZKW1UX2EF8YrcsHRB7QvWhHeVYXdDnyZbtG4RGsbyBnIhSX0DeNHq4vtIpwZYlm0RAXqDR6uVRCZdla9Yuw3IlnxkzqFGDJSM8HNtiF1MlH2bAZyj0RMGTHFUCYuMCyTcbDTkUNxI7RW84cgcw36Y91iTzEC6CDGInerpFD7lmrhPKnvvuX4sjYsbMCxJ2ijCmO-M3G5fya4FGV6cTI0r0oUlqBxB-dYe0N-HEINpbeJFZlMKd8T6SdjBeunheBtOHU5KU"
                  />
                  <button className="absolute bottom-6 right-6 size-12 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                  </button>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">Velvet Suede Crossbody</h3>
                <p className="text-[#616f89] text-sm">Limited Edition</p>
                <p className="text-xl font-black mt-2">$1,890.00</p>
              </div>

              {/* Card 3 */}
              <div className="min-w-[320px] md:min-w-[400px] group cursor-pointer">
                <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 mb-4 relative">
                  <img
                    alt="Evening Clutch"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8WJ-IF2cV5qDy3_g9-2gwA_7dQQdyJMhg6iA89yowNnmZfUBdBvev_h1yO7J1hg-VhQvGbABZTQw4bOI_iq5hBkPNLmx8jihUw89dE6SvlLzw78nn0DCRCGYuiWuxhqWgCc_uoocoDIBKuExZkkJsdJqSA2QZSTQO7z1_uW0uz6a7cWBCO-LCXEGCsIRaH-V2SHgWTAdgPlton-ELabuGSECYJ7h_uuDOOUSPducuHRAzN4JCtv0b2GLKkeeTpQ-3Y_jDYwJ3ALw"
                  />
                  <button className="absolute bottom-6 right-6 size-12 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                  </button>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">Gilded Evening Clutch</h3>
                <p className="text-[#616f89] text-sm">Evening Wear</p>
                <p className="text-xl font-black mt-2">$3,200.00</p>
              </div>
            </div>
          </div>
        </section>

        {/* Two-up category banners */}
        <section className="py-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Left */}
          <div className="relative h-[450px] rounded-[2rem] overflow-hidden group">
            <img
              alt="Luxury Totes"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNPSuErvUQzNWlP1jYgHSy35w8kbHLVCEs-z6BHzB6xA3u31e0J35RsxamS01C-q8pZw-YDAFx8jszYBqBVe-pQuYzqs7m-V-wqkK12hRnyY9E_AWsjN2o_ZiFUNq7wNroeQfCEaO9lFYze1_1qp3f9vTUhZMzUApAquoMX30pEJbLCYvFaTyW68liLQviWg7jTlfXNIoPWod6OhbUw2jFi9H33pu_SpHHJK88W5DT-19YUcVNf5lF3AKjRWwOzmGAMB0frIyFcdk"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 p-12 flex flex-col justify-end">
              <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Luxury Totes</h3>
              <p className="text-gray-200 mb-8 max-w-xs">Elevate your daily carry with our premium selection of oversized leather totes.</p>
              <button className="w-fit px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-primary hover:text-white transition-all">
                Shop Collection
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="relative h-[450px] rounded-[2rem] overflow-hidden group">
            <img
              alt="Minimalist Clutches"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8WJ-IF2cV5qDy3_g9-2gwA_7dQQdyJMhg6iA89yowNnmZfUBdBvev_h1yO7J1hg-VhQvGbABZTQw4bOI_iq5hBkPNLmx8jihUw89dE6SvlLzw78nn0DCRCGYuiWuxhqWgCc_uoocoDIBKuExZkkJsdJqSA2QZSTQO7z1_uW0uz6a7cWBCO-LCXEGCsIRaH-V2SHgWTAdgPlton-ELabuGSECYJ7h_uuDOOUSPducuHRAzN4JCtv0b2GLKkeeTpQ-3Y_jDYwJ3ALw"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 p-12 flex flex-col justify-end">
              <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Minimalist Clutches</h3>
              <p className="text-gray-200 mb-8 max-w-xs">Sophisticated simplicity for your most important evening occasions.</p>
              <button className="w-fit px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-primary hover:text-white transition-all">
                Shop Collection
              </button>
            </div>
          </div>
        </section>

        {/* Trending + Top Sellers */}
        <section className="py-16 bg-background-light dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Trending */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black tracking-tight">Trending Now</h2>
                  <a href="#" className="text-sm font-bold text-primary flex items-center gap-1">
                    View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Trend item */}
                  <div className="bg-white dark:bg-background-dark p-4 rounded-3xl flex gap-4 hover:shadow-xl transition-all cursor-pointer">
                    <div className="size-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        alt="Trend"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1M-wNA_bDjdtXcWFW2QQ0Ap7H7fHvxOZkodgM-Y2TJUYl_INGZIeYNItkrfwCultBnZL7YWSxI9aWicu3lYoTQX76ihjq-4JVOVmBqUWC49ml9jbAvu_0oPPBCNMCa5ecigl35vGH3JkFwhsdfuywahciLurV0Qg2EIUIuf7Yef7m3nOUVmQwCdaQ6I9UmF5ubB4pz27Wk-3kyO0aKi293kQpytkSxa89xvgKAdktzshKTqWKcT_hpuxGwsQVRpoIwWLtHOR3sY"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold">Python Effect Tote</h4>
                      <p className="text-[#616f89] text-xs">Exotic Skins</p>
                      <p className="text-primary font-black mt-1">$4,200</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-background-dark p-4 rounded-3xl flex gap-4 hover:shadow-xl transition-all cursor-pointer">
                    <div className="size-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        alt="Trend"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9TsB1OZKW1UX2EF8YrcsHRB7QvWhHeVYXdDnyZbtG4RGsbyBnIhSX0DeNHq4vtIpwZYlm0RAXqDR6uVRCZdla9Yuw3IlnxkzqFGDJSM8HNtiF1MlH2bAZyj0RMGTHFUCYuMCyTcbDTkUNxI7RW84cgcw36Y91iTzEC6CDGInerpFD7lmrhPKnvvuX4sjYsbMCxJ2ijCmO-M3G5fya4FGV6cTI0r0oUlqBxB-dYe0N-HEINpbeJFZlMKd8T6SdjBeunheBtOHU5KU"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold">Retro Crossbody</h4>
                      <p className="text-[#616f89] text-xs">Vintage Series</p>
                      <p className="text-primary font-black mt-1">$1,550</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-background-dark p-4 rounded-3xl flex gap-4 hover:shadow-xl transition-all cursor-pointer">
                    <div className="size-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        alt="Trend"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8WJ-IF2cV5qDy3_g9-2gwA_7dQQdyJMhg6iA89yowNnmZfUBdBvev_h1yO7J1hg-VhQvGbABZTQw4bOI_iq5hBkPNLmx8jihUw89dE6SvlLzw78nn0DCRCGYuiWuxhqWgCc_uoocoDIBKuExZkkJsdJqSA2QZSTQO7z1_uW0uz6a7cWBCO-LCXEGCsIRaH-V2SHgWTAdgPlton-ELabuGSECYJ7h_uuDOOUSPducuHRAzN4JCtv0b2GLKkeeTpQ-3Y_jDYwJ3ALw"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold">Crystal Mini Bag</h4>
                      <p className="text-[#616f89] text-xs">Party Edit</p>
                      <p className="text-primary font-black mt-1">$2,100</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-background-dark p-4 rounded-3xl flex gap-4 hover:shadow-xl transition-all cursor-pointer">
                    <div className="size-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        alt="Trend"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNPSuErvUQzNWlP1jYgHSy35w8kbHLVCEs-z6BHzB6xA3u31e0J35RsxamS01C-q8pZw-YDAFx8jszYBqBVe-pQuYzqs7m-V-wqkK12hRnyY9E_AWsjN2o_ZiFUNq7wNroeQfCEaO9lFYze1_1qp3f9vTUhZMzUApAquoMX30pEJbLCYvFaTyW68liLQviWg7jTlfXNIoPWod6OhbUw2jFi9H33pu_SpHHJK88W5DT-19YUcVNf5lF3AKjRWwOzmGAMB0frIyFcdk"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold">Weekend Duffel</h4>
                      <p className="text-[#616f89] text-xs">Travel Luxe</p>
                      <p className="text-primary font-black mt-1">$2,800</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Sellers */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black tracking-tight">Top Sellers</h2>
                </div>
                <div className="space-y-6">
                  {[
                    { n: '01', title: 'Classic Shopper XL', sold: 'Sold 1,204 times' },
                    { n: '02', title: 'Mini Bucket Bag', sold: 'Sold 982 times' },
                    { n: '03', title: 'Silk Scarf Handle Bag', sold: 'Sold 845 times' },
                  ].map((i, idx) => (
                    <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                      <span className="text-2xl font-black text-gray-200 group-hover:text-primary transition-colors">{i.n}</span>
                      <div className="size-16 rounded-xl overflow-hidden">
                        <img
                          alt="Top"
                          className="w-full h-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1M-wNA_bDjdtXcWFW2QQ0Ap7H7fHvxOZkodgM-Y2TJUYl_INGZIeYNItkrfwCultBnZL7YWSxI9aWicu3lYoTQX76ihjq-4JVOVmBqUWC49ml9jbAvu_0oPPBCNMCa5ecigl35vGH3JkFwhsdfuywahciLurV0Qg2EIUIuf7Yef7m3nOUVmQwCdaQ6I9UmF5ubB4pz27Wk-3kyO0aKi293kQpytkSxa89xvgKAdktzshKTqWKcT_hpuxGwsQVRpoIwWLtHOR3sY"
                        />
                      </div>
                      <div className="flex-1 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <h4 className="font-bold text-sm">{i.title}</h4>
                        <p className="text-[#616f89] text-xs">{i.sold}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all">
                  View Leaderboard
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp CTA banner */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary/5 border border-primary/10 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center md:text-left">
                <div className="size-16 bg-white rounded-2xl flex items-center justify-center text-green-500 shadow-xl shadow-green-500/10 mb-6 mx-auto md:mx-0">
                  <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
                  </svg>
                </div>
                <h2 className="text-4xl font-black mb-4">Concierge on WhatsApp</h2>
                <p className="text-[#616f89] text-lg">Chat directly with our styling experts. Send us a picture of your outfit and we'll recommend the perfect accessory instantly.</p>
              </div>
              <button className="px-12 py-5 bg-green-500 text-white font-black rounded-full flex items-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 whitespace-nowrap">
                <span className="material-symbols-outlined">forum</span>
                Start Styling Session
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">shopping_bag</span>
            </div>
            <span className="text-lg font-black tracking-tight">LUXEBAG</span>
          </div>
          <p className="text-[#616f89] text-sm">© 2024 LuxeBag International. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Visual Search (mobile) */}
      <div className="fixed bottom-8 right-8 z-40 md:hidden">
        <button className="size-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl">
          <span className="material-symbols-outlined text-3xl">image_search</span>
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-0 z-[100] transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        {/* Sidebar Content */}
        <nav className="relative w-80 h-full bg-white dark:bg-background-dark p-6 shadow-2xl flex flex-col">
          {/* User Info Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full border-2 border-primary overflow-hidden">
                <img 
                  alt="User" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvpoXo7YtW65fZoifh6-OBvboYK04miweSOuj6Xt3MU0lRTW3gROZ-yGC5x-7oo9rZ57jNo4UuErEqgoaDr1TAMdHPFfFP-vatuw0qptaMY1HfYfW5ibMHPKsvKOnRhVyJ_yK70bwtDd2fC8o-w9Wa3OtWchZ6yhFWdsOnEfszjQ_RO_7j5yBbu1XlwzB1smpV05dB47YQX77KfuNTOAVVgE7n1Bs3k07i85QoUJOXc0fFm49DcM7_v0DwmkIyfDF6Bmk3Lvj2ZWs"
                />
              </div>
              <div>
                <p className="font-black text-sm leading-tight">Alex Rivers</p>
                <p className="text-xs text-[#616f89]">Premium Member</p>
              </div>
            </div>
            <button 
              className="text-gray-400 hover:text-primary" 
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col gap-2">
            {navItems.map((item, index) => (
              <a 
                key={index}
                href="#" 
                className="flex items-center gap-3 px-4 py-3 text-lg font-bold hover:bg-primary/5 hover:text-primary rounded-xl transition-all"
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>

          {/* Logout Button */}
          <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800">
            <button 
              className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              onClick={() => {
                if (user) {
                  logout();
                }
                setSidebarOpen(false);
              }}
            >
              <span className="material-symbols-outlined">logout</span>
              {user ? 'Logout' : 'Login'}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
