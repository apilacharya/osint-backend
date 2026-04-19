import axios from "axios";
export const osintHttpClient = axios.create({
    timeout: 10_000,
    headers: {
        "User-Agent": "OSINT-Prototype/1.0 (+https://example.local)"
    }
});
