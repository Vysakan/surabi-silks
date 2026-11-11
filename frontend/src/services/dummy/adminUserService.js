const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const notInDemo = () => new Error('Managing admin accounts needs the real backend (VITE_DATA_PROVIDER=api).');

export async function list() {
  await delay();
  return { items: [], total: 0, totalPages: 0, page: 1 };
}

export async function create() {
  await delay();
  throw notInDemo();
}

export async function update() {
  await delay();
  throw notInDemo();
}

export async function sendReset() {
  await delay();
  throw notInDemo();
}
