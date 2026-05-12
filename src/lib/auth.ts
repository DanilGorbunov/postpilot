export interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
}

export const getSession = (): User | null => {
  try {
    const u = JSON.parse(localStorage.getItem('pp_user') || 'null');
    if (!u || !u._id || !u.email) return null;
    return u;
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
