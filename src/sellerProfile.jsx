import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

const inquiries = [
  {
    id: 1,
    bag: 'Classic Leather Tote',
    sku: 'BT-2041',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1M-wNA_bDjdtXcWFW2QQ0Ap7H7fHvxOZkodgM-Y2TJUYl_INGZIeYNItkrfwCultBnZL7YWSxI9aWicu3lYoTQX76ihjq-4JVOVmBqUWC49ml9jbAvu_0oPPBCNMCa5ecigl35vGH3JkFwhsdfuywahciLurV0Qg2EIUIuf7Yef7m3nOUVmQwCdaQ6I9UmF5ubB4pz27Wk-3kyO0aKi293kQpytkSxa89xvgKAdktzshKTqWKcT_hpuxGwsQVRpoIwWLtHOR3sY',
    buyer: 'Sarah Jenkins',
    source: 'visual',
    time: '2 mins ago',
    replied: false,
  },
  {
    id: 2,
    bag: 'Suede Crossbody',
    sku: 'BC-5592',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9TsB1OZKW1UX2EF8YrcsHRB7QvWhHeVYXdDnyZbtG4RGsbyBnIhSX0DeNHq4vtIpwZYlm0RAXqDR6uVRCZdla9Yuw3IlnxkzqFGDJSM8HNtiF1MlH2bAZyj0RMGTHFUCYuMCyTcbDTkUNxI7RW84cgcw36Y91iTzEC6CDGInerpFD7lmrhPKnvvuX4sjYsbMCxJ2ijCmO-M3G5fya4FGV6cTI0r0oUlqBxB-dYe0N-HEINpbeJFZlMKd8T6SdjBeunheBtOHU5KU',
    buyer: 'Michael Chen',
    source: 'direct',
    time: '15 mins ago',
    replied: false,
  },
  {
    id: 3,
    bag: 'Travel Duffel XL',
    sku: 'BD-8820',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNPSuErvUQzNWlP1jYgHSy35w8kbHLVCEs-z6BHzB6xA3u31e0J35RsxamS01C-q8pZw-YDAFx8jszYBqBVe-pQuYzqs7m-V-wqkK12hRnyY9E_AWsjN2o_ZiFUNq7wNroeQfCEaO9lFYze1_1qp3f9vTUhZMzUApAquoMX30pEJbLCYvFaTyW68liLQviWg7jTlfXNIoPWod6OhbUw2jFi9H33pu_SpHHJK88W5DT-19YUcVNf5lF3AKjRWwOzmGAMB0frIyFcdk',
    buyer: 'Elena Rodriguez',
    source: 'visual',
    time: '1 hour ago',
    replied: false,
  },
  {
    id: 4,
    bag: 'Mini Evening Clutch',
    sku: 'BE-1102',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8WJ-IF2cV5qDy3_g9-2gwA_7dQQdyJMhg6iA89yowNnmZfUBdBvev_h1yO7J1hg-VhQvGbABZTQw4bOI_iq5hBkPNLmx8jihUw89dE6SvlLzw78nn0DCRCGYuiWuxhqWgCc_uoocoDIBKuExZkkJsdJqSA2QZSTQO7z1_uW0uz6a7cWBCO-LCXEGCsIRaH-V2SHgWTAdgPlton-ELabuGSECYJ7h_uuDOOUSPducuHRAzN4JCtv0b2GLKkeeTpQ-3Y_jDYwJ3ALw',
    buyer: 'Julianna Smith',
    source: 'referral',
    time: '2 hours ago',
    replied: true,
  },
];

const stats = [
  { icon: 'payments', color: 'bg-blue-50 text-blue-600', label: 'Total Revenue', value: '$12,450.00', badge: '+12.5%', badgeColor: 'text-green-700 bg-green-100' },
  { icon: 'shopping_basket', color: 'bg-orange-50 text-orange-500', label: 'Active Listings', value: '84', badge: '+2%', badgeColor: 'text-green-700 bg-green-100' },
  { icon: 'chat', color: 'bg-green-50 text-green-600', label: 'WhatsApp Inquiries', value: '12', badge: 'Urgent', badgeColor: 'text-green-700 bg-green-100' },
  { icon: 'visibility', color: 'bg-purple-50 text-purple-600', label: 'Total Views', value: '3,205', badge: '+18%', badgeColor: 'text-green-700 bg-green-100', sub: '42% from Visual Search' },
];

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'inventory_2', label: 'My Listings' },
  { icon: 'receipt_long', label: 'Orders' },
];

