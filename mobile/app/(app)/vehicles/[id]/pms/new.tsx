import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { apiUpload, apiFetch, getAuthHeaders, blobImageUri } from "@/api";
import type { OCRData, LineItem } from "@/types";

type Step = "upload" | "review";

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function NewPMSScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [savedImagePath, setSavedImagePath] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);

  // Review form state
  const [shopName, setShopName] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ name: "", price: 0 }]);
  const [totalAmount, setTotalAmount] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [nextServiceMileage, setNextServiceMileage] = useState("");
  const [nextServiceNote, setNextServiceNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [headers, setHeaders] = useState<Record<string, string>>({});

  useState(() => { getAuthHeaders().then(setHeaders); });

  async function pickImage(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access in settings.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.85 });

    if (result.canceled) return;
    await scanReceipt(result.assets[0].uri);
  }

  async function scanReceipt(uri: string) {
    setImageUri(uri);
    setScanning(true);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.append("receipt", {
        uri,
        name: `receipt_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as unknown as Blob);

      const data = await apiUpload<{ success: boolean; data?: OCRData; imagePath?: string; error?: string }>(
        `/api/scan-receipt`,
        formData,
      );

      if (data.success && data.data) {
        setSavedImagePath(data.imagePath ?? null);
        setOcrData(data.data);
        setShopName(data.data.shopName ?? "");
        setServiceDate(data.data.serviceDate ?? new Date().toISOString().split("T")[0]);
        setMileage(data.data.mileage?.toString() ?? "");
        setTotalAmount(data.data.totalAmount?.toString() ?? "");
        setItems(data.data.items.length > 0 ? data.data.items : [{ name: "", price: 0 }]);
        setStep("review");
      } else {
        setScanError(data.error ?? "Scan failed");
        setOcrData({ items: [], rawText: "" });
        setStep("review");
      }
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : "Scan failed");
      setOcrData({ items: [], rawText: "" });
      setStep("review");
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    if (!serviceDate) { Alert.alert("Error", "Service date is required."); return; }
    if (items.some((item) => !item.name.trim())) { Alert.alert("Error", "All items need a name."); return; }
    if (!totalAmount || isNaN(Number(totalAmount))) { Alert.alert("Error", "Enter a valid total amount."); return; }

    setSaving(true);
    try {
      await apiFetch(`/api/vehicles/${id}/pms`, {
        method: "POST",
        body: JSON.stringify({
          shopName: shopName || undefined,
          serviceDate,
          mileage: mileage ? Number(mileage) : undefined,
          totalAmount: Number(totalAmount),
          items,
          receiptImagePath: savedImagePath,
          nextServiceDate: nextServiceDate || undefined,
          nextServiceMileage: nextServiceMileage ? Number(nextServiceMileage) : undefined,
          nextServiceNote: nextServiceNote || undefined,
        }),
      });
      Alert.alert("Saved!", "PMS record saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  // ── Upload step ──
  if (step === "upload") {
    return (
      <>
        <Stack.Screen options={{ title: "Add PMS Record" }} />
        <View style={s.container}>
          {scanning ? (
            <View style={s.scanningBox}>
              <ActivityIndicator size="large" color="#1d4ed8" />
              <Text style={s.scanningText}>Scanning receipt with AI…</Text>
            </View>
          ) : (
            <>
              <Text style={s.uploadTitle}>Scan or Upload Receipt</Text>
              <Text style={s.uploadSub}>Take a photo of your PMS receipt. AI will extract the details automatically.</Text>
              <TouchableOpacity style={s.uploadBtn} onPress={() => pickImage(true)}>
                <Text style={s.uploadBtnIcon}>📷</Text>
                <Text style={s.uploadBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.uploadBtn, s.uploadBtnOutline]} onPress={() => pickImage(false)}>
                <Text style={s.uploadBtnIcon}>🖼</Text>
                <Text style={[s.uploadBtnText, { color: "#1d4ed8" }]}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setOcrData({ items: [], rawText: "" }); setStep("review"); }}>
                <Text style={s.skipText}>Skip — enter manually</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </>
    );
  }

  // ── Review step ──
  return (
    <>
      <Stack.Screen options={{ title: "Review Details" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={s.container} contentContainerStyle={s.reviewContent} keyboardShouldPersistTaps="handled">

          {scanError && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>⚠ Scan error: {scanError} — enter details manually below.</Text>
            </View>
          )}

          {imageUri && (
            <View style={s.imagePreview}>
              <Image source={{ uri: imageUri }} style={s.previewImage} contentFit="contain" />
            </View>
          )}

          <Text style={s.sectionTitle}>Service Details</Text>

          <Text style={s.label}>Shop Name</Text>
          <TextInput style={s.input} value={shopName} onChangeText={setShopName} placeholder="e.g. Ignition X" />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Service Date *</Text>
              <TextInput style={s.input} value={serviceDate} onChangeText={setServiceDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Mileage (km)</Text>
              <TextInput style={s.input} value={mileage} onChangeText={setMileage} placeholder="e.g. 45000" keyboardType="numeric" />
            </View>
          </View>

          <Text style={s.sectionTitle}>Items / Services *</Text>
          {items.map((item, i) => (
            <View key={i} style={s.itemRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={item.name}
                onChangeText={(v) => setItems((prev) => prev.map((it, j) => j === i ? { ...it, name: v } : it))}
                placeholder="Service name"
              />
              <TextInput
                style={[s.input, { width: 90, marginBottom: 0 }]}
                value={item.price === 0 && item.name === "" ? "" : item.price.toString()}
                onChangeText={(v) => setItems((prev) => prev.map((it, j) => j === i ? { ...it, price: Number(v) || 0 } : it))}
                placeholder="Price"
                keyboardType="numeric"
              />
              {items.length > 1 && (
                <TouchableOpacity onPress={() => setItems((prev) => prev.filter((_, j) => j !== i))}>
                  <Text style={{ color: "#ef4444", fontSize: 20, paddingLeft: 6 }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={() => setItems((prev) => [...prev, { name: "", price: 0 }])} style={s.addItemBtn}>
            <Text style={s.addItemText}>+ Add Item</Text>
          </TouchableOpacity>

          <Text style={s.label}>Total Amount (PHP) *</Text>
          <TextInput style={s.input} value={totalAmount} onChangeText={setTotalAmount} placeholder="0.00" keyboardType="numeric" />

          <Text style={s.sectionTitle}>Next Service Reminder (optional)</Text>
          <Text style={s.label}>What service is due?</Text>
          <TextInput style={s.input} value={nextServiceNote} onChangeText={setNextServiceNote} placeholder="e.g. Oil change, Timing belt" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Due Date</Text>
              <TextInput style={s.input} value={nextServiceDate} onChangeText={setNextServiceDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Due Mileage (km)</Text>
              <TextInput style={s.input} value={nextServiceMileage} onChangeText={setNextServiceMileage} placeholder="e.g. 50000" keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>Save PMS Record</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep("upload")} style={{ alignItems: "center", marginTop: 12, paddingBottom: 24 }}>
            <Text style={{ color: "#6b7280", fontSize: 14 }}>← Back to Upload</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  scanningBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  scanningText: { fontSize: 16, color: "#374151", fontWeight: "600" },
  uploadTitle: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center", marginTop: 48, marginBottom: 8, paddingHorizontal: 24 },
  uploadSub: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 36, paddingHorizontal: 32 },
  uploadBtn: { marginHorizontal: 24, marginBottom: 12, backgroundColor: "#1d4ed8", borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 },
  uploadBtnOutline: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#1d4ed8" },
  uploadBtnIcon: { fontSize: 22 },
  uploadBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  skipText: { textAlign: "center", color: "#9ca3af", marginTop: 16, fontSize: 14 },
  reviewContent: { padding: 16, paddingBottom: 48 },
  errorBanner: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: "#b91c1c", fontSize: 13 },
  imagePreview: { borderRadius: 12, overflow: "hidden", marginBottom: 16, backgroundColor: "#e2e8f0" },
  previewImage: { width: "100%", height: 180 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 12, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827", backgroundColor: "#fff", marginBottom: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  addItemBtn: { borderWidth: 1.5, borderColor: "#1d4ed8", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginBottom: 16, borderStyle: "dashed" },
  addItemText: { color: "#1d4ed8", fontWeight: "600", fontSize: 14 },
  saveBtn: { backgroundColor: "#1d4ed8", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
