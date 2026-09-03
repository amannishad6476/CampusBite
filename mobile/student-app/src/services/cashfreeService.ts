import { NativeModules, Platform } from 'react-native';
import {
  CFPaymentGatewayService,
  CFCallback,
  CFErrorResponse,
} from 'react-native-cashfree-pg-sdk';
import {
  CFSession,
  CFEnvironment,
  CFDropCheckoutPayment,
  CFThemeBuilder,
  CFPaymentComponentBuilder,
  CFPaymentModes,
} from 'cashfree-pg-api-contract';
import { PaymentSessionResponse } from '../types';

export interface CashfreeCheckoutHandlers {
  onVerify: (orderId: string) => void;
  onError: (error: CFErrorResponse | any, orderId: string) => void;
}

/**
 * Checks if the native Cashfree SDK module is available in the current runtime.
 */
export function isCashfreeNativeAvailable(): boolean {
  return Platform.OS !== 'web' && !!NativeModules.CashfreePgApi;
}

/**
 * Initiates the Cashfree Drop Checkout / UPI Intent flow on Android/iOS.
 * Automatically opens the official Cashfree checkout bottom sheet / screen
 * where user can pick Google Pay, PhonePe, Paytm, other UPI apps, or QR code.
 */
export function startCashfreePayment(
  session: PaymentSessionResponse,
  handlers: CashfreeCheckoutHandlers
): boolean {
  if (!isCashfreeNativeAvailable()) {
    console.warn('Native CashfreePgApi module not found. Falling back to alternative flow.');
    return false;
  }

  try {
    // 1. Register transaction result callbacks
    const callback: CFCallback = {
      onVerify: (orderID: string) => {
        console.log('[Cashfree] onVerify triggered for order:', orderID);
        handlers.onVerify(orderID);
      },
      onError: (error: CFErrorResponse, orderID: string) => {
        console.log('[Cashfree] onError triggered:', error, orderID);
        handlers.onError(error, orderID);
      },
    };

    CFPaymentGatewayService.setCallback(callback);

    // 2. Build session
    const env =
      session.environment?.toUpperCase() === 'PRODUCTION'
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX;

    const cfSession = new CFSession(session.payment_session_id, session.order_id, env);

    // 3. Configure CampusBite Brand Theme
    const theme = new CFThemeBuilder()
      .setNavigationBarBackgroundColor('#FF5722')
      .setNavigationBarTextColor('#FFFFFF')
      .setButtonBackgroundColor('#FF5722')
      .setButtonTextColor('#FFFFFF')
      .setPrimaryTextColor('#1E293B')
      .build();

    // 4. Set UPI payment components
    const paymentModes = new CFPaymentComponentBuilder()
      .add(CFPaymentModes.UPI)
      .build();

    // 5. Build Drop Checkout Payment object
    const dropPayment = new CFDropCheckoutPayment(cfSession, paymentModes, theme);

    // 6. Launch Cashfree native checkout
    CFPaymentGatewayService.doPayment(dropPayment);
    return true;
  } catch (error) {
    console.error('[Cashfree] Exception launching payment:', error);
    handlers.onError(error, session.order_id);
    return false;
  }
}

/**
 * Cleanup payment gateway callback listener
 */
export function clearCashfreeCallbacks() {
  try {
    if (isCashfreeNativeAvailable()) {
      CFPaymentGatewayService.removeCallback();
    }
  } catch (err) {
    // Ignore cleanup error
  }
}
