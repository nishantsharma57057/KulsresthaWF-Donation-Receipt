import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import {
  Clock,
  CheckCircle2,
  Shield,
  RotateCw,
  Users,
  Check,
  X,
  Trash2,
  Edit2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Lock,
  UserPlus
} from 'lucide-react';

export const UserAccessView = ({ currentUser }) => {
  const [users, setUsers] = useState(() => StorageService.getRegisteredUsers());

  // Edit / Change Password Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('staff');
  const [editStatus, setEditStatus] = useState('approved');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [modalError, setModalError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const refreshList = () => {
    setUsers(StorageService.getRegisteredUsers());
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    let active = true;
    StorageService.refreshRegisteredUsers().then(list => {
      if (active) setUsers(list);
    }).catch(() => { if (active) showToast('Could not load latest account requests. Please refresh.'); });
    return () => { active = false; };
  }, []);

  const handleApprove = async (id, name) => {
    try {
      await StorageService.approveUser(id);
      refreshList();
      showToast(`Approved access for ${name}`);
    } catch { showToast('Approval could not be saved. Please try again.'); }
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to permanently remove access for ${name}?`)) {
      StorageService.deleteRegisteredUser(id);
      refreshList();
      showToast(`Removed access for ${name}`);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditUsername(u.username || '');
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus(u.status || 'approved');
    setNewPassword('');
    setConfirmNewPassword('');
    setModalError(null);
  };

  const handleSaveUserEdits = (e) => {
    e.preventDefault();
    setModalError(null);

    if (!editingUser) return;

    if (!editName.trim()) {
      setModalError('Please enter a valid full name.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setModalError('Please enter a valid email address.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setModalError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setModalError('Passwords do not match.');
        return;
      }
    }

    const updates = {
      name: editName.trim(),
      username: editUsername.trim().toLowerCase(),
      email: editEmail.trim(),
      role: editRole,
      status: editStatus
    };

    if (newPassword.trim()) {
      updates.newPassword = newPassword.trim();
    }

    const res = StorageService.updateRegisteredUser(editingUser.id, updates);
    if (!res.success) {
      setModalError(res.error || 'Failed to update user.');
      return;
    }

    refreshList();
    setEditingUser(null);
    showToast(`Successfully updated details for ${editName}!`);
  };

  const awaitingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const mainAdminCount = users.filter((u) => u.status === 'main_admin').length || 1;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (currentUser?.role !== 'admin' || !['approved', 'main_admin'].includes(currentUser?.status)) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Only an approved administrator can manage user access.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-[#0e2a47] text-white px-4 py-2.5 rounded-xl shadow-lg border border-sky-400/30 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.16em] block">
            ACCESS CONTROL & TEAM MANAGEMENT
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            User access & permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve registered staff, change roles, edit details and update passwords.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Edit Own Profile Button */}
          {currentUser && (
            <button
              onClick={() => {
                const self = users.find((u) => u.id === currentUser.id || u.email === currentUser.email);
                if (self) openEditModal(self);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change my password / profile</span>
            </button>
          )}

          <button
            onClick={refreshList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Awaiting approval */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-amber-200 bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {awaitingCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Awaiting admin approval
            </div>
          </div>
        </div>

        {/* Card 2: Approved users */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {approvedCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Approved active members
            </div>
          </div>
        </div>

        {/* Card 3: Main administrator */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-sky-200 bg-sky-50 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {mainAdminCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Administrators
            </div>
          </div>
        </div>
      </div>

      {/* Registered accounts Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        
        {/* Card Top Title */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registered team accounts ({users.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click "Edit details / password" on any user to change their permission or reset credentials.
            </p>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        {/* Account List Items */}
        <div className="divide-y divide-slate-100">
          {users.map((u) => {
            const isMainAdmin = u.status === 'main_admin' || u.role === 'admin';
            const isPending = u.status === 'pending';

            return (
              <div
                key={u.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  {/* Initials Avatar */}
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    {getInitials(u.name)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {u.name}
                      </span>
                      {u.status === 'main_admin' ? (
                        <span className="bg-[#0e2a47] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Main admin
                        </span>
                      ) : u.role === 'admin' ? (
                        <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Admin
                        </span>
                      ) : isPending ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Pending approval
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          Staff
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      @{u.username || u.name.toLowerCase().replace(/\s+/g, '')} · {u.email}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Role: <strong className="capitalize text-slate-600">{u.role}</strong> · Status: <strong className="capitalize text-slate-600">{(u.status || 'approved').replace('_', ' ')}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Approve Access Button (If pending) */}
                  {isPending && (
                    <button
                      onClick={() => handleApprove(u.id, u.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve access</span>
                    </button>
                  )}

                  {/* Edit User & Change Password Button */}
                  <button
                    onClick={() => openEditModal(u)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>Edit details & password</span>
                  </button>

                  {/* Delete button (cannot delete sole main admin) */}
                  {u.status !== 'main_admin' && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      title="Remove access"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* EDIT USER / CHANGE PASSWORD MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Account & Password
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUserEdits} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {modalError}
                </div>
              )}

              {/* Full Name & Username */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Role & Status (Permissions) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Role & Permission
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="staff">Staff (Standard Receipts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending review</option>
                    <option value="main_admin">Main Administrator</option>
                  </select>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">
                  Change Password (Optional)
                </span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Leave these blank if you do not want to change the current password.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save changes & update
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
