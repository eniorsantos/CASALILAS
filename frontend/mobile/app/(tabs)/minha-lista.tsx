import { FlatList, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { CourseCarousel } from "../../src/components/CourseCarousel";
import { useHome } from "../../src/api/queries";
import { colors, typography } from "../../src/theme/tokens";

/** Minha Lista: continua assistindo + matriculados (do agregado da home). */
export default function MyListScreen() {
  const router = useRouter();
  const { data, isLoading } = useHome();

  const go = (slug?: string) =>
    slug && router.push({ pathname: "/curso/[slug]", params: { slug } });

  if (isLoading || !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const mine = data.sections.filter((s) =>
    ["Continue assistindo", "Meus cursos"].includes(s.title)
  );

  return (
    <Screen>
      <FlatList
        data={mine}
        keyExtractor={(s) => s.title}
        ListHeaderComponent={<Text style={styles.title}>Minha Lista</Text>}
        renderItem={({ item }) => (
          <CourseCarousel title={item.title} courses={item.courses} onCoursePress={(c) => go(c.slug)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Você ainda não começou nenhum curso.</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    padding: 18,
    fontFamily: typography.bodyFamily,
  },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 32, fontFamily: typography.bodyFamily },
});
