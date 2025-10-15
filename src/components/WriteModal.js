import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';
import Dialog from 'react-native-dialog';

import Ionicons from 'react-native-vector-icons/Ionicons';
import NfcManager, {Ndef} from 'react-native-nfc-manager';
import Ntag424 from '../class/Ntag424';

/**
 *
 * @param onClose: function
 * @param visible: boolean
 */

export default function WriteModal(props) {
  const {cardData} = props;

  // Changed
  const [key0Changed, setKey0Changed] = useState(false);
  const [key1Changed, setKey1Changed] = useState(false);
  const [key2Changed, setKey2Changed] = useState(false);
  const [key3Changed, setKey3Changed] = useState(false);
  const [key4Changed, setKey4Changed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Test
  const [testBolt, setTestBolt] = useState();
  const [error, setError] = useState();

  // Reset
  const reset = useCallback(() => {
    console.info('reset!');
    setKey0Changed(false);
    setKey1Changed(false);
    setKey2Changed(false);
    setKey3Changed(false);
    setKey4Changed(false);
    setTestBolt();
  }, []);

  // Write card
  const write = useCallback(async () => {
    console.info('write');
    const {lnurlw_base, k0, k1, k2, k3, k4, privateUID} = cardData;

    try {
      // register for the NFC tag with NDEF in it
      console.info('Starting...');

      console.info("NFCManager: we're ready to write!");

      //set ndef
      const ndefMessage =
        lnurlw_base +
        (lnurlw_base.includes('?') ? '&' : '?') +
        'p=00000000000000000000000000000000&c=0000000000000000';

      const message = [Ndef.uriRecord(ndefMessage)];
      const bytes = Ndef.encodeMessage(message);

      console.info('Waitin!');
      await Ntag424.setNdefMessage(bytes);
      //   setNdefWritten('success');

      const key0 = '00000000000000000000000000000000';
      // //auth first
      await Ntag424.AuthEv2First('00', key0);

      if (privateUID) {
        await Ntag424.setPrivateUid();
      }
      // 9 is the offset of the "lnurlw://" length
      const piccOffset = ndefMessage.indexOf('p=') + 9;
      const macOffset = ndefMessage.indexOf('c=') + 9;

      //change file settings
      await Ntag424.setBoltCardFileSettings(piccOffset, macOffset);

      //get uid
      const uid = await Ntag424.getCardUid();
      console.log('************* UID *************', uid);

      //change keys
      console.log('changekey 1');
      await Ntag424.changeKey('01', key0, k1, '01');
      setKey1Changed(true);
      console.log('changekey 2');
      await Ntag424.changeKey('02', key0, k2, '01');
      setKey2Changed(true);
      console.log('changekey 3');
      await Ntag424.changeKey('03', key0, k3, '01');
      setKey3Changed(true);
      console.log('changekey 4');
      await Ntag424.changeKey('04', key0, k4, '01');
      setKey4Changed(true);
      console.log('changekey 0');
      await Ntag424.changeKey('00', key0, k0, '01');
      setKey0Changed(true);

      //set offset for ndef header
      const ndef = await Ntag424.readData('060000');
      const setNdefMessage = Ndef.uri.decodePayload(ndef);

      //we have the latest read from the card fire it off to the server.
      const httpsLNURL = setNdefMessage.replace('lnurlw://', 'https://');
      fetch(httpsLNURL)
        .then(response => response.json())
        .then(json => {
          setTestBolt('success');
        })
        .catch(error => {
          setTestBolt('Error: ' + error.message);
        });

      await Ntag424.AuthEv2First('00', k0);

      const params = {};
      setNdefMessage.replace(
        /[?&]+([^=&]+)=([^&]*)/gi,
        function (m, key, value) {
          params[key] = value;
        },
      );
      if (!('p' in params)) {
        console.info('no p value to test');
        return;
      }
      if (!('c' in params)) {
        console.info('no c value to test');
        return;
      }

      console.info('^^^^^^^^^ PARAMS ^^^^^^^^^^');
      console.info(JSON.stringify(params));

      const pVal = params.p;
      const cVal = params.c.slice(0, 16);

      const testResult = await Ntag424.testPAndC(pVal, cVal, uid, k1, k2);

      console.info(testResult.pTest ? 'ok' : 'decrypt with key failed');
      console.info(testResult.cTest ? 'ok' : 'decrypt with key failed');

      if (!testResult.pTest || !testResult.cTest) {
        console.error('Error on tests of decrypt');
      }
      props.onSuccess && props.onSuccess();
    } catch (ex) {
      console.error('Oops!', ex);
      setError(ex);
      var _error = ex;
      if (typeof ex === 'object') {
        _error =
          'NFC Error: ' + (ex.message ? ex.message : ex.constructor.name);
      }
      setError(_error);
      console.info('setTagTypeError: ' + error);
    } finally {
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();

      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardData, props]);

  // On cardData change
  useEffect(() => {
    setError();
    if (!cardData) {
      return;
    }
    reset();
    setIsLoading(true);
    write();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardData]);

  return (
    <Dialog.Container visible={props.visible}>
      <Dialog.Title>
        <Ionicons name="card" size={30} color="green" />
        <Text style={styles.text}> Hold NFC card</Text>
      </Dialog.Title>

      {isLoading && (
        <Text style={styles.activity}>
          <ActivityIndicator size="large" />
        </Text>
      )}

      {cardData && (
        <View>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <Text>k1: {key1Changed ? 'Written' : cardData.k1}</Text>
              <Text>k2: {key2Changed ? 'Written' : cardData.k2}</Text>
              <Text>k3: {key3Changed ? 'Written' : cardData.k3}</Text>
              <Text>k4: {key4Changed ? 'Written' : cardData.k4}</Text>
              <Text>k0: {key0Changed ? 'Written' : cardData.k0}</Text>
            </>
          )}
        </View>
      )}

      <Dialog.Button label="Close" onPress={props.onCancel} />
    </Dialog.Container>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    textAlign: 'center',
    borderColor: 'black',
  },
  error: {
    fontSize: 20,
    textAlign: 'center',
    borderColor: 'red',
  },
  activity: {
    textAlign: 'center',
    padding: 20,
  },
});
