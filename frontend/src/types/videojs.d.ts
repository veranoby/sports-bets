import 'video.js';

declare module 'video.js' {
  interface Player extends videojs.Component {
    hlsQualitySelector?: () => void;
    customStreamingOptions?: Record<string, unknown>;
  }
}