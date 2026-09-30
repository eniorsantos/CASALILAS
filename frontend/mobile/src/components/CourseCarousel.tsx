import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { CourseCard } from "./CourseCard";
import { colors, typography } from "../theme/tokens";

export type CarouselCourse = {
  id: string;
  slug?: string;
  title: string;
  thumbnailUrl: string;
  progressPercent?: number;
};

/** Carrossel horizontal — FlashList p/ listas grandes (spec §11). */
export function CourseCarousel({
  title,
  courses,
  onCoursePress,
}: {
  title: string;
  courses: CarouselCourse[];
  onCoursePress: (course: CarouselCourse) => void;
}) {
  if (courses.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlashList
        horizontal
        data={courses}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        estimatedItemSize={100}
        renderItem={({ item }) => (
          <CourseCard
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            progressPercent={item.progressPercent}
            onPress={() => onCoursePress(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 9 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingBottom: 10,
    fontFamily: typography.bodyFamily,
  },
  row: { paddingHorizontal: 18 },
});
