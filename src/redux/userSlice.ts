import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Role {
  id: number;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  provider?: string | null;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  role?: Role | null;
}

const initialState: UserState = {
  id: null,
  username: null,
  email: null,
  name: null,
  phone: null,
  provider: null,
  confirmed: false,
  blocked: false,
  createdAt: null,
  updatedAt: null,
  role: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      return { ...state, ...action.payload };
    },
    clearUser() {
      return { ...initialState };
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
