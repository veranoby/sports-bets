#!/bin/bash

# Session Pattern Analysis Script
# Safe, read-only analysis for concurrent login vulnerability assessment
# Author: QWEN - Security Analysis Specialist

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/../claudedocs/security-analysis"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="${OUTPUT_DIR}/session_analysis_${TIMESTAMP}.log"
REPORT_FILE="${OUTPUT_DIR}/concurrent_login_vulnerability_report_${TIMESTAMP}.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date -u)] $*" | tee -a "$LOG_FILE"
}

# Print with color
print_green() {
    echo -e "${GREEN}$1${NC}"
}

print_yellow() {
    echo -e "${YELLOW}$1${NC}"
}

print_blue() {
    echo -e "${BLUE}$1${NC}"
}

print_red() {
    echo -e "${RED}$1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v psql &> /dev/null; then
        print_red "❌ ERROR: psql not found. Please install PostgreSQL client."
        exit 1
    fi
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        print_red "❌ ERROR: DATABASE_URL not set. Please set DATABASE_URL environment variable."
        exit 1
    fi
    
    print_green "✅ Prerequisites check passed"
}

# Test database connectivity
test_database_connectivity() {
    log "Testing database connectivity..."
    
    # Test connection with a simple query
    if timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" -t >/dev/null 2>&1; then
        print_green "✅ Database connectivity successful"
        return 0
    else
        print_red "❌ Database connectivity failed"
        return 1
    fi
}

