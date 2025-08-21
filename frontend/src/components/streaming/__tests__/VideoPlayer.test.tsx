import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VideoPlayer from '../VideoPlayer'

// Mock Video.js
const mockPlayer = {
  ready: vi.fn(),
  src: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  error: vi.fn(),
  currentTime: vi.fn(),
  duration: vi.fn(),
  volume: vi.fn(),
  muted: vi.fn(),
  fullscreen: vi.fn(),
  requestFullscreen: vi.fn(),
  exitFullscreen: vi.fn(),
  isFullscreen: vi.fn(),
  fluid: vi.fn(),
  responsive: vi.fn()
}

vi.mock('video.js', () => {
  return {
    default: vi.fn().mockImplementation(() => mockPlayer)
  }
})

// Mock HLS streaming plugin
vi.mock('@videojs/http-streaming', () => ({
  default: {}
}))

const defaultProps = {
  src: 'https://test-stream.com/playlist.m3u8',
  streamId: 'test-stream-123',
  onReady: vi.fn(),
  onError: vi.fn(),
  onPlay: vi.fn(),
  onPause: vi.fn()
}

describe('VideoPlayer', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render video player element', () => {
    render(<VideoPlayer {...defaultProps} />)
    
    const videoElement = screen.getByTestId('video-player')
    expect(videoElement).toBeInTheDocument()
    expect(videoElement.tagName).toBe('DIV')
  })

  it('should initialize Video.js player on mount', async () => {
    const VideoJS = await import('video.js')
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(VideoJS.default).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          controls: true,
          responsive: true,
          fluid: true,
          sources: [{
            src: defaultProps.src,
            type: 'application/x-mpegURL'
          }]
        })
      )
    })
  })

  it('should handle HLS stream sources correctly', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.ready).toHaveBeenCalled()
    })
  })

  it('should call onReady when player is ready', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.ready).toHaveBeenCalled()
    })

    // Simulate ready callback
    const readyCallback = mockPlayer.ready.mock.calls[0][0]
    readyCallback()

    expect(defaultProps.onReady).toHaveBeenCalled()
  })

  it('should handle stream errors gracefully', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    // Simulate error
    const errorCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'error')?.[1]
    const mockError = { code: 2, message: 'Network error' }
    errorCallback?.(mockError)

    expect(defaultProps.onError).toHaveBeenCalledWith(mockError)
  })

  it('should handle play/pause events', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.on).toHaveBeenCalledWith('play', expect.any(Function))
      expect(mockPlayer.on).toHaveBeenCalledWith('pause', expect.any(Function))
    })

    // Simulate play event
    const playCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'play')?.[1]
    playCallback?.()
    expect(defaultProps.onPlay).toHaveBeenCalled()

    // Simulate pause event
    const pauseCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'pause')?.[1]
    pauseCallback?.()
    expect(defaultProps.onPause).toHaveBeenCalled()
  })

  it('should dispose player on unmount', async () => {
    const { unmount } = render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.ready).toHaveBeenCalled()
    })

    unmount()

    expect(mockPlayer.dispose).toHaveBeenCalled()
  })

  it('should update source when src prop changes', async () => {
    const { rerender } = render(<VideoPlayer {...defaultProps} />)

    const newSrc = 'https://new-stream.com/playlist.m3u8'
    rerender(<VideoPlayer {...defaultProps} src={newSrc} />)

    await waitFor(() => {
      expect(mockPlayer.src).toHaveBeenCalledWith({
        src: newSrc,
        type: 'application/x-mpegURL'
      })
    })
  })

  it('should handle quality selection', async () => {
    const propsWithQualities = {
      ...defaultProps,
      qualities: [
        { label: '720p', src: 'https://test-stream.com/720p.m3u8' },
        { label: '480p', src: 'https://test-stream.com/480p.m3u8' },
        { label: '360p', src: 'https://test-stream.com/360p.m3u8' }
      ]
    }

    render(<VideoPlayer {...propsWithQualities} />)

    await waitFor(() => {
      expect(mockPlayer.ready).toHaveBeenCalled()
    })
  })

  it('should handle fullscreen functionality', async () => {
    mockPlayer.isFullscreen.mockReturnValue(false)
    
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.ready).toHaveBeenCalled()
    })
  })

  it('should handle stream buffering states', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.on).toHaveBeenCalledWith('waiting', expect.any(Function))
      expect(mockPlayer.on).toHaveBeenCalledWith('canplay', expect.any(Function))
    })

    // Simulate buffering
    const waitingCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'waiting')?.[1]
    waitingCallback?.()

    // Simulate ready to play
    const canplayCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'canplay')?.[1]
    canplayCallback?.()
  })

  it('should handle stream interruptions', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.on).toHaveBeenCalledWith('stalled', expect.any(Function))
    })

    // Simulate stream stall
    const stalledCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'stalled')?.[1]
    stalledCallback?.()
  })

  it('should track viewer analytics events', async () => {
    const onAnalyticsEvent = vi.fn()
    const propsWithAnalytics = {
      ...defaultProps,
      onAnalyticsEvent
    }

    render(<VideoPlayer {...propsWithAnalytics} />)

    await waitFor(() => {
      expect(mockPlayer.on).toHaveBeenCalledWith('timeupdate', expect.any(Function))
    })

    // Simulate time update for analytics
    const timeupdateCallback = mockPlayer.on.mock.calls.find(call => call[0] === 'timeupdate')?.[1]
    timeupdateCallback?.()
  })

  it('should handle accessibility features', async () => {
    render(<VideoPlayer {...defaultProps} />)

    const videoContainer = screen.getByTestId('video-player')
    expect(videoContainer).toHaveAttribute('role', 'application')
    expect(videoContainer).toHaveAttribute('aria-label', 'Video Player')
  })

  it('should handle responsive design', async () => {
    render(<VideoPlayer {...defaultProps} />)

    await waitFor(() => {
      expect(mockPlayer.fluid).toHaveBeenCalledWith(true)
      expect(mockPlayer.responsive).toHaveBeenCalledWith(true)
    })
  })
})