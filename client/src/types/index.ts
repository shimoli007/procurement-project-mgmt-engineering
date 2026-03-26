export interface User {
  id: number;
  name: string;
  email: string;
  role: 'CEO' | 'Sales' | 'Engineer' | 'Procurement';
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  notes: string;
}

export interface Item {
  id: number;
  name: string;
  item_code?: string;
  description: string;
  unit: string;
  category: string;
  suppliers?: ItemSupplier[];
}

export interface ItemSupplier {
  id: number;
  item_id: number;
  supplier_id: number;
  supplier_name?: string;
  unit_price: number;
  lead_time_days: number;
  is_preferred: number;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  client_name: string;
  status: string;
  start_date: string;
  target_date: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
}

export interface BomLine {
  id: number;
  project_id: number;
  item_id: number;
  quantity: number;
  notes: string;
  item_name?: string;
  item_unit?: string;
  item_category?: string;
}

export interface Order {
  id: number;
  project_id: number;
  item_id: number;
  supplier_id: number;
  quantity: number;
  unit_price: number;
  status: string;
  requested_by: number;
  assigned_to: number;
  order_date: string;
  expected_date: string;
  delivered_date: string;
  notes: string;
  item_name?: string;
  supplier_name?: string;
  project_name?: string;
  requester_name?: string;
  assignee_name?: string;
  created_at: string;
}

export interface TimelineEntry {
  id: number;
  order_id: number;
  from_status: string;
  to_status: string;
  changed_by: number;
  changer_name?: string;
  note: string;
  changed_at: string;
}

export interface MaterialLine {
  item_id: number;
  item_name: string;
  unit: string;
  category: string;
  quantity_needed: number;
  quantity_ordered: number;
  quantity_delivered: number;
  readiness_pct: number;
}

export interface DashboardSummary {
  total_orders: number;
  pending_orders: number;
  ordered_count: number;
  shipped_count: number;
  delivered_count: number;
  overdue_count: number;
  total_projects: number;
  active_projects: number;
  total_items: number;
  total_order_value: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string;
  entity_id: number;
  is_read: number;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  user_id: number;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: string;
  new_values: string;
  created_at: string;
}

export interface ReportSummary {
  total_orders: number;
  total_value: number;
  by_status: { status: string; count: number; value: number }[];
  by_supplier: { supplier_name: string; count: number; value: number; avg_lead_time: number }[];
}

export interface SupplierPerformance {
  supplier_id: number;
  supplier_name: string;
  total_orders: number;
  delivered_orders: number;
  on_time_pct: number;
  avg_lead_time: number;
  total_value: number;
}

export interface ProjectReportData {
  project: Project;
  bom: BomLine[];
  orders: Order[];
  material_list: MaterialLine[];
  total_bom_value: number;
  total_ordered_value: number;
  overall_readiness: number;
}
