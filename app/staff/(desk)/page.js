import { Queue } from "@/components/Queue";
import { listRequests } from "@/lib/requests";

export const metadata = { title: "Open Requests" };

export default async function OpenQueuePage() {
  const [openRequests, archivedRequests] = await Promise.all([
    listRequests({ archive: false, sort: "urgency" }),
    listRequests({ archive: true, sort: "urgency" }),
  ]);

  return (
    <Queue
      openRequests={openRequests}
      archivedRequests={archivedRequests}
      initialArchive={false}
    />
  );
}
