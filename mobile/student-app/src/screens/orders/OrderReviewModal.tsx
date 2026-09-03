import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderReview } from '../../types';
import { getStoredReviews, saveOrderReview } from '../../storage/auth';

interface OrderReviewModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function OrderReviewModal({
  visible,
  order,
  onClose,
  onSubmitted,
}: OrderReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    async function checkReview() {
      if (!order) return;
      const reviews = await getStoredReviews();
      const existing = reviews.find((r) => r.order_id === order.id);
      if (existing) {
        setRating(existing.rating_shop);
        setReviewText(existing.review_text_shop || '');
        setAlreadyReviewed(true);
      } else {
        setRating(5);
        setReviewText('');
        setAlreadyReviewed(false);
      }
    }
    checkReview();
  }, [order, visible]);

  if (!order) return null;

  const handleSubmit = async () => {
    const review: OrderReview = {
      order_id: order.id,
      shop_id: order.shop_id,
      rating_shop: rating,
      review_text_shop: reviewText.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    await saveOrderReview(review);
    Alert.alert('Review Submitted ⭐', 'Thank you for rating your campus dining experience!');
    onSubmitted();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.starCircle}>
            <Ionicons name="star" size={32} color="#FF5722" />
          </View>

          <Text style={styles.modalTitle}>Rate Your Canteen Order</Text>
          <Text style={styles.modalSub}>
            How was the food from{' '}
            <Text style={{ fontWeight: '700', color: '#1E293B' }}>
              {order.shop_name || 'Campus Canteen'}
            </Text>
            ?
          </Text>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => !alreadyReviewed && setRating(star)}
                style={styles.starBtn}
                disabled={alreadyReviewed}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color="#FFC107"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback input */}
          <TextInput
            style={styles.feedbackInput}
            placeholder="Share feedback on taste, packing, and speed..."
            placeholderTextColor="#94A3B8"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={3}
            editable={!alreadyReviewed}
          />

          {alreadyReviewed ? (
            <View style={styles.reviewedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.reviewedText}>Review already submitted for this order</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Rating</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  starCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF2EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  starBtn: {
    paddingHorizontal: 4,
  },
  feedbackInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  submitBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
});
