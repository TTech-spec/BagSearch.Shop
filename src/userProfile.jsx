import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, History, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { supabase } from './services/api';

// ─── Icon Component ──────────────────────────────────────────────────────────
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

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

// ─── Skeleton placeholder ────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
function UserProfile() {
  const navigate = useNavigate();
  const [profile,       setProfile]       = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!user)   throw new Error('Not authenticated. Please sign in.');

        const userId = user.id;

        const { data: profileData, error: profileErr } = await supabase
          .from('users')
          .select('id, full_name, email, phone, role, created_at')
          .eq('id', userId)
          .maybeSingle();

        const profile = profileData || {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email,
          phone: user.user_metadata?.phone || '',
          role: user.user_metadata?.role || 'buyer',
          created_at: user.created_at,
        };

        setProfile(profile);

        const { data: historyData, error: historyErr } = await supabase
          .from('search_history')
          .select('query, created_at, type')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (historyErr) {
          console.warn('Search history not available:', historyErr.message);
          setSearchHistory([]);
        } else {
          setSearchHistory(historyData ?? []);
        }

        const total  = historyData?.length ?? 0;
        const images = historyData?.filter(h => h.type === 'image').length ?? 0;

        const [ordersResult, savedResult] = await Promise.all([
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('saved_items')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
        ]);

        const orders = ordersResult.error ? 0 : (ordersResult.count ?? 0);
        const saved  = savedResult.error  ? 0 : (savedResult.count  ?? 0);

        setStats({
          totalSearches: total,
          imageSearches: images,
          orders,
          savedItems: saved,
        });

      } catch (err) {
        console.error('Profile load error:', err);
        setError(err.message ?? 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // ── Error state ──────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load profile</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar with Back Arrow ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 68,
          }}
        >
          {/* ── Back Button ── */}
          <button
            onClick={() => navigate('/home')}
            aria-label="Go back to home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.18s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            }}
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
            <span>Back</span>
          </button>

          {/* ── Page Title ── */}
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
            My Profile
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Profile Header ── */}
        <Card className="p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">

            {/* Avatar */}
            {loading ? (
              <Skeleton className="w-24 h-24 rounded-full" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-white" />
              </div>
            )}

            {/* Name & badges */}
            <div className="flex-1 text-center md:text-left">
              {loading ? (
                <>
                  <Skeleton className="h-7 w-48 mb-2" />
                  <Skeleton className="h-4 w-36 mb-3" />
                  <div className="flex gap-2 justify-center md:justify-start">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile?.full_name ?? '—'}
                  </h1>
                  <p className="text-gray-600 mb-3">
                    Member since {fmt(profile?.created_at)}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {profile?.role && (
                      <Badge variant="secondary" className="capitalize">
                        {profile.role}
                      </Badge>
                    )}
                    <Badge variant="outline">{stats?.totalSearches ?? 0}+ Searches</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── Contact Information ── */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <ContactRow
                icon={<Mail className="w-5 h-5 text-blue-600" />}
                bg="bg-blue-100" label="Email"
                loading={loading} value={profile?.email}
              />
              <ContactRow
                icon={<Phone className="w-5 h-5 text-green-600" />}
                bg="bg-green-100" label="Phone"
                loading={loading} value={profile?.phone}
              />
              <ContactRow
                icon={<Calendar className="w-5 h-5 text-orange-600" />}
                bg="bg-orange-100" label="Member Since"
                loading={loading} value={fmt(profile?.created_at)}
              />
            </div>
          </Card>

          {/* ── Search History ── */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Recent Searches</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : searchHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No search history yet.</p>
            ) : (
              <div className="space-y-3">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.type === 'image' ? 'bg-purple-500' : 'bg-blue-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.query}</p>
                        <p className="text-xs text-gray-500">{fmtShort(item.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Activity Stats ── */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Stats</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox value={stats?.totalSearches} label="Total Searches" color="blue"   />
              <StatBox value={stats?.orders}        label="Orders Placed"  color="green"  />
              <StatBox value={stats?.imageSearches} label="Image Searches" color="purple" />
              <StatBox value={stats?.savedItems}    label="Saved Items"    color="orange" />
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

// ─── Contact row sub-component ───────────────────────────────────────────────
function ContactRow({ icon, bg, label, loading, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {loading
          ? <Skeleton className="h-4 w-36 mt-1" />
          : <p className="text-sm font-medium text-gray-900 truncate">{value ?? '—'}</p>
        }
      </div>
    </div>
  );
}

// ─── Stat box sub-component ──────────────────────────────────────────────────
const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
};

function StatBox({ value, label, color }) {
  const { bg, text } = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className={`text-center p-4 ${bg} rounded-lg`}>
      <p className={`text-3xl font-bold ${text}`}>{value ?? 0}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

export default UserProfile;