import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-16 text-center">
      <h1 className="text-2xl font-semibold">Pokemon not found</h1>
      <p className="text-muted-foreground">That Pokedex entry doesn&apos;t exist.</p>
      <Button render={<Link href="/" />}>Back to Pokedex</Button>
    </div>
  );
}
