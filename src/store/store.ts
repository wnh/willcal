import { legacy_createStore as createStore } from 'redux';
import { blocksReducer } from './reducer';
import { BlocksState } from './types';

export const store = createStore(blocksReducer);

export type RootState = BlocksState;
export type AppDispatch = typeof store.dispatch;
