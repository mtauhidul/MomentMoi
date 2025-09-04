"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { VendorNotesService } from '@/lib/vendor-notes-service';
import { useAuth } from '@/contexts/AuthContext';

interface VendorNoteProps {
  vendorId: string;
  vendorName: string;
  className?: string;
}

export function VendorNote({ vendorId, vendorName, className = '' }: VendorNoteProps) {
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNote, setHasNote] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNote();
    }
  }, [user, vendorId]);

  const loadNote = async () => {
    if (!user) return;
    
    try {
      const savedNote = await VendorNotesService.getNote(user.id, vendorId);
      setNote(savedNote);
      setHasNote(savedNote.length > 0);
    } catch (error) {
      console.error('Error loading note:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const success = await VendorNotesService.saveNote(user.id, vendorId, note);
      
      if (success) {
        setHasNote(note.length > 0);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const success = await VendorNotesService.deleteNote(user.id, vendorId);
      
      if (success) {
        setNote('');
        setHasNote(false);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    loadNote(); // Reset to original note
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Notes</h4>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 px-2 text-xs"
          >
            <Icon name="Edit" size="xs" className="mr-1" />
            {hasNote ? 'Edit' : 'Add'}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Add notes about ${vendorName}...`}
            className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Icon name="Loader2" size="sm" className="animate-spin mr-1" />
              ) : (
                <Icon name="Save" size="sm" className="mr-1" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {hasNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Icon name="Trash2" size="sm" className="mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-[60px] p-3 bg-gray-50 rounded-md">
          {hasNote ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No notes yet. Click "Add" to add notes about this vendor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
