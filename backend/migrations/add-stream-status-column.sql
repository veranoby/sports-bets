-- Migration: Add stream_status column to events table
-- Created: 2025-12-11
-- Purpose: Track real-time RTMP stream status separately from event status

-- Add enum type for stream_status
CREATE TYPE enum_events_stream_status AS ENUM ('offline', 'connecting', 'connected', 'paused', 'disconnected');

-- Add column to events table
ALTER TABLE events
ADD COLUMN stream_status enum_events_stream_status DEFAULT 'offline' NOT NULL;

-- Add index for performance
CREATE INDEX idx_events_stream_status ON events(stream_status);

-- Comment for documentation
COMMENT ON COLUMN events.stream_status IS 'Real-time RTMP streaming status - independent from event.status lifecycle';
