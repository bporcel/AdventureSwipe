const API_URL = 'https://adventureswipe.onrender.com'
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || API_URL

function stripImages(node) {
  const { image, ...rest } = node;
  return rest;
}

export async function generateNextNode({ currentNode, choice, history, depth }) {
  const payload = {
    currentNode: stripImages(currentNode),
    choice,
    history: history.map(n => stripImages(n)),
    depth
  };

  const res = await fetch(`${API_HOST}/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Network error");

  return await res.json();
}

export async function generateNewGameNode() {
  const res = await fetch(`${API_HOST}/new-game`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Network error");

  return await res.json();
}
