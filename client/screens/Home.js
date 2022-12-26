import { useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import DataText from '../components/DataText';
import Charts from '../components/Charts';

let wsCurrent = null;

export default function Home() {
    const [data, setData] = useState({});
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [connected, setConnected] = useState(false);
    let ws = useRef(null);

    async function authorize() {
        const httpURL = url;

        return fetch(`${httpURL}login`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        })
            .then((response) => response.text())
            .then((responseData) => {
                console.log(responseData);
                const data = JSON.parse(responseData);
                if (data.result === 'OK') return true;
                else return false;
            })
            .catch((error) => console.log(error));
    }

    async function connect() {
        try {
            const authResult = await authorize();
            if (authResult == false) {
                console.log('Failed to authorize to server');
                return;
            }
            console.log('Authorized to server');

            const wsURL = url.replace('http', 'ws');
            ws.current = new WebSocket(wsURL);

            ws.current.onopen = () => {
                setConnected(true);
                console.log('ws opened');
            };

            ws.current.onclose = () => {
                console.log('ws closed');
                if (connected) {
                    setConnected(false);
                } else {
                    console.log('Could not connect');
                }
            };

            ws.current.onmessage = async (e) => {
                const message = JSON.parse(await e.data.text());
                console.log(message);
                setData(message);
            };

            wsCurrent = ws.current;
        } catch (e) {
            console.log(e);
        }
    }

    function disconnect() {
        const httpURL = `http://${url}/`;
        wsCurrent?.close();
        fetch(`${httpURL}logout`, { method: 'DELETE' });
    }

    const handleConnect = async () => {
        if (connected) {
            disconnect();
        } else {
            await connect();
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineLarge" style={{ margin: 10 }}>
                Example of the OBD website with API fetch
            </Text>

            <TextInput
                label={'URL'}
                value={url}
                onChangeText={(text) => setUrl(text)}
                mode={'outlined'}
            />
            <TextInput
                label={'Username'}
                value={username}
                onChangeText={(text) => setUsername(text)}
                mode={'outlined'}
            />
            <TextInput
                label={'Password'}
                value={password}
                onChangeText={(text) => setPassword(text)}
                mode={'outlined'}
                secureTextEntry={true}
            />
            <Button
                style={{ margin: 10, marginBottom: 50 }}
                mode="contained"
                onPress={handleConnect}
            >
                {connected ? 'Disconnect' : 'Connect'}
            </Button>

            {Object.keys(data).length > 0 ? (
                <View style={styles.column}>
                    {Object.entries(data).map(([key, val]) => {
                        {
                            return <DataText description={key} value={val} unit={''} key={key} />;
                        }
                    })}
                </View>
            ) : (
                <ActivityIndicator animating={true} />
            )}
            <Charts />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    column: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'column',
        width: 250,
    },
});
