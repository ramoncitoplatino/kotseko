import { Redirect } from "expo-router";
import { useAuth } from "@/auth";
import { View, ActivityIndicator } from "react-native";

export default function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }
  return <Redirect href={user ? "/(app)/" : "/login"} />;
}
