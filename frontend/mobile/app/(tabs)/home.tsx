import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { HeroBanner } from "../../src/components/HeroBanner";
import { CourseCarousel } from "../../src/components/CourseCarousel";
import { useHome } from "../../src/api/queries";
import { colors } from "../../src/theme/tokens";

/** Tela 1 do mockup: hero + carrosséis + tab bar. */
export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading } = useHome();

  if (isLoading || !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {data.hero && (
          <HeroBanner
            course={{
              title: data.hero.title,
              bannerUrl: data.hero.bannerUrl,
              description: data.hero.description,
              meta: data.hero.meta,
            }}
            onPlay={() =>
              data.hero?.lessonId &&
              router.push({ pathname: "/player/[lessonId]", params: { lessonId: data.hero.lessonId } })
            }
            onDetails={() =>
              router.push({ pathname: "/curso/[slug]", params: { slug: data.hero!.slug } })
            }
          />
        )}
        {data.sections.map((section) => (
          <CourseCarousel
            key={section.title}
            title={section.title}
            courses={section.courses}
            onCoursePress={(c) =>
              c.slug && router.push({ pathname: "/curso/[slug]", params: { slug: c.slug } })
            }
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
