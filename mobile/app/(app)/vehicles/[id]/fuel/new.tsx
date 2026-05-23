import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { apiFetch } from "@/api";
import type { FuelLog } from "@/types";

export default function NewFuelLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [station, setStation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastOdo, setLastOdo] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<FuelLog[]>(`/api/vehicles/${id}/fuel`)
      .then((logs) => { if (logs.length > 0) setLastOdo(logs[0].odometer); })
      .catch(() => {});
  }, [id]);

  const litNum = Number(liters);
  const costNum = Number(totalCost);
  const pricePerLiter = litNum > 0 && costNum > 0 ? (costNum / litNum).toFixed(2) : null;

  async function handleSave() {
    if (!date || !odometer || !liters || !totalCost) {
      Alert.alert("Error", "Date, odometer, liters, and total cost are required.");
      return;
    }
    if (isNaN(Number(odometer)) || isNaN(litNum) || isNaN(costNum)) {
      Alert.alert("Error", "Please enter valid numbers.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/vehicles/${id}/fuel`, {
        method: "POST",
        body: JSON.stringify({
          date,
          odometer: Number(odometer),
          liters: litNum,
          totalCost: costNum,
          pricePerLiter: pricePerLiter ? Number(pricePerLiter) : costNum / litNum,
          station: station || undefined,
          notes: notes || undefined,
        }),
      });
      Alert.alert("Saved!", "Fuel log saved.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Log Fill-up" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Date *</Text>
              <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Odometer (km) *</Text>
              <TextInput style={s.input} value={odometer} onChangeText={setOdometer} placeholder={lastOdo ? `> ${lastOdo.toLocaleString()}` : "e.g. 45320"} keyboardType="numeric" />
              {lastOdo && <Text style={s.hint}>Last: {lastOdo.toLocaleString()} km</Text>}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Liters *</Text>
              <TextInput style={s.input} value={liters} onChangeText={setLiters} placeholder="e.g. 30.5" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Total Cost (PHP) *</Text>
              <TextInput style={s.input} value={totalCost} onChangeText={setTotalCost} placeholder="e.g. 2000" keyboardType="decimal-pad" />
              {pricePerLiter && <Text style={s.hint}>₱{pricePerLiter}/L</Text>}
            </View>
          </View>

          <Text style={s.label}>Gas Station <Text style={s.optional}>(optional)</Text></Text>
          <TextInput style={s.input} value={station} onChangeText={setStation} placeholder="e.g. Shell EDSA" />

          <Text style={s.label}>Notes <Text style={s.optional}>(optional)</Text></Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: "top" }]} value={notes} onChangeText={setNotes} placeholder="Any notes…" multiline />

          <TouchableOpacity style={[s.btn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save Fill-up</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4 },
  optional: { fontWeight: "400", color: "#9ca3af" },
  input: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827", backgroundColor: "#fff", marginBottom: 12 },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: -8, marginBottom: 8 },
  btn: { backgroundColor: "#1d4ed8", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
