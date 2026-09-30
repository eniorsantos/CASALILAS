import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export interface HomeCarouselCourse {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  progressPercent?: number;
  lessonId?: string; // primeira aula a continuar (Continue assistindo)
}

export interface HomeSection {
  title: string;
  courses: HomeCarouselCourse[];
}

export interface HomeData {
  hero: {
    courseId: string;
    slug: string;
    title: string;
    bannerUrl: string;
    description: string;
    meta: string;
    lessonId?: string;
  } | null;
  sections: HomeSection[];
}

/** Home agregada: 1 chamada retorna hero + carrosséis (spec §6.1). */
export function useHome() {
  return useQuery({
    queryKey: ["mobile-home"],
    queryFn: () => api.get<HomeData>("/api/mobile/home"),
  });
}

/** Detalhe do curso com módulos/aulas + flag de acesso. */
export interface CourseDetailLesson {
  id: string;
  title: string;
  type: string;
  durationSecs?: number | null;
  isFreePreview: boolean;
  completed?: boolean;
}

export interface CourseDetailModule {
  id: string;
  title: string;
  lessons: CourseDetailLesson[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  priceCents: number;
  category?: string | null;
  instructorName?: string;
  hasAccess: boolean;
  modules: CourseDetailModule[];
  related: HomeCarouselCourse[];
}

export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: ["mobile-course", slug],
    queryFn: () => api.get<CourseDetail>(`/api/mobile/courses/${slug}`),
  });
}

/** Catálogo publicado com busca (stale generoso: catálogo muda pouco). */
export function useCourseSearch(q: string) {
  return useQuery({
    queryKey: ["mobile-search", q],
    queryFn: () =>
      api.get<HomeCarouselCourse[]>(`/api/mobile/courses?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
  });
}

export interface MobileCertificate {
  id: string;
  courseTitle: string;
  certificateUrl: string;
  verificationHash: string;
  issuedAt: string;
}

export function useMyCertificates() {
  return useQuery({
    queryKey: ["mobile-certificates"],
    queryFn: () => api.get<MobileCertificate[]>("/api/mobile/certificates"),
  });
}

export interface MobilePlan {
  id: string;
  name: string;
  priceCents: number;
  interval: string;
  isAllCourses: boolean;
}

export function usePlans() {
  return useQuery({
    queryKey: ["mobile-plans"],
    queryFn: () => api.get<MobilePlan[]>("/api/mobile/plans"),
  });
}
