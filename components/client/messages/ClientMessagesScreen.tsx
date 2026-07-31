/**
 * ClientMessagesScreen.tsx
 * Client-side Messages tab — mobile navigation pattern only (no side-by-side
 * desktop columns): a conversation list screen, a chat thread screen reached
 * by tapping a conversation, and an "About This Tour" info panel reached
 * from the chat header, shown as a bottom sheet.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Image,
  StyleSheet, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { TourConversation, ChatMessage, QUICK_REPLIES } from './mockData';
import TourInfoPanel from './TourInfoPanel';
import { useAuth } from '@/components/auth/AuthContext';
import { useBookings } from '../bookings/BookingsContext';
import {
  CLIENT_CONVERSATIONS_LIST_API_URL, CLIENT_SEND_MESSAGE_API_URL,
  CLIENT_MARK_CONVERSATION_READ_API_URL, CLIENT_END_CONVERSATION_API_URL,
  CLIENT_ARCHIVE_CONVERSATION_API_URL, CLIENT_START_CONVERSATION_API_URL,
} from '@/constants/api';

type Filter = 'all' | 'unread' | 'archived';

/* ── Icons ── */
const SearchIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={C.brownMid} strokeWidth={2} />
    <Path d="M21 21l-4.3-4.3" stroke={C.brownMid} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const BackIcon = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={C.brown} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const DotsIcon = ({ color = C.brownMid }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={5} r={1.6} fill={color} />
    <Circle cx={12} cy={12} r={1.6} fill={color} />
    <Circle cx={12} cy={19} r={1.6} fill={color} />
  </Svg>
);
const SendIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlusIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const ArchiveIcon = ({ color = C.brownMid }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M3 4h18v4H3V4zM5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CloseIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={C.brownMid} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);
const ChatTabIcon = ({ color = C.brownMid }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M4 5h16v11H8l-4 4V5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const UnreadTabIcon = ({ color = C.brownMid }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M9 12h6M9 15.5h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);
const HeadsetIcon = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 13v-1a8 8 0 0116 0v1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M4 13a2 2 0 012-2h1v5H6a2 2 0 01-2-2v-1zM20 13a2 2 0 00-2-2h-1v5h1a2 2 0 002-2v-1z" fill={color} />
    <Path d="M9 19a2 2 0 002 2h1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const PinIcon = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 22s7.5-7.94 7.5-13A7.5 7.5 0 004.5 9c0 5.06 7.5 13 7.5 13z" />
    <Circle cx={12} cy={9} r={2.6} fill={C.brown} />
  </Svg>
);

const formatDateLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ── Unread count pill (used on nav badge + per-conversation) ── */
export function UnreadBadge({ count, style }: { count: number; style?: object }) {
  if (count <= 0) return null;
  return (
    <View style={[ub.badge, style]}>
      <Text style={ub.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
const ub = StyleSheet.create({
  badge: {
    minWidth: 17, height: 17, borderRadius: 9, backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' },
});

/* ── Conversation list ── */
function ConversationList({
  conversations, activeId, search, setSearch, filter, setFilter, onSelect, onNewConversation,
  menuOpenId, setMenuOpenId, onToggleArchive,
}: {
  conversations: TourConversation[];
  activeId: string | null;
  search: string;
  setSearch: (v: string) => void;
  filter: Filter;
  setFilter: (v: Filter) => void;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  onToggleArchive: (c: TourConversation) => void;
}) {
  const filtered = conversations.filter((c) => {
    if (filter === 'archived') { if (!c.isArchived) return false; }
    else if (c.isArchived) return false;
    if (filter === 'unread' && c.unreadCount <= 0) return false;
    if (search.trim() && !c.destination.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });
  const anyUnread = conversations.some((c) => !c.isArchived && c.unreadCount > 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
      <View style={l.searchRow}>
        <SearchIcon />
        <TextInput
          style={l.searchInput}
          placeholder="Search messages..."
          placeholderTextColor={C.brownMid + '90'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <TouchableOpacity style={l.newConvoBtn} activeOpacity={0.85} onPress={onNewConversation}>
        <PlusIcon />
        <Text style={l.newConvoBtnText}>New Conversation</Text>
      </TouchableOpacity>

      <View style={l.tabRow}>
        {(['all', 'unread', 'archived'] as Filter[]).map((f) => {
          const active = filter === f;
          const tint = active ? C.brown : C.brownMid;
          return (
            <TouchableOpacity key={f} style={l.tabBtn} activeOpacity={0.75} onPress={() => setFilter(f)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {f === 'all' ? <ChatTabIcon color={tint} /> : f === 'unread' ? <UnreadTabIcon color={tint} /> : <ArchiveIcon color={tint} />}
                <Text style={[l.tabLabel, active && l.tabLabelActive]}>
                  {f === 'all' ? 'All Messages' : f === 'unread' ? 'Unread' : 'Archived'}
                </Text>
                {f === 'unread' && anyUnread && <View style={l.unreadDot} />}
              </View>
              {active && <View style={l.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={l.emptyWrap}>
          <Text style={l.emptyText}>No conversations found.</Text>
        </View>
      ) : (
        <View style={l.list}>
          {filtered.map((c) => {
            const isGeneral = !c.bookingId;
            return (
              <TouchableOpacity
                key={c.id}
                style={l.row}
                activeOpacity={0.8}
                onPress={() => onSelect(c.id)}
              >
                {c.photoUrl ? (
                  <Image source={{ uri: c.photoUrl }} style={l.avatarPhoto} resizeMode="cover" />
                ) : (
                  <View style={[l.avatar, { backgroundColor: isGeneral ? C.brownMid : C.amber }]}>
                    {isGeneral ? <HeadsetIcon /> : <PinIcon />}
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={l.rowDest} numberOfLines={1}>{c.destination}</Text>
                  <Text style={l.rowTeam} numberOfLines={1}>GoVenture Travel Team</Text>
                  <Text style={l.rowPreview} numberOfLines={1}>{c.lastMessage}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={l.rowTime}>{c.timeAgo}</Text>
                  <UnreadBadge count={c.unreadCount} />
                </View>
                <TouchableOpacity
                  style={l.menuBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={(e) => { e.stopPropagation?.(); setMenuOpenId(menuOpenId === c.id ? null : c.id); }}
                >
                  <DotsIcon />
                </TouchableOpacity>

                {menuOpenId === c.id && (
                  <View style={l.menuSheet}>
                    <TouchableOpacity style={l.menuRow} activeOpacity={0.75} onPress={() => { onToggleArchive(c); setMenuOpenId(null); }}>
                      <ArchiveIcon />
                      <Text style={l.menuRowText}>{c.isArchived ? 'Unarchive' : 'Archive'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Copyright />
    </ScrollView>
  );
}

/* ── Chat bubble ── */
function Bubble({ msg }: { msg: ChatMessage }) {
  const isSelf = msg.sender === 'client';
  return (
    <View style={[b.row, isSelf && b.rowSelf]}>
      {!isSelf && (
        <View style={b.avatar}>
          <Text style={b.avatarText}>G</Text>
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View style={[b.bubble, isSelf ? b.bubbleSelf : b.bubbleTeam]}>
          <Text style={[b.bubbleText, isSelf && b.bubbleTextSelf]}>{msg.text}</Text>
        </View>
        <Text style={[b.time, isSelf && b.timeSelf]}>{msg.time}</Text>
      </View>
    </View>
  );
}

/* ── Chat thread + input ── */
function ChatPanel({
  conversation, onBack, onInfo, onSend,
}: {
  conversation: TourConversation;
  onBack: () => void;
  onInfo: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  let lastDate = '';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={cp.header}>
        <TouchableOpacity style={cp.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <BackIcon />
        </TouchableOpacity>
        {conversation.photoUrl ? (
          <Image source={{ uri: conversation.photoUrl }} style={cp.headerAvatarPhoto} resizeMode="cover" />
        ) : (
          <View style={[cp.headerAvatar, { backgroundColor: conversation.bookingId ? C.amber : C.brownMid }]}>
            {conversation.bookingId ? <PinIcon size={16} /> : <HeadsetIcon size={16} />}
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={cp.headerTitle} numberOfLines={1}>{conversation.destination}</Text>
          <Text style={cp.headerSub} numberOfLines={1}>Booking ID: {conversation.bookingId || '—'}</Text>
        </View>
        <TouchableOpacity style={cp.dotsBtn} onPress={onInfo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <DotsIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={cp.thread}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      >
        {conversation.messages.map((m) => {
          const showDivider = m.date !== lastDate;
          lastDate = m.date;
          return (
            <View key={m.id}>
              {showDivider && (
                <View style={cp.dateDividerRow}>
                  <View style={cp.dateDividerLine} />
                  <Text style={cp.dateDividerText}>{formatDateLabel(m.date)}</Text>
                  <View style={cp.dateDividerLine} />
                </View>
              )}
              <Bubble msg={m} />
            </View>
          );
        })}
      </ScrollView>

      {conversation.ended ? (
        <View style={cp.endedBar}>
          <Text style={cp.endedBarText}>This conversation has ended.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cp.quickRepliesRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
            {QUICK_REPLIES.map((label) => (
              <TouchableOpacity key={label} style={cp.quickReplyChip} activeOpacity={0.75} onPress={() => send(label)}>
                <Text style={cp.quickReplyText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={cp.inputRow}>
            <TextInput
              style={cp.input}
              placeholder="Type a message..."
              placeholderTextColor={C.brownMid + '80'}
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <TouchableOpacity style={cp.sendBtn} activeOpacity={0.85} onPress={() => send(draft)}>
              <SendIcon />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

/* ── New Conversation modal ── */
function NewConversationModal({
  visible, onClose, onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (bookingId: string, text: string) => Promise<void>;
}) {
  const { bookings } = useBookings();
  const [bookingId, setBookingId] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => { setBookingId(''); setText(''); onClose(); };

  const handleCreate = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(bookingId, text.trim());
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={nc.overlay}>
        <View style={nc.card}>
          <View style={nc.headerRow}>
            <Text style={nc.title}>New Conversation</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><CloseIcon /></TouchableOpacity>
          </View>

          <Text style={nc.label}>RELATED BOOKING (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity style={[nc.chip, bookingId === '' && nc.chipActive]} activeOpacity={0.8} onPress={() => setBookingId('')}>
              <Text style={[nc.chipText, bookingId === '' && nc.chipTextActive]}>General Inquiry</Text>
            </TouchableOpacity>
            {bookings.map((b) => (
              <TouchableOpacity key={b.id} style={[nc.chip, bookingId === b.id && nc.chipActive]} activeOpacity={0.8} onPress={() => setBookingId(b.id)}>
                <Text style={[nc.chipText, bookingId === b.id && nc.chipTextActive]} numberOfLines={1}>{b.destination}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[nc.label, { marginTop: 14 }]}>MESSAGE</Text>
          <TextInput
            style={nc.textarea}
            placeholder="How can we help you?"
            placeholderTextColor={C.brownMid + '80'}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={[nc.sendBtn, (!text.trim() || submitting) && { opacity: 0.6 }]} activeOpacity={0.85} onPress={handleCreate} disabled={!text.trim() || submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={nc.sendBtnText}>Start Conversation</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── Confirm modal ── */
function ConfirmEndModal({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={m.overlay}>
        <View style={m.card}>
          <Text style={m.title}>End this conversation?</Text>
          <Text style={m.body}>
            You'll still be able to view past messages, but you won't be able to send new ones unless you start a new inquiry.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={m.cancelBtn} activeOpacity={0.8} onPress={onCancel}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.confirmBtn} activeOpacity={0.85} onPress={onConfirm}>
              <Text style={m.confirmText}>End Conversation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Main screen ── */
type Props = { onNavigate: (tab: 'bookings' | 'documents') => void };

export default function ClientMessagesScreen({ onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<TourConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [infoVisible, setInfoVisible] = useState(false);
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);
  const [newConvoVisible, setNewConvoVisible] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const loadConversations = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    fetch(`${CLIENT_CONVERSATIONS_LIST_API_URL}&userId=${user.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load messages.');
        const data = result.data as TourConversation[];
        setConversations(data);
      })
      .catch((e) => setError(e.message || 'Failed to load messages.'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const openConversation = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setActiveId(id);
    setMobileView('chat');
    setMenuOpenId(null);
    if (user) {
      fetch(CLIENT_MARK_CONVERSATION_READ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, conversationId: id }),
      }).catch(() => {});
    }
  };

  const handleSend = async (text: string) => {
    if (!active || active.ended || !user) return;
    try {
      const res = await fetch(CLIENT_SEND_MESSAGE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, conversationId: active.id, text }),
      });
      const result = await res.json();
      if (result.status !== 'success') return;
      const msg: ChatMessage = result.data;
      setConversations((prev) =>
        prev.map((c) => (c.id !== active.id ? c : { ...c, messages: [...c.messages, msg], lastMessage: text, timeAgo: 'Just now' }))
      );
    } catch {
      // best-effort — the message list will resync on next load if this failed silently
    }
  };

  const handleEndConversation = async () => {
    if (!active || !user) return;
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, ended: true } : c)));
    setEndConfirmVisible(false);
    setInfoVisible(false);
    try {
      await fetch(CLIENT_END_CONVERSATION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, conversationId: active.id }),
      });
    } catch {
      // Local state already updated optimistically.
    }
  };

  const handleToggleArchive = async (c: TourConversation) => {
    if (!user) return;
    const nextArchived = !c.isArchived;
    setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, isArchived: nextArchived } : x)));
    try {
      await fetch(CLIENT_ARCHIVE_CONVERSATION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, conversationId: c.id, archived: nextArchived }),
      });
    } catch {
      // Local state already updated optimistically.
    }
  };

  const handleCreateConversation = async (bookingId: string, text: string) => {
    if (!user) return;
    const res = await fetch(CLIENT_START_CONVERSATION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, bookingId, text }),
    });
    const result = await res.json();
    if (result.status !== 'success') return;
    loadConversations();
    setActiveId(result.data.conversationId);
    setMobileView('chat');
  };

  const handleContactAgent = () => {
    if (!active) return;
    handleSend("I'd like to speak with an agent about this booking, please.");
    setInfoVisible(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <ClientPageHero icon="✉️" title="Messages" subtitle="Communicate with our team about your inquiries." />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.amber} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <ClientPageHero icon="✉️" title="Messages" subtitle="Communicate with our team about your inquiries." />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
          <Text style={{ fontSize: 12, color: C.danger, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={loadConversations}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.amber }}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {mobileView === 'list' || !active ? (
        <>
          <ClientPageHero icon="✉️" title="Messages" subtitle="Communicate with our team about your inquiries." />
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            search={search} setSearch={setSearch}
            filter={filter} setFilter={setFilter}
            onSelect={openConversation}
            onNewConversation={() => setNewConvoVisible(true)}
            menuOpenId={menuOpenId} setMenuOpenId={setMenuOpenId}
            onToggleArchive={handleToggleArchive}
          />
        </>
      ) : (
        <ChatPanel
          conversation={active}
          onBack={() => setMobileView('list')}
          onInfo={() => setInfoVisible(true)}
          onSend={handleSend}
        />
      )}

      <Modal visible={infoVisible} transparent animationType="slide" onRequestClose={() => setInfoVisible(false)}>
        <View style={sheet.overlay}>
          <View style={[sheet.card, { paddingBottom: insets.bottom + 12 }]}>
            <View style={sheet.handle} />
            <View style={sheet.headerRow}>
              <Text style={sheet.headerTitle}>About This Tour</Text>
              <TouchableOpacity onPress={() => setInfoVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={sheet.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: '100%' }}>
              {active && (
                <TourInfoPanel
                  conversation={active}
                  onEndConversation={() => { setInfoVisible(false); setEndConfirmVisible(true); }}
                  onContactAgent={handleContactAgent}
                  onViewBookingDetails={() => { setInfoVisible(false); onNavigate('bookings'); }}
                  onViewDocuments={() => { setInfoVisible(false); onNavigate('documents'); }}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmEndModal visible={endConfirmVisible} onCancel={() => setEndConfirmVisible(false)} onConfirm={handleEndConversation} />
      <NewConversationModal visible={newConvoVisible} onClose={() => setNewConvoVisible(false)} onCreate={handleCreateConversation} />
    </View>
  );
}

/* ── Styles ── */
const l = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.lightBg, borderRadius: 24, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 11 : 7,
    marginHorizontal: 16, marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown, padding: 0 },

  newConvoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brown, borderRadius: 26, marginHorizontal: 16, marginTop: 14, paddingVertical: 14,
    ...Platform.select({
      ios:     { shadowColor: C.brown, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  newConvoBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  tabRow: { flexDirection: 'row', gap: 20, marginHorizontal: 16, marginTop: 18, borderBottomWidth: 1, borderBottomColor: C.divider },
  tabBtn: { paddingBottom: 10 },
  tabLabel: { fontSize: 12, fontWeight: '700', color: C.brownMid, opacity: 0.7 },
  tabLabelActive: { color: C.brown, opacity: 1, fontWeight: '900' },
  tabUnderline: { height: 2, backgroundColor: C.amber, borderRadius: 1, marginTop: 8 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.danger },

  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 12, color: C.brownMid, opacity: 0.7 },

  list: { marginTop: 12, paddingHorizontal: 16, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    position: 'relative',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: { width: 46, height: 46, borderRadius: 23, flexShrink: 0 },
  rowDest: { fontSize: 13.5, fontWeight: '900', color: C.brown },
  rowTeam: { fontSize: 10.5, fontWeight: '700', color: C.amber, marginTop: 1 },
  rowPreview: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  rowTime: { fontSize: 10, color: C.brownMid, opacity: 0.6, fontWeight: '600' },
  menuBtn: { padding: 4, marginLeft: 2 },
  menuSheet: {
    position: 'absolute', top: 40, right: 16, zIndex: 10,
    backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider,
    paddingVertical: 4, minWidth: 130,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 6 },
    }),
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  menuRowText: { fontSize: 12, fontWeight: '700', color: C.brown },
});

const b = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  rowSelf: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
    backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  bubble: { borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  bubbleTeam: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.divider, borderBottomLeftRadius: 4 },
  bubbleSelf: { backgroundColor: C.amber, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13, color: C.brown, lineHeight: 18 },
  bubbleTextSelf: { color: '#FFFFFF' },
  time: { fontSize: 9.5, color: C.brownMid, opacity: 0.6, marginTop: 4, marginLeft: 4 },
  timeSelf: { textAlign: 'right', marginLeft: 0, marginRight: 4 },
});

const cp = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.divider,
    backgroundColor: C.cardBg,
  },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarPhoto: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
  headerTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown },
  headerSub: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, marginTop: 1 },
  dotsBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  thread: { padding: 16, paddingBottom: 24, backgroundColor: C.lightBg, flexGrow: 1 },

  dateDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dateDividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dateDividerText: { fontSize: 10.5, fontWeight: '700', color: C.brownMid, opacity: 0.7 },

  endedBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.divider, backgroundColor: C.lightBg,
  },
  endedBarText: { fontSize: 12, color: C.brownMid, textAlign: 'center', fontStyle: 'italic' },

  quickRepliesRow: { flexGrow: 0, backgroundColor: C.cardBg, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.divider },
  quickReplyChip: {
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg,
    borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8,
  },
  quickReplyText: { fontSize: 11, fontWeight: '700', color: C.brown },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 14,
    backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.divider,
  },
  input: {
    flex: 1, maxHeight: 100,
    backgroundColor: C.lightBg, borderRadius: 22, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 13, color: C.brown,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, flexShrink: 0,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.4)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: C.cardBg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '85%', paddingTop: 10,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.divider, alignSelf: 'center', marginBottom: 8 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  headerTitle: { fontSize: 14, fontWeight: '900', color: C.brown },
  closeText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: C.cardBg, borderRadius: 18, padding: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  title: { fontSize: 15.5, fontWeight: '900', color: C.brown },
  body: { fontSize: 12.5, color: C.brownMid, marginTop: 8, lineHeight: 18 },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg,
  },
  cancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  confirmBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12, backgroundColor: C.danger,
  },
  confirmText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const nc = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: C.cardBg, borderRadius: 18, padding: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15.5, fontWeight: '900', color: C.brown },
  label: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.4, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, maxWidth: 160 },
  chipActive: { backgroundColor: C.amber, borderColor: C.amber },
  chipText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  chipTextActive: { color: '#FFFFFF' },
  textarea: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown, textAlignVertical: 'top', minHeight: 90,
  },
  sendBtn: { marginTop: 16, backgroundColor: C.amber, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  sendBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
