import React, { createContext, useState } from 'react';
import { IAuthUserResults } from '../api/types';

type State = {
    authUser: IAuthUserResults | null;
};

type Action = {
    type: string;
    payload: IAuthUserResults | null;
};

type Dispatch = (action: Action) => void;

const initialState: State = {
    authUser: null,
};

const AuthStateContext = createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined);

type StateContextProviderProps = { children: React.ReactNode };

const stateReducer = (state: State, action: Action) => {
    switch (action.type) {
        case 'SET_USER': {
            return {
                ...state,
                authUser: action.payload,
            };
        }
        default: {
            throw new Error(`Unhandled action type`);
        }
    }
};

const StateContextProvider = ({ children }: StateContextProviderProps) => {
    const [state, dispatch] = React.useReducer(stateReducer, initialState);
    const value = { state, dispatch };

    return (
        <AuthStateContext.Provider value={value}>
            {children}
        </AuthStateContext.Provider>
    );
};

const useStateContext = () => {
    const context = React.useContext(AuthStateContext);

    if (context) {
        return context;
    }

    throw new Error(`useStateContext must be used within a StateContextProvider`);
};

const useCredentials = () => {
    const [token, setToken] = useState<string>('');
    const [accessToken, setAccessToken] = useState<string>('');

    const setCredentials = (token: string, accessToken: string) => {

        console.log('setCredentials', token, accessToken);

        setToken(token);
        setAccessToken(accessToken);
    };

    return { token, setCredentials, accessToken };
}

export { StateContextProvider, useStateContext, useCredentials };
