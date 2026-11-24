import { Sheet, SheetContent, SheetClose } from "./ui/Sheet.jsx";
import LogoIcon from "./Logo.jsx";

const Icon = ({ name, size = 18 }) => (
  <span aria-hidden="true" style={{ fontFamily: "'Material Symbols Outlined'", fontSize: size, lineHeight: 1 }}>{name}</span>
);

function Item({ icon, label, onSelect, tone, end }) {
  return (
    <button type="button" className="hs-item" data-tone={tone} onClick={onSelect}>
      <span className="ic"><Icon name={icon} /></span>
      {label}
      <span className="end">{end ?? <Icon name="chevron_right" size={16} />}</span>
    </button>
  );
}

/**
 * Home page navigation drawer.
 * `go(action)` is called after the sheet starts closing; actions are strings
 * the page maps to navigation (keeps routing logic in home.jsx).
 */
export default function HomeSidebar({ open, onOpenChange, user, go }) {
  const pick = (action) => () => { onOpenChange(false); setTimeout(() => go(action), 180); };
  const initial = (user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Main menu" description="Browse BagSearch">
        <div className="hs-head">
          <div className="hs-brand"><LogoIcon /><span>Bag<b>Search</b></span></div>
          <SheetClose className="hs-icon-btn" aria-label="Close menu"><Icon name="close" /></SheetClose>
        </div>

        <button type="button" className="hs-search" onClick={pick("search")}>
          <Icon name="search" /> Search bags, brands…<span className="k">/</span>
        </button>

        <button type="button" className="hs-feature" onClick={pick("visual")}>
          <strong><Icon name="camera_enhance" size={20} /> Visual Search <span className="hs-badge">AI</span></strong>
          <p>Snap or upload a photo and find the bag in seconds.</p>
        </button>

        <nav aria-label="Shop">
          <div className="hs-group">
            <div className="hs-label">Shop</div>
            <Item icon="new_releases" label="New Arrivals" onSelect={pick("new")} />
            <Item icon="grid_view" label="Collections" onSelect={pick("collections")} />
            <Item icon="local_fire_department" label="Hot Deals" tone="accent" onSelect={pick("deals")} />
          </div>
          <div className="hs-group">
            <div className="hs-label">You</div>
            <Item icon="shopping_bag" label="Cart" onSelect={pick("cart")} />
            <Item icon="favorite" label="Wishlist" onSelect={pick("wishlist")} />
          </div>
          <div className="hs-group">
            <div className="hs-label">BagSearch</div>
            <Item icon="info" label="About Us" onSelect={pick("about")} />
            <Item icon="mail" label="Contact Us" onSelect={pick("contact")} />
          </div>
        </nav>

        <div className="hs-foot">
          {user ? (
            <button type="button" className="hs-item" onClick={pick("profile")}>
              <span className="hs-avatar">{initial}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>My account</span>
              <span className="end"><Icon name="chevron_right" size={16} /></span>
            </button>
          ) : (
            <button type="button" className="hs-cta" onClick={pick("login")}>Sign In</button>
          )}
          <p className="hs-tag">Luxury Redefined</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
