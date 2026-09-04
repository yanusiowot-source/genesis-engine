import { createFileRoute } from "@tanstack/react-router";
import { UniverseApp } from "@/components/universe-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <UniverseApp />;
}
