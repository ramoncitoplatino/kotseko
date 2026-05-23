import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(app)/");
    } catch (e: unknown) {
      Alert.alert("Login Failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>🚗</Text>
          <Text style={s.title}>Kotseko</Text>
          <Text style={s.subtitle}>Vehicle Maintenance Tracker</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={s.btnText}>{loading ? "Signing in…" : "Sign In"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register")} style={s.link}>
            <Text style={s.linkText}>Don't have an account? <Text style={s.linkBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#f1f5f9" },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", color: "#1e3a5f" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: "#111827", marginBottom: 16, backgroundColor: "#f9fafb" },
  btn: { backgroundColor: "#1d4ed8", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#6b7280", fontSize: 14 },
  linkBold: { color: "#1d4ed8", fontWeight: "600" },
});
