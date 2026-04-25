import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface VendorsState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: VendorsState = { list: [], loading: false, error: null };

export const fetchVendors = createAsyncThunk('vendors/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/vendors');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch vendors');
  }
});

export const createVendor = createAsyncThunk('vendors/create', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/vendors', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create vendor');
  }
});

export const updateVendor = createAsyncThunk('vendors/update', async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/vendors/${id}`, payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update vendor');
  }
});

export const deleteVendor = createAsyncThunk('vendors/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/vendors/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete vendor');
  }
});

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchVendors.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchVendors.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createVendor.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateVendor.fulfilled, (state, action) => {
        const idx = state.list.findIndex((v) => v._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.list = state.list.filter((v) => v._id !== action.payload);
      });
  },
});

export default vendorsSlice.reducer;
