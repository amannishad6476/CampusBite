import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/apiService';
import {
  startCashfreePayment,
  clearCashfreeCallbacks,
  isCashfreeNativeAvailable,
} from '../../services/cashfreeService';
import {
  saveDefaultDeliveryAddress,
  getDefaultDeliveryAddress,
} from '../../storage/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Campus,
  College,
  Block,
  Hostel,
  OrderCreatePayload,
  DeliveryAddress,
  Order,
  PaymentSessionResponse,
} from '../../types';

type LocationType = 'HOSTEL' | 'BLOCK' | 'OTHER';

export default function CheckoutScreen({ navigation }: any) {
  const { user, selectedCampusId } = useAuth();
  const { cartItems, shopId, shopName, subtotal, deliveryFee, taxFee, grandTotal, clearCart } = useCart();
  const { addNotification } = useNotifications();

  const studentDetails = user?.student || user?.student_details;

  // Campus context
  const [campus, setCampus] = useState<Campus | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // Active delivery location for THIS order
  const [locationType, setLocationType] = useState<LocationType>(
    studentDetails?.is_hosteler ? 'HOSTEL' : 'BLOCK'
  );
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(studentDetails?.hostel_id || null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(studentDetails?.block_id || null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(studentDetails?.college_id || null);
  const [roomNumber, setRoomNumber] = useState<string>(studentDetails?.room_number || '');
  const [floorLevel, setFloorLevel] = useState<string>(studentDetails?.floor_level || '');
  const [otherLocationName, setOtherLocationName] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState<string>('');
  const [phone, setPhone] = useState<string>(user?.phone || '');

  // Address change modal state
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [modalLocationType, setModalLocationType] = useState<LocationType>('HOSTEL');
  const [modalHostelId, setModalHostelId] = useState<number | null>(null);
  const [modalBlockId, setModalBlockId] = useState<number | null>(null);
  const [modalCollegeId, setModalCollegeId] = useState<number | null>(null);
  const [modalRoomNumber, setModalRoomNumber] = useState<string>('');
  const [modalFloorLevel, setModalFloorLevel] = useState<string>('');
  const [modalOtherLocationName, setModalOtherLocationName] = useState<string>('');
  const [modalOtherDetails, setModalOtherDetails] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalSaveAsDefault, setModalSaveAsDefault] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('ONLINE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cashfree Verification & Dynamic QR Modal State
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [paymentSessionData, setPaymentSessionData] = useState<PaymentSessionResponse | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationStatusMsg, setVerificationStatusMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentPendingModal, setPaymentPendingModal] = useState(false);

  // Active order ref for callbacks
  const activeOrderRef = useRef<Order | null>(null);
  activeOrderRef.current = activePaymentOrder;

  // Cleanup payment gateway callbacks on unmount
  useEffect(() => {
    return () => {
      clearCashfreeCallbacks();
    };
  }, []);

  // 1. Load campus hierarchy & check saved default delivery address
  useEffect(() => {
    async function loadData() {
      try {
        const campuses = await apiService.getCampuses();
        const currentCampus = campuses.find((c) => c.id === selectedCampusId) || campuses[0] || null;
        setCampus(currentCampus);

        const targetCampusId = currentCampus ? currentCampus.id : 1;
        const [cols, blks, hsts] = await Promise.all([
          apiService.getColleges(targetCampusId),
          apiService.getBlocks(targetCampusId),
          apiService.getHostels(targetCampusId),
        ]);

        setColleges(cols);
        setBlocks(blks);
        setHostels(hsts);

        // Check if student saved a preferred default delivery address in local storage
        const savedDefault = await getDefaultDeliveryAddress();
        if (savedDefault) {
          if (savedDefault.hostel_name) {
            setLocationType('HOSTEL');
            const foundHostel = hsts.find((h) => h.name.toLowerCase() === savedDefault.hostel_name?.toLowerCase());
            if (foundHostel) setSelectedHostelId(foundHostel.id);
            setRoomNumber(savedDefault.room_number || '');
            setFloorLevel(savedDefault.floor_level || '');
          } else if (savedDefault.block_name) {
            const foundBlock = blks.find((b) => b.name.toLowerCase() === savedDefault.block_name?.toLowerCase());
            if (foundBlock) {
              setLocationType('BLOCK');
              setSelectedBlockId(foundBlock.id);
              if (savedDefault.college_name) {
                const foundCollege = cols.find((c) => c.name.toLowerCase() === savedDefault.college_name?.toLowerCase());
                if (foundCollege) setSelectedCollegeId(foundCollege.id);
              }
              setRoomNumber(savedDefault.room_number || '');
              setFloorLevel(savedDefault.floor_level || '');
            } else {
              // Custom / Other location
              setLocationType('OTHER');
              setOtherLocationName(savedDefault.block_name);
              setOtherDetails(savedDefault.room_number || '');
              setFloorLevel(savedDefault.floor_level || '');
            }
          }
          if (savedDefault.phone) {
            setPhone(savedDefault.phone);
          }
        } else {
          // Defaults from student profile
          if (studentDetails?.is_hosteler && hsts.length > 0) {
            setLocationType('HOSTEL');
            setSelectedHostelId(studentDetails.hostel_id || hsts[0].id);
          } else if (blks.length > 0) {
            setLocationType('BLOCK');
            setSelectedBlockId(studentDetails?.block_id || blks[0].id);
            setSelectedCollegeId(studentDetails?.college_id || (cols.length > 0 ? cols[0].id : null));
          }
        }
      } catch (err) {
        console.warn('Could not load checkout campus hierarchy:', err);
      }
    }
    loadData();
  }, [selectedCampusId]);

  // Open Change Delivery Location Modal
  const openAddressModal = () => {
    setModalLocationType(locationType);
    setModalHostelId(selectedHostelId || (hostels[0]?.id ?? null));
    setModalBlockId(selectedBlockId || (blocks[0]?.id ?? null));
    setModalCollegeId(selectedCollegeId || (colleges[0]?.id ?? null));
    setModalRoomNumber(roomNumber);
    setModalFloorLevel(floorLevel);
    setModalOtherLocationName(otherLocationName);
    setModalOtherDetails(otherDetails);
    setModalPhone(phone || user?.phone || '');
    setModalSaveAsDefault(false);
    setModalError(null);
    setIsAddressModalVisible(true);
  };

  // Apply Changed Delivery Location to THIS Order
  const handleApplyAddress = async () => {
    if (!modalPhone.trim() || modalPhone.trim().length < 10) {
      setModalError('Please enter a valid 10-digit delivery contact number.');
      return;
    }

    if (modalLocationType === 'HOSTEL') {
      if (!modalHostelId) {
        setModalError('Please select a hostel.');
        return;
      }
      if (!modalRoomNumber.trim()) {
        setModalError('Please enter your hostel room number.');
        return;
      }
    } else if (modalLocationType === 'BLOCK') {
      if (!modalBlockId) {
        setModalError('Please select an academic block.');
        return;
      }
      if (!modalRoomNumber.trim()) {
        setModalError('Please enter your room, lab, or class number.');
        return;
      }
    } else if (modalLocationType === 'OTHER') {
      if (!modalOtherLocationName.trim()) {
        setModalError('Please enter the campus location name (e.g. Central Library).');
        return;
      }
      if (!modalOtherDetails.trim()) {
        setModalError('Please enter specific spot details (e.g. Reading Hall Desk 12).');
        return;
      }
    }

    // Apply values to checkout state
    setLocationType(modalLocationType);
    setSelectedHostelId(modalHostelId);
    setSelectedBlockId(modalBlockId);
    setSelectedCollegeId(modalCollegeId);
    setRoomNumber(modalRoomNumber.trim());
    setFloorLevel(modalFloorLevel.trim());
    setOtherLocationName(modalOtherLocationName.trim());
    setOtherDetails(modalOtherDetails.trim());
    setPhone(modalPhone.trim());

    // If user explicitly asked to save as default location, save in local storage only (never mutates backend profile)
    if (modalSaveAsDefault) {
      const selectedHostelObj = hostels.find((h) => h.id === modalHostelId);
      const selectedBlockObj = blocks.find((b) => b.id === modalBlockId);
      const selectedCollegeObj = colleges.find((c) => c.id === modalCollegeId);

      const defaultAddr: DeliveryAddress = {
        campus_name: campus?.name || 'Campus',
        college_name: modalLocationType === 'BLOCK' && selectedCollegeObj ? selectedCollegeObj.name : null,
        block_name: modalLocationType === 'BLOCK' && selectedBlockObj ? selectedBlockObj.name : (modalLocationType === 'OTHER' ? modalOtherLocationName.trim() : null),
        hostel_name: modalLocationType === 'HOSTEL' && selectedHostelObj ? selectedHostelObj.name : null,
        floor_level: modalFloorLevel.trim() || null,
        room_number: (modalLocationType === 'OTHER' ? modalOtherDetails.trim() : modalRoomNumber.trim()) || null,
        phone: modalPhone.trim(),
      };
      await saveDefaultDeliveryAddress(defaultAddr);
    }

    setIsAddressModalVisible(false);
  };

  // Helper to get human-readable location summary for "Deliver To" card
  const getDeliverySummary = () => {
    if (locationType === 'HOSTEL') {
      const h = hostels.find((item) => item.id === selectedHostelId);
      return {
        title: h ? h.name : 'Hostel',
        sub: roomNumber ? `Room ${roomNumber}${floorLevel ? ` • ${floorLevel}` : ''}` : 'Room details pending',
        campus: campus?.name || 'Campus',
        phone: phone,
      };
    } else if (locationType === 'BLOCK') {
      const b = blocks.find((item) => item.id === selectedBlockId);
      const c = colleges.find((item) => item.id === selectedCollegeId);
      return {
        title: b ? b.name : 'Academic Block',
        sub: `${c ? `${c.name} • ` : ''}${roomNumber ? `Room ${roomNumber}` : 'Room 101'}${floorLevel ? ` • ${floorLevel}` : ''}`,
        campus: campus?.name || 'Campus',
        phone: phone,
      };
    } else {
      return {
        title: otherLocationName || 'Campus Location',
        sub: `${otherDetails || 'Ground Floor / Reception'}${floorLevel ? ` • ${floorLevel}` : ''}`,
        campus: campus?.name || 'Campus',
        phone: phone,
      };
    }
  };

  // Build DeliveryAddress payload strictly according to backend DeliveryAddressSchema
  const buildDeliveryAddressPayload = (): DeliveryAddress => {
    const selectedHostel = hostels.find((h) => h.id === selectedHostelId);
    const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);
    const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

    return {
      campus_name: campus?.name || 'Campus',
      college_name: locationType === 'BLOCK' && selectedCollege ? selectedCollege.name : null,
      block_name: locationType === 'BLOCK' && selectedBlock ? selectedBlock.name : (locationType === 'OTHER' ? otherLocationName.trim() : null),
      hostel_name: locationType === 'HOSTEL' && selectedHostel ? selectedHostel.name : null,
      floor_level: floorLevel.trim() || (locationType === 'HOSTEL' ? 'Ground Floor' : '1st Floor'),
      room_number: (locationType === 'OTHER' ? otherDetails.trim() : roomNumber.trim()) || 'Main Reception',
      phone: phone.trim(),
    };
  };

  // Verify Payment Status authoritatively via backend
  const verifyOrderPayment = async (orderId: string, isManualRetry = false) => {
    setVerifyingPayment(true);
    setVerificationStatusMsg('Connecting to payment gateway to verify status...');

    try {
      const verifyRes = await apiService.verifyPayment(orderId);

      if (verifyRes.payment_status === 'PAID') {
        setVerifyingPayment(false);
        setVerificationStatusMsg(null);
        setShowQrModal(false);
        setPaymentPendingModal(false);

        // Fetch refreshed order details
        const updatedOrder = await apiService.getOrderDetails(orderId);

        // Notify student
        await addNotification(
          'Payment Successful! 🎉',
          `Payment for order #${updatedOrder.order_number} verified successfully! Your food is being prepared.`,
          'ORDER',
          updatedOrder.id
        );

        // Clear Cart
        clearCart();

        // Navigate to Order Confirmation
        navigation.replace('OrderConfirmation', {
          order: updatedOrder,
          shopName: shopName || updatedOrder.shop_name,
        });
      } else if (verifyRes.payment_status === 'PENDING') {
        setVerifyingPayment(false);
        setVerificationStatusMsg('Payment is currently pending confirmation from your UPI app.');
        setPaymentPendingModal(true);
      } else {
        // FAILED
        setVerifyingPayment(false);
        setVerificationStatusMsg(null);
        Alert.alert(
          'Payment Unsuccessful',
          verifyRes.message || 'Payment could not be completed. You may retry or pay via Cash on Delivery.',
          [
            { text: 'Retry UPI', onPress: () => handleRetryPayment() },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      setVerifyingPayment(false);
      setVerificationStatusMsg(null);
      Alert.alert(
        'Verification Check',
        err.message || 'Could not verify payment status. Please try checking status again.',
        [
          { text: 'Check Status Again', onPress: () => verifyOrderPayment(orderId, true) },
          { text: 'Dismiss', style: 'cancel' },
        ]
      );
    }
  };

  // Cashfree SDK onVerify & onError callback handlers
  const handleCashfreeVerify = (orderId: string) => {
    console.log('[CheckoutScreen] handleCashfreeVerify called for:', orderId);
    const targetId = orderId || activeOrderRef.current?.id;
    if (targetId) {
      verifyOrderPayment(targetId);
    }
  };

  const handleCashfreeError = (error: any, orderId: string) => {
    console.log('[CheckoutScreen] handleCashfreeError:', error, orderId);
    setSubmitting(false);
    const errMessage = typeof error === 'object' ? error?.message || 'Payment process was interrupted.' : String(error);

    Alert.alert(
      'Payment Interrupted',
      `${errMessage}\n\nWould you like to retry or check dynamic QR code?`,
      [
        { text: 'View QR Code', onPress: () => setShowQrModal(true) },
        { text: 'Retry UPI App', onPress: () => handleRetryPayment() },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  // Retry payment for an active order
  const handleRetryPayment = async () => {
    const order = activePaymentOrder;
    if (!order) return;

    setSubmitting(true);
    try {
      const session = await apiService.createPaymentSession(order.id);
      setPaymentSessionData(session);

      const launched = startCashfreePayment(session, {
        onVerify: handleCashfreeVerify,
        onError: handleCashfreeError,
      });

      if (!launched) {
        // Native SDK not available (e.g. web or dev preview), show Dynamic QR modal
        setShowQrModal(true);
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Unable to reopen payment session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Main Place Order Action
  const handlePlaceOrder = async () => {
    if (!shopId) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit delivery contact number.');
      return;
    }

    if (locationType === 'HOSTEL' && !roomNumber.trim()) {
      setErrorMsg('Please enter your hostel room number.');
      return;
    }
    if (locationType === 'BLOCK' && !roomNumber.trim()) {
      setErrorMsg('Please enter your classroom or lab number.');
      return;
    }
    if (locationType === 'OTHER' && (!otherLocationName.trim() || !otherDetails.trim())) {
      setErrorMsg('Please enter campus location and spot details.');
      return;
    }

    const deliveryAddress = buildDeliveryAddressPayload();

    const payload: OrderCreatePayload = {
      shop_id: shopId,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      items: cartItems.map((item) => ({
        food_item_id: item.food_item.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    };

    setErrorMsg(null);
    setSubmitting(true);

    try {
      // 1. Submit order to backend (payment_status will always be PENDING)
      const createdOrder = await apiService.placeOrder(payload);
      setActivePaymentOrder(createdOrder);

      // If Cash on Delivery (COD)
      if (paymentMethod === 'COD') {
        await addNotification(
          'Order Placed Successfully! 🎉',
          `Your order #${createdOrder.order_number} has been submitted to ${shopName || 'the canteen'}. Pay cash upon delivery!`,
          'ORDER',
          createdOrder.id
        );
        clearCart();
        navigation.replace('OrderConfirmation', {
          order: createdOrder,
          shopName: shopName || createdOrder.shop_name,
        });
        return;
      }

      // If UPI / Online Payment via Cashfree
      // 2. Initialize payment session with Cashfree server-side
      const session = await apiService.createPaymentSession(createdOrder.id);
      setPaymentSessionData(session);

      // 3. Launch native Cashfree Checkout / UPI Intent
      const launched = startCashfreePayment(session, {
        onVerify: handleCashfreeVerify,
        onError: handleCashfreeError,
      });

      if (!launched) {
        // Fallback for non-native environment or if SDK is unavailable
        setShowQrModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deliverySummary = getDeliverySummary();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Checkout Order</Text>
          <Text style={styles.headerSub}>{shopName || 'Campus Canteen'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Section 1: Deliver To (Address Card with Change button) */}
        <View style={styles.card}>
          <View style={styles.deliverToHeader}>
            <View style={styles.deliverToTitleGroup}>
              <Ionicons name="location" size={20} color="#FF5722" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Deliver To</Text>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={openAddressModal}
              activeOpacity={0.7}
            >
              <Text style={styles.changeBtnText}>Change</Text>
              <Ionicons name="create-outline" size={15} color="#FF5722" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressDisplayBox}>
            <View style={styles.addressMainRow}>
              <Ionicons
                name={
                  locationType === 'HOSTEL'
                    ? 'bed'
                    : locationType === 'BLOCK'
                    ? 'business'
                    : 'compass'
                }
                size={20}
                color="#334155"
                style={{ marginTop: 2, marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitleText}>{deliverySummary.title}</Text>
                <Text style={styles.addressSubText}>{deliverySummary.sub}</Text>
                <Text style={styles.addressCampusBadge}>📍 {deliverySummary.campus}</Text>
              </View>
            </View>

            <View style={styles.addressPhoneRow}>
              <Ionicons name="call-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.addressPhoneText}>
                Contact: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{phone || 'Not provided'}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="card" size={20} color="#FF5722" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          {/* UPI Online Option */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('ONLINE')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioDotCircle}>
                {paymentMethod === 'ONLINE' && <View style={styles.radioDotInner} />}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.paymentTitle}>Pay via UPI / QR</Text>
                  <View style={styles.cfBadge}>
                    <Text style={styles.cfBadgeText}>Cashfree</Text>
                  </View>
                </View>
                <Text style={styles.paymentSub}>Google Pay, PhonePe, Paytm, or Dynamic QR</Text>
              </View>
            </View>
            <Ionicons name="qr-code-outline" size={22} color="#FF5722" />
          </TouchableOpacity>

          {/* COD Option */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioDotCircle}>
                {paymentMethod === 'COD' && <View style={styles.radioDotInner} />}
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentSub}>Pay with cash directly to delivery partner</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 3: Order Items Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({cartItems.length} items)</Text>
          {cartItems.map((ci) => (
            <View key={ci.food_item.id} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemName}>
                {ci.quantity}x {ci.food_item.name}
              </Text>
              <Text style={styles.summaryItemPrice}>
                ₹{(Number(ci.food_item.price) * ci.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.billLine}>
            <Text style={styles.billLineLabel}>Subtotal</Text>
            <Text style={styles.billLineVal}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLineLabel}>Delivery Fee</Text>
            <Text style={styles.billLineVal}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLineLabel}>Taxes & Fees</Text>
            <Text style={styles.billLineVal}>₹{taxFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.billLine, { marginTop: 6 }]}>
            <Text style={styles.finalTotalLabel}>Grand Total</Text>
            <Text style={styles.finalTotalVal}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Submit Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barPayLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.barPayVal}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, submitting && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>
                {paymentMethod === 'ONLINE' ? 'Pay & Place Order' : 'Place Order Now'}
              </Text>
              <Ionicons
                name={paymentMethod === 'ONLINE' ? 'shield-checkmark' : 'checkmark-circle'}
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* MODAL 1: CHANGE DELIVERY LOCATION (Deliver To Modal)                     */}
      {/* ========================================================================= */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Location</Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {modalError && (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Location Type Selector Tabs */}
              <Text style={styles.fieldLabel}>Location Type</Text>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, modalLocationType === 'HOSTEL' && styles.tabBtnActive]}
                  onPress={() => setModalLocationType('HOSTEL')}
                >
                  <Ionicons
                    name="bed"
                    size={16}
                    color={modalLocationType === 'HOSTEL' ? '#FFFFFF' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.tabBtnText, modalLocationType === 'HOSTEL' && styles.tabBtnTextActive]}>
                    Hostel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, modalLocationType === 'BLOCK' && styles.tabBtnActive]}
                  onPress={() => setModalLocationType('BLOCK')}
                >
                  <Ionicons
                    name="business"
                    size={16}
                    color={modalLocationType === 'BLOCK' ? '#FFFFFF' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.tabBtnText, modalLocationType === 'BLOCK' && styles.tabBtnTextActive]}>
                    Block
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, modalLocationType === 'OTHER' && styles.tabBtnActive]}
                  onPress={() => setModalLocationType('OTHER')}
                >
                  <Ionicons
                    name="compass"
                    size={16}
                    color={modalLocationType === 'OTHER' ? '#FFFFFF' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.tabBtnText, modalLocationType === 'OTHER' && styles.tabBtnTextActive]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 1. HOSTEL FIELDS */}
              {modalLocationType === 'HOSTEL' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.fieldLabel}>Select Hostel *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                    {hostels.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        style={[styles.modalPill, modalHostelId === h.id && styles.modalPillActive]}
                        onPress={() => setModalHostelId(h.id)}
                      >
                        <Text style={[styles.modalPillText, modalHostelId === h.id && styles.modalPillTextActive]}>
                          {h.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.fieldLabel}>Room Number *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 302"
                        placeholderTextColor="#94A3B8"
                        value={modalRoomNumber}
                        onChangeText={setModalRoomNumber}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.fieldLabel}>Floor / Wing</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 3rd Floor"
                        placeholderTextColor="#94A3B8"
                        value={modalFloorLevel}
                        onChangeText={setModalFloorLevel}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* 2. ACADEMIC BLOCK FIELDS */}
              {modalLocationType === 'BLOCK' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.fieldLabel}>Select Academic Block *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                    {blocks.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.modalPill, modalBlockId === b.id && styles.modalPillActive]}
                        onPress={() => setModalBlockId(b.id)}
                      >
                        <Text style={[styles.modalPillText, modalBlockId === b.id && styles.modalPillTextActive]}>
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {colleges.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.fieldLabel}>Department / College</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                        {colleges.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.modalPill, modalCollegeId === c.id && styles.modalPillActive]}
                            onPress={() => setModalCollegeId(c.id)}
                          >
                            <Text style={[styles.modalPillText, modalCollegeId === c.id && styles.modalPillTextActive]}>
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.fieldLabel}>Room / Lab / Class *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. Room 204"
                        placeholderTextColor="#94A3B8"
                        value={modalRoomNumber}
                        onChangeText={setModalRoomNumber}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.fieldLabel}>Floor / Level</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 2nd Floor"
                        placeholderTextColor="#94A3B8"
                        value={modalFloorLevel}
                        onChangeText={setModalFloorLevel}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* 3. OTHER CAMPUS LOCATION */}
              {modalLocationType === 'OTHER' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.fieldLabel}>Campus Location / Building Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Central Library / Cafeteria Lawn"
                    placeholderTextColor="#94A3B8"
                    value={modalOtherLocationName}
                    onChangeText={setModalOtherLocationName}
                  />

                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.fieldLabel}>Spot / Desk / Landmark *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Reading Hall Desk 12 or Main Gate"
                      placeholderTextColor="#94A3B8"
                      value={modalOtherDetails}
                      onChangeText={setModalOtherDetails}
                    />
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.fieldLabel}>Floor / Level</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Ground Floor"
                      placeholderTextColor="#94A3B8"
                      value={modalFloorLevel}
                      onChangeText={setModalFloorLevel}
                    />
                  </View>
                </View>
              )}

              {/* Delivery Contact Phone */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Delivery Contact Mobile Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="10-digit phone number"
                  placeholderTextColor="#94A3B8"
                  value={modalPhone}
                  onChangeText={setModalPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>

              {/* Save as default checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setModalSaveAsDefault(!modalSaveAsDefault)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={modalSaveAsDefault ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={modalSaveAsDefault ? '#FF5722' : '#94A3B8'}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.checkboxLabel}>Save as default delivery address for future orders</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddressModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyAddress}
              >
                <Text style={styles.modalApplyText}>Apply to This Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DYNAMIC QR CODE & PAYMENT CHECKOUT (Cashfree)                     */}
      {/* ========================================================================= */}
      <Modal
        visible={showQrModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="qr-code" size={20} color="#FF5722" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>UPI Payment (Cashfree)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQrModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContent}>
              <Text style={styles.qrOrderRef}>
                Order #{activePaymentOrder?.order_number || 'CB-ORDER'}
              </Text>
              <Text style={styles.qrAmountText}>₹{grandTotal.toFixed(2)}</Text>

              {/* QR Image or Cashfree Payload */}
              <View style={styles.qrImageBox}>
                {paymentSessionData?.qr_data ? (
                  <Image
                    source={{
                      uri: paymentSessionData.qr_data.startsWith('data:')
                        ? paymentSessionData.qr_data
                        : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                            paymentSessionData.qr_data
                          )}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="shield-checkmark" size={48} color="#FF5722" />
                    <Text style={styles.qrPlaceholderText}>
                      UPI Session Active{'\n'}Complete payment in your UPI app
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.qrInstructions}>
                Scan with Google Pay, PhonePe, Paytm, or BHIM UPI app to pay ₹{grandTotal.toFixed(2)}.
              </Text>

              {/* Payment Verification Status Message */}
              {verificationStatusMsg && (
                <View style={styles.verifyStatusBox}>
                  <ActivityIndicator size="small" color="#FF5722" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyStatusText}>{verificationStatusMsg}</Text>
                </View>
              )}

              {/* Actions */}
              <TouchableOpacity
                style={[styles.verifyPaymentBtn, verifyingPayment && styles.btnDisabled]}
                onPress={() => activePaymentOrder && verifyOrderPayment(activePaymentOrder.id)}
                disabled={verifyingPayment}
                activeOpacity={0.8}
              >
                {verifyingPayment ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.verifyPaymentBtnText}>I Have Paid • Verify Status</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.qrModalAltActions}>
                <TouchableOpacity
                  style={styles.retryPaymentLink}
                  onPress={() => handleRetryPayment()}
                >
                  <Text style={styles.retryPaymentLinkText}>Retry UPI Intent</Text>
                </TouchableOpacity>
                <Text style={{ color: '#CBD5E1' }}>|</Text>
                <TouchableOpacity
                  style={styles.retryPaymentLink}
                  onPress={() => setShowQrModal(false)}
                >
                  <Text style={styles.retryPaymentLinkText}>Pay Later / Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: PAYMENT PENDING VERIFICATION NOTICE                              */}
      {/* ========================================================================= */}
      <Modal
        visible={paymentPendingModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPaymentPendingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalCard}>
            <Ionicons name="time-outline" size={48} color="#F59E0B" style={{ marginBottom: 12 }} />
            <Text style={styles.statusModalTitle}>Payment Pending</Text>
            <Text style={styles.statusModalSub}>
              We are waiting for final confirmation from your bank for order #{activePaymentOrder?.order_number}.
            </Text>

            <TouchableOpacity
              style={styles.statusActionBtn}
              onPress={() => activePaymentOrder && verifyOrderPayment(activePaymentOrder.id, true)}
            >
              <Text style={styles.statusActionBtnText}>Check Status Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusDismissBtn}
              onPress={() => setPaymentPendingModal(false)}
            >
              <Text style={styles.statusDismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  deliverToHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliverToTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5722',
  },
  addressDisplayBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  addressSubText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  addressCampusBadge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  addressPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addressPhoneText: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionSelected: {
    borderColor: '#FF5722',
    backgroundColor: '#FFFBF9',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioDotCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5722',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cfBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  cfBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryItemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billLineLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billLineVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  finalTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  finalTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF5722',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barPayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  barPayVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  placeOrderBtn: {
    backgroundColor: '#FF5722',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#FFAB91',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  modalPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalPillActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  modalPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalPillTextActive: {
    color: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  qrContent: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrOrderRef: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  qrAmountText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF5722',
    marginVertical: 6,
  },
  qrImageBox: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
    padding: 10,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  qrInstructions: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  verifyStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  verifyStatusText: {
    fontSize: 12,
    color: '#C2410C',
    flex: 1,
  },
  verifyPaymentBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifyPaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  qrModalAltActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
  },
  retryPaymentLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryPaymentLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusModalCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  statusActionBtn: {
    backgroundColor: '#FF5722',
    width: '100%',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statusDismissBtn: {
    paddingVertical: 8,
  },
  statusDismissBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
