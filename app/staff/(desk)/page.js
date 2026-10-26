import { Queue } from "@/components/Queue";
import { listRequests } from "@/lib/requests";
import { getStaff } from "@/lib/session";
import { ADMIN_ROLE, getUserRole, listDeskMembers } from "@/lib/users";

export const metadata = { title: "Care Requests" };

export default async function OpenQueuePage() {
  const [openRequests, archivedRequests, members, staff] = await Promise.all([
    listRequests({ archive: false, sort: "urgency" }),
    listRequests({ archive: true, sort: "urgency" }),
    listDeskMembers(),
    getStaff(),
  ]);
  const role = staff ? await getUserRole(staff.uid) : '';

  return (
    <Queue
      openRequests={openRequests}
      archivedRequests={archivedRequests}
      members={members}
      initialArchive={false}
      isAdmin={role === ADMIN_ROLE}
    />
  );
}
