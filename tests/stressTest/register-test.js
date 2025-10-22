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
  let email = `user${__VU}_${Date.now()}@test.com.com`;

  let payload = JSON.stringify({
    email: email,
    name: `User ${__VU}`,
    password: "Password123!",
  });

  let headers = { "Content-Type": "application/json" };

  let res = http.post("https://backend.nduboi.fr/api/auth/register", payload, { headers });

  check(res, {
    "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
  });
  sleep(1);
}
