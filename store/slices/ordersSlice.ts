import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface OrdersState {
  list: any[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = { list: [], loading: false, error: null };

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
  }
});

export const createOrder = createAsyncThunk('orders/create', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create order');
  }
});

export const updateOrder = createAsyncThunk('orders/update', async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${id}`, payload);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update order');
  }
});

export const deleteOrder = createAsyncThunk('orders/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/orders/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete order');
  }
});

export const assignDriver = createAsyncThunk('orders/assignDriver', async ({ id, driverId }: { id: string; driverId: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/orders/${id}/assign-driver`, { driverId });
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to assign driver');
  }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${id}/status`, { status });
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update status');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrders.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createOrder.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const idx = state.list.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.list = state.list.filter((o) => o._id !== action.payload);
      })
      .addCase(assignDriver.fulfilled, (state, action) => {
        const idx = state.list.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      });
  },
});

export default ordersSlice.reducer;
