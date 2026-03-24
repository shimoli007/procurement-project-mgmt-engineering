export const ROLES = ['Sales', 'Engineer', 'Procurement'] as const
export type Role = typeof ROLES[number]

export const ORDER_STATUSES = ['Pending', 'Ordered', 'Shipped', 'Delivered', 'Cancelled'] as const
export type OrderStatus = typeof ORDER_STATUSES[number]

export const PROJECT_STATUSES = ['Active', 'On Hold', 'Completed', 'Cancelled'] as const
export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const ITEM_CATEGORIES = ['Electrical', 'Mechanical', 'Civil', 'Piping', 'Safety', 'General'] as const
export const ITEM_UNITS = ['pcs', 'kg', 'm', 'lot', 'set', 'roll', 'box'] as const
