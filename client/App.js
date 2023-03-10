// https://reactnative.dev/docs/network
import { Provider as PaperProvider } from 'react-native-paper';
import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import Home from './screens/Home';

export const theme = {
    ...DefaultTheme,
    roundness: 2,
    version: 3,
    colors: {
        ...DefaultTheme.colors,
        primary: '#3498db',
        secondary: '#f1c40f',
        tertiary: '#a1b2c3',
    },
};

export default function App() {
    return (
        <PaperProvider theme={theme}>
            <Home />
        </PaperProvider>
    );
}
