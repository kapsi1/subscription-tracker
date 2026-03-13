'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category } from '@subscription-tracker/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Layers, Plus, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { IconPicker } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

function isNewCategory(id: string) {
  return id.startsWith('new-');
}

interface CategoryRowProps {
  category: Category;
  onUpdate: (id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

function CategoryRow({ category, onUpdate, onDelete, autoFocus }: CategoryRowProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const nameRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
  }, [category.name, category.color]);

  useEffect(() => {
    return () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoFocus) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [autoFocus]);

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(category.name);
      toast.error(t('settings.categories.noName'));
    } else if (trimmed !== category.name) {
      onUpdate(category.id, { name: trimmed, color });
    }
  };

  const handleColorChange = (value: string) => {
    setColor(value);

    // Debounce the parent update to avoid infinite re-render loops
    // and performance issues when dragging the color picker
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      onUpdate(category.id, { name: name.trim() || category.name, color: value });
    }, 100);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/40 transition-colors group"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon Picker */}
      <IconPicker
        value={category.icon}
        onChange={(icon) => onUpdate(category.id, { icon })}
        color={color}
      />

      {/* Color swatch + picker */}
      <label className="relative shrink-0 cursor-pointer" title="Pick color">
        <span
          className="block w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 transition-transform group-hover:scale-110"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          tabIndex={-1}
        />
      </label>

      {/* Name input */}
      <Input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        placeholder={t('settings.categories.namePlaceholder')}
        className="h-8 flex-1 text-sm border-transparent bg-transparent shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:shadow-sm"
        maxLength={50}
      />

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(category.id)}
        tabIndex={-1}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

const EMPTY_CATEGORIES: Category[] = [];

import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

export function CategorySection() {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();
  const queryClient = useQueryClient();
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: serverCategories = EMPTY_CATEGORIES, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Sync local state from server when there are no unsaved changes
  useEffect(() => {
    if (!isDirty) {
      setLocalCategories(serverCategories);
    }
  }, [serverCategories, isDirty]);

  const resetMutation = useMutation({
    mutationFn: () => api.post('/categories/reset'),
    onSuccess: () => {
      setIsDirty(false);
      setNewCategoryId(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('settings.categories.resetSuccess'));
    },
    onError: () => {
      toast.error(t('settings.categories.resetError'));
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = () => {
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.overflow = '';
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);
    setLocalCategories(arrayMove(localCategories, oldIndex, newIndex));
    setIsDirty(true);
  };

  const handleDragCancel = () => {
    document.body.style.overflow = '';
  };

  const handleAdd = () => {
    const tempId = `new-${Math.random().toString(36).slice(2)}`;
    const newCat: Category = {
      id: tempId,
      name: 'New Category',
      color: '#6366f1',
      icon: 'Tag',
      order: localCategories.length,
    };
    setLocalCategories((prev) => [...prev, newCat]);
    setNewCategoryId(tempId);
    setIsDirty(true);
  };

  const handleUpdate = (id: string, updates: Partial<Category>) => {
    setLocalCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setIsDirty(true);
  };

  const handleDelete = (id: string) => {
    setLocalCategories((prev) => prev.filter((c) => c.id !== id));
    if (newCategoryId === id) setNewCategoryId(null);
    setIsDirty(true);
  };

  const handleRevert = () => {
    setLocalCategories(serverCategories);
    setIsDirty(false);
    setNewCategoryId(null);
  };

  const handleReset = () => {
    if (confirm(t('settings.categories.resetConfirm'))) {
      resetMutation.mutate();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const localIdSet = new Set(
        localCategories.filter((c) => !isNewCategory(c.id)).map((c) => c.id),
      );

      // 1. Delete categories removed locally
      const toDelete = serverCategories.filter((c) => !localIdSet.has(c.id));
      await Promise.all(toDelete.map((c) => api.delete(`/categories/${c.id}`)));

      // 2. Create new categories, collect real IDs
      const toCreate = localCategories.filter((c) => isNewCategory(c.id));
      const created = await Promise.all(
        toCreate.map((c) =>
          api.post('/categories', { name: c.name, color: c.color, icon: c.icon }),
        ),
      );
      const idMap = new Map<string, string>();
      for (let i = 0; i < toCreate.length; i++) {
        idMap.set(toCreate[i].id, created[i].data.id);
      }

      // 3. Update changed existing categories
      const toUpdate = localCategories.filter((c) => {
        if (isNewCategory(c.id)) return false;
        const original = serverCategories.find((s) => s.id === c.id);
        return (
          original &&
          (original.name !== c.name || original.color !== c.color || original.icon !== c.icon)
        );
      });
      await Promise.all(
        toUpdate.map((c) =>
          api.patch(`/categories/${c.id}`, { name: c.name, color: c.color, icon: c.icon }),
        ),
      );

      // 4. Persist the final order
      const finalIds = localCategories.map((c) => idMap.get(c.id) ?? c.id);
      if (finalIds.length > 0) {
        await api.post('/categories/reorder', {
          items: finalIds.map((id, i) => ({ id, order: i })),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDirty(false);
      setNewCategoryId(null);
      toast.success(t('settings.categories.saveSuccess'));
    } catch {
      toast.error(t('settings.categories.saveError'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = localCategories.filter(
    (cat) =>
      searchQuery.trim() === '' || cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle>
              <SearchHighlight text={t('settings.categories.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.categories.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category list — constrained width, centered */}
        <div className="relative space-y-0.5 min-h-[40px] max-h-[336px] overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              {t('common.loading')}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              autoScroll={{
                // Prevent DndKit from auto-scrolling the entire page when dragging near edges
                canScroll: (element) => element.tagName !== 'BODY' && element.tagName !== 'HTML',
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={filteredCategories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredCategories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    autoFocus={category.id === newCategoryId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Actions */}
        <div className="max-w-lg mx-auto flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              {t('settings.categories.addCategory')}
            </Button>
            {isDirty && (
              <>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="w-3.5 h-3.5" />
                  {t('settings.categories.save')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevert}
                  disabled={isSaving}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  {t('settings.categories.revert')}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('settings.categories.resetToDefaults')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
