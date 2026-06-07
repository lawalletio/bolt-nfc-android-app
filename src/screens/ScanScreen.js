import React from 'react';

import {Button, StyleSheet} from 'react-native';

import {useCameraDevices} from 'react-native-vision-camera';
import {Camera} from 'react-native-vision-camera';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import {getQueryParam} from '../lib/utils';

export default function ScanScreen({route, navigation}) {
  const [hasPermission, setHasPermission] = React.useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  // mode:'raw' passes the QR value straight through (used for JWT login).
  // mode:'url' (default) extracts the 'c' query param (legacy flow).
  const {backScreen, credentials, mode = 'url'} = route.params || {};

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const onSuccess = data => {
    console.log('scan success');
    if (mode === 'raw') {
      navigation.navigate(backScreen, {
        data: {raw: data},
        timestamp: Date.now(),
      });
    } else {
      const cardNonce = getQueryParam(data, 'c');
      const url = data;
      navigation.navigate(backScreen, {
        data: {otc: cardNonce, url, credentials},
        timestamp: Date.now(),
      });
    }
  };

  const goBack = () => {
    navigation.navigate(backScreen);
  };

  if (barcodes.length > 0) {
    onSuccess(barcodes[0].displayValue);
  }

  return (
    device != null &&
    hasPermission && (
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
        <Button
          onPress={() =>
            mode === 'raw'
              ? onSuccess('eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0ZXN0IiwicHViY2V5IjoiYWJjZCIsInJvbGUiOiJBRE1JTiIsInBlcm1pc3Npb25zIjpbImNhcmRzOndyaXRlIl0sInNjb3BlcyI6WyJjYXJkczp3cml0ZSJdLCJzdWIiOiJ0ZXN0IiwiaXNzIjoibGF3YWxsZXQtbndlIiwiYXVkIjoibGF3YWxsZXQtdXNlcnMiLCJleHAiOjk5OTk5OTk5OTl9.abc')
              : onSuccess(
                  'https://app.lawallet.ar/start?i=987654321&c=12345678',
                )
          }
          title="Test"
        />
        <Button onPress={goBack} title="Close" />
      </>
    )
  );
}
