import React, { useCallback, useMemo, useState, useRef } from 'react';
import { 
  Alert, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppScreen from '../components/ui/AppScreen';
import NotificationIcon from '../assets/icons/NotificationIcon.svg';
import { useLanguage } from '../i18n/LanguageProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { getUnreadNotificationCount, markNotificationsSeen } from '../services/notificationService';

function getCurrentTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function SupportCenterScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const flatListRef = useRef(null);

  const initialMessages = useMemo(
    () => [
      {
        id: '1',
        sender: 'support',
        text: t('support.initialSupportMessage'),
        time: '09:30',
        type: 'text'
      },
      {
        id: '2',
        sender: 'user',
        text: t('support.initialDriverMessage'),
        time: '09:32',
        type: 'text'
      },
    ],
    [t],
  );

  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (_error) {
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount]),
  );

  // Send Text Message
  const onSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage(inputText.trim(), 'text');
    setInputText('');
  };

  // Simulate Sending Audio
  const onSendAudio = () => {
    addMessage(t('support.audioMessage', { duration: '0:05' }), 'audio');
  };

  const addMessage = (content, type) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: content,
      time: getCurrentTime(),
      type: type
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCallSupport = () => {
    Alert.alert(t('support.callSupportTitle'), t('support.callSupportPlaceholder'));
  };

  const handleRaiseTicket = () => {
    navigation.navigate('RaiseTicket');
  };

  const handleMicPress = () => {
    if (isRecording) {
      // Stop recording and send
      setIsRecording(false);
      onSendAudio();
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'support' && item.id === '1';

    if (isSystem) {
      return (
        <View style={{ alignItems: 'center', marginVertical: spacing[2], paddingHorizontal: spacing[4] }}>
          <Text style={{ 
            color: colors.textPrimary, 
            textAlign: 'center', 
            fontSize: 13, 
            opacity: 0.8,
            fontWeight: '500'
          }}>
            {item.text}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
            {item.time}
          </Text>
        </View>
      );
    }
    
    const isAudio = item.type === 'audio';

    return (
      <View style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '75%',
        marginBottom: spacing[2],
        marginHorizontal: spacing[2],
      }}>
        <View style={{
          backgroundColor: isUser ? '#1E40AF' : colors.backgroundTertiary,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 14,
          borderTopRightRadius: isUser ? 2 : 14,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
        }}>
          <Text style={{
            color: isUser ? '#FFFFFF' : colors.textPrimary,
            fontSize: 14,
            lineHeight: 20,
            fontStyle: isAudio ? 'italic' : 'normal',
            fontWeight: isAudio ? '600' : '400'
          }}>
            {item.text}
          </Text>
        </View>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 10,
          marginTop: 2,
          alignSelf: 'flex-end',
          marginRight: 4,
        }}>
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      {/* HEADER: Support | Status | Bell | SOS */}
      <View style={{ 
        paddingHorizontal: spacing[3], 
        paddingTop: spacing[2], 
        paddingBottom: spacing[2],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
      }}>
        <View>
          <Text style={[typography.h2, { fontSize: 24, fontWeight: '700', color: colors.textPrimary }]}>
            Support
          </Text>
          {/* Moved Online Status Here */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: '#22C55E',
              marginRight: 4,
            }} />
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500' }}>
              Online
            </Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {/* Notification Bell (Symbol representation) */}
          <TouchableOpacity style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.backgroundSecondary,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: colors.border,
            position: 'relative',
          }}
          onPress={async () => {
            await markNotificationsSeen();
            setUnreadCount(0);
            navigation.navigate('NotificationCenter');
          }}
          >
             <NotificationIcon width={18} height={18} color={colors.icon} />
             {unreadCount > 0 ? (
               <View
                 style={{
                   position: 'absolute',
                   right: -4,
                   top: -4,
                   minWidth: 16,
                   height: 16,
                   borderRadius: 8,
                   paddingHorizontal: 3,
                   backgroundColor: '#DC2626',
                   alignItems: 'center',
                   justifyContent: 'center',
                 }}
               >
                 <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                   {unreadCount > 99 ? '99+' : String(unreadCount)}
                 </Text>
               </View>
             ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.backgroundSecondary,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={() => navigation.navigate('SettingsScreen')}
          >
            <Text style={{ color: colors.icon, fontWeight: '800', fontSize: 16 }}>⚙</Text>
          </TouchableOpacity>

          {/* SOS Button */}
          <TouchableOpacity style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: '#DC2626',
            justifyContent: 'center', alignItems: 'center',
            shadowColor: "#DC2626", shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: spacing[2], paddingTop: spacing[2] }}>
          
          {/* Action Buttons Row: Ticket (Left) | Call (Right) */}
          <View style={{
            flexDirection: 'row',
            gap: spacing[2],
            marginBottom: spacing[2],
          }}>
            {/* Left: Raise Ticket */}
            <TouchableOpacity 
              onPress={handleRaiseTicket}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Text style={{ fontSize: 16 }}>🎫</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '500', fontSize: 13 }}>
                {t('support.raiseTicket')}
              </Text>
            </TouchableOpacity>

            {/* Right: Call Support */}
            <TouchableOpacity 
              onPress={handleCallSupport}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Text style={{ fontSize: 16 }}>📞</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '500', fontSize: 13 }}>
                {t('support.callSupport')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chat Window */}
          <View style={{ 
            flex: 1,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing[1]
          }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={{
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[1],
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
            />

            {/* Input Area */}
            <View style={{
              padding: spacing[2],
              backgroundColor: colors.backgroundSecondary,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[2],
              }}>
                 {/* Input Field */}
                 <View style={{ 
                   flex: 1,
                   backgroundColor: colors.backgroundTertiary,
                   borderRadius: 20,
                   paddingHorizontal: spacing[3],
                   paddingVertical: Platform.OS === 'ios' ? 10 : 4,
                   flexDirection: 'row',
                   alignItems: 'center'
                 }}>
                    <TextInput
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder={t('support.composePlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      style={{
                        flex: 1,
                        color: colors.textPrimary,
                        fontSize: 14,
                        maxHeight: 80,
                        padding: 0,
                      }}
                      multiline
                    />
                 </View>

                {isRecording ? (
                  <TouchableOpacity
                    onPress={handleCancelRecording}
                    style={{
                      minWidth: 66,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.backgroundTertiary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.textPrimary,
                    }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Mic/Send Button Logic */}
                <TouchableOpacity
                  onPress={inputText.trim() ? onSendMessage : handleMicPress}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: isRecording ? '#DC2626' : (inputText.trim() ? '#1E40AF' : colors.backgroundTertiary),
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isRecording ? '#DC2626' : colors.border
                  }}
                >
                  {inputText.trim() ? (
                    // Send Arrow Icon (CSS shape)
                    <View style={{ 
                      width: 0, height: 0, 
                      backgroundColor: 'transparent', 
                      borderStyle: 'solid', 
                      borderLeftWidth: 8, borderRightWidth: 0, borderBottomWidth: 6, borderTopWidth: 6,
                      borderLeftColor: 'white', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderTopColor: 'transparent',
                      marginLeft: 2
                    }} />
                  ) : (
                    <Text style={{ 
                      fontSize: 10, 
                      fontWeight: '700', 
                      color: isRecording ? 'white' : colors.textSecondary 
                    }}>
                      {isRecording ? t('support.send') : t('support.mic')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

export default SupportCenterScreen;
