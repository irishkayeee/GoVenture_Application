/**
 * navConfig.tsx
 * Shared tab list + icons for the client area. Split the same way as the
 * admin dashboard: BottomNav holds the frequent tabs (Dashboard, Messages,
 * Account), everything else lives in the sidebar's Main Menu.
 */

import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { C } from './theme';

export type IconProps = { color?: string };
export type TabKey = 'dashboard' | 'tours' | 'bookings' | 'documents' | 'messages' | 'notifications' | 'account';

const GridIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth={1.8} />
    <Rect x="13" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth={1.8} />
    <Rect x="3" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth={1.8} />
    <Rect x="13" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const MapIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M9 4v13M15 7v13" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const BagIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="8" width="18" height="12" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={1.8} />
    <Path d="M3 13h18" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const DocumentIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M14 3v4h4M9 13h6M9 17h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const MessageIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1H9l-5 4V6a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const BellIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2a6 6 0 00-6 6v3.6c0 .7-.24 1.38-.68 1.92L4 15.5c-.7.86-.08 2.15 1.02 2.15h13.96c1.1 0 1.72-1.29 1.02-2.15l-1.32-2.5A3 3 0 0118 11.6V8a6 6 0 00-6-6z" />
    <Path d="M9.5 19.5a2.5 2.5 0 005 0h-5z" />
  </Svg>
);

const AccountIcon = ({ color = C.brownMid }: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={3.6} stroke={color} strokeWidth={1.8} />
    <Path d="M4.5 20c0-3.9 3.4-7 7.5-7s7.5 3.1 7.5 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

type NavTabDef = { key: TabKey; label: string; Icon: React.FC<IconProps> };

/** Shown in the bottom tab bar — the tabs you reach for most often. */
export const BOTTOM_NAV_TABS: NavTabDef[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: GridIcon },
  { key: 'messages',  label: 'Messages',  Icon: MessageIcon },
  { key: 'account',   label: 'Account',   Icon: AccountIcon },
];

/** Shown in the sidebar's Main Menu. */
export const SIDEBAR_NAV_TABS: NavTabDef[] = [
  { key: 'tours',         label: 'Tours',         Icon: MapIcon },
  { key: 'bookings',      label: 'My Bookings',   Icon: BagIcon },
  { key: 'documents',     label: 'Documents',     Icon: DocumentIcon },
  { key: 'notifications', label: 'Notifications', Icon: BellIcon },
];

export const TAB_META: Record<Exclude<TabKey, 'dashboard' | 'account'>, { emoji: string; label: string }> = {
  tours:         { emoji: '🗺️', label: 'Tours' },
  bookings:      { emoji: '🧳', label: 'My Bookings' },
  documents:     { emoji: '📄', label: 'Documents' },
  messages:      { emoji: '✉️', label: 'Messages' },
  notifications: { emoji: '🔔', label: 'Notifications' },
};
