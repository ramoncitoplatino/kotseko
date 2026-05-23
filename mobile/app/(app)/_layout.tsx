import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { useAuth } from "@/auth";
import { View, ActivityIndicator } from "react-native";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1d4ed8" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    />
  );
}
