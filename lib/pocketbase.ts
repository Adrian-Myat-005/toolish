import PocketBase from 'pocketbase';

// Connect to the PocketBase instance (Cloud or Local)
// Defaults to local for development, can be overridden by environment variable for production
const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(pbUrl);

// Disable auto-cancellation to prevent race conditions in React Strict Mode
pb.autoCancellation(false);
