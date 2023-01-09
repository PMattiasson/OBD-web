import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import DataText from '../components/DataText';
import Charts from '../components/Charts';
import LoginDialog from '../components/LoginDialog';
import responsePIDs from '../constants/PID-database';
import objectMap from '../utils/objectMap';
import DropDownPicker from 'react-native-dropdown-picker';

let wsCurrent = null;

export default function Home() {
    const [data, setData] = useState({});
    const [url, setUrl] = useState(process.env.URL);
    const [connected, setConnected] = useState(false);
    let ws = useRef(null);

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('vehicleSpeed');
    const [items, setItems] = useState([
        { label: 'Vehicle speed', value: 'vehicleSpeed' },
        { label: 'Engine RPM', value: 'engineRPM' },
        { label: 'Coolant temperature', value: 'coolantTemperature' },
        { label: 'Throttle position', value: 'throttlePosition' },
    ]);

    async function authorize(username, password) {
        return fetch(`${url}login`, {
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
            .catch((error) => {
                console.log(error);
                return false;
            });
    }

    async function connect(username, password) {
        try {
            const authResult = await authorize(username, password);
            if (authResult === false) {
                console.log('Failed to authorize to server');
                return;
            }
            console.log('Authorized to server');
            ws.current = new WebSocket(url.replace('http', 'ws'));

            ws.current.onopen = () => {
                setConnected(true);
                console.log('ws opened');
            };

            ws.current.onclose = () => {
                console.log('ws closed');
                if (!connected) {
                    console.log('Could not connect');
                }
                setConnected(false);
            };

            ws.current.onmessage = async (e) => {
                const message = JSON.parse(await e.data.text());
                const objs = objectMap(message, (v, k) => {
                    const pid = responsePIDs.find((obj) => obj.name === k);
                    if (pid) {
                        return { value: v, description: pid.description, unit: pid.unit };
                    }
                });
                setData(objs);
            };

            ws.onerror = (event) => {
                // an error occurred
                console.log(event.message);
            };

            wsCurrent = ws.current;
        } catch (error) {
            console.log(error);
        }
    }

    function disconnect() {
        wsCurrent?.close();
        fetch(`${url}logout`, { method: 'DELETE' });
    }

    function handleLogin(username, password) {
        connect(username, password);
    }

    return (
        <View style={styles.base}>
            <View style={styles.title}>
                <Text variant="headlineLarge" style={{ margin: 10 }}>
                    The OBD Website
                </Text>
                {connected ? (
                    <Button onPress={disconnect} mode="contained">
                        Log out
                    </Button>
                ) : (
                    <LoginDialog onSubmit={handleLogin} />
                )}
            </View>

            <View style={styles.center}>
                {Object.keys(data).length > 0 ? (
                    <View style={styles.column}>
                        {Object.entries(data).map(([key, val]) => {
                            {
                                return (
                                    <DataText
                                        description={val?.description}
                                        value={val?.value}
                                        unit={val?.unit}
                                        key={key}
                                    />
                                );
                            }
                        })}
                    </View>
                ) : (
                    <ActivityIndicator animating={true} />
                )}
            </View>
            <View style={styles.row}>
                <DropDownPicker
                    containerStyle={{ width: 200, position: 'absolute', left: 500 }}
                    open={open}
                    value={value}
                    items={items}
                    setOpen={setOpen}
                    setValue={setValue}
                    setItems={setItems}
                />

                <Charts pidName={value} url={url} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    column: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'column',
        width: 350,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 100,
    },
    center: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    title: {
        alignItems: 'center',
        paddingTop: 20,
    },
});
