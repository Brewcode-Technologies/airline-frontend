import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface TrackingState {
  locations: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TrackingState = { locations: [], loading: false, error: null };

export const fetchTracking = createAsyncThunk('tracking/fetch', async (orderId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/tracking/${orderId}`);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch tracking');
  }
});

export const addLocation = createAsyncThunk('tracking/add', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/tracking', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add location');
  }
});

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    clearLocations(state) { state.locations = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTracking.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTracking.fulfilled, (state, action) => { state.loading = false; state.locations = action.payload; })
      .addCase(fetchTracking.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addLocation.fulfilled, (state, action) => { state.locations.push(action.payload); });
  },
});

export const { clearLocations } = trackingSlice.actions;
export default trackingSlice.reducer;
