import { redirect } from "next/navigation";
import { DeskNav } from "@/components/DeskNav";
import { isStaffSignedIn } from "@/lib/session";

export default async function DeskLayout({ children }) {
  if (!(await isStaffSignedIn())) redirect("/sign-in");

  return (
    <>
      <div className="wrap wide">
        <DeskNav />
      </div>
      {children}
    </>
  );
}
