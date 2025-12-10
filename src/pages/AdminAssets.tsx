import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload, Image as ImageIcon, Trash2, Download, Eye, Edit, Loader2,
  FileUp, Package, Grid, List, Search, Filter
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';

interface Asset {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  type: string;
  category: string;
  fileUrl: string;
  previewUrl?: string;
  recommendedSize: {
    width: number;
    height: number;
  };
  isPublished: boolean;
  downloads: number;
  views: number;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminAssets: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'graphics',
    type: 'svg',
    tags: '',
    recommendedWidth: '',
    recommendedHeight: '',
    designNotes: '',
    usage: 'all',
    license: 'commercial',
    fontFamily: '',
    sampleText: '',
    seamless: false,
    patternRepeat: 'repeat'
  });

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    search: ''
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(
        `${API_BASE_URL}/api/assets/admin/all?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch assets');

      const data = await response.json();
      setAssets(data.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchAssets();
    }
  }, [user, fetchAssets]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload SVG, PNG, JPG, or WEBP');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Auto-detect type from file
    if (selectedFile.type === 'image/svg+xml') {
      setFormData(prev => ({ ...prev, type: 'svg' }));
    } else {
      setFormData(prev => ({ ...prev, type: 'png' }));
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Upload asset
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title || !formData.category) {
      toast.error('Title and category are required');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      
      uploadFormData.append('file', file);
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          uploadFormData.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/assets/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      toast.success('Asset uploaded successfully');

      // Reset form
      setFile(null);
      setPreviewUrl('');
      setFormData({
        title: '',
        description: '',
        category: 'graphics',
        type: 'svg',
        tags: '',
        recommendedWidth: '',
        recommendedHeight: '',
        designNotes: '',
        usage: 'all',
        license: 'commercial',
        fontFamily: '',
        sampleText: '',
        seamless: false,
        patternRepeat: 'repeat'
      });

      // Refresh assets list
      fetchAssets();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload asset');
    } finally {
      setUploading(false);
    }
  };

  // Delete asset
  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/assets/admin/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete asset');

      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete asset');
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (assetId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/assets/admin/${assetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update asset');

      toast.success(`Asset ${!currentStatus ? 'published' : 'unpublished'}`);
      fetchAssets();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update asset');
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage design assets for the editor
          </p>
        </div>
        <Badge variant="secondary">
          {assets.length} Assets
        </Badge>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="library">
            <ImageIcon className="w-4 h-4 mr-2" />
            Library
          </TabsTrigger>
          <TabsTrigger value="batch">
            <Package className="w-4 h-4 mr-2" />
            Batch Upload
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Single Asset</CardTitle>
              <CardDescription>
                Upload SVG, PNG, JPG, or WEBP files for the design editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* File Upload */}
                  <div className="col-span-2">
                    <Label>File</Label>
                    <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center">
                      {previewUrl ? (
                        <div className="space-y-4">
                          <div className="max-w-md mx-auto">
                            {file?.type === 'image/svg+xml' ? (
                              <div
                                className="w-full h-64 flex items-center justify-center bg-muted rounded"
                                dangerouslySetInnerHTML={{ __html: previewUrl.includes('data:') ? atob(previewUrl.split(',')[1]) : '' }}
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-64 object-contain bg-muted rounded"
                              />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setFile(null);
                              setPreviewUrl('');
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            SVG, PNG, JPG, WEBP (max 100MB)
                          </p>
                          <input
                            type="file"
                            className="hidden"
                            accept=".svg,.png,.jpg,.jpeg,.webp"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Beach Pattern"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="graphics">Graphics</SelectItem>
                        <SelectItem value="patterns">Patterns</SelectItem>
                        <SelectItem value="textTemplates">Text Templates</SelectItem>
                        <SelectItem value="icons">Icons</SelectItem>
                        <SelectItem value="shapes">Shapes</SelectItem>
                        <SelectItem value="fonts">Fonts</SelectItem>
                        <SelectItem value="logos">Logos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the asset..."
                      rows={3}
                    />
                  </div>

                  {/* Tags */}
                  <div className="col-span-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="beach, summer, pattern, tropical"
                    />
                  </div>

                  {/* Recommended Size */}
                  <div>
                    <Label htmlFor="width">Recommended Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.recommendedWidth}
                      onChange={(e) => handleInputChange('recommendedWidth', e.target.value)}
                      placeholder="3000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="height">Recommended Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.recommendedHeight}
                      onChange={(e) => handleInputChange('recommendedHeight', e.target.value)}
                      placeholder="3000"
                    />
                  </div>

                  {/* Usage */}
                  <div>
                    <Label htmlFor="usage">Usage</Label>
                    <Select
                      value={formData.usage}
                      onValueChange={(value) => handleInputChange('usage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="front print">Front Print</SelectItem>
                        <SelectItem value="back print">Back Print</SelectItem>
                        <SelectItem value="sticker">Sticker</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* License */}
                  <div>
                    <Label htmlFor="license">License</Label>
                    <Select
                      value={formData.license}
                      onValueChange={(value) => handleInputChange('license', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="CC0">CC0</SelectItem>
                        <SelectItem value="royalty-free">Royalty-Free</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Design Notes */}
                  <div className="col-span-2">
                    <Label htmlFor="notes">Design Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.designNotes}
                      onChange={(e) => handleInputChange('designNotes', e.target.value)}
                      placeholder="Great for t-shirts and hoodies..."
                      rows={2}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={uploading || !file}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Asset
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Library</CardTitle>
                  <CardDescription>Manage your uploaded assets</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search assets..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAssets()}
                  />
                </div>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="graphics">Graphics</SelectItem>
                    <SelectItem value="patterns">Patterns</SelectItem>
                    <SelectItem value="icons">Icons</SelectItem>
                    <SelectItem value="shapes">Shapes</SelectItem>
                    <SelectItem value="logos">Logos</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchAssets}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No assets found</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-4 gap-4">
                  {assets.map((asset) => (
                    <Card key={asset._id} className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center p-4">
                        {asset.previewUrl ? (
                          <img
                            src={asset.previewUrl}
                            alt={asset.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm truncate">{asset.title}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {asset.category}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleTogglePublish(asset._id, asset.isPublished)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDelete(asset._id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset._id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        {asset.previewUrl ? (
                          <img
                            src={asset.previewUrl}
                            alt={asset.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{asset.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {asset.category} • {asset.views} views • {asset.downloads} downloads
                        </p>
                      </div>
                      <Badge variant={asset.isPublished ? 'default' : 'secondary'}>
                        {asset.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleTogglePublish(asset._id, asset.isPublished)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(asset._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Upload Tab */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload</CardTitle>
              <CardDescription>
                Upload multiple assets at once using a ZIP file with metadata.json
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a ZIP file containing:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                    <li>• assets/ folder with your files</li>
                    <li>• metadata.json with asset information</li>
                  </ul>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Select ZIP File
                  </Button>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Example metadata.json:</h4>
                  <pre className="text-xs overflow-x-auto">
{`[
  {
    "title": "Retro Sunburst",
    "description": "Vintage retro sun shape",
    "tags": ["retro", "sun", "graphic"],
    "type": "svg",
    "category": "graphics",
    "fileName": "sunburst.svg",
    "recommendedSize": {
      "width": 2500,
      "height": 2500
    },
    "designNotes": "Great for t-shirts"
  }
]`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAssets;

