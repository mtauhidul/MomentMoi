export interface VendorNote {
  vendor_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export class VendorNotesService {
  private static getStorageKey(userId: string): string {
    return `vendor_notes_${userId}`;
  }

  /**
   * Get all notes for a user
   */
  static async getNotes(userId: string): Promise<Record<string, string>> {
    try {
      const stored = localStorage.getItem(this.getStorageKey(userId));
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting vendor notes:', error);
      return {};
    }
  }

  /**
   * Get note for a specific vendor
   */
  static async getNote(userId: string, vendorId: string): Promise<string> {
    try {
      const notes = await this.getNotes(userId);
      return notes[vendorId] || '';
    } catch (error) {
      console.error('Error getting vendor note:', error);
      return '';
    }
  }

  /**
   * Save note for a vendor
   */
  static async saveNote(userId: string, vendorId: string, note: string): Promise<boolean> {
    try {
      const notes = await this.getNotes(userId);
      notes[vendorId] = note;
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(notes));
      return true;
    } catch (error) {
      console.error('Error saving vendor note:', error);
      return false;
    }
  }

  /**
   * Delete note for a vendor
   */
  static async deleteNote(userId: string, vendorId: string): Promise<boolean> {
    try {
      const notes = await this.getNotes(userId);
      delete notes[vendorId];
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(notes));
      return true;
    } catch (error) {
      console.error('Error deleting vendor note:', error);
      return false;
    }
  }

  /**
   * Clear all notes for a user
   */
  static async clearAllNotes(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.getStorageKey(userId));
      return true;
    } catch (error) {
      console.error('Error clearing vendor notes:', error);
      return false;
    }
  }
}
