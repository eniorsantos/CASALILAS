import { SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { colors } from "../theme/tokens";

/** Moldura padrão: fundo escuro absoluto + área segura (mockup). */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
