export interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
}

export const getSession = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('pp_user') || 'null');
  } catch {
    return null;
  }
};

export const setSession = (u: User): void => {
  localStorage.setItem('pp_user', JSON.stringify(u));
};

export const clearSession = (): void => {
  localStorage.removeItem('pp_user');
};
