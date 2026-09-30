import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { CourseCard } from "../../src/components/CourseCard";
import { useCourseSearch } from "../../src/api/queries";
import { colors, typography } from "../../src/theme/tokens";

/** Busca com sugestões (top 5 ao digitar) + grid de resultados. */
export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const { data, isFetching } = useCourseSearch(q);
  const go = (slug?: string) =>
    slug && router.push({ pathname: "/curso/[slug]", params: { slug } });

  return (
    <Screen>
      <View style={styles.container}>
        <TextInput
          placeholder="Buscar cursos…"
          placeholderTextColor={colors.textSecondary}
          value={q}
          onChangeText={setQ}
          style={styles.input}
          autoCapitalize="none"
        />
        {q.trim().length >= 2 && (data ?? []).length > 0 && (
          <View style={styles.suggestions}>
            {data!.slice(0, 5).map((c) => (
              <Pressable key={c.id} style={styles.suggestion} onPress={() => go(c.slug)}>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {c.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {isFetching && <ActivityIndicator color={colors.primary} />}
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <CourseCard
              title={item.title}
              thumbnailUrl={item.thumbnailUrl}
              onPress={() => router.push({ pathname: "/curso/[slug]", params: { slug: item.slug } })}
            />
          )}
          ListEmptyComponent={
            q.trim().length >= 2 && !isFetching ? (
              <Text style={styles.empty}>Nenhum curso encontrado.</Text>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: typography.bodyFamily,
  },
  row: { gap: 0, marginBottom: 4 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 32, fontFamily: typography.bodyFamily },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  suggestion: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { color: colors.textPrimary, fontSize: 13, fontFamily: typography.bodyFamily },
});
