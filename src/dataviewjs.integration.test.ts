import https from "https";

const API_KEY = process.env.OBSIDIAN_API_KEY;
const BASE_URL = process.env.OBSIDIAN_BASE_URL ?? "https://127.0.0.1:27124/";
const VIEW_PATH =
  "02_Core/Journey_Map/_EXAMPLES/views/signal_source_flow_dashboard";
const VIEW_SCRIPT = `await dv.view("${VIEW_PATH}");`;
const DEFAULT_TIMEOUT = Number(process.env.OBSIDIAN_HTTP_TIMEOUT ?? 15000);

const describeIf = API_KEY ? describe : describe.skip;

describeIf("DataviewJS endpoint (live server)", () => {
  const agent = new https.Agent({ rejectUnauthorized: false });

  jest.setTimeout(DEFAULT_TIMEOUT * 2);

  test("renders Signal Source Flow dashboard view", async () => {
    const response = await requestJson("/dataviewjs/", {
      code: VIEW_SCRIPT,
    });

    // eslint-disable-next-line no-console
    console.log("/dataviewjs response", JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
    expect(response.body?.source).toEqual({ type: "code" });

    const html = response.body?.html;
    expect(typeof html).toBe("string");
    expect(html).not.toBeUndefined();

    const text = response.body?.text;
    expect(typeof text).toBe("string");

    expect(Array.isArray(response.body?.blocks ?? [])).toBe(true);
  });

  test("evaluates inline dv.list snippet", async () => {
    const response = await requestJson("/dataviewjs/", {
      code: "dv.list([1, 2, 3])",
    });

    console.log(
      "/dataviewjs response (code)",
      JSON.stringify(response.body, null, 2)
    );

    expect(response.status).toBe(200);
    expect(response.body?.source).toEqual({ type: "code" });

    const html = response.body?.html ?? "";
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain("<ul");

    expect(response.body?.text).toBe("123");
    expect(Array.isArray(response.body?.blocks ?? [])).toBe(true);
    expect(response.body?.blocks?.[0]?.html ?? "").toContain("<li>1</li>");
  });

  function requestJson(path: string, body: Record<string, unknown>) {
    return new Promise<{ status: number; body: any }>((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const payload = JSON.stringify(body);

      const req = https.request(
        {
          method: "POST",
          host: url.hostname,
          path: url.pathname + url.search,
          port: url.port,
          protocol: url.protocol,
          agent,
          timeout: DEFAULT_TIMEOUT,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            Authorization: `Bearer ${API_KEY}`,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            let parsed: any = raw;
            try {
              parsed = raw ? JSON.parse(raw) : {};
            } catch (error) {
              return reject(
                new Error(
                  `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)
                  }`
                )
              );
            }
            resolve({ status: res.statusCode ?? 0, body: parsed });
          });
        }
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error(`Request timed out after ${DEFAULT_TIMEOUT}ms`));
      });

      req.write(payload);
      req.end();
    });
  }
});

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "Skipping DataviewJS integration tests. Set OBSIDIAN_API_KEY to enable them."
  );
}
