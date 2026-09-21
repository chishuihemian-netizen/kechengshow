(function () {
  "use strict";

  const apiBase = String(window.VOTE_API_BASE || "").replace(/\/$/, "");
  const voteButton = document.getElementById("vote");
  const scoreLabel = document.getElementById("score");
  const modal = document.getElementById("modal");
  let requestNumber = 0;

  if (!apiBase) {
    voteButton.disabled = true;
    voteButton.textContent = "投票尚未启用 · Voting not yet available";
    scoreLabel.textContent = "";
    // Prevent the legacy local-only counters from appearing when works change.
    U = function () {
      voteButton.textContent = "投票尚未启用 · Voting not yet available";
      scoreLabel.textContent = "";
    };
    return;
  }

  let visitorId = localStorage.getItem("exhibition-voter-id");
  if (!visitorId || !/^[0-9a-f-]{36}$/.test(visitorId)) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("exhibition-voter-id", visitorId);
  }

  function currentWorkId() { return `${g}-${i}`; }
  function paint(data) {
    const count = Number(data.count) || 0;
    scoreLabel.textContent = `${count} 票 · ${count} votes (全站)`;
    voteButton.textContent = data.voted ? "♥ 已投票 · Voted" : "♡ 投票 · Vote";
    voteButton.disabled = Boolean(data.voted);
  }

  async function refresh() {
    const sequence = ++requestNumber;
    const workId = currentWorkId();
    voteButton.disabled = true;
    voteButton.textContent = "载入票数 · Loading votes";
    scoreLabel.textContent = "";
    try {
      const url = `${apiBase}/votes?work=${encodeURIComponent(workId)}&voter=${encodeURIComponent(visitorId)}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (sequence === requestNumber && workId === currentWorkId()) paint(data);
    } catch (error) {
      if (sequence === requestNumber) {
        voteButton.disabled = true;
        voteButton.textContent = "暂时无法投票 · Voting unavailable";
        scoreLabel.textContent = "";
      }
      console.warn("Unable to load exhibition votes:", error);
    }
  }

  // The existing gallery calls U() whenever a work is opened or paged.
  U = refresh;
  voteButton.onclick = async function () {
    if (voteButton.disabled) return;
    const workId = currentWorkId();
    voteButton.disabled = true;
    voteButton.textContent = "提交中 · Submitting";
    try {
      const response = await fetch(`${apiBase}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work: workId, voter: visitorId })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (workId === currentWorkId()) paint(data);
    } catch (error) {
      voteButton.textContent = "提交失败 · Try again";
      voteButton.disabled = false;
      console.warn("Unable to submit exhibition vote:", error);
    }
  };

  // A fresh server count is shown every time the modal is reopened.
  const observer = new MutationObserver(() => {
    if (modal.classList.contains("on")) refresh();
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
})();
