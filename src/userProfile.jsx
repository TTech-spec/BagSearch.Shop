import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";

// This component renders the Luxury Bag Dashboard (User Profile) converted from static HTML to React JSX.
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

// Mock data for the dashboard
const recentOrdersData = [
  {
    id: "ORD-7721",
    name: "Hermès Birkin 30",
    date: "Oct 24, 2023",
    status: "Shipped",
    price: "$12,500.00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBECQ8HfkIxyxxchE3z0hxSz5fkbR5tPLUbOcZ-xhbs8v0UujtRaDmiMQimAaBzU5iKlHc7HpbInd7VK0Rcq1-Au1YTQYREK0YUQZGFEDvnC_mtC99IDuTItIavpoY11u89DBknbJkqz31rlyiVENX9Ekq4yPYTaujxC_uBl9tekiqkSlnRr72lBRihmpzEmM3azOcebAe5wMu_yWmn3XIYkvbaFj8bpCdE3gPZy8Gl40E047G1yNp1nLLWK_XvvK6-xQA-YSB1y8U"
  },
  {
    id: "ORD-7604",
    name: "Chanel Classic Flap",
    date: "Sept 12, 2023",
    status: "Processing",
    price: "$8,900.00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ3vAV4MfhCEFb8kljDnXO3D0j9CRgkUEuxCPVLoEblru9igM9MBU7VRUVRmhP-ci90g1twDatNY32jCl4A2zNZKlE4F68qKdskaY8bLogjB5GUeQhhVcYunxqrqay-_Iyi3Qtfx8kiKOd1xRoG39dynHQnpVj2wsMbLN_1MomC3hBqCugcIGKTAlyTqUdhafzcrgSG_TMtykwHjrYMG_f6hdmcp299vZ0aDOtbXW34sDgoqdDS7HVPczN6_nbq266UmwCr5KWPgM"
  }
];

const visualSearchesData = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1mZVBNcM4XSzxbPif2JLlCldM1gDzifv5KO3K4_jouYOg--ADzGQkoZd25VWklR3C5aRoG2AWZZBNwIhbWGMKWICGNRoGxr28j0UiUuzrD7zMkFVaYsupbOCWcGRAyRtXFswBIupnVpDnMIMll2uLH59Oplta4rdPSB_-O049cGfJ4GDP05_sOTr3VXbanYZq5WRqMgkgHigdFxx3H_iOHxBKsD-pVswn7t9U9nbq0Eqc7G0o7Lm3SZKNpDunJxB7jEtcjjaOn9w",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA215YNytnFxwPG4G1xOyVMzVS7veJIP97_yXcql41stagGsLFumVqK192-4l7NoqCiFs9UqusSCy5rtp7pANFLd1H5eeEHVv7EI35szDrw141Wov-7ElO87zT3xHRXM4RqxV4ukgMbe4HoR1JLp3k9HuotOVwydIJqF6KDN_jTuonBjJmuUIz1KZj4QiB1DUMBqB-xn7MVeIY1be510_BluuQgc9srr8D3dgxrXPpiqEyQajEndmWK2GA9PR5Su9Y_96UIvmkoXSw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3mv1LLjxT_I7BChX7BaNo08af-h1wVIZlvC2o-gO_BnSHcD0_xQ-chKsZsnYsEt7NUvFM8mXusmbBXThzMji0DnkWt0nngub8bMwrBSXFlC-kKu0G8Vwwkr-_XUj--KuHDB-yUNlSRfZSbwHduA2_nlK7izZZ3bKiLAdh7zQwtURkR0pRX2euclAzd5y2kN4jpDjAoWujcgQpGeShD532UtaxVg-XLGSkIcwGcm3GkCYu_F_vR0AtBgJQMQPMXfFRIGt91Ik7VUI"
];

