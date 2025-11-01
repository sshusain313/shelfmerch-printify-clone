import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { StoreBuilder, BuilderHistory, BuilderAction, BuilderSection, StorePage, GlobalStyles, PreviewMode } from '@/types/builder';
import { createDefaultBuilder } from '@/lib/builderComponents';
import { toast } from 'sonner';

interface BuilderContextType {
  builder: StoreBuilder;
  history: BuilderHistory;
  previewMode: PreviewMode;
  selectedSectionId: string | null;
  canUndo: boolean;
  canRedo: boolean;
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
  saveDraft: (storeId: string) => void;
  publishBuilder: (storeId: string) => void;
  loadBuilder: (builder: StoreBuilder) => void;
  resetBuilder: () => void;
  getActivePage: () => StorePage | undefined;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const MAX_HISTORY = 50;

function builderReducer(history: BuilderHistory, action: BuilderAction): BuilderHistory {
  const { past, present, future } = history;

  switch (action.type) {
    case 'ADD_SECTION': {
      const newBuilder = { ...present };
      const pageIndex = newBuilder.pages.findIndex((p) => p.id === action.pageId);
      if (pageIndex >= 0) {
        newBuilder.pages[pageIndex].sections.push(action.section);
      }
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: newBuilder,
        future: [],
      };
    }

    case 'REMOVE_SECTION': {
      const newBuilder = { ...present };
      const pageIndex = newBuilder.pages.findIndex((p) => p.id === action.pageId);
      if (pageIndex >= 0) {
        newBuilder.pages[pageIndex].sections = newBuilder.pages[pageIndex].sections.filter(
          (s) => s.id !== action.sectionId
        );
      }
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: newBuilder,
        future: [],
      };
    }

    case 'UPDATE_SECTION': {
      const newBuilder = { ...present };
      const pageIndex = newBuilder.pages.findIndex((p) => p.id === action.pageId);
      if (pageIndex >= 0) {
        const sectionIndex = newBuilder.pages[pageIndex].sections.findIndex(
          (s) => s.id === action.sectionId
        );
        if (sectionIndex >= 0) {
          newBuilder.pages[pageIndex].sections[sectionIndex] = {
            ...newBuilder.pages[pageIndex].sections[sectionIndex],
            ...action.updates,
          };
        }
      }
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: newBuilder,
        future: [],
      };
    }

    case 'REORDER_SECTIONS': {
      const newBuilder = { ...present };
      const pageIndex = newBuilder.pages.findIndex((p) => p.id === action.pageId);
      if (pageIndex >= 0) {
        newBuilder.pages[pageIndex].sections = action.sections.map((s, idx) => ({
          ...s,
          order: idx,
        }));
      }
      return {
        past: [...past.slice(-MAX_HISTORY + 1), present],
        present: newBuilder,
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
    present: createDefaultBuilder(),
    future: [],
  });

  const [previewMode, setPreviewMode] = React.useState<PreviewMode>('desktop');
  const [selectedSectionId, setSelectedSection] = React.useState<string | null>(null);

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
    (storeId: string) => {
      const draftKey = `store_builder_draft_${storeId}`;
      localStorage.setItem(draftKey, JSON.stringify({ ...builder, draft: true, lastSaved: new Date().toISOString() }));
      toast.success('Draft saved!');
    },
    [builder]
  );

  const publishBuilder = useCallback(
    (storeId: string) => {
      // Find the store by searching all store keys
      // (Stores are saved with store_${userId} key, but we have store.id)
      const allKeys = Object.keys(localStorage).filter((key) => key.startsWith('store_'));
      
      for (const key of allKeys) {
        const storeData = localStorage.getItem(key);
        if (storeData) {
          const store = JSON.parse(storeData);
          // Match by store.id
          if (store.id === storeId) {
            // Update store with builder data
            store.builder = { ...builder, draft: false, lastSaved: new Date().toISOString() };
            store.useBuilder = true;
            store.updatedAt = new Date().toISOString();
            
            // Save using the correct key (store_${userId})
            const correctKey = `store_${store.userId}`;
            localStorage.setItem(correctKey, JSON.stringify(store));

            // Clear draft
            localStorage.removeItem(`store_builder_draft_${storeId}`);

            // Dispatch update event
            window.dispatchEvent(
              new CustomEvent('shelfmerch-data-update', {
                detail: { type: 'store', data: store },
              })
            );

            toast.success('Store published!');
            return;
          }
        }
      }
      
      toast.error('Store not found');
    },
    [builder]
  );

  const loadBuilder = useCallback((builderData: StoreBuilder) => {
    dispatch({ type: 'LOAD_BUILDER', builder: builderData });
  }, []);

  const resetBuilder = useCallback(() => {
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
