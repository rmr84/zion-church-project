import { UserTable } from '@/components/UserTable';
import { getStaff } from '@/lib/session';
import { ADMIN_ROLE, getUserRole, listDeskMembers } from '@/lib/users';

export const metadata = { title: 'User Management' };

export default async function UserManagementPage() {
  const [members, staff] = await Promise.all([
    listDeskMembers(),
    getStaff(),
  ]);
  const role = staff ? await getUserRole(staff.uid) : '';

  return (
    <section className="page-frame">
      <div className="page-heading">
        <h1>User Management</h1>
        <p className="lede">View, manage, and invite users.</p>
      </div>
      <UserTable members={members} canInvite={role === ADMIN_ROLE} />
    </section>
  );
}
