import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface DriversState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DriversState = { list: [], loading: false, error: null };

export const fetchDrivers = createAsyncThunk('drivers/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/drivers');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch drivers');
  }
});

export const createDriver = createAsyncThunk('drivers/create', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/drivers', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create driver');
  }
});

export const updateDriver = createAsyncThunk('drivers/update', async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/drivers/${id}`, payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update driver');
  }
});

export const updateDriverStatus = createAsyncThunk('drivers/updateStatus', async ({ id, isAvailable }: { id: string; isAvailable: boolean }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/drivers/${id}/status`, { isAvailable });
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update status');
  }
});

export const deleteDriver = createAsyncThunk('drivers/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/drivers/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete driver');
  }
});

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDrivers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchDrivers.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createDriver.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateDriver.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateDriverStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      })
      .addCase(deleteDriver.fulfilled, (state, action) => {
        state.list = state.list.filter((d) => d._id !== action.payload);
      });
  },
});

export default driversSlice.reducer;
