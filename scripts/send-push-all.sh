#!/usr/bin/env bash
# Send a phone notification to everyone who turned on BagSearch notifications.
#
#   SUPABASE_URL=https://<project>.supabase.co \
#   PUSH_TRIGGER_SECRET=<same value as the function's secret> \
#   scripts/send-push-all.sh "New bags just landed" "See this week's new arrivals" "/products"
#
# Only phones that allowed notifications receive it (see HomeReminder on the home page).
set -euo pipefail
: "${SUPABASE_URL:?set SUPABASE_URL}"
: "${PUSH_TRIGGER_SECRET:?set PUSH_TRIGGER_SECRET}"
TITLE="${1:?title}"; BODY="${2:?body}"; URL="${3:-/}"

body=$(node -e 'console.log(JSON.stringify({audience:"all",title:process.argv[1],body:process.argv[2],url:process.argv[3],tag:"bagsearch-broadcast"}))' "$TITLE" "$BODY" "$URL")
curl -sS -X POST "$SUPABASE_URL/functions/v1/send-push-notification" \
  -H "Authorization: Bearer $PUSH_TRIGGER_SECRET" \
  -H "Content-Type: application/json" \
  --data "$body"
echo
