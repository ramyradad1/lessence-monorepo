'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminUsers } from '@lessence/supabase';
import { Profile } from '@lessence/core';
import { Mail, Shield, User as UserIcon, Calendar, Loader2, Plus, Trash2, Edit2, X } from 'lucide-react';
import Image from 'next/image';

export default function AdminUsersPage() {
  const { users, loading, createUser, deleteUser, updateUser } = useAdminUsers(supabase);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as Profile['role']
  });

  const resetForm = () => {
    setForm({ email: '', password: '', full_name: '', role: 'user' });
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (editingUser) {
      const { success, error: err } = await updateUser(editingUser.id, {
        full_name: form.full_name,
        role: form.role
      });
      if (success) {
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(err);
      }
    } else {
      const { success, error: err } = await createUser(
        form.email,
        form.password,
        form.full_name,
        form.role as unknown as Parameters<typeof createUser>[3]
      );
      if (success) {
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(err);
      }
    }
    setSubmitting(false);
  };

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: '', // Password not editable
      full_name: user.full_name || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${email}?`)) return;
    const { success, error: err } = await deleteUser(userId);
    if (!success) alert(err);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#f4c025]" />
      </div>
    );
  }

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-fg-muted">Manage user accounts and permissions</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#f4c025] text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#f4c025]/90 transition-colors"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-fg-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f4c025]/10 flex items-center justify-center text-[#f4c025]">
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt="" width={40} height={40} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <UserIcon size={20} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.full_name || 'Anonymous User'}</div>
                        <div className="text-xs text-fg-muted flex items-center gap-1">
                          <Mail size={12} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'super_admin'
                        ? 'bg-[#f4c025] text-black'
                        : user.role !== 'user'
                          ? 'bg-[#f4c025]/10 text-[#f4c025]'
                          : 'bg-white/5 text-fg-muted'
                    }`}>
                      <Shield size={12} />
                      {user.role === 'super_admin' ? 'Super Admin' :
                        user.role === 'order_manager' ? 'Order Manager' :
                          user.role === 'inventory_manager' ? 'Inventory Manager' :
                            user.role === 'content_manager' ? 'Content Manager' :
                              user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-fg-muted">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        title="Edit User"
                        className="p-2 text-fg-muted hover:text-[#f4c025] hover:bg-[#f4c025]/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        title="Delete User"
                        className="p-2 text-fg-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[#1e1b16] border border-white/10 w-full max-w-md rounded-2xl p-6 relative z-50 shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-fg-muted hover:text-white"
              title="Close modal"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-fg-muted mb-1 block uppercase tracking-wider">Full Name</label>
                <input 
                  title="Full Name"
                  required 
                  value={form.full_name} 
                  onChange={e => setForm({ ...form, full_name: e.target.value })} 
                  className={inputClass} 
                  placeholder="John Doe"
                />
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label className="text-xs text-fg-muted mb-1 block uppercase tracking-wider">Email Address</label>
                    <input 
                      title="Email Address"
                      type="email" 
                      required 
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })} 
                      className={inputClass} 
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-fg-muted mb-1 block uppercase tracking-wider">Initial Password</label>
                    <input 
                      title="Initial Password"
                      type="password" 
                      required={!editingUser} 
                      value={form.password} 
                      onChange={e => setForm({ ...form, password: e.target.value })} 
                      className={inputClass} 
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-fg-muted mb-1 block uppercase tracking-wider">Role</label>
                <select 
                  title="Role"
                  value={form.role} 
                  onChange={e => setForm({ ...form, role: e.target.value as Profile['role'] })} 
                  className={inputClass}
                >
                  <option value="user" className="bg-[#1e1b16]">Standard User</option>
                  <option value="super_admin" className="bg-[#1e1b16]">Super Admin</option>
                  <option value="order_manager" className="bg-[#1e1b16]">Order Manager</option>
                  <option value="inventory_manager" className="bg-[#1e1b16]">Inventory Manager</option>
                  <option value="content_manager" className="bg-[#1e1b16]">Content Manager</option>
                </select>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-[#f4c025] text-black h-12 rounded-xl font-bold hover:bg-[#f4c025]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
