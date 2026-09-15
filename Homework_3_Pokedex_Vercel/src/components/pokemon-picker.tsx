"use client";

import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Pokemon } from "@/lib/types";

export function PokemonPicker({
  title,
  pokemons,
  selectedIds,
  onChange,
  max,
}: {
  title: string;
  pokemons: Pokemon[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  max: number;
}) {
  const selectedSet = new Set(selectedIds);
  const atMax = selectedIds.length >= max;

  function toggle(id: number) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((v) => v !== id));
    } else if (!atMax) {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}>
        {title}
        {selectedIds.length > 0 && (
          <span className="ml-1 rounded-sm bg-secondary px-1.5 text-xs font-medium">
            {selectedIds.length}/{max}
          </span>
        )}
        <ChevronDown className="ml-1 size-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search Pokemon..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {pokemons.map((p) => {
                const isSelected = selectedSet.has(p.id);
                const disabled = !isSelected && atMax;
                return (
                  <CommandItem
                    key={p.id}
                    disabled={disabled}
                    onSelect={() => toggle(p.id)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                    <span>{p.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedIds.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={() => onChange([])} className="justify-center text-center">
                  Clear selection
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
