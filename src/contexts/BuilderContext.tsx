import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { StoreBuilder, BuilderHistory, BuilderAction, BuilderSection, StorePage, GlobalStyles, PreviewMode } from '@/types/builder';
import { createDefaultBuilder } from '@/lib/builderComponents';
import { builderApi } from '@/lib/api';
import { toast } from 'sonner';

interface BuilderContextType {
  builder: StoreBuilder;
  history: BuilderHistory;
  previewMode: PreviewMode;
  selectedSectionId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isLoading: boolean;
  dispatch: (action: BuilderAction) => void;
  addSection: (section: BuilderSection, pageId?: string) => void;
  removeSection: (sectionId: string, pageId?: string) => void;
  updateSection: (sectionId: string, updates: Partial<BuilderSection>, pageId?: string) => void;
  reorderSections: (sections: BuilderSection[], pageId?: string) => void;
  updateGlobalStyles: (styles: Partial<GlobalStyles>) => void;
  addPage: (page: Omit<StorePage, 'id'>) => void;
  removePage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<StorePage>) => void;
  setActivePage: (pageId: string) => void;
  setSelectedSection: (sectionId: string | null) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  undo: () => void;
  redo: () => void;
  saveDraft: (storeId: string) => Promise<void>;
  publishBuilder: (storeId: string) => Promise<void>;
  loadBuilder: (builder: StoreBuilder) => void;
  loadFromBackend: (storeId: string) => Promise<void>;
  resetBuilder: (storeId?: string) => Promise<void>;
  getActivePage: () => StorePage | undefined;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const MAX_HISTORY = 50;

