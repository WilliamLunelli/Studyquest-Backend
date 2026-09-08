import * as z from "zod";
import { DASHBOARD_PERIODOS } from "../types/dashboard.types";

export const DashboardPeriodoQuery = z.enum(DASHBOARD_PERIODOS).optional();
