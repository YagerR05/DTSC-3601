"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIST_URL_STORAGE_KEY } from "@/lib/list-url-memory";

export function HomeButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        const remembered = typeof window !== "undefined" ? sessionStorage.getItem(LIST_URL_STORAGE_KEY) : null;
        router.push(remembered ?? "/");
      }}
    >
      <Home className="mr-1 size-4" />
      Home
    </Button>
  );
}
