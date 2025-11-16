import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import CategoryProducts from "./pages/CategoryProducts";
import ProductDetail from "./pages/ProductDetail";
import Designer from "./pages/Designer";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Stores from "./pages/Stores";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminProductCreation from "./pages/AdminProductCreation";
import CreateStore from "./pages/CreateStore";
import StoreFrontendNew from "./pages/StoreFrontendNew";
import StoreProductPage from "./pages/StoreProductPage";
import StoreCheckoutPage from "./pages/StoreCheckoutPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import BuilderDemo from "./pages/BuilderDemo";
import NotFound from "./pages/NotFound";
import ProductCreation from "./pages/ProductCreation";

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
              <Route path="/products/category/:slug" element={<CategoryProducts />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/designer/:id"
                element={
                  <ProtectedRoute>
                    <Designer />
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
                path="/admin/products/new"
                element={
                  // <ProtectedRoute >
                    <AdminProductCreation />
                  // </ProtectedRoute>
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
              <Route path="/store/:subdomain" element={<StoreFrontendNew />} />
              <Route path="/store/:subdomain/product/:productId" element={<StoreProductPage />} />
              <Route path="/store/:subdomain/checkout" element={<StoreCheckoutPage />} />
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
