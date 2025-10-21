import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  let email = `user${__VU}_${Date.now()}@test.com`;
  let payload = JSON.stringify({
    email: email,
    password: "Password123!",
    name: `User ${__VU}`
  });

  let headers = { "Content-Type": "application/json" };

  let res = http.post("https://yourapp.com/api/auth/register", payload, { headers });

  check(res, {
    "status 200": (r) => r.status === 200 || r.status === 201,
    "has token": (r) => r.json().token !== undefined,
  });

  sleep(1);
}

