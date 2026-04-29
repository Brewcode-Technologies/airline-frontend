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

export const fetchApprovedSKUs = createAsyncThunk('skus/fetchApproved', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/skus/approved');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch approved SKUs');
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

export const updateSKUStock = createAsyncThunk('skus/updateStock', async ({ id, stock }: { id: string; stock: number }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/skus/${id}`, { stock });
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update stock');
  }
});

export const uploadSKUImage = createAsyncThunk('skus/uploadImage', async ({ id, file }: { id: string; file: File }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post(`/skus/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to upload image');
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
  reducers: {
    // Optimistic local stock update — instant UI feedback
    adjustStockLocally(state, action: { payload: { id: string; delta: number } }) {
      const sku = state.list.find((s) => s._id === action.payload.id);
      if (sku) sku.stock = Math.max(0, (sku.stock ?? 0) + action.payload.delta);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSKUs.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSKUs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchSKUs.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchApprovedSKUs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(createSKU.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateSKU.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateSKUStock.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], stock: action.payload.stock };
      })
      .addCase(uploadSKUImage.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) {
          // replace full object + add cache-bust timestamp so <img> re-renders
          state.list[idx] = {
            ...action.payload,
            _cacheBust: Date.now(),
          };
        }
      })
      .addCase(deleteSKU.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
      });
  },
});

export const { adjustStockLocally } = skusSlice.actions;
export default skusSlice.reducer;
