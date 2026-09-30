import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { CoursesPage } from "./pages/Courses";
import { CourseFormPage } from "./pages/CourseForm";
import { StudentsPage } from "./pages/Students";
import { PlansPage } from "./pages/Plans";

const STAFF = ["ADMIN", "INSTRUCTOR"];

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute roles={STAFF}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="cursos" element={<CoursesPage />} />
            <Route path="cursos/novo" element={<CourseFormPage />} />
            <Route path="cursos/:id" element={<CourseFormPage />} />
            <Route path="alunos" element={<StudentsPage />} />
            <Route path="planos" element={<PlansPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