const favoritesData = [
  {
    name: "Prada Cleo",
    description: "White Brushed Leather",
    price: "$2,950",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeBmQGUYwI_FMq7kgJLBsheP3dTRJUmWJWMVEKrWlHcgUuPn5ysW1oXsHla3387p91f3g4KwOxcWePxb7wglOzt_sm6nrjQjAe2gJ2-jm5tVupkmz9i99MfnkrVTWubX6hvKe2Nt_KGCV6zZbbJUM8u7IPbu6AndG8viCrQ-eOlfcwc6LNidBoUDhgrO-pOYzgBgRTz5R-RdcmBTLuQqB4h8vi0Hae4xCyz4USsvzISQkhI3AgdDWGJxDs5ijbw75siaMYVLGMqAU"
  },
  {
    name: "LV Pochette",
    description: "Monogram Canvas",
    price: "$1,620",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGbeOhhrxxut0VSEOiqzo3qvHHQJplzbmlXz5xjIlwlMRXSBPd7Kdz4_WkA3ih-f6tem4t8Oma6lCNDkLm-XoolSnMZcrZ_CXc0_AtleODvnc4Gyg409t6GQhTWPOnEOg2ep38GA-7h95OYpNJ3OhFRDELp-eV8yERevJKFTlEV9kP4NV96PFvaY7vNbpVyPavAyWk_bSKoi7HW32n-H5orgaN8yu9ctQj4ZfDYpiCfmtlzROVC-pD3gB_HfosR5re9vsIsA5-bJc"
  },
  {
    name: "Gucci Marmont",
    description: "Matelassé Leather",
    price: "$2,550",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBQRJgBgkwOV5f44ZLePbkqCjbTlF5pOvaifeh_ePLSW_G8UkV_YJxNPs1ZmX8KGSWJR2mCCU0V214PIJsNshHHjY2vpTpZboJl1SBj_F4thZnzpeO6Xd9Q7qM4oz3FLqsTZHFbMu-E0q-Ii0s-Ezgo_5N89beikyHbYW8LZDqHFqlC8ALei_YnHuKRo33SwN75ppoZHujC_KylKshislebcTI8CsoseKRdnVO0kL-Mp3MutH07nzQ2DEWveSfcYWC6aNWXFLxSys"
  }
];

