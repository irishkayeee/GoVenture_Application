/**
 * ClientMessagesScreen.tsx
 * Client-side Messages tab. Wide screens (tablet/web) get a three-column
 * layout — conversation list, chat thread, tour info sidebar — matching the
 * desktop design. Narrower screens (phone) collapse to a single pane with
 * back navigation and the tour info opening as a bottom sheet.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Platform, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { CLIENT_CONVERSATIONS, TourConversation, ChatMessage } from './mockData';
import TourInfoPanel from './TourInfoPanel';

const WIDE_BREAKPOINT = 900;

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

const DotsIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={5} r={1.6} fill={C.brownMid} />
    <Circle cx={12} cy={12} r={1.6} fill={C.brownMid} />
    <Circle cx={12} cy={19} r={1.6} fill={C.brownMid} />
  </Svg>
);

const MicIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" stroke={C.brownMid} strokeWidth={1.8} />
    <Path d="M5 11a7 7 0 0014 0M12 18v3" stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const SendIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const formatDateLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ── Conversation list ── */
function ConversationList({
  conversations, activeId, search, setSearch, filter, setFilter, onSelect,
}: {
  conversations: TourConversation[];
  activeId: string | null;
  search: string;
  setSearch: (v: string) => void;
  filter: 'all' | 'unread';
  setFilter: (v: 'all' | 'unread') => void;
  onSelect: (id: string) => void;
}) {
  const filtered = conversations.filter((c) => {
    if (filter === 'unread' && !c.unread) return false;
    if (search.trim() && !c.destination.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });
  const anyUnread = conversations.some((c) => c.unread);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
      <View style={l.searchRow}>
        <SearchIcon />
        <TextInput
          style={l.searchInput}
          placeholder="Search"
          placeholderTextColor={C.brownMid + '90'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={l.tabRow}>
        <TouchableOpacity style={l.tabBtn} activeOpacity={0.75} onPress={() => setFilter('all')}>
          <Text style={[l.tabLabel, filter === 'all' && l.tabLabelActive]}>All Messages</Text>
          {filter === 'all' && <View style={l.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={l.tabBtn} activeOpacity={0.75} onPress={() => setFilter('unread')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={[l.tabLabel, filter === 'unread' && l.tabLabelActive]}>Unread</Text>
            {anyUnread && <View style={l.unreadDot} />}
          </View>
          {filter === 'unread' && <View style={l.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={l.emptyWrap}>
          <Text style={l.emptyText}>No conversations found.</Text>
        </View>
      ) : (
        <View style={l.list}>
          {filtered.map((c) => {
            const isActive = c.id === activeId;
            return (
              <TouchableOpacity
                key={c.id}
                style={[l.row, isActive && l.rowActive]}
                activeOpacity={0.8}
                onPress={() => onSelect(c.id)}
              >
                <View style={l.avatar}>
                  <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={l.rowDest} numberOfLines={1}>{c.destination}</Text>
                  <Text style={l.rowTeam} numberOfLines={1}>GoVenture Travel Team</Text>
                  <Text style={l.rowPreview} numberOfLines={1}>{c.lastMessage}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={l.rowTime}>{c.timeAgo}</Text>
                  {c.unread && <View style={l.unreadDot} />}
                </View>
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
  conversation, onBack, onInfo, showBack, onSend,
}: {
  conversation: TourConversation;
  onBack?: () => void;
  onInfo: () => void;
  showBack: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  let lastDate = '';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={cp.header}>
        {showBack && (
          <TouchableOpacity style={cp.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
        )}
        <View style={cp.headerAvatar}>
          <Text style={{ fontSize: 18 }}>{conversation.emoji}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={cp.headerTitle} numberOfLines={1}>{conversation.destination}</Text>
          <Text style={cp.headerSub} numberOfLines={1}>Booking ID: {conversation.bookingId}</Text>
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
        <View style={cp.inputRow}>
          <View style={cp.micBtn}>
            <MicIcon />
          </View>
          <TextInput
            style={cp.input}
            placeholder="Type a message..."
            placeholderTextColor={C.brownMid + '80'}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity style={cp.sendBtn} activeOpacity={0.85} onPress={handleSend}>
            <SendIcon />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
export default function ClientMessagesScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<TourConversation[]>(CLIENT_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(CLIENT_CONVERSATIONS[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [infoVisible, setInfoVisible] = useState(false);
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const openConversation = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)));
    setActiveId(id);
    setMobileView('chat');
  };

  const handleSend = (text: string) => {
    if (!active || active.ended) return;
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    const time = today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== active.id) return c;
        const msg: ChatMessage = { id: `m${c.messages.length + 1}-${Date.now()}`, sender: 'client', text, date: iso, time };
        return { ...c, messages: [...c.messages, msg], lastMessage: text, timeAgo: 'Just now' };
      })
    );
  };

  const handleEndConversation = () => {
    if (!active) return;
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, ended: true } : c)));
    setEndConfirmVisible(false);
    setInfoVisible(false);
  };

  if (conversations.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <ClientPageHero icon="✉️" title="Messages" subtitle="Communicate with our team about your inquiries." />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
          <Text style={{ fontSize: 40 }}>✉️</Text>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.brown }}>No messages yet</Text>
          <Text style={{ fontSize: 12, color: C.brownMid, textAlign: 'center' }}>
            Once you book a tour, you can chat with the GoVenture team here.
          </Text>
        </View>
      </View>
    );
  }

  /* ── Wide layout: three columns ── */
  if (isWide) {
    return (
      <View style={{ flex: 1 }}>
      <ClientPageHero icon="✉️" title="Messages" subtitle="Communicate with our team about your inquiries." />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={s.listCol}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            search={search} setSearch={setSearch}
            filter={filter} setFilter={setFilter}
            onSelect={openConversation}
          />
        </View>

        <View style={{ flex: 1 }}>
          {active ? (
            <ChatPanel
              conversation={active}
              showBack={false}
              onInfo={() => setInfoVisible((v) => !v)}
              onSend={handleSend}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.brownMid }}>Select a conversation</Text>
            </View>
          )}
        </View>

        <View style={s.infoCol}>
          <ScrollView>
            {active && <TourInfoPanel conversation={active} onEndConversation={() => setEndConfirmVisible(true)} />}
          </ScrollView>
        </View>

        <ConfirmEndModal visible={endConfirmVisible} onCancel={() => setEndConfirmVisible(false)} onConfirm={handleEndConversation} />
      </View>
      </View>
    );
  }

  /* ── Compact layout: single pane + info sheet ── */
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
          />
        </>
      ) : (
        <ChatPanel
          conversation={active}
          showBack
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
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmEndModal visible={endConfirmVisible} onCancel={() => setEndConfirmVisible(false)} onConfirm={handleEndConversation} />
    </View>
  );
}

