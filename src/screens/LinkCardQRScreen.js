/* eslint-disable no-alert */
import {useNavigation} from '@react-navigation/core';
import React, {useCallback, useEffect} from 'react';
import {Button, ScrollView, StyleSheet, Text} from 'react-native';
import Dialog from 'react-native-dialog';
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';
import {ActivityIndicator, Card, Title} from 'react-native-paper';
import {getQueryParam, createAsociateCardEvent} from '../lib/utils';
import {getEventHash, getPublicKey, getSignature} from 'nostr-tools';
import Config from 'react-native-config';

const LinkStatus = {
  IDLE: 'idle',
  TAPPING: 'tapping',
  SCANNING: 'scanning',
  ASSOCIATING: 'associating',
};

const ADMIN_URL = Config.ADMIN_URL;
const CARD_MODULE_PUBLIC_KEY = Config.CARD_MODULE_PUBLIC_KEY;
const NOSTR_PRIVATE_KEY = Config.NOSTR_PRIVATE_KEY;

export default function LinkCardQRScreen({route}) {
  // status
  const [linkStatus, setLinkStatus] = React.useState(LinkStatus.IDLE);
  // get data from QR
  const {data, timestamp} = route.params || {};

  // use navigation
  const navigation = useNavigation();

  // On exit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Do something when the screen blurs
      setLinkStatus(LinkStatus.IDLE);
    });

    return unsubscribe;
  }, [navigation]);

  // Return QR Data
  useEffect(() => {
    if (!data || !timestamp) {
      return;
    }
    startAsociation();
  }, [data, timestamp]);

  const onReadCard = useCallback(url => {
    console.info('url');
    console.info(JSON.stringify(url));
    if (!url) {
      alert('This card has not been initialized.');
      setLinkStatus(LinkStatus.IDLE);
      return;
    }

    setLinkStatus(LinkStatus.SCANNING);
    navigation.navigate('ScanScreen', {
      backScreen: 'Link QR Main',
      credentials: {
        p: getQueryParam(url, 'p'),
        c: getQueryParam(url, 'c'),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTapping = useCallback(async () => {
    setLinkStatus(LinkStatus.TAPPING);
    await NfcManager.start();
    await NfcManager.cancelTechnologyRequest();
    await NfcManager.clearBackgroundTag();

    try {
      console.info('START tap reading...');
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const ndefMessage = await NfcManager.ndefHandler.getNdefMessage();
      const url = Ndef.uri
        .decodePayload(ndefMessage.ndefMessage[0].payload)
        .toString();
      onReadCard(url);
    } catch (e) {
      setLinkStatus(LinkStatus.IDLE);
      alert(e);
      console.info(JSON.stringify(e.reason));
      console.info(JSON.stringify(e.message));
      console.error(e);
    }
  }, [onReadCard]);

  const startAsociation = async () => {
    const {otc, credentials} = data;
    setLinkStatus(LinkStatus.ASSOCIATING);
    console.info('$$$$ startAsociation $$$$');
    console.info(`otc: ${otc}`);
    console.info(`linkStatus : ${linkStatus}`);
    console.info(`cardCredencials : ${JSON.stringify(credentials)}`);
    const {p, c} = credentials;
    const url = `${ADMIN_URL}/ntag424?p=${p}&c=${c}`;
    console.info(`url : ${url}`);

    const event = createAsociateCardEvent(otc, CARD_MODULE_PUBLIC_KEY);

    event.pubkey = getPublicKey(NOSTR_PRIVATE_KEY);
    event.id = getEventHash(event);
    event.sig = getSignature(event, NOSTR_PRIVATE_KEY);

    console.info('##### EVENT ######');
    console.info(JSON.stringify(event));
    fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Error from server' + response.status);
        }
        startTapping();
      })
      .catch(_error => {
        alert(_error.message);
        setLinkStatus(LinkStatus.IDLE);
        console.error(_error);
        // setError(_error.message);
      });
    // alert(`cardId : ${cardId} \n cardNonce : ${cardNonce}`);
  };

  return (
    <ScrollView>
      <>
        {linkStatus === LinkStatus.IDLE && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Tap Card</Title>
              <Text>First tap card</Text>
            </Card.Content>
            <Card.Actions style={styles.spaceAround}>
              <Button
                onPress={() => {
                  startTapping();
                }}
                title="Tap card"
              />
            </Card.Actions>
          </Card>
        )}

        <Dialog.Container visible={linkStatus === LinkStatus.TAPPING}>
          <Dialog.Title style={styles.textBlack}>TAP next card</Dialog.Title>
          <Text style={styles.activity}>
            <ActivityIndicator size="large" />
          </Text>
          <Dialog.Button
            label="Cancel"
            onPress={() => {
              setLinkStatus(LinkStatus.IDLE);
            }}
          />
        </Dialog.Container>

        <Dialog.Container visible={linkStatus === LinkStatus.SCANNING}>
          <Dialog.Title style={styles.textBlack}>
            Procesando Imagen
          </Dialog.Title>
          <Text style={styles.activity}>
            <ActivityIndicator size="large" />
          </Text>
        </Dialog.Container>

        <Dialog.Container visible={linkStatus === LinkStatus.ASSOCIATING}>
          <Dialog.Title style={styles.textBlack}>
            Association Card...
          </Dialog.Title>
          <Text style={styles.activity}>
            <ActivityIndicator size="large" />
          </Text>
          {data && (
            <Card.Content>
              <Text>OTC: {data.otc}</Text>
              <Text>c: {data.credentials.c}</Text>
              <Text>p: {data.credentials.p}</Text>
            </Card.Content>
          )}
        </Dialog.Container>
      </>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  card: {
    margin: 20,
  },
  textBlack: {
    color: '#000',
  },

  spaceAround: {
    justifyContent: 'space-around',
  },

  activity: {
    textAlign: 'center',
    padding: 20,
  },
});
