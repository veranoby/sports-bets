#!/bin/bash
# Cache Performance Comparison
# Task: Q2 - Cache vs No-Cache Performance Comparison
# Purpose: Script that compares response times with and without Redis cache

# Base URL for the API - using the configuration from brain/api_endpoints_reference.json
BASE_URL="${API_BASE_URL:-http://localhost:3001}"
AUTH_TOKEN="${TEST_AUTH_TOKEN:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MzQwMDAwMDB9.test_token}"

# Output file for JSON results
OUTPUT_FILE="/tmp/cache-comparison-$(date +%s).json"

echo "Galleros.Net Cache Performance Comparison Tool"
echo "==========================================="

# Function to make API request and return response time
get_response_time() {
    local endpoint=$1
    local auth_header=$2
    local response_time
    
    if [ "$auth_header" = "true" ]; then
        response_time=$(curl -w "%{time_total}" -o /dev/null -s -X GET \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response_time=$(curl -w "%{time_total}" -o /dev/null -s -X GET \
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

# Function to run test scenario
run_test_scenario() {
    local endpoint=$1
    local description=$2
    local auth_required=$3
    local scenario=$4
    
    echo "Testing: $description ($scenario scenario)"
    echo "Endpoint: $endpoint"
    
    # Get response time
    local response_time
    response_time=$(get_response_time "$endpoint" "$auth_required")
    
    if [ "$response_time" = "0" ]; then
        echo "❌ Request failed"
        echo ""
        return 1
    fi
    
    echo "Response time: ${response_time}s"
    echo ""
    
    # Return response time for analysis
    echo "$response_time"
}

# Initialize results array
echo "{" > "$OUTPUT_FILE"
echo "  \"test_run_timestamp\": \"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\"," >> "$OUTPUT_FILE"
echo "  \"base_url\": \"$BASE_URL\"," >> "$OUTPUT_FILE"
echo "  \"tests\": [" >> "$OUTPUT_FILE"

# Test endpoints based on brain/api_endpoints_reference.json
test_results=()
declare -a endpoints
endpoints=(
    "/api/events?limit=10&offset=0"
    "/api/venues?limit=10&offset=0"
    "/api/galleras?limit=10&offset=0"
    "/api/articles?limit=10&offset=0"
)

# Track if this is the first result for JSON formatting
is_first=true

for endpoint in "${endpoints[@]}"; do
    # Extract entity name from endpoint for description
    entity=$(echo "$endpoint" | cut -d'/' -f3 | sed 's/s$//')
    if [ "$entity" = "gallera" ]; then
        entity="gallera"
    elif [ "$entity" = "article" ]; then
        entity="article"
    elif [ "$entity" = "event" ]; then
        entity="event"
    elif [ "$entity" = "venue" ]; then
        entity="venue"
    fi
    
    # Determine if auth is required (for events, venues, galleras, articles)
    auth_required="false"
    if [[ "$endpoint" == *"/events"* ]]; then
        auth_required="false"  # events endpoint uses optionalAuth
    elif [[ "$endpoint" == *"/venues"* ]]; then
        auth_required="false"  # venues endpoint uses optionalAuth
    elif [[ "$endpoint" == *"/galleras"* ]]; then
        auth_required="false"  # galleras endpoint uses optionalAuth
    elif [[ "$endpoint" == *"/articles"* ]]; then
        auth_required="false"  # articles endpoint uses optionalAuth
    fi
    
    echo "Testing $entity endpoint: $endpoint"
    echo "----------------------------------------"
    
    # Test cold cache scenario (first request - cache miss)
    cold_time=$(run_test_scenario "$endpoint" "GET $endpoint" "$auth_required" "cold-cache")
    
    # Test warm cache scenario (second request - cache hit) 
    sleep 1  # Brief pause before second request
    warm_time=$(run_test_scenario "$endpoint" "GET $endpoint" "$auth_required" "warm-cache")
    
    # Test third request to further validate cache effectiveness
    sleep 1
    third_time=$(run_test_scenario "$endpoint" "GET $endpoint" "$auth_required" "warm-cache-2")
    
    # Calculate metrics if both requests succeeded
    if [ "$cold_time" != "0" ] && [ "$warm_time" != "0" ]; then
        # Calculate improvement
        if [ "$(echo "$cold_time > 0" | bc -l)" = "1" ]; then
            improvement=$(echo "scale=2; (($cold_time - $warm_time) / $cold_time) * 100" | bc -l)
        else
            improvement="0"
        fi
        
        # Calculate average warm time
        avg_warm_time=$(echo "scale=4; ($warm_time + $third_time) / 2" | bc -l)
        
        # Calculate warm/cold ratio
        if [ "$(echo "$cold_time > 0" | bc -l)" = "1" ]; then
            ratio=$(echo "scale=2; $avg_warm_time / $cold_time" | bc -l)
        else
            ratio="0"
        fi
        
        echo "Performance Analysis:"
        echo "  Cold Cache: ${cold_time}s"
        echo "  Warm Cache (1st repeat): ${warm_time}s" 
        echo "  Warm Cache (2nd repeat): ${third_time}s"
        echo "  Avg. Warm Cache: ${avg_warm_time}s"
        echo "  Improvement: $(printf "%.2f" $improvement)%"
        echo "  Warm/Cold Ratio: $(printf "%.2f" $ratio)"
        echo ""
        
        # Add to results array
        test_result="{\"endpoint\":\"$endpoint\",\"entity\":\"$entity\",\"cold_cache_time\":$cold_time,\"warm_cache_time\":$avg_warm_time,\"improvement_percent\":$(printf "%.2f" $improvement),\"warm_to_cold_ratio\":$(printf "%.2f" $ratio),\"cache_effective\":$(if [ "$(echo "$improvement > 10" | bc -l)" = "1" ]; then echo "true"; else echo "false"; fi)}"
        
        if [ "$is_first" = "true" ]; then
            echo "    $test_result" >> "$OUTPUT_FILE"
            is_first=false
        else
            echo "    ,$test_result" >> "$OUTPUT_FILE"
        fi
    else
        echo "❌ One or more requests failed, skipping performance analysis"
        echo ""
    fi
done

# Close the tests array
echo "" >> "$OUTPUT_FILE"
echo "  ]," >> "$OUTPUT_FILE"

# Calculate overall metrics
echo "  \"overall_metrics\": {" >> "$OUTPUT_FILE"
echo "    \"total_tests_run\": ${#endpoints[@]}" >> "$OUTPUT_FILE"
echo "  }" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

# Summary output
echo "==========================================="
echo "Cache Performance Comparison Complete"
echo "Results saved to: $OUTPUT_FILE"
echo ""
echo "To view results: cat $OUTPUT_FILE"
echo "To view formatted results: jq '.' $OUTPUT_FILE"
echo ""

# Provide a summary of cache effectiveness
echo "Summary of Cache Effectiveness:"
echo "$(cat $OUTPUT_FILE | jq -r '.tests[] | \"\\(.endpoint): \\(.improvement_percent // 0)% improvement\"' 2>/dev/null || echo "No valid results to summarize")"