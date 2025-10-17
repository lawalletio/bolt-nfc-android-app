/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Card, Title} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useLaWallet} from '../providers/LaWallet';

export default function LoginScreen({route}) {
  const {login, isLogged, isLoading, logout} = useLaWallet();
  // get data from QR
  const {data: qrData, timestamp} = route.params || {};
  // use navigation
  const navigation = useNavigation();

  const handleLogin = () => {
    // login('holaaa');
    (navigation as any).navigate('ScanScreenLogin', {
      backScreen: 'LoginScreen',
    });
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!qrData || !timestamp) {
      return;
    }
    login(qrData.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData, timestamp]);

  return (
    <>
      <ScrollView>
        <Card style={{marginBottom: 20, marginHorizontal: 10}}>
          <Card.Content>
            <Title>Login to LaWallet</Title>
            <Text>{isLogged ? 'Logged in' : 'Not logged in'}</Text>
          </Card.Content>
        </Card>
        <Card style={{marginBottom: 20, marginHorizontal: 10}}>
          <Card.Content>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
              {isLoading ? (
                <Text>Logging in...</Text>
              ) : isLogged ? (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleLogout()}>
                  <Text style={styles.buttonText}>
                    <Ionicons name="log-out" size={20} color="white" /> Logout
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleLogin()}>
                  <Text style={styles.buttonText}>
                    <Ionicons name="log-in" size={20} color="white" /> Login to
                    LaWallet
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgb(0,122,255)',
    padding: 5,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  buttonText: {
    textTransform: 'uppercase',
    color: 'white',
    fontWeight: 'bold',
    flexDirection: 'row',
    fontSize: 15,
  },
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },

  buttonTouchable: {
    padding: 16,
  },
  paragraph: {
    marginBottom: 20,
  },
});
