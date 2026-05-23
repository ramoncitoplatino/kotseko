import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { apiFetch, getAuthHeaders, blobImageUri } from "@/api";
import { useAuth } from "@/auth";
import type { Vehicle } from "@/types";

const FUEL_ICONS: Record<string, string> = { ICE: "⛽", BEV: "⚡", PHEV: "🔌", HEV: "🍃" };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [headers, setHeaders] = useState<Record<string, string>>({});

  useEffect(() => { getAuthHeaders().then(setHeaders); }, []);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Vehicle[]>("/api/vehicles");
      setVehicles(data);
    } catch {
      Alert.alert("Error", "Could not load vehicles.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Garage",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 4 }}>
              <Text style={{ color: "#fff", fontSize: 14 }}>Sign Out</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={s.container}>
        <Text style={s.greeting}>Welcome, {user?.name?.split(" ")[0]} 👋</Text>

        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={vehicles.length === 0 ? s.empty : s.list}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🚗</Text>
              <Text style={s.emptyTitle}>No vehicles yet</Text>
              <Text style={s.emptyText}>Add your vehicles on the web app to see them here.</Text>
            </View>
          }
          renderItem={({ item: v }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/(app)/vehicles/${v.id}`)}>
              <View style={s.imageBox}>
                {v.imagePath ? (
                  <Image
                    source={{ uri: blobImageUri(v.imagePath) ?? "", headers }}
                    style={s.vehicleImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[s.vehicleImage, s.noImage]}>
                    <Text style={{ fontSize: 36 }}>🚗</Text>
                  </View>
                )}
                <View style={s.fuelBadge}>
                  <Text style={s.fuelBadgeText}>{FUEL_ICONS[v.fuelType] ?? "⛽"} {v.fuelType}</Text>
                </View>
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{v.year} {v.make} {v.model}</Text>
                <Text style={s.cardPlate}>{v.plateNumber}</Text>
                <View style={s.cardFooter}>
                  <Text style={s.recordCount}>
                    {v._count?.pmsRecords === 0 ? "No records" : `${v._count?.pmsRecords} PMS records`}
                  </Text>
                  {v.reminder && (
                    <View style={[s.reminderBadge, v.reminder.level === "overdue" ? s.badgeRed : s.badgeYellow]}>
                      <Text style={[s.reminderText, v.reminder.level === "overdue" ? s.textRed : s.textYellow]}>
                        {v.reminder.level === "overdue" ? "⚠ " : "🕐 "}{v.reminder.message}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  greeting: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, fontSize: 16, color: "#475569", fontWeight: "600" },
  list: { padding: 12, gap: 12 },
  empty: { flexGrow: 1, justifyContent: "center" },
  emptyBox: { alignItems: "center", padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  imageBox: { position: "relative" },
  vehicleImage: { width: "100%", height: 160 },
  noImage: { backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  fuelBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  fuelBadgeText: { fontSize: 11, fontWeight: "700", color: "#374151" },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardPlate: { fontSize: 13, color: "#6b7280", fontWeight: "600", letterSpacing: 1, marginTop: 2 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  recordCount: { fontSize: 12, color: "#9ca3af" },
  reminderBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRed: { backgroundColor: "#fef2f2" },
  badgeYellow: { backgroundColor: "#fefce8" },
  reminderText: { fontSize: 11, fontWeight: "600" },
  textRed: { color: "#b91c1c" },
  textYellow: { color: "#a16207" },
});
