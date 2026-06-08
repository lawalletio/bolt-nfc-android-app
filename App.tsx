import React, {useEffect, useState} from 'react';
import {useLaWallet} from './src/providers/LaWallet';
import {
  Image,
  Modal,
  NativeEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import {LaWalletProvider} from './src/providers/LaWallet';

import {DefaultTheme, Provider as PaperProvider} from 'react-native-paper';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NfcManager from 'react-native-nfc-manager';
import Toast from 'react-native-toast-message';

import LinkCardQRScreen from './src/screens/LinkCardQRScreen';
import CreateBulkBoltcardScreen from './src/screens/CreateBulkBoltcardScreen';
import HelpScreen from './src/screens/HelpScreen';
import ReadNFCScreen from './src/screens/ReadNFCScreen';
import WipeCardScreen from './src/screens/WipeCardScreen';
import ScanScreen from './src/screens/ScanScreen';

import {LogBox} from 'react-native';
import LoginScreen from './src/screens/Login';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();

const theme = {
  ...DefaultTheme,
  dark: false,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: 'tomato',
    accent: '#f1c40f',
  },
};

const Tab = createBottomTabNavigator();
const CreateBoltcardStack = createNativeStackNavigator();
// const AdvancedStack = createNativeStackNavigator();

// function LinkCardQRScreen() {
//   return (
//     <CreateBoltcardStack.Navigator
//       screenOptions={{
//         headerShown: false,
//       }}>
//       <CreateBoltcardStack.Screen
//         name="CreateBoltcardScreen"
//         component={LinkCardQRScreen}
//         initialParams={{data: null}}
//       />
//       <CreateBoltcardStack.Screen name="ScanScreen" component={ScanScreen} />
//     </CreateBoltcardStack.Navigator>
//   );
// }

function LogoTitle(props) {
  return (
    <View style={{flexDirection: 'row'}}>
      <Image
        style={{width: 50, height: 50, marginRight: 10, marginTop: 0}}
        source={{
          uri: 'https://avatars.githubusercontent.com/u/112116892?s=200&v=4',
        }}
      />
      <Text style={{lineHeight: 50, fontSize: 20}}>{props.title}</Text>
    </View>
  );
}

const ErrorModal = props => {
  const {modalVisible, setModalVisible, modalText} = props;
  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="warning" size={30} color="red" />
            <Text style={styles.modalText}>{modalText}</Text>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

NfcManager.start();

export default function App(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState();

  const showModalError = errorText => {
    setModalText(errorText);
    setModalVisible(true);
  };

  useEffect(() => {
    if (Platform.OS == 'android') {
      const eventEmitter = new NativeEventEmitter();
      const eventListener = eventEmitter.addListener('NFCError', event => {
        setModalText(event.message);
        setModalVisible(true);
      });

      return () => {
        eventListener.remove();
      };
    }
  }, []);

  return (
    <PaperProvider theme={theme}>
      <LaWalletProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
        <ErrorModal
          modalText={modalText}
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
        />
        <Toast />
      </LaWalletProvider>
    </PaperProvider>
  );
}

function MainTabs() {
  const {isLogged} = useLaWallet();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          if (route.name === 'Bulk Create') {
            iconName = focused ? 'file-tray-stacked' : 'file-tray-stacked-outline';
          } else if (route.name === 'Login') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Read NFC') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Wipe Card') {
            iconName = focused ? 'trash-bin' : 'trash-bin-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f58340',
        tabBarInactiveTintColor: 'gray',
      })}>
      {/* Always visible */}
      <Tab.Screen name="Read NFC" component={ReadNFCScreen} />

      {/* Only visible when logged in */}
      {isLogged && (
        <Tab.Screen name="Bulk Create" component={CreateBulkBoltcardScreen} />
      )}
      {isLogged && (
        <Tab.Screen name="Wipe Card" component={WipeCardScreen} />
      )}

      {/* Always visible — Login stack with scan sub-screen */}
      <Tab.Screen
        name="Login"
        options={{headerTitle: props => <LogoTitle title="Login" {...props} />}}
        children={() => (
          <CreateBoltcardStack.Navigator screenOptions={{headerShown: false}}>
            <CreateBoltcardStack.Screen
              name="LoginScreen"
              component={LoginScreen}
              initialParams={{data: null}}
            />
            <CreateBoltcardStack.Screen
              name="ScanScreenLogin"
              component={ScanScreen}
            />
          </CreateBoltcardStack.Navigator>
        )}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
  centeredView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
