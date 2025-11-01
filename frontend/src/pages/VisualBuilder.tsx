import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableSectionItem from '@/components/builder/DraggableSectionItem';
import SectionEditor from '@/components/builder/SectionEditor';
import StyleControls from '@/components/builder/StyleControls';
import { componentLibrary } from '@/lib/builderComponents';
import { BuilderSection } from '@/types/builder';
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
  Paintbrush,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

const VisualBuilderContent: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { store, products } = useData();
  const {
    builder,
    getActivePage,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDraft,
    publishBuilder,
    loadBuilder,
    updateGlobalStyles,
    previewMode,
    setPreviewMode,
    selectedSectionId,
    setSelectedSection,
  } = useBuilder();

  const [editingSection, setEditingSection] = useState<BuilderSection | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'components' | 'styles'>('components');

  const activePage = getActivePage();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!store || store.userId !== storeId) {
      toast.error('Store not found');
      navigate('/stores');
      return;
    }

    // Load existing builder data if available
    if (store.builder) {
      loadBuilder(store.builder);
    } else {
      // Check for draft
      const draftKey = `store_builder_draft_${store.id}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        loadBuilder(JSON.parse(draft));
        toast.info('Draft loaded');
      }
    }
  }, [store, storeId, navigate, loadBuilder]);

  const handleAddSection = (componentType: string) => {
    const component = componentLibrary.find((c) => c.type === componentType);
    if (!component) return;

    const newSection: BuilderSection = {
      id: Math.random().toString(36).substr(2, 9),
      type: component.type,
      order: activePage?.sections.length || 0,
      visible: true,
      settings: { ...component.defaultSettings },
      styles: { ...component.defaultStyles },
    };

    addSection(newSection);
    toast.success(`${component.name} added!`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && activePage) {
      const oldIndex = activePage.sections.findIndex((s) => s.id === active.id);
      const newIndex = activePage.sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(activePage.sections, oldIndex, newIndex);
      reorderSections(newSections);
      toast.success('Section reordered');
    }
  };

  const handleEditSection = (section: BuilderSection) => {
    setEditingSection(section);
  };

  const handleSaveSection = (updates: Partial<BuilderSection>) => {
    if (editingSection) {
      updateSection(editingSection.id, updates);
      toast.success('Section updated!');
    }
  };

  const handleToggleVisibility = (sectionId: string) => {
    const section = activePage?.sections.find((s) => s.id === sectionId);
    if (section) {
      updateSection(sectionId, { visible: !section.visible });
      toast.success(section.visible ? 'Section hidden' : 'Section visible');
    }
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

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="border-l pl-4">
                <h1 className="font-semibold">{store.storeName}</h1>
                <p className="text-xs text-muted-foreground">Visual Builder</p>
              </div>
            </div>

            {/* Center - Preview Mode Toggles */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="sm"
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} title="Redo (Cmd+Y)">
                <Redo2 className="h-4 w-4" />
              </Button>
              <div className="border-l pl-2 ml-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button size="sm" onClick={handlePublish}>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
              <TabsTrigger value="components">
                <Layers className="h-4 w-4 mr-2" />
                Components
              </TabsTrigger>
              <TabsTrigger value="styles">
                <Paintbrush className="h-4 w-4 mr-2" />
                Styles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="flex-1 m-0 mt-4">
              <ScrollArea className="h-full px-4">
                <div className="space-y-2 pb-4">
                  <h3 className="text-sm font-semibold mb-3">Add Components</h3>
                  {componentLibrary.map((component) => (
                    <Button
                      key={component.type}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAddSection(component.type)}
                    >
                      <div className="flex items-start gap-3 text-left">
                        <Plus className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{component.name}</p>
                          <p className="text-xs text-muted-foreground">{component.description}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="styles" className="flex-1 m-0 mt-4">
              <ScrollArea className="h-full px-4">
                <div className="pb-4">
                  <StyleControls styles={builder.globalStyles} onUpdate={updateGlobalStyles} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="h-full flex items-start justify-center p-8">
            <div
              className="bg-white shadow-2xl transition-all duration-300"
              style={{
                width: getPreviewWidth(),
                minHeight: '100%',
              }}
            >
              {activePage && activePage.sections.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={activePage.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="min-h-full">
                      {activePage.sections
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
                          <DraggableSectionItem
                            key={section.id}
                            section={section}
                            products={products}
                            globalStyles={builder.globalStyles}
                            onEdit={handleEditSection}
                            onRemove={(id) => {
                              removeSection(id);
                              toast.success('Section removed');
                            }}
                            onToggleVisibility={handleToggleVisibility}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="h-full flex items-center justify-center p-12">
                  <Card className="p-8 text-center max-w-md">
                    <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">Start Building Your Store</h3>
                    <p className="text-muted-foreground mb-6">
                      Add sections from the sidebar to create your custom storefront. Drag to reorder, click to edit.
                    </p>
                    <Button onClick={() => setSidebarTab('components')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Section
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Editor Modal */}
      <SectionEditor
        open={!!editingSection}
        onClose={() => setEditingSection(null)}
        section={editingSection}
        onSave={handleSaveSection}
      />
    </div>
  );
};

// Wrapper with BuilderProvider
const VisualBuilder: React.FC = () => {
  return (
    <BuilderProvider>
      <VisualBuilderContent />
    </BuilderProvider>
  );
};

export default VisualBuilder;
