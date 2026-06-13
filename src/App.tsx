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
import ProductScanLookup from "@/pages/inventory/ProductScanLookup";

// Barcode workspace (Phase 1 Batch 2)
import ScanQueueDashboard from "@/pages/barcode/ScanQueueDashboard";
import ScanWorkspace from "@/pages/barcode/ScanWorkspace";
import LabelsPage from "@/pages/barcode/LabelsPage";
import ScanHistoryPage from "@/pages/barcode/ScanHistoryPage";
import StockDashboard from "@/pages/inventory/StockDashboard";
import DeliveryNotesList from "@/pages/inventory/DeliveryNotesList";
import DeliveryNoteDetail from "@/pages/inventory/DeliveryNoteDetail";
import DeliveryNotePrint from "@/pages/inventory/DeliveryNotePrint";
import GoodsReceiptsList from "@/pages/inventory/GoodsReceiptsList";
import GoodsReceiptWizard from "@/pages/inventory/GoodsReceiptWizard";
import CorrectionOrdersList from "@/pages/inventory/CorrectionOrdersList";
import CorrectionOrderDetail from "@/pages/inventory/CorrectionOrderDetail";
import InternalMovementsList from "@/pages/inventory/InternalMovementsList";
import InternalMovementDetail from "@/pages/inventory/InternalMovementDetail";
import InternalMovementForm from "@/pages/inventory/InternalMovementForm";
import StockCountsList from "@/pages/inventory/StockCountsList";
import StockCountDetail from "@/pages/inventory/StockCountDetail";
import WriteOffsList from "@/pages/inventory/WriteOffsList";
import WriteOffDetail from "@/pages/inventory/WriteOffDetail";

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
import WorkOrderDetail from "@/pages/manufacturing/WorkOrderDetail";
import BOMList from "@/pages/manufacturing/BOMList";
import WorkCenters from "@/pages/manufacturing/WorkCenters";
import WorkCenterForm from "@/pages/manufacturing/WorkCenterForm";
import ProductionPlanning from "@/pages/manufacturing/ProductionPlanning";
import ShopFloor from "@/pages/manufacturing/ShopFloor";
import ShopFloorHome from "@/pages/shopfloor/ShopFloorHome";
import ShopFloorWorkOrderDetail from "@/pages/shopfloor/ShopFloorWorkOrderDetail";
import FactoryInventoryPage from "@/pages/shopfloor/FactoryInventory";

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
import InvoiceDetail from "@/pages/invoicing/InvoiceDetail";
import BillsList from "@/pages/invoicing/BillsList";
import WarrantyBillsList from "@/pages/invoicing/WarrantyBillsList";
import FactoryBillsList from "@/pages/invoicing/FactoryBillsList";
import PaymentsList from "@/pages/invoicing/PaymentsList";

// Settings pages
import GeneralSettings from "@/pages/settings/GeneralSettings";
import CustomizationSettings from "@/pages/settings/CustomizationSettings";
import StudioEditor from "@/pages/settings/StudioEditor";
import UsersManagement from "@/pages/settings/UsersManagement";
import RolesManagement from "@/pages/settings/RolesManagement";
import AuditLogs from "@/pages/settings/AuditLogs";
import BackupsSettings from "@/pages/settings/BackupsSettings";
import NumberingSettings from "@/pages/settings/NumberingSettings";
import CRMPipelinesSettings from "@/pages/settings/CRMPipelinesSettings";
import CRMBackupSettings from "@/pages/settings/CRMBackupSettings";
import CRMDataSchema from "@/pages/settings/CRMDataSchema";
import AccessibilitySettings from "@/pages/settings/AccessibilitySettings";
import PriceApprovalsPage from "@/pages/settings/PriceApprovalsPage";
import CompanySettings from "@/pages/settings/CompanySettings";
import PaymentAccountsSettings from "@/pages/settings/PaymentAccountsSettings";
import VendorsSettings from "@/pages/settings/VendorsSettings";

// Vendor Orders module
import VendorOrdersList from "@/pages/vendor-orders/VendorOrdersList";
import VendorOrderForm from "@/pages/vendor-orders/VendorOrderForm";
import VendorOrderDetail from "@/pages/vendor-orders/VendorOrderDetail";

