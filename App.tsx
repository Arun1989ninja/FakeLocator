import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Button, Dimensions, Text } from 'react-native';
import { useCameraDevice, Camera, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import axios from 'axios';
import RNFS from 'react-native-fs';





export default function App() {
  const { hasPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [qrDetected, setQrDetected] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoomLevel = 0;
  const maxZoomLevel = 5;
  const [distance, setDistance] = useState(0);
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      const qrCode = codes[0]; // Assuming only one QR code is detected
      setQrDetected(true);
      zoomToQRCode(qrCode);
    }
  });




  const zoomToQRCode = async (qrCode) => {
    try {
      const qrHeight = qrCode.frame.height;
      //console.log(qrHeight);

      if (qrHeight == 258) {
        const focus = await camera.current?.focus({ x: 300, y: 300 })
        if (focus) {
          return;
        }
      }
      // Update the zoom level state based on the QR code height
      else if (qrHeight < 260) {
        //console.log(qrHeight)
        // Increase the zoom level for smaller QR codes
        const newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, zoomLevel + .1));
        setZoomLevel(newZoomLevel);
      }


      else if (qrHeight > 300) {
        //console.log(qrHeight)
        // Decrease the zoom level for larger QR codes
        if (qrHeight > 270) {
          const newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, zoomLevel - .1));
          setZoomLevel(newZoomLevel);
        }
      }

      // Check if the zoomed QR code fits the desired size for accurate focus
      if (qrHeight == 258) { // Adjust range as needed
        // Stop the scanner and capture the image
        // You can add your capture logic here

        const focus = await camera.current?.focus({ x: 300, y: 300 })
        if (focus) {
          return;
        }
      }
    } catch (error) {
      console.error('Error while zooming:', error);
    }
  };

  const captureImage = async () => {
    try {
      // Take a photo with the camera

      const photo = await camera.current?.takePhoto();
      const localUri = photo?.path;

      // Read the image file as a base64 string
      const base64Image = await RNFS.readFile(localUri, 'base64');




      // Send the image to the API endpoint
      sendImageToAPI(base64Image);

    } catch (error) {
      console.error('Error while capturing and sending image:', error);
    }
  };




  const sendImageToAPI = async (base64Image) => {
    try {
      fetchData(base64Image)
    }
    catch (error) {
      console.error('Error while sending image to API:', error);
    }
  };

  const fetchData = async (base64Image) => {
    try {
      const imageRequest =
      {
        "Base64Image": base64Image
      }


      const response = await axios.post('http://173.249.34.140:8080/api/scanqrcode', imageRequest);
      console.log('API Response:', response.data);
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Server responded with error data:', error.response.data);
        console.log('Status code:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received:', error.request);
      } else {
        // Something else happened while setting up the request
        console.error('Error:', error.message);
      }
    }
  };




  useEffect(() => {
    if (hasPermission) {
      // Handle any actions when camera permission is granted

    };



  }, [hasPermission]);

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        ref={camera}
        photo={true}
        codeScanner={codeScanner}
        focusable={true}
        enableZoomGesture={true}
        zoom={zoomLevel} // Use zoom level state
        minFocusDistance={3} // Set the minimum focus distance

      />

      {
        <View
          style={[
            styles.squareBox,
            {
              left: 100,
              top: 250,
              width: 200,
              height: 200,
            },
          ]}
        />
      }

      <View style={{ paddingTop: 550, alignSelf: 'center' }}>
        <Button title="Capture Image" onPress={captureImage} />
      </View>
      <Text>Min Focus Distance: {distance} meters</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
    zIndex: 1,
  },
});
