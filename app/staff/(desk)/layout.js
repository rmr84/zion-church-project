import { redirect } from "next/navigation";
import { isStaffSignedIn } from "@/lib/session";

export default async function DeskLayout({ children }) {
  if (!(await isStaffSignedIn())) redirect("/staff/login");
  return children;
}
