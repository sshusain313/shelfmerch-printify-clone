import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { catalogueFieldsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { CATEGORIES, CategoryId, getSubcategories } from '@/config/productCategories';

interface CatalogueField {
  _id: string;
  categoryId: string;
  subcategoryId?: string;
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  options: string[];
  required: boolean;
  placeholder: string;
  unit: string;
  isActive: boolean;
}

const ManageCatalogueFields = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState<CatalogueField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Form state for adding new field
  const [newField, setNewField] = useState({
    categoryId: '',
    subcategoryId: '',
    key: '',
    label: '',
    type: 'text' as 'text' | 'textarea' | 'number' | 'select',
    options: [] as string[],
    required: false,
    placeholder: '',
    unit: '',
  });
  const [optionInput, setOptionInput] = useState('');

  // Auto-generate key from label
  const generateKeyFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  // Fetch all fields
  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const params = categoryFilter ? { categoryId: categoryFilter } : undefined;
      const response = await catalogueFieldsApi.getAll(params);
      
      if (response.success && response.data) {
        setFields(response.data);
      }
    } catch (error) {
      console.error('Error fetching catalogue fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch catalogue fields',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [categoryFilter]);

  const handleAddField = async () => {
    if (!newField.categoryId || !newField.label || !newField.type) {
      toast({
        title: 'Validation Error',
        description: 'Category, Label, and Type are required',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate key from label if not provided
    const fieldKey = newField.key || generateKeyFromLabel(newField.label);
    
    if (!fieldKey) {
      toast({
        title: 'Validation Error',
        description: 'Could not generate field key from label. Please ensure label contains valid characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await catalogueFieldsApi.create({
        ...newField,
        key: fieldKey, // Use auto-generated key
        subcategoryId: newField.subcategoryId || undefined,
      });

      if (response.success) {
        // Optimistically append the newly created field so the list updates immediately
        if (response.data) {
          setFields((prev) => [...prev, response.data as unknown as CatalogueField]);
        }

        toast({
          title: 'Success',
          description: 'Catalogue field created successfully',
        });
        
        // Reset form
        setNewField({
          categoryId: '',
          subcategoryId: '',
          key: '',
          label: '',
          type: 'text',
          options: [],
          required: false,
          placeholder: '',
          unit: '',
        });
        setOptionInput('');
        
        // Refresh list
        fetchFields();

        // Navigate back to previous page or ProductCatalogueSection only if we were deep-linked from there
        const returnPath = location.state?.from;
        if (returnPath) {
          setTimeout(() => {
            navigate(returnPath);
          }, 1000); // Small delay to show success message
        }
      }
    } catch (error: any) {
      console.error('Error creating field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create catalogue field',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await catalogueFieldsApi.delete(id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Field deleted successfully',
        });
        fetchFields();
      }
    } catch (error: any) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete field',
        variant: 'destructive',
      });
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim() && !newField.options.includes(optionInput.trim())) {
      setNewField({
        ...newField,
        options: [...newField.options, optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (option: string) => {
    setNewField({
      ...newField,
      options: newField.options.filter(o => o !== option),
    });
  };

  const getAvailableSubcategories = () => {
    if (!newField.categoryId) return [];
    return getSubcategories(newField.categoryId as CategoryId);
  };

  const groupedFields = fields.reduce((acc, field) => {
    const key = `${field.categoryId}${field.subcategoryId ? `-${field.subcategoryId}` : ''}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(field);
    return acc;
  }, {} as Record<string, CatalogueField[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Manage Catalogue Fields</h1>
                <p className="text-sm text-muted-foreground">
                  Add custom product attributes for specific categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Add New Field Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Catalogue Field
              </CardTitle>
              <CardDescription>
                Define a new product attribute for a specific category/subcategory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newField.categoryId}
                  onValueChange={(value) => setNewField({ ...newField, categoryId: value, subcategoryId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CATEGORIES).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory (Optional) */}
              {newField.categoryId && (
                <div className="space-y-2">
                  <Label>Subcategory (Optional)</Label>
                  <Select
                    value={newField.subcategoryId || '__all__'}
                    onValueChange={(value) => setNewField({ ...newField, subcategoryId: value === '__all__' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All subcategories</SelectItem>
                      {getAvailableSubcategories().map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Label */}
              <div className="space-y-2">
                <Label>Display Label *</Label>
                <Input
                  placeholder="e.g., Print Area"
                  value={newField.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    // Auto-generate key from label
                    const autoKey = generateKeyFromLabel(label);
                    setNewField({ 
                      ...newField, 
                      label,
                      key: autoKey // Auto-update key as user types
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Field key will be auto-generated: <code className="bg-muted px-1 py-0.5 rounded">
                    {newField.label ? generateKeyFromLabel(newField.label) : '...'}
                  </code>
                </p>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Field Type *</Label>
                <Select
                  value={newField.type}
                  onValueChange={(value: any) => setNewField({ ...newField, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options (for select type) */}
              {newField.type === 'select' && (
                <div className="space-y-2">
                  <Label>Options *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add option..."
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Button type="button" onClick={handleAddOption} variant="secondary" size="sm">
                      Add
                    </Button>
                  </div>
                  {newField.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newField.options.map((option) => (
                        <Badge key={option} variant="secondary" className="gap-1">
                          {option}
                          <button onClick={() => handleRemoveOption(option)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder */}
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  placeholder="e.g., Enter value..."
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  placeholder="e.g., cm or inches"
                  value={newField.unit}
                  onChange={(e) => setNewField({ ...newField, unit: e.target.value })}
                />
              </div>

              {/* Required */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="required">Required field</Label>
              </div>

              <Button onClick={handleAddField} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Create Field
              </Button>
            </CardContent>
          </Card>

          {/* Existing Fields List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Existing Custom Fields</CardTitle>
                <CardDescription>
                  {fields.length} custom field{fields.length !== 1 ? 's' : ''} defined
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter */}
                <div className="space-y-2">
                  <Label>Filter by Category</Label>
                  <Select
                    value={categoryFilter || '__all__'}
                    onValueChange={(value) => setCategoryFilter(value === '__all__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All categories</SelectItem>
                      {Object.values(CATEGORIES).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Fields List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Loading fields...
                    </p>
                  ) : Object.keys(groupedFields).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No custom fields defined yet. Add one using the form.
                    </p>
                  ) : (
                    Object.entries(groupedFields).map(([groupKey, groupFields]) => {
                      const firstField = groupFields[0];
                      const categoryName = CATEGORIES[firstField.categoryId as CategoryId]?.name || firstField.categoryId;
                      const subcategoryName = firstField.subcategoryId || 'All';

                      return (
                        <div key={groupKey} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{categoryName}</Badge>
                            {firstField.subcategoryId && (
                              <Badge variant="secondary">{subcategoryName}</Badge>
                            )}
                          </div>
                          
                          {groupFields.map((field) => (
                            <Card key={field._id} className="p-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{field.label}</p>
                                    <Badge variant="outline" className="text-xs">
                                      {field.type}
                                    </Badge>
                                    {field.required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Key: <code className="bg-muted px-1 py-0.5 rounded">{field.key}</code>
                                  </p>
                                  {field.options && field.options.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Options: {field.options.join(', ')}
                                    </p>
                                  )}
                                  {field.unit && (
                                    <p className="text-xs text-muted-foreground">
                                      Unit: {field.unit}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteField(field._id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCatalogueFields;

