// Production console cleaner - suppress all debug logs for clean user experience
const isProduction = import.meta.env.PROD;

if (isProduction) {
  // In production, suppress all console output for clean experience
  console.log = () => { };
  console.debug = () => { };
  console.info = () => { };
  console.warn = () => { };
  // Keep console.error for critical issues only, but filter known noise
  const originalError = console.error;
  const noisePatterns = [
    'net::ERR_ABORTED',
    'firebase_firestore.js',
    'Firestore/Listen',
    'Firestore/Write',
    'google-analytics.com/g/collect',
    'ResizeObserver loop',
    'Non-Error promise rejection'
  ];
  console.error = (...args: any[]) => {
    try {
      const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      if (noisePatterns.some(p => text.includes(p))) return;
    } catch { }
    originalError(...args);
  };
} else {
  // In development, filter only noisy messages
  const originalError = console.error;
  const originalWarn = console.warn;
  const patterns = [
    'net::ERR_ABORTED',
    'firebase_firestore.js',
    'Firestore/Listen',
    'Firestore/Write',
    'google-analytics.com/g/collect'
  ];
  const shouldFilter = (args: any[]) => {
    try {
      const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      return patterns.some(p => text.includes(p));
    } catch {
      return false;
    }
  };
  console.error = (...args: any[]) => {
    if (shouldFilter(args)) return;
    originalError(...args);
  };
  console.warn = (...args: any[]) => {
    if (shouldFilter(args)) return;
    originalWarn(...args);
  };
}
