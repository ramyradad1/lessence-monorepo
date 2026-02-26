import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_provider.dart';
import 'cart_provider.dart';
import 'profile_provider.dart';

enum PaymentMethodType { cod, paymob }

final checkoutControllerProvider =
    NotifierProvider<CheckoutController, CheckoutState>(CheckoutController.new);

class CheckoutState {
  const CheckoutState({
    this.selectedAddressId,
    this.couponCode,
    this.discountAmount = 0.0,
    this.discountType,
    this.isGift = false,
    this.giftWrap = false,
    this.giftMessage = '',
    this.paymentMethod = PaymentMethodType.paymob,
    this.isLoading = false,
    this.errorMessage,
  });

  final String? selectedAddressId;
  final String? couponCode;
  final double discountAmount;
  final String? discountType;
  final bool isGift;
  final bool giftWrap;
  final String giftMessage;
  final PaymentMethodType paymentMethod;
  final bool isLoading;
  final String? errorMessage;

  CheckoutState copyWith({
    String? selectedAddressId,
    String? couponCode,
    double? discountAmount,
    String? discountType,
    bool? isGift,
    bool? giftWrap,
    String? giftMessage,
    bool? isLoading,
    String? errorMessage,
    PaymentMethodType? paymentMethod,
    bool clearError = false,
    bool clearCoupon = false,
  }) {
    return CheckoutState(
      selectedAddressId: selectedAddressId ?? this.selectedAddressId,
      couponCode: clearCoupon ? null : (couponCode ?? this.couponCode),
      discountAmount: clearCoupon ? 0.0 : (discountAmount ?? this.discountAmount),
      discountType: clearCoupon ? null : (discountType ?? this.discountType),
      isGift: isGift ?? this.isGift,
      giftWrap: giftWrap ?? this.giftWrap,
      giftMessage: giftMessage ?? this.giftMessage,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class CheckoutController extends Notifier<CheckoutState> {
  SupabaseClient get _supabase => ref.read(supabaseClientProvider);

  @override
  CheckoutState build() {
    // Automatically select default address if available
    final profileState = ref.watch(profileControllerProvider);
    String? defaultAddressId;
    if (profileState.addresses.isNotEmpty) {
      final defaultAddr = profileState.addresses.where((a) => a.isDefault).firstOrNull ?? profileState.addresses.first;
      defaultAddressId = defaultAddr.id;
    }
    return CheckoutState(selectedAddressId: defaultAddressId);
  }

  void setAddress(String addressId) {
    state = state.copyWith(selectedAddressId: addressId, clearError: true);
  }

  void setGiftOptions({required bool isGift, required bool giftWrap, required String giftMessage}) {
    state = state.copyWith(
      isGift: isGift,
      giftWrap: isGift ? giftWrap : false,
      giftMessage: isGift ? giftMessage : '',
      clearError: true,
    );
  }

  void clearCoupon() {
    state = state.copyWith(clearCoupon: true, clearError: true);
  }

  Future<bool> applyCoupon(String code) async {
    if (code.trim().isEmpty) {
      clearCoupon();
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final cartState = ref.read(cartControllerProvider);
      if (cartState.items.isEmpty) {
        throw Exception('Cart is empty');
      }

      final itemsPayload = cartState.items.map((item) => {
        'product_id': item.productId,
        'variant_id': item.variantId,
        'quantity': item.quantity,
      }).toList();

      final res = await _supabase.functions.invoke('apply_coupon', body: {
        'couponCode': code,
        'cartItems': itemsPayload,
      });

      final data = res.data;
      if (data == null || data['success'] != true) {
        throw Exception(data?['error'] ?? 'Invalid coupon');
      }

      state = state.copyWith(
        isLoading: false,
        couponCode: code,
        discountAmount: (data['discountAmount'] as num?)?.toDouble() ?? 0.0,
        discountType: data['discountType'] as String?,
        clearError: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        clearCoupon: true,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  void setPaymentMethod(PaymentMethodType method) {
    state = state.copyWith(paymentMethod: method, clearError: true);
  }

  Future<Map<String, dynamic>?> placeOrder() async {
    final addressId = state.selectedAddressId;
    if (addressId == null) {
      state = state.copyWith(errorMessage: 'Please select a shipping address');
      return null;
    }

    final cartState = ref.read(cartControllerProvider);
    if (cartState.items.isEmpty) {
      state = state.copyWith(errorMessage: 'Cart is empty');
      return null;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final itemsPayload = cartState.items.map((item) => {
        'id': item.productId,
        'product_id': item.productId,
        'variant_id': item.variantId,
        'quantity': item.quantity,
        'selectedSize': item.selectedSize,
        'selected_size': item.selectedSize,
        'price': item.unitPrice,
      }).toList();

      final profileState = ref.read(profileControllerProvider);
      final address = profileState.addresses.firstWhere((a) => a.id == addressId);

      final addressPayload = {
        'fullName': address.fullName,
        'line1': address.addressLine1,
        'line2': address.addressLine2,
        'city': address.city,
        'state': address.state,
        'postal_code': address.postalCode,
        'country': address.country,
        'phone': address.phone,
        'email': _supabase.auth.currentUser?.email ?? 'customer@example.com',
      };

      final endpoint = 'create_order';

      // Generate a simple idempotency key in dart
      final idempotencyKey = '${DateTime.now().millisecondsSinceEpoch}_${1000 + DateTime.now().microsecond}';

      // 1. Call create-order edge function
      final createRes = await _supabase.functions.invoke(endpoint, body: {
        'items': itemsPayload,
        'address': addressPayload,
        'coupon_code': state.couponCode,
        'idempotency_key': idempotencyKey,
        'is_gift': state.isGift,
        'gift_wrap': state.giftWrap,
        'gift_message': state.giftMessage,
      });

      final createData = createRes.data;
      if (createData == null || (createData['success'] != true && createData['clientSecret'] == null)) {
        throw Exception(createData?['error'] ?? 'Failed to create order');
      }

      if (state.paymentMethod == PaymentMethodType.paymob) {
        // Return paymob secrets so UI can launch unified checkout
        state = state.copyWith(isLoading: false, clearError: true);
        return {
          'isPaymob': true,
          'clientSecret': createData['clientSecret'],
          'publicKey': createData['publicKey'],
        };
      } else {
        final orderId = createData['orderId'] as String;

        // 2. Clear cart since order is created successfully
        await ref.read(cartControllerProvider.notifier).clearCart();

        state = state.copyWith(isLoading: false, clearError: true);
        return {
          'isPaymob': false,
          'orderId': orderId,
        };
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return null;
    }
  }
}
