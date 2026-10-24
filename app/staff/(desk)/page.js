import { Queue } from "@/components/Queue";
import { parseSort } from "@/lib/constants";
import { listRequests } from "@/lib/requests";

export const metadata = { title: "Open requests" };

export default async function OpenQueuePage({ searchParams }) {
  const params = await searchParams;
  const sort = parseSort(typeof params.sort === "string" ? params.sort : "");
  const requests = listRequests({ archive: false, sort });

  return (
    <Queue
      title="Open requests"
      intro="Completed requests move to the archive. They are not deleted."
      requests={requests}
      sort={sort}
      basePath="/staff"
      empty="No open requests."
    />
  );
}
