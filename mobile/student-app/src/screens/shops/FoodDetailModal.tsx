import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '../../types';

interface FoodDetailModalProps {
  visible: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onAddToCart: (item: FoodItem, quantity: number, notes: string) => void;
}

export default function FoodDetailModal({
  visible,
  item,
  onClose,
  onAddToCart,
}: FoodDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, notes.trim());
    setQuantity(1);
    setNotes('');
    onClose();
  };

  const totalPrice = (Number(item.price) * quantity).toFixed(2);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header handle */}
          <View style={styles.dragHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Food Graphic Banner */}
            <View style={styles.imageBanner}>
              <Ionicons
                name={item.is_veg ? 'leaf' : 'flame'}
                size={56}
                color={item.is_veg ? '#10B981' : '#EF4444'}
              />
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Content Details */}
            <View style={styles.content}>
              {/* Veg / Non-Veg Badge */}
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.vegBorder,
                    { borderColor: item.is_veg ? '#10B981' : '#EF4444' },
                  ]}
                >
                  <View
                    style={[
                      styles.vegDot,
                      { backgroundColor: item.is_veg ? '#10B981' : '#EF4444' },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.vegText,
                    { color: item.is_veg ? '#047857' : '#B91C1C' },
                  ]}
                >
                  {item.is_veg ? '100% PURE VEG' : 'NON-VEG'}
                </Text>

                {item.preparation_time && (
                  <View style={styles.prepTimeBadge}>
                    <Ionicons name="timer-outline" size={13} color="#64748B" />
                    <Text style={styles.prepTimeText}>{item.preparation_time} mins prep</Text>
                  </View>
                )}
              </View>

              {/* Title and Price */}
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodPrice}>₹{Number(item.price).toFixed(2)}</Text>

              {/* Description */}
              <Text style={styles.description}>
                {item.description ||
                  'Freshly prepared on campus with quality ingredients. Prepared hot to order.'}
              </Text>

              {/* Special Instructions */}
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Special Cooking Instructions / Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. Less spicy, extra sauce, separate packaging..."
                  placeholderTextColor="#94A3B8"
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={150}
                  multiline
                />
              </View>

              {/* Quantity Selector */}
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Select Quantity</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={16} color="#1E293B" />
                  </TouchableOpacity>
                  <Text style={styles.stepperVal}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color="#1E293B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.addCartBtn} onPress={handleAdd}>
              <View style={styles.addCartTextCol}>
                <Text style={styles.addCartTitle}>Add to Cart</Text>
                <Text style={styles.addCartItems}>
                  {quantity} {quantity > 1 ? 'items' : 'item'}
                </Text>
              </View>
              <Text style={styles.addCartPrice}>₹{totalPrice}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  imageBanner: {
    height: 140,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vegBorder: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vegText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  prepTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prepTimeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 3,
  },
  foodName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF5722',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    height: 60,
    textAlignVertical: 'top',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperVal: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addCartBtn: {
    backgroundColor: '#FF5722',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addCartTextCol: {
    justifyContent: 'center',
  },
  addCartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addCartItems: {
    fontSize: 11,
    color: '#FFE0B2',
  },
  addCartPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
