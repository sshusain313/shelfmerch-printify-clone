import { ComponentDefinition } from '@/types/builder';

export const componentLibrary: ComponentDefinition[] = [
  {
    type: 'header',
    name: 'Header',
    description: 'Navigation bar with logo and menu',
    icon: 'LayoutHeader',
    category: 'layout',
    defaultSettings: {
      logo: '',
      storeName: 'My Store',
      showSearch: true,
      menuItems: [
        { label: 'Home', link: '/' },
        { label: 'Products', link: '/products' },
        { label: 'About', link: '/about' },
      ],
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 16, right: 32, bottom: 16, left: 32 },
    },
  },
  {
    type: 'hero',
    name: 'Hero Banner',
    description: 'Large banner with heading and call-to-action',
    icon: 'Image',
    category: 'content',
    defaultSettings: {
      heading: 'Welcome to Our Store',
      subheading: 'Discover amazing products',
      buttonText: 'Shop Now',
      buttonLink: '#products',
      backgroundImage: '',
      alignment: 'center',
    },
    defaultStyles: {
      backgroundColor: '#f3f4f6',
      padding: { top: 80, right: 32, bottom: 80, left: 32 },
      textAlign: 'center',
    },
  },
  {
    type: 'product-grid',
    name: 'Product Grid',
    description: 'Display products in a grid layout',
    icon: 'Grid3x3',
    category: 'commerce',
    defaultSettings: {
      heading: 'Featured Products',
      columns: 4,
      showAll: true,
      productIds: [],
      showPrice: true,
      showAddToCart: true,
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 64, right: 32, bottom: 64, left: 32 },
    },
  },
  {
    type: 'product-collection',
    name: 'Product Collection',
    description: 'Curated collection of products',
    icon: 'LayoutGrid',
    category: 'commerce',
    defaultSettings: {
      heading: 'Shop by Collection',
      description: 'Explore our curated collections',
      collections: [],
      layout: 'grid',
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 64, right: 32, bottom: 64, left: 32 },
    },
  },
  {
    type: 'text',
    name: 'Text Block',
    description: 'Rich text content with formatting',
    icon: 'Type',
    category: 'content',
    defaultSettings: {
      heading: 'About Us',
      content: '<p>Tell your story here. Add your brand message and connect with customers.</p>',
      alignment: 'left',
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 48, right: 32, bottom: 48, left: 32 },
    },
  },
  {
    type: 'image',
    name: 'Image Gallery',
    description: 'Single image or image gallery',
    icon: 'ImageIcon',
    category: 'content',
    defaultSettings: {
      images: [],
      layout: 'single',
      aspectRatio: '16:9',
      caption: '',
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 32, right: 32, bottom: 32, left: 32 },
    },
  },
  {
    type: 'video',
    name: 'Video Embed',
    description: 'Embed YouTube, Vimeo, or custom video',
    icon: 'Video',
    category: 'content',
    defaultSettings: {
      videoUrl: '',
      provider: 'youtube',
      autoplay: false,
      controls: true,
      aspectRatio: '16:9',
    },
    defaultStyles: {
      backgroundColor: '#000000',
      padding: { top: 48, right: 32, bottom: 48, left: 32 },
    },
  },
  {
    type: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Email capture form',
    icon: 'Mail',
    category: 'marketing',
    defaultSettings: {
      heading: 'Stay Updated',
      description: 'Subscribe to get special offers and updates',
      buttonText: 'Subscribe',
      placeholder: 'Enter your email',
      successMessage: 'Thanks for subscribing!',
    },
    defaultStyles: {
      backgroundColor: '#f9fafb',
      padding: { top: 64, right: 32, bottom: 64, left: 32 },
      textAlign: 'center',
    },
  },
  {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and testimonials',
    icon: 'MessageSquare',
    category: 'marketing',
    defaultSettings: {
      heading: 'What Our Customers Say',
      testimonials: [
        {
          name: 'John Doe',
          rating: 5,
          text: 'Amazing products and great service!',
          avatar: '',
        },
      ],
      layout: 'carousel',
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 64, right: 32, bottom: 64, left: 32 },
    },
  },
  {
    type: 'footer',
    name: 'Footer',
    description: 'Footer with links and information',
    icon: 'LayoutFooter',
    category: 'layout',
    defaultSettings: {
      sections: [
        {
          title: 'Shop',
          links: [
            { label: 'All Products', url: '/products' },
            { label: 'New Arrivals', url: '/new' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: 'Contact Us', url: '/contact' },
            { label: 'FAQ', url: '/faq' },
          ],
        },
      ],
      copyright: '© 2025 Your Store. All rights reserved.',
      socialLinks: [],
    },
    defaultStyles: {
      backgroundColor: '#1f2937',
      padding: { top: 48, right: 32, bottom: 32, left: 32 },
    },
  },
  {
    type: 'custom-html',
    name: 'Custom HTML',
    description: 'Add custom HTML code',
    icon: 'Code',
    category: 'content',
    defaultSettings: {
      html: '<div><p>Add your custom HTML here</p></div>',
    },
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: { top: 32, right: 32, bottom: 32, left: 32 },
    },
  },
];

export const getComponentDefinition = (type: string): ComponentDefinition | undefined => {
  return componentLibrary.find((comp) => comp.type === type);
};

export const defaultGlobalStyles = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  buttonStyle: 'rounded' as const,
  cardStyle: 'elevated' as const,
  spacing: 'normal' as const,
};

export const createDefaultBuilder = (): StoreBuilder => ({
  version: '1.0',
  pages: [
    {
      id: 'home',
      name: 'Home',
      slug: '/',
      isSystemPage: true,
      sections: [],
    },
  ],
  activePageId: 'home',
  globalStyles: defaultGlobalStyles,
  draft: true,
});
