import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth pages
import UserSelectPage from "@/pages/auth/UserSelectPage";
import LoginPage from "@/pages/auth/LoginPage";

// Main pages
import HomePage from "@/pages/HomePage";

// Inventory pages
import InventoryOverview from "@/pages/inventory/InventoryOverview";
import TransferDetail from "@/pages/inventory/TransferDetail";
import TransferForm from "@/pages/inventory/TransferForm";
import ProductsList from "@/pages/inventory/ProductsList";
import ProductDetail from "@/pages/inventory/ProductDetail";
import OperationsList from "@/pages/inventory/OperationsList";
import WarehousesList from "@/pages/inventory/WarehousesList";
import WarehouseLocations from "@/pages/inventory/WarehouseLocations";
import StockMoves from "@/pages/inventory/StockMoves";
import InventoryConfiguration from "@/pages/inventory/InventoryConfiguration";
import InventoryReporting from "@/pages/inventory/InventoryReporting";

// Sales pages
import SalesPipeline from "@/pages/sales/SalesPipeline";
import OpportunitiesList from "@/pages/sales/OpportunitiesList";

// Settings pages
import GeneralSettings from "@/pages/settings/GeneralSettings";
import UsersManagement from "@/pages/settings/UsersManagement";
import RolesManagement from "@/pages/settings/RolesManagement";
import AuditLogs from "@/pages/settings/AuditLogs";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/select-user" element={<UserSelectPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* Inventory module */}
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/operations"
              element={
                <ProtectedRoute>
                  <OperationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/products"
              element={
                <ProtectedRoute>
                  <ProductsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/products/:id"
              element={
                <ProtectedRoute>
                  <ProductDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/transfers/:id"
              element={
                <ProtectedRoute>
                  <TransferDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/transfers/new"
              element={
                <ProtectedRoute>
                  <TransferForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/transfers/:id/edit"
              element={
                <ProtectedRoute>
                  <TransferForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/warehouses"
              element={
                <ProtectedRoute>
                  <WarehousesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/locations"
              element={
                <ProtectedRoute>
                  <WarehouseLocations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-moves"
              element={
                <ProtectedRoute>
                  <StockMoves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/reporting"
              element={
                <ProtectedRoute>
                  <InventoryReporting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/configuration"
              element={
                <ProtectedRoute>
                  <InventoryConfiguration />
                </ProtectedRoute>
              }
            />

            {/* Sales module */}
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <SalesPipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/leads"
              element={
                <ProtectedRoute>
                  <SalesPipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/leads/:id"
              element={
                <ProtectedRoute>
                  <SalesPipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/opportunities"
              element={
                <ProtectedRoute>
                  <OpportunitiesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/opportunities/:id"
              element={
                <ProtectedRoute>
                  <OpportunitiesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/quotations"
              element={
                <ProtectedRoute>
                  <SalesPipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/orders"
              element={
                <ProtectedRoute>
                  <SalesPipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/customers"
              element={
                <ProtectedRoute>
                  <SalesPipeline />
                </ProtectedRoute>
              }
            />

            {/* Settings module */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <GeneralSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/users"
              element={
                <ProtectedRoute>
                  <UsersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles"
              element={
                <ProtectedRoute>
                  <RolesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/audit"
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/backups"
              element={
                <ProtectedRoute>
                  <GeneralSettings />
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes for other modules */}
            <Route
              path="/dashboards"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop-floor"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barcode"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plm"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discuss"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoicing"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-marketing"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/website"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
