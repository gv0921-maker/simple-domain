import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomizationProvider } from "@/contexts/CustomizationContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
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
import InventoryAdjustments from "@/pages/inventory/InventoryAdjustments";
import ReorderRules from "@/pages/inventory/ReorderRules";
import ReorderRuleForm from "@/pages/inventory/ReorderRuleForm";
import BarcodeOperations from "@/pages/inventory/BarcodeOperations";
import BarcodeLabels from "@/pages/inventory/BarcodeLabels";
import ProductScanLookup from "@/pages/inventory/ProductScanLookup";
import StockDashboard from "@/pages/inventory/StockDashboard";

// Sales pages
import SalesOverview from "@/pages/sales/SalesOverview";
import CustomersList from "@/pages/sales/CustomersList";
import CustomerForm from "@/pages/sales/CustomerForm";
import QuotationForm from "@/pages/sales/QuotationForm";
import QuotationsList from "@/pages/sales/QuotationsList";
import SalesOrdersList from "@/pages/sales/SalesOrdersList";
import SalesOrderForm from "@/pages/sales/SalesOrderForm";
import SubscriptionsList from "@/pages/sales/SubscriptionsList";
import SubscriptionForm from "@/pages/sales/SubscriptionForm";
import PricelistsPage from "@/pages/sales/PricelistsPage";
import PricelistForm from "@/pages/sales/PricelistForm";
import SalesReports from "@/pages/sales/SalesReports";
import PromotionsPage from "@/pages/sales/PromotionsPage";
import CustomerPortal from "@/pages/sales/CustomerPortal";
import CustomerPortalQuotation from "@/pages/sales/CustomerPortalQuotation";

// Manufacturing pages
import ManufacturingOverview from "@/pages/manufacturing/ManufacturingOverview";
import WorkOrdersList from "@/pages/manufacturing/WorkOrdersList";
import WorkOrderForm from "@/pages/manufacturing/WorkOrderForm";
import BOMList from "@/pages/manufacturing/BOMList";
import WorkCenters from "@/pages/manufacturing/WorkCenters";
import WorkCenterForm from "@/pages/manufacturing/WorkCenterForm";
import ProductionPlanning from "@/pages/manufacturing/ProductionPlanning";
import ShopFloor from "@/pages/manufacturing/ShopFloor";

// CRM pages
import CRMOverview from "@/pages/crm/CRMOverview";
import CRMPipeline from "@/pages/crm/CRMPipeline";
import CRMContactsList from "@/pages/crm/CRMContactsList";
import CRMContactDetail from "@/pages/crm/CRMContactDetail";
import ContactForm from "@/pages/crm/ContactForm";
import OpportunityForm from "@/pages/crm/OpportunityForm";
import OpportunityDetail from "@/pages/crm/OpportunityDetail";

// Invoicing pages
import InvoicesList from "@/pages/invoicing/InvoicesList";
import InvoiceForm from "@/pages/invoicing/InvoiceForm";
import BillsList from "@/pages/invoicing/BillsList";
import MinimumBillsList from "@/pages/invoicing/MinimumBillsList";
import KHBillsList from "@/pages/invoicing/KHBillsList";
import PaymentsList from "@/pages/invoicing/PaymentsList";

