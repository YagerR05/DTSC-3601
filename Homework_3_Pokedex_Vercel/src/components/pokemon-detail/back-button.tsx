"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        // Prefer browser history so whatever filters/search were active on
        // the list page are still there — a plain link to "/" would reset them.
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
    >
      <ArrowLeft className="mr-1 size-4" />
      Back
    </Button>
  );
}
