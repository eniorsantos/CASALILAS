import { useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { CourseCarousel } from "../../src/components/CourseCarousel";
import { useCourseDetail } from "../../src/api/queries";
import { colors, typography } from "../../src/theme/tokens";

/** Tela 2 do mockup: banner + CTA + módulos expansíveis + relacionados. */
export default function CourseDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useCourseDetail(slug);
  const [openModules, setOpenModules] = useState<string[]>([]);

  if (isLoading || !course) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const firstLesson = course.modules[0]?.lessons[0];

  function toggleModule(id: string) {
    setOpenModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function playLesson(lesson: { id: string; title: string }, thumbnail: string) {
    router.push({
      pathname: "/player/[lessonId]",
      params: { lessonId: lesson.id, title: lesson.title, thumbnail },
    });
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: course.thumbnailUrl }} style={styles.banner}>
          <View style={styles.bannerFallback} />
          <LinearGradient colors={["transparent", colors.background]} style={styles.bannerGradient} />
          <Text style={styles.bannerTitle}>{course.title}</Text>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{course.modules.flatMap((m) => m.lessons).length} aulas</Text>
            <Text style={styles.metaText}>·</Text>
            <Text style={styles.metaText}>Certificado incluso</Text>
            {course.category ? (
              <>
                <Text style={styles.metaText}>·</Text>
                <Text style={styles.metaText}>{course.category}</Text>
              </>
            ) : null}
          </View>
          {course.instructorName ? (
            <Text style={styles.instructor}>por {course.instructorName}</Text>
          ) : null}
          <Text style={styles.desc} numberOfLines={4}>
            {course.description}
          </Text>

          {course.hasAccess && firstLesson ? (
            <Pressable style={styles.cta} onPress={() => playLesson(firstLesson, course.thumbnailUrl)}>
              <Text style={styles.ctaText}>▶ Assistir agora</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.cta}
              onPress={() => router.push({ pathname: "/checkout/[courseId]", params: { courseId: course.id } })}
            >
              <Text style={styles.ctaText}>
                Assinar — R$ {(course.priceCents / 100).toFixed(2).replace(".", ",")}
              </Text>
            </Pressable>
          )}

          {course.modules.map((mod) => {
            const open = openModules.includes(mod.id);
            return (
              <View key={mod.id}>
                <Pressable style={styles.moduleItem} onPress={() => toggleModule(mod.id)}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleCount}>
                    {mod.lessons.length} aulas {open ? "▾" : "▸"}
                  </Text>
                </Pressable>
                {open &&
                  mod.lessons.map((lesson) => (
                    <Pressable
                      key={lesson.id}
                      style={styles.lessonRow}
                      onPress={() => (course.hasAccess || lesson.isFreePreview) && playLesson(lesson, course.thumbnailUrl)}
                    >
                      <View style={styles.lessonDot} />
                      <Text style={styles.lessonTitle} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      {lesson.completed && <Text style={styles.done}>✓</Text>}
                    </Pressable>
                  ))}
              </View>
            );
          })}

          <CourseCarousel
            title="Cursos relacionados"
            courses={course.related}
            onCoursePress={(c) =>
              c.slug && router.push({ pathname: "/curso/[slug]", params: { slug: c.slug } })
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  banner: { height: 220, justifyContent: "flex-end", padding: 18 },
  bannerFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: "#4A3F91" },
  bannerGradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  bannerTitle: { color: colors.textPrimary, fontSize: 26, fontFamily: typography.displayFamily, zIndex: 2 },
  body: { padding: 18 },
  meta: { flexDirection: "row", gap: 10, marginBottom: 10 },
  metaText: { fontSize: 11, color: colors.textSecondary, fontFamily: typography.bodyFamily },
  instructor: { fontSize: 12, color: colors.primaryWarm, marginBottom: 10, fontFamily: typography.bodyFamily },
  desc: { fontSize: 12, color: colors.textSecondary, lineHeight: 19, marginBottom: 16, fontFamily: typography.bodyFamily },
  cta: { backgroundColor: colors.primary, padding: 12, borderRadius: 4, marginBottom: 20, alignItems: "center" },
  ctaText: { color: colors.onPrimary, fontWeight: "700", fontSize: 13, fontFamily: typography.bodyFamily },
  moduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moduleTitle: { fontSize: 12, color: colors.textPrimary, fontFamily: typography.bodyFamily },
  moduleCount: { fontSize: 11, color: colors.textSecondary, fontFamily: typography.bodyFamily },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  lessonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryWarm },
  lessonTitle: { fontSize: 11, color: colors.textSecondary, flex: 1, fontFamily: typography.bodyFamily },
  done: { color: colors.success, fontSize: 12 },
});
