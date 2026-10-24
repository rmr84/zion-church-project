import { Queue } from "@/components/Queue";
import { parseSort } from "@/lib/constants";
import { listRequests } from "@/lib/requests";

export const metadata = { title: "Archive" };

export default async function ArchivePage({ searchParams }) {
  const params = await searchParams;
  const sort = parseSort(typeof params.sort === "string" ? params.sort : "");
  const requests = listRequests({ archive: true, sort });

  return (
    <Queue
      title="Archive"
      intro="Completed requests stay here. The desk cannot delete them."
      requests={requests}
      sort={sort}
      basePath="/staff/archive"
      empty="No completed requests yet."
    />
  );
}