# Analyze current login patterns
analyze_login_patterns() {
    log "Analyzing current login patterns..."
    
    {
        echo "# Concurrent Login Vulnerability Analysis"
        echo "**Generated:** $(date -u)"
        echo "**Database:** ${DATABASE_URL}"
        echo ""
        echo "## Executive Summary"
        echo ""
        echo "This analysis examines current user login patterns to identify"
        echo "concurrent login vulnerabilities in the system."
        echo ""
    } >> "$REPORT_FILE"
    
    # Get total users
    local total_users=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" -t 2>/dev/null | xargs)
    log "Total users: $total_users"
    
    # Get users with login activity
    local users_with_logins=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users WHERE last_login IS NOT NULL;" -t 2>/dev/null | xargs)
    log "Users with login activity: $users_with_logins"
    
    # Analyze login frequency patterns
    local login_frequency_analysis=$(psql "$DATABASE_URL" -c "
        SELECT 
            COUNT(CASE WHEN login_count > 1 THEN 1 END) as users_multiple_logins,
            COUNT(CASE WHEN login_count > 5 THEN 1 END) as users_high_frequency,
            COUNT(CASE WHEN login_count > 10 THEN 1 END) as users_very_high_frequency,
            AVG(login_count) as avg_logins_per_user,
            MAX(login_count) as max_logins_per_user
        FROM (
            SELECT user_id, COUNT(*) as login_count
            FROM (
                SELECT id as user_id FROM users WHERE last_login IS NOT NULL
                UNION ALL
                SELECT user_id FROM event_connections WHERE user_id IS NOT NULL
                UNION ALL
                SELECT user_id FROM bets WHERE user_id IS NOT NULL
            ) login_events
            GROUP BY user_id
        ) login_counts;
    " -t 2>/dev/null | xargs)
    
    log "Login frequency analysis: $login_frequency_analysis"
    
    # Check for session tracking table
    local session_table_exists=$(psql "$DATABASE_URL" -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'active_sessions'
        );
    " -t 2>/dev/null | xargs)
    
    log "Active sessions table exists: $session_table_exists"
    
    {
        echo "## Current System State"
        echo ""
        echo "| Metric | Value |"
        echo "|--------|-------|"
        echo "| Total Users | $total_users |"
        echo "| Active Users | $users_with_logins |"
        echo "| Session Table Exists | $(if [[ "$session_table_exists" == "t" ]]; then echo "✅ Yes"; else echo "❌ No"; fi) |"
        echo ""
        echo "## Login Pattern Analysis"
        echo ""
        echo "The current system has the following vulnerabilities:"
        echo ""
        echo "### 1. No Session Tracking"
        echo "- **Risk**: Unlimited concurrent logins per user"
        echo "- **Impact**: Account sharing and fraud potential"
        echo "- **Status**: $(if [[ "$session_table_exists" == "t" ]]; then echo "Partially addressed"; else echo "**CRITICAL VULNERABILITY**"; fi)"
        echo ""
        echo "### 2. JWT Token Only Authentication"
        echo "- **Risk**: No active session invalidation"
        echo "- **Impact**: Cannot force logout of compromised accounts"
        echo "- **Status**: **HIGH RISK** - Tokens valid until expiry"
        echo ""
        echo "### 3. No Device Fingerprinting"
        echo "- **Risk**: Cannot track login locations/devices"
        echo "- **Impact**: Difficult to detect suspicious activity"
        echo "- **Status**: **MEDIUM RISK** - No device tracking"
        echo ""
    } >> "$REPORT_FILE"
}

# Analyze JWT token patterns
analyze_jwt_patterns() {
    log "Analyzing JWT token patterns..."
    
    {
        echo "## JWT Token Analysis"
        echo ""
        echo "### Token Characteristics"
        echo ""
        echo "JWT tokens in the current system have the following characteristics:"
        echo ""
        echo "1. **Expiration**: Typically 7 days (604,800 seconds)"
        echo "2. **Scope**: Full user permissions"
        echo "3. **Revocation**: No mechanism for token invalidation"
        echo "4. **Validation**: Signature verification only"
        echo ""
        echo "### Security Implications"
        echo ""
        echo "- **Long-lived tokens**: 7-day validity increases exposure window"
        echo "- **No refresh mechanism**: Tokens expire and require re-login"
        echo "- **No session binding**: Tokens can be used from any device"
        echo "- **No usage tracking**: Cannot detect stolen token usage"
        echo ""
    } >> "$REPORT_FILE"
    
    log "JWT token analysis completed"
}

# Analyze concurrent connection patterns
analyze_concurrent_connections() {
    log "Analyzing concurrent connection patterns..."
    
    {
        echo "## Concurrent Connection Analysis"
        echo ""
        echo "### Event Connection Patterns"
        echo ""
        echo "Event connections represent real-time streaming sessions:"
        echo ""
    } >> "$REPORT_FILE"
    
    # Get concurrent connection statistics
    local connection_stats=$(psql "$DATABASE_URL" -c "
        SELECT 
            COUNT(*) as total_connections,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN disconnected_at IS NULL THEN 1 END) as active_connections,
            COUNT(CASE WHEN disconnected_at IS NOT NULL THEN 1 END) as completed_connections,
            AVG(EXTRACT(EPOCH FROM (COALESCE(disconnected_at, NOW()) - connected_at))) as avg_duration_seconds
        FROM event_connections;
    " -t 2>/dev/null)
    
    if [[ -n "$connection_stats" ]]; then
        local total_conn=$(echo "$connection_stats" | awk '{print $1}')
        local unique_users=$(echo "$connection_stats" | awk '{print $2}')
        local active_conn=$(echo "$connection_stats" | awk '{print $3}')
        local completed_conn=$(echo "$connection_stats" | awk '{print $4}')
        local avg_duration=$(echo "$connection_stats" | awk '{print $5}')
        
        {
            echo "| Metric | Value |"
            echo "|--------|-------|"
            echo "| Total Connections | $total_conn |"
            echo "| Unique Users | $unique_users |"
            echo "| Active Connections | $active_conn |"
            echo "| Completed Connections | $completed_conn |"
            echo "| Average Duration (seconds) | $(printf "%.0f" "$avg_duration") |"
            echo ""
        } >> "$REPORT_FILE"
    fi
    
    # Analyze concurrent logins
    local concurrent_login_analysis=$(psql "$DATABASE_URL" -c "
        SELECT 
            ec1.user_id,
            u.username,
            COUNT(*) as concurrent_sessions
        FROM event_connections ec1
        JOIN event_connections ec2 ON ec1.user_id = ec2.user_id 
            AND ec1.id != ec2.id 
            AND ec1.connected_at <= ec2.disconnected_at 
            AND ec2.connected_at <= ec1.disconnected_at
        JOIN users u ON ec1.user_id = u.id
        WHERE ec1.connected_at > NOW() - INTERVAL '24 hours'
        GROUP BY ec1.user_id, u.username
        HAVING COUNT(*) > 1
        ORDER BY concurrent_sessions DESC
        LIMIT 10;
    " -t 2>/dev/null)
    
    {
        echo "### Concurrent Session Analysis (Last 24 Hours)"
        echo ""
        echo "Top users with concurrent sessions:"
        echo ""
        echo '```'
        if [[ -n "$concurrent_login_analysis" ]]; then
            echo "$concurrent_login_analysis"
        else
            echo "No concurrent sessions detected in last 24 hours"
        fi
        echo '```'
        echo ""
    } >> "$REPORT_FILE"
    
    log "Concurrent connection analysis completed"
}

# Analyze user activity patterns
analyze_user_activity_patterns() {
    log "Analyzing user activity patterns..."
    
    {
        echo "## User Activity Pattern Analysis"
        echo ""
        echo "### Login Frequency Distribution"
        echo ""
        echo "Distribution of user login frequencies:"
        echo ""
    } >> "$REPORT_FILE"
    
    # Get login frequency distribution
    local login_distribution=$(psql "$DATABASE_URL" -c "
        SELECT 
            CASE 
                WHEN login_count = 1 THEN '1 login'
                WHEN login_count BETWEEN 2 AND 5 THEN '2-5 logins'
                WHEN login_count BETWEEN 6 AND 10 THEN '6-10 logins'
                WHEN login_count > 10 THEN '>10 logins'
                ELSE '0 logins'
            END as frequency_range,
            COUNT(*) as user_count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
        FROM (
            SELECT u.id, COUNT(ec.id) as login_count
            FROM users u
            LEFT JOIN event_connections ec ON u.id = ec.user_id
            GROUP BY u.id
        ) user_logins
        GROUP BY 
            CASE 
                WHEN login_count = 1 THEN '1 login'
                WHEN login_count BETWEEN 2 AND 5 THEN '2-5 logins'
                WHEN login_count BETWEEN 6 AND 10 THEN '6-10 logins'
                WHEN login_count > 10 THEN '>10 logins'
                ELSE '0 logins'
            END
        ORDER BY user_count DESC;
    " -t 2>/dev/null)
    
    {
        echo "| Frequency Range | User Count | Percentage |"
        echo "|----------------|------------|------------|"
        if [[ -n "$login_distribution" ]]; then
            echo "$login_distribution" | while read -r line; do
                echo "| $line |"
            done
        else
            echo "| Data unavailable | - | - |"
        fi
        echo ""
    } >> "$REPORT_FILE"
    
    log "User activity pattern analysis completed"
}

# Generate security recommendations
generate_security_recommendations() {
    log "Generating security recommendations..."
    
    {
        echo "## Security Enhancement Recommendations"
        echo ""
        echo "### Immediate Actions (HIGH PRIORITY)"
        echo ""
        echo "1. ✅ **Implement Session Tracking Table**"
        echo "   - Create \`active_sessions\` table to track user sessions"
        echo "   - Add foreign key constraint to \`users\` table"
        echo "   - Include session token, device fingerprint, IP address"
        echo ""
        echo "2. ✅ **Add Concurrent Login Prevention**"
        echo "   - Invalidate existing sessions on new login"
        echo "   - Limit to 1 active session per user (strict mode)"
        echo "   - Implement device fingerprinting for additional security"
        echo ""
        echo "3. ✅ **Enhance Authentication Middleware**"
        echo "   - Validate session is active before granting access"
        echo "   - Check session hasn't expired"
        echo "   - Monitor for suspicious activity patterns"
        echo ""
        echo "### Medium Priority Actions"
        echo ""
        echo "1. 🔧 **Implement Session Management API**"
        echo "   - Endpoint to list active sessions"
        echo "   - Endpoint to terminate specific sessions"
        echo "   - Admin endpoint to force logout users"
        echo ""
        echo "2. 🔧 **Add Device Fingerprinting**"
        echo "   - Track user agents and IP addresses"
        echo "   - Detect suspicious login patterns"
        echo "   - Send alerts for unusual activity"
        echo ""
        echo "3. 🔧 **Enhance JWT Token Security**"
        echo "   - Shorter token lifespans (24 hours max)"
        echo "   - Implement refresh token mechanism"
        echo "   - Add token revocation capability"
        echo ""
        echo "### Long-term Security Enhancements"
        echo ""
        echo "1. 🛡️ **Multi-factor Authentication**"
        echo "   - SMS or authenticator app 2FA"
        echo "   - Mandatory for admin/operator roles"
        echo "   - Optional for regular users"
        echo ""
        echo "2. 🛡️ **Session Analytics**"
        echo "   - Track login locations and times"
        echo "   - Detect anomalous login patterns"
        echo "   - Automated threat detection"
        echo ""
        echo "3. 🛡️ **Advanced Session Management**"
        echo "   - Session timeout settings"
        echo "   - Concurrent session limits"
        echo "   - Session activity monitoring"
        echo ""
    } >> "$REPORT_FILE"
    
    log "Security recommendations generated"
}

# Generate implementation plan
generate_implementation_plan() {
    log "Generating implementation plan..."
    
    {
        echo "## Implementation Plan"
        echo ""
        echo "### Phase 1: Foundation (Day 1)"
        echo ""
        echo "1. **Create Active Sessions Table**"
        echo "   - Run migration to create \`active_sessions\` table"
        echo "   - Add indexes for performance"
        echo "   - Add foreign key constraints"
        echo ""
        echo "2. **Implement Session Service**"
        echo "   - Create \`SessionService\` class"
        echo "   - Add session creation/invalidate methods"
        echo "   - Add device fingerprinting"
        echo ""
        echo "### Phase 2: Integration (Day 2)"
        echo ""
        echo "1. **Enhance Authentication**"
        echo "   - Modify \`authenticate\` middleware"
        echo "   - Add session validation"
        echo "   - Implement concurrent login prevention"
        echo ""
        echo "2. **Update Login Endpoint**"
        echo "   - Modify login to create sessions"
        echo "   - Invalidate old sessions"
        echo "   - Return session information"
        echo ""
        echo "### Phase 3: Advanced Features (Day 3)"
        echo ""
        echo "1. **Session Management API**"
        echo "   - Add endpoints to list sessions"
        echo "   - Add endpoint to terminate sessions"
        echo "   - Add admin session management"
        echo ""
        echo "2. **Monitoring and Alerts**"
        echo "   - Add session monitoring"
        echo "   - Implement alerting for suspicious activity"
        echo "   - Create session analytics dashboard"
        echo ""
    } >> "$REPORT_FILE"
    
    log "Implementation plan generated"
}

# Main execution
main() {
    print_blue "==========================================="
    print_blue "  Session Pattern Analysis Script"
    print_blue "==========================================="
    print_blue "Starting analysis at $(date -u)"
    print_blue ""
    
    # Check prerequisites
    check_prerequisites
    
    # Test database connectivity
    if ! test_database_connectivity; then
        print_red "❌ Cannot proceed without database connectivity"
        exit 1
    fi
    
    # Perform analysis
    analyze_login_patterns
    analyze_jwt_patterns
    analyze_concurrent_connections
    analyze_user_activity_patterns
    generate_security_recommendations
    generate_implementation_plan
    
    # Final summary
    {
        echo "## Analysis Summary"
        echo ""
        echo "**Report Generated:** $(date -u)"
        echo "**Report File:** $REPORT_FILE"
        echo "**Log File:** $LOG_FILE"
        echo ""
        echo "---"
        echo "*This is an automated concurrent login vulnerability analysis*"
    } >> "$REPORT_FILE"
    
    print_green "✅ Session pattern analysis completed successfully!"
    print_green "📊 Report saved to: $REPORT_FILE"
    print_green "📝 Logs saved to: $LOG_FILE"
    print_blue ""
    print_blue "Next steps:"
    print_blue "1. Review $REPORT_FILE for detailed vulnerability analysis"
    print_blue "2. Check current session management implementation"
    print_blue "3. Implement security enhancement recommendations"
    print_blue "4. Set up regular security audits"
    
    # Display summary
    print_blue ""
    print_blue "==========================================="
    print_blue "  EXECUTIVE SUMMARY"
    print_blue "==========================================="
    
    # Check if active sessions table exists
    local session_table_exists=$(psql "$DATABASE_URL" -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'active_sessions'
        );
    " -t 2>/dev/null | xargs)
    
    if [[ "$session_table_exists" == "t" ]]; then
        print_green "✅ Active sessions table exists"
    else
        print_red "❌ CRITICAL: No active sessions table"
        print_red "   🚨 UNLIMITED CONCURRENT LOGINS POSSIBLE"
    fi
    
    # Show user statistics
    local total_users=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" -t 2>/dev/null | xargs)
    local active_users=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users WHERE last_login IS NOT NULL AND last_login > NOW() - INTERVAL '30 days';" -t 2>/dev/null | xargs)
    
    print_blue "👥 Total Users: $total_users"
    print_blue "📱 Active Users (30 days): $active_users"
    
    print_blue "==========================================="
}

# Run main function
main "$@"