import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Push (spec §10): renovação, curso novo, "continue de onde parou".
 * O disparo parte da fila BullMQ (novo job type) via Expo Push API;
 * aqui vai só o registro do device + handlers locais.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  const status =
    existing === "granted"
      ? existing
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Geral",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId: undefined });
  return token.data;
}
