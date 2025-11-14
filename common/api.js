export async function generateNextNode({ currentNode, choice, history }) {
    const res = await fetch("http://192.168.0.20:5000/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentNode, choice, history }),
    });

    if (!res.ok) throw new Error("Network error");
    
    return await res.json();
  }