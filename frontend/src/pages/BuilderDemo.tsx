import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SectionRenderer from '@/components/builder/SectionRenderer';
import { useData } from '@/contexts/DataContext';
import { componentLibrary } from '@/lib/builderComponents';
import { BuilderSection } from '@/types/builder';
import { Undo2, Redo2, Save, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BuilderDemo: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { store, products } = useData();
  const {
    builder,
    getActivePage,
    addSection,
    removeSection,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDraft,
    publishBuilder,
    loadBuilder,
  } = useBuilder();

  const activePage = getActivePage();

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

  const handleSaveDraft = () => {
    if (store) {
      saveDraft(store.id);
    }
  };

  const handlePublish = () => {
    if (store) {
      publishBuilder(store.id);
      toast.success('Store published! View it at /store/' + store.subdomain);
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
    <div className="min-h-screen bg-background">
      {/* Top Toolbar */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Stores
              </Button>
              <div className="border-l pl-4">
                <h1 className="font-semibold">{store.storeName} - Builder Demo</h1>
                <p className="text-xs text-muted-foreground">
                  {activePage?.name || 'No page selected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
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

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Component Library Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <h2 className="font-bold mb-4">Components</h2>
              <div className="space-y-2">
                {componentLibrary.map((component) => (
                  <Button
                    key={component.type}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => handleAddSection(component.type)}
                  >
                    {component.name}
                  </Button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-sm mb-2">Quick Stats</h3>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>Sections: {activePage?.sections.length || 0}</p>
                  <p>Can Undo: {canUndo ? 'Yes' : 'No'}</p>
                  <p>Can Redo: {canRedo ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Canvas/Preview */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Preview</h2>
                <div className="text-sm text-muted-foreground">
                  {activePage?.sections.length || 0} sections
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-white">
                {activePage && activePage.sections.length > 0 ? (
                  <div>
                    {activePage.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <div key={section.id} className="relative group">
                          <SectionRenderer
                            section={section}
                            products={products}
                            globalStyles={builder.globalStyles}
                            isPreview
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeSection(section.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      No sections yet. Click a component from the sidebar to get started!
                    </p>
                    <Button onClick={() => handleAddSection('hero')}>
                      Add Hero Section
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold mb-2">🎨 Builder Foundation - Testing Instructions</h3>
          <div className="text-sm space-y-2">
            <p>
              <strong>What's Working:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>✅ Click components in sidebar to add sections</li>
              <li>✅ Hover over sections and click "Remove" to delete</li>
              <li>✅ Use Undo/Redo buttons (or Cmd/Ctrl+Z, Cmd/Ctrl+Y)</li>
              <li>✅ Save Draft - stores in localStorage</li>
              <li>✅ Publish - updates store with builder data</li>
              <li>✅ All 11 section types render with default settings</li>
            </ul>
            <p className="mt-4">
              <strong>What's Next (Phase 2):</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>🔜 Drag-and-drop reordering</li>
              <li>🔜 Click sections to edit settings</li>
              <li>🔜 Global style controls</li>
              <li>🔜 Page management</li>
              <li>🔜 Preview modes (desktop/tablet/mobile)</li>
              <li>🔜 Onboarding tooltips</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Wrapper with BuilderProvider
const BuilderDemoPage: React.FC = () => {
  return (
    <BuilderProvider>
      <BuilderDemo />
    </BuilderProvider>
  );
};

export default BuilderDemoPage;
