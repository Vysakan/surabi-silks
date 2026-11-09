const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export async function getAll() {
  await delay();
  return [];
}

export async function add() {
  await delay();
  return [];
}

export async function remove() {
  await delay();
  return true;
}
