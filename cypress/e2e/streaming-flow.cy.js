"use strict";
describe('Complete Streaming Flow - OBS to User', function () {
    beforeEach(function () {
        // Mock streaming endpoints
        cy.intercept('GET', '/api/streaming/status', {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    status: 'healthy',
                    activeStreams: 2,
                    totalViewers: 150,
                    serverLoad: 0.35
                }
            }
        }).as('streamingStatus');
        cy.intercept('POST', '/api/streaming/start', {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    streamId: 'live_stream_123',
                    rtmpUrl: 'rtmp://stream.galleros.net/live/test_stream_key',
                    hlsUrl: 'https://stream.galleros.net/hls/test_stream_key.m3u8',
                    streamKey: 'test_stream_key'
                }
            }
        }).as('startStream');
        cy.intercept('GET', '/api/events/*/stream-access', {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    streamUrl: 'https://stream.galleros.net/hls/test_stream_key.m3u8',
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
                }
            }
        }).as('getStreamAccess');
        cy.intercept('GET', '/api/streaming/analytics', {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    currentViewers: 125,
                    peakViewers: 200,
                    averageViewTime: 1800,
                    viewersByRegion: { US: 50, EU: 30, LATAM: 45 }
                }
            }
        }).as('streamingAnalytics');
    });
    describe('Operator Stream Setup', function () {
        it('should allow operator to start a new stream', function () {
            // Login as operator
            cy.login('operator', 'operator@test.com', 'testpassword');
            cy.visit('/operator/stream');
            // Verify streaming dashboard loads
            cy.get('[data-testid="streaming-dashboard"]').should('be.visible');
            cy.contains('Stream Management').should('be.visible');
            // Check stream status
            cy.get('[data-testid="stream-status"]').should('contain', 'Ready to Stream');
            // Start new stream
            cy.get('[data-testid="start-stream-btn"]').click();
            // Fill stream configuration
            cy.get('[data-testid="event-select"]').select('Test Fighting Event');
            cy.get('[data-testid="stream-title"]').type('Live Fight Stream - Test Event');
            cy.get('[data-testid="stream-description"]').type('High-quality live streaming of the main event');
            // Configure stream settings
            cy.get('[data-testid="quality-select"]').select('720p');
            cy.get('[data-testid="bitrate-input"]').clear().type('2500');
            // Start stream
            cy.get('[data-testid="confirm-start-stream"]').click();
            // Verify stream started
            cy.wait('@startStream');
            cy.get('[data-testid="stream-status"]').should('contain', 'Live');
            cy.get('[data-testid="rtmp-url"]').should('contain', 'rtmp://stream.galleros.net/live');
            cy.get('[data-testid="stream-key"]').should('be.visible');
            // Verify OBS setup instructions
            cy.get('[data-testid="obs-instructions"]').should('be.visible');
            cy.contains('Copy the RTMP URL and Stream Key to OBS Studio').should('be.visible');
            // Test copy functionality
            cy.get('[data-testid="copy-rtmp-url"]').click();
            cy.contains('RTMP URL copied to clipboard').should('be.visible');
            cy.get('[data-testid="copy-stream-key"]').click();
            cy.contains('Stream Key copied to clipboard').should('be.visible');
        });
        it('should show real-time stream analytics', function () {
            cy.login('operator', 'operator@test.com', 'testpassword');
            cy.visit('/operator/stream');
            // Start a stream (mock as active)
            cy.get('[data-testid="stream-status"]').invoke('text', 'Live');
            // Check analytics panel
            cy.get('[data-testid="analytics-panel"]').should('be.visible');
            cy.wait('@streamingAnalytics');
            // Verify viewer metrics
            cy.get('[data-testid="current-viewers"]').should('contain', '125');
            cy.get('[data-testid="peak-viewers"]').should('contain', '200');
            // Verify regional distribution
            cy.get('[data-testid="viewers-by-region"]').should('be.visible');
            cy.get('[data-testid="region-us"]').should('contain', '50');
            cy.get('[data-testid="region-eu"]').should('contain', '30');
            cy.get('[data-testid="region-latam"]').should('contain', '45');
            // Test analytics refresh
            cy.get('[data-testid="refresh-analytics"]').click();
            cy.wait('@streamingAnalytics');
        });
        it('should handle stream interruptions gracefully', function () {
            cy.login('operator', 'operator@test.com', 'testpassword');
            cy.visit('/operator/stream');
            // Mock stream interruption
            cy.intercept('GET', '/api/streaming/status', {
                statusCode: 200,
                body: {
                    success: true,
                    data: {
                        status: 'degraded',
                        activeStreams: 1,
                        totalViewers: 50,
                        serverLoad: 0.95,
                        errors: ['High CPU usage', 'Network latency spike']
                    }
                }
            }).as('streamingStatusDegraded');
            cy.wait('@streamingStatusDegraded');
            // Verify warning displayed
            cy.get('[data-testid="stream-warning"]').should('be.visible');
            cy.contains('Stream quality degraded').should('be.visible');
            cy.get('[data-testid="error-list"]').should('contain', 'High CPU usage');
            cy.get('[data-testid="error-list"]').should('contain', 'Network latency spike');
            // Test recovery actions
            cy.get('[data-testid="restart-stream-btn"]').should('be.visible');
            cy.get('[data-testid="reduce-quality-btn"]').should('be.visible');
        });
        it('should stop stream properly', function () {
            cy.login('operator', 'operator@test.com', 'testpassword');
            cy.visit('/operator/stream');
            // Mock active stream
            cy.get('[data-testid="stream-status"]').invoke('text', 'Live');
            cy.get('[data-testid="stop-stream-btn"]').should('be.visible');
            // Stop stream
            cy.get('[data-testid="stop-stream-btn"]').click();
            // Confirm stop
            cy.get('[data-testid="confirm-stop-modal"]').should('be.visible');
            cy.contains('Are you sure you want to stop the stream?').should('be.visible');
            cy.get('[data-testid="confirm-stop-stream"]').click();
            // Verify stream stopped
            cy.intercept('POST', '/api/streaming/stop', {
                statusCode: 200,
                body: {
                    success: true,
                    data: {
                        streamId: 'live_stream_123',
                        duration: 3600,
                        viewerCount: 150,
                        endReason: 'operator_stop'
                    }
                }
            }).as('stopStream');
            cy.wait('@stopStream');
            cy.get('[data-testid="stream-status"]').should('contain', 'Stopped');
            // Show stream summary
            cy.get('[data-testid="stream-summary"]').should('be.visible');
            cy.contains('Stream Duration: 1h 0m').should('be.visible');
            cy.contains('Peak Viewers: 150').should('be.visible');
        });
    });
    describe('User Stream Viewing', function () {
        it('should allow subscribed users to watch stream', function () {
            // Login as subscribed user
            cy.login('user', 'user@test.com', 'testpassword', {
                subscription: {
                    type: 'daily',
                    status: 'active',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            cy.visit('/events/test-event-123');
            // Verify event page loads
            cy.get('[data-testid="event-page"]').should('be.visible');
            cy.contains('Test Fighting Event').should('be.visible');
            // Check for live stream indicator
            cy.get('[data-testid="live-indicator"]').should('be.visible');
            cy.contains('LIVE').should('be.visible');
            // Click to watch stream
            cy.get('[data-testid="watch-stream-btn"]').click();
            // Verify stream access granted
            cy.wait('@getStreamAccess');
            cy.get('[data-testid="video-player"]').should('be.visible');
            // Verify subscription status shown
            cy.get('[data-testid="subscription-status"]').should('contain', 'Premium Member');
            // Test video player controls
            cy.get('[data-testid="play-button"]').should('be.visible');
            cy.get('[data-testid="volume-control"]').should('be.visible');
            cy.get('[data-testid="fullscreen-button"]').should('be.visible');
            // Test quality selection
            cy.get('[data-testid="quality-selector"]').click();
            cy.get('[data-testid="quality-720p"]').should('be.visible');
            cy.get('[data-testid="quality-480p"]').should('be.visible');
            cy.get('[data-testid="quality-360p"]').should('be.visible');
        });
        it('should show subscription prompt for non-subscribed users', function () {
            // Login as non-subscribed user
            cy.login('user', 'user@test.com', 'testpassword', {
                subscription: null
            });
            cy.visit('/events/test-event-123');
            // Try to watch stream
            cy.get('[data-testid="watch-stream-btn"]').click();
            // Verify subscription guard blocks access
            cy.get('[data-testid="subscription-guard"]').should('be.visible');
            cy.contains('Upgrade to Premium').should('be.visible');
            cy.contains('Unlock premium streaming').should('be.visible');
            // Verify subscription plans displayed
            cy.get('[data-testid="plan-daily"]').should('be.visible');
            cy.contains('$2.50').should('be.visible');
            cy.get('[data-testid="plan-monthly"]').should('be.visible');
            cy.contains('$10.00').should('be.visible');
            // Test upgrade button
            cy.get('[data-testid="upgrade-btn"]').should('be.visible');
            // Verify video player not visible
            cy.get('[data-testid="video-player"]').should('not.exist');
        });
        it('should handle expired subscriptions', function () {
            // Login as user with expired subscription
            cy.login('user', 'user@test.com', 'testpassword', {
                subscription: {
                    type: 'daily',
                    status: 'expired',
                    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            });
            cy.visit('/events/test-event-123');
            // Try to watch stream
            cy.get('[data-testid="watch-stream-btn"]').click();
            // Verify renewal prompt
            cy.get('[data-testid="subscription-expired"]').should('be.visible');
            cy.contains('Subscription Expired').should('be.visible');
            cy.contains('Renew your subscription').should('be.visible');
            cy.get('[data-testid="renew-btn"]').should('be.visible');
        });
        it('should handle stream errors gracefully', function () {
            cy.login('user', 'user@test.com', 'testpassword', {
                subscription: { type: 'daily', status: 'active' }
            });
            // Mock stream error
            cy.intercept('GET', '/api/events/*/stream-access', {
                statusCode: 500,
                body: { success: false, message: 'Stream temporarily unavailable' }
            }).as('streamError');
            cy.visit('/events/test-event-123');
            cy.get('[data-testid="watch-stream-btn"]').click();
            cy.wait('@streamError');
            // Verify error message displayed
            cy.get('[data-testid="stream-error"]').should('be.visible');
            cy.contains('Stream temporarily unavailable').should('be.visible');
            cy.get('[data-testid="retry-stream-btn"]').should('be.visible');
            // Test retry functionality
            cy.intercept('GET', '/api/events/*/stream-access', {
                statusCode: 200,
                body: {
                    success: true,
                    data: {
                        streamUrl: 'https://stream.galleros.net/hls/test.m3u8',
                        token: 'valid_token'
                    }
                }
            }).as('streamRetrySuccess');
            cy.get('[data-testid="retry-stream-btn"]').click();
            cy.wait('@streamRetrySuccess');
            // Verify stream loads after retry
            cy.get('[data-testid="video-player"]').should('be.visible');
        });
    });
    describe('Stream Quality and Performance', function () {
        it('should automatically adjust quality based on connection', function () {
            cy.login('user', 'user@test.com', 'testpassword', {
                subscription: { type: 'daily', status: 'active' }
            });
            cy.visit('/events/test-event-123');
            cy.get('[data-testid="watch-stream-btn"]').click();
            cy.wait('@getStreamAccess');
            // Mock slow connection
            cy.window().then(function (win) {
                // Simulate network change
                Object.defineProperty(win.navigator, 'connection', {
                    writable: true,
                    value: {
                        effectiveType: '3g',
                        downlink: 1.5
                    }
                });
            });
            // Verify quality auto-adjustment
            cy.get('[data-testid="quality-indicator"]').should('contain', '480p');
            cy.get('[data-testid="adaptive-quality-notice"]').should('be.visible');
        });
        it('should show buffering indicator during slow loads', function () {
            cy.login('user', 'user@test.com', 'testpassword', {
                subscription: { type: 'daily', status: 'active' }
            });
            cy.visit('/events/test-event-123');
            cy.get('[data-testid="watch-stream-btn"]').click();
            // Mock buffering state
            cy.get('[data-testid="video-player"]').then(function ($player) {
                // Simulate buffering event
                $player.trigger('waiting');
            });
            cy.get('[data-testid="buffering-indicator"]').should('be.visible');
            cy.contains('Buffering...').should('be.visible');
        });
    });
    describe('Cross-browser Compatibility', function () {
        var browsers = ['chrome', 'firefox', 'safari', 'edge'];
        browsers.forEach(function (browser) {
            it("should work correctly in ".concat(browser), function () {
                cy.login('user', 'user@test.com', 'testpassword', {
                    subscription: { type: 'daily', status: 'active' }
                });
                cy.visit('/events/test-event-123');
                cy.get('[data-testid="watch-stream-btn"]').click();
                cy.wait('@getStreamAccess');
                // Verify basic functionality
                cy.get('[data-testid="video-player"]').should('be.visible');
                cy.get('[data-testid="play-button"]').should('be.visible');
                // Browser-specific HLS support check
                if (browser === 'safari') {
                    cy.get('[data-testid="native-hls-support"]').should('exist');
                }
                else {
                    cy.get('[data-testid="hls-js-player"]').should('exist');
                }
            });
        });
    });
});
