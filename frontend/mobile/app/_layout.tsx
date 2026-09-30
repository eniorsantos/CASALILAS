import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { SessionProvider, useSession } from "../src/auth/SessionProvider";
import { queryClient } from "../src/query/query-client";
import { colors } from "../src/theme/tokens";

void SplashScreen.preventAutoHideAsync();

function Guard() {
  const { user, ready } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    if (user && inAuth) router.replace("/(tabs)/home");
  }, [user, ready, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="curso/[slug]" options={{ presentation: "card" }} />
      <Stack.Screen name="player/[lessonId]" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="checkout/[courseId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterBold: Inter_700Bold,
    InterExtraBold: Inter_800ExtraBold,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
      setReady(true);
    }
  }, [fontsLoaded]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="light" />
        <Guard />
      </SessionProvider>
    </QueryClientProvider>
  );
}
