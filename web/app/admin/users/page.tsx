'use client';

import { useState, useEffect } from 'react';
import Navigation from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Edit2, Trash2, Search, ChevronLeft, Loader } from "lucide-react";
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  email_verified: boolean;
  picture: string | null;
  bio: string | null;
  timezone: string;
  language: string;
  theme: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<User[]>({
        endpoint: '/user',
      });
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({ ...user });
  };

  const handleSave = async () => {
    if (editingId && editData.name && editData.email) {
      try {
        const updatePayload = {
          name: editData.name,
          email: editData.email,
          is_admin: editData.is_admin ?? false,
          is_active: editData.is_active ?? true,
          timezone: editData.timezone || 'UTC',
          language: editData.language || 'en',
          theme: editData.theme || 'light',
        };

        await api.put(`/user/${editingId}`, updatePayload);

        setUsers(users.map(u => u.id === editingId ? { ...u, ...editData } : u));
        setEditingId(null);
        setEditData({});
      } catch (err) {
        console.error('Failed to update user:', err);
        setError('Failed to update user');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/user/${id}`);

        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        console.error('Failed to delete user:', err);
        setError('Failed to delete user');
      }
    }
  };

  const handleAdd = async () => {
    if (editData.name && editData.email) {
      try {
        const createPayload = {
          name: editData.name,
          email: editData.email,
          is_admin: editData.is_admin ?? false,
          is_active: editData.is_active ?? true,
        };

        const response = await api.post<User>('/users', createPayload);

        if (response.data) {
          setUsers([...users, response.data]);
        }
        setShowAddForm(false);
        setEditData({});
      } catch (err) {
        console.error('Failed to create user:', err);
        setError('Failed to create user');
      }
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700';
  };

  const getRoleColor = (isAdmin: boolean) => {
    return isAdmin ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-700';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-app-background'>
        <Navigation />
        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center'>
          <Loader className='w-8 h-8 animate-spin text-primary' />
        </main>
      </div>
    );
  }

  console.log("Rendered with users: ", users);
  console.log("Rendered with Filteredusers: ", filteredUsers);

  return (
    <div className='min-h-screen bg-app-background'>
      <Navigation />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link href="/admin" className='inline-block mb-4'>
            <Button variant='ghost' size='sm' className='gap-2'>
              <ChevronLeft className='w-4 h-4' />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className='font-heading text-4xl font-bold text-app-text-primary mb-2'>
            Users Management
          </h1>
          <p className='text-app-text-secondary'>Manage application users and their permissions</p>
        </div>

        {/* Add User Button */}
        <div className='mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
          <div className='w-full sm:w-auto flex-1 sm:flex-initial'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-app-text-secondary' />
              <input
                type='text'
                placeholder='Search users...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-app-border-light rounded-lg bg-app-surface text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className='w-full sm:w-auto gap-2'
          >
            <Plus className='w-4 h-4' />
            Add User
          </Button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <Card className='bg-app-surface border-app-border-light mb-8'>
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <input
                  type='text'
                  placeholder='Name'
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className='px-4 py-2 border border-app-border-light rounded-lg bg-app-background text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary'
                />
                <input
                  type='email'
                  placeholder='Email'
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className='px-4 py-2 border border-app-border-light rounded-lg bg-app-background text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary'
                />
              </div>
              <div className='flex gap-2 mt-4'>
                <Button onClick={handleAdd} className='flex-1'>
                  Create User
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditData({});
                  }}
                  variant='outline'
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table - Desktop View */}
        <div className='hidden md:block'>
          <Card className='bg-app-surface border-app-border-light'>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-app-border-light'>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Name</th>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Email</th>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Role</th>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Status</th>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Email Verified</th>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Join Date</th>
                      <th className='text-left px-6 py-4 text-sm font-semibold text-app-text-primary'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className='border-b border-app-border-light hover:bg-app-background transition-colors'>
                        <td className='px-6 py-4'>
                          {editingId === user.id ? (
                            <input
                              type='text'
                              value={editData.name || ''}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className='px-2 py-1 border border-app-border-light rounded bg-app-background text-app-text-primary w-full'
                            />
                          ) : (
                            <span className='text-sm font-medium text-app-text-primary'>{user.name}</span>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          {editingId === user.id ? (
                            <input
                              type='email'
                              value={editData.email || ''}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              className='px-2 py-1 border border-app-border-light rounded bg-app-background text-app-text-primary w-full'
                            />
                          ) : (
                            <span className='text-sm text-app-text-secondary'>{user.email}</span>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <Badge className={getRoleColor(user.is_admin)} variant='outline'>
                            {user.is_admin ? 'Admin' : 'User'}
                          </Badge>
                        </td>
                        <td className='px-6 py-4'>
                          <Badge className={getStatusColor(user.is_active)} variant='outline'>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className='px-6 py-4'>
                          <Badge className={getStatusColor(user.email_verified)} variant='outline'>
                            {user.email_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm text-app-text-secondary'>{formatDate(user.created_at)}</span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex gap-2'>
                            {editingId === user.id ? (
                              <>
                                <Button onClick={handleSave} size='sm' variant='outline'>
                                  Save
                                </Button>
                                <Button
                                  onClick={() => setEditingId(null)}
                                  size='sm'
                                  variant='outline'
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleEdit(user)}
                                  size='sm'
                                  variant='ghost'
                                  className='text-blue-500 hover:text-blue-600'
                                >
                                  <Edit2 className='w-4 h-4' />
                                </Button>
                                <Button
                                  onClick={() => handleDelete(user.id)}
                                  size='sm'
                                  variant='ghost'
                                  className='text-red-500 hover:text-red-600'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Cards - Mobile View */}
        <div className='md:hidden space-y-4'>
          {filteredUsers.map((user) => (
            <Card key={user.id} className='bg-app-surface border-app-border-light'>
              <CardContent className='p-4'>
                <div className='space-y-3'>
                  {editingId === user.id ? (
                    <>
                      <input
                        type='text'
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className='px-3 py-2 border border-app-border-light rounded bg-app-background text-app-text-primary w-full text-sm'
                        placeholder='Name'
                      />
                      <input
                        type='email'
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className='px-3 py-2 border border-app-border-light rounded bg-app-background text-app-text-primary w-full text-sm'
                        placeholder='Email'
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <p className='text-sm font-medium text-app-text-primary'>{user.name}</p>
                        <p className='text-xs text-app-text-secondary'>{user.email}</p>
                      </div>
                      <div className='flex gap-2 flex-wrap'>
                        <Badge className={`${getRoleColor(user.is_admin)} text-xs`} variant='outline'>
                          {user.is_admin ? 'Admin' : 'User'}
                        </Badge>
                        <Badge className={`${getStatusColor(user.is_active)} text-xs`} variant='outline'>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className={`${getStatusColor(user.email_verified)} text-xs`} variant='outline'>
                          {user.email_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      <div className='text-xs text-app-text-secondary'>
                        <p>Joined: {formatDate(user.created_at)}</p>
                        <p>Last login: {formatDate(user.last_login_at)}</p>
                      </div>
                    </>
                  )}
                  <div className='flex gap-2 pt-2'>
                    {editingId === user.id ? (
                      <>
                        <Button onClick={handleSave} size='sm' variant='outline' className='flex-1'>
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          size='sm'
                          variant='outline'
                          className='flex-1'
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleEdit(user)}
                          size='sm'
                          variant='ghost'
                          className='flex-1 text-blue-500'
                        >
                          <Edit2 className='w-4 h-4 mr-1' />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(user.id)}
                          size='sm'
                          variant='ghost'
                          className='flex-1 text-red-500'
                        >
                          <Trash2 className='w-4 h-4 mr-1' />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <Card className='bg-app-surface border-app-border-light'>
            <CardContent className='py-12 text-center'>
              <p className='text-app-text-secondary mb-4'>No users found</p>
              <Button onClick={() => setSearchTerm('')} variant='outline'>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-8'>
          <Card className='bg-app-surface border-app-border-light'>
            <CardContent className='p-6'>
              <p className='text-sm text-app-text-secondary mb-2'>Total Users</p>
              <p className='text-2xl font-bold text-app-text-primary'>{users.length}</p>
            </CardContent>
          </Card>
          <Card className='bg-app-surface border-app-border-light'>
            <CardContent className='p-6'>
              <p className='text-sm text-app-text-secondary mb-2'>Active Users</p>
              <p className='text-2xl font-bold text-app-text-primary'>{users.filter(u => u.is_active).length}</p>
            </CardContent>
          </Card>
          <Card className='bg-app-surface border-app-border-light'>
            <CardContent className='p-6'>
              <p className='text-sm text-app-text-secondary mb-2'>Admins</p>
              <p className='text-2xl font-bold text-app-text-primary'>{users.filter(u => u.is_admin).length}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}