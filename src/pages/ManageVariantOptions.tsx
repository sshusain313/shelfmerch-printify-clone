import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { variantOptionsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/config/productCategories';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomOption {
  _id: string;
  categoryId: string;
  subcategoryId?: string;
  optionType: 'size' | 'color';
  value: string;
  colorHex?: string;
  usageCount: number;
  createdAt: string;
}

export default function ManageVariantOptions() {
  const [options, setOptions] = useState<CustomOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Add new option form
  const [newOptionCategory, setNewOptionCategory] = useState<string>('');
  const [newOptionSubcategory, setNewOptionSubcategory] = useState<string>('');
  const [newOptionType, setNewOptionType] = useState<'size' | 'color'>('size');
  const [newOptionValue, setNewOptionValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all custom options
  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const response = await variantOptionsApi.getAll();
      if (response.success && response.data) {
        setOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom variant options',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Filter options
  const filteredOptions = options.filter(opt => {
    if (filterCategory !== 'all' && opt.categoryId !== filterCategory) return false;
    if (filterType !== 'all' && opt.optionType !== filterType) return false;
    return true;
  });

  // Delete option
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;
    
    try {
      await variantOptionsApi.delete(id);
      setOptions(prev => prev.filter(opt => opt._id !== id));
      toast({
        title: 'Success',
        description: 'Custom option deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete option',
        variant: 'destructive',
      });
    }
  };

  // Add new option
  const handleAddOption = async () => {
    if (!newOptionCategory || !newOptionValue.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await variantOptionsApi.create({
        categoryId: newOptionCategory,
        subcategoryId: newOptionSubcategory || undefined,
        optionType: newOptionType,
        value: newOptionValue.trim(),
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Custom option added successfully',
        });
        
        // Reset form
        setNewOptionValue('');
        setNewOptionSubcategory('');
        
        // Refresh list
        fetchOptions();
      }
    } catch (error: any) {
      console.error('Error adding option:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add option. It may already exist.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get subcategories for selected category
  const getSubcategories = (categoryId: string): string[] => {
    const category = Object.values(CATEGORIES).find(cat => cat.id === categoryId);
    return category?.subcategories ? [...category.subcategories] : [];
  };

  // Group options by category
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    const key = opt.categoryId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(opt);
    return acc;
  }, {} as Record<string, CustomOption[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Manage Variant Options</h1>
        </div>
      </header>

      <div className="container mx-auto py-8 space-y-8">

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Custom options added here will appear as <strong>checkbox options</strong> for all products in the selected category/subcategory.
            They are saved permanently and don't require app restart.
          </AlertDescription>
        </Alert>

        {/* Add New Option */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Custom Option</CardTitle>
            <CardDescription>
              Create a new size or color option that will be available as a checkbox for future products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newOptionCategory} onValueChange={setNewOptionCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CATEGORIES).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label>Subcategory (Optional)</Label>
                <Select 
                  value={newOptionSubcategory} 
                  onValueChange={setNewOptionSubcategory}
                  disabled={!newOptionCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subcategories</SelectItem>
                    {newOptionCategory && getSubcategories(newOptionCategory).map(sub => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Option Type */}
              <div className="space-y-2">
                <Label>Option Type *</Label>
                <Select value={newOptionType} onValueChange={(val) => setNewOptionType(val as 'size' | 'color')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  placeholder={newOptionType === 'size' ? 'e.g., 24×24, Youth M' : 'e.g., Brand Blue, PMS 185C'}
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                />
              </div>
            </div>

            <Button onClick={handleAddOption} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Option
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* List Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Custom Options</CardTitle>
                <CardDescription>View and manage all custom variant options</CardDescription>
              </div>
              <div className="flex gap-2">
                {/* Filter by Category */}
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.values(CATEGORIES).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter by Type */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="size">Sizes</SelectItem>
                    <SelectItem value="color">Colors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No custom options found. Add one above to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedOptions).map(([categoryId, categoryOptions]) => {
                  const category = Object.values(CATEGORIES).find(cat => cat.id === categoryId);
                  
                  return (
                    <div key={categoryId}>
                      <h3 className="text-lg font-semibold mb-3">{category?.name || categoryId}</h3>
                      <div className="space-y-2">
                        {categoryOptions.map((option) => (
                          <div
                            key={option._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant={option.optionType === 'size' ? 'default' : 'secondary'}>
                                {option.optionType}
                              </Badge>
                              <span className="font-medium">{option.value}</span>
                              {option.subcategoryId && (
                                <span className="text-sm text-muted-foreground">
                                  ({option.subcategoryId})
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Used: {option.usageCount}×
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(option._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

