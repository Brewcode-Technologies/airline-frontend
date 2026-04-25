import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface SKUsState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: SKUsState = { list: [], loading: false, error: null };

export const fetchSKUs = createAsyncThunk('skus/fetchAll', async (vendorId?: string, { rejectWithValue }: any = {}) => {
  try {
    const url = vendorId ? `/skus?vendorId=${vendorId}` : '/skus';
    const { data } = await api.get(url);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch SKUs');
  }
});

export const createSKU = createAsyncThunk('skus/create', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/skus', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create SKU');
  }
});

export const updateSKU = createAsyncThunk('skus/update', async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/skus/${id}`, payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update SKU');
  }
});

export const deleteSKU = createAsyncThunk('skus/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/skus/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete SKU');
  }
});

const skusSlice = createSlice({
  name: 'skus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSKUs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSKUs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchSKUs.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createSKU.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateSKU.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteSKU.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
      });
  },
});

export default skusSlice.reducer;
