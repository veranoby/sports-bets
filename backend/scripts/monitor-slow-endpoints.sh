#!/bin/bash
# Monitor Slow Endpoints Performance
# Phase 4: Track performance of critical slow endpoints
# Monitors: membership-requests, user profile, wallet, etc.

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3001}"
AUTH_TOKEN="${TEST_AUTH_TOKEN:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MzQwMDAwMDB9.test_token}"
OUTPUT_FILE="/tmp/slow-endpoints-monitor-$(date +%s).json"

# Function to make API request and return response time
get_response_time() {
    local endpoint=$1
    local auth_header=$2
    local method=${3:-"GET"}
    
    if [ "$auth_header" = "true" ]; then
        response_time=$(curl -w "%{time_total}" -o /dev/null -s -X $method \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response_time=$(curl -w "%{time_total}" -o /dev/null -s -X $method \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    # Check if response_time is empty (request failed)
    if [ -z "$response_time" ] || [ "$response_time" = "0.000" ]; then
        echo "0" # Return 0 if request failed
    else
        echo "$response_time"
    fi
}

echo "Starting slow endpoints monitoring..."
echo "Base URL: $BASE_URL"
echo "Output file: $OUTPUT_FILE"
echo "Duration: 5 minutes (10 samples x 30s intervals)"
echo ""

# Initialize output file with JSON array
echo "[" > "$OUTPUT_FILE"

# Track sample count for JSON formatting
sample_count=0
total_samples=10

# Main monitoring loop
for i in $(seq 1 $total_samples); do
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Test slow endpoints
    membership_time=$(get_response_time "/api/membership-requests/pending" "true")
    profile_time=$(get_response_time "/api/users/profile" "true")
    wallet_time=$(get_response_time "/api/wallet" "true")
    check_membership_time=$(get_response_time "/api/auth/check-membership-status" "true")
    galleras_time=$(get_response_time "/api/galleras" "false")
    
    # Create JSON sample
    sample_json="{\"timestamp\":\"$timestamp\",\"membership_requests\":\"$membership_time\",\"profile\":\"$profile_time\",\"wallet\":\"$wallet_time\",\"check_membership\":\"$check_membership_time\",\"galleras\":\"$galleras_time\"}"
    
    # Add comma if not the first sample
    if [ $sample_count -gt 0 ]; then
        echo "," >> "$OUTPUT_FILE"
    fi
    echo -n "$sample_json" >> "$OUTPUT_FILE"
    
    # Display current sample
    echo "Sample $i at $timestamp:"
    echo "  membership_requests: ${membership_time}s"
    echo "  profile: ${profile_time}s"
    echo "  wallet: ${wallet_time}s"
    echo "  check_membership: ${check_membership_time}s"
    echo "  galleras: ${galleras_time}s"
    echo ""
    
    # Increment counter
    ((sample_count++))
    
    # Wait before next sample (except for last iteration)
    if [ $i -lt $total_samples ]; then
        sleep 30
    fi
done

# Close JSON array
echo "]" >> "$OUTPUT_FILE"

echo "Monitoring complete. Results saved to $OUTPUT_FILE"
echo ""

# Calculate summary statistics
echo "=== SUMMARY STATISTICS ==="

# Calculate averages using jq if available, otherwise basic calculation
if command -v jq &> /dev/null; then
    echo "Using jq for detailed statistics..."
    
    # Calculate averages
    avg_membership=$(jq -s 'map(.membership_requests | tonumber) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    avg_profile=$(jq -s 'map(.profile | tonumber) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    avg_wallet=$(jq -s 'map(.wallet | tonumber) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    avg_check_membership=$(jq -s 'map(.check_membership | tonumber) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    avg_galleras=$(jq -s 'map(.galleras | tonumber) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    
    echo "Average Response Times:"
    echo "  membership_requests: $(printf "%.3f" $avg_membership)s"
    echo "  profile: $(printf "%.3f" $avg_profile)s"
    echo "  wallet: $(printf "%.3f" $avg_wallet)s"
    echo "  check_membership: $(printf "%.3f" $avg_check_membership)s"
    echo "  galleras: $(printf "%.3f" $avg_galleras)s"
    
    # Calculate max values
    max_membership=$(jq -s 'map(.membership_requests | tonumber) | max' "$OUTPUT_FILE" 2>/dev/null)
    max_profile=$(jq -s 'map(.profile | tonumber) | max' "$OUTPUT_FILE" 2>/dev/null)
    max_wallet=$(jq -s 'map(.wallet | tonumber) | max' "$OUTPUT_FILE" 2>/dev/null)
    max_check_membership=$(jq -s 'map(.check_membership | tonumber) | max' "$OUTPUT_FILE" 2>/dev/null)
    max_galleras=$(jq -s 'map(.galleras | tonumber) | max' "$OUTPUT_FILE" 2>/dev/null)
    
    echo ""
    echo "Maximum Response Times:"
    echo "  membership_requests: $(printf "%.3f" $max_membership)s"
    echo "  profile: $(printf "%.3f" $max_profile)s"
    echo "  wallet: $(printf "%.3f" $max_wallet)s"
    echo "  check_membership: $(printf "%.3f" $max_check_membership)s"
    echo "  galleras: $(printf "%.3f" $max_galleras)s"
else
    echo "jq not available, showing basic result file info:"
    echo "Results saved in JSON format to $OUTPUT_FILE"
    echo "Run: cat $OUTPUT_FILE | grep -E '\"membership_requests|profile|wallet|galleras\"' to see values"
fi

echo ""
echo "To view complete results: cat $OUTPUT_FILE"
echo "To get formatted results: jq '.' $OUTPUT_FILE"
echo ""
echo "=== MONITORING COMPLETE ==="