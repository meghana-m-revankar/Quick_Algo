import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import companySlice from "./company/slice/companySlice";
import authSlice from "./auth/slice/authSlice";
import { encryptTransform } from "redux-persist-transform-encrypt";

const encryptor = encryptTransform({
  secretKey: "my-super-secret-key", // Replace with your own secret key
  onError: function (error) {
    // Handle the error
  },
});

const persistConfig = {
  key: "root",
  storage,
  transforms: [encryptor],
};

const reducerArr = combineReducers({
  // Auth Slice
  companyDetails: companySlice,
 
  userDetails: authSlice,
});

const persistedReducer = persistReducer(persistConfig, reducerArr);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action paths in the serializability check
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        // Ignore these field paths in the state
        ignoredPaths: ["register"],
      },
    }),
});

// export const store = configureStore({
//   reducer: persistedReducer,
// });

export const persistor = persistStore(store);
// export const persistor = store;
