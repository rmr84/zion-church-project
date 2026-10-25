import { Queue } from "@/components/Queue";
import { listRequests } from "@/lib/requests";
import { listDeskMembers } from "@/lib/users";

export const metadata = { title: "Archive" };

export default async function ArchivePage() {
  const [openRequests, archivedRequests, members] = await Promise.all([
    listRequests({ archive: false, sort: "urgency" }),
    listRequests({ archive: true, sort: "urgency" }),
    listDeskMembers(),
  ]);

  return (
    <Queue
      openRequests={openRequests}
      archivedRequests={archivedRequests}
      members={members}
      initialArchive
    />
  );
}
