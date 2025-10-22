import http from "k6/http";
import { sleep, check } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "2m", target: 500 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  // login
  let loginRes = http.post("https://backend.nduboi.fr/api/auth/login", JSON.stringify({
    email: `alice@example.com`,
    password: "123456"
  }), { headers: { "Content-Type": "application/json" }});

  check(loginRes, { "login success": (r) => r.status === 200 });

  let dashRes = http.get("https://frontend.nduboi.fr", {
    headers: { Authorization: `Bearer ${loginRes.json().token}` }
  });

  check(dashRes, { "dashboard success": (r) => r.status === 200 });

  sleep(1);
}
