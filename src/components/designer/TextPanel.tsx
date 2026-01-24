
import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight, ChevronDown, Upload, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { POPULAR_FONTS, FONT_CATEGORIES, FontCategory, Font } from '@/lib/fonts';

interface TextPanelProps {
    onAddText: (text: string, font: string) => void;
    onClose: () => void;
}

const TextPanel: React.FC<TextPanelProps> = ({ onAddText, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FontCategory | 'All'>('All');
    const [expandedFonts, setExpandedFonts] = useState<Set<string>>(new Set());
    const [isCurvedText, setIsCurvedText] = useState(false);

    // Filter fonts based on search query and category
    const filteredFonts = useMemo(() => {
        return POPULAR_FONTS.filter((font) => {
            const matchesSearch = font.family.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' ||
                font.category.toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    const toggleFontExpansion = (fontFamily: string) => {
        const newExpanded = new Set(expandedFonts);
        if (newExpanded.has(fontFamily)) {
            newExpanded.delete(fontFamily);
        } else {
            newExpanded.add(fontFamily);
        }
        setExpandedFonts(newExpanded);
    };

    const handleFileUpload = () => {
        // Mock upload functionality
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ttf,.otf,.woff,.woff2';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                alert(`Mock upload: ${file.name} would be uploaded here.`);
            }
        };
        input.click();
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Add text</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Curved Text Feature
                        <div className="flex items-center gap-2 justify-between">
                            <Label className="text-sm font-medium">Curved Text</Label>
                            <span className="text-xs text-primary cursor-pointer hover:underline">Show more</span>
                        </div> */}

                    {/* Template Fonts */}
                    {/* <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            className="h-20 p-1 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5"
                            onClick={() => onAddText('WYZ', 'Inter')}
                        > */}
                            {/* <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                                WYZ
                            </div> */}
                            {/* <img src="/images/texts/progress.png" alt="progress" className="w-20 h-20" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 p-1 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5"
                            onClick={() => onAddText('REAL APPAREL CO.', 'Playfair Display')}
                        >
                            <div className="text-center">
                                <div className="text-[10px] leading-tight">REAL</div>
                                <div className="text-[10px] font-serif leading-tight">APPAREL</div>
                                <div className="text-[8px] leading-tight">CO.</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 p-1 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5"
                            onClick={() => onAddText('art lover boutique', 'Abril Fatface')}
                        >
                            <div className="text-center font-serif leading-tight">
                                <div className="text-[10px]">art</div>
                                <div className="text-[10px]">lover</div>
                                <div className="text-[10px]">boutique</div>
                            </div>
                        </Button>
                    </div> */}

                    {/* My Fonts */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">My fonts</Label>
                            <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 text-[10px] h-5 px-1.5 border-none">New</Badge>
                        </div>
                        <Button variant="outline" className="w-full justify-center gap-2" onClick={handleFileUpload}>
                            <Upload className="w-4 h-4" />
                            Upload font
                        </Button>
                    </div>

                    {/* Discover Fonts */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Discover fonts</Label>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2 overflow-x-auto">
                            {FONT_CATEGORIES.map((category) => (
                                <Badge
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    className="cursor-pointer font-normal bg-[#f0f0f0] p-2 rounded-md"
                                    onClick={() => setSelectedCategory(selectedCategory === category ? 'All' : category)}
                                >
                                    {category}
                                </Badge>
                            ))}
                        </div>

                        {/* Font List */}
                        <div className="space-y-1 pt-2">
                            {filteredFonts.slice(0, 50).map((font) => (
                                <div key={font.family} className="border-b last:border-0">
                                    <button
                                        className="w-full flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-sm transition-colors text-left"
                                        onClick={() => toggleFontExpansion(font.family)}
                                    >
                                        <span className="font-medium text-sm">{font.family}</span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFonts.has(font.family) ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    {expandedFonts.has(font.family) && (
                                        <div className="pb-3 px-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <div className="h-16 bg-muted/30 rounded flex items-center justify-center border">
                                                <span
                                                    style={{ fontFamily: font.family, fontSize: '24px' }}
                                                    className="text-foreground"
                                                >
                                                    Preview Text
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="w-full"
                                                onClick={() => onAddText('Enter text', font.family)}
                                            >
                                                Use this font
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filteredFonts.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No fonts found matching your search.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default TextPanel;
