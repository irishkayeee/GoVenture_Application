/**
 * MessagesScreen.tsx
 * Messages tab — a scrollable list of conversations. Tapping a conversation
 * row opens ChatDetailModal, a full-screen thread with bubbles and a reply
 * input.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { CONVERSATIONS, Conversation, ChatMessage } from './mockData';
import ChatDetailModal from './ChatDetailModal';

const AVATAR_COLORS = [LIGHT_C.amber, LIGHT_C.purple, LIGHT_C.info, LIGHT_C.danger, '#12946F'];

/* ── Icons ── */
const ChatBubbleIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>
);

const ConversationRow = ({ convo, index, onPress, ms }: { convo: Conversation; index: number; onPress: () => void; ms: ReturnType<typeof makeStyles> }) => {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <TouchableOpacity style={ms.convoRow} activeOpacity={0.8} onPress={onPress}>
      <View style={[ms.avatar, { backgroundColor: avatarColor }]}>
        <Text style={ms.avatarText}>{convo.initials}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={ms.convoDest} numberOfLines={1}>{convo.destination}</Text>
        <Text style={ms.convoName} numberOfLines={1}>{convo.clientName}</Text>
        <Text style={ms.convoPreview} numberOfLines={1}>{convo.lastMessage}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={ms.convoTime}>{convo.timeAgo}</Text>
        {convo.unread && <View style={ms.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
};

export default function MessagesScreen() {
  const { C } = useAppTheme();
  const ms = useMemo(() => makeStyles(C), [C]);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeConvo = conversations.find((c) => c.id === activeId) ?? null;

  const openConvo = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)));
    setActiveId(id);
  };

  const handleSend = (conversationId: string, text: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const msg: ChatMessage = {
          id: `m${c.messages.length + 1}-${Date.now()}`,
          sender: 'admin',
          text,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
        return { ...c, messages: [...c.messages, msg], lastMessage: text, timeAgo: 'Just now' };
      })
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ms.headerCard}
        >
          <View style={ms.headerDecorLayer} pointerEvents="none">
            <Text style={[ms.headerDecorEmoji, { top: 8, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
            <Text style={[ms.headerDecorEmoji, { top: 2, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
            <Text style={[ms.headerDecorEmoji, { bottom: -14, right: 74, fontSize: 60, opacity: 0.14 }]}>🏝️</Text>
          </View>

          <View style={ms.headerTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={ms.headerEyebrow}>INBOX</Text>
              <Text style={ms.headerTitle}>Messages</Text>
              <Text style={ms.headerSub}>Manage, send and receive messages, and organize conversations.</Text>
            </View>

            <View style={ms.headerIconWrap}>
              <View style={ms.headerRing2} />
              <View style={ms.headerRing1} />
              <View style={ms.headerIconCircle}>
                <ChatBubbleIcon />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={ms.sectionWrap}>
          <Text style={ms.sectionLabel}>CONVERSATIONS</Text>
          <View style={ms.convoList}>
            {conversations.map((c, i) => (
              <ConversationRow key={c.id} convo={c} index={i} onPress={() => openConvo(c.id)} ms={ms} />
            ))}
          </View>
        </View>

        <Copyright />
      </ScrollView>

      <ChatDetailModal
        visible={!!activeConvo}
        conversation={activeConvo}
        onClose={() => setActiveId(null)}
        onSend={handleSend}
      />
    </View>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  headerCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 20, padding: 18,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  headerDecorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerDecorEmoji: { position: 'absolute' },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerEyebrow: { fontSize: 10.5, fontWeight: '800', color: '#FFD9A0', letterSpacing: 0.6 },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 16, maxWidth: 230 },
  headerIconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 },
  headerRing2: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerRing1: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  headerIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

  sectionWrap: { marginTop: 16, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.6, marginBottom: 8 },

  convoList: {
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.divider,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  convoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  convoDest: { fontSize: 10.5, fontWeight: '700', color: C.amber, opacity: 0.9 },
  convoName: { fontSize: 13.5, fontWeight: '800', color: C.brown, marginTop: 1 },
  convoPreview: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  convoTime: { fontSize: 10, color: C.brownMid, opacity: 0.6, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },
});
