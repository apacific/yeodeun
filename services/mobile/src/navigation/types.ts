export type BuilderStep =
  | 'entree'
  | 'vegetable'
  | 'fruit'
  | 'side'
  | 'sauce'
  | 'topping'
  | 'beverage'
  | 'review';

export type RootStackParamList = {
  Home: undefined;
  OrderMenu: undefined;
  ALaCarte: { category?: string } | undefined;
  Builder: { startStep?: BuilderStep } | undefined;
  Cart: undefined;
  Checkout: { from?: 'cart' | 'orderMenu' } | undefined;
  About: undefined;
  AllMenuItems: undefined;
  Gallery: { focusIndex?: number } | undefined;
  Language: undefined;
  Contact:
    | {
        prefill?: {
          message?: string;
          email?: string;
          phone?: string;
        };
      }
    | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: {
    navigate: (...args: any[]) => void;
    goBack: () => void;
    setParams?: (params: Partial<NonNullable<RootStackParamList[T]>>) => void;
  };
  route: {
    key: string;
    name: T;
    params: RootStackParamList[T];
  };
};
