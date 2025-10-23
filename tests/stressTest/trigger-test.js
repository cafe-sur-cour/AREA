import http from "k6/http";
import { sleep } from "k6";

export let options = {
  stages: [
    { duration: "20s", target: 100 },
    { duration: "1m", target: 1000 },
    { duration: "20s", target: 0 },
  ],
};

export default function () {
  http.post("https://yourapp.com/api/webhooks/trigger", JSON.stringify({
    event: "user_created",
    payload: { id: __VU, name: "User Load Test" }
  }), { headers: { "Content-Type": "application/json" }});
  sleep(0.5);
}
