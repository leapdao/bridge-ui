const store = (key: string, obj: any) => {
  localStorage.setItem(key, JSON.stringify(obj));
}

const load = (key: string) => {
  return JSON.parse(localStorage.getItem(key) || '{}');
}

export default { 
  store, 
  load,
};