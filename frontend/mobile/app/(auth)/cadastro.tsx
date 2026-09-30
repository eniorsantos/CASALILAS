import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/auth/SessionProvider";
import { colors, typography } from "../../src/theme/tokens";
import { AuthInput, AuthButton, AuthError } from "../../src/components/AuthForm";

export default function SignupScreen() {
  const { signUp } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    setError(null);
    if (password.length < 8) {
      setError("A senha precisa de ao menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Criar conta</Text>
        <AuthInput placeholder="Nome" value={name} onChangeText={setName} />
        <AuthInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AuthInput placeholder="Senha (mín. 8)" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <AuthError message={error} />}
        <AuthButton title={loading ? "Criando…" : "Criar conta"} onPress={onSignup} disabled={loading} />
        <Link href="/(auth)/login" style={styles.link}>Já tenho conta — entrar</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { color: colors.textPrimary, fontSize: typography.title.size, fontWeight: "700", marginBottom: 16, fontFamily: typography.bodyFamily },
  link: { color: colors.textSecondary, fontSize: 12, marginTop: 16, textAlign: "center", fontFamily: typography.bodyFamily },
});
