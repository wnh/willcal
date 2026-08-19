// Types shared between the browser client and the Node server.
//
// Dates cannot survive JSON, so everything that crosses the wire uses ISO
// strings (the `Wire*` types). The client converts them back to Date objects
// at the edge in src/client/api.ts, so UI code keeps working with Dates.

export const PASTEL_COLORS = [
  '#E57373', // Coral Pink
  '#FF8A65', // Peach
  '#FFD54F', // Golden Yellow
  '#AED581', // Lime Green
  '#4DB6AC', // Teal/Mint
  '#4DD0E1', // Cyan
  '#64B5F6', // Sky Blue
  '#9575CD', // Lavender
  '#F06292', // Magenta
  '#F48FB1', // Rose Pink
  '#FFAB91', // Light Coral
  '#FFF176', // Lemon Yellow
  '#81C784', // Soft Green
  '#4FC3F7', // Light Blue
  '#BA68C8', // Purple
  '#90A4AE', // Blue Gray
];

export interface Category {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  includeInTotals: boolean;
}

export interface CalendarBlock {
  id: number;
  title: string;
  start: Date;
  end: Date;
  categoryId?: number; // Optional for backwards compatibility
}

/** A CalendarBlock as it travels over JSON-RPC. */
export interface WireBlock {
  id: number;
  title: string;
  start: string;
  end: string;
  categoryId?: number;
}

export interface CategoryUpdates {
  name?: string;
  color?: string;
  includeInTotals?: boolean;
}

/** Result of the 30-second poll that drives the upcoming-block notification. */
export interface UpcomingResult {
  next: WireBlock | null;
  current: WireBlock | null;
}

/** JSON-RPC error codes. -32000 and below are ours; the rest are the spec's. */
export const RPC_PARSE_ERROR = -32700;
export const RPC_INVALID_REQUEST = -32600;
export const RPC_METHOD_NOT_FOUND = -32601;
export const RPC_INVALID_PARAMS = -32602;
export const RPC_INTERNAL_ERROR = -32603;
/** An application-level failure, e.g. deleting a category that is in use. */
export const RPC_APP_ERROR = -32000;
/** No valid session cookie. The client responds by showing the login screen. */
export const RPC_UNAUTHORIZED = -32001;
/** Too many failed logins from this address. */
export const RPC_RATE_LIMITED = -32002;
