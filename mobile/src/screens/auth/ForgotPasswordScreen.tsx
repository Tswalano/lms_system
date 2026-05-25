import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authApi } from '../../services/api';
import { Colors } from '../../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'code';

export function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<Nav>();

  async function sendCode() {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email.');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('code');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!code.trim() || !newPassword.trim())
      return Alert.alert('Error', 'Please enter the code and new password.');
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert('Success', 'Password reset successfully. Please sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-open-outline" size={28} color={Colors.foreground} />
            </View>

            <Text style={styles.title}>
              {step === 'email' ? 'Forgot password?' : 'Check your email'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? "Enter your email address and we'll send you a reset code."
                : `We sent a reset code to ${email}. Enter it below with your new password.`}
            </Text>

            {step === 'email' ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@company.com"
                      placeholderTextColor={Colors.mutedForeground}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={sendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>Send reset code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Reset code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="key-outline" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={Colors.mutedForeground}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>New password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingRight: 40 }]}
                      placeholder="Create new password"
                      placeholderTextColor={Colors.mutedForeground}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={Colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={resetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>Reset password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn} onPress={() => setStep('email')}>
                  <Text style={styles.resendText}>Didn't receive a code? Try again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.secondary },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 14, color: Colors.foreground, fontWeight: '500' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.foreground, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.mutedForeground, lineHeight: 20, marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.foreground, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.input,
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 46, fontSize: 15, color: Colors.foreground },
  eyeBtn: { padding: 4, position: 'absolute', right: 12 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.primaryForeground, fontSize: 15, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginTop: 16 },
  resendText: { fontSize: 13, color: Colors.mutedForeground, textDecorationLine: 'underline' },
});
