import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface AnalyticsState {
  summary: any;
  ordersByStatus: any[];
  orders: any;
  sla: any;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  ordersByStatus: [],
  orders: null,
  sla: null,
  loading: false,
  error: null,
};

export const fetchSummary = createAsyncThunk('analytics/summary', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/summary');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const fetchOrdersByStatus = createAsyncThunk('analytics/ordersByStatus', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/orders-by-status');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const fetchOrdersAnalytics = createAsyncThunk('analytics/orders', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/orders');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const fetchSLA = createAsyncThunk('analytics/sla', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/sla');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSummary.fulfilled, (state, action) => { state.loading = false; state.summary = action.payload; })
      .addCase(fetchSummary.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchOrdersByStatus.fulfilled, (state, action) => { state.ordersByStatus = action.payload; })
      .addCase(fetchOrdersAnalytics.fulfilled, (state, action) => { state.orders = action.payload; })
      .addCase(fetchSLA.fulfilled, (state, action) => { state.sla = action.payload; });
  },
});

export default analyticsSlice.reducer;
