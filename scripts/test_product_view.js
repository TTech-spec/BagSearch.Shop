// Test script to verify product view tracking
// Paste this in your browser console when viewing a product page

// Test 1: Check if user is logged in
console.log('=== USER CHECK ===');
console.log('User:', window.user || 'No user object found');
console.log('Supabase auth user:', await (async () => {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (e) {
    return 'Error: ' + e.message;
  }
})());

// Test 2: Check current product
console.log('\n=== PRODUCT CHECK ===');
const productId = window.location.pathname.split('/').pop();
console.log('Product ID from URL:', productId);

// Test 3: Manual product view insertion
console.log('\n=== MANUAL INSERT TEST ===');
try {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('product_views').insert({
    product_id: productId,
    buyer_id: userData.user?.id || null,
    buyer_name: userData.user?.user_metadata?.full_name || userData.user?.email || 'Console Test',
    buyer_email: userData.user?.email || null,
    source: 'console_test',
  }).select();
  
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert successful:', data);
  }
} catch (e) {
  console.error('Insert failed:', e);
}

// Test 4: Check if view was recorded
console.log('\n=== VERIFICATION ===');
setTimeout(async () => {
  try {
    const { data, error } = await supabase
      .from('product_views')
      .select('*')
      .eq('product_id', productId)
      .eq('source', 'console_test')
      .order('viewed_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Verification error:', error);
    } else {
      console.log('Recent view found:', data);
    }
  } catch (e) {
    console.error('Verification failed:', e);
  }
}, 1000);

console.log('\n=== TEST COMPLETE ===');
console.log('Check the results above. If manual insert works but automatic doesn\'t, the issue is in the frontend code.');
