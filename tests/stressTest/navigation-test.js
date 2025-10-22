import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 300 },
    { duration: '1m', target: 0 },
  ],
};

const pages = [
  'https://frontend.nduboi.fr/',
  'https://frontend.nduboi.fr/catalogue',
  'https://frontend.nduboi.fr/login',
  'https://frontend.nduboi.fr/register',
];

export default function () {
  for (let i = 0; i < 6; i++) {
    const page = pages[Math.floor(Math.random() * pages.length)];
    http.get(page);
    sleep(Math.random() * 2 + 1);
  }
}
