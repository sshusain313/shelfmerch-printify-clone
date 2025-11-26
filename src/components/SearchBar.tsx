import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchBarProps {
    initialValue?: string;
    onSearch: (value: string) => void;
}

export const SearchBar = ({ initialValue = '', onSearch }: SearchBarProps) => {
    const [value, setValue] = useState(initialValue);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    // Debounced search function
    const debouncedSearch = useCallback((searchValue: string) => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounced search
        debounceTimerRef.current = setTimeout(() => {
            onSearch(searchValue);
        }, 500); // 500ms delay
    }, [onSearch]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        // Trigger debounced search
        debouncedSearch(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // Clear debounce timer and search immediately
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            onSearch(value);
        }
    };

    return (
        <div className="mb-12">
            {/* Top Controls */}
            {/* <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-0 text-sm">
                    <span className="text-muted-foreground">Ship from</span>
                    <button className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted/50">
                        <span className="text-lg leading-none">🇺🇸</span> USA <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <button className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted/50">
                        USD <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </button>
                </div>
            </div> */}

            {/* Search Area */}
            <div className="relative">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-300" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search for products, brands, categories, and print providers"
                        className="w-full pl-14 pr-4 py-4 text-base sm:text-lg border border-input/40 rounded-xl bg-background shadow-sm hover:shadow-md hover:border-primary/30 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/60"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>
        </div>
    );
};
