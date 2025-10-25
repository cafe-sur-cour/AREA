'use client';

import Navigation from '@/components/header';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TbLoader3 } from 'react-icons/tb';
import { Card, CardContent } from '@/components/ui/card';
import { InputAvatar } from '@/components/ui/InputAvatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, UserRound, Key, Pencil, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [userData, setUserData] = useState<User | undefined>();
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editingPassword, setEditingPassword] = useState(false);
  const [editedPassword, setEditedPassword] = useState('');
  const [isLoadingData, setIsLoading] = useState<boolean>(false);
  const isInitializedRef = useRef(false);

  const fetchMe = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<User>({ endpoint: '/user/me' });
      if (res.data) setUserData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchMe();
    }
  }, []);

  useEffect(() => {
    if (!user && !isLoading) router.push('/');
  }, [user, isLoading, router]);

  const editAndFetchMe = async (dataToSend?: User) => {
    try {
      const data = dataToSend || userData;
      if (!data) return;

      const res = await api.put<User>('/user/me', {
        name: data.name,
        email: data.email,
        password: data.password,
        picture: data.picture,
      });
      if (res.data) {
        console.log('DATASEND:', data);
        console.log('Modify: ', res.data);
        setUserData(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAvatarChange = (newUrl: string) => {
    if (userData) {
      const updatedData = { ...userData, userImage: newUrl };
      setUserData(updatedData);
      editAndFetchMe(updatedData);
    }
  };

  const startEditingName = () => {
    if (userData) {
      setEditedName(userData.name);
      setEditingName(true);
    }
  };

  const startEditingPassword = () => {
    setEditingPassword(true);
    setEditedPassword('');
  };

  const saveName = () => {
    console.log('Saving name:', editedName);
    if (editedName.trim() === '') {
      toast.error(t.profile.nameEmpty);
      return;
    }
    if (userData) {
      if (userData.name === editedName) {
        setEditingName(false);
        return;
      }
      const updatedData = { ...userData, name: editedName };
      setUserData(updatedData);
      editAndFetchMe(updatedData);
      fetchMe();
    }
    setEditingName(false);
  };

  const savePassword = () => {
    console.log('Saving password:', editedPassword);
    if (editedPassword.trim() === '') {
      toast.error(t.profile.passwordEmpty);
      return;
    }
    if (userData) {
      if (userData.password === editedPassword) {
        setEditingPassword(false);
        return;
      }
      const updatedData = { ...userData, password: editedPassword };
      setUserData(updatedData);
      editAndFetchMe(updatedData);
      fetchMe();
    }
    setEditingPassword(false);
  };

  const cancelNameEdit = () => {
    setEditingName(false);
    setEditedName('');
  };

  const cancelPasswordEdit = () => {
    setEditingPassword(false);
    setEditedPassword('');
  };

  if (isLoadingData || !userData)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <TbLoader3 className='size-12 animate-spin text-jeb-primary mb-4' />
          <p className='mt-4 text-gray-600'>{t.profile.loading}</p>
        </div>
      </div>
    );

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-jeb-gradient-from to-jeb-gradient-to/50 flex flex-col'>
        <Navigation />

        <main className='flex-1 py-6 flex items-center justify-center'>
          <div className='max-w-7xl w-full px-4 sm:px-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Profile Avatar Card with Welcome */}
              <Card className='md:col-span-1 place-self-center'>
                <CardContent className='p-6 flex flex-col items-center gap-6'>
                  <h1 className='font-heading text-4xl font-bold text-app-text-primary text-center'>
                    {t.profile.welcome} {userData?.name ?? 'NONE'}
                  </h1>
                  <InputAvatar
                    url={userData?.picture}
                    defaultChar={userData.name.charAt(0)}
                    size={20}
                    variente='modifiable'
                    onChange={handleAvatarChange}
                  />
                  <p className='text-sm text-app-text-secondary text-center'>
                    {t.profile.avatarHint}
                  </p>
                </CardContent>
              </Card>

              {/* User Info Cards */}
              <div className='space-y-4'>
                {/* Name Card */}
                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-3'>
                      <div className='p-3 bg-app-green-light rounded-lg'>
                        <UserRound className='h-6 w-6 text-app-green-primary' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-app-text-secondary'>
                          {t.profile.name}
                        </p>
                        {editingName ? (
                          <div className='flex items-center gap-2 mt-1'>
                            <Input
                              value={editedName}
                              onChange={e => setEditedName(e.target.value)}
                              className='flex-1'
                              placeholder={t.profile.namePlaceholder}
                            />
                            <Button
                              size='sm'
                              onClick={saveName}
                              className='p-2 h-8 w-8 cursor-pointer'
                              variant='ghost'
                            >
                              <Check className='h-4 w-4 text-green-600' />
                            </Button>
                            <Button
                              size='sm'
                              onClick={cancelNameEdit}
                              className='p-2 h-8 w-8 cursor-pointer'
                              variant='ghost'
                            >
                              <X className='h-4 w-4 text-red-600' />
                            </Button>
                          </div>
                        ) : (
                          <div className='flex items-center justify-between'>
                            <p className='text-lg font-bold text-app-text-primary'>
                              {userData?.name ?? 'NONE'}
                            </p>
                            <Button
                              size='sm'
                              onClick={startEditingName}
                              className='p-2 h-8 w-8 cursor-pointer'
                              variant='ghost'
                            >
                              <Pencil className='h-4 w-4 text-app-text-secondary' />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Password Card */}
                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-3'>
                      <div className='p-3 bg-app-green-light rounded-lg'>
                        <Key className='h-6 w-6 text-app-green-primary' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-app-text-secondary'>
                          {t.profile.password}
                        </p>
                        {editingPassword ? (
                          <div className='flex items-center gap-2 mt-1'>
                            <Input
                              value={editedPassword}
                              onChange={e => setEditedPassword(e.target.value)}
                              className='flex-1'
                              placeholder={t.profile.passwordPlaceholder}
                            />
                            <Button
                              size='sm'
                              onClick={savePassword}
                              className='p-2 h-8 w-8 cursor-pointer'
                              variant='ghost'
                            >
                              <Check className='h-4 w-4 text-green-600' />
                            </Button>
                            <Button
                              size='sm'
                              onClick={cancelPasswordEdit}
                              className='p-2 h-8 w-8 cursor-pointer'
                              variant='ghost'
                            >
                              <X className='h-4 w-4 text-red-600' />
                            </Button>
                          </div>
                        ) : (
                          <div className='flex items-center justify-between'>
                            <p className='text-lg font-bold text-app-text-primary'>
                              {'•••••••••'}
                            </p>
                            <Button
                              size='sm'
                              onClick={startEditingPassword}
                              className='p-2 h-8 w-8 cursor-pointer'
                              variant='ghost'
                            >
                              <Pencil className='h-4 w-4 text-app-text-secondary' />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Card */}
                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-3'>
                      <div className='p-3 bg-app-blue-light rounded-lg'>
                        <Mail className='h-6 w-6 text-app-blue-primary' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-app-text-secondary'>
                          {t.profile.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
