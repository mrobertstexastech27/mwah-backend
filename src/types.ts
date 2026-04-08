export interface Order {
  orderId: string;
  customerEmail: string;
  itemSku: string;
  quantity: number;
  amount: number;
  simulateFailure?: boolean;
  simulateTransient?: boolean;
}

export interface OrderResult {
  status: 'completed' | 'failed';
  orderId: string;
  message: string;
}
