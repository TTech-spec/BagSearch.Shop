$content = Get-Content src/vendorDetails.jsx -Raw
# Replace lines 138-144 with a simple query
$content = $content -replace '(?s)const isSlugRoute = .+?\.maybeSingle\(\);', "const { data: p, error: pErr } = await supabase`n          .from('users')`n          .select('user_id,full_name,brand_name,brand_story,bag_categories,avatar_url,phone,email')`n          .eq('user_id', id || slug)`n          .maybeSingle();"
Set-Content src/vendorDetails.jsx -Value $content -NoNewline
Write-Host "Done"
