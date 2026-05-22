import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function formatDuration(totalSeconds) {
  const clamped = Math.max(0, Number(totalSeconds) || 0);
  const minutes = String(Math.floor(clamped / 60)).padStart(2, '0');
  const seconds = String(clamped % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function ChatBox({ messages, onSendMessage }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);
  const recordingLabel = useMemo(
    () => `${t('support.recording')} ${formatDuration(recordSeconds)}`,
    [recordSeconds, t],
  );

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRecordSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const send = () => {
    const message = draft.trim();
    if (!message) {
      return;
    }
    onSendMessage({ type: 'text', message });
    setDraft('');
  };

  const startRecording = () => {
    setDraft('');
    setRecordSeconds(0);
    setIsRecording(true);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const sendRecording = () => {
    const total = Math.max(1, recordSeconds);
    onSendMessage({
      type: 'audio',
      duration: formatDuration(total),
    });
    setIsRecording(false);
    setRecordSeconds(0);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: spacing[2] }}
        renderItem={({ item }) => {
          const mine = item.sender === 'driver';
          const isAudio = item.type === 'audio';
          return (
            <View
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                backgroundColor: mine ? colors.primary : colors.surfaceAlt,
                borderColor: colors.border,
                borderRadius: radius.card,
                borderWidth: mine ? 0 : 1,
                marginBottom: spacing[1],
                maxWidth: '85%',
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
              }}
            >
              <Text style={[typography.label, { color: mine ? colors.textOnColor : colors.textPrimary }]}> 
                {isAudio
                  ? t('support.audioMessage', { duration: item.duration || '00:00' })
                  : item.message}
              </Text>
              <Text style={[typography.caption, { color: mine ? colors.textOnColor : colors.textSecondary }]}> 
                {item.time}
              </Text>
            </View>
          );
        }}
      />

      <View
        style={{
          alignItems: 'center',
          borderColor: colors.border,
          borderRadius: radius.card,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: spacing[6],
          paddingHorizontal: spacing[1],
        }}
      >
        {isRecording ? (
          <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing[1] }}>
            <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing[1] }}>
              <View
                style={{
                  backgroundColor: colors.critical,
                  borderRadius: radius.pill,
                  height: spacing[1],
                  width: spacing[1],
                }}
              />
              <Text style={[typography.label, { color: colors.textPrimary }]}>{recordingLabel}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={cancelRecording}
              style={{
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                borderRadius: radius.pill,
                borderWidth: 1,
                justifyContent: 'center',
                minHeight: spacing[6],
                minWidth: spacing[6],
              }}
            >
              <Text style={[typography.caption, { color: colors.textPrimary }]}> 
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={sendRecording}
              style={{
                alignItems: 'center',
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
                justifyContent: 'center',
                minHeight: spacing[6],
                minWidth: spacing[6],
              }}
            >
              <Text style={[typography.caption, { color: colors.textOnColor }]}> 
                {t('support.send')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('support.composePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={{ color: colors.textPrimary, flex: 1, paddingHorizontal: spacing[1] }}
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={startRecording}
              style={{
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                borderRadius: radius.pill,
                borderWidth: 1,
                justifyContent: 'center',
                marginRight: spacing[1],
                minHeight: spacing[6],
                minWidth: spacing[6],
              }}
            >
              <Text style={[typography.caption, { color: colors.textPrimary }]}> 
                {t('support.mic')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={send}
              disabled={!canSend}
              style={{
                alignItems: 'center',
                backgroundColor: canSend ? colors.primary : colors.border,
                borderRadius: radius.pill,
                justifyContent: 'center',
                minHeight: spacing[6],
                minWidth: spacing[6],
              }}
            >
              <Text style={[typography.caption, { color: colors.textOnColor }]}> 
                {t('support.send')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default ChatBox;
