const WORK_SIZES = [16, 14, 12, 8];

function validWork(work) {
  const match = /^([0-3])-([0-9])$/.exec(work || "");
  return Boolean(match && Number(match[2]) < WORK_SIZES[Number(match[1])]);
}

function validVoter(voter) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(voter || "");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = env.SITE_ORIGIN;
    const headers = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    };
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed || origin !== allowed) return reply({ error: "Origin not allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname !== "/votes") return reply({ error: "Not found" }, 404);
    try {
      let work, voter;
      if (request.method === "GET") {
        work = url.searchParams.get("work");
        voter = url.searchParams.get("voter");
      } else if (request.method === "POST") {
        if (Number(request.headers.get("Content-Length") || 0) > 1024) return reply({ error: "Body too large" }, 413);
        const body = await request.json();
        work = body.work;
        voter = body.voter;
      } else return reply({ error: "Method not allowed" }, 405);

      if (!validWork(work) || !validVoter(voter)) return reply({ error: "Invalid vote" }, 400);
      if (request.method === "POST") {
        await env.DB.prepare("INSERT OR IGNORE INTO votes (work_id, voter_id) VALUES (?, ?)")
          .bind(work, voter).run();
      }
      const [total, alreadyVoted] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS count FROM votes WHERE work_id = ?").bind(work).first(),
        env.DB.prepare("SELECT 1 AS voted FROM votes WHERE work_id = ? AND voter_id = ?").bind(work, voter).first()
      ]);
      return reply({ work, count: Number(total?.count || 0), voted: Boolean(alreadyVoted) });
    } catch (error) {
      console.error("Vote API error", error);
      return reply({ error: "Unable to process vote" }, 500);
    }
  }
};
