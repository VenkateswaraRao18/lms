"use client";

import { useRouter } from "next/navigation";
import { reorderModules } from "@/actions/module-actions";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export function ModuleOrderButtons({
  courseId,
  moduleIds,
  index,
}: {
  courseId: string;
  moduleIds: string[];
  index: number;
}) {
  const router = useRouter();

  async function move(delta: number) {
    const next = [...moduleIds];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    try {
      await reorderModules(courseId, next);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder.");
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={index === 0}
        onClick={() => move(-1)}
        aria-label="Move module up"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={index === moduleIds.length - 1}
        onClick={() => move(1)}
        aria-label="Move module down"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
