import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, UserPlus } from 'lucide-react';
import * as adminUserService from '@/services/adminUserService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { getErrorMessage, getFieldErrors } from '@/lib/apiError';
import { ROLE_LABELS } from '@/lib/roles';
import { isValidEmail, isMinLength } from '@/lib/validators';
import { formatDateTime } from '@/lib/formatters';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin - products, categories, orders, inventory' },
  { value: 'superadmin', label: 'Root admin - everything, plus managing admins' },
];

const EMPTY_INVITE = { name: '', email: '', role: 'admin' };

/** Root admin only: who can open the dashboard, and their accounts. */
export default function AdminUsersPage() {
  const me = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [inviteErrors, setInviteErrors] = useState({});
  const [inviting, setInviting] = useState(false);
  const [linkInfo, setLinkInfo] = useState(null); // { title, text, link }
  const [confirm, setConfirm] = useState(null); // { title, message, label, variant, run }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminUserService.list({ group: 'staff', limit: 100 });
      setUsers(data.items || []);
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not load the admin accounts.') });
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const submitInvite = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isMinLength(invite.name, 2)) errs.name = 'Enter their name';
    if (!isValidEmail(invite.email.trim())) errs.email = 'Enter a valid email';
    setInviteErrors(errs);
    if (Object.keys(errs).length) return;

    setInviting(true);
    try {
      const result = await adminUserService.create({ name: invite.name.trim(), email: invite.email.trim(), role: invite.role });
      const who = result.user?.email || invite.email.trim();
      setInviteOpen(false);
      setInvite(EMPTY_INVITE);
      if (!result.created) {
        addToast({ type: 'success', message: `${who} already had an account and is now ${ROLE_LABELS[invite.role].toLowerCase()}. They sign in with their usual password.` });
      } else if (result.emailSent) {
        addToast({ type: 'success', message: `Invitation sent to ${who}. They set their own password from the email.` });
      } else {
        setLinkInfo({
          title: 'Send this link to the new admin',
          text: `The account for ${who} is ready, but the invitation email could not be sent (email is not set up, or it failed). Send them this link yourself, for example on WhatsApp. It works once and expires in 48 hours.`,
          link: result.setupLink,
        });
      }
      load();
    } catch (error) {
      setInviteErrors(getFieldErrors(error));
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not add the admin.') });
    }
    setInviting(false);
  };

  const sendReset = async (user) => {
    setBusy(true);
    try {
      const result = await adminUserService.sendReset(user.id);
      if (result.emailSent) {
        addToast({ type: 'success', message: `Password reset link sent to ${user.email}` });
      } else {
        setLinkInfo({
          title: 'Send this reset link',
          text: `The email to ${user.email} could not be sent. Send them this link yourself. It works once and expires in 48 hours.`,
          link: result.resetLink,
        });
      }
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not create the reset link.') });
    }
    setBusy(false);
  };

  const change = (user, changes, doneMessage) => async () => {
    setBusy(true);
    try {
      await adminUserService.update(user.id, changes);
      addToast({ type: 'success', message: doneMessage });
      await load();
    } catch (error) {
      addToast({ type: 'error', message: getErrorMessage(error, 'Could not update the account.') });
    }
    setBusy(false);
    setConfirm(null);
  };

  const askRole = (user, role) => setConfirm({
    title: role === 'customer' ? 'Remove admin access' : `Make ${ROLE_LABELS[role].toLowerCase()}`,
    message: role === 'customer'
      ? `${user.name} will lose access to the dashboard and be signed out. Their customer account stays.`
      : role === 'superadmin'
        ? `${user.name} will be able to add, remove and disable admins, including you. Only do this for someone you fully trust.`
        : `${user.name} will no longer be able to manage admin accounts.`,
    label: 'Confirm',
    variant: role === 'customer' ? 'danger' : 'primary',
    run: change(user, { role }, `${user.name} is now ${role === 'customer' ? 'a customer' : ROLE_LABELS[role].toLowerCase()}`),
  });

  const askActive = (user, isActive) => setConfirm({
    title: isActive ? 'Enable account' : 'Disable account',
    message: isActive
      ? `${user.name} will be able to sign in again.`
      : `${user.name} will be signed out immediately and cannot sign in until you enable the account again.`,
    label: isActive ? 'Enable' : 'Disable',
    variant: isActive ? 'primary' : 'danger',
    run: change(user, { isActive }, `${user.name} has been ${isActive ? 'enabled' : 'disabled'}`),
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkInfo.link);
      addToast({ type: 'success', message: 'Link copied' });
    } catch {
      addToast({ type: 'error', message: 'Could not copy. Select the link and copy it by hand.' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Admin Users</h1>
          <p className="text-sm text-neutral-500 mt-1">
            People who can open this dashboard. New admins get an email link to set their own password.
          </p>
        </div>
        <Button onClick={() => { setInviteErrors({}); setInviteOpen(true); }}>
          <UserPlus size={16} className="mr-2" /> Add Admin
        </Button>
      </div>

      <div className="bg-white border border-neutral-100 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-100">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Last sign-in</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isMe = user.id === me?.id;
              return (
                <tr key={user.id} className="border-b border-neutral-50 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">
                      {user.name} {isMe && <span className="text-xs text-neutral-400 font-normal">(you)</span>}
                    </div>
                    <div className="text-neutral-500 break-all">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={user.role === 'superadmin' ? 'primary' : 'info'}>{ROLE_LABELS[user.role] || user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={user.isActive ? 'success' : 'error'}>{user.isActive ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell whitespace-nowrap">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {isMe ? (
                      <p className="text-xs text-neutral-400 text-right">Change your own password under My Account.</p>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.isActive && (
                          <Button size="sm" variant="outline" onClick={() => sendReset(user)} disabled={busy} title="Email a link to set a new password">
                            <KeyRound size={14} /> Reset password
                          </Button>
                        )}
                        {user.role === 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => askRole(user, 'superadmin')} disabled={busy}>Make root admin</Button>
                        )}
                        {user.role === 'superadmin' && (
                          <Button size="sm" variant="outline" onClick={() => askRole(user, 'admin')} disabled={busy}>Make admin</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => askActive(user, !user.isActive)} disabled={busy}>
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => askRole(user, 'customer')} disabled={busy}>
                          Remove access
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Add Admin">
        <form onSubmit={submitInvite} className="space-y-4" noValidate>
          <Input label="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} error={inviteErrors.name} />
          <Input label="Email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} error={inviteErrors.email} />
          <Select
            label="Access"
            placeholder=""
            options={ROLE_OPTIONS}
            value={invite.role}
            onChange={(e) => setInvite({ ...invite, role: e.target.value })}
            error={inviteErrors.role}
          />
          <p className="text-xs text-neutral-500">
            If this email already has a customer account, it is given admin access and keeps its password.
            Otherwise we email them a link to set a password. You never need to know or share their password.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
            <Button type="submit" isLoading={inviting}>Add Admin</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!linkInfo} onClose={() => setLinkInfo(null)} title={linkInfo?.title}>
        <p className="text-sm text-neutral-600">{linkInfo?.text}</p>
        {linkInfo?.link ? (
          <div className="mt-4 flex gap-2">
            <input readOnly value={linkInfo.link} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-neutral-50" />
            <Button size="sm" onClick={copyLink}><Copy size={14} /> Copy</Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-red-600">No link was created: set app.frontend_url in api/config.php on the server.</p>
        )}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setLinkInfo(null)}>Done</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.run()}
        isLoading={busy}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        variant={confirm?.variant}
      />
    </div>
  );
}
