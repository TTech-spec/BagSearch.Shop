import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/api';

const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 180; // covers the 90-day range plus its comparison period
const REVENUE_STATUSES = new Set(['paid', 'shipped', 'delivered', 'completed']);

export const SOURCE_LABELS = {
  visual: 'Photo search',
  direct: 'Browsing & search',
  referral: 'Shared links & Google',
};

const sourceBucket = (s) => (s === 'visual' || s === 'referral' ? s : 'direct');
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

/**
 * Loads a seller's products, recent product views and orders once, then derives
 * dashboard numbers for the selected range (7/30/90 days) on the client.
 */
export function useSellerAnalytics(userId, rangeDays) {
  const [raw, setRaw] = useState({ loading: true, products: [], views: [], orders: null, verification: 'none', fetchedAt: 0 });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - HISTORY_DAYS * DAY).toISOString();

      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('id,name,images,price,discounted_price,quantity,category,status,created_at')
        .or(`user_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (pErr) console.error('dashboard products:', pErr.message);
      const productList = products || [];
      const ids = productList.map(p => p.id);

      const [viewsRes, ordersRes, verRes] = await Promise.allSettled([
        ids.length
          ? supabase.from('product_views').select('product_id,viewed_at,source').in('product_id', ids).gte('viewed_at', since).limit(20000)
          : Promise.resolve({ data: [] }),
        supabase.from('orders').select('id,product_id,product_name,product_image,quantity,total_price,status,created_at').eq('seller_id', userId).gte('created_at', since).order('created_at', { ascending: false }),
        supabase.from('seller_verifications').select('status').eq('seller_id', userId).maybeSingle(),
      ]);

      if (cancelled) return;
      const views = viewsRes.status === 'fulfilled' && !viewsRes.value.error ? viewsRes.value.data || [] : [];
      // null = orders could not be read (e.g. row-level security), shown as "—"
      const orders = ordersRes.status === 'fulfilled' && !ordersRes.value.error ? ordersRes.value.data || [] : null;
      const verification = verRes.status === 'fulfilled' && verRes.value.data?.status ? verRes.value.data.status : 'none';
      setRaw({ loading: false, products: productList, views, orders, verification, fetchedAt: Date.now() });
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return useMemo(() => {
    const { products, views, orders } = raw;
    const now = raw.fetchedAt;
    const curStart = now - rangeDays * DAY;
    const prevStart = now - 2 * rangeDays * DAY;

    const inRange = (t, a, b) => t >= a && t < b;
    const viewTimes = views.map(v => ({ ...v, t: new Date(v.viewed_at).getTime() }));
    const paidOrders = (orders || [])
      .filter(o => REVENUE_STATUSES.has(String(o.status || '').toLowerCase()))
      .map(o => ({ ...o, t: new Date(o.created_at).getTime() }));

    const curViews = viewTimes.filter(v => inRange(v.t, curStart, now + 1));
    const prevViews = viewTimes.filter(v => inRange(v.t, prevStart, curStart));
    const curOrders = paidOrders.filter(o => inRange(o.t, curStart, now + 1));
    const prevOrders = paidOrders.filter(o => inRange(o.t, prevStart, curStart));
    const sum = (arr) => arr.reduce((a, o) => a + (Number(o.total_price) || 0), 0);

    const revenue = sum(curOrders);
    const prevRevenue = sum(prevOrders);
    const conversion = curViews.length ? (curOrders.length / curViews.length) * 100 : 0;
    const prevConversion = prevViews.length ? (prevOrders.length / prevViews.length) * 100 : 0;

    // Daily series for the chart
    const firstDay = startOfDay(now) - (rangeDays - 1) * DAY;
    const daily = Array.from({ length: rangeDays }, (_, i) => ({ date: firstDay + i * DAY, views: 0, orders: 0 }));
    curViews.forEach(v => { const i = Math.floor((startOfDay(v.t) - firstDay) / DAY); if (daily[i]) daily[i].views += 1; });
    curOrders.forEach(o => { const i = Math.floor((startOfDay(o.t) - firstDay) / DAY); if (daily[i]) daily[i].orders += 1; });

    // 10-bucket sparklines
    const spark = (items, valueOf) => {
      const buckets = Array(10).fill(0);
      const span = (now - curStart) / 10;
      items.forEach(x => { const i = Math.min(9, Math.floor((x.t - curStart) / span)); if (i >= 0) buckets[i] += valueOf(x); });
      return buckets;
    };

    const sourceCounts = { visual: 0, direct: 0, referral: 0 };
    curViews.forEach(v => { sourceCounts[sourceBucket(v.source)] += 1; });
    const sources = Object.entries(sourceCounts)
      .map(([key, count]) => ({ key, label: SOURCE_LABELS[key], count, share: curViews.length ? count / curViews.length : 0 }))
      .sort((a, b) => b.count - a.count);

    const perProduct = new Map(products.map(p => [p.id, { views: 0, orders: 0, revenue: 0 }]));
    curViews.forEach(v => { const s = perProduct.get(v.product_id); if (s) s.views += 1; });
    curOrders.forEach(o => { const s = perProduct.get(o.product_id); if (s) { s.orders += Number(o.quantity) || 1; s.revenue += Number(o.total_price) || 0; } });
    const topListings = products
      .map(p => ({ ...p, ...perProduct.get(p.id) }))
      .sort((a, b) => b.views - a.views || b.orders - a.orders)
      .slice(0, 5);

    const awaitingDelivery = (orders || []).filter(o => String(o.status || '').toLowerCase() === 'paid').slice(0, 3);
    const soldOut = products
      .filter(p => p.quantity != null && Number(p.quantity) === 0)
      .map(p => ({ ...p, views: perProduct.get(p.id)?.views || 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 2);

    const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

    return {
      loading: raw.loading,
      verification: raw.verification,
      productCount: products.length,
      ordersAvailable: orders !== null,
      kpis: {
        revenue: { value: revenue, change: pct(revenue, prevRevenue), spark: spark(curOrders, o => Number(o.total_price) || 0) },
        orders: { value: curOrders.length, change: curOrders.length - prevOrders.length, spark: spark(curOrders, () => 1) },
        views: { value: curViews.length, change: pct(curViews.length, prevViews.length), spark: spark(curViews, () => 1) },
        conversion: { value: conversion, change: prevViews.length ? conversion - prevConversion : null, spark: [] },
      },
      daily,
      sources,
      totalViews: curViews.length,
      topListings,
      awaitingDelivery,
      soldOut,
    };
  }, [raw, rangeDays]);
}
