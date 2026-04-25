import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ordersReducer from './slices/ordersSlice';
import driversReducer from './slices/driversSlice';
import vendorsReducer from './slices/vendorsSlice';
import skusReducer from './slices/skusSlice';
import usersReducer from './slices/usersSlice';
import analyticsReducer from './slices/analyticsSlice';
import trackingReducer from './slices/trackingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    drivers: driversReducer,
    vendors: vendorsReducer,
    skus: skusReducer,
    users: usersReducer,
    analytics: analyticsReducer,
    tracking: trackingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
