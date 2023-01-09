import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';

export default function LoginDialog({connected, onSubmit}) {
    const [visible, setVisible] = useState(false);
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const refPasswordInput = useRef();

    return (
        <View>
            <Button onPress={showDialog} mode="contained">
                Log in
            </Button>
            <Portal>
                <Dialog
                    visible={visible}
                    onDismiss={hideDialog}
                    style={{ width: 350, alignSelf: 'center' }}
                >
                    <Dialog.Title>Enter account credentials</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            style={{ marginTop: 15 }}
                            mode={'outlined'}
                            label={'Username'}
                            value={username}
                            onChangeText={(text) => setUsername(text)}
                            returnKeyType={'next'}
                            onSubmitEditing={() => refPasswordInput.current.focus()}
                            blurOnSubmit={false}
                            autoCapitalize={'none'}
                        />
                        <TextInput
                            ref={refPasswordInput}
                            style={{ marginTop: 15 }}
                            mode={'outlined'}
                            label={'Password'}
                            value={password}
                            onChangeText={(text) => setPassword(text)}
                            onSubmitEditing={onSubmit}
                            secureTextEntry={true}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button 
                            onPress={hideDialog}
                        >Cancel</Button>
                        <Button 
                            onPress={() => {
                                hideDialog();
                                onSubmit(username, password);
                            }}>Confirm</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}
