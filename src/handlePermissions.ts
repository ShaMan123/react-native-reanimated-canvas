import { PermissionsAndroid, Platform } from 'react-native';

export async function requestPermissions(permissionDialogTitle: string, permissionDialogMessage: string, buttonPositive: string = '') {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
      title: permissionDialogTitle,
      message: permissionDialogMessage,
      buttonPositive
    });

    // On devices before SDK version 23, the permissions are automatically granted if they appear in the manifest,
    // so check and request should always be true.
    // https://github.com/facebook/react-native-website/blob/master/docs/permissionsandroid.md
    const isAuthorized = Platform.Version >= 23 ? granted === PermissionsAndroid.RESULTS.GRANTED : (granted === 'granted' || (typeof granted === 'boolean' && granted));
    return isAuthorized;
  }
  return true;
}