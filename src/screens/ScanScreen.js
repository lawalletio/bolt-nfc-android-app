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

  const {backScreen, credentials} = route.params;

  // console.log('Scan Screen backScreen, backRoot', backScreen, backRoot);
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
    const cardNonce = getQueryParam(data, 'c');
    const url = data;
    navigation.navigate(backScreen, {
      data: {otc: cardNonce, url, credentials},
      timestamp: Date.now(),
    });
  };

  const goBack = e => {
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
            onSuccess('https://app.lawallet.ar/start?i=987654321&c=12345678')
          }
          title="Test"
        />
        <Button onPress={goBack} title="Close" />
      </>
    )
  );
}
