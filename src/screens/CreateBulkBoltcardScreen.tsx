/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  Image,
} from 'react-native';
import {Card, Title} from 'react-native-paper';

import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import WriteModal from '../components/WriteModal';

import {useLaWallet} from '../providers/LaWallet';
import {InitializeCardResponse} from '../types/response';
import {Skin} from '../types/skin';

const CardStatus = {
  IDLE: 'idle',
  READING: 'reading',
  CREATING_CARD: 'creating_card',
  WRITING: 'writing',
};

export default function CreateBulkBoltcardScreen() {
  const [cardData, setCardData] = useState<InitializeCardResponse>();

  const [cardStatus, setCardStatus] = useState(CardStatus.IDLE);

  const [openSkin, setOpenSkin] = useState(false);
  const [skin, setSkin] = useState<Skin | undefined>();
  const [error, setError] = useState<string>();

  const navigation = useNavigation();
  const {isLogged, skins, lnurlwBase, apiEndpoint} = useLaWallet();

  const requestCreateCard = useCallback(
    async (_cardUID, _skin) => {
      setCardStatus(CardStatus.CREATING_CARD);
      // Make request to create card

      const url = `${apiEndpoint}`;
      // console.info('url', url);
      // create request
      ToastAndroid.showWithGravity(
        `Creating card : ${url}`,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );

      const body = {
        designId: _skin.value,
        cardUID: _cardUID,
      };

      // console.info('skin', _skin);
      // console.info('cardUID', _cardUID);

      // console.info('event');
      // console.info(JSON.stringify(event));
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
        .then(response => {
          // console.info('response', JSON.stringify(response));

          if (!response.ok) {
            throw new Error(`Server returned error ${response.status}`);
          }
          return response.json();
        })
        .then(json => {
          const data = JSON.parse(json.content) as InitializeCardResponse;
          if (!(data.k0 && data.k1 && data.k2 && data.k3 && data.k4)) {
            setCardStatus(CardStatus.IDLE);
            alert('The JSON response must contain k0, k1, k2, k3, k4');
            return;
          }
          setCardStatus(CardStatus.WRITING);
          setCardData(data);
        })
        .catch(_error => {
          setError(JSON.stringify(_error));
          alert(_error.message);
          setCardStatus(CardStatus.IDLE);
          console.error(_error);
        });
    },
    [apiEndpoint, setCardStatus, setCardData, setError],
  );

  const onReadCard = useCallback(
    event => {
      const _cardUID = event.id?.toLowerCase();
      console.log(
        event.key0Changed,
        event.key1Changed,
        event.key2Changed,
        event.key3Changed,
        event.key4Changed,
      );

      if (event.key0Changed) {
        ToastAndroid.showWithGravity(
          'The card is already setup',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
        return;
      }

      try {
        requestCreateCard(_cardUID, skin);
      } catch (e) {
        alert(e.reason);
        setCardStatus(CardStatus.IDLE);
      }
    },
    [requestCreateCard, skin],
  );

  const startReading = useCallback(async () => {
    await NfcManager.start();
    await NfcManager.cancelTechnologyRequest();
    await NfcManager.clearBackgroundTag();
    try {
      console.info('START reading...');
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      const tag = await NfcManager.getTag();

      // console.info('tag:');
      onReadCard(tag);
    } catch (e) {
      setCardStatus(CardStatus.IDLE);
      alert(e?.message);
      console.error(e?.message);
    }
  }, [onReadCard]);

  // On exit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Do something when the screen blurs
      setCardStatus(CardStatus.IDLE);
      NfcManager.cancelTechnologyRequest();
    });

    return unsubscribe;
  }, [navigation]);

  // Add Listeners
  useEffect(() => {
    switch (cardStatus) {
      case CardStatus.READING:
        setError(undefined);
        setCardData(undefined);
        startReading();
        break;

      default:
        setCardData(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStatus]);

  // On mount
  useEffect(() => {
    // NfcManager.start();
    // console.info('getPublicKey');
    // console.info(getPublicKey);
    // const pubkey = getPublicKey(NOSTR_PRIVATE_KEY);
    // console.info('pubkey');
    // console.info(pubkey);
  }, []);

  if (!isLogged) {
    return (
      <Card
        style={{
          marginBottom: 20,
          marginTop: 10,
          marginHorizontal: 10,
          zIndex: 1000,
        }}>
        <Card.Content>
          <Text>Not logged in</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <ScrollView style={{}}>
      {cardStatus === CardStatus.READING ? (
        <Text
          style={{
            margin: 20,
            fontWeight: 'bold',
            fontSize: 15,
            textAlign: 'center',
          }}>
          <ActivityIndicator />
          <Text>Hold NFC card to Reader</Text>
        </Text>
      ) : (
        <>
          {skin && cardStatus === CardStatus.IDLE && (
            <Card style={{marginHorizontal: 10}}>
              <Button
                onPress={() => setCardStatus(CardStatus.READING)}
                title="Start reading"
              />
            </Card>
          )}
        </>
      )}

      <Card
        style={{
          marginBottom: 20,
          marginTop: 10,
          marginHorizontal: 10,
          zIndex: 1000,
        }}>
        <Card.Content>
          {cardStatus === CardStatus.IDLE && (
            <>
              <Title>Card skin</Title>
              <Dropdown
                style={[styles.dropdown, openSkin && {borderColor: 'blue'}]}
                data={skins}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!openSkin ? 'Select item' : '...'}
                searchPlaceholder="Search..."
                value={skin ? skin.value : null}
                onFocus={() => setOpenSkin(true)}
                onBlur={() => setOpenSkin(false)}
                onChange={item => {
                  console.info('******** ITEM ********');
                  console.info(JSON.stringify(item));
                  setSkin(item);
                  setOpenSkin(false);
                }}
              />
            </>
          )}

          {skin && (
            <Image
              style={styles.cardImage}
              source={
                typeof skin.file === 'string' ? {uri: skin.file} : skin.file
              }
            />
          )}
        </Card.Content>
      </Card>

      {(cardStatus === CardStatus.READING || skin) && (
        <Card style={styles.card}>
          <Card.Content>
            <Button
              onPress={() => {
                setCardStatus(CardStatus.IDLE);
                setSkin(undefined);
              }}
              title="Cancelar"
            />
          </Card.Content>
        </Card>
      )}

      {error && (
        <Card
          style={{
            marginBottom: 20,
            marginTop: 10,
            marginHorizontal: 10,
            zIndex: 1000,
          }}>
          <Card.Content>
            <>
              <Title>error</Title>
              <Text>{error}</Text>
            </>
          </Card.Content>
        </Card>
      )}

      <WriteModal
        visible={cardStatus === CardStatus.WRITING}
        onCancel={() => setCardStatus(CardStatus.IDLE)}
        onSuccess={() => setCardStatus(CardStatus.READING)}
        cardData={{...cardData, lnurlw_base: lnurlwBase}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    marginHorizontal: 10,
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    borderColor: 'black',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
  },
});
