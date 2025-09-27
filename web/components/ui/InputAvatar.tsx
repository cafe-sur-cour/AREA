'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { getBackendUrl } from '@/lib/config';
import { Pencil } from 'lucide-react';

interface InputAvatar {
  url?: string;
  defaultChar: string;
  size?: number;
  variente?: 'normal' | 'modifiable';
  onChange?: (url: string) => void;
}

interface IDAvatarProps {
  id: number;
  size?: number;
  className?: string;
}

export function IDAvatar(props: IDAvatarProps) {
  const [img, setImg] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [backendUrl, setBackendUrl] = useState<string | undefined>('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<{ name: string; userImage: string }>({
          endpoint: `/users/img_name/${props.id}`,
        });
        if (res.data?.userImage) setImg(res.data.userImage);
        if (res.data?.name) setName(res.data.name);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    const fetchBackendUrl = async () => {
      setBackendUrl(await getBackendUrl());
    };

    fetchUser();
    fetchBackendUrl();
  }, [props.id]);

  return (
    <Avatar className={`h-${props.size} w-${props.size} ${props.className}`}>
      <AvatarImage src={img ? `${backendUrl}${img}` : undefined} />
      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function InputAvatar(props: InputAvatar) {
  const [img, setImgUrl] = useState<string>(props.url ?? '');
  const [backendUrl, setBackendUrl] = useState<string | undefined>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.url && props.url !== 'NONE') {
      setImgUrl(props.url);
    }
  }, [props.url]);

  useEffect(() => {
    const fetchBackendUrl = async () => {
      setBackendUrl(await getBackendUrl());
    };
    fetchBackendUrl();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const res = await api.post<{ url: string }>('/media/upload/', {
          url: base64String,
        });
        if (res.data?.url) {
          setImgUrl(res.data.url);
          props.onChange?.(res.data.url);
        } else {
          throw new Error("API didn't return an avatar url image");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  if (props.variente === 'modifiable') {
    return (
      <div className='relative inline-block'>
        <Input
          type='file'
          className='hidden'
          ref={fileInputRef}
          accept='image/*'
          onChange={handleFileChange}
        />
        <Button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className={`h-${props.size} w-${props.size} cursor-pointer p-0 rounded-full border border-gray-300 relative`}
          variant='ghost'
        >
          <Avatar className={`h-${props.size} w-${props.size}`}>
            <AvatarImage src={img ? `${backendUrl}${img}` : undefined} />
            <AvatarFallback>{props.defaultChar.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className='absolute bottom-1 right-1 p-1 bg-gray-200 rounded-full flex items-center justify-center'>
            <Pencil className='h-4 w-4 text-gray-700' />
          </span>
        </Button>
      </div>
    );
  }

  return (
    <Avatar className={`h-${props.size} w-${props.size}`}>
      <AvatarImage src={img ? `${backendUrl}${img}` : undefined} />
      <AvatarFallback>{props.defaultChar.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
