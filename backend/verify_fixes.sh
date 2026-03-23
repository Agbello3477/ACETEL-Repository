#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:5001/api"
EMAIL="admin@acetel.edu"
PASSWORD="adminpassword123"

echo "1. Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract Token (using simple sed/grep to avoid heavy jq dependency if invalid json)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login Failed. Response:"
  echo $LOGIN_RESPONSE
  exit 1
fi
echo "Login Success! Token obtained."

echo "----------------------------------------"
echo "2. Testing Export CSV..."
EXPORT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/theses/export?programme=&status=&year=" \
  -H "Authorization: Bearer $TOKEN")

if [ "$EXPORT_STATUS" -eq 200 ]; then
  echo "✅ Export CSV Test PASSED (Status: 200)"
else
  echo "❌ Export CSV Test FAILED (Status: $EXPORT_STATUS)"
  # Try to print body to see error
  curl -s -X GET "$API_URL/theses/export?programme=&status=&year=" -H "Authorization: Bearer $TOKEN"
fi

echo "----------------------------------------"
echo "3. Testing Register Centre Admin (Null Programme Fix)..."
TEST_EMAIL="testadmin_$(date +%s)@noun.edu.ng"
REGISTER_DATA="{\"name\": \"Test Admin\", \"email\": \"$TEST_EMAIL\", \"password\": \"password123\", \"role\": \"centre_admin\", \"matric_no\": \"\", \"programme\": \"\", \"degree_type\": \"MSc\", \"staff_id\": \"12345\"}"

REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$REGISTER_RESPONSE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" -eq 201 ]; then
  echo "✅ Register Test PASSED (Status: 201)"
  echo "Created User: $TEST_EMAIL"
else
  echo "❌ Register Test FAILED (Status: $HTTP_STATUS)"
  echo "Response: $BODY"
fi

echo "----------------------------------------"
