import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Star, GripVertical, MoreVertical, Eye, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ProductGalleryImage } from '@/types/product';
import { cn } from '@/lib/utils';
import { uploadApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProductGallerySectionProps {
  images: ProductGalleryImage[];
  onChange: (images: ProductGalleryImage[]) => void;
}

const IMAGE_TYPES = [
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'flat-front', label: 'Flat Front' },
  { value: 'flat-back', label: 'Flat Back' },
  { value: 'size-chart', label: 'Size Chart' },
  { value: 'detail', label: 'Detail' },
  { value: 'other', label: 'Other' },
] as const;

export const ProductGallerySection = ({ images, onChange }: ProductGallerySectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<ProductGalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<ProductGalleryImage | null>(null);
  const [editingAltText, setEditingAltText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please select image files only',
        variant: 'destructive',
      });
      return;
    }

    // Upload all files to S3
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setUploadingFiles(prev => new Set(prev).add(fileId));
        
        try {
          // Upload to S3
          const s3Url = await uploadApi.uploadImage(file, 'gallery');
          
          const newImage: ProductGalleryImage = {
            id: `gallery-${fileId}`,
            url: s3Url,
            position: images.length + fileArray.indexOf(file),
            isPrimary: images.length === 0 && fileArray.indexOf(file) === 0,
            imageType: 'other',
            altText: '',
          };

          setUploadingFiles(prev => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });

          return newImage;
        } catch (error) {
          console.error('Error uploading image:', error);
          setUploadingFiles(prev => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
          return null;
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const validImages = uploadedImages.filter((img): img is ProductGalleryImage => img !== null);

      if (validImages.length > 0) {
        // Mark first image as primary if no images exist
        const updatedImages = images.map((img) => ({ ...img, isPrimary: false }));
        onChange([...updatedImages, ...validImages]);
        
        toast({
          title: 'Upload successful',
          description: `${validImages.length} image(s) uploaded to S3 successfully`,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = (id: string) => {
    const imageToDelete = images.find((img) => img.id === id);
    const updatedImages = images.filter((img) => img.id !== id);

    if (imageToDelete?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      position: index,
    }));

    onChange(reorderedImages);
  };

  const handleSetPrimary = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onChange(updatedImages);
  };

  const handleUpdateImageType = (id: string, imageType: ProductGalleryImage['imageType']) => {
    const updatedImages = images.map((img) =>
      img.id === id ? { ...img, imageType } : img
    );
    onChange(updatedImages);
  };

  const handleUpdateAltText = (id: string, altText: string) => {
    const updatedImages = images.map((img) =>
      img.id === id ? { ...img, altText } : img
    );
    onChange(updatedImages);
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const sortedImages = [...images].sort((a, b) => a.position - b.position);
    const [draggedItem] = sortedImages.splice(draggedIndex, 1);
    sortedImages.splice(dropIndex, 0, draggedItem);

    const reorderedImages = sortedImages.map((img, index) => ({
      ...img,
      position: index,
    }));

    onChange(reorderedImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const openEditDialog = (image: ProductGalleryImage) => {
    setEditingImage(image);
    setEditingAltText(image.altText || '');
  };

  const saveAltText = () => {
    if (editingImage) {
      handleUpdateAltText(editingImage.id, editingAltText);
      setEditingImage(null);
      setEditingAltText('');
    }
  };

  const sortedImages = [...images].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
          disabled={uploadingFiles.size > 0}
        >
          {uploadingFiles.size > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading to S3...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Images
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              No images uploaded yet. Click "Upload Images" to add product gallery images.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {sortedImages.map((image, index) => {
            const imageTypeLabel = IMAGE_TYPES.find((t) => t.value === image.imageType)?.label || 'Other';
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <Card
                key={image.id}
                className={cn(
                  'relative group overflow-hidden transition-all',
                  'hover:shadow-lg hover:scale-[1.02]',
                  isDragging && 'opacity-40 scale-95 z-50 cursor-grabbing',
                  isDragOver && 'ring-2 ring-primary ring-offset-2 scale-[1.05]',
                  !isDragging && 'cursor-grab'
                )}
                draggable
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div
                  className="aspect-square relative bg-muted cursor-pointer"
                  onClick={(e) => {
                    // Only open preview if not dragging and clicked on image area (not buttons)
                    if (!isDragging && !(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('[role="combobox"]')) {
                      setPreviewImage(image);
                    }
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.altText || `Gallery image ${index + 1}`}
                    className={cn(
                      "w-full h-full object-cover transition-transform",
                      !isDragging && "group-hover:scale-105",
                      isDragging && "opacity-50"
                    )}
                    draggable={false}
                  />

                  {/* Primary Badge - Cleaner design */}
                  {image.isPrimary && (
                    <div className="absolute top-1.5 left-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Primary
                    </div>
                  )}

                  {/* Image Type Badge */}
                  {image.imageType && image.imageType !== 'other' && (
                    <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {imageTypeLabel}
                    </div>
                  )}

                  {/* Drag Handle - Always visible on hover */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-black/60 backdrop-blur-sm text-white p-1 rounded cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Hover Overlay with Actions */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image);
                      }}
                      className="gap-2 w-full"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="gap-2 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {!image.isPrimary && (
                          <DropdownMenuItem
                            onClick={() => handleSetPrimary(image.id)}
                            className="gap-2"
                          >
                            <Star className="h-4 w-4" />
                            Set as Primary
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openEditDialog(image)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Alt Text
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteImage(image.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Quick Image Type Selector */}
                    <Select
                      value={image.imageType || 'other'}
                      onValueChange={(value) =>
                        handleUpdateImageType(image.id, value as ProductGalleryImage['imageType'])
                      }
                    >
                      <SelectTrigger
                        className="w-full h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        {IMAGE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Position Indicator - Smaller */}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                    #{image.position + 1}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {images.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p>• Drag images to reorder • Click to preview • One image must be marked as Primary</p>
          <p>• Total images: {images.length}</p>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Preview
              {previewImage?.isPrimary && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Primary
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="px-6 pb-6 space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={previewImage.url}
                  alt={previewImage.altText || 'Preview'}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Image Type</Label>
                  <p className="font-medium">
                    {IMAGE_TYPES.find((t) => t.value === previewImage.imageType)?.label || 'Other'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <p className="font-medium">#{previewImage.position + 1}</p>
                </div>
                {previewImage.altText && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Alt Text</Label>
                    <p className="font-medium">{previewImage.altText}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Alt Text Modal */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alt Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={editingAltText}
                onChange={(e) => setEditingAltText(e.target.value)}
                placeholder="Enter alt text for accessibility..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    saveAltText();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Describe the image for screen readers and SEO
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingImage(null)}>
                Cancel
              </Button>
              <Button onClick={saveAltText}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
