const API_URL = 'https://adventureswipe.onrender.com'

export async function generateNextNode({ currentNode, choice, history }) {
    const res = await fetch(`${API_URL}/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentNode, choice, history }),
    });

    if (!res.ok) throw new Error("Network error");
    
    return await res.json();
  }