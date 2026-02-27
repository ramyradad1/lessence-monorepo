'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, GripVertical, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface Section {
  id: string;
  key: string;
  label: string;
  label_ar: string | null;
  sort_order: number;
  is_visible: boolean;
}

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setSections(data);
    setLoading(false);
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDragIndex(null);
      return;
    }

    const items = [...sections];
    const draggedItem = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItem);

    // Reassign sort_order
    const reordered = items.map((item, idx) => ({
      ...item,
      sort_order: idx,
    }));

    setSections(reordered);
    setHasChanges(true);
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIndex(null);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], is_visible: !updated[index].is_visible };
    setSections(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Batch update all sections
      const promises = sections.map((section) =>
        supabase
          .from('homepage_sections')
          .update({ sort_order: section.sort_order, is_visible: section.is_visible })
          .eq('id', section.id)
      );
      await Promise.all(promises);
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save sections:', err);
      alert('Failed to save section order');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Homepage Sections</h1>
          <p className="text-fg-muted text-sm mt-1">
            Drag to reorder. Toggle visibility to show/hide sections.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : hasChanges
              ? 'bg-[#f4c025] text-black hover:bg-[#f4c025]/90'
              : 'bg-white/5 text-fg-faint cursor-not-allowed'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 size={16} />
              Saved!
            </>
          ) : (
            <>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Order'}
            </>
          )}
        </button>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing ${
              dragIndex === index
                ? 'border-[#f4c025]/50 bg-[#f4c025]/5 opacity-60 scale-[0.98]'
                : section.is_visible
                ? 'border-white/5 bg-[#1e1b16] hover:border-white/10'
                : 'border-white/5 bg-[#1e1b16]/50 opacity-50'
            }`}
          >
            {/* Drag Handle */}
            <div className="text-fg-faint hover:text-white transition-colors flex-shrink-0">
              <GripVertical size={20} />
            </div>

            {/* Order Badge */}
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-fg-muted flex-shrink-0">
              {index + 1}
            </div>

            {/* Section Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {section.label}
              </h3>
              {section.label_ar && (
                <p className="text-xs text-fg-faint mt-0.5 truncate" dir="rtl">
                  {section.label_ar}
                </p>
              )}
              <span className="text-[10px] text-fg-faint font-mono mt-1 block">
                {section.key}
              </span>
            </div>

            {/* Visibility Toggle */}
            <button
              onClick={() => toggleVisibility(index)}
              className={`p-2.5 rounded-xl transition-all ${
                section.is_visible
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
              title={section.is_visible ? 'Click to hide' : 'Click to show'}
            >
              {section.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="text-center">
          <p className="text-xs text-[#f4c025] animate-pulse tracking-widest uppercase">
            Unsaved changes — click &quot;Save Order&quot; to apply
          </p>
        </div>
      )}
    </div>
  );
}
