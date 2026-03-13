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
import { GripVertical, Layers, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { IconPicker } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

interface CategoryRowProps {
  category: Category;
  onSave: (id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

function CategoryRow({ category, onSave, onDelete, autoFocus }: CategoryRowProps) {
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

  const colorSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
  }, [category.name, category.color]);

  useEffect(() => {
    return () => {
      if (colorSaveTimerRef.current) clearTimeout(colorSaveTimerRef.current);
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
      onSave(category.id, { name: trimmed });
    }
  };

  const handleColorChange = (value: string) => {
    setColor(value);

    // Debounce the API save to avoid excessive calls when dragging the color picker
    if (colorSaveTimerRef.current) clearTimeout(colorSaveTimerRef.current);
    colorSaveTimerRef.current = setTimeout(() => {
      onSave(category.id, { color: value });
    }, 500);
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
        onChange={(icon) => onSave(category.id, { icon })}
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
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);

  const { data: categories = EMPTY_CATEGORIES, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (newCat: { name: string; color: string; icon: string }) =>
      api.post('/categories', newCat),
    onSuccess: (res) => {
      queryClient.setQueryData<Category[]>(['categories'], (old) => [...(old ?? []), res.data]);
      setNewCategoryId(res.data.id);
      invalidateRelated();
    },
    onError: () => {
      toast.error(t('settings.categories.saveError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>;
    }) => api.patch(`/categories/${id}`, updates),
    onSuccess: () => {
      invalidateRelated();
    },
    onError: () => {
      toast.error(t('settings.categories.saveError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onMutate: (id) => {
      queryClient.setQueryData<Category[]>(['categories'], (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
    },
    onSuccess: () => {
      invalidateRelated();
    },
    onError: () => {
      toast.error(t('settings.categories.saveError'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; order: number }[]) =>
      api.post('/categories/reorder', { items }),
    onError: () => {
      toast.error(t('settings.categories.saveError'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/categories/reset'),
    onSuccess: () => {
      setNewCategoryId(null);
      invalidateRelated();
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

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData<Category[]>(
      ['categories'],
      reordered.map((c, i) => ({ ...c, order: i })),
    );
    reorderMutation.mutate(reordered.map((c, i) => ({ id: c.id, order: i })));
  };

  const handleDragCancel = () => {
    document.body.style.overflow = '';
  };

  const handleAdd = () => {
    createMutation.mutate({ name: 'New Category', color: '#6366f1', icon: 'Tag' });
  };

  const handleSave = (id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>) => {
    // Optimistic update in query cache
    queryClient.setQueryData<Category[]>(['categories'], (old) =>
      (old ?? []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
    updateMutation.mutate({ id, updates });
  };

  const handleDelete = (id: string) => {
    if (newCategoryId === id) setNewCategoryId(null);
    deleteMutation.mutate(id);
  };

  const handleReset = () => {
    if (confirm(t('settings.categories.resetConfirm'))) {
      resetMutation.mutate();
    }
  };

  const filteredCategories = categories.filter(
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
                    onSave={handleSave}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={createMutation.isPending}
            className="gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('settings.categories.addCategory')}
          </Button>
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
