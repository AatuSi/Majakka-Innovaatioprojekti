import { notFound } from "@tanstack/react-router";
import { getAccessToken } from "../../api/config";
import { getAuthUser } from "../../components/authUserStore";

export async function assertAdminAccess(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const token = getAccessToken();
  const user = getAuthUser();

  if (!token || user?.role !== "admin") {
    throw notFound();
  }
}