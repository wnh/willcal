import { legacy_createStore as createStore } from 'redux';
import { eventsReducer } from './reducer';
import { EventsState } from './types';

export const store = createStore(eventsReducer);

export type RootState = EventsState;
export type AppDispatch = typeof store.dispatch;
