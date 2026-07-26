// Update this IP to match your computer's current Wi-Fi IPv4 address
// (run `ipconfig` and look under "Wireless LAN adapter Wi-Fi") whenever it changes.
export const API_URL = 'http://192.168.254.131/goventure_php/api.php';
export const LOGIN_API_URL = `${API_URL}?action=login`;
export const REGISTER_API_URL = `${API_URL}?action=register`;

// ── Admin: Accounts ──
export const ACCOUNTS_LIST_API_URL = `${API_URL}?action=accounts_list`;
export const ACCOUNT_CREATE_API_URL = `${API_URL}?action=account_create`;
export const ACCOUNT_UPDATE_API_URL = `${API_URL}?action=account_update`;

// ── Admin: Bookings ──
export const BOOKINGS_LIST_API_URL = `${API_URL}?action=bookings_list`;
export const BOOKING_UPDATE_STATUS_API_URL = `${API_URL}?action=booking_update_status`;

// ── Admin: Payments ──
export const PAYMENTS_LIST_API_URL = `${API_URL}?action=payments_list`;
export const PAYMENT_MARK_PAID_API_URL = `${API_URL}?action=payment_mark_paid`;
export const QR_METHODS_LIST_API_URL = `${API_URL}?action=qr_methods_list`;
export const QR_METHOD_CREATE_API_URL = `${API_URL}?action=qr_method_create`;

// ── Admin: Messages ──
export const ADMIN_CONVERSATIONS_LIST_API_URL = `${API_URL}?action=admin_conversations_list`;
export const ADMIN_SEND_MESSAGE_API_URL = `${API_URL}?action=admin_send_message`;
export const ADMIN_MARK_CONVERSATION_READ_API_URL = `${API_URL}?action=admin_mark_conversation_read`;

// ── Admin: Tours ──
export const TOURS_LIST_API_URL = `${API_URL}?action=tours_list`;
export const TOUR_CREATE_API_URL = `${API_URL}?action=tour_create`;
export const DEPARTURE_UPDATE_AVAILABILITY_API_URL = `${API_URL}?action=departure_update_availability`;

// ── Admin: Dashboard ──
export const DASHBOARD_DATA_API_URL = `${API_URL}?action=dashboard_data`;

// ── Client: Bookings ──
export const CLIENT_BOOKINGS_LIST_API_URL = `${API_URL}?action=client_bookings_list`;
export const BOOKING_CREATE_API_URL = `${API_URL}?action=booking_create`;
export const CLIENT_CANCEL_BOOKING_API_URL = `${API_URL}?action=client_cancel_booking`;

// ── Client: Account ──
export const CLIENT_ACCOUNT_GET_API_URL = `${API_URL}?action=client_account_get`;

// ── Client: Messages ──
export const CLIENT_CONVERSATIONS_LIST_API_URL = `${API_URL}?action=client_conversations_list`;
export const CLIENT_SEND_MESSAGE_API_URL = `${API_URL}?action=client_send_message`;
export const CLIENT_MARK_CONVERSATION_READ_API_URL = `${API_URL}?action=client_mark_conversation_read`;
export const CLIENT_END_CONVERSATION_API_URL = `${API_URL}?action=client_end_conversation`;

// ── Client: Documents ──
export const CLIENT_DOCUMENTS_LIST_API_URL = `${API_URL}?action=client_documents_list`;
export const DOCUMENT_UPLOAD_API_URL = `${API_URL}?action=document_upload`;
export const DOCUMENT_REMOVE_API_URL = `${API_URL}?action=document_remove`;

// ── Client: Plan a Trip ──
export const TRIP_REQUESTS_LIST_API_URL = `${API_URL}?action=trip_requests_list`;
export const TRIP_REQUEST_CREATE_API_URL = `${API_URL}?action=trip_request_create`;
export const TRIP_REQUEST_REMOVE_API_URL = `${API_URL}?action=trip_request_remove`;

// ── Client: Favorites ──
export const CLIENT_FAVORITES_LIST_API_URL = `${API_URL}?action=client_favorites_list`;
export const FAVORITE_TOGGLE_API_URL = `${API_URL}?action=favorite_toggle`;
