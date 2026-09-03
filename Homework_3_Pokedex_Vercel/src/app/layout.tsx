import type { Metadata } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pokedex Explorer",
  description: "Explore Pokemon base stats, types, and legendary status across all nine generations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="font-heading min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="px-4 py-6 text-center text-xs text-muted-foreground/60 sm:px-8">
          Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and Creatures Inc. This is
          an unofficial fan project, not affiliated with or endorsed by them. Data and images courtesy of{" "}
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted hover:text-muted-foreground"
          >
            PokeAPI
          </a>
          ,{" "}
          <a
            href="https://play.pokemonshowdown.com"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted hover:text-muted-foreground"
          >
            Pokémon Showdown
          </a>
          , and{" "}
          <a
            href="https://github.com/PokeMiners/pogo_assets"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted hover:text-muted-foreground"
          >
            PokeMiners
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
