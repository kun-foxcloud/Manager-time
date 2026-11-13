import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { USERS, User, userById } from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';

export function LoginScreen() {
  const { login } = useTime();
  const [selectedId, setSelectedId] = useState(USERS[0].id);
  const [email, setEmail] = useState(USERS[0].email);
  const [password, setPassword] = useState(USERS[0].password);
  const [error, setError] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const pickUser = (user: User) => {
    setSelectedId(user.id);
    setEmail(user.email);
    setPassword(user.password);
    setError(null);
    setAccountOpen(false);
  };

  const selectedUser = userById(selectedId);

  const submit = () => {
    setError(login(email, password));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Image source={require('../../assets/logo.png')} style={styles.brandLogo} />
            <Text style={styles.brand}>Time Manager</Text>
          </View>
          <Text style={styles.tagline}>Track your team’s work hours</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Choose an account</Text>
            <View style={styles.dropdownWrap}>
              <Pressable
                onPress={() => setAccountOpen((open) => !open)}
                style={[styles.dropdownTrigger, accountOpen && styles.dropdownTriggerOpen]}
              >
                <View style={[styles.avatar, { backgroundColor: selectedUser.color }]}>
                  <Text style={styles.avatarText}>{selectedUser.initials}</Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userName}>{selectedUser.name}</Text>
                  <Text style={styles.userRole}>{selectedUser.role}</Text>
                </View>
                <Ionicons
                  name={accountOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.muted}
                />
              </Pressable>
              {accountOpen && (
                <View style={styles.dropdownMenu}>
                  {USERS.map((user) => {
                    const selected = user.id === selectedId;
                    return (
                      <Pressable
                        key={user.id}
                        onPress={() => pickUser(user)}
                        style={[styles.optionRow, selected && styles.optionRowSelected]}
                      >
                        <View
                          style={[
                            styles.avatar,
                            styles.optionAvatar,
                            { backgroundColor: user.color },
                          ]}
                        >
                          <Text style={[styles.avatarText, styles.optionAvatarText]}>
                            {user.initials}
                          </Text>
                        </View>
                        <View style={styles.userMeta}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userRole}>{user.role}</Text>
                        </View>
                        {selected && (
                          <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <Text style={[styles.sectionTitle, styles.inputsTitle]}>Sign in</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={COLORS.faint}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.faint}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable onPress={submit} style={styles.button}>
              <Text style={styles.buttonText}>Sign in as {userById(selectedId).name}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.indigo,
  },
  flex: {
    flex: 1,
  },
  decorCircleTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  decorCircleBottom: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 54,
    height: 54,
    borderRadius: 15,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tagline: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    marginTop: 28,
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dropdownWrap: {
    marginTop: 8,
    position: 'relative',
    zIndex: 20,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6FC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dropdownTriggerOpen: {
    borderColor: '#D8E2FB',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E6EBF7',
    zIndex: 30,
    ...SHADOW,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  optionRowSelected: {
    backgroundColor: '#F0F4FE',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  optionAvatarText: {
    fontSize: 11,
  },
  userMeta: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  },
  inputsTitle: {
    marginTop: 20,
    marginBottom: 4,
  },
  input: {
    marginTop: 10,
    backgroundColor: '#F4F6FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.ink,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  button: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 6,
  },
});
