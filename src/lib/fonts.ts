
export interface Font {
    family: string;
    category: string;
    variants: string[];
    subsets: string[];
    version: string;
    lastModified: string;
    files: Record<string, string>;
    kind: string;
}

export const FONT_CATEGORIES = [
    'Display',
    'Handwriting',
    'Monospace',
    'Sans-serif',
    'Serif',
] as const;

export type FontCategory = typeof FONT_CATEGORIES[number];

// Mock list of popular Google Fonts
export const POPULAR_FONTS: Font[] = [
    {
        family: 'ABeeZee',
        category: 'sans-serif',
        variants: ['regular', 'italic'],
        subsets: ['latin'],
        version: 'v22',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Abel',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v18',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE6VhLPJp6qGI.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Abhaya Libre',
        category: 'serif',
        variants: ['regular', '500', '600', '700', '800'],
        subsets: ['latin', 'sinhala'],
        version: 'v13',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/abhayalibre/v13/e3tmeuGtX-Co5MNzeAOqinEge0PWovdU4w.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Abril Fatface',
        category: 'display',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext'],
        version: 'v19',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/abrilfatface/v19/zOL64pLDlL1D99S8g8PtiKchm-BsjOLhZGY.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Acme',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v21',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/acme/v21/RrQfboBx-C5_bx3Lb23lzLk.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Actor',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v17',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/actor/v17/wEOzEBbCkc5cO3ekXygtUMIO.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Adamina',
        category: 'serif',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v18',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/adamina/v18/j8_r6-DH1sqP2zh-02coqg.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Advent Pro',
        category: 'sans-serif',
        variants: ['regular', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'greek'],
        version: 'v21',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/adventpro/v21/V8mDoQfxVT4Dvddr_yOwjVmtLZxcBtItFw.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Aladin',
        category: 'handwriting',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext'],
        version: 'v18',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/aladin/v18/ZgNSjPJFPrvJV5f16Df4.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Alata',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v11',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/alata/v11/PbytFmJtVnF7X9U.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Alex Brush',
        category: 'handwriting',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext'],
        version: 'v22',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/alexbrush/v22/SZc83FzrJKuqFbwMKk6EtUL57DtOmCc.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Alfa Slab One',
        category: 'display',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v16',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/alfaslabone/v16/6NUQ8FmM5DCryD-zKCwn7boO_v-s5Hw.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Alice',
        category: 'serif',
        variants: ['regular'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
        version: 'v20',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/alice/v20/OpNCnoEEmtHa6FcJpA.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Anton',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v25',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K0.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Archivo Black',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext'],
        version: 'v17',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/archivoblack/v17/HTxqL289NzCGg4MzN6KJ7eW6CYyF-g.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Arial',
        category: 'sans-serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v1',
        lastModified: '2023-09-21',
        files: { regular: '' }, // System font
        kind: 'webfonts#webfont'
    },
    {
        family: 'Bangers',
        category: 'display',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v20',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/bangers/v20/FeVQS0BTqb0h60ACL5k.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Bebas Neue',
        category: 'display',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext'],
        version: 'v9',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/bebasneue/v9/JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Cabin',
        category: 'sans-serif',
        variants: ['regular', 'italic', '500', '600', '700'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v26',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/cabin/v26/u-4X0qWljRw-PfU81xCJNc8.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Caveat',
        category: 'handwriting',
        variants: ['regular', '500', '600', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
        version: 'v17',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/caveat/v17/Wnz6HAc5bAfYB2Q7ZjDgMw.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Cinzel',
        category: 'serif',
        variants: ['regular', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'latin-ext'],
        version: 'v19',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/cinzel/v19/8vIJ7ww63mVu7gt78Uk.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Comfortaa',
        category: 'display',
        variants: ['regular', '300', '500', '600', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'],
        version: 'v40',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/comfortaa/v40/1Pt_g8LJRfWJmhDAuUsSQamb1W0.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Comic Neue',
        category: 'handwriting',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v8',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/comicneue/v8/4UaHrEJDsxBrF37gZ_FqEA.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Courier New',
        category: 'monospace',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v1',
        lastModified: '2023-09-21',
        files: { regular: '' }, // System font
        kind: 'webfonts#webfont'
    },
    {
        family: 'Dancing Script',
        category: 'handwriting',
        variants: ['regular', '500', '600', '700'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v24',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/dancingscript/v24/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Droid Sans',
        category: 'sans-serif',
        variants: ['regular', '700'],
        subsets: ['latin'],
        version: 'v18',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/droidsans/v18/SlGWmQ6kg7HAbF1W3Ao.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Droid Serif',
        category: 'serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v19',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/droidserif/v19/tDbI2o2404EvIc497sl_sA.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'EB Garamond',
        category: 'serif',
        variants: ['regular', 'italic', '500', '600', '700', '800'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'vietnamese'],
        version: 'v26',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/ebgaramond/v26/SlGDmQSNjdsmc35JDF1K5E55yQ.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Exo 2',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v20',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/exo2/v20/7cH1v4okm5zmbhtOD56W.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Fjalla One',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext'],
        version: 'v15',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/fjallaone/v15/Yq6R-L391-bo_nRpC5Iz.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Francois One',
        category: 'sans-serif',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v21',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/francoisone/v21/_Xmr-H4zsqg2sOQZk5I.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Georgia',
        category: 'serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v1',
        lastModified: '2023-09-21',
        files: { regular: '' }, // System font
        kind: 'webfonts#webfont'
    },
    {
        family: 'Great Vibes',
        category: 'handwriting',
        variants: ['regular'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v14',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/greatvibes/v14/RWm99F8YmP_hO-D7yO3f5g.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Heebo',
        category: 'sans-serif',
        variants: ['regular', '100', '200', '300', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'hebrew'],
        version: 'v22',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/heebo/v22/NGSpv5_NC0k9P9H0.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Helvetica',
        category: 'sans-serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v1',
        lastModified: '2023-09-21',
        files: { regular: '' }, // System font
        kind: 'webfonts#webfont'
    },
    {
        family: 'Hind',
        category: 'sans-serif',
        variants: ['regular', '300', '500', '600', '700'],
        subsets: ['latin', 'devanagari', 'latin-ext'],
        version: 'v16',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/hind/v16/5aU69_a8oxmIdGi4.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Inconsolata',
        category: 'monospace',
        variants: ['regular', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v31',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/inconsolata/v31/QldKNThLqRwH-OJ1UHjlKGlZ5qg.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Indie Flower',
        category: 'handwriting',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v17',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/indieflower/v17/m8JVjfKrXd_fhX961l9n.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Inter',
        category: 'sans-serif',
        variants: ['regular', '100', '200', '300', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext', 'vietnamese'],
        version: 'v13',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Josefin Sans',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v26',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/josefinsans/v26/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_DjQbMZnTJAP.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Kanit',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'latin-ext', 'thai', 'vietnamese'],
        version: 'v15',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/kanit/v15/nKKZ-Go6G5tXcr72.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Karla',
        category: 'sans-serif',
        variants: ['regular', 'italic', '200', '300', '400', '500', '600', '700', '800'],
        subsets: ['latin', 'latin-ext'],
        version: 'v23',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/karla/v23/qkBIXvYC6trAT55y.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Lato',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '300', '400', '700', '900'],
        subsets: ['latin', 'latin-ext'],
        version: 'v24',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4w.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Libre Baskerville',
        category: 'serif',
        variants: ['regular', 'italic', '700'],
        subsets: ['latin', 'latin-ext'],
        version: 'v14',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/librebaskerville/v14/kmKnZrc3Hgbbcjq75U4uslyuy4kn0qvi.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Lobster',
        category: 'display',
        variants: ['regular'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v28',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/lobster/v28/neILzCirqoswsqX9_oU.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Lora',
        category: 'serif',
        variants: ['regular', 'italic', '500', '600', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v32',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQ.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Merriweather',
        category: 'serif',
        variants: ['regular', 'italic', '300', '400', '700', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v30',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5O.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Montserrat',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v25',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Mukta',
        category: 'sans-serif',
        variants: ['regular', '200', '300', '400', '500', '600', '700', '800'],
        subsets: ['latin', 'devanagari', 'latin-ext'],
        version: 'v13',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/mukta/v13/iJWHBXyIfDnIV7Fq.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Nunito',
        category: 'sans-serif',
        variants: ['regular', 'italic', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v25',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/nunito/v25/XRXV3I6Li01BKofINeaB.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Open Sans',
        category: 'sans-serif',
        variants: ['regular', 'italic', '300', '400', '500', '600', '700', '800'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'hebrew', 'latin-ext', 'vietnamese'],
        version: 'v35',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWnX83Nkc90df.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Oswald',
        category: 'sans-serif',
        variants: ['regular', '200', '300', '400', '500', '600', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v49',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/oswald/v49/TK3iWkUHHAIjg752GT8.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Pacifico',
        category: 'handwriting',
        variants: ['regular'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v22',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Playfair Display',
        category: 'serif',
        variants: ['regular', 'italic', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v30',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWbn2PKdFvXDXbtM.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Poppins',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'devanagari', 'latin-ext'],
        version: 'v20',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'PT Sans',
        category: 'sans-serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext'],
        version: 'v17',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/ptsans/v17/jizaRExUiTo99u79D0KExQ.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'PT Serif',
        category: 'serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext'],
        version: 'v17',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/ptserif/v17/EJRVQgYoZZY2vCFuvDFRxL6ddj0.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Quicksand',
        category: 'sans-serif',
        variants: ['regular', '300', '400', '500', '600', '700'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v30',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/quicksand/v30/6xKtdSZaM9iE8KbpRA_hK1QN.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Raleway',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
        version: 'v28',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Roboto',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '300', '400', '500', '700', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext', 'vietnamese'],
        version: 'v30',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Roboto Condensed',
        category: 'sans-serif',
        variants: ['regular', 'italic', '300', '400', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext', 'vietnamese'],
        version: 'v25',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/robotocondensed/v25/ieVl2ZhZI2eCN5jzbjEETS9weq8-19K7DQ.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Roboto Mono',
        category: 'monospace',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext', 'vietnamese'],
        version: 'v22',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/robotomono/v22/L0x5DF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3v0.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Roboto Slab',
        category: 'serif',
        variants: ['regular', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext', 'vietnamese'],
        version: 'v24',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/robotoslab/v24/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjojISmb2Rj.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Rubik',
        category: 'sans-serif',
        variants: ['regular', 'italic', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'hebrew', 'latin-ext'],
        version: 'v26',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/rubik/v26/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-4I-1.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Shadows Into Light',
        category: 'handwriting',
        variants: ['regular'],
        subsets: ['latin'],
        version: 'v19',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/shadowsintolight/v19/UZYxE8nEiSKt4P47_dES3JK6lEV80l7f8tZ9.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Source Sans Pro',
        category: 'sans-serif',
        variants: ['regular', 'italic', '200', '300', '400', '600', '700', '900'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext', 'vietnamese'],
        version: 'v21',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/sourcesanspro/v21/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Space Mono',
        category: 'monospace',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v12',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/spacemono/v12/i7dPIyWbdnLxvh7oxLUFor7r.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Times New Roman',
        category: 'serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v1',
        lastModified: '2023-09-21',
        files: { regular: '' }, // System font
        kind: 'webfonts#webfont'
    },
    {
        family: 'Titillium Web',
        category: 'sans-serif',
        variants: ['regular', 'italic', '200', '300', '400', '600', '700', '900'],
        subsets: ['latin', 'latin-ext'],
        version: 'v15',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/titilliumweb/v15/NaPecZYY42TL3M3B58JXr081.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Ubuntu',
        category: 'sans-serif',
        variants: ['regular', 'italic', '300', '400', '500', '700'],
        subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'latin-ext'],
        version: 'v20',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgoKcg72nU6AF7xm.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Verdana',
        category: 'sans-serif',
        variants: ['regular', 'italic', '700', '700italic'],
        subsets: ['latin'],
        version: 'v1',
        lastModified: '2023-09-21',
        files: { regular: '' }, // System font
        kind: 'webfonts#webfont'
    },
    {
        family: 'Work Sans',
        category: 'sans-serif',
        variants: ['regular', 'italic', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
        version: 'v18',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/worksans/v18/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nMNWs.ttf' },
        kind: 'webfonts#webfont'
    },
    {
        family: 'Zilla Slab',
        category: 'serif',
        variants: ['regular', 'italic', '300', '400', '500', '600', '700'],
        subsets: ['latin', 'latin-ext'],
        version: 'v11',
        lastModified: '2023-09-21',
        files: { regular: 'http://fonts.gstatic.com/s/zillaslab/v11/dHOghGenyr-FhJhmdTPkf5vQ.ttf' },
        kind: 'webfonts#webfont'
    }
];
