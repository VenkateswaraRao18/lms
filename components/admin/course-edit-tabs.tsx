"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  basics: React.ReactNode;
  modules: React.ReactNode;
  students: React.ReactNode;
};

export function CourseEditTabs({ basics, modules, students }: Props) {
  return (
    <Tabs defaultValue="basics" className="gap-6">
      <TabsList variant="line" className="w-full max-w-md justify-start">
        <TabsTrigger value="basics">Basics</TabsTrigger>
        <TabsTrigger value="modules">Modules & lessons</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
      </TabsList>

      <TabsContent value="basics" className="space-y-6">
        {basics}
      </TabsContent>
      <TabsContent value="modules" className="space-y-6">
        {modules}
      </TabsContent>
      <TabsContent value="students" className="space-y-6">
        {students}
      </TabsContent>
    </Tabs>
  );
}
