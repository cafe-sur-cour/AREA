import { Button } from '@/components/ui/button';
import Navigation from '@/components/header';

export default function Home() {
  return (
    <>
      <Navigation />
      <h1 className='text-3xl font-heading'>Hello, Area!</h1>
      <Button className='text-xl font-sans hover:underline'>Click me</Button>
    </>
  );
}