// Print framework (Phase 1 Batch 4)
import PrintRoute from "@/pages/print/PrintRoute";

import NotFound from "@/pages/NotFound";

// Dashboards module
import DashboardsHome from "@/pages/dashboards/DashboardsHome";
import SuperAdminDashboard from "@/pages/dashboards/SuperAdminDashboard";
import SalesManagerDashboard from "@/pages/dashboards/SalesManagerDashboard";
import SalesRepDashboard from "@/pages/dashboards/SalesRepDashboard";
import WarehouseDashboard from "@/pages/dashboards/WarehouseDashboard";
import AccountantDashboard from "@/pages/dashboards/AccountantDashboard";
import HRDashboard from "@/pages/dashboards/HRDashboard";
import EmployeeDashboard from "@/pages/dashboards/EmployeeDashboard";

// Chat module
import ChatPage from "@/pages/chat/ChatPage";
import ChatDMRedirect from "@/pages/chat/ChatDMRedirect";
import MentionsPage from "@/pages/chat/MentionsPage";
import ChatSearchPage from "@/pages/chat/ChatSearchPage";
import ChatNotificationsPage from "@/pages/chat/ChatNotificationsPage";

// HR/Employees pages
import EmployeesOverview from "@/pages/employees/EmployeesOverview";
import EmployeesDirectory from "@/pages/employees/EmployeesDirectory";
import EmployeeForm from "@/pages/employees/EmployeeForm";
import EmployeeDetail from "@/pages/employees/EmployeeDetail";
import DepartmentsList from "@/pages/employees/DepartmentsList";
import DepartmentDetail from "@/pages/employees/DepartmentDetail";
import ContractsList from "@/pages/employees/ContractsList";
import ContractForm from "@/pages/employees/ContractForm";
import ContractDetail from "@/pages/employees/ContractDetail";

// Attendance pages (HR Batch 2)
import ClockIn from "@/pages/attendance/ClockIn";
import MyAttendance from "@/pages/attendance/MyAttendance";
import TeamAttendance from "@/pages/attendance/TeamAttendance";
import AdminAttendance from "@/pages/attendance/AdminAttendance";
import AdminImport from "@/pages/attendance/AdminImport";
import LocationsPage from "@/pages/attendance/Locations";
import HolidaysPage from "@/pages/attendance/Holidays";
import WorkSchedulesPage from "@/pages/attendance/WorkSchedules";
import RosterPlanning from "@/pages/attendance/RosterPlanning";
import RosterReschedule from "@/pages/attendance/RosterReschedule";

// Leave pages (HR Batch 3)
import MyLeaves from "@/pages/leave/MyLeaves";
import ApplyLeave from "@/pages/leave/ApplyLeave";
import LeaveDetail from "@/pages/leave/LeaveDetail";
import TeamLeaves from "@/pages/leave/TeamLeaves";
import LeaveCalendar from "@/pages/leave/LeaveCalendar";
import AdminRequests from "@/pages/leave/AdminRequests";
import AdminBalances from "@/pages/leave/AdminBalances";
import AdminEntitlements from "@/pages/leave/AdminEntitlements";
import AdminLeaveTypes from "@/pages/leave/AdminLeaveTypes";
import AdminCompOff from "@/pages/leave/AdminCompOff";

// Payroll pages (HR Batch 4)
import PayrollDashboard from "@/pages/payroll/PayrollDashboard";
import PayrollPeriodsList from "@/pages/payroll/PayrollPeriodsList";
import PayrollPeriodDetail from "@/pages/payroll/PayrollPeriodDetail";
import PayslipDetail from "@/pages/payroll/PayslipDetail";
import MyPayslips from "@/pages/payroll/MyPayslips";
import AdminComponents from "@/pages/payroll/admin/AdminComponents";
import AdminPayrollSettings from "@/pages/payroll/admin/AdminSettings";
import AdminLoans from "@/pages/payroll/admin/AdminLoans";
import AdminAdvances from "@/pages/payroll/admin/AdminAdvances";

