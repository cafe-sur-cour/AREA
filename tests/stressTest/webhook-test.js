import http from "k6/http";
import { sleep } from "k6";

export let options = {
  vus: 500,
  duration: "1m",
};

export default function () {
  http.post("https://backend.nduboi.fr/webhooks/github", JSON.stringify({
    name: `Webhook-${__VU}-${Date.now()}`,
    event: "new_data",
    target_url: "https://github.com/receive"
  }), { headers: { "Content-Type": "application/json" }});
  sleep(1);
}
