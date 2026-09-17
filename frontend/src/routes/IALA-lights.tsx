import { createFileRoute } from "@tanstack/react-router";
import { IALALightsPage } from "../features/iala-lights";

export const Route = createFileRoute("/IALA-lights")({
  component: IALALightsPage,
});
