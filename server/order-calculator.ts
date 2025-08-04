import { storage } from './storage';

export interface OrderCalculation {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon?: {
    id: number;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    applyToShipping: boolean;
    applyToTax: boolean;
    description?: string;
  };
  settings: {
    taxRate: number;
    shippingCost: number;
    freeShippingThreshold: number;
  };
  freeShippingEligible: boolean;
  remainingForFreeShipping: number;
}

export interface CartItem {
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    salePrice?: string;
  };
}

export class OrderCalculator {
  private async getSystemSettings() {
    const settings = await storage.getSystemSettings();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        type: setting.type
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      taxRate: settingsMap.tax_rate ? parseFloat(settingsMap.tax_rate.value) / 100 : 0.05,
      shippingCost: settingsMap.shipping_cost ? parseFloat(settingsMap.shipping_cost.value) : 120,
      freeShippingThreshold: settingsMap.free_shipping_threshold ? parseFloat(settingsMap.free_shipping_threshold.value) : 5000
    };
  }

  async calculateOrder(cartItems: CartItem[], couponCode?: string): Promise<OrderCalculation> {
    const settings = await this.getSystemSettings();
    
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.product.salePrice ? parseFloat(item.product.salePrice) : parseFloat(item.product.price);
      return sum + (price * item.quantity);
    }, 0);

    // Check for free shipping
    const freeShippingEligible = subtotal >= settings.freeShippingThreshold;
    const remainingForFreeShipping = freeShippingEligible ? 0 : settings.freeShippingThreshold - subtotal;

    let coupon = null;
    let discount = 0;
    let finalShipping = freeShippingEligible ? 0 : settings.shippingCost;
    let finalTax = subtotal * settings.taxRate;

    // Apply coupon if provided
    if (couponCode) {
      coupon = await storage.getCouponByCode(couponCode);
      if (coupon && coupon.isActive) {
        // Validate coupon
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          throw new Error('Coupon has expired');
        }
        if (coupon.minimumAmount && subtotal < parseFloat(coupon.minimumAmount)) {
          throw new Error(`Minimum order amount is PKR ${coupon.minimumAmount}`);
        }

        // Calculate discount
        if (coupon.discountType === 'percentage') {
          const percentage = parseFloat(coupon.discountValue) / 100;
          discount = subtotal * percentage;
        } else {
          // Fixed discount
          discount = Math.min(parseFloat(coupon.discountValue), subtotal);
        }

        // Apply coupon to shipping if enabled
        if (coupon.applyToShipping && !freeShippingEligible) {
          if (coupon.discountType === 'percentage') {
            const shippingDiscount = finalShipping * (parseFloat(coupon.discountValue) / 100);
            finalShipping = Math.max(0, finalShipping - shippingDiscount);
          } else {
            // For fixed discounts on shipping, apply remaining discount value
            const remainingDiscount = parseFloat(coupon.discountValue) - discount;
            if (remainingDiscount > 0) {
              finalShipping = Math.max(0, finalShipping - remainingDiscount);
            }
          }
        }

        // Apply coupon to tax if enabled
        if (coupon.applyToTax) {
          if (coupon.discountType === 'percentage') {
            const taxDiscount = finalTax * (parseFloat(coupon.discountValue) / 100);
            finalTax = Math.max(0, finalTax - taxDiscount);
          } else {
            // For fixed discounts on tax, apply remaining discount value
            const remainingDiscount = parseFloat(coupon.discountValue) - discount;
            if (remainingDiscount > 0) {
              finalTax = Math.max(0, finalTax - remainingDiscount);
            }
          }
        }
      } else {
        throw new Error('Invalid or inactive coupon code');
      }
    }

    const total = subtotal - discount + finalShipping + finalTax;

    return {
      subtotal,
      discount,
      shipping: finalShipping,
      tax: finalTax,
      total,
      coupon: coupon ? {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType as 'percentage' | 'fixed',
        discountValue: discount.toString(),
        applyToShipping: coupon.applyToShipping || false,
        applyToTax: coupon.applyToTax || false,
        description: coupon.description
      } : undefined,
      settings,
      freeShippingEligible,
      remainingForFreeShipping
    };
  }

  async processOrder(userId: number, cartItems: CartItem[], orderData: any, couponCode?: string) {
    const calculation = await this.calculateOrder(cartItems, couponCode);
    
    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const orderRecord = await storage.createOrder({
      userId,
      orderNumber,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: orderData.paymentMethod,
      subtotalAmount: calculation.subtotal.toString(),
      discountAmount: calculation.discount.toString(),
      shippingAmount: calculation.shipping.toString(),
      taxAmount: calculation.tax.toString(),
      totalAmount: calculation.total.toString(),
      couponCode: couponCode || null,
      shippingAddress: JSON.stringify(orderData.shippingAddress),
      notes: orderData.notes,
      paymentProof: orderData.paymentProof || null
    });

    // Create order items
    for (const item of cartItems) {
      await storage.createOrderItem({
        orderId: orderRecord.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.salePrice || item.product.price,
        total: (parseFloat(item.product.salePrice || item.product.price) * item.quantity).toString()
      });
    }

    // Update coupon usage if applied
    if (calculation.coupon) {
      const coupon = await storage.getCoupon(calculation.coupon.id);
      if (coupon) {
        // Update usage count
        await storage.updateCoupon(calculation.coupon.id, {
          usedCount: (coupon.usedCount || 0) + 1
        });

        // For fixed amount coupons, reduce the remaining value
        if (coupon.discountType === 'fixed') {
          const newValue = Math.max(0, parseFloat(coupon.discountValue) - calculation.discount);
          await storage.updateCoupon(calculation.coupon.id, {
            discountValue: newValue.toString(),
            isActive: newValue > 0
          });
        }
      }
    }

    // Clear user's cart
    await storage.clearCart(userId);

    return { order: orderRecord, calculation };
  }
}

export const orderCalculator = new OrderCalculator();