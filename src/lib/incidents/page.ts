import { notFound } from "next/navigation";
import { ApiError } from "../http";
import { parseIncidentPage, type PageParams } from "./pagination";

export function incidentPageQuery(params: PageParams) {
  try {
    return parseIncidentPage(params);
  } catch (error) {
    if (error instanceof ApiError && error.code === "invalid_request") notFound();
    throw error;
  }
}
