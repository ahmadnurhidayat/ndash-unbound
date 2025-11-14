#!/bin/bash

echo "Testing NDash Settings Toggle Functionality"
echo "==========================================="
echo ""

# Check current settings
echo "1. Current Settings:"
cat /opt/ndash/data/settings.json | grep -A 5 '"zones"'
echo ""

# Test 1: Update settings via POST (disable all)
echo "2. Testing: Disable all settings..."
curl -X POST http://localhost:3000/settings \
  -d "" \
  -L -s -o /dev/null

sleep 1
echo "   Result:"
cat /opt/ndash/data/settings.json | grep -A 5 '"zones"'
echo ""

# Test 2: Enable only autoReload and backupEnabled
echo "3. Testing: Enable autoReload and backupEnabled only..."
curl -X POST http://localhost:3000/settings \
  -d "autoReload=on&backupEnabled=on" \
  -L -s -o /dev/null

sleep 1
echo "   Result:"
cat /opt/ndash/data/settings.json | grep -A 5 '"zones"'
echo ""

# Test 3: Enable all settings
echo "4. Testing: Enable all settings..."
curl -X POST http://localhost:3000/settings \
  -d "autoReload=on&validateBeforeReload=on&backupEnabled=on&autoGeneratePTR=on" \
  -L -s -o /dev/null

sleep 1
echo "   Result:"
cat /opt/ndash/data/settings.json | grep -A 5 '"zones"'
echo ""

# Test 4: Check settings page HTML shows correct state
echo "5. Checking HTML page reflects settings..."
curl -s http://localhost:3000/settings | grep -o 'checked' | wc -l
echo "   Number of checked toggles (should be 4)"
echo ""

echo "==========================================="
echo "Test Complete!"
echo ""
echo "Now open http://localhost:3000/settings in browser"
echo "and verify toggle switches show correct ON/OFF state"
