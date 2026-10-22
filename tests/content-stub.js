window.chrome = { runtime: { onMessage: { addListener(listener) { window.contentListener = listener; } } } };