// Settings pages
import GeneralSettings from "@/pages/settings/GeneralSettings";
import CustomizationSettings from "@/pages/settings/CustomizationSettings";
import StudioEditor from "@/pages/settings/StudioEditor";
import UsersManagement from "@/pages/settings/UsersManagement";
import RolesManagement from "@/pages/settings/RolesManagement";
import AuditLogs from "@/pages/settings/AuditLogs";
import BackupsSettings from "@/pages/settings/BackupsSettings";
import CRMPipelinesSettings from "@/pages/settings/CRMPipelinesSettings";
import CRMBackupSettings from "@/pages/settings/CRMBackupSettings";
import CRMDataSchema from "@/pages/settings/CRMDataSchema";
import AccessibilitySettings from "@/pages/settings/AccessibilitySettings";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CustomizationProvider>
        <AccessibilityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

            {/* Inventory module */}
            <Route path="/inventory" element={<ProtectedRoute><InventoryOverview /></ProtectedRoute>} />
            <Route path="/inventory/operations" element={<ProtectedRoute><OperationsList /></ProtectedRoute>} />
            <Route path="/inventory/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
            <Route path="/inventory/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/inventory/transfers/:id" element={<ProtectedRoute><TransferDetail /></ProtectedRoute>} />
            <Route path="/inventory/transfers/new" element={<ProtectedRoute><TransferForm /></ProtectedRoute>} />
            <Route path="/inventory/transfers/:id/edit" element={<ProtectedRoute><TransferForm /></ProtectedRoute>} />
            <Route path="/inventory/warehouses" element={<ProtectedRoute><WarehousesList /></ProtectedRoute>} />
            <Route path="/inventory/locations" element={<ProtectedRoute><WarehouseLocations /></ProtectedRoute>} />
            <Route path="/inventory/stock-moves" element={<ProtectedRoute><StockMoves /></ProtectedRoute>} />
            <Route path="/inventory/reporting" element={<ProtectedRoute><InventoryReporting /></ProtectedRoute>} />
            <Route path="/inventory/configuration" element={<ProtectedRoute><InventoryConfiguration /></ProtectedRoute>} />
            <Route path="/inventory/adjustments" element={<ProtectedRoute><InventoryAdjustments /></ProtectedRoute>} />
            <Route path="/inventory/reorder-rules" element={<ProtectedRoute><ReorderRules /></ProtectedRoute>} />
            <Route path="/inventory/reorder-rules/new" element={<ProtectedRoute><ReorderRuleForm /></ProtectedRoute>} />
            <Route path="/inventory/reorder-rules/:id/edit" element={<ProtectedRoute><ReorderRuleForm /></ProtectedRoute>} />
            <Route path="/inventory/stock-dashboard" element={<ProtectedRoute><StockDashboard /></ProtectedRoute>} />

            {/* Barcode module */}
            <Route path="/barcode" element={<ProtectedRoute><BarcodeOperations /></ProtectedRoute>} />
            <Route path="/barcode/labels" element={<ProtectedRoute><BarcodeLabels /></ProtectedRoute>} />
            <Route path="/barcode/scan-lookup" element={<ProtectedRoute><ProductScanLookup /></ProtectedRoute>} />

            {/* Sales module */}
            <Route path="/sales" element={<ProtectedRoute><SalesOverview /></ProtectedRoute>} />
            <Route path="/sales/quotations" element={<ProtectedRoute><QuotationsList /></ProtectedRoute>} />
            <Route path="/sales/quotations/new" element={<ProtectedRoute><QuotationForm /></ProtectedRoute>} />
            <Route path="/sales/quotations/:id" element={<ProtectedRoute><QuotationForm /></ProtectedRoute>} />
            <Route path="/sales/orders" element={<ProtectedRoute><SalesOrdersList /></ProtectedRoute>} />
            <Route path="/sales/orders/new" element={<ProtectedRoute><SalesOrderForm /></ProtectedRoute>} />
            <Route path="/sales/orders/:id" element={<ProtectedRoute><SalesOrderForm /></ProtectedRoute>} />
            <Route path="/sales/orders/:id/edit" element={<ProtectedRoute><SalesOrderForm /></ProtectedRoute>} />
            <Route path="/sales/subscriptions" element={<ProtectedRoute><SubscriptionsList /></ProtectedRoute>} />
            <Route path="/sales/subscriptions/new" element={<ProtectedRoute><SubscriptionForm /></ProtectedRoute>} />
            <Route path="/sales/subscriptions/:id/edit" element={<ProtectedRoute><SubscriptionForm /></ProtectedRoute>} />
            <Route path="/sales/pricelists" element={<ProtectedRoute><PricelistsPage /></ProtectedRoute>} />
            <Route path="/sales/pricelists/new" element={<ProtectedRoute><PricelistForm /></ProtectedRoute>} />
            <Route path="/sales/pricelists/:id/edit" element={<ProtectedRoute><PricelistForm /></ProtectedRoute>} />
            <Route path="/sales/reports" element={<ProtectedRoute><SalesReports /></ProtectedRoute>} />
            <Route path="/sales/promotions" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
            <Route path="/sales/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
            <Route path="/sales/customers/new" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />
            <Route path="/sales/customers/:id/edit" element={<ProtectedRoute><CustomerForm /></ProtectedRoute>} />

            {/* Customer Portal (no auth required) */}
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/portal/quotation/:id" element={<CustomerPortalQuotation />} />

            {/* Settings module */}
            <Route path="/settings" element={<ProtectedRoute><GeneralSettings /></ProtectedRoute>} />
            <Route path="/settings/customization" element={<ProtectedRoute><CustomizationSettings /></ProtectedRoute>} />
            <Route path="/settings/studio" element={<ProtectedRoute><StudioEditor /></ProtectedRoute>} />
            <Route path="/settings/users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
            <Route path="/settings/roles" element={<ProtectedRoute><RolesManagement /></ProtectedRoute>} />
            <Route path="/settings/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            <Route path="/settings/backups" element={<ProtectedRoute><BackupsSettings /></ProtectedRoute>} />
            <Route path="/settings/crm-pipelines" element={<ProtectedRoute><CRMPipelinesSettings /></ProtectedRoute>} />
            <Route path="/settings/crm-backup" element={<ProtectedRoute><CRMBackupSettings /></ProtectedRoute>} />
            <Route path="/settings/data-schema" element={<ProtectedRoute><CRMDataSchema /></ProtectedRoute>} />
            <Route path="/settings/accessibility" element={<ProtectedRoute><AccessibilitySettings /></ProtectedRoute>} />

            {/* Placeholder routes */}
            <Route path="/dashboards" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/dashboards/crm" element={<ProtectedRoute><CRMOverview /></ProtectedRoute>} />
            <Route path="/discuss" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/employees/*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

            {/* CRM module */}
            <Route path="/crm" element={<ProtectedRoute><CRMPipeline /></ProtectedRoute>} />
            <Route path="/crm/opportunities/new" element={<ProtectedRoute><OpportunityForm /></ProtectedRoute>} />
            <Route path="/crm/opportunities/:id" element={<ProtectedRoute><OpportunityDetail /></ProtectedRoute>} />
            <Route path="/crm/contacts" element={<ProtectedRoute><CRMContactsList /></ProtectedRoute>} />
            <Route path="/crm/contacts/new" element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />
            <Route path="/crm/contacts/:id" element={<ProtectedRoute><CRMContactDetail /></ProtectedRoute>} />
            <Route path="/crm/contacts/:id/edit" element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />

            {/* Manufacturing module */}
            <Route path="/manufacturing" element={<ProtectedRoute><ManufacturingOverview /></ProtectedRoute>} />
            <Route path="/manufacturing/work-orders" element={<ProtectedRoute><WorkOrdersList /></ProtectedRoute>} />
            <Route path="/manufacturing/work-orders/new" element={<ProtectedRoute><WorkOrderForm /></ProtectedRoute>} />
            <Route path="/manufacturing/work-orders/:id/edit" element={<ProtectedRoute><WorkOrderForm /></ProtectedRoute>} />
            <Route path="/manufacturing/bom" element={<ProtectedRoute><BOMList /></ProtectedRoute>} />
            <Route path="/manufacturing/work-centers" element={<ProtectedRoute><WorkCenters /></ProtectedRoute>} />
            <Route path="/manufacturing/work-centers/new" element={<ProtectedRoute><WorkCenterForm /></ProtectedRoute>} />
            <Route path="/manufacturing/work-centers/:id/edit" element={<ProtectedRoute><WorkCenterForm /></ProtectedRoute>} />
            <Route path="/manufacturing/planning" element={<ProtectedRoute><ProductionPlanning /></ProtectedRoute>} />
            <Route path="/shop-floor" element={<ProtectedRoute><ShopFloor /></ProtectedRoute>} />

            {/* Invoices module */}
            <Route path="/invoicing" element={<ProtectedRoute><BillsList /></ProtectedRoute>} />
            <Route path="/invoicing/bills" element={<ProtectedRoute><BillsList /></ProtectedRoute>} />
            <Route path="/invoicing/minimum-bills" element={<ProtectedRoute><MinimumBillsList /></ProtectedRoute>} />
            <Route path="/invoicing/kh-bills" element={<ProtectedRoute><KHBillsList /></ProtectedRoute>} />
            <Route path="/invoicing/payments" element={<ProtectedRoute><PaymentsList /></ProtectedRoute>} />
            <Route path="/invoicing/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
            <Route path="/invoicing/*" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </CustomizationProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
