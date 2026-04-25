import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface UsersState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = { list: [], loading: false, error: null };

export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
  }
});

export const createUser = createAsyncThunk('users/create', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create user');
  }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/users/${id}`, payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update user');
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/users/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete user');
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createUser.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id !== action.payload);
      });
  },
});

export default usersSlice.reducer;
