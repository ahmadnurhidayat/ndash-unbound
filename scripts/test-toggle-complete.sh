#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  Testing Toggle Switch Functionality"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 1: All ON
echo "📝 Test 1: Enable ALL settings"
curl -X POST http://localhost:3000/settings \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "autoReload=on&validateBeforeReload=on&backupEnabled=on&autoGeneratePTR=on" \
  -s -o /dev/null

sleep 1
echo "Settings File:"
cat /opt/ndash/data/settings.json | jq '.zones'
echo ""

# Check HTML rendering
echo "HTML Checkboxes (should all be checked):"
curl -s http://localhost:3000/settings | grep -E 'name="(autoReload|validateBeforeReload|backupEnabled|autoGeneratePTR)"' | sed 's/^[[:space:]]*//'
echo ""
echo "---"
echo ""

# Test 2: Mixed ON/OFF
echo "📝 Test 2: Mixed settings (autoReload=ON, backupEnabled=ON, others=OFF)"
curl -X POST http://localhost:3000/settings \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "autoReload=on&backupEnabled=on" \
  -s -o /dev/null

sleep 1
echo "Settings File:"
cat /opt/ndash/data/settings.json | jq '.zones'
echo ""

# Check HTML rendering
echo "HTML Checkboxes (autoReload & backupEnabled should be checked):"
curl -s http://localhost:3000/settings | grep -E 'name="(autoReload|validateBeforeReload|backupEnabled|autoGeneratePTR)"' | sed 's/^[[:space:]]*//'
echo ""
echo "---"
echo ""

# Test 3: All OFF
echo "📝 Test 3: Disable ALL settings"
curl -X POST http://localhost:3000/settings \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "" \
  -s -o /dev/null

sleep 1
echo "Settings File:"
cat /opt/ndash/data/settings.json | jq '.zones'
echo ""

# Check HTML rendering
echo "HTML Checkboxes (none should be checked):"
curl -s http://localhost:3000/settings | grep -E 'name="(autoReload|validateBeforeReload|backupEnabled|autoGeneratePTR)"' | sed 's/^[[:space:]]*//'
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Backend Testing Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Now test in browser:"
echo "   1. Open: http://localhost:3000/settings"
echo "   2. Click toggle switches - they should animate blue ↔ gray"
echo "   3. Click 'Save Settings'"
echo "   4. Refresh page - toggle state should persist"
echo ""
echo "🐛 If toggles don't animate:"
echo "   - Open browser DevTools (F12)"
echo "   - Check Console for errors"
echo "   - Verify Tailwind CSS v3 loaded (Network tab)"
echo ""
