import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

// Inject Tailwind CDN, runtime config, and Google Fonts to match the provided HTML
const injectHeadAssets = () => {
  // Tailwind CDN
  if (!document.querySelector('script[src^="https://cdn.tailwindcss.com"]')) {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
    document.head.appendChild(script);
  }

  // Tailwind runtime config: includes whatsapp color from the new design
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
              whatsapp: '#25D366',
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
      "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap";
    document.head.appendChild(link);
  }

  // Google Material Symbols Outlined (ensure single include)
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Material+Symbols+Outlined" ]')) {
    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    document.head.appendChild(link2);
  }

  // Inline base styles
  if (!document.getElementById("luxe-inline-styles")) {
    const style = document.createElement("style");
    style.id = "luxe-inline-styles";
    style.innerHTML = `
      body { font-family: 'Manrope', sans-serif; }
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    `;
    document.head.appendChild(style);
  }
};

export default function Home() {
  const { user, login, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showVisualSearch, setShowVisualSearch] = useState(false);

  useEffect(() => {
    injectHeadAssets();
    // Mirror original html attributes
    const html = document.documentElement;
    html.lang = 'en';
    if (!html.classList.contains('light') && !html.classList.contains('dark')) {
      html.classList.add('light');
    }
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white transition-colors duration-200">
      <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden font-display">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-[#f0f2f4] dark:border-[#2a2d35] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 lg:px-40 py-3">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="size-8 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">LUXE BAGS</h2>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden xl:flex items-center gap-6">
              <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">New In</a>
              <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">Handbags</a>
              <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">Travel</a>
              <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">Limited Edition</a>
            </nav>

            {/* Search & Actions */}
            <div className="flex flex-1 justify-end items-center gap-4">
              <label className="hidden md:flex flex-col min-w-[280px] lg:min-w-[400px] h-11">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full relative">
                  <div className="text-[#616f89] absolute left-4 top-1/2 -translate-y-1/2">
                    <span className="material-symbols-outlined text-xl">search</span>
                  </div>
                  <input
                    type="text"
                    className="form-input w-full rounded-lg text-[#111318] dark:text-white border-none bg-[#f0f2f4] dark:bg-[#1c212b] h-full placeholder:text-[#616f89] pl-11 pr-12 text-sm font-medium"
                    placeholder="Search by name or visual search..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowVisualSearch(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-white transition-all"
                    title="Visual Search"
                  >
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                  </button>
                </div>
              </label>

              <div className="flex gap-2">
                <button className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#1c212b] text-[#111318] dark:text-white hover:bg-primary/10 transition-colors" title="Bag">
                  <span className="material-symbols-outlined">shopping_bag</span>
                </button>

                {user ? (
                  <div className="flex items-center gap-2">
                    <button className="flex size-10 cursor-pointer items-center justify-center rounded-lg overflow-hidden border border-[#f0f2f4] dark:border-[#2a2d35]">
                      <img
                        src={user?.user_metadata?.avatar_url || user?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      onClick={logout}
                      className="hidden md:inline px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-[#1c212b] text-xs font-bold hover:bg-primary/10 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#1c212b] text-[#111318] dark:text-white hover:bg-primary/10 transition-colors"
                    title="Account"
                  >
                    {loading ? (
                      <span className="text-[10px] font-bold">...</span>
                    ) : (
                      <span className="material-symbols-outlined">account_circle</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 lg:px-40 py-8">
          {/* Hero Section */}
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-xl bg-[#1c212b] min-h-[400px] flex flex-col justify-center p-8 md:p-16">
              {/* Background Placeholder (Gradient/Abstract for context) */}
              <div
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                data-alt="Abstract minimalist luxury leather texture background"
                style={{ backgroundImage: 'linear-gradient(135deg, #135bec 0%, #000 100%)' }}
              />

              <div className="relative z-10 max-w-xl">
                <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-white uppercase bg-primary rounded">
                  New Collection
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                  Elegance in Every <span className="text-primary">Stitch</span>.
                </h1>
                <p className="text-lg text-gray-300 mb-8 max-w-md">
                  Discover handcrafted leather goods designed for the modern lifestyle. Shop the seasonal drop.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="flex items-center justify-center rounded-lg h-12 px-8 bg-primary text-white text-base font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                    Browse All Bags
                  </button>
                  <button
                    onClick={() => setShowVisualSearch(true)}
                    className="flex items-center justify-center rounded-lg h-12 px-6 bg-white/10 backdrop-blur-md text-white border border-white/20 text-base font-bold hover:bg-white/20 transition-all"
                  >
                    <span className="material-symbols-outlined mr-2">photo_camera</span>
                    Visual Search
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
              <p className="text-[#616f89] text-sm mt-1 font-medium">Curated pieces for your everyday journey</p>
            </div>
            <button className="text-primary font-bold text-sm flex items-center hover:underline">
              View All <span className="material-symbols-outlined ml-1">chevron_right</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Product Card 1 */}
            <div className="group flex flex-col bg-white dark:bg-[#1c212b] rounded-xl overflow-hidden border border-[#f0f2f4] dark:border-[#2a2d35] transition-all hover:shadow-xl hover:shadow-black/5">
              <div className="relative aspect-square w-full overflow-hidden bg-[#f6f6f8] dark:bg-[#252a36]">
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-110"
                  data-alt="Luxury black leather executive tote bag close-up"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBduHU4KRVhe-L3pVdYpiJUXXmVJpXv9PT9ILlzp-MJR35H1EzUQ0966LDurxZlQSltd_sYifIiCrMjskIYH0aQF4ONdoVyM89bDK8R9eS69rMx_K79ejTV4bbpzKqIxeP2iSRgb9pNGzJZI9R5Z-6vJSyF27d-JB0lnUWxvQYqIw_uzlE_EenjEcbEiJnj1rr-29XPq7S6SU9pE283zJmah-Tv0Psc1kdqGqgQ902C80I70XCfxpkdEUoO5BoIUfhLYpNmE8dnatQ")' }}
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm">Only 3 Left</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-sm text-[#616f89] font-semibold uppercase tracking-wider mb-1">Handbags</p>
                  <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">Executive Leather Tote</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="size-4 rounded-full bg-black border border-gray-200 cursor-pointer ring-offset-2 ring-1 ring-black" title="Obsidian" />
                    <div className="size-4 rounded-full bg-[#8B4513] border border-gray-200 cursor-pointer" title="Tan" />
                    <div className="size-4 rounded-full bg-[#E5E4E2] border border-gray-200 cursor-pointer" title="Platinum" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black">$285.00</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold h-11 rounded-lg hover:brightness-110 transition-all shadow-md">
                  <span className="material-symbols-outlined text-lg">chat</span>
                  Contact Seller
                </button>
              </div>
            </div>

            {/* Product Card 2 */}
            <div className="group flex flex-col bg-white dark:bg-[#1c212b] rounded-xl overflow-hidden border border-[#f0f2f4] dark:border-[#2a2d35] transition-all hover:shadow-xl hover:shadow-black/5">
              <div className="relative aspect-square w-full overflow-hidden bg-[#f6f6f8] dark:bg-[#252a36]">
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-110"
                  data-alt="Modern olive green commuter backpack"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAw1pO2QSZLTRqg338s__Oxr02t7wjHNrM6woZj8gSE39M2H4Fa4B1JHzP_ZGjowHwknVYI2ZS7K-bNfeeT4mbetW6-7NxZvTUeN5LgCVNJViwvsihexo-fo4yp9daO5OGjtUVm-4AA9NcYM3sFsMaJIH3_zkba7TDmMIitRBM8bakvfnfsFYtYKAfqoAYAeV3RmzhY4cl2U6qr5WaESRrBJOLvz__UHb3_wca-vKkJEo2v1BoEvKpsws0XtQiJAe-1aC8rmCwM1jE")' }}
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-background-light dark:bg-[#2a2d35] text-[#111318] dark:text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-[#f0f2f4] dark:border-none">In Stock</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-sm text-[#616f89] font-semibold uppercase tracking-wider mb-1">Travel</p>
                  <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">Urban Commuter Pack</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="size-4 rounded-full bg-[#556B2F] border border-gray-200 cursor-pointer ring-offset-2 ring-1 ring-[#556B2F]" title="Olive" />
                    <div className="size-4 rounded-full bg-[#1c1c1c] border border-gray-200 cursor-pointer" title="Midnight" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black">$145.00</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold h-11 rounded-lg hover:brightness-110 transition-all shadow-md">
                  <span className="material-symbols-outlined text-lg">chat</span>
                  Contact Seller
                </button>
              </div>
            </div>

            {/* Product Card 3 */}
            <div className="group flex flex-col bg-white dark:bg-[#1c212b] rounded-xl overflow-hidden border border-[#f0f2f4] dark:border-[#2a2d35] transition-all hover:shadow-xl hover:shadow-black/5">
              <div className="relative aspect-square w-full overflow-hidden bg-[#f6f6f8] dark:bg-[#252a36]">
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-110"
                  data-alt="Premium emerald silk evening clutch"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAaoJyV0-7VaPnl9ObRXezTnA4bMV8JN47-M4GwCx1s-aaPVKY55waEUz_kR1gVcDQ1ifRNIG0xImopt3F4HaSzuM6hh_FPrBEVxgA2rGD6v6dCf4Vas31dpmUxgtanQwjZQJqVhtPsQeEKXelin1VuWGgG0uDJ2sujqwalR0lr3_tFHL2Xt067Q-dnMU28T6U5MAy9IjE523h3y-yTmI6931yqgWayeR2jSfRaJFo1mWeGJHna32ENBc0OJmoYVDEmyV5Qk3IB0J0")' }}
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm">Limited Edition</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-sm text-[#616f89] font-semibold uppercase tracking-wider mb-1">Evening</p>
                  <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">Silk Gala Clutch</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="size-4 rounded-full bg-[#004d40] border border-gray-200 cursor-pointer ring-offset-2 ring-1 ring-[#004d40]" title="Emerald" />
                    <div className="size-4 rounded-full bg-[#fdd835] border border-gray-200 cursor-pointer" title="Gold" />
                    <div className="size-4 rounded-full bg-[#d81b60] border border-gray-200 cursor-pointer" title="Magenta" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black">$95.00</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold h-11 rounded-lg hover:brightness-110 transition-all shadow-md">
                  <span className="material-symbols-outlined text-lg">chat</span>
                  Contact Seller
                </button>
              </div>
            </div>

            {/* Product Card 4 */}
            <div className="group flex flex-col bg-white dark:bg-[#1c212b] rounded-xl overflow-hidden border border-[#f0f2f4] dark:border-[#2a2d35] transition-all hover:shadow-xl hover:shadow-black/5">
              <div className="relative aspect-square w-full overflow-hidden bg-[#f6f6f8] dark:bg-[#252a36]">
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-110"
                  data-alt="Minimalist beige leather crossbody bag"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpMKnjO72xADYFOzAAgfhRCZvBiY2i72IIkHSx3VsqcfIY0uM8iqsnQpG_aueRGJL8DUDCMg9zVLioNfoab13LM29iIXcq72tISWxiWSAAfdYdgJ_4pPWxKxYXYuKyNm6VdBCtWp3CwNuS365kWcZNMPk-XmwwcIRGTgFNHUu1UG1irT7YgDP3ECePvPtvcNKiUU5O7sM5u5fAcCtlTKcX5G0dqwrghWEoIYIhvmOPFx3wFrMyPhQyNVS2Tq_1hZfb60mHVL0Q2MM")' }}
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm">Only 5 Left</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-sm text-[#616f89] font-semibold uppercase tracking-wider mb-1">Crossbody</p>
                  <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">Classic City Crossbody</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="size-4 rounded-full bg-[#F5F5DC] border border-gray-200 cursor-pointer ring-offset-2 ring-1 ring-[#F5F5DC]" title="Beige" />
                    <div className="size-4 rounded-full bg-black border border-gray-200 cursor-pointer" title="Obsidian" />
                    <div className="size-4 rounded-full bg-[#800000] border border-gray-200 cursor-pointer" title="Burgundy" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black">$120.00</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold h-11 rounded-lg hover:brightness-110 transition-all shadow-md">
                  <span className="material-symbols-outlined text-lg">chat</span>
                  Contact Seller
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* WhatsApp Floating CTA (Mobile/Secondary) */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            className="flex items-center justify-center size-14 bg-whatsapp text-white rounded-full shadow-2xl hover:scale-110 transition-transform shadow-whatsapp/30"
            title="Contact via WhatsApp"
          >
            <svg className="size-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </button>
        </div>

        {/* Simple Footer */}
        <footer className="mt-20 border-t border-[#f0f2f4] dark:border-[#2a2d35] bg-white dark:bg-background-dark px-6 md:px-10 lg:px-40 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-xl font-bold mb-4 tracking-tight">LUXE BAGS</h2>
              <p className="text-[#616f89] text-sm leading-relaxed">
                Curating the world's finest leather bags. Quality and craftsmanship guaranteed.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Shop</h4>
              <ul className="text-sm text-[#616f89] space-y-2">
                <li><a className="hover:text-primary transition-colors" href="#">New Arrivals</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Bestsellers</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Sale</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="text-sm text-[#616f89] space-y-2">
                <li><a className="hover:text-primary transition-colors" href="#">Contact Us</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Shipping Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Returns</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex gap-4">
                <button className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <span className="material-symbols-outlined text-sm">alternate_email</span>
                </button>
                <button className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <span className="material-symbols-outlined text-sm">public</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#f0f2f4] dark:border-[#2a2d35] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#616f89]">© 2024 Luxe Bags E-commerce. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-[#616f89]">
              <a className="hover:text-primary" href="#">Privacy Policy</a>
              <a className="hover:text-primary" href="#">Terms of Service</a>
            </div>
          </div>
        </footer>

        {/* Visual Search Modal */}
        {showVisualSearch && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-[#1c212b] rounded-2xl w-full max-w-lg p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Visual Search</h3>
                <button
                  className="text-gray-400 hover:text-black dark:hover:text-white"
                  onClick={() => setShowVisualSearch(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">cloud_upload</span>
                <p className="text-sm font-bold mb-1">Drag and drop an image</p>
                <p className="text-xs text-gray-500 mb-6">JPEG, PNG up to 5MB</p>
                <button className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold">Select File</button>
              </div>

              <div className="mt-6">
                <p className="text-xs text-center text-gray-400">Our AI will find matching bags from our collection</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