export default function UserProfile() {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    injectHeadAssets();
    const html = document.documentElement;
    html.lang = 'en';
    if (!html.classList.contains('light') && !html.classList.contains('dark')) {
      html.classList.add('light');
    }
  }, []);

  const navItems = [
    { icon: 'dashboard', label: 'Account Overview', active: true },
    { icon: 'shopping_bag', label: 'My Orders', active: false },
    { icon: 'history', label: 'Search History', active: false },
    { icon: 'favorite', label: 'Wishlist', active: false },
    { icon: 'settings', label: 'Settings', active: false },
  ];

  // Use user data if available, otherwise use mock data
  const userName = user?.name || "Alex Rivera";
  const userAvatar = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCFpRoLl054kkpGTCXs0m4MaYYaSm-KTGcUA-1LTa0PCef4qhskMGh-RN6ppgx1Z6arOam1C1K6ZKF9-X38IoWQdt8tqF4Qn5onevV0kUN1re2iW1u4bnFcJsHWz73wgtB1RR50lFO4Kla5yTvJwRZ1tStgtmJPfS3CvRvyjYmSei8Vk0EZ24W4_Qy8R8q3qlHPOeHq6sZUQEfZVbTNLPcF1k7IMYi-c2pK4Fcxte6eIlNMzL1N-WOORBl_iOP0rdxIpwqFPavtXj0";

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#111318] dark:text-white">
      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <aside className={`w-64 border-r border-[#dbdfe6] bg-white dark:bg-background-dark fixed h-full z-10 hidden lg:block`}>
          <div className="flex flex-col h-full p-6 justify-between">
            <div className="space-y-8">
              {/* User Profile Summary */}
              <div className="flex items-center gap-3">
                <div 
                  className="h-12 w-12 rounded-full bg-cover bg-center border border-[#dbdfe6]"
                  style={{ backgroundImage: `url('${userAvatar}')` }}
                />
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-[#111318] dark:text-white">{userName}</h2>
                  <span className="text-xs text-[#616f89]">Gold Member</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                {navItems.map((item, index) => (
                  <a 
                    key={index}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      item.active 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-[#616f89] hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`} 
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </a>
                ))}
                
                <div className="pt-4 mt-4 border-t border-[#dbdfe6]">
                  <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#616f89] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" href="#">
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                    <span className="text-sm">Settings</span>
                  </a>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-2"
                  >
                    <span className="material-symbols-outlined text-[22px]">logout</span>
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Concierge Section */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Concierge</p>
              <p className="text-[11px] text-[#616f89] leading-relaxed mb-3">Need help finding a specific vintage piece?</p>
              <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all">Chat with Expert</button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-10 space-y-10">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-[#111318] dark:text-white tracking-tight">Welcome back, {userName.split(' ')[0]}</h1>
              <p className="text-[#616f89] text-base mt-2">Manage your luxury collection and view curated insights.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 border border-[#dbdfe6] rounded-lg text-sm font-bold bg-white hover:bg-gray-50 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit Profile
              </button>
              <button className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                New Visual Search
              </button>
            </div>
          </header>

          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-background-dark p-6 rounded-xl border border-[#dbdfe6] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[#616f89] text-xs font-bold uppercase tracking-widest mb-1">Total Orders</p>
                <p className="text-2xl font-black text-[#111318] dark:text-white">12</p>
              </div>
              <div className="p-3 bg-blue-50 text-primary rounded-full">
                <span className="material-symbols-outlined text-2xl">local_mall</span>
              </div>
            </div>
            <div className="bg-white dark:bg-background-dark p-6 rounded-xl border border-[#dbdfe6] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[#616f89] text-xs font-bold uppercase tracking-widest mb-1">Loyalty Points</p>
                <p className="text-2xl font-black text-[#111318] dark:text-white">2,450</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-full">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
            </div>
            <div className="bg-white dark:bg-background-dark p-6 rounded-xl border border-[#dbdfe6] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[#616f89] text-xs font-bold uppercase tracking-widest mb-1">Bags in Closet</p>
                <p className="text-2xl font-black text-[#111318] dark:text-white">08</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full">
                <span className="material-symbols-outlined text-2xl">checkroom</span>
              </div>
            </div>
          </section>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Left Column: Recent Orders */}
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-[#111318] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Recent Orders
                </h2>
                <a className="text-sm font-bold text-primary hover:underline" href="#">View All</a>
              </div>

              <div className="bg-white dark:bg-background-dark border border-[#dbdfe6] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-[#dbdfe6]">
                      <th className="px-6 py-4 text-xs font-bold text-[#616f89] uppercase tracking-wider">Order Detail</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#616f89] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#616f89] uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#616f89] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbdfe6]">
                    {recentOrdersData.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div 
                              className="h-14 w-14 rounded-lg bg-gray-100 flex-shrink-0 bg-cover bg-center border border-[#dbdfe6]"
                              style={{ backgroundImage: `url('${order.image}')` }}
                            />
                            <div>
                              <p className="text-sm font-bold text-[#111318] dark:text-white">{order.name}</p>
                              <p className="text-xs text-[#616f89] mt-1">#{order.id} • {order.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.status === 'Shipped' 
                              ? 'bg-blue-50 text-primary border border-primary/10'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-[#111318] dark:text-white">{order.price}</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="material-symbols-outlined text-[#616f89] hover:text-primary transition-colors">chevron_right</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Visual Searches Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-[#111318] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image_search</span>
                    Recent Visual Searches
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {visualSearchesData.map((image, index) => (
                    <div 
                      key={index}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-[#dbdfe6] hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${image}')` }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-3xl">pageview</span>
                      </div>
                    </div>
                  ))}
                  <div className="group relative aspect-square rounded-xl overflow-hidden border border-dashed border-[#dbdfe6] flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[#616f89] mb-2">add_a_photo</span>
                    <p className="text-[10px] font-bold text-[#616f89] uppercase tracking-widest text-center px-2">New Upload</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Wishlist & Favorites */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-[#111318] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">favorite</span>
                  Favorites
                </h2>
                <a className="text-sm font-bold text-primary hover:underline" href="#">See All</a>
              </div>

              <div className="space-y-4">
                {favoritesData.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-background-dark p-4 rounded-xl border border-[#dbdfe6] shadow-sm flex gap-4 group cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="h-20 w-20 rounded-lg bg-cover bg-center border border-[#dbdfe6]"
                      style={{ backgroundImage: `url('${item.image}')` }}
                    />
                    <div className="flex flex-col justify-between py-1 flex-1">
                      <div>
                        <h3 className="text-sm font-bold text-[#111318] dark:text-white">{item.name}</h3>
                        <p className="text-xs text-[#616f89]">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-primary">{item.price}</span>
                        <button className="text-red-500 material-symbols-outlined text-sm">favorite_fill</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Membership Banner */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-blue-800 p-6 text-white shadow-xl">
                <div className="relative z-10">
                  <h4 className="text-lg font-black mb-2">Exclusive Offer</h4>
                  <p className="text-xs text-blue-100 leading-relaxed mb-4">You're only 500 points away from the Platinum tier. Enjoy free global shipping on all orders.</p>
                  <button className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">Learn More</button>
                </div>
                <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[120px] opacity-10 rotate-12">diamond</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