/* ── Styles ── */
const s = StyleSheet.create({
  listCol: { width: 300, borderRightWidth: 1, borderRightColor: C.divider, backgroundColor: C.cardBg },
  infoCol: { width: 320, borderLeftWidth: 1, borderLeftColor: C.divider, backgroundColor: C.cardBg },
});

const l = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.lightBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginHorizontal: 16, marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown, padding: 0 },

  tabRow: { flexDirection: 'row', gap: 20, marginHorizontal: 16, marginTop: 16, borderBottomWidth: 1, borderBottomColor: C.divider },
  tabBtn: { paddingBottom: 10 },
  tabLabel: { fontSize: 12.5, fontWeight: '700', color: C.brownMid, opacity: 0.7 },
  tabLabelActive: { color: C.brown, opacity: 1, fontWeight: '900' },
  tabUnderline: { height: 2, backgroundColor: C.amber, borderRadius: 1, marginTop: 8 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.danger },

  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 12, color: C.brownMid, opacity: 0.7 },

  list: { marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  rowActive: { backgroundColor: C.lightBg },
  avatar: {
    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  rowDest: { fontSize: 13.5, fontWeight: '900', color: C.brown },
  rowTeam: { fontSize: 10.5, fontWeight: '700', color: C.amber, marginTop: 1 },
  rowPreview: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  rowTime: { fontSize: 10, color: C.brownMid, opacity: 0.6, fontWeight: '600' },
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
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
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

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 14,
    backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.divider,
  },
  micBtn: {
    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center',
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
