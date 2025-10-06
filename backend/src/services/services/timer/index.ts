import type { Service } from '../../../types/service';
import { TimerScheduler } from './TimerScheduler';
import { timerActions } from './actions';
import { timerReactions } from './reactions';
import { getIconSvg } from '../../../utils/iconMapping';

const timerService: Service = {
  id: 'timer',
  name: 'Timer',
  description: 'Internal timer service for scheduled actions',
  version: '1.0.0',
  icon: getIconSvg('FaClock'),
  actions: timerActions,
  reactions: timerReactions,
};

export default timerService;

let scheduler: TimerScheduler | null = null;

export async function initialize(): Promise<void> {
  console.log('Initializing Timer service...');
  scheduler = new TimerScheduler();
  await scheduler.start();
  console.log('Timer service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Timer service...');
  if (scheduler) {
    await scheduler.stop();
    scheduler = null;
  }
  console.log('Timer service cleaned up');
}
