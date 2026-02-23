declare module 'react-native-netinfo' {
  export interface NetInfoState {
    isConnected: boolean;
  }
  
  const NetInfo: {
    addEventListener(callback: (state: NetInfoState) => void): void;
  };
  
  export default NetInfo;
}