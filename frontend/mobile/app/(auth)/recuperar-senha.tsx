import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { API_URL } from "../../src/api/client";
import { colors, typography } from "../../src/theme/tokens";
import { AuthInput, AuthButton, AuthError } from "../../src/components/AuthForm";

export default function RecoverScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    setError(null);
    try {
      await fetch(`${API_URL}/api/mobile/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true); // resposta idêntica exista ou não o email (anti-enumeração)
    } catch {
      setError("Tente novamente em instantes.");
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Recuperar senha</Text>
        {sent ? (
          <Text style={styles.sent}>Se o email existir, você receberá um link em instantes.</Text>
        ) : (
          <>
            <AuthInput placeholder="Seu email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            {error && <AuthError message={error} />}
            <AuthButton title="Enviar link" onPress={onSend} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { color: colors.textPrimary, fontSize: typography.title.size, fontWeight: "700", marginBottom: 16, fontFamily: typography.bodyFamily },
  sent: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: typography.bodyFamily },
});
