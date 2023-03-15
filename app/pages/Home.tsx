import Constants, { AppOwnership } from "expo-constants";
import * as Linking from "expo-linking";
import { View, Text, TouchableOpacity } from "react-native";

/**
 * Automatically determine redirect URL whether we're running in Managed mode or Standalone
 */
const resolvedRedirectUrl =
  Constants.appOwnership == AppOwnership.Expo || Constants.appOwnership == AppOwnership.Guest
    ? Linking.createURL("web3auth", {})
    : Linking.createURL("web3auth", { scheme: "myworkshopapp" })

export default function Home() {
  return (
    <View>
      <Text>Hello</Text>
    </View>
  )
}
