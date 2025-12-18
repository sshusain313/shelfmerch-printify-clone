import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { StoreAuthProvider } from "./contexts/StoreAuthContext";
import { DataProvider } from "./contexts/DataContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import AllCategories from "./pages/AllCategories";
import CategoryProducts from "./pages/CategoryProducts";
import CategorySubcategories from "./pages/Apparel";
import ProductDetail from "./pages/ProductDetail";
import DesignerEditor from "./pages/DesignEditor";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Stores from "./pages/Stores";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Admin from '@/pages/Admin';
import AdminOrderDetail from '@/pages/AdminOrderDetail';
import AdminProductCreation from "./pages/AdminProductCreation";
import AdminProductDetail from "./pages/AdminProductDetail";
import ManageVariantOptions from "./pages/ManageVariantOptions";
import ManageCatalogueFields from "./pages/ManageCatalogueFields";
import AdminAssets from "./pages/AdminAssets";
import CreateStore from "./pages/CreateStore";
import StoreFrontendNew from "./pages/StoreFrontendNew";
import StoreProductPage from "./pages/StoreProductPage";
import StoreCheckoutPage from "./pages/StoreCheckoutPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import BuilderDemo from "./pages/BuilderDemo";
import NotFound from "./pages/NotFound";
import ProductCreation from "./pages/ProductCreation";
import ListingEditor from "./pages/ListingEditor";
import StoreAuthPage from "./pages/StoreAuthPage";
import MockupsLibrary from "./pages/MockupsLibrary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<AllCategories />} />
              <Route path="/category-subcategories/:categoryId" element={<CategorySubcategories />} />
              <Route path="/products/category/:slug" element={<CategoryProducts />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/designer/:id"
                element={
                  <ProtectedRoute>
                    <DesignerEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listing-editor/:id"
                element={
                  <ProtectedRoute>
                    <ListingEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products/:productId"
                element={
                  <ProtectedRoute>
                    <ProductCreation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listing-editor"
                element={
                  <ProtectedRoute>
                    <ListingEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mockups-library"
                element={
                  <ProtectedRoute>
                    <MockupsLibrary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores"
                element={
                  <ProtectedRoute>
                    <Stores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/builder"
                element={
                  <ProtectedRoute>
                    <BuilderDemo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders/:id"
                element={
                  // <ProtectedRoute requireAdmin>
                  <AdminOrderDetail />
                  // </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products/new"
                element={
                  // <ProtectedRoute >
                  <AdminProductCreation />
                  // </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProductCreation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products/:id"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/variant-options"
                element={
                  <ProtectedRoute requireAdmin>
                    <ManageVariantOptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/catalogue-fields"
                element={
                  <ProtectedRoute requireAdmin>
                    <ManageCatalogueFields />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assets"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAssets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-store"
                element={
                  <ProtectedRoute>
                    <CreateStore />
                  </ProtectedRoute>
                }
              />
              <Route path="/store/:subdomain" element={<StoreAuthProvider><StoreFrontendNew /></StoreAuthProvider>} />
              <Route path="/store/:subdomain/auth" element={<StoreAuthProvider><StoreAuthPage /></StoreAuthProvider>} />
              <Route path="/store/:subdomain/product/:productId" element={<StoreAuthProvider><StoreProductPage /></StoreAuthProvider>} />
              <Route path="/store/:subdomain/checkout" element={<StoreAuthProvider><StoreCheckoutPage /></StoreAuthProvider>} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
