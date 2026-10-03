import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import {
  UserPlus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export const UserManagementView = ({ currentUser }) => {
  const [users, setUsers] = useState(() => StorageService.getRegisteredUsers());
  const [isAdding, setIsAdding] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [msg, setMsg] = useState(null);

  const refreshList = () => {
    setUsers(StorageService.getRegisteredUsers());
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    setMsg(null);

    const res = StorageService.registerUser(name, email, password, role);
    if (!res.success) {
      setMsg(`Error: ${res.error}`);
      return;
    }

    refreshList();
    setIsAdding(false);
    setName('');
    setEmail('');
    setPassword('');
    setMsg(`Account for "${res.user?.name}" created successfully!`);
    setTimeout(() => setMsg(null), 3500);
  };

  const handleDeleteUser = (id, userName) => {
    if (confirm(`Remove access for ${userName}?`)) {
      StorageService.deleteRegisteredUser(id);
      refreshList();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold mb-1">
            <span>Access Control</span>
            <span aria-hidden="true">·</span>
            <span>Team & Roles</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Team & User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage who can log in to the portal, generate receipts, and access donation ledgers.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? 'Close Form' : '+ Add New Team Member'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Add User Modal / Box */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Register New Staff / Admin Account
            </h3>
            <span className="text-[11px] text-slate-400">Team Member Access</span>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address (Login ID)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@kulshresthawf.org"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role & Permissions</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="admin">Administrator (Settings & Reports Access)</option>
                <option value="staff">Staff (Create Receipts & View Ledger)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Registered Users ({users.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Credentials stored securely for portal access
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold text-[11px]">Active</td>
                  <td className="py-3 px-4 text-right">
                    {u.id !== currentUser?.id && users.length > 1 && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
