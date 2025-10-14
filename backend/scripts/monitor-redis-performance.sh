#!/bin/bash
# Redis Performance Monitor
# Task: Q1 - Redis Performance Monitoring Script
# Purpose: Create real-time monitoring script for Redis cache effectiveness

# Output file for JSON results
OUTPUT_FILE="/tmp/redis-performance-$(date +%s).json"
echo "[" > "$OUTPUT_FILE"

# Metrics variables
declare -a samples
sample_count=0
max_samples=12  # Run 12 samples (60 seconds / 5 seconds = 12)

# Function to get current timestamp in ISO format
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Function to collect metrics and output JSON
collect_metrics() {
    timestamp=$(get_timestamp)
    
    # Get cache stats
    stats_output=$(redis-cli INFO stats 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "Error: Unable to connect to Redis" >&2
        exit 1
    fi
    
    keyspace_hits=$(echo "$stats_output" | grep -E '^keyspace_hits:' | cut -d':' -f2)
    keyspace_misses=$(echo "$stats_output" | grep -E '^keyspace_misses:' | cut -d':' -f2)
    
    # Calculate cache hit rate
    if [ -z "$keyspace_hits" ] || [ -z "$keyspace_misses" ]; then
        hit_rate=0
        miss_rate=0
    else
        total_requests=$((keyspace_hits + keyspace_misses))
        if [ $total_requests -eq 0 ]; then
            hit_rate=0
            miss_rate=0
        else
            hit_rate=$(echo "scale=2; ($keyspace_hits / $total_requests) * 100" | bc -l)
            miss_rate=$(echo "scale=2; ($keyspace_misses / $total_requests) * 100" | bc -l)
        fi
    fi
    
    # Get DB size
    db_size=$(redis-cli DBSIZE 2>/dev/null)
    
    # Get memory usage for different key patterns
    events_memory=$(redis-cli MEMORY USAGE "events:*" 2>/dev/null || echo "0")
    venues_memory=$(redis-cli MEMORY USAGE "venues:*" 2>/dev/null || echo "0")
    articles_memory=$(redis-cli MEMORY USAGE "articles:*" 2>/dev/null || echo "0")
    
    # Get total memory usage
    memory_info=$(redis-cli INFO memory 2>/dev/null)
    used_memory=$(echo "$memory_info" | grep -E '^used_memory:' | cut -d':' -f2 | tr -d '\r')
    
    # Count keys by pattern
    events_keys=$(redis-cli --scan --pattern "events:*" | wc -l 2>/dev/null)
    venues_keys=$(redis-cli --scan --pattern "venues:*" | wc -l 2>/dev/null)
    articles_keys=$(redis-cli --scan --pattern "articles:*" | wc -l 2>/dev/null)
    
    # Create JSON object for this sample
    sample_json="{\"timestamp\":\"$timestamp\",\"keyspace_hits\":$keyspace_hits,\"keyspace_misses\":$keyspace_misses,\"total_requests\":$total_requests,\"cache_hit_rate\":$hit_rate,\"cache_miss_rate\":$miss_rate,\"db_size\":$db_size,\"used_memory_bytes\":$used_memory,\"events_memory_bytes\":$events_memory,\"venues_memory_bytes\":$venues_memory,\"articles_memory_bytes\":$articles_memory,\"events_keys\":$events_keys,\"venues_keys\":$venues_keys,\"articles_keys\":$articles_keys}"
    
    # Add comma if not the first sample
    if [ $sample_count -gt 0 ]; then
        echo "," >> "$OUTPUT_FILE"
    fi
    
    echo -n "$sample_json" >> "$OUTPUT_FILE"
    ((sample_count++))
}

# Main monitoring loop
for i in $(seq 1 $max_samples); do
    collect_metrics
    sleep 5
done

# Close JSON array
echo "]" >> "$OUTPUT_FILE"

# Output summary
echo "Redis performance monitoring complete. Results saved to $OUTPUT_FILE"
echo "Sample count: $sample_count"

# Calculate summary metrics
if [ $sample_count -gt 0 ]; then
    # Extract and calculate average hit rate
    avg_hit_rate=$(jq -s 'map(.cache_hit_rate) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    avg_miss_rate=$(jq -s 'map(.cache_miss_rate) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    avg_db_size=$(jq -s 'map(.db_size) | add / length' "$OUTPUT_FILE" 2>/dev/null)
    
    echo ""
    echo "=== SUMMARY ==="
    echo "Average Cache Hit Rate: $(printf "%.2f" $avg_hit_rate)%"
    echo "Average Cache Miss Rate: $(printf "%.2f" $avg_miss_rate)%"
    echo "Average DB Size: $(printf "%.0f" $avg_db_size) keys"
    echo "Used Memory: $(jq -s 'map(.used_memory_bytes) | max' "$OUTPUT_FILE" 2>/dev/null) bytes"
    echo "Total Events Keys: $(jq -s 'map(.events_keys) | max' "$OUTPUT_FILE" 2>/dev/null)"
    echo "Total Venues Keys: $(jq -s 'map(.venues_keys) | max' "$OUTPUT_FILE" 2>/dev/null)"
    echo "Total Articles Keys: $(jq -s 'map(.articles_keys) | max' "$OUTPUT_FILE" 2>/dev/null)"
fi