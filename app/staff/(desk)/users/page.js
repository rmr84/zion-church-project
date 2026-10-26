import { UserTable } from '@/components/UserTable';
import { listDeskMembers } from '@/lib/users';

export const metadata = { title: 'User Management' };

export default async function UserManagementPage() {
  const members = await listDeskMembers();

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>User Management</h1>
      </div>
      <UserTable members={members} />
    </section>
  );
}
