import Dexie, { type Table } from 'dexie';

// Define Interfaces
export interface Book {
  id?: number;
  title: string;
  fileData: ArrayBuffer; // Store the PDF/EPUB file directly in IndexedDB
  fileType: 'pdf' | 'epub';
  currentPage: number;
  totalPages: number;
  lastOpened: Date;
}

export interface ChatLog {
  id?: number;
  bookId: number;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

// Initialize Database
class MyAppDatabase extends Dexie {
  books!: Table<Book>;
  chats!: Table<ChatLog>;

  constructor() {
    super('AdrianReaderDB');
    // Define Schema (only index fields you need to search/sort)
    this.version(1).stores({
      books: '++id, title, lastOpened',
      chats: '++id, bookId, timestamp'
    });
  }
}

export const db = new MyAppDatabase();
