export const dynamic = "force-dynamic";

import { getCourseWithModules } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CourseInfoForm } from "@/components/admin/CourseInfoForm";
import { CoursePricingForm } from "@/components/admin/CoursePricingForm";
import { CourseSettingsForm } from "@/components/admin/CourseSettingsForm";
import { CurriculumBuilder } from "@/components/admin/CurriculumBuilder";

export default async function CourseEditorPage({ params }: { params: { id: string } }) {
  const course = await getCourseWithModules(params.id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[22px] font-bold text-textPrimary">{course.title}</h1>
        <StatusBadge status={course.status} />
      </div>
      <Tabs defaultValue="curriculo">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="curriculo">Currículo</TabsTrigger>
          <TabsTrigger value="preco">Preço</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <CourseInfoForm
            course={{ id: course.id, title: course.title, description: course.description, priceCents: course.priceCents }}
          />
        </TabsContent>
        <TabsContent value="curriculo">
          <CurriculumBuilder courseId={course.id} modules={course.modules} />
        </TabsContent>
        <TabsContent value="preco">
          <CoursePricingForm
            course={{ id: course.id, title: course.title, description: course.description, priceCents: course.priceCents }}
          />
        </TabsContent>
        <TabsContent value="config">
          <CourseSettingsForm course={{ id: course.id, title: course.title, status: course.status }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
