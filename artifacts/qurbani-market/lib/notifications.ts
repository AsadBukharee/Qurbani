/**
 * Expo push notification setup.
 *
 * Call `registerForPushNotifications()` after a successful login.
 * It will request permission, fetch the Expo push token, and POST it
 * to the Django backend so the server can target this device.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { isApiEnabled, pushTokens } from "./api";

// Display alerts even when the app is foregrounded.
// Wrapped in try/catch because expo-notifications push functionality was
// removed from Expo Go in SDK 53+. In Expo Go, this call may throw.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn("[notifications] setNotificationHandler failed (Expo Go?):", e);
}

export async function registerForPushNotifications(): Promise<string | null> {
  // Push only works on physical devices
  if (!Device.isDevice) {
    console.warn("[push] not a physical device — skipping");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Qurbani Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#926B1F",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") {
    console.warn("[push] permission denied");
    return null;
  }

  try {
    // In SDK 53+, Expo Go requires explicit projectId for getExpoPushTokenAsync
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResp = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenResp.data;
    if (!token) return null;

    if (isApiEnabled()) {
      try {
        await pushTokens.register(token, Platform.OS);
      } catch (err) {
        console.warn("[push] failed to register token with backend:", err);
      }
    }
    return token;
  } catch (err) {
    console.warn("[push] could not get expo push token:", err);
    return null;
  }
}

export async function unregisterPushToken(token: string) {
  if (!isApiEnabled() || !token) return;
  try {
    await pushTokens.unregister(token);
  } catch {}
}

/**
 * Subscribe to incoming notifications. Returns an unsubscribe fn.
 * Useful for routing the user to a screen when they tap a push.
 */
export function addNotificationListener(
  onReceived: (n: Notifications.Notification) => void,
  onResponse?: (r: Notifications.NotificationResponse) => void
): () => void {
  const sub1 = Notifications.addNotificationReceivedListener(onReceived);
  const sub2 = onResponse
    ? Notifications.addNotificationResponseReceivedListener(onResponse)
    : null;
  return () => {
    sub1.remove();
    sub2?.remove();
  };
}
