const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './media'
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg', // Asegúrate de que ffmpeg esté instalado y en esta ruta
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        dash: true,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
      }
    ]
  }
};

const nms = new NodeMediaServer(config);

nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log(`[${new Date().toLocaleTimeString()}] 🟢 STREAM STARTED: StreamPath=${StreamPath}`);
  console.log('   📺 HLS URL: http://localhost:8000' + StreamPath + '.m3u8');
  console.log('   🎬 FLV URL: http://localhost:8000' + StreamPath + '.flv');
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log(`[${new Date().toLocaleTimeString()}] 🔴 STREAM ENDED: StreamPath=${StreamPath}`);
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log(`[${new Date().toLocaleTimeString()}] PrePlay: id=${id} StreamPath=${StreamPath}`);
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log(`[${new Date().toLocaleTimeString()}] 📺 VIEWER CONNECTED: StreamPath=${StreamPath}`);
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log(`[${new Date().toLocaleTimeString()}] 👋 VIEWER DISCONNECTED: StreamPath=${StreamPath}`);
});


console.log('🚀 Starting Galleros.Net RTMP Server...');
console.log('📡 RTMP: rtmp://localhost:1935/live');
console.log('🌐 HTTP: http://localhost:8000');
console.log('');
console.log('📋 OBS Studio Configuration:');
console.log('   Server: rtmp://localhost:1935/live');
console.log('   Stream Key: test (or any key you prefer)');
console.log('');
console.log('🎥 Test URLs:');
console.log('   HLS: http://localhost:8000/live/test.m3u8');
console.log('   FLV: http://localhost:8000/live/test.flv');
console.log('');
console.log('⏳ Waiting for streams...');

nms.run();
