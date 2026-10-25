import { listDeskMembers } from '@/lib/users';

export const metadata = { title: 'User management' };

export default async function UserManagementPage() {
  const members = await listDeskMembers();

  return (
    <section className="page-frame">
      <div className="page-heading">
        <p className="eyebrow">Care team</p>
        <h1>User management</h1>
      </div>
      {members.length === 0 ? (
        <p className="hint request-table-wrap">No care team members are on file yet.</p>
      ) : (
        <div className="request-table-wrap">
          <table className="request-table member-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.email}>
                  <td>
                    <span className="cell-label">Name</span>
                    {member.name}
                  </td>
                  <td>
                    <span className="cell-label">Email</span>
                    {member.email}
                  </td>
                  <td>
                    <span className="cell-label">Role</span>
                    {member.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
