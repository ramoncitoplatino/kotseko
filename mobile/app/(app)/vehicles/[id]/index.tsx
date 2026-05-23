import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { apiFetch, getAuthHeaders, blobImageUri } from "@/api";
import type { Vehicle, PMSRecord, FuelLog } from "@/types";

const FUEL_ICONS: Record<string, string> = { ICE: "⛽", BEV: "⚡", PHEV: "🔌", HEV: "🍃" };

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

type Tab = "maintenance" | "fuel";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [pmsRecords, setPmsRecords] = useState<PMSRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [tab, setTab] = useState<Tab>("maintenance");
  const [refreshing, setRefreshing] = useState(false);
  const [headers, setHeaders] = useState<Record<string, string>>({});

  useEffect(() => { getAuthHeaders().then(setHeaders); }, []);

  const load = useCallback(async () => {
    try {
      const [v, pms, fuel] = await Promise.all([
        apiFetch<Vehicle>(`/api/vehicles/${id}`),
        apiFetch<PMSRecord[]>(`/api/vehicles/${id}/pms`),
        apiFetch<FuelLog[]>(`/api/vehicles/${id}/fuel`),
      ]);
      setVehicle(v);
      setPmsRecords(pms);
      setFuelLogs(fuel);
    } catch {
      Alert.alert("Error", "Could not load vehicle.");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const reminder = vehicle
    ? (() => {
        const latest = pmsRecords[0];
        if (!latest) return null;
        const today = Date.now();
        if (latest.nextServiceDate) {
          const daysLeft = Math.ceil((new Date(latest.nextServiceDate).getTime() - today) / 86400000);
          if (daysLeft < 0) return { level: "overdue", message: "Service overdue" };
          if (daysLeft <= 30) return { level: "soon", message: `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` };
        }
        const latestOdo = fuelLogs[0]?.odometer ?? null;
        if (latest.nextServiceMileage && latestOdo) {
          const kmLeft = latest.nextServiceMileage - latestOdo;
          if (kmLeft <= 0) return { level: "overdue", message: "Service overdue" };
          if (kmLeft <= 1000) return { level: "soon", message: `Due in ${kmLeft.toLocaleString()} km` };
        }
        return null;
      })()
    : null;

  if (!vehicle) {
    return <View style={s.loading}><Text>Loading…</Text></View>;
  }

  const totalSpent = pmsRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const latestOdo = fuelLogs[0]?.odometer;

  // Fuel log km/L
  const fuelWithEco = fuelLogs.map((log, i) => {
    const prev = fuelLogs[i + 1];
    const km = prev ? log.odometer - prev.odometer : null;
    return { ...log, fuelEconomy: km && km > 0 ? km / log.liters : null };
  });

  return (
    <>
      <Stack.Screen options={{ title: `${vehicle.year} ${vehicle.make} ${vehicle.model}` }} />
      <ScrollView
        style={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Hero */}
        <View style={s.hero}>
          {vehicle.imagePath ? (
            <Image source={{ uri: blobImageUri(vehicle.imagePath) ?? "", headers }} style={s.heroImage} contentFit="cover" />
          ) : (
            <View style={[s.heroImage, s.heroPlaceholder]}>
              <Text style={{ fontSize: 64 }}>🚗</Text>
            </View>
          )}
          <View style={s.heroOverlay} />
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>{FUEL_ICONS[vehicle.fuelType]} {vehicle.fuelType}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: "Records", value: pmsRecords.length.toString() },
            { label: "Total Spent", value: pmsRecords.length ? formatPHP(totalSpent) : "—" },
            { label: "Odometer", value: latestOdo ? `${latestOdo.toLocaleString()} km` : "—" },
          ].map(({ label, value }) => (
            <View key={label} style={s.statBox}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={s.statValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Reminder */}
        {reminder && (
          <View style={[s.reminder, reminder.level === "overdue" ? s.reminderRed : s.reminderYellow]}>
            <Text style={[s.reminderText, reminder.level === "overdue" ? s.textRed : s.textYellow]}>
              {reminder.level === "overdue" ? "⚠ Overdue: " : "🕐 Reminder: "}{reminder.message}
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          {(["maintenance", "fuel"] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === "maintenance" ? "🔧 Maintenance" : "⛽ Fuel Log"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {tab === "maintenance" ? (
            <TouchableOpacity style={s.actionBtn} onPress={() => router.push(`/(app)/vehicles/${id}/pms/new`)}>
              <Text style={s.actionBtnText}>+ Add PMS Record</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.actionBtn} onPress={() => router.push(`/(app)/vehicles/${id}/fuel/new`)}>
              <Text style={s.actionBtnText}>+ Log Fill-up</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Maintenance tab */}
        {tab === "maintenance" && (
          <View style={s.section}>
            {pmsRecords.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🔧</Text>
                <Text style={s.emptyTitle}>No PMS records yet</Text>
                <Text style={s.emptyText}>Scan a receipt to add your first record.</Text>
              </View>
            ) : (
              pmsRecords.map((r) => (
                <View key={r.id} style={s.recordCard}>
                  <View style={s.recordHeader}>
                    <Text style={s.recordDate}>{formatDate(r.serviceDate)}</Text>
                    <Text style={s.recordAmount}>{formatPHP(r.totalAmount)}</Text>
                  </View>
                  {r.shopName && <Text style={s.recordShop}>{r.shopName}</Text>}
                  <View style={s.recordMeta}>
                    {r.mileage != null && <Text style={s.metaPill}>📍 {r.mileage.toLocaleString()} km</Text>}
                    <Text style={s.metaPill}>🔩 {r.items.length} items</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Fuel tab */}
        {tab === "fuel" && (
          <View style={s.section}>
            {fuelLogs.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>⛽</Text>
                <Text style={s.emptyTitle}>No fuel logs yet</Text>
                <Text style={s.emptyText}>Log fill-ups to track fuel economy.</Text>
              </View>
            ) : (
              fuelWithEco.map((log) => (
                <View key={log.id} style={s.recordCard}>
                  <View style={s.recordHeader}>
                    <Text style={s.recordDate}>{formatDate(log.date)}</Text>
                    <Text style={s.recordAmount}>{formatPHP(log.totalCost)}</Text>
                  </View>
                  {log.station && <Text style={s.recordShop}>{log.station}</Text>}
                  <View style={s.recordMeta}>
                    <Text style={s.metaPill}>📍 {log.odometer.toLocaleString()} km</Text>
                    <Text style={s.metaPill}>🛢 {log.liters.toFixed(1)} L</Text>
                    {log.fuelEconomy && (
                      <Text style={[s.metaPill, { backgroundColor: log.fuelEconomy >= 12 ? "#dcfce7" : log.fuelEconomy >= 8 ? "#fef9c3" : "#fee2e2" }]}>
                        {log.fuelEconomy.toFixed(1)} km/L
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { position: "relative" },
  heroImage: { width: "100%", height: 200 },
  heroPlaceholder: { backgroundColor: "#1e3a5f", alignItems: "center", justifyContent: "center" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  heroBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 12, borderRightWidth: 1, borderRightColor: "#f1f5f9" },
  statLabel: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: "700", color: "#111827", marginTop: 2 },
  reminder: { marginHorizontal: 12, marginTop: 12, borderRadius: 12, padding: 12, borderWidth: 1 },
  reminderRed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  reminderYellow: { backgroundColor: "#fefce8", borderColor: "#fef08a" },
  reminderText: { fontSize: 14, fontWeight: "600" },
  textRed: { color: "#b91c1c" },
  textYellow: { color: "#a16207" },
  tabs: { flexDirection: "row", marginHorizontal: 12, marginTop: 12, backgroundColor: "#e2e8f0", borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#1d4ed8" },
  actions: { marginHorizontal: 12, marginTop: 10 },
  actionBtn: { backgroundColor: "#1d4ed8", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  section: { padding: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", marginTop: 4, textAlign: "center" },
  recordCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordDate: { fontSize: 14, fontWeight: "700", color: "#111827" },
  recordAmount: { fontSize: 15, fontWeight: "700", color: "#1d4ed8" },
  recordShop: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  recordMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  metaPill: { fontSize: 11, backgroundColor: "#f3f4f6", color: "#374151", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontWeight: "600" },
});