const ensureSystemPages = (builderData: StoreBuilder): StoreBuilder => {
  const pages = [...builderData.pages];

  const ensurePage = (slug: string, name: string) => {
    const existing = pages.find((page) => page.slug === slug);
    if (!existing) {
      pages.push({
        id: `${slug.replace(/\W+/g, '')}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        slug,
        isSystemPage: true,
        sections: [],
      });
    }
  };

  ensurePage('/', 'Home');
  ensurePage('/product', 'Product Page');

  const activePageId =
    builderData.activePageId && pages.some((page) => page.id === builderData.activePageId)
      ? builderData.activePageId
      : pages[0]?.id;

  return {
    ...builderData,
    pages,
    activePageId,
  };
};

function builderReducer(history: BuilderHistory, action: BuilderAction): BuilderHistory {
  const { past, present, future } = history;

  switch (action.type) {
    case 'ADD_SECTION': {
      const newPages = present.pages.map((page) =>
        page.id === action.pageId
          ? {
              ...page,
              sections: [...page.sections, action.section],
            }
          : page
      );
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: {
          ...present,
          pages: newPages,
        },
        future: [],
      };
    }

    case 'REMOVE_SECTION': {
      const newPages = present.pages.map((page) =>
        page.id === action.pageId
          ? {
              ...page,
              sections: page.sections.filter((section) => section.id !== action.sectionId),
            }
          : page
      );
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: {
          ...present,
          pages: newPages,
        },
        future: [],
      };
    }

    case 'UPDATE_SECTION': {
      const newPages = present.pages.map((page) =>
        page.id === action.pageId
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === action.sectionId
                  ? { ...section, ...action.updates }
                  : section
              ),
            }
          : page
      );
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: {
          ...present,
          pages: newPages,
        },
        future: [],
      };
    }

    case 'REORDER_SECTIONS': {
      const newPages = present.pages.map((page) =>
        page.id === action.pageId
          ? {
              ...page,
              sections: action.sections.map((section, index) => ({
                ...section,
                order: index,
              })),
            }
          : page
      );
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: {
          ...present,
          pages: newPages,
        },
        future: [],
      };
    }

    case 'UPDATE_GLOBAL_STYLES': {
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: {
          ...present,
          globalStyles: { ...present.globalStyles, ...action.styles },
        },
        future: [],
      };
    }

    case 'ADD_PAGE': {
      const newPage: StorePage = {
        ...action.page,
        id: Math.random().toString(36).substr(2, 9),
      };
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: {
          ...present,
          pages: [...present.pages, newPage],
          activePageId: newPage.id,
        },
        future: [],
      };
    }

    case 'REMOVE_PAGE': {
      const newBuilder = { ...present };
      newBuilder.pages = newBuilder.pages.filter((p) => p.id !== action.pageId);
      // If removing active page, switch to first page
      if (newBuilder.activePageId === action.pageId && newBuilder.pages.length > 0) {
        newBuilder.activePageId = newBuilder.pages[0].id;
      }
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: newBuilder,
        future: [],
      };
    }

    case 'UPDATE_PAGE': {
      const newBuilder = { ...present };
      const pageIndex = newBuilder.pages.findIndex((p) => p.id === action.pageId);
      if (pageIndex >= 0) {
        newBuilder.pages[pageIndex] = { ...newBuilder.pages[pageIndex], ...action.updates };
      }
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: newBuilder,
        future: [],
      };
    }

    case 'SET_ACTIVE_PAGE': {
      return {
        past,
        present: { ...present, activePageId: action.pageId },
        future,
      };
    }

    case 'UNDO': {
      if (past.length === 0) return history;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    }

    case 'REDO': {
      if (future.length === 0) return history;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    }

    case 'LOAD_BUILDER': {
      return {
        past: [],
        present: action.builder,
        future: [],
      };
    }

    default:
      return history;
  }
}

export const BuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, dispatch] = useReducer(builderReducer, {
    past: [],
    present: ensureSystemPages(createDefaultBuilder()),
    future: [],
  });

  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [selectedSectionId, setSelectedSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const builder = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const addSection = useCallback(
    (section: BuilderSection, pageId?: string) => {
      dispatch({
        type: 'ADD_SECTION',
        section,
        pageId: pageId || builder.activePageId,
      });
    },
    [builder.activePageId]
  );

  const removeSection = useCallback(
    (sectionId: string, pageId?: string) => {
      dispatch({
        type: 'REMOVE_SECTION',
        sectionId,
        pageId: pageId || builder.activePageId,
      });
    },
    [builder.activePageId]
  );

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<BuilderSection>, pageId?: string) => {
      dispatch({
        type: 'UPDATE_SECTION',
        sectionId,
        updates,
        pageId: pageId || builder.activePageId,
      });
    },
    [builder.activePageId]
  );

  const reorderSections = useCallback(
    (sections: BuilderSection[], pageId?: string) => {
      dispatch({
        type: 'REORDER_SECTIONS',
        sections,
        pageId: pageId || builder.activePageId,
      });
    },
    [builder.activePageId]
  );

  const updateGlobalStyles = useCallback((styles: Partial<GlobalStyles>) => {
    dispatch({ type: 'UPDATE_GLOBAL_STYLES', styles });
  }, []);

  const addPage = useCallback((page: Omit<StorePage, 'id'>) => {
    dispatch({ type: 'ADD_PAGE', page: page as StorePage });
  }, []);

  const removePage = useCallback((pageId: string) => {
    dispatch({ type: 'REMOVE_PAGE', pageId });
  }, []);

  const updatePage = useCallback((pageId: string, updates: Partial<StorePage>) => {
    dispatch({ type: 'UPDATE_PAGE', pageId, updates });
  }, []);

  const setActivePage = useCallback((pageId: string) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', pageId });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const saveDraft = useCallback(
    async (storeId: string) => {
      if (isSaving) return;
      
      try {
        setIsSaving(true);
        
        // Save to backend
        const response = await builderApi.saveDraft(storeId, builder);
        
        if (response.success) {
          // Also save to localStorage as backup for offline resilience
          const draftKey = `store_builder_draft_${storeId}`;
          localStorage.setItem(draftKey, JSON.stringify({ ...builder, draft: true, lastSaved: new Date().toISOString() }));
          
          toast.success('Draft saved!');
        } else {
          throw new Error('Failed to save draft');
        }
      } catch (error: any) {
        console.error('Error saving draft:', error);
        
        // Fallback: save to localStorage only
        const draftKey = `store_builder_draft_${storeId}`;
        localStorage.setItem(draftKey, JSON.stringify({ ...builder, draft: true, lastSaved: new Date().toISOString() }));
        
        toast.warning('Saved locally (offline mode)');
      } finally {
        setIsSaving(false);
      }
    },
    [builder, isSaving]
  );

  const publishBuilder = useCallback(
    async (storeId: string) => {
      if (isPublishing) return;
      
      try {
        setIsPublishing(true);
        
        // Publish to backend
        const response = await builderApi.publish(storeId, builder);
        
        if (response.success) {
          // Clear local draft
          localStorage.removeItem(`store_builder_draft_${storeId}`);
          
          // Dispatch update event for any listeners
          window.dispatchEvent(
            new CustomEvent('shelfmerch-data-update', {
              detail: { 
                type: 'store-builder-published', 
                storeId,
                data: response.data 
              },
            })
          );
          
          toast.success('Store published!');
        } else {
          throw new Error('Failed to publish');
        }
      } catch (error: any) {
        console.error('Error publishing builder:', error);
        toast.error(error?.message || 'Failed to publish store');
      } finally {
        setIsPublishing(false);
      }
    },
    [builder, isPublishing]
  );

  const loadFromBackend = useCallback(
    async (storeId: string) => {
      try {
        setIsLoading(true);
        
        // Try to load from backend first
        const response = await builderApi.get(storeId);
        
        if (response.success && response.data) {
          dispatch({ type: 'LOAD_BUILDER', builder: ensureSystemPages(response.data) });
          return;
        }
        
        // Fallback: check localStorage for draft
        const draftKey = `store_builder_draft_${storeId}`;
        const localDraft = localStorage.getItem(draftKey);
        
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            dispatch({ type: 'LOAD_BUILDER', builder: ensureSystemPages(parsed) });
            toast.info('Loaded local draft');
            return;
          } catch (e) {
            console.error('Failed to parse local draft:', e);
          }
        }
        
        // If nothing found, use default builder
        dispatch({ type: 'LOAD_BUILDER', builder: createDefaultBuilder() });
      } catch (error: any) {
        console.error('Error loading builder from backend:', error);
        
        // Fallback: check localStorage for draft
        const draftKey = `store_builder_draft_${storeId}`;
        const localDraft = localStorage.getItem(draftKey);
        
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            dispatch({ type: 'LOAD_BUILDER', builder: ensureSystemPages(parsed) });
            toast.warning('Loaded from local cache (offline mode)');
            return;
          } catch (e) {
            console.error('Failed to parse local draft:', e);
          }
        }
        
        toast.error('Failed to load builder');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadBuilder = useCallback((builderData: StoreBuilder) => {
    dispatch({ type: 'LOAD_BUILDER', builder: ensureSystemPages(builderData) });
  }, []);

  const resetBuilder = useCallback(async (storeId?: string) => {
    if (storeId) {
      try {
        // Reset on backend
        const response = await builderApi.reset(storeId);
        
        if (response.success) {
          dispatch({ type: 'LOAD_BUILDER', builder: ensureSystemPages(response.data || createDefaultBuilder()) });
          localStorage.removeItem(`store_builder_draft_${storeId}`);
          toast.success('Builder reset to default');
          return;
        }
      } catch (error: any) {
        console.error('Error resetting builder:', error);
        toast.error('Failed to reset builder');
      }
    }
    
    // Local reset only
    dispatch({ type: 'LOAD_BUILDER', builder: createDefaultBuilder() });
  }, []);

  const getActivePage = useCallback(() => {
    return builder.pages.find((p) => p.id === builder.activePageId);
  }, [builder.pages, builder.activePageId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <BuilderContext.Provider
      value={{
        builder,
        history,
        previewMode,
        selectedSectionId,
        canUndo,
        canRedo,
        isSaving,
        isPublishing,
        isLoading,
        dispatch,
        addSection,
        removeSection,
        updateSection,
        reorderSections,
        updateGlobalStyles,
        addPage,
        removePage,
        updatePage,
        setActivePage,
        setSelectedSection,
        setPreviewMode,
        undo,
        redo,
        saveDraft,
        publishBuilder,
        loadBuilder,
        loadFromBackend,
        resetBuilder,
        getActivePage,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
};
