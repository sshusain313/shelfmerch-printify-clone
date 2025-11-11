import React, { useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { componentLibrary } from '@/lib/builderComponents';
import { BuilderSection, SectionType } from '@/types/builder';
import {
  Undo2,
  Redo2,
  Save,
  Eye,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core/dist/types';
import DraggableSectionItem from '@/components/builder/DraggableSectionItem';
import { cn } from '@/lib/utils';
import SectionSettingsPanel from '@/components/builder/SectionSettingsPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const previewWidthMap: Record<string, string> = {
  desktop: 'max-w-[1200px]',
  tablet: 'max-w-[760px]',
  mobile: 'max-w-[420px]',
};

const categories = ['layout', 'content', 'commerce', 'marketing'] as const;

const BuilderDemo: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { store, products } = useData();
  const {
    builder,
    previewMode,
    setPreviewMode,
    getActivePage,
    addSection,
    removeSection,
    reorderSections,
    updateSection,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDraft,
    publishBuilder,
    loadBuilder,
    selectedSectionId,
    setSelectedSection,
    setActivePage,
  } = useBuilder();

  const activePage = getActivePage();

  useEffect(() => {
    if (!store || store.userId !== storeId) {
      toast.error('Store not found');
      navigate('/stores');
      return;
    }

    if (store.builder) {
      loadBuilder(store.builder);
    } else {
      const draftKey = `store_builder_draft_${store.id}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        loadBuilder(JSON.parse(draft));
      }
    }
  }, [store, storeId, navigate, loadBuilder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activePageType: 'product' | 'home' = activePage?.slug === '/product' ? 'product' : 'home';
  const availableComponents = useMemo(() => {
    return componentLibrary.filter((component) => {
      if (!component.availableOn) return true;
      return component.availableOn.includes(activePageType);
    });
  }, [activePageType]);

  const componentMap = useMemo(() => {
    const map = new Map(availableComponents.map((component) => [component.type, component]));
    return map;
  }, [availableComponents]);

  const sidebarGroups = useMemo(() => {
    if (activePageType === 'product') {
      const groups: Array<{ label: string; components: typeof availableComponents }> = [
        {
          label: 'Header sections',
          components: ['announcement-bar', 'header'].map((type) => componentMap.get(type as SectionType)).filter(
            (component): component is typeof availableComponents[number] => Boolean(component),
          ),
        },
        {
          label: 'Page sections',
          components: ['product-details', 'product-recommendations', 'text', 'newsletter'].map((type) =>
            componentMap.get(type as SectionType),
          ).filter((component): component is typeof availableComponents[number] => Boolean(component)),
        },
        {
          label: 'Footer sections',
          components: ['footer'].map((type) => componentMap.get(type as SectionType)).filter(
            (component): component is typeof availableComponents[number] => Boolean(component),
          ),
        },
      ];

      return groups.filter((group) => group.components.length > 0);
    }

    return categories
      .map((category) => ({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        components: availableComponents.filter((component) => component.category === category),
      }))
      .filter((group) => group.components.length > 0);
  }, [activePageType, availableComponents, componentMap]);

  const sortedSections = useMemo(() => {
    if (!activePage) return [];
    return [...activePage.sections].sort((a, b) => a.order - b.order);
  }, [activePage]);

  const selectedSection = useMemo(
    () => sortedSections.find((section) => section.id === selectedSectionId) ?? null,
    [sortedSections, selectedSectionId]
  );

  useEffect(() => {
    if (selectedSectionId && !sortedSections.find((section) => section.id === selectedSectionId)) {
      setSelectedSection(null);
    }
  }, [sortedSections, selectedSectionId, setSelectedSection]);

  const handleAddSection = (componentType: string) => {
    const component = componentLibrary.find((c) => c.type === componentType);
    if (!component || !activePage) return;

    const newSection: BuilderSection = {
      id: Math.random().toString(36).slice(2),
      type: component.type,
      order: activePage.sections.length,
      visible: true,
      settings: { ...component.defaultSettings },
      styles: { ...component.defaultStyles },
    };

    addSection(newSection);
    setSelectedSection(newSection.id);
    toast.success(`${component.name} added`);
  };

  const handleSaveDraft = () => {
    if (store) {
      saveDraft(store.id);
    }
  };

  const handlePublish = () => {
    if (store) {
      publishBuilder(store.id);
    }
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedSections.findIndex((section) => section.id === active.id);
      const newIndex = sortedSections.findIndex((section) => section.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedSections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index,
      }));

      reorderSections(reordered);
    },
    [reorderSections, sortedSections]
  );

  const handleToggleVisibility = (sectionId: string) => {
    const section = sortedSections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, { visible: !section.visible });
  };

  const handleRemoveSection = (sectionId: string) => {
    removeSection(sectionId);
    if (selectedSectionId === sectionId) {
      setSelectedSection(null);
    }
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<BuilderSection>) => {
    updateSection(sectionId, updates);
  };

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading store…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Top Toolbar */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to stores
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Store builder</p>
              <h1 className="text-lg font-semibold">{store.storeName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save draft
            </Button>
            <Button size="sm" onClick={handlePublish}>
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Component library */}
        <aside className="w-72 border-r bg-card flex flex-col">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Components</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Click any component to add it to the current page.
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 space-y-6">
              {sidebarGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>{group.label}</span>
                    <Separator className="flex-1 ml-3" />
                  </div>
                  <div className="space-y-2">
                    {group.components.map((component) => (
                      <Button
                        key={component.type}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => handleAddSection(component.type)}
                      >
                        <span className="font-medium">{component.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="px-5 py-4 border-t text-xs text-muted-foreground space-y-1">
            <p>
              Sections: <span className="font-semibold">{sortedSections.length}</span>
            </p>
            <p>Draft saved locally until you publish.</p>
          </div>
        </aside>

        {/* Canvas and preview */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Page preview</h2>
              <p className="text-xs text-muted-foreground">
                {activePage?.name || 'No page selected'} • {sortedSections.length} sections
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={activePage?.id}
                onValueChange={(value) => {
                  setSelectedSection(null);
                  setActivePage(value);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {builder.pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name} {page.isSystemPage ? '(System)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => {
                const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
                return (
                  <Button
                    key={mode}
                    size="sm"
                    variant={previewMode === mode ? 'default' : 'outline'}
                    onClick={() => setPreviewMode(mode)}
                    className={cn(
                      previewMode === mode && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 bg-muted/40 flex justify-center">
            <div
              className={cn(
                'w-full space-y-4 transition-all duration-300',
                previewWidthMap[previewMode]
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{store.storeName}</Badge>
                  <span>Preview mode</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddSection('hero')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add hero
                </Button>
              </div>

              {sortedSections.length > 0 ? (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={sortedSections.map((section) => section.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sortedSections.map((section) => (
                        <DraggableSectionItem
                          key={section.id}
                          section={section}
                          products={products}
                          globalStyles={builder.globalStyles}
                          onEdit={() => setSelectedSection(section.id)}
                          onRemove={handleRemoveSection}
                          onToggleVisibility={handleToggleVisibility}
                          onSelect={() => setSelectedSection(section.id)}
                          isSelected={selectedSectionId === section.id}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="border border-dashed border-muted-foreground/40 rounded-xl bg-background py-16 flex flex-col items-center justify-center text-center">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                      <Plus className="h-3 w-3" />
                      Start building
                    </div>
                    <h3 className="text-xl font-semibold">Add your first section</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Choose a component from the left to start designing your storefront. You can
                      drag to reorder and customize each section.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => handleAddSection('hero')}>
                        Add hero banner
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddSection('product-grid')}
                      >
                        Add product grid
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Inspector */}
        <aside className="w-[360px] border-l bg-card flex flex-col">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Section settings</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Adjust content and styling for the selected section.
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <SectionSettingsPanel
              section={selectedSection}
              onUpdate={(updates) => {
                if (selectedSection) {
                  handleUpdateSection(selectedSection.id, updates);
                }
              }}
              onRemove={() => {
                if (selectedSection) {
                  handleRemoveSection(selectedSection.id);
                }
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

const BuilderDemoPage: React.FC = () => {
  return (
    <BuilderProvider>
      <BuilderDemo />
    </BuilderProvider>
  );
};

export default BuilderDemoPage;
