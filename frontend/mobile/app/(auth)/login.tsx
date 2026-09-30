import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/auth/SessionProvider";
import { signInWithApple, appleAuthAvailable } from "../../src/auth/social";
import { colors, typography } from "../../src/theme/tokens";
import { AuthInput, AuthButton, AuthError } from "../../src/components/AuthForm";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, signInSocial } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google (id_token, sem secret no app). Exige Client IDs no Google Cloud —
  // ver frontend/mobile/.env.example. Sem eles, o botão mostra o erro abaixo.
  const [googleRequest, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params.id_token;
      if (!idToken) {
        setError("Google não retornou credencial.");
        return;
      }
      signInSocial("google", idToken)
        .then(() => router.replace("/(tabs)/home"))
        .catch(() => setError("Login com Google falhou."));
    } else if (googleResponse?.type === "error") {
      setError("Login com Google cancelado ou indisponível.");
    }
  }, [googleResponse, signInSocial, router]);

  async function onLogin() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.brand}>CURSOSFLIX</Text>
        <Text style={styles.title}>Entrar</Text>
        <AuthInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AuthInput placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <AuthError message={error} />}
        <AuthButton title={loading ? "Entrando…" : "Entrar"} onPress={onLogin} disabled={loading} />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>
        <Pressable
          style={[styles.social, !googleRequest && styles.socialDisabled]}
          disabled={!googleRequest}
          onPress={() => void googlePrompt()}
        >
          <Text style={styles.socialText}>Continuar com Google</Text>
        </Pressable>
        {appleAuthAvailable() && (
          <Pressable
            style={[styles.social, styles.apple]}
            onPress={() =>
              signInWithApple()
                .then((cred) => signInSocial("apple", cred.idToken, { email: cred.email, name: cred.name }))
                .then(() => router.replace("/(tabs)/home"))
                .catch((e) => setError(e instanceof Error ? e.message : "Login com Apple falhou."))
            }
          >
            <Text style={styles.socialText}>Continuar com Apple</Text>
          </Pressable>
        )}
        <View style={styles.links}>
          <Link href="/(auth)/recuperar-senha" style={styles.link}>Esqueci a senha</Link>
          <Link href="/(auth)/cadastro" style={styles.link}>Criar conta</Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  brand: { color: colors.primary, fontSize: 26, fontFamily: typography.displayFamily, textAlign: "center", marginBottom: 24 },
  title: { color: colors.textPrimary, fontSize: typography.title.size, fontWeight: "700", marginBottom: 16, fontFamily: typography.bodyFamily },
  links: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  link: { color: colors.textSecondary, fontSize: 12, fontFamily: typography.bodyFamily },
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: 11, fontFamily: typography.bodyFamily },
  social: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  socialDisabled: { opacity: 0.5 },
  apple: { backgroundColor: "#000" },
  socialText: { color: colors.textPrimary, fontWeight: "600", fontSize: 13, fontFamily: typography.bodyFamily },
});
