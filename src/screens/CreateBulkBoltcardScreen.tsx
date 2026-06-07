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

import {useLaWallet, AuthError} from '../providers/LaWallet';
import {Ntag424WriteData} from '../types/response';
import {Skin} from '../types/skin';

const CardStatus = {
  IDLE: 'idle',
  READING: 'reading',
  CREATING_CARD: 'creating_card',
  WRITING: 'writing',
};

export default function CreateBulkBoltcardScreen() {
  const [cardData, setCardData] = useState<Ntag424WriteData | undefined>();

  const [cardStatus, setCardStatus] = useState(CardStatus.IDLE);

  const [openSkin, setOpenSkin] = useState(false);
  const [skin, setSkin] = useState<Skin | undefined>();
  const [error, setError] = useState<string>();

  const navigation = useNavigation();
  const {isLogged, skins, authFetch, baseUrl} = useLaWallet();

  const requestCreateCard = useCallback(
    async (_cardUID: string, _skin: Skin) => {
      setCardStatus(CardStatus.CREATING_CARD);
      setError(undefined);

      ToastAndroid.showWithGravity(
        'Creating card…',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );

      try {
        // 1. Create the card on the backend (auth-gated: cards:write scope).
        const createRes = await authFetch('/api/cards', {
          method: 'POST',
          body: JSON.stringify({
            id: _cardUID,
            designId: _skin.value,
            kind: 'SIMPLE',
          }),
        });

        if (!createRes.ok) {
          const msg = await createRes.text().catch(() => '');
          alert(`Server error ${createRes.status}: ${msg}`);
          setCardStatus(CardStatus.IDLE);
          return;
        }

        const createdCard = await createRes.json();
        const cardId: string = createdCard.id;

        // 2. Fetch the canonical write payload (public endpoint — no auth needed).
        //    It includes the lnurlw_base and keys already assembled by the server.
        let writeData: Ntag424WriteData;
        try {
          const writeRes = await fetch(`${baseUrl}/api/cards/${cardId}/write`);
          if (writeRes.ok) {
            writeData = await writeRes.json();
          } else {
            throw new Error(`write endpoint returned ${writeRes.status}`);
          }
        } catch (writeErr) {
          // Fallback: build the payload from the POST response keys.
          console.warn('CreateBulk: write endpoint failed, using POST keys', writeErr);
          const ntag = createdCard.ntag424;
          const host = (() => {
            try {
              return new URL(baseUrl).host;
            } catch {
              return baseUrl.replace(/^https?:\/\//, '').split('/')[0];
            }
          })();
          writeData = {
            card_name: createdCard.title || 'New Card',
            id: ntag.cid,
            k0: ntag.k0,
            k1: ntag.k1,
            k2: ntag.k2,
            k3: ntag.k3,
            k4: ntag.k4,
            lnurlw_base: `lnurlw://${host}/api/cards/${cardId}/scan`,
            protocol_name: 'new_bolt_card_response',
            protocol_version: '1',
          };
        }

        setCardData(writeData);
        setCardStatus(CardStatus.WRITING);
      } catch (err) {
        if (err instanceof AuthError && err.kind === 'expired') {
          ToastAndroid.showWithGravity(
            'Session expired — re-login on the Login tab',
            ToastAndroid.LONG,
            ToastAndroid.TOP,
          );
        } else {
          const msg =
            err instanceof Error ? err.message : JSON.stringify(err);
          setError(msg);
          alert(msg);
        }
        setCardStatus(CardStatus.IDLE);
      }
    },
    [authFetch, baseUrl],
  );

  const onReadCard = useCallback(
    (event: any) => {
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
        requestCreateCard(_cardUID, skin!);
      } catch (e: any) {
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
      onReadCard(tag);
    } catch (e: any) {
      setCardStatus(CardStatus.IDLE);
      alert(e?.message);
      console.error(e?.message);
    }
  }, [onReadCard]);

  // On exit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setCardStatus(CardStatus.IDLE);
      NfcManager.cancelTechnologyRequest();
    });
    return unsubscribe;
  }, [navigation]);

  // React to cardStatus changes
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
          <Text>Not logged in — go to the Login tab to authenticate.</Text>
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
        cardData={cardData}
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
