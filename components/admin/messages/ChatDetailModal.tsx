/**
 * ChatDetailModal.tsx
 * Full-screen slide-up chat thread for a single conversation — gradient
 * header with the client's name/destination, a scrollable message thread
 * with bubbles, and a bottom input bar to send a reply.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { Conversation, ChatMessage } from './mockData';

const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const Bubble = ({ msg, cd }: { msg: ChatMessage; cd: ReturnType<typeof makeStyles> }) => {
  const isAdmin = msg.sender === 'admin';
  return (
    <View style={[cd.bubbleRow, isAdmin && cd.bubbleRowAdmin]}>
      <View style={[cd.bubble, isAdmin ? cd.bubbleAdmin : cd.bubbleClient]}>
        <Text style={[cd.bubbleText, isAdmin && cd.bubbleTextAdmin]}>{msg.text}</Text>
      </View>
      <Text style={[cd.bubbleTime, isAdmin && cd.bubbleTimeAdmin]}>{msg.time}</Text>
    </View>
  );
};

type Props = {
  visible:      boolean;
  conversation: Conversation | null;
  onClose:      () => void;
  onSend:       (conversationId: string, text: string) => void;
};

export default function ChatDetailModal({ visible, conversation, onClose, onSend }: Props) {
  const { C } = useAppTheme();
  const cd = useMemo(() => makeStyles(C), [C]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  if (!conversation) return null;

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(conversation.id, text);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={cd.safe}>
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[cd.header, { paddingTop: insets.top + 10 }]}
        >
          <View style={cd.headerRow}>
            <TouchableOpacity style={cd.backBtn} onPress={onClose} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <BackIcon />
            </TouchableOpacity>
            <View style={cd.headerAvatar}>
              <Text style={cd.headerAvatarText}>{conversation.initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={cd.headerName} numberOfLines={1}>{conversation.clientName}</Text>
              <Text style={cd.headerDest} numberOfLines={1}>{conversation.destination}</Text>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={cd.thread}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          >
            {conversation.messages.map((m) => <Bubble key={m.id} msg={m} cd={cd} />)}
          </ScrollView>

          <View style={cd.inputRow}>
            <TextInput
              style={cd.input}
              placeholder="Type a message..."
              placeholderTextColor={C.brownMid + '80'}
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <TouchableOpacity style={cd.sendBtn} activeOpacity={0.85} onPress={handleSend}>
              <SendIcon />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { paddingBottom: 14, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerAvatarText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  headerName: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  headerDest: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  thread: { padding: 16, paddingBottom: 24, gap: 12 },
  bubbleRow: { alignItems: 'flex-start', maxWidth: '82%' },
  bubbleRowAdmin: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  bubbleClient: {
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.divider,
    borderTopLeftRadius: 4,
  },
  bubbleAdmin: {
    backgroundColor: C.amber,
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 13, color: C.brown, lineHeight: 18 },
  bubbleTextAdmin: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 9.5, color: C.brownMid, opacity: 0.6, marginTop: 4, marginLeft: 4 },
  bubbleTimeAdmin: { marginLeft: 0, marginRight: 4 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    backgroundColor: C.lightBg,
    borderTopWidth: 1, borderTopColor: C.divider,
  },
  input: {
    flex: 1, maxHeight: 100,
    backgroundColor: C.cardBg, borderRadius: 22, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 13, color: C.brown,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
});