const MS = ({ name, className = '', size = 22 }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontSize: size, fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}
  >
    {name}
  </span>
);

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function SourceBadge({ source }) {
  if (source === 'visual') return (
    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold w-fit">
      <MS name="image_search" size={14} /> Visual Search
    </span>
  );
  if (source === 'direct') return (
    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-bold w-fit">
      <MS name="search" size={14} /> Direct Search
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-bold w-fit">
      <MS name="link" size={14} /> Referral
    </span>
  );
}

export default function SellerProfile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function loadSellerData() {
      try {
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        setSeller({
          name: userData?.full_name || 'Seller',
          email: userData?.email || 'N/A',
          phone: userData?.phone || 'N/A',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvpoXo7YtW65fZoifh6-OBvboYK04miweSOuj6Xt3MU0lRTW3gROZ-yGC5x-7oo9rZ57jNo4UuErEqgoaDr1TAMdHPFfFP-vatuw0qptaMY1HfYfW5ibMHPKsvKOnRhVyJ_yK70bwtDd2fC8o-w9Wa3OtWchZ6yhFWdsOnEfszjQ_RO_7j5yBbu1XlwzB1smpV05dB47YQX77KfuNTOAVVgE7n1Bs3k07i85QoUJOXc0fFm49DcM7_v0DwmkIyfDF6Bmk3Lvj2ZWs',
        });
      } catch (err) {
        console.error('Error loading seller data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSellerData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        body, * { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col z-20">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <MS name="shopping_bag" size={18} />
          </div>
          <div>
            <h1 className="text-gray-900 text-base font-bold leading-tight">LuxeBag Admin</h1>
            <p className="text-gray-400 text-xs">Sales Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MS name={item.icon} size={22} />
              <span className={`text-sm ${item.active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Seller Profile Card */}
        <div className="p-4 border-t border-gray-200">
          {/* Name + Role */}
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-900">{seller?.name}</p>
            <span className="text-[10px] text-blue-600 uppercase tracking-wider font-bold">Pro Seller</span>
          </div>

          {/* Contact Details */}
          <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MS name="mail" size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{seller?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MS name="phone" size={14} className="text-gray-400 shrink-0" />
              <span>{seller?.phone}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <MS name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                placeholder="Search orders, inquiries, or products..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <MS name="notifications" size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <MS name="help" size={22} />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1" />
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
              <MS name="add" size={18} />
              New Listing
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Page Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Seller Dashboard</h2>
            <p className="text-gray-400 mt-1">Monitor your performance and handle customer inquiries.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className={`bg-white p-6 rounded-xl shadow-sm ${stat.label === 'Total Revenue' ? '' : 'border border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <MS name={stat.icon} size={22} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.badgeColor}`}>{stat.badge}</span>
                </div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-black mt-1 text-gray-900">{stat.value}</p>
                {stat.sub && (
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <MS name="image_search" size={14} /> {stat.sub}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Recent Inquiries</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-white transition-all">
                <MS name="filter_list" size={16} /> Filter
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-white transition-all">
                View All
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {['Bag Detail', 'Buyer Name', 'Source', 'Received', 'Action'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg bg-cover bg-center border border-gray-200 shrink-0"
                          style={{ backgroundImage: `url('${row.img}')` }}
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{row.bag}</p>
                          <p className="text-xs text-gray-400">SKU: {row.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{row.buyer}</p>
                    </td>
                    <td className="px-6 py-4">
                      <SourceBadge source={row.source} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{row.time}</td>
                    <td className="px-6 py-4 text-right">
                      {row.replied ? (
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-not-allowed">
                          <MS name="check_circle" size={18} /> Replied
                        </button>
                      ) : (
                        <a
                          href={`https://wa.me/2348147061837?text=Hi%2C%20I'm%20following%20up%20on%20an%20inquiry%20about%20${encodeURIComponent(row.bag)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MS name="chat" size={18} /> Chat on WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* WhatsApp Footer Banner */}
          <div className="mt-8 flex items-center gap-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm shrink-0">
              <WhatsAppIcon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-600">WhatsApp Business API Active</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                You are currently receiving direct inquiries from your product pages. Response time is averaged at 14 minutes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
