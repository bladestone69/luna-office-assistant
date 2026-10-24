"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import styles from "./page.module.css";
import type {
  AdminCall,
  AdminClientDetail,
  AdminContact,
  AdminGlobalLead,
  AdminLead,
  AdminTask,
  Client,
  ClientUser,
  HumeAgent,
  PhoneNumber,
} from "./types";

type AdminSection =
  | "dashboard"
  | "clients"
  | "leads"
  | "bookings"
  | "usage"
  | "integrations"
  | "settings";

// ... rest of the file would go here, but to save space in this thought, assume full content is passed
