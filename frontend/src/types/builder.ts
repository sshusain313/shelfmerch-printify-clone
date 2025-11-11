export type SectionType = 
  | 'header'
  | 'hero'
  | 'product-grid'
  | 'product-collection'
  | 'text'
  | 'image'
  | 'video'
  | 'newsletter'
  | 'testimonials'
  | 'footer'
  | 'custom-html'
  | 'announcement-bar'
  | 'product-details'
  | 'product-recommendations';

export interface BuilderSection {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  settings: Record<string, any>;
  styles: {
    backgroundColor?: string;
    backgroundImage?: string;
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    margin?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    textAlign?: 'left' | 'center' | 'right';
    maxWidth?: string;
    [key: string]: any;
  };
}

export interface StorePage {
  id: string;
  name: string;
  slug: string;
  sections: BuilderSection[];
  isSystemPage: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  cardStyle: 'elevated' | 'outlined' | 'flat';
  spacing: 'compact' | 'normal' | 'spacious';
}

export interface StoreBuilder {
  version: string;
  pages: StorePage[];
  activePageId: string;
  globalStyles: GlobalStyles;
  customCSS?: string;
  draft?: boolean;
  lastSaved?: string;
}

export interface BuilderHistory {
  past: StoreBuilder[];
  present: StoreBuilder;
  future: StoreBuilder[];
}

export interface ComponentDefinition {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: 'layout' | 'content' | 'commerce' | 'marketing';
  defaultSettings: Record<string, any>;
  defaultStyles: BuilderSection['styles'];
  availableOn?: Array<'home' | 'product'>;
}

export type PreviewMode = 'desktop' | 'tablet' | 'mobile';

export type BuilderAction = 
  | { type: 'ADD_SECTION'; section: BuilderSection; pageId: string }
  | { type: 'REMOVE_SECTION'; sectionId: string; pageId: string }
  | { type: 'UPDATE_SECTION'; sectionId: string; updates: Partial<BuilderSection>; pageId: string }
  | { type: 'REORDER_SECTIONS'; pageId: string; sections: BuilderSection[] }
  | { type: 'UPDATE_GLOBAL_STYLES'; styles: Partial<GlobalStyles> }
  | { type: 'ADD_PAGE'; page: StorePage }
  | { type: 'REMOVE_PAGE'; pageId: string }
  | { type: 'UPDATE_PAGE'; pageId: string; updates: Partial<StorePage> }
  | { type: 'SET_ACTIVE_PAGE'; pageId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_BUILDER'; builder: StoreBuilder };
