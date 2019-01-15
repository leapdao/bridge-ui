interface Enumerable {
  [index: number]: any;
  __length__?: number;
};

export const toArray = (obj: Enumerable): Array<any> => {
  const result = [];
  
  if (!obj.__length__) return result;
  
  for (let i = 0; i < obj.__length__; i++) {
    result.push(obj[i]);
  }

  return result;
};
