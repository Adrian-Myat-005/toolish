import { pb } from './pocketbase';

/**
 * Migration Script: Auto-creates collections if they don't exist.
 * In a production local-first app, you might want to handle admin auth properly,
 * but for a local development/user-owned instance, we attempt to check and create.
 */
export async function initLocalDatabase() {
  try {
    // Check if we are connected
    const health = await pb.health.check();
    if (!health) throw new Error("PocketBase not reachable");

    console.log("PocketBase health check passed. Initializing schema...");

    // Define Collections
    const collections = [
      {
        name: 'books',
        type: 'base',
        schema: [
          { name: 'title', type: 'text', required: true },
          { name: 'file_path', type: 'text', required: true },
          { name: 'current_page', type: 'number' },
          { name: 'total_pages', type: 'number' },
          { name: 'last_opened', type: 'date' },
        ],
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      {
        name: 'activity_logs',
        type: 'base',
        schema: [
          { name: 'window_title', type: 'text' },
          { name: 'duration', type: 'number' },
          { name: 'productivity_score', type: 'number' },
          { name: 'timestamp', type: 'date' },
        ],
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      {
        name: 'voice_notes',
        type: 'base',
        schema: [
          { name: 'transcription', type: 'text' },
          { name: 'ai_summary', type: 'text' },
          { name: 'tags', type: 'json' },
        ],
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      {
        name: 'user_stats',
        type: 'base',
        schema: [
          { name: 'user_id', type: 'text', required: true, unique: true },
          { name: 'daily_usage', type: 'number' },
          { name: 'daily_tokens', type: 'number' },
          { name: 'last_usage_date', type: 'text' },
          { name: 'api_key', type: 'text' },
          { name: 'preferred_model', type: 'text' },
          { name: 'api_memory', type: 'json' },
        ],
      }
    ];

    for (const collData of collections) {
      try {
        await pb.collections.getOne(collData.name);
      } catch (err: any) {
        if (err.status === 404) {
            console.log(`Creating collection: ${collData.name}`);
            try {
                await pb.collections.create(collData);
                console.log(`Successfully created collection: ${collData.name}`);
            } catch (createErr: any) {
                console.error(`Failed to create collection ${collData.name}:`, createErr.data || createErr.message);
            }
        } else {
            console.error(`Error checking collection ${collData.name}:`, err.message);
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}

/**
 * CRUD Helpers
 */

export async function saveBookProgress(bookId: string, pageNumber: number, totalPages?: number) {
  return await pb.collection('books').update(bookId, {
    current_page: pageNumber,
    last_opened: new Date().toISOString(),
    ...(totalPages ? { total_pages: totalPages } : {}),
  });
}

export async function logActivity(activityData: {
  window_title: string;
  duration: number;
  productivity_score: number;
}) {
  return await pb.collection('activity_logs').create({
    ...activityData,
    timestamp: new Date().toISOString(),
  });
}

export async function getRecentBooks() {
  try {
    return await pb.collection('books').getFullList({
      sort: '-last_opened',
    });
  } catch (err) {
    console.error("Failed to fetch recent books:", err);
    return [];
  }
}

export async function addVoiceNote(transcription: string, summary: string, tags: string[]) {
  return await pb.collection('voice_notes').create({
    transcription,
    ai_summary: summary,
    tags,
  });
}

/**
 * User Stats & Preferences Persistence
 */

export async function getUserStats(userId: string) {
  try {
    return await pb.collection('user_stats').getFirstListItem(`user_id="${userId}"`);
  } catch (err: any) {
    if (err.status === 0) {
        console.warn("PocketBase server unreachable. Stats will not be synced.");
    }
    return null;
  }
}

export async function updateUserStats(userId: string, data: any) {
  try {
    const existing = await getUserStats(userId);
    if (existing) {
      return await pb.collection('user_stats').update(existing.id, data);
    } else {
      // Check health before trying to create if existing was null
      const health = await pb.health.check().catch(() => ({ code: 0 }));
      if (health.code === 0) {
          console.warn("PocketBase unreachable, skipping create.");
          return null;
      }
      return await pb.collection('user_stats').create({
        user_id: userId,
        ...data
      });
    }
  } catch (err: any) {
    if (err.status === 0) {
        console.warn("PocketBase unreachable during update.");
        return null;
    }
    console.error("PocketBase Error Details:", {
        url: err?.url,
        status: err?.status,
        data: err?.data,
        originalError: err
    });
    throw err;
  }
}