// Appraisals pages (HR Batch 5)
import AppraisalsOverview from "@/pages/appraisals/AppraisalsOverview";
import MyAppraisals from "@/pages/appraisals/MyAppraisals";
import AppraisalSelfReview from "@/pages/appraisals/SelfReview";
import AppraisalManagerReview from "@/pages/appraisals/ManagerReview";
import AppraisalHRReview from "@/pages/appraisals/HRReview";
import AppraisalDetail from "@/pages/appraisals/AppraisalDetail";
import TeamAppraisals from "@/pages/appraisals/TeamAppraisals";
import AdminCycles from "@/pages/appraisals/admin/AdminCycles";
import AdminCycleDetail from "@/pages/appraisals/admin/CycleDetail";
import AdminAppraisalTemplates from "@/pages/appraisals/admin/AdminTemplates";
import AdminAppraisalReports from "@/pages/appraisals/admin/AdminReports";

// Reports module
import ReportsHub from "@/pages/reports/ReportsHub";
import ReportPage from "@/pages/reports/ReportPage";
import {
  SalesReportsLanding,
  InventoryReportsLanding,
  ManufacturingReportsLanding,
  InvoicingReportsLanding,
  EmployeesReportsLanding,
  AttendanceReportsLanding,
  LeaveReportsLanding,
  PayrollReportsLanding,
  AppraisalsReportsLanding,
  CRMReportsLanding,
} from "@/pages/reports/modulePages";

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
            <Route path="/inventory/delivery-notes" element={<ProtectedRoute><DeliveryNotesList /></ProtectedRoute>} />
            <Route path="/inventory/delivery-notes/:id" element={<ProtectedRoute><DeliveryNoteDetail /></ProtectedRoute>} />
            <Route path="/inventory/delivery-notes/:id/print" element={<ProtectedRoute><DeliveryNotePrint /></ProtectedRoute>} />
            <Route path="/inventory/goods-receipts" element={<ProtectedRoute><GoodsReceiptsList /></ProtectedRoute>} />
            <Route path="/inventory/goods-receipts/new" element={<ProtectedRoute><GoodsReceiptWizard /></ProtectedRoute>} />
            <Route path="/inventory/goods-receipts/:id" element={<ProtectedRoute><GoodsReceiptWizard /></ProtectedRoute>} />
            <Route path="/inventory/correction-orders" element={<ProtectedRoute><CorrectionOrdersList /></ProtectedRoute>} />
            <Route path="/inventory/correction-orders/:id" element={<ProtectedRoute><CorrectionOrderDetail /></ProtectedRoute>} />
            <Route path="/inventory/internal-movements" element={<ProtectedRoute><InternalMovementsList /></ProtectedRoute>} />
            <Route path="/inventory/internal-movements/new" element={<ProtectedRoute><InternalMovementForm /></ProtectedRoute>} />
            <Route path="/inventory/internal-movements/:id" element={<ProtectedRoute><InternalMovementDetail /></ProtectedRoute>} />
            <Route path="/inventory/stock-counts" element={<ProtectedRoute><StockCountsList /></ProtectedRoute>} />
            <Route path="/inventory/stock-counts/:id" element={<ProtectedRoute><StockCountDetail /></ProtectedRoute>} />
            <Route path="/inventory/write-offs" element={<ProtectedRoute><WriteOffsList /></ProtectedRoute>} />
            <Route path="/inventory/write-offs/:id" element={<ProtectedRoute><WriteOffDetail /></ProtectedRoute>} />

            {/* Barcode module */}
            <Route path="/barcode" element={<ProtectedRoute><ScanQueueDashboard /></ProtectedRoute>} />
            <Route path="/barcode/scan/:queueId" element={<ProtectedRoute><ScanWorkspace /></ProtectedRoute>} />
            <Route path="/barcode/labels" element={<ProtectedRoute><LabelsPage /></ProtectedRoute>} />
            <Route path="/barcode/history" element={<ProtectedRoute><ScanHistoryPage /></ProtectedRoute>} />
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
            <Route path="/sales/reports" element={<ProtectedRoute><SalesReportsLanding /></ProtectedRoute>} />
            <Route path="/sales/reports/legacy" element={<ProtectedRoute><SalesReports /></ProtectedRoute>} />
            <Route path="/sales/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
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
            <Route path="/settings/numbering" element={<ProtectedRoute><NumberingSettings /></ProtectedRoute>} />
            <Route path="/settings/crm-pipelines" element={<ProtectedRoute><CRMPipelinesSettings /></ProtectedRoute>} />
            <Route path="/settings/crm-backup" element={<ProtectedRoute><CRMBackupSettings /></ProtectedRoute>} />
            <Route path="/settings/data-schema" element={<ProtectedRoute><CRMDataSchema /></ProtectedRoute>} />
            <Route path="/settings/accessibility" element={<ProtectedRoute><AccessibilitySettings /></ProtectedRoute>} />
            <Route path="/settings/price-approvals" element={<ProtectedRoute><PriceApprovalsPage /></ProtectedRoute>} />
            <Route path="/settings/company" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
            <Route path="/settings/payment-accounts" element={<ProtectedRoute><PaymentAccountsSettings /></ProtectedRoute>} />
            <Route path="/settings/vendors" element={<ProtectedRoute><VendorsSettings /></ProtectedRoute>} />

            {/* Vendor Orders module */}
            <Route path="/vendor-orders" element={<ProtectedRoute><VendorOrdersList /></ProtectedRoute>} />
            <Route path="/vendor-orders/new" element={<ProtectedRoute><VendorOrderForm /></ProtectedRoute>} />
            <Route path="/vendor-orders/:id" element={<ProtectedRoute><VendorOrderDetail /></ProtectedRoute>} />

            {/* Universal Print routes */}
            <Route path="/print/:documentType/:documentId" element={<ProtectedRoute><PrintRoute /></ProtectedRoute>} />

            {/* Dashboards module */}
            <Route path="/dashboards" element={<ProtectedRoute><DashboardsHome /></ProtectedRoute>} />
            <Route path="/dashboards/admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/sales-manager" element={<ProtectedRoute><SalesManagerDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/sales-rep" element={<ProtectedRoute><SalesRepDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/warehouse" element={<ProtectedRoute><WarehouseDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/accountant" element={<ProtectedRoute><AccountantDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/hr" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/me" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/dashboards/crm" element={<ProtectedRoute><CRMOverview /></ProtectedRoute>} />
            <Route path="/discuss" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

            {/* Chat module */}
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/mentions" element={<ProtectedRoute><MentionsPage /></ProtectedRoute>} />
            <Route path="/chat/search" element={<ProtectedRoute><ChatSearchPage /></ProtectedRoute>} />
            <Route path="/chat/notifications" element={<ProtectedRoute><ChatNotificationsPage /></ProtectedRoute>} />
            <Route path="/chat/channels/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/dms/:userId" element={<ProtectedRoute><ChatDMRedirect /></ProtectedRoute>} />

            {/* HR / Employees module */}
            <Route path="/employees" element={<ProtectedRoute><EmployeesOverview /></ProtectedRoute>} />
            <Route path="/employees/directory" element={<ProtectedRoute><EmployeesDirectory /></ProtectedRoute>} />
            <Route path="/employees/new" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
            <Route path="/employees/departments" element={<ProtectedRoute><DepartmentsList /></ProtectedRoute>} />
            <Route path="/employees/departments/:id" element={<ProtectedRoute><DepartmentDetail /></ProtectedRoute>} />
            <Route path="/employees/contracts" element={<ProtectedRoute><ContractsList /></ProtectedRoute>} />
            <Route path="/employees/contracts/new" element={<ProtectedRoute><ContractForm /></ProtectedRoute>} />
            <Route path="/employees/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
            <Route path="/employees/:id/edit" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />

            {/* Attendance module (HR Batch 2) */}
            <Route path="/attendance/clock-in" element={<ProtectedRoute><ClockIn /></ProtectedRoute>} />
            <Route path="/attendance/my" element={<ProtectedRoute><MyAttendance /></ProtectedRoute>} />
            <Route path="/attendance/team" element={<ProtectedRoute><TeamAttendance /></ProtectedRoute>} />
            <Route path="/attendance/admin" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
            <Route path="/attendance/admin/import" element={<ProtectedRoute><AdminImport /></ProtectedRoute>} />
            <Route path="/attendance/locations" element={<ProtectedRoute><LocationsPage /></ProtectedRoute>} />
            <Route path="/attendance/holidays" element={<ProtectedRoute><HolidaysPage /></ProtectedRoute>} />
            <Route path="/attendance/work-schedules" element={<ProtectedRoute><WorkSchedulesPage /></ProtectedRoute>} />
            <Route path="/attendance/roster" element={<ProtectedRoute><RosterPlanning /></ProtectedRoute>} />
            <Route path="/attendance/roster/reschedule" element={<ProtectedRoute><RosterReschedule /></ProtectedRoute>} />

            {/* Leave routes (HR Batch 3) */}
            <Route path="/leave/my-leaves" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
            <Route path="/leave/apply" element={<ProtectedRoute><ApplyLeave /></ProtectedRoute>} />
            <Route path="/leave/team" element={<ProtectedRoute><TeamLeaves /></ProtectedRoute>} />
            <Route path="/leave/calendar" element={<ProtectedRoute><LeaveCalendar /></ProtectedRoute>} />
            <Route path="/leave/admin/requests" element={<ProtectedRoute><AdminRequests /></ProtectedRoute>} />
            <Route path="/leave/admin/balances" element={<ProtectedRoute><AdminBalances /></ProtectedRoute>} />
            <Route path="/leave/admin/entitlements" element={<ProtectedRoute><AdminEntitlements /></ProtectedRoute>} />
            <Route path="/leave/admin/types" element={<ProtectedRoute><AdminLeaveTypes /></ProtectedRoute>} />
            <Route path="/leave/admin/comp-off" element={<ProtectedRoute><AdminCompOff /></ProtectedRoute>} />
            <Route path="/leave/:id" element={<ProtectedRoute><LeaveDetail /></ProtectedRoute>} />

            {/* Payroll routes (HR Batch 4) */}
            <Route path="/payroll" element={<ProtectedRoute><PayrollDashboard /></ProtectedRoute>} />
            <Route path="/payroll/periods" element={<ProtectedRoute><PayrollPeriodsList /></ProtectedRoute>} />
            <Route path="/payroll/periods/:id" element={<ProtectedRoute><PayrollPeriodDetail /></ProtectedRoute>} />
            <Route path="/payroll/payslips/:id" element={<ProtectedRoute><PayslipDetail /></ProtectedRoute>} />
            <Route path="/payroll/my-payslips" element={<ProtectedRoute><MyPayslips /></ProtectedRoute>} />
            <Route path="/payroll/admin/components" element={<ProtectedRoute><AdminComponents /></ProtectedRoute>} />
            <Route path="/payroll/admin/settings" element={<ProtectedRoute><AdminPayrollSettings /></ProtectedRoute>} />
            <Route path="/payroll/admin/loans" element={<ProtectedRoute><AdminLoans /></ProtectedRoute>} />
            <Route path="/payroll/admin/advances" element={<ProtectedRoute><AdminAdvances /></ProtectedRoute>} />

            {/* Appraisals routes (HR Batch 5) */}
            <Route path="/appraisals" element={<ProtectedRoute><AppraisalsOverview /></ProtectedRoute>} />
            <Route path="/appraisals/my-appraisals" element={<ProtectedRoute><MyAppraisals /></ProtectedRoute>} />
            <Route path="/appraisals/team" element={<ProtectedRoute><TeamAppraisals /></ProtectedRoute>} />
            <Route path="/appraisals/admin/cycles" element={<ProtectedRoute><AdminCycles /></ProtectedRoute>} />
            <Route path="/appraisals/admin/cycles/:id" element={<ProtectedRoute><AdminCycleDetail /></ProtectedRoute>} />
            <Route path="/appraisals/admin/templates" element={<ProtectedRoute><AdminAppraisalTemplates /></ProtectedRoute>} />
            <Route path="/appraisals/admin/reports" element={<ProtectedRoute><AdminAppraisalReports /></ProtectedRoute>} />
            <Route path="/appraisals/:id/self-review" element={<ProtectedRoute><AppraisalSelfReview /></ProtectedRoute>} />
            <Route path="/appraisals/:id/manager-review" element={<ProtectedRoute><AppraisalManagerReview /></ProtectedRoute>} />
            <Route path="/appraisals/:id/hr-review" element={<ProtectedRoute><AppraisalHRReview /></ProtectedRoute>} />
            <Route path="/appraisals/:id" element={<ProtectedRoute><AppraisalDetail /></ProtectedRoute>} />

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
            <Route path="/manufacturing/work-orders/:id" element={<ProtectedRoute><WorkOrderDetail /></ProtectedRoute>} />
            <Route path="/manufacturing/bom" element={<ProtectedRoute><BOMList /></ProtectedRoute>} />
            <Route path="/manufacturing/work-centers" element={<ProtectedRoute><WorkCenters /></ProtectedRoute>} />
            <Route path="/manufacturing/work-centers/new" element={<ProtectedRoute><WorkCenterForm /></ProtectedRoute>} />
            <Route path="/manufacturing/work-centers/:id/edit" element={<ProtectedRoute><WorkCenterForm /></ProtectedRoute>} />
            <Route path="/manufacturing/planning" element={<ProtectedRoute><ProductionPlanning /></ProtectedRoute>} />
            <Route path="/shop-floor" element={<ProtectedRoute><ShopFloorHome /></ProtectedRoute>} />
            <Route path="/shop-floor/work-orders/:id" element={<ProtectedRoute><ShopFloorWorkOrderDetail /></ProtectedRoute>} />
            <Route path="/shop-floor/factory-inventory" element={<ProtectedRoute><FactoryInventoryPage /></ProtectedRoute>} />
            <Route path="/manufacturing/shop-floor" element={<ProtectedRoute><ShopFloor /></ProtectedRoute>} />

            {/* Invoices module */}
            <Route path="/invoicing" element={<ProtectedRoute><BillsList /></ProtectedRoute>} />
            <Route path="/invoicing/bills" element={<ProtectedRoute><BillsList /></ProtectedRoute>} />
            <Route path="/invoicing/warranty-bills" element={<ProtectedRoute><WarrantyBillsList /></ProtectedRoute>} />
            <Route path="/invoicing/factory-bills" element={<ProtectedRoute><FactoryBillsList /></ProtectedRoute>} />
            <Route path="/invoicing/payments" element={<ProtectedRoute><PaymentsList /></ProtectedRoute>} />
            <Route path="/invoicing/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
            <Route path="/invoicing/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/invoicing/reports" element={<ProtectedRoute><InvoicingReportsLanding /></ProtectedRoute>} />
            <Route path="/invoicing/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/invoicing/*" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />

            {/* Reports module */}
            <Route path="/reports" element={<ProtectedRoute><ReportsHub /></ProtectedRoute>} />
            <Route path="/inventory/reports" element={<ProtectedRoute><InventoryReportsLanding /></ProtectedRoute>} />
            <Route path="/inventory/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/manufacturing/reports" element={<ProtectedRoute><ManufacturingReportsLanding /></ProtectedRoute>} />
            <Route path="/manufacturing/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/employees/reports" element={<ProtectedRoute><EmployeesReportsLanding /></ProtectedRoute>} />
            <Route path="/employees/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/attendance/reports" element={<ProtectedRoute><AttendanceReportsLanding /></ProtectedRoute>} />
            <Route path="/attendance/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/leave/reports" element={<ProtectedRoute><LeaveReportsLanding /></ProtectedRoute>} />
            <Route path="/leave/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/payroll/reports" element={<ProtectedRoute><PayrollReportsLanding /></ProtectedRoute>} />
            <Route path="/payroll/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/appraisals/reports" element={<ProtectedRoute><AppraisalsReportsLanding /></ProtectedRoute>} />
            <Route path="/appraisals/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/crm/reports" element={<ProtectedRoute><CRMReportsLanding /></ProtectedRoute>} />
            <Route path="/crm/reports/:reportKey" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

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
